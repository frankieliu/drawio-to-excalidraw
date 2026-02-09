#!/usr/bin/env node

/**
 * Extract default shape dimensions from draw.io's Sidebar-Basic.js
 */

import { MxShapeToExcalidrawConverter } from './mx-shape-to-excalidrawlib.js';
import { writeFileSync } from 'fs';

async function main() {
	const converter = new MxShapeToExcalidrawConverter();

	try {
		await converter.initialize();

		console.log('Extracting shape dimensions from Sidebar...\n');

		// Try to extract dimensions by intercepting sidebar template creation
		const dimensionsMap = await converter.page.evaluate(() => {
			const dimensions = {};

			// Create a mock container for sidebar
			const container = document.createElement('div');
			container.style.display = 'none';
			document.body.appendChild(container);

			// Temporarily override to skip adaptive colors
			const originalValidateBackgroundStyles = mxGraphView.prototype.validateBackgroundStyles;
			mxGraphView.prototype.validateBackgroundStyles = function() { return; };

			// Create a minimal EditorUi mock if needed
			const graphContainer = document.createElement('div');
			const mockGraph = new mxGraph(graphContainer);
			mockGraph.getAdaptiveColors = function() {
				return { color: '#000000', fill: '#ffffff', stroke: '#000000' };
			};

			const mockUi = {
				editor: {
					graph: mockGraph
				}
			};

			// Restore original method
			mxGraphView.prototype.validateBackgroundStyles = originalValidateBackgroundStyles;

			// Try to create a Sidebar instance and intercept template creation
			try {
				// Override createVertexTemplateEntry to capture dimensions
				const originalCreateVertexTemplateEntry = Sidebar.prototype.createVertexTemplateEntry;
				Sidebar.prototype.createVertexTemplateEntry = function(style, width, height, title, ...rest) {
					// Extract shape name from style
					const shapeMatch = style.match(/shape=(mxgraph\.basic\.[a-z0-9_]+)/);
					if (shapeMatch) {
						const shapeName = shapeMatch[1];
						dimensions[shapeName] = {
							width: width,
							height: height,
							style: style,
							title: title || shapeName
						};
					}

					// Call original method
					return originalCreateVertexTemplateEntry.call(this, style, width, height, title, ...rest);
				};

				// Create a minimal sidebar instance
				const sidebar = new Sidebar(mockUi, container);

				// Call addBasicPalette to register all shapes
				if (sidebar.addBasicPalette) {
					sidebar.addBasicPalette();
				}

				// Restore original method
				Sidebar.prototype.createVertexTemplateEntry = originalCreateVertexTemplateEntry;

				// Clean up
				document.body.removeChild(container);
			} catch (error) {
				return { error: error.message, stack: error.stack };
			}

			return dimensions;
		});

		if (dimensionsMap.error) {
			console.error('Error extracting dimensions:', dimensionsMap.error);
			console.error(dimensionsMap.stack);
		} else {
			console.log('Extracted dimensions for', Object.keys(dimensionsMap).length, 'shapes:\n');
			console.log(JSON.stringify(dimensionsMap, null, 2));

			// Save to file
			writeFileSync('./shape-dimensions.json', JSON.stringify(dimensionsMap, null, 2));
			console.log('\nSaved to shape-dimensions.json');
		}

	} catch (error) {
		console.error('Error:', error);
	} finally {
		await converter.cleanup();
	}
}

main();
