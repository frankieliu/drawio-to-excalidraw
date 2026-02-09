#!/usr/bin/env node

import { MxShapeToExcalidrawConverter } from './mx-shape-to-excalidrawlib.js';

async function main() {
	const converter = new MxShapeToExcalidrawConverter();

	try {
		await converter.initialize();

		console.log('Debugging polygon shape...\n');

		// Get shape defaults for polygon
		const defaults = await converter.getShapeDefaults('mxgraph.basic.polygon');
		console.log('Polygon defaults:', JSON.stringify(defaults, null, 2));

		// Try to export it
		const svg = await converter.exportShapeAsSvg('mxgraph.basic.polygon');
		console.log('\nGenerated SVG length:', svg.length);
		console.log('SVG preview:', svg.substring(0, 200));

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await converter.cleanup();
	}
}

main();
