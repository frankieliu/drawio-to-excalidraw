#!/usr/bin/env node

/**
 * Convert draw.io JavaScript-based mxGraph shapes to Excalidraw library format
 *
 * Phase 1: Proof of Concept - Single shape conversion
 * Uses Playwright to automate draw.io web app for accurate SVG rendering
 *
 * Supported shape namespaces:
 * - mxgraph.basic.* - Basic shapes (33 shapes from mxBasic.js)
 * - mxgraph.mockup.* - UI mockup components (~50 shapes from 8 files)
 */

import { writeFileSync, mkdirSync, existsSync, mkdtempSync, readFileSync } from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const svgToExcalidrawCLI = path.resolve(__dirname, '../svg-to-excalidraw/bin/svg-to-excalidraw.js');

// Load shape dimensions from sidebar definitions
const shapeDimensionsPath = path.resolve(__dirname, 'shape-dimensions.json');
const miscDimensionsPath = path.resolve(__dirname, 'misc-dimensions.json');
let SHAPE_DIMENSIONS = {};
let MISC_DIMENSIONS = {};

if (existsSync(shapeDimensionsPath)) {
	SHAPE_DIMENSIONS = JSON.parse(readFileSync(shapeDimensionsPath, 'utf-8'));
}
if (existsSync(miscDimensionsPath)) {
	MISC_DIMENSIONS = JSON.parse(readFileSync(miscDimensionsPath, 'utf-8'));
}

class MxShapeToExcalidrawConverter {
	constructor() {
		this.browser = null;
		this.page = null;
	}

	/**
	 * Launch headless browser and load draw.io
	 */
	async initialize(drawioUrl = 'http://127.0.0.1:8080/?offline=1&splash=0&libs=0') {
		console.log('Launching browser...');
		this.browser = await chromium.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		});

		this.page = await this.browser.newPage();

		// Load draw.io with offline mode and no splash screen
		console.log(`Loading draw.io from ${drawioUrl}...`);
		await this.page.goto(drawioUrl, {
			waitUntil: 'domcontentloaded',
			timeout: 60000
		});

		// Wait for editor to be fully ready
		console.log('Waiting for editor to initialize...');
		await this.page.waitForFunction(() => {
			// Wait for all critical globals to be available
			return window.EditorUi &&
			       window.mxGraph &&
			       window.mxClient &&
			       window.mxUtils &&
			       window.mxCellRenderer;
		}, { timeout: 45000 });

		// Give it an extra few seconds for everything to settle
		await this.page.waitForTimeout(3000);

		// Debug: Check what's available
		const debug = await this.page.evaluate(() => {
			return {
				hasEditorUi: typeof window.EditorUi !== 'undefined',
				hasApp: typeof window.app !== 'undefined',
				hasMxGraph: typeof window.mxGraph !== 'undefined',
				editorUiKeys: window.EditorUi ? Object.keys(window.EditorUi) : [],
				appKeys: window.app ? Object.keys(window.app) : []
			};
		});

		console.log('  Debug info:', JSON.stringify(debug, null, 2));
		console.log('✓ Draw.io loaded successfully\n');
	}

	/**
	 * Close browser
	 */
	async cleanup() {
		if (this.browser) {
			await this.browser.close();
		}
	}

	/**
	 * Sanitize a name for use in IDs
	 */
	sanitizeName(name) {
		return name
			.toLowerCase()
			.replace(/^mxgraph\./, '') // Remove mxgraph. prefix
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '');
	}

	/**
	 * Generate deterministic unique ID from shape name
	 * Examples: basic_rect, mockup_forms_searchbox
	 */
	generateUniqueId(shapeName) {
		return this.sanitizeName(shapeName);
	}

	/**
	 * Debug: Explore draw.io's environment to find where shape defaults are stored
	 */
	async exploreDrawioEnvironment(shapeName) {
		return await this.page.evaluate((shapeName) => {
			const info = {
				shapeName: shapeName,
				globals: {
					hasEditorUi: typeof window.EditorUi !== 'undefined',
					hasApp: typeof window.app !== 'undefined',
					hasSidebar: typeof window.Sidebar !== 'undefined',
					hasMxStencilRegistry: typeof window.mxStencilRegistry !== 'undefined'
				},
				app: null,
				sidebar: null,
				cellRendererShapes: {},
				stencils: {},
				sidebarPrototype: null
			};

			// Check app structure
			if (window.app) {
				info.app = {
					hasSidebar: !!window.app.sidebar,
					hasEditor: !!window.app.editor,
					hasActions: !!window.app.actions,
					keys: Object.keys(window.app).slice(0, 20) // First 20 keys
				};

				if (window.app.sidebar) {
					info.sidebar = {
						keys: Object.keys(window.app.sidebar).slice(0, 20),
						hasPalettes: !!window.app.sidebar.palettes,
						hasEntries: !!window.app.sidebar.entries
					};

					// Try to find shape entries
					if (window.app.sidebar.entries) {
						info.sidebar.entriesKeys = Object.keys(window.app.sidebar.entries).filter(k =>
							k.includes('basic') || k.includes(shapeName)
						);
					}
				}
			}

			// Check Sidebar prototype for palette data
			if (window.Sidebar && window.Sidebar.prototype) {
				info.sidebarPrototype = {
					keys: Object.keys(window.Sidebar.prototype).slice(0, 30),
					hasAddBasicPalette: typeof window.Sidebar.prototype.addBasicPalette === 'function',
					hasPalettes: !!window.Sidebar.prototype.palettes
				};

				// Try to access palette data if it exists
				if (window.Sidebar.prototype.palettes) {
					info.sidebarPrototype.palettesKeys = Object.keys(window.Sidebar.prototype.palettes);
				}
			}

			// Check cell renderer shapes
			if (window.mxCellRenderer && window.mxCellRenderer.defaultShapes) {
				const shapeEntry = window.mxCellRenderer.defaultShapes[shapeName];
				if (shapeEntry) {
					info.cellRendererShapes[shapeName] = {
						type: typeof shapeEntry,
						isFunction: typeof shapeEntry === 'function',
						hasPrototype: !!(shapeEntry && shapeEntry.prototype),
						prototypeKeys: shapeEntry && shapeEntry.prototype ?
							Object.keys(shapeEntry.prototype).slice(0, 20) : []
					};
				}
			}

			// Check stencil registry
			if (window.mxStencilRegistry) {
				info.stencils = {
					hasStencils: !!window.mxStencilRegistry.stencils,
					stencilCount: window.mxStencilRegistry.stencils ?
						Object.keys(window.mxStencilRegistry.stencils).length : 0,
					hasTargetShape: !!(window.mxStencilRegistry.stencils &&
						window.mxStencilRegistry.stencils[shapeName])
				};

				if (window.mxStencilRegistry.stencils && window.mxStencilRegistry.stencils[shapeName]) {
					const stencil = window.mxStencilRegistry.stencils[shapeName];
					info.stencils[shapeName] = {
						keys: Object.keys(stencil),
						w: stencil.w,
						h: stencil.h,
						aspect: stencil.aspect
					};
				}
			}

			return info;
		}, shapeName);
	}

	/**
	 * Get default style and size for specific shapes from draw.io
	 * Query draw.io's actual defaults instead of hardcoding
	 */
	async getShapeDefaults(shapeName) {
		// Look up dimensions from sidebar definitions
		// Try mxgraph.basic shapes first, then Misc shapes (without prefix)
		let sidebarDimensions = SHAPE_DIMENSIONS[shapeName] || MISC_DIMENSIONS[shapeName];

		if (!sidebarDimensions) {
			throw new Error(`No sidebar definition found for shape: ${shapeName}. This shape may not be in the UI panel.`);
		}

		return await this.page.evaluate(({ shapeName, sidebarWidth, sidebarHeight, sidebarStyle, sidebarStyleSuffix }) => {
			try {
				// Use dimensions from sidebar definitions
				let defaultWidth = sidebarWidth;
				let defaultHeight = sidebarHeight;

				// Create a temporary graph to render the shape
				const container = document.createElement('div');
				container.style.position = 'absolute';
				container.style.left = '-10000px';
				document.body.appendChild(container);

				// Temporarily override to skip adaptive colors
				const originalValidateBackgroundStyles = mxGraphView.prototype.validateBackgroundStyles;
				mxGraphView.prototype.validateBackgroundStyles = function() { return; };

				const graph = new mxGraph(container);
				graph.getAdaptiveColors = function() {
					return { color: '#000000', fill: '#ffffff', stroke: '#000000' };
				};

				// Restore
				mxGraphView.prototype.validateBackgroundStyles = originalValidateBackgroundStyles;

				const parent = graph.getDefaultParent();

				// Determine the style string to use
				// For Misc shapes, use the full style from sidebar
				// For mxgraph.basic shapes, use styleSuffix if available
				let initialStyle;

				if (sidebarStyle) {
					// Misc shapes - use the complete style from sidebar
					initialStyle = sidebarStyle;
				} else if (sidebarStyleSuffix) {
					// mxgraph.basic shapes with styleSuffix (e.g., polygon)
					const shortName = shapeName.replace('mxgraph.basic.', '');
					if (sidebarStyleSuffix.startsWith(shortName)) {
						initialStyle = 'shape=' + shapeName + sidebarStyleSuffix.substring(shortName.length);
					} else {
						initialStyle = 'shape=' + shapeName;
					}
				} else {
					// Default fallback
					initialStyle = 'shape=' + shapeName;
				}

				// Insert shape with sidebar dimensions to render it
				graph.getModel().beginUpdate();
				let cell;
				try {
					cell = graph.insertVertex(
						parent,
						null,
						'',
						0, 0, defaultWidth, defaultHeight,
						initialStyle
					);
				} finally {
					graph.getModel().endUpdate();
				}

				// Force rendering to get the shape instance
				graph.refresh();
				const state = graph.view.getState(cell);

				// Try to get customProperties from the shape
				let customParams = '';
				if (state && state.shape) {
					const shape = state.shape;
					// Check if the shape constructor has customProperties
					if (shape.customProperties && Array.isArray(shape.customProperties)) {
						const params = [];
						for (const prop of shape.customProperties) {
							if (prop.defVal !== undefined) {
								params.push(prop.name + '=' + prop.defVal);
							}
						}
						customParams = params.join(';');
					}
				}

				// Get the cell's style
				const style = graph.getCellStyle(cell);

				// Get geometry
				const geo = cell.getGeometry();

				// Build full style string with custom property defaults
				let styleString = cell.getStyle();

				// Only append customParams if we don't already have a complete sidebarStyle
				// For Misc shapes with full styles, don't add customParams (they may conflict)
				if (customParams && !sidebarStyle) {
					styleString = styleString + ';' + customParams;
				}

				// Clean up
				document.body.removeChild(container);

				return {
					style: style,
					width: geo.width,
					height: geo.height,
					styleString: styleString,
					customParams: customParams
				};
			} catch (error) {
				return { error: error.message, stack: error.stack };
			}
		}, {
			shapeName,
			sidebarWidth: sidebarDimensions.width,
			sidebarHeight: sidebarDimensions.height,
			sidebarStyle: sidebarDimensions.style || null,
			sidebarStyleSuffix: sidebarDimensions.styleSuffix || null
		});
	}

	/**
	 * Get default style parameters for specific shapes
	 */
	getDefaultShapeParams(shapeName) {
		// Deprecated - use getShapeDefaults instead
		return '';
	}

	/**
	 * Insert a shape into draw.io canvas and export as SVG
	 */
	async exportShapeAsSvg(shapeName) {
		// Get actual defaults from draw.io
		const defaults = await this.getShapeDefaults(shapeName);

		if (defaults.error) {
			throw new Error(`Failed to get shape defaults: ${defaults.error}`);
		}

		const result = await this.page.evaluate(({ shapeName, defaults }) => {
			try {
				// Create a hidden container for the graph
				const container = document.createElement('div');
				container.style.position = 'absolute';
				container.style.left = '-10000px';
				container.style.width = '500px';
				container.style.height = '500px';
				document.body.appendChild(container);

				// Temporarily override mxGraphView to skip adaptive colors
				const originalValidateBackgroundStyles = mxGraphView.prototype.validateBackgroundStyles;
				mxGraphView.prototype.validateBackgroundStyles = function() {
					// Skip adaptive color validation
					return;
				};

				try {
					// Create a new graph
					const graph = new mxGraph(container);
					graph.setEnabled(false);

					// Add getAdaptiveColors method to the graph instance
					graph.getAdaptiveColors = function() {
						return {
							color: '#000000',
							fill: '#ffffff',
							stroke: '#000000'
						};
					};

					// Restore original method
					mxGraphView.prototype.validateBackgroundStyles = originalValidateBackgroundStyles;

					// Disable grid and background
					graph.view.gridEnabled = false;
					graph.pageVisible = false;
					graph.pageBreaksVisible = false;
					graph.preferPageSize = false;

					// Set basic rendering options
					graph.setPanning(false);
					graph.setConnectable(false);
					graph.setCellsLocked(true);
					graph.setCellsResizable(false);
					graph.setCellsMovable(false);

					const model = graph.getModel();
					const parent = graph.getDefaultParent();

					// Begin update
					model.beginUpdate();
					let cell;
					try {
						// Use the style string from draw.io defaults
						// This includes all default parameters like dx
						const style = defaults.styleString || ('shape=' + shapeName);

						cell = graph.insertVertex(
							parent,
							null,
							'',
							50, 50,
							defaults.width || 120,
							defaults.height || 80,
							style
						);
					} finally {
						model.endUpdate();
					}

					// Refresh the view
					graph.refresh();

					// Get the cell state which contains the rendered shape
					const state = graph.view.getState(cell);

					if (!state || !state.shape) {
						throw new Error('Could not get cell state or shape');
					}

					// Get the shape's SVG node (not the entire canvas)
					const shapeNode = state.shape.node;

					if (!shapeNode) {
						throw new Error('Could not get shape SVG node');
					}

					// Create a new clean SVG document with just the shape
					const svgNS = 'http://www.w3.org/2000/svg';
					const newSvg = document.createElementNS(svgNS, 'svg');

					// Clone the shape node and all its children
					const clonedShape = shapeNode.cloneNode(true);

					// Get the bounding box of the shape
					let bbox;
					try {
						bbox = shapeNode.getBBox();
					} catch (e) {
						// Fallback to cell bounds
						bbox = {
							x: state.x,
							y: state.y,
							width: state.width,
							height: state.height
						};
					}

					// Set SVG attributes for a clean export
					const padding = 5;
					newSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + 2*padding} ${bbox.height + 2*padding}`);
					newSvg.setAttribute('width', bbox.width + 2*padding);
					newSvg.setAttribute('height', bbox.height + 2*padding);
					newSvg.setAttribute('xmlns', svgNS);
					newSvg.setAttribute('version', '1.1');

					// Append the cloned shape to the new SVG
					newSvg.appendChild(clonedShape);

					// Serialize to string
					const serializer = new XMLSerializer();
					const svgString = serializer.serializeToString(newSvg);

					// Clean up
					document.body.removeChild(container);

					return { success: true, svg: svgString };
				} catch (innerError) {
					// Restore original method if error occurred
					mxGraphView.prototype.validateBackgroundStyles = originalValidateBackgroundStyles;
					throw innerError;
				}

			} catch (error) {
				return { success: false, error: error.message, stack: error.stack };
			}
		}, { shapeName, defaults });

		if (!result.success) {
			throw new Error(`${result.error}\nStack: ${result.stack}`);
		}

		return result.svg;
	}

	/**
	 * Convert SVG to Excalidraw format using svg-to-excalidraw CLI
	 */
	convertSvgToExcalidraw(svgContent) {
		try {
			const result = execSync(`node "${svgToExcalidrawCLI}" -`, {
				input: svgContent,
				encoding: 'utf-8',
				maxBuffer: 10 * 1024 * 1024
			});

			return JSON.parse(result);
		} catch (error) {
			throw new Error(`svg-to-excalidraw conversion failed: ${error.message}`);
		}
	}

	/**
	 * Export a single shape to SVG file (Phase 1 POC)
	 */
	async exportShapeToFile(shapeName, outputPath) {
		console.log(`Exporting: ${shapeName}`);

		try {
			// Export shape as SVG
			const svgContent = await this.exportShapeAsSvg(shapeName);

			// Write to file
			writeFileSync(outputPath, svgContent);
			console.log(`  ✓ Saved to: ${outputPath}`);

			return true;
		} catch (error) {
			console.error(`  ✗ Error: ${error.message}`);
			return false;
		}
	}

	/**
	 * Enumerate shapes from a namespace
	 */
	async enumerateShapes(namespace) {
		const shapes = await this.page.evaluate((ns) => {
			const shapeList = [];

			// Check mxCellRenderer's registered shapes
			if (window.mxCellRenderer && window.mxCellRenderer.defaultShapes) {
				for (const key in window.mxCellRenderer.defaultShapes) {
					if (key.startsWith(ns + '.')) {
						shapeList.push(key);
					}
				}
			}

			return shapeList;
		}, namespace);

		return shapes;
	}

	/**
	 * Export Misc palette shapes to SVG files
	 */
	async exportMiscShapes(outputDir, prefix) {
		console.log(`\nExporting Misc shapes...`);

		// Get list of Misc shapes from our dimensions file
		const miscShapeNames = Object.keys(MISC_DIMENSIONS);
		console.log(`  Found ${miscShapeNames.length} Misc shapes in sidebar definition\n`);

		if (miscShapeNames.length === 0) {
			throw new Error(`No Misc shapes found. Run parse-misc-dimensions.js first.`);
		}

		let successCount = 0;

		for (let i = 0; i < miscShapeNames.length; i++) {
			const shapeName = miscShapeNames[i];
			const fileName = `${prefix}-${this.sanitizeName(shapeName)}.svg`;
			const filePath = path.join(outputDir, fileName);

			const success = await this.exportShapeToFile(shapeName, filePath);
			if (success) {
				successCount++;
			}

			if ((i + 1) % 5 === 0) {
				console.log(`  Progress: ${i + 1}/${miscShapeNames.length} shapes`);
			}
		}

		console.log(`\n  ✓ Exported ${successCount}/${miscShapeNames.length} shapes to ${outputDir}`);

		return successCount;
	}

	/**
	 * Export multiple shapes from a namespace to SVG files
	 */
	async exportNamespace(namespace, outputDir, prefix) {
		console.log(`\nExporting ${namespace}.* shapes...`);

		// Enumerate shapes from mxCellRenderer
		const registeredShapes = await this.enumerateShapes(namespace);
		console.log(`  Found ${registeredShapes.length} registered shapes in mxCellRenderer`);

		// Filter to only shapes that have sidebar definitions
		// (shapes without sidebar definitions aren't in the UI panel)
		const shapes = registeredShapes.filter(shapeName => {
			const hasSidebarDef = !!(SHAPE_DIMENSIONS[shapeName] || MISC_DIMENSIONS[shapeName]);
			if (!hasSidebarDef) {
				console.log(`  Skipping ${shapeName} (not in sidebar panel)`);
			}
			return hasSidebarDef;
		});

		console.log(`  Exporting ${shapes.length} shapes that appear in sidebar panel\n`);

		if (shapes.length === 0) {
			throw new Error(`No shapes found in namespace with sidebar definitions: ${namespace}`);
		}

		let successCount = 0;

		for (let i = 0; i < shapes.length; i++) {
			const shapeName = shapes[i];
			const shortName = shapeName.replace(namespace + '.', '');
			const fileName = `${prefix}-${this.sanitizeName(shortName)}.svg`;
			const filePath = path.join(outputDir, fileName);

			const success = await this.exportShapeToFile(shapeName, filePath);
			if (success) {
				successCount++;
			}

			if ((i + 1) % 5 === 0) {
				console.log(`  Progress: ${i + 1}/${shapes.length} shapes`);
			}
		}

		console.log(`\n  ✓ Exported ${successCount}/${shapes.length} shapes to ${outputDir}`);

		return successCount;
	}
}

/**
 * Main CLI function
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
		console.log(`
Draw.io MX Shape to SVG Exporter
==================================

Phase 1: Export MX shapes to SVG files
Uses Playwright to automate draw.io web app for accurate rendering

Usage: node mx-shape-to-excalidrawlib.js [command] [--output=DIR]

Commands:
  test           - Test single shape export (mxgraph.basic.rect)
  basic          - Export all basic shapes (~31 shapes)
  mockup         - Export all mockup shapes (~50 shapes)
  misc           - Export Misc palette shapes (curlyBracket, isoCube, etc.)
  list           - List available shapes in a namespace (e.g., list mxgraph.basic)

Options:
  --output=DIR   Output directory (default: ./mx-shape-svgs)
  --help, -h     Show this help message

Examples:
  node mx-shape-to-excalidrawlib.js test
  node mx-shape-to-excalidrawlib.js basic
  node mx-shape-to-excalidrawlib.js list mxgraph.basic
		`);
		process.exit(0);
	}

	const command = args[0];
	const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || './mx-shape-svgs';

	// Create output directory
	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	const converter = new MxShapeToExcalidrawConverter();

	try {
		await converter.initialize();

		switch (command) {
			case 'test':
				console.log('='.repeat(60));
				console.log('PHASE 1: PROOF OF CONCEPT - SVG Export');
				console.log('='.repeat(60) + '\n');

				const testPath = path.join(outputDir, 'basic-rect.svg');
				const success = await converter.exportShapeToFile('mxgraph.basic.rect', testPath);

				if (success) {
					console.log(`\n✓ Test completed successfully!`);
					console.log(`\nNext steps:`);
					console.log(`  1. Open ${testPath} in a browser or image viewer`);
					console.log(`  2. Verify the rectangle shape displays correctly`);
					console.log(`  3. If successful, run: node mx-shape-to-excalidrawlib.js list mxgraph.basic`);
				}
				break;

			case 'list':
				const namespace = args[1] || 'mxgraph.basic';
				console.log(`\nEnumerating shapes in namespace: ${namespace}`);
				const shapes = await converter.enumerateShapes(namespace);

				console.log(`\nFound ${shapes.length} shapes:`);
				shapes.forEach((shape, i) => {
					console.log(`  ${i + 1}. ${shape}`);
				});
				break;

			case 'basic':
				console.log('='.repeat(60));
				console.log('PHASE 2: BASIC SHAPES - SVG Export');
				console.log('='.repeat(60) + '\n');

				await converter.exportNamespace('mxgraph.basic', outputDir, 'basic');
				break;

			case 'mockup':
				console.log('='.repeat(60));
				console.log('PHASE 3: MOCKUP SHAPES - SVG Export');
				console.log('='.repeat(60) + '\n');

				await converter.exportNamespace('mxgraph.mockup', outputDir, 'mockup');
				break;

			case 'misc':
				console.log('='.repeat(60));
				console.log('MISC PALETTE - SVG Export');
				console.log('='.repeat(60) + '\n');

				await converter.exportMiscShapes(outputDir, 'misc');
				break;

			default:
				console.error(`Unknown command: ${command}`);
				console.error(`Use --help for usage information`);
				process.exit(1);
		}

		console.log('\n' + '='.repeat(60));
		console.log('EXPORT COMPLETE');
		console.log('='.repeat(60));

	} catch (error) {
		console.error('\n✗ Fatal error:', error.message);
		console.error(error.stack);
		process.exit(1);
	} finally {
		await converter.cleanup();
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(error => {
		console.error('Fatal error:', error);
		process.exit(1);
	});
}

export { MxShapeToExcalidrawConverter };
