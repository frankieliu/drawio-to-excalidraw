#!/usr/bin/env node

/**
 * Parse Sidebar.js (grapheditor) to extract Misc palette shape dimensions
 */

import { readFileSync, writeFileSync } from 'fs';

const sidebarPath = '../drawio-desktop/drawio/src/main/webapp/js/grapheditor/Sidebar.js';

try {
	const content = readFileSync(sidebarPath, 'utf-8');

	// Find the addMiscPalette function
	const miscStartMatch = content.match(/Sidebar\.prototype\.addMiscPalette\s*=\s*function/);
	if (!miscStartMatch) {
		console.error('Could not find addMiscPalette function');
		process.exit(1);
	}

	const startPos = miscStartMatch.index;
	// Find the end of the function (next Sidebar.prototype definition)
	const endMatch = content.slice(startPos + 100).match(/Sidebar\.prototype\./);
	if (!endMatch) {
		console.error('Could not find end of addMiscPalette function');
		process.exit(1);
	}

	const miscPaletteCode = content.slice(startPos, startPos + 100 + endMatch.index);

	console.log('Extracting Misc palette shapes...\n');

	const dimensions = {};

	// Pattern for createVertexTemplateEntry with explicit dimensions
	// this.createVertexTemplateEntry('style', width, height, 'label', 'title')
	const templateRegex = /createVertexTemplateEntry\('([^']+)',\s*(\d+),\s*(\d+),\s*'[^']*',\s*'([^']+)'/g;

	let match;
	let shapeVariationCounts = {}; // Track how many times we've seen each shape

	while ((match = templateRegex.exec(miscPaletteCode)) !== null) {
		const style = match[1];
		const width = parseInt(match[2]);
		const height = parseInt(match[3]);
		const title = match[4];

		// Extract shape type from style
		// Look for shape= in the style
		const shapeMatch = style.match(/shape=([a-zA-Z0-9_]+)/);
		if (shapeMatch) {
			const baseShapeName = shapeMatch[1];
			let shapeName = baseShapeName;

			// Handle shape variations (e.g., left vs right curly bracket)
			// Track how many times we've seen this shape
			if (!shapeVariationCounts[baseShapeName]) {
				shapeVariationCounts[baseShapeName] = 1;
			} else {
				// This is a variation - add suffix
				shapeVariationCounts[baseShapeName]++;
				shapeName = `${baseShapeName}_${shapeVariationCounts[baseShapeName]}`;
			}

			dimensions[shapeName] = {
				width,
				height,
				title,
				style
			};

			console.log(`Found: ${shapeName} (${width}x${height}) - ${title}`);
		}
	}

	console.log(`\nExtracted dimensions for ${Object.keys(dimensions).length} Misc shapes`);

	// Save to file
	writeFileSync('./misc-dimensions.json', JSON.stringify(dimensions, null, 2));
	console.log('Saved to misc-dimensions.json');

} catch (error) {
	console.error('Error:', error.message);
	process.exit(1);
}
