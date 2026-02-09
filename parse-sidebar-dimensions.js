#!/usr/bin/env node

/**
 * Parse Sidebar-Basic.js to extract default shape dimensions
 */

import { readFileSync, writeFileSync } from 'fs';

const sidebarBasicPath = '../drawio-desktop/drawio/src/main/webapp/js/diagramly/sidebar/Sidebar-Basic.js';

try {
	const content = readFileSync(sidebarBasicPath, 'utf-8');

	// Extract w and h values
	const wMatch = content.match(/var w = (\d+);/);
	const hMatch = content.match(/var h = (\d+);/);

	if (!wMatch || !hMatch) {
		console.error('Could not find w and h variable definitions');
		process.exit(1);
	}

	const baseW = parseInt(wMatch[1]);
	const baseH = parseInt(hMatch[1]);

	console.log(`Base dimensions: w=${baseW}, h=${baseH}\n`);

	// Extract shape templates - handle multiple patterns
	// Pattern 1: s2 + 'shapename;...'
	// Pattern 2: s + 'shapename;...'
	// Pattern 3: 'html=1;shape=mxgraph.basic.shapename;...'
	// Pattern 4: 'shape=partialRectangle;...' (without mxgraph prefix)

	const dimensions = {};

	const patterns = [
		// Pattern: s2 + 'shapename' or s + 'shapename'
		/createVertexTemplateEntry\(s2?\s*\+\s*'([^']+)'[^,]*,\s*([^,]+),\s*([^,]+),\s*'[^']*',\s*'([^']+)'/g,
		// Pattern: 'html=1;shape=mxgraph.basic.shapename'
		/createVertexTemplateEntry\('html=1;shape=mxgraph\.basic\.([^;']+)[^']*',\s*([^,]+),\s*([^,]+),\s*'[^']*',\s*'([^']+)'/g,
		// Pattern: s + 'shapename' (different variable)
		/createVertexTemplateEntry\(s\s*\+\s*'([^']+)'[^,]*,\s*([^,]+),\s*([^,]+),\s*'[^']*',\s*'([^']+)'/g,
		// Pattern: plain string with shape=
		/createVertexTemplateEntry\('([^']*shape=(?:mxgraph\.basic\.)?([a-z0-9_]+)[^']*)',\s*([^,]+),\s*([^,]+),\s*'[^']*',\s*'([^']+)'/g,
	];

	patterns.forEach((regex, patternIndex) => {
		regex.lastIndex = 0; // Reset regex state
		let match;

		while ((match = regex.exec(content)) !== null) {
			let shapeSuffix, widthExpr, heightExpr, title;

			if (patternIndex === 0 || patternIndex === 2) {
				// s2 + 'shapename' or s + 'shapename'
				shapeSuffix = match[1];
				widthExpr = match[2].trim();
				heightExpr = match[3].trim();
				title = match[4];
			} else if (patternIndex === 1) {
				// 'html=1;shape=mxgraph.basic.shapename'
				shapeSuffix = match[1];
				widthExpr = match[2].trim();
				heightExpr = match[3].trim();
				title = match[4];
			} else if (patternIndex === 3) {
				// Plain string with shape=
				shapeSuffix = match[2];
				widthExpr = match[3].trim();
				heightExpr = match[4].trim();
				title = match[5];
			}

			// Extract shape name (before first semicolon or end)
			const shapeNameMatch = shapeSuffix.match(/^([a-z0-9_]+)/i);
			if (!shapeNameMatch) continue;

			const baseShapeName = shapeNameMatch[1];
			const shapeName = `mxgraph.basic.${baseShapeName}`;

			// Skip if we already have this shape (avoid duplicates from different patterns)
			if (dimensions[shapeName]) continue;

			// Evaluate width and height expressions
			try {
				const w = baseW;
				const h = baseH;
				const width = eval(widthExpr);
				const height = eval(heightExpr);

				dimensions[shapeName] = {
					width,
					height,
					widthExpr,
					heightExpr,
					title,
					styleSuffix: shapeSuffix  // Store the full style suffix with all parameters
				};
			} catch (e) {
				console.warn(`Could not evaluate dimensions for ${shapeName}: ${widthExpr}, ${heightExpr}`);
			}
		}
	});

	console.log(`Extracted dimensions for ${Object.keys(dimensions).length} shapes:\n`);

	// Sort by shape name for easier reading
	const sortedDimensions = Object.keys(dimensions).sort().reduce((acc, key) => {
		acc[key] = dimensions[key];
		return acc;
	}, {});

	// Display some examples
	const examples = ['mxgraph.basic.pyramid', 'mxgraph.basic.frame', 'mxgraph.basic.drop'];
	examples.forEach(name => {
		if (sortedDimensions[name]) {
			const d = sortedDimensions[name];
			console.log(`${name}: ${d.width}x${d.height} (${d.widthExpr}, ${d.heightExpr})`);
		}
	});

	console.log(`\nTotal shapes: ${Object.keys(sortedDimensions).length}`);

	// Save to file
	writeFileSync('./shape-dimensions.json', JSON.stringify(sortedDimensions, null, 2));
	console.log('\nSaved to shape-dimensions.json');

} catch (error) {
	console.error('Error:', error.message);
	process.exit(1);
}
