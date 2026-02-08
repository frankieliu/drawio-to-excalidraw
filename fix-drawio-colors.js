#!/usr/bin/env node

/**
 * Fix draw.io exported SVG files that have color variable names instead of actual colors
 * This happens with mockup shapes that use fillColorStyles and strokeColorStyles
 */

import { readFileSync, writeFileSync } from 'fs';
import { parseString, Builder } from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify(parseString);

class DrawioColorFixer {
	/**
	 * Extract color mappings from draw.io mxCell style string
	 * Example style: "fillColor2=#ffffff;fillColor3=#ffca8c;strokeColor2=#000000"
	 */
	extractColorMappings(styleString) {
		const colorMap = {};

		if (!styleString) return colorMap;

		// Split style string by semicolon
		const parts = styleString.split(';');

		for (const part of parts) {
			const trimmed = part.trim();
			if (!trimmed) continue;

			// Match patterns like "fillColor2=#ffffff" or "strokeColor3=#d87146"
			const match = trimmed.match(/^(fillColor\d+|strokeColor\d+)=(.+)$/);
			if (match) {
				const [, colorName, colorValue] = match;
				colorMap[colorName] = colorValue;
			}
		}

		return colorMap;
	}

	/**
	 * Fix color attributes in SVG content
	 */
	fixSvgColors(svgContent, colorMap) {
		let fixed = svgContent;

		// Replace fill="fillColorX" with fill="#hexcolor"
		for (const [colorName, colorValue] of Object.entries(colorMap)) {
			// Match fill="fillColorX" or stroke="strokeColorX"
			const fillPattern = new RegExp(`fill="${colorName}"`, 'g');
			const strokePattern = new RegExp(`stroke="${colorName}"`, 'g');

			fixed = fixed.replace(fillPattern, `fill="${colorValue}"`);
			fixed = fixed.replace(strokePattern, `stroke="${colorValue}"`);
		}

		return fixed;
	}

	/**
	 * Process a draw.io SVG file
	 */
	async processSvgFile(inputFile, outputFile) {
		console.log(`Reading ${inputFile}...`);
		const svgContent = readFileSync(inputFile, 'utf-8');

		// Parse XML
		const result = await parseXml(svgContent, {
			preserveChildrenOrder: false,
			explicitChildren: false,
			charsAsChildren: false
		});

		// Extract color mappings from embedded draw.io data
		let colorMap = {};

		// The draw.io XML is embedded in the viewBox's content attribute
		if (result.svg && result.svg.$ && result.svg.$.content) {
			const content = result.svg.$.content;

			// Decode HTML entities
			const decoded = content
				.replace(/&quot;/g, '"')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&amp;/g, '&')
				.replace(/&#10;/g, '\n');

			// Parse the embedded XML
			try {
				const drawioData = await parseXml(decoded);

				// Look for mxCell elements with style attributes
				if (drawioData.mxfile && drawioData.mxfile.diagram) {
					const diagrams = Array.isArray(drawioData.mxfile.diagram)
						? drawioData.mxfile.diagram
						: [drawioData.mxfile.diagram];

					for (const diagram of diagrams) {
						if (diagram.mxGraphModel && diagram.mxGraphModel[0]) {
							const model = diagram.mxGraphModel[0];
							if (model.root && model.root[0] && model.root[0].mxCell) {
								for (const cell of model.root[0].mxCell) {
									if (cell.$ && cell.$.style) {
										const cellColors = this.extractColorMappings(cell.$.style);
										colorMap = { ...colorMap, ...cellColors };
									}
								}
							}
						}
					}
				}
			} catch (e) {
				console.error('Error parsing embedded draw.io XML:', e.message);
			}
		}

		console.log(`Found ${Object.keys(colorMap).length} color mappings:`, colorMap);

		if (Object.keys(colorMap).length === 0) {
			console.log('No color mappings found - file may already be correct or not a draw.io mockup shape');
			return;
		}

		// Fix colors in the SVG content
		const fixedContent = this.fixSvgColors(svgContent, colorMap);

		// Write output
		writeFileSync(outputFile, fixedContent);
		console.log(`Fixed SVG written to ${outputFile}`);
	}
}

/**
 * Main CLI function
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length < 1) {
		console.log('Usage: node fix-drawio-colors.js <input.svg> [output.svg]');
		console.log('  Fixes draw.io SVG files that have color variable names instead of actual colors');
		console.log('  If output.svg is not specified, overwrites the input file');
		process.exit(1);
	}

	const inputFile = args[0];
	const outputFile = args[1] || inputFile;

	try {
		const fixer = new DrawioColorFixer();
		await fixer.processSvgFile(inputFile, outputFile);
		console.log('\nDone!');
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

export { DrawioColorFixer };
