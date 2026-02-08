#!/usr/bin/env node

/**
 * Convert draw.io XML stencils to Excalidraw library format (.excalidrawlib)
 *
 * Supported stencil categories:
 * - basic: Basic shapes (rectangles, circles, etc.)
 * - arrows: Arrow shapes
 * - flowchart: Flowchart symbols
 *
 * Note: Entity Relations (ER) and UML are JavaScript-based shapes
 * and require Phase 2 implementation (see TODO.md)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import path from 'path';
import { XmlToSvgConverter } from './xml-to-svg.js';

const parseXml = promisify(parseString);

class StencilToExcalidrawConverter {
	constructor() {
		this.xmlConverter = new XmlToSvgConverter();

		// Map of category names to stencil file paths
		this.stencilMap = {
			'basic': '../drawio-desktop/drawio/src/main/webapp/stencils/basic.xml',
			'arrows': '../drawio-desktop/drawio/src/main/webapp/stencils/arrows.xml',
			'flowchart': '../drawio-desktop/drawio/src/main/webapp/stencils/flowchart.xml',
			// Not yet supported (JavaScript-based shapes, requires Phase 2):
			// 'er': '../drawio-desktop/drawio/src/main/webapp/shapes/er/mxER.js',
			// 'uml': '../drawio-desktop/drawio/src/main/webapp/shapes/mxUML25.js',
		};
	}

	/**
	 * Convert SVG path data to Excalidraw points format
	 */
	svgPathToPoints(svgPath) {
		const points = [];
		const commands = svgPath.match(/[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi) || [];

		let currentX = 0;
		let currentY = 0;

		for (const cmd of commands) {
			const type = cmd[0].toUpperCase();
			const values = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat).filter(v => !isNaN(v));

			switch (type) {
				case 'M': // moveto
					currentX = values[0];
					currentY = values[1];
					points.push([currentX, currentY]);
					break;

				case 'L': // lineto
					currentX = values[0];
					currentY = values[1];
					points.push([currentX, currentY]);
					break;

				case 'H': // horizontal lineto
					currentX = values[0];
					points.push([currentX, currentY]);
					break;

				case 'V': // vertical lineto
					currentY = values[0];
					points.push([currentX, currentY]);
					break;

				case 'Z': // closepath
					if (points.length > 0) {
						points.push([...points[0]]); // Close the path
					}
					break;

				// Note: Curves (C, S, Q, T, A) are approximated as line segments
				case 'C': // cubic bezier
					// Take the end point
					currentX = values[4];
					currentY = values[5];
					points.push([currentX, currentY]);
					break;

				case 'Q': // quadratic bezier
					currentX = values[2];
					currentY = values[3];
					points.push([currentX, currentY]);
					break;

				case 'A': // arc
					currentX = values[5];
					currentY = values[6];
					points.push([currentX, currentY]);
					break;
			}
		}

		return points;
	}

	/**
	 * Extract path data from SVG string
	 */
	extractPathsFromSvg(svgString) {
		const paths = [];
		const pathRegex = /<path[^>]*d="([^"]*)"[^>]*\/>/g;
		const rectRegex = /<rect[^>]*x="([^"]*)"[^>]*y="([^"]*)"[^>]*width="([^"]*)"[^>]*height="([^"]*)"[^>]*\/>/g;
		const ellipseRegex = /<ellipse[^>]*cx="([^"]*)"[^>]*cy="([^"]*)"[^>]*rx="([^"]*)"[^>]*ry="([^"]*)"[^>]*\/>/g;

		// Extract path elements
		let match;
		while ((match = pathRegex.exec(svgString)) !== null) {
			paths.push(match[1]);
		}

		// Convert rect to path
		while ((match = rectRegex.exec(svgString)) !== null) {
			const x = parseFloat(match[1]);
			const y = parseFloat(match[2]);
			const w = parseFloat(match[3]);
			const h = parseFloat(match[4]);
			paths.push(`M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`);
		}

		// Convert ellipse to path (approximate with 4 bezier curves)
		while ((match = ellipseRegex.exec(svgString)) !== null) {
			const cx = parseFloat(match[1]);
			const cy = parseFloat(match[2]);
			const rx = parseFloat(match[3]);
			const ry = parseFloat(match[4]);
			// Simplified: just use 8 points around the ellipse
			paths.push(`M ${cx} ${cy - ry} L ${cx + rx} ${cy} L ${cx} ${cy + ry} L ${cx - rx} ${cy} Z`);
		}

		return paths;
	}

	/**
	 * Calculate bounding box of points
	 */
	calculateBounds(points) {
		if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };

		const xs = points.map(p => p[0]);
		const ys = points.map(p => p[1]);
		const minX = Math.min(...xs);
		const minY = Math.min(...ys);
		const maxX = Math.max(...xs);
		const maxY = Math.max(...ys);

		return {
			minX,
			minY,
			maxX,
			maxY,
			width: maxX - minX,
			height: maxY - minY
		};
	}

	/**
	 * Create an Excalidraw freedraw element from shape data
	 */
	createExcalidrawElement(shapeName, points, index) {
		const bounds = this.calculateBounds(points);

		// Normalize points to start at 0,0
		const normalizedPoints = points.map(([x, y]) => [
			x - bounds.minX,
			y - bounds.minY
		]);

		return {
			type: 'freedraw',
			version: 1,
			versionNonce: Math.floor(Math.random() * 2147483647),
			isDeleted: false,
			id: `drawio_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			fillStyle: 'solid',
			strokeWidth: 1,
			strokeStyle: 'solid',
			roughness: 0,
			opacity: 100,
			angle: 0,
			x: 0,
			y: 0,
			strokeColor: '#000000',
			backgroundColor: '#e0e0e0',
			width: bounds.width,
			height: bounds.height,
			seed: Math.floor(Math.random() * 2147483647),
			groupIds: [],
			frameId: null,
			roundness: null,
			boundElements: [],
			updated: Date.now(),
			link: null,
			locked: false,
			points: normalizedPoints,
			pressures: normalizedPoints.map(() => 0.5),
			simulatePressure: true
		};
	}

	/**
	 * Convert a stencil XML file to Excalidraw library format
	 */
	async convertStencilToLibrary(stencilPath, outputPath, categoryName) {
		console.log(`\nConverting ${categoryName}...`);
		console.log(`  Reading: ${stencilPath}`);

		// Read and parse stencil XML
		const xmlContent = readFileSync(stencilPath, 'utf-8');
		const parsed = await parseXml(xmlContent, {
			preserveChildrenOrder: true,
			explicitChildren: true,
			charsAsChildren: false
		});

		// Extract shapes
		const shapes = parsed.shapes.shape || [];
		console.log(`  Found ${shapes.length} shapes`);

		const libraryItems = [];

		for (let i = 0; i < shapes.length; i++) {
			const shape = shapes[i];
			const shapeName = shape.$.name || `Shape ${i}`;

			try {
				// Convert shape to SVG using our existing converter
				const result = await this.xmlConverter.convertShape(shape);
				const svgContent = result.svg;

				// Extract paths from SVG
				const paths = this.extractPathsFromSvg(svgContent);

				if (paths.length === 0) {
					console.log(`  ⚠ Skipping "${shapeName}" - no paths found`);
					continue;
				}

				// Combine all paths into one set of points
				const allPoints = [];
				for (const pathData of paths) {
					const pathPoints = this.svgPathToPoints(pathData);
					allPoints.push(...pathPoints);
				}

				if (allPoints.length < 2) {
					console.log(`  ⚠ Skipping "${shapeName}" - insufficient points`);
					continue;
				}

				// Create Excalidraw element
				const element = this.createExcalidrawElement(shapeName, allPoints, libraryItems.length);

				// Create library item
				libraryItems.push({
					id: `drawio_${libraryItems.length}`,
					status: 'unpublished',
					created: Date.now(),
					name: shapeName,
					elements: [element]
				});

				if ((i + 1) % 10 === 0) {
					console.log(`  Progress: ${i + 1}/${shapes.length} shapes`);
				}
			} catch (error) {
				console.error(`  ✗ Error processing "${shapeName}":`, error.message);
			}
		}

		// Create library JSON
		const library = {
			type: 'excalidrawlib',
			version: 2,
			source: 'drawio-converter',
			libraryItems
		};

		// Write output
		writeFileSync(outputPath, JSON.stringify(library, null, 2));
		console.log(`  ✓ Created library: ${outputPath}`);
		console.log(`  ✓ Converted ${libraryItems.length}/${shapes.length} shapes`);
	}

	/**
	 * Convert multiple stencil categories
	 */
	async convertCategories(categories, outputDir = './excalidraw-libraries') {
		// Create output directory
		if (!existsSync(outputDir)) {
			mkdirSync(outputDir, { recursive: true });
		}

		const results = {
			successful: [],
			skipped: [],
			errors: []
		};

		for (const category of categories) {
			const stencilPath = this.stencilMap[category];

			if (!stencilPath) {
				console.log(`\n⚠ Category "${category}" not found in stencil map`);
				results.skipped.push({ category, reason: 'Not found in stencil map' });
				continue;
			}

			if (stencilPath.endsWith('.js')) {
				console.log(`\n⚠ Category "${category}" uses JavaScript shapes (not yet supported)`);
				console.log(`  See TODO.md Phase 2 for JavaScript shape conversion`);
				results.skipped.push({ category, reason: 'JavaScript-based shapes (Phase 2)' });
				continue;
			}

			if (!existsSync(stencilPath)) {
				console.log(`\n✗ Stencil file not found: ${stencilPath}`);
				results.skipped.push({ category, reason: 'File not found' });
				continue;
			}

			const outputPath = path.join(outputDir, `${category}.excalidrawlib`);

			try {
				await this.convertStencilToLibrary(stencilPath, outputPath, category);
				results.successful.push(category);
			} catch (error) {
				console.error(`\n✗ Error converting ${category}:`, error.message);
				results.errors.push({ category, error: error.message });
			}
		}

		// Print summary
		console.log('\n' + '='.repeat(60));
		console.log('CONVERSION SUMMARY');
		console.log('='.repeat(60));
		console.log(`✓ Successfully converted: ${results.successful.length}`);
		if (results.successful.length > 0) {
			results.successful.forEach(cat => console.log(`  - ${cat}`));
		}

		if (results.skipped.length > 0) {
			console.log(`\n⚠ Skipped: ${results.skipped.length}`);
			results.skipped.forEach(({ category, reason }) => {
				console.log(`  - ${category}: ${reason}`);
			});
		}

		if (results.errors.length > 0) {
			console.log(`\n✗ Errors: ${results.errors.length}`);
			results.errors.forEach(({ category, error }) => {
				console.log(`  - ${category}: ${error}`);
			});
		}

		console.log('\n' + '='.repeat(60));

		return results;
	}
}

/**
 * Main CLI function
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
		console.log(`
Draw.io Stencil to Excalidraw Library Converter
================================================

Usage: node stencil-to-excalidrawlib.js [categories...] [--output=DIR]

Categories:
  basic       - Basic shapes (rectangles, circles, etc.)
  arrows      - Arrow shapes
  flowchart   - Flowchart symbols
  all         - Convert all supported categories

Options:
  --output=DIR    Output directory (default: ./excalidraw-libraries)
  --help, -h      Show this help message

Examples:
  node stencil-to-excalidrawlib.js basic arrows flowchart
  node stencil-to-excalidrawlib.js all
  node stencil-to-excalidrawlib.js basic --output=./libraries

Note: Entity Relations (ER) and UML are JavaScript-based shapes
and require Phase 2 implementation (see TODO.md)
		`);
		process.exit(0);
	}

	// Parse arguments
	let categories = [];
	let outputDir = './excalidraw-libraries';

	for (const arg of args) {
		if (arg.startsWith('--output=')) {
			outputDir = arg.split('=')[1];
		} else if (arg === 'all') {
			categories = ['basic', 'arrows', 'flowchart'];
		} else {
			categories.push(arg);
		}
	}

	if (categories.length === 0) {
		console.error('Error: No categories specified. Use --help for usage information.');
		process.exit(1);
	}

	// Run conversion
	const converter = new StencilToExcalidrawConverter();
	await converter.convertCategories(categories, outputDir);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(error => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
}

export { StencilToExcalidrawConverter };
