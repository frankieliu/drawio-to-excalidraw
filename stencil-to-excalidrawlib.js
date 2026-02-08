#!/usr/bin/env node

/**
 * Convert draw.io XML stencils to Excalidraw library format (.excalidrawlib)
 *
 * Uses the existing svg-to-excalidraw CLI tool for proper SVG conversion
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
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { XmlToSvgConverter, parseXml } from './lib/xml-to-svg-converter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const svgToExcalidrawCLI = path.resolve(__dirname, '../svg-to-excalidraw/bin/svg-to-excalidraw.js');

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
	 * Sanitize a name for use in IDs
	 * Converts to lowercase and replaces non-alphanumeric chars with underscores
	 */
	sanitizeName(name) {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
	}

	/**
	 * Generate a deterministic unique ID based on category and shape name
	 * Format: {category}_{sanitized_shape_name}
	 * Examples: basic_4_point_star, arrows_bent_left_arrow, flowchart_process
	 */
	generateUniqueId(categoryName, shapeName) {
		const sanitizedCategory = this.sanitizeName(categoryName);
		const sanitizedShape = this.sanitizeName(shapeName);
		return `${sanitizedCategory}_${sanitizedShape}`;
	}

	/**
	 * Convert SVG to Excalidraw format using the svg-to-excalidraw CLI
	 */
	convertSvgToExcalidraw(svgContent) {
		try {
			// Use the svg-to-excalidraw CLI tool
			const result = execSync(`node "${svgToExcalidrawCLI}" -`, {
				input: svgContent,
				encoding: 'utf-8',
				maxBuffer: 10 * 1024 * 1024 // 10MB buffer
			});

			return JSON.parse(result);
		} catch (error) {
			throw new Error(`svg-to-excalidraw conversion failed: ${error.message}`);
		}
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

				// Use svg-to-excalidraw CLI to convert SVG to Excalidraw elements
				const excalidrawData = this.convertSvgToExcalidraw(svgContent);
				const elements = excalidrawData.elements || [];

				if (elements.length === 0) {
					console.log(`  ⚠ Skipping "${shapeName}" - no elements generated`);
					continue;
				}

				// Create library item with deterministic ID
				libraryItems.push({
					id: this.generateUniqueId(categoryName, shapeName),
					status: 'unpublished',
					created: Date.now(),
					name: shapeName,
					elements: elements
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
