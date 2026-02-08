#!/usr/bin/env node

/**
 * XML to SVG CLI Tool
 * Converts draw.io XML stencil shapes to SVG format
 */

import { readFileSync, writeFileSync } from 'fs';
import { XmlToSvgConverter, parseXml } from './lib/xml-to-svg-converter.js';

/**
 * Main CLI function
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length < 1) {
		console.log('Usage: node xml-to-svg.js <input.xml> [output.svg]');
		console.log('  Converts draw.io XML stencil shapes to SVG format');
		console.log('  If the XML contains multiple shapes, creates multiple SVG files');
		process.exit(1);
	}

	const inputFile = args[0];
	const outputFile = args[1];

	try {
		// Read and parse XML
		const xmlContent = readFileSync(inputFile, 'utf-8');
		const parsed = await parseXml(xmlContent);

		// Check if it's a shapes file
		if (!parsed.shapes || !parsed.shapes.shape) {
			console.error('Error: Invalid stencil XML format');
			process.exit(1);
		}

		const shapes = Array.isArray(parsed.shapes.shape) ? parsed.shapes.shape : [parsed.shapes.shape];
		const converter = new XmlToSvgConverter();

		console.log(`Found ${shapes.length} shape(s) in ${inputFile}`);

		// Convert each shape
		for (let i = 0; i < shapes.length; i++) {
			const shape = shapes[i];
			const result = await converter.convertShape(shape);

			// Determine output filename
			let svgFilename;
			if (outputFile) {
				if (shapes.length === 1) {
					svgFilename = outputFile;
				} else {
					// Multiple shapes: append index and name
					const baseName = outputFile.replace(/\.svg$/, '');
					const shapeName = result.name.replace(/[^a-zA-Z0-9_]/g, '_');
					svgFilename = `${baseName}_${i}_${shapeName}.svg`;
				}
			} else {
				// No output file specified: use shape name
				const shapeName = result.name.replace(/[^a-zA-Z0-9_]/g, '_');
				svgFilename = `${shapeName}.svg`;
			}

			// Write SVG file
			writeFileSync(svgFilename, result.svg);
			console.log(`  ✓ ${result.name} → ${svgFilename} (${result.width}×${result.height})`);
		}

		console.log(`\nSuccessfully converted ${shapes.length} shape(s)`);
	} catch (error) {
		console.error('Error:', error.message);
		if (error.stack) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { XmlToSvgConverter };
