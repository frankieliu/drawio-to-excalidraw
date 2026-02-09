#!/usr/bin/env node

import { MxShapeToExcalidrawConverter } from './mx-shape-to-excalidrawlib.js';

async function main() {
	const converter = new MxShapeToExcalidrawConverter();

	try {
		await converter.initialize();

		console.log('Enumerating Misc shapes from mxCellRenderer...\n');

		// Get all registered shapes
		const allShapes = await converter.page.evaluate(() => {
			const shapes = [];
			if (window.mxCellRenderer && window.mxCellRenderer.defaultShapes) {
				for (const key in window.mxCellRenderer.defaultShapes) {
					shapes.push(key);
				}
			}
			return shapes.sort();
		});

		console.log(`Total registered shapes: ${allShapes.length}\n`);

		// Filter to Misc palette shapes
		const miscShapes = ['ext', 'doubleEllipse', 'isoCube2', 'isoRectangle', 'curlyBracket', 'crossbar', 'partialRectangle', 'waypoint'];

		console.log('Misc palette shapes:');
		miscShapes.forEach(shape => {
			const registered = allShapes.includes(shape);
			console.log(`  ${shape}: ${registered ? '✓ registered' : '✗ NOT registered'}`);
		});

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await converter.cleanup();
	}
}

main();
