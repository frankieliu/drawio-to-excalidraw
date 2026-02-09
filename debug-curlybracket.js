#!/usr/bin/env node

import { MxShapeToExcalidrawConverter } from './mx-shape-to-excalidrawlib.js';

async function main() {
	const converter = new MxShapeToExcalidrawConverter();

	try {
		await converter.initialize();

		console.log('Debugging curlyBracket shape...\n');

		// Get shape defaults
		const defaults = await converter.getShapeDefaults('curlyBracket');
		console.log('CurlyBracket defaults:', JSON.stringify(defaults, null, 2));

		// Try to export it
		const svg = await converter.exportShapeAsSvg('curlyBracket');
		console.log('\nGenerated SVG length:', svg.length);
		console.log('SVG content:', svg);

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await converter.cleanup();
	}
}

main();
