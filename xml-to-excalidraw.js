#!/usr/bin/env node

/**
 * XML to Excalidraw Library Converter
 * Converts a directory of draw.io XML stencils to Excalidraw library format
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { XmlToSvgConverter } from './xml-to-svg.js';

const parseXml = promisify(parseString);

class XmlToExcalidrawConverter {
	constructor() {
		this.converter = new XmlToSvgConverter();
	}

	/**
	 * Convert all XML files in a directory to an Excalidraw library
	 */
	async convertDirectory(inputDir, outputFile) {
		const libraryItems = [];
		const files = this.getXmlFiles(inputDir);

		console.log(`Found ${files.length} XML files in ${inputDir}`);

		for (const file of files) {
			try {
				console.log(`Processing ${basename(file)}...`);
				const items = await this.convertXmlFile(file);
				libraryItems.push(...items);
				console.log(`  Added ${items.length} shape(s)`);
			} catch (error) {
				console.error(`  Error processing ${basename(file)}:`, error.message);
			}
		}

		// Create Excalidraw library format
		const library = {
			type: 'excalidrawlib',
			version: 2,
			source: 'drawio-converter',
			libraryItems: libraryItems.map((item, index) => ({
				id: `drawio_${index}`,
				status: 'unpublished',
				created: Date.now(),
				name: item.name,
				elements: item.elements
			}))
		};

		// Write library file
		writeFileSync(outputFile, JSON.stringify(library, null, 2));
		console.log(`\nCreated Excalidraw library: ${outputFile}`);
		console.log(`Total items: ${libraryItems.length}`);

		return library;
	}

	/**
	 * Convert a single XML file to Excalidraw library items
	 */
	async convertXmlFile(filePath) {
		const xmlContent = readFileSync(filePath, 'utf-8');
		const result = await parseXml(xmlContent);

		// Get shapes
		let shapes = result.shapes?.shape || result.shape || [];
		if (!Array.isArray(shapes)) {
			shapes = [shapes];
		}

		const items = [];

		for (const shape of shapes) {
			try {
				const item = await this.convertShape(shape);
				if (item) {
					items.push(item);
				}
			} catch (error) {
				console.error(`    Error converting shape:`, error.message);
			}
		}

		return items;
	}

	/**
	 * Convert a single shape to Excalidraw elements
	 */
	async convertShape(shapeNode) {
		// Convert shape to SVG
		const shapeData = await this.converter.convertShape(shapeNode);

		// Convert SVG to Excalidraw using our direct conversion
		return this.createElementFromSVG(shapeData);
	}

	/**
	 * Create Excalidraw element from SVG data
	 */
	createElementFromSVG(shapeData) {
		// Extract path data from SVG
		const pathMatch = shapeData.svg.match(/<path[^>]*d="([^"]+)"[^>]*\/>/);

		if (!pathMatch) {
			console.error(`    No path data found, skipping shape`);
			return null;
		}

		const pathData = pathMatch[1];
		const points = this.parsePathToPoints(pathData);

		if (points.length === 0) {
			return null;
		}

		// Extract colors from SVG
		const fillMatch = shapeData.svg.match(/fill="([^"]+)"/);
		const strokeMatch = shapeData.svg.match(/stroke="([^"]+)"/);
		const strokeWidthMatch = shapeData.svg.match(/stroke-width="([^"]+)"/);

		const fill = fillMatch ? fillMatch[1] : 'transparent';
		const stroke = strokeMatch ? strokeMatch[1] : '#000000';
		const strokeWidth = strokeWidthMatch ? parseFloat(strokeWidthMatch[1]) : 1;

		// Calculate bounds
		const xs = points.map(p => p[0]);
		const ys = points.map(p => p[1]);
		const minX = Math.min(...xs);
		const minY = Math.min(...ys);
		const maxX = Math.max(...xs);
		const maxY = Math.max(...ys);

		// Create freedraw element
		const element = {
			type: 'freedraw',
			version: 1,
			versionNonce: Math.floor(Math.random() * 1000000000),
			isDeleted: false,
			id: this.generateId(),
			fillStyle: fill === 'none' || fill === 'transparent' ? 'solid' : 'solid',
			strokeWidth: strokeWidth,
			strokeStyle: 'solid',
			roughness: 0,
			opacity: 100,
			angle: 0,
			x: minX,
			y: minY,
			strokeColor: stroke,
			backgroundColor: fill === 'none' || fill === 'transparent' ? 'transparent' : fill,
			width: maxX - minX,
			height: maxY - minY,
			seed: Math.floor(Math.random() * 1000000000),
			groupIds: [],
			frameId: null,
			roundness: null,
			boundElements: [],
			updated: Date.now(),
			link: null,
			locked: false,
			// Normalize points relative to top-left corner
			points: points.map(p => [p[0] - minX, p[1] - minY]),
			pressures: points.map(() => 0.5),
			simulatePressure: true
		};

		return {
			name: shapeData.name,
			elements: [element]
		};
	}

	/**
	 * Parse SVG path data to points (simplified)
	 */
	parsePathToPoints(pathData) {
		const points = [];
		const commands = pathData.match(/[MLCQAZmlcqaz][^MLCQAZmlcqaz]*/g) || [];

		let currentX = 0;
		let currentY = 0;

		for (const cmd of commands) {
			const type = cmd[0];
			const coords = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(n => !isNaN(n));

			switch (type.toUpperCase()) {
				case 'M':
					if (coords.length >= 2) {
						currentX = type === 'M' ? coords[0] : currentX + coords[0];
						currentY = type === 'M' ? coords[1] : currentY + coords[1];
						points.push([currentX, currentY]);
					}
					break;

				case 'L':
					if (coords.length >= 2) {
						currentX = type === 'L' ? coords[0] : currentX + coords[0];
						currentY = type === 'L' ? coords[1] : currentY + coords[1];
						points.push([currentX, currentY]);
					}
					break;

				case 'C':
					// For curves, just add the end point
					if (coords.length >= 6) {
						currentX = type === 'C' ? coords[4] : currentX + coords[4];
						currentY = type === 'C' ? coords[5] : currentY + coords[5];
						points.push([currentX, currentY]);
					}
					break;

				case 'Q':
					// For quadratic curves, just add the end point
					if (coords.length >= 4) {
						currentX = type === 'Q' ? coords[2] : currentX + coords[2];
						currentY = type === 'Q' ? coords[3] : currentY + coords[3];
						points.push([currentX, currentY]);
					}
					break;

				case 'A':
					// For arcs, just add the end point
					if (coords.length >= 7) {
						currentX = type === 'A' ? coords[5] : currentX + coords[5];
						currentY = type === 'A' ? coords[6] : currentY + coords[6];
						points.push([currentX, currentY]);
					}
					break;

				case 'Z':
					// Close path - connect to first point
					if (points.length > 0) {
						points.push([...points[0]]);
					}
					break;
			}
		}

		return points;
	}

	/**
	 * Generate a random ID for Excalidraw elements
	 */
	generateId() {
		return Math.random().toString(36).substring(2, 15) +
		       Math.random().toString(36).substring(2, 15);
	}

	/**
	 * Get all XML files from a directory recursively
	 */
	getXmlFiles(dir) {
		const files = [];

		const items = readdirSync(dir);
		for (const item of items) {
			const fullPath = join(dir, item);
			const stat = statSync(fullPath);

			if (stat.isDirectory()) {
				// Recursively search subdirectories
				files.push(...this.getXmlFiles(fullPath));
			} else if (stat.isFile() && item.endsWith('.xml')) {
				files.push(fullPath);
			}
		}

		return files;
	}
}

/**
 * Main CLI function
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length < 2) {
		console.log('Usage: node xml-to-excalidraw.js <input-directory> <output.excalidrawlib>');
		console.log('  Converts all XML stencils in a directory to Excalidraw library format');
		console.log('  Searches recursively for all .xml files');
		console.log('\nExample:');
		console.log('  node xml-to-excalidraw.js ./drawio/src/main/webapp/stencils ./output/drawio-library.excalidrawlib');
		process.exit(1);
	}

	const inputDir = args[0];
	const outputFile = args[1];

	try {
		const converter = new XmlToExcalidrawConverter();
		await converter.convertDirectory(inputDir, outputFile);
	} catch (error) {
		console.error('Error:', error.message);
		console.error(error.stack);
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { XmlToExcalidrawConverter };
