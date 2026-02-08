#!/usr/bin/env node

/**
 * XML to SVG Converter
 * Converts draw.io XML stencil shapes to SVG format
 * Based on the mxStencil conversion logic from draw.io
 */

import { readFileSync, writeFileSync } from 'fs';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify((xml, callback) => {
	parseString(xml, {
		preserveChildrenOrder: true,
		explicitChildren: true,
		charsAsChildren: false
	}, callback);
});

class XmlToSvgConverter {
	constructor() {
		this.path = [];
	}

	/**
	 * Parse a shape element from XML and convert to SVG
	 */
	async convertShape(shapeNode) {
		const name = shapeNode.$.name || 'shape';
		const w = parseFloat(shapeNode.$.w || 100);
		const h = parseFloat(shapeNode.$.h || 100);

		// Initialize SVG
		const svgParts = [
			`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`
		];

		// Process background and foreground (use explicitChildren structure)
		if (shapeNode.$$) {
			for (const child of shapeNode.$$) {
				if (child['#name'] === 'background' && child.$$) {
					const bgSvg = this.processNodeList(child.$$, w, h, 1, 1);
					if (bgSvg) svgParts.push(bgSvg);
				} else if (child['#name'] === 'foreground' && child.$$) {
					const fgSvg = this.processNodeList(child.$$, w, h, 1, 1);
					if (fgSvg) svgParts.push(fgSvg);
				}
			}
		}

		svgParts.push('</svg>');

		return {
			name,
			width: w,
			height: h,
			svg: svgParts.join('\n')
		};
	}

	/**
	 * Process a list of drawing nodes (background or foreground)
	 * Now works with children array in document order
	 */
	processNodeList(children, w, h, sx, sy) {
		const svgParts = [];
		let currentPath = [];
		let currentStyle = {
			fill: '#e0e0e0',
			stroke: '#000000',
			strokeWidth: 1,
			fillOpacity: 1,
			strokeOpacity: 1
		};
		let inPath = false;

		// Iterate through child elements in document order
		for (const node of children) {
			const nodeName = node['#name'];
			const attrs = node.$ || {};

			switch (nodeName) {
				case 'path':
					// Start new path
					inPath = true;
					currentPath = [];
					// Process path children in order
					if (node.$$) {
						this.processPathChildren(node.$$, currentPath, sx, sy);
					}
					break;

				case 'move':
					if (inPath) {
						const x = parseFloat(attrs.x || 0) * sx;
						const y = parseFloat(attrs.y || 0) * sy;
						currentPath.push(`M ${x} ${y}`);
					}
					break;

				case 'line':
					if (inPath) {
						const x = parseFloat(attrs.x || 0) * sx;
						const y = parseFloat(attrs.y || 0) * sy;
						currentPath.push(`L ${x} ${y}`);
					}
					break;

				case 'curve':
					if (inPath) {
						const x1 = parseFloat(attrs.x1 || 0) * sx;
						const y1 = parseFloat(attrs.y1 || 0) * sy;
						const x2 = parseFloat(attrs.x2 || 0) * sx;
						const y2 = parseFloat(attrs.y2 || 0) * sy;
						const x3 = parseFloat(attrs.x3 || 0) * sx;
						const y3 = parseFloat(attrs.y3 || 0) * sy;
						currentPath.push(`C ${x1} ${y1} ${x2} ${y2} ${x3} ${y3}`);
					}
					break;

				case 'quad':
					if (inPath) {
						const x1 = parseFloat(attrs.x1 || 0) * sx;
						const y1 = parseFloat(attrs.y1 || 0) * sy;
						const x2 = parseFloat(attrs.x2 || 0) * sx;
						const y2 = parseFloat(attrs.y2 || 0) * sy;
						currentPath.push(`Q ${x1} ${y1} ${x2} ${y2}`);
					}
					break;

				case 'arc':
					if (inPath) {
						const rx = parseFloat(attrs.rx || 0) * sx;
						const ry = parseFloat(attrs.ry || 0) * sy;
						const xAxisRotation = parseFloat(attrs['x-axis-rotation'] || 0);
						const largeArc = parseInt(attrs['large-arc-flag'] || 0);
						const sweep = parseInt(attrs['sweep-flag'] || 0);
						const x = parseFloat(attrs.x || 0) * sx;
						const y = parseFloat(attrs.y || 0) * sy;
						currentPath.push(`A ${rx} ${ry} ${xAxisRotation} ${largeArc} ${sweep} ${x} ${y}`);
					}
					break;

				case 'close':
					if (inPath) {
						currentPath.push('Z');
					}
					break;

				case 'rect':
					const rx = parseFloat(attrs.x || 0) * sx;
					const ry = parseFloat(attrs.y || 0) * sy;
					const rw = parseFloat(attrs.w || 0) * sx;
					const rh = parseFloat(attrs.h || 0) * sy;
					svgParts.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" ${this.styleToAttr(currentStyle)}/>`);
					break;

				case 'roundrect':
					const rrx = parseFloat(attrs.x || 0) * sx;
					const rry = parseFloat(attrs.y || 0) * sy;
					const rrw = parseFloat(attrs.w || 0) * sx;
					const rrh = parseFloat(attrs.h || 0) * sy;
					const arcsize = parseFloat(attrs.arcsize || 0.1);
					const radius = Math.min(rrw, rrh) * arcsize;
					svgParts.push(`<rect x="${rrx}" y="${rry}" width="${rrw}" height="${rrh}" rx="${radius}" ry="${radius}" ${this.styleToAttr(currentStyle)}/>`);
					break;

				case 'ellipse':
					const ex = parseFloat(attrs.x || 0) * sx;
					const ey = parseFloat(attrs.y || 0) * sy;
					const ew = parseFloat(attrs.w || 0) * sx;
					const eh = parseFloat(attrs.h || 0) * sy;
					const ecx = ex + ew / 2;
					const ecy = ey + eh / 2;
					svgParts.push(`<ellipse cx="${ecx}" cy="${ecy}" rx="${ew/2}" ry="${eh/2}" ${this.styleToAttr(currentStyle)}/>`);
					break;

				case 'fillstroke':
					if (currentPath.length > 0) {
						svgParts.push(this.buildPathElement(currentPath, currentStyle));
						currentPath = [];
						inPath = false;
					}
					break;

				case 'fill':
					if (currentPath.length > 0) {
						const fillStyle = { ...currentStyle, stroke: 'none' };
						svgParts.push(this.buildPathElement(currentPath, fillStyle));
						currentPath = [];
						inPath = false;
					}
					break;

				case 'stroke':
					if (currentPath.length > 0) {
						const strokeStyle = { ...currentStyle, fill: 'none' };
						svgParts.push(this.buildPathElement(currentPath, strokeStyle));
						currentPath = [];
						inPath = false;
					}
					break;

				case 'strokecolor':
					const color = attrs.color || '#000000';
					currentStyle.stroke = color;
					break;

				case 'fillcolor':
					const fillColor = attrs.color || '#ffffff';
					currentStyle.fill = fillColor;
					break;

				case 'strokewidth':
					currentStyle.strokeWidth = parseFloat(attrs.width || 1);
					break;

				case 'alpha':
					const alpha = parseFloat(attrs.alpha || 1);
					currentStyle.fillOpacity = alpha;
					currentStyle.strokeOpacity = alpha;
					break;

				case 'fillalpha':
					currentStyle.fillOpacity = parseFloat(attrs.alpha || 1);
					break;

				case 'strokealpha':
					currentStyle.strokeOpacity = parseFloat(attrs.alpha || 1);
					break;
			}
		}

		// Close any remaining path
		if (currentPath.length > 0) {
			svgParts.push(this.buildPathElement(currentPath, currentStyle));
		}

		return svgParts.join('\n');
	}

	/**
	 * Process path children in document order
	 */
	processPathChildren(children, pathData, sx, sy) {
		for (const node of children) {
			const nodeName = node['#name'];
			const attrs = node.$ || {};

			switch (nodeName) {
				case 'move':
					const mx = parseFloat(attrs.x || 0) * sx;
					const my = parseFloat(attrs.y || 0) * sy;
					pathData.push(`M ${mx} ${my}`);
					break;

				case 'line':
					const lx = parseFloat(attrs.x || 0) * sx;
					const ly = parseFloat(attrs.y || 0) * sy;
					pathData.push(`L ${lx} ${ly}`);
					break;

				case 'curve':
					const cx1 = parseFloat(attrs.x1 || 0) * sx;
					const cy1 = parseFloat(attrs.y1 || 0) * sy;
					const cx2 = parseFloat(attrs.x2 || 0) * sx;
					const cy2 = parseFloat(attrs.y2 || 0) * sy;
					const cx3 = parseFloat(attrs.x3 || 0) * sx;
					const cy3 = parseFloat(attrs.y3 || 0) * sy;
					pathData.push(`C ${cx1} ${cy1} ${cx2} ${cy2} ${cx3} ${cy3}`);
					break;

				case 'quad':
					const qx1 = parseFloat(attrs.x1 || 0) * sx;
					const qy1 = parseFloat(attrs.y1 || 0) * sy;
					const qx2 = parseFloat(attrs.x2 || 0) * sx;
					const qy2 = parseFloat(attrs.y2 || 0) * sy;
					pathData.push(`Q ${qx1} ${qy1} ${qx2} ${qy2}`);
					break;

				case 'arc':
					const arx = parseFloat(attrs.rx || 0) * sx;
					const ary = parseFloat(attrs.ry || 0) * sy;
					const arot = parseFloat(attrs['x-axis-rotation'] || 0);
					const alarge = parseInt(attrs['large-arc-flag'] || 0);
					const asweep = parseInt(attrs['sweep-flag'] || 0);
					const ax = parseFloat(attrs.x || 0) * sx;
					const ay = parseFloat(attrs.y || 0) * sy;
					pathData.push(`A ${arx} ${ary} ${arot} ${alarge} ${asweep} ${ax} ${ay}`);
					break;

				case 'close':
					pathData.push('Z');
					break;
			}
		}
	}

	/**
	 * Build a path element with style
	 */
	buildPathElement(pathData, style) {
		if (!pathData || pathData.length === 0) return '';
		const d = pathData.join(' ');
		return `<path d="${d}" ${this.styleToAttr(style)}/>`;
	}

	/**
	 * Convert style object to SVG attributes
	 */
	styleToAttr(style) {
		const attrs = [];
		if (style.fill !== 'none') {
			attrs.push(`fill="${style.fill}"`);
			if (style.fillOpacity !== 1) {
				attrs.push(`fill-opacity="${style.fillOpacity}"`);
			}
		} else {
			attrs.push('fill="none"');
		}
		if (style.stroke !== 'none') {
			attrs.push(`stroke="${style.stroke}"`);
			attrs.push(`stroke-width="${style.strokeWidth}"`);
			if (style.strokeOpacity !== 1) {
				attrs.push(`stroke-opacity="${style.strokeOpacity}"`);
			}
		}
		return attrs.join(' ');
	}
}

/**
 * Main CLI function
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length < 1) {
		console.log('Usage: node xml-to-svg.js <input.xml> [output.svg]');
		console.log('  Converts a draw.io XML stencil file to SVG format');
		console.log('  If the XML contains multiple shapes, creates multiple SVG files');
		process.exit(1);
	}

	const inputFile = args[0];
	const outputFile = args[1];

	try {
		// Read XML file
		const xmlContent = readFileSync(inputFile, 'utf-8');

		// Parse XML
		const result = await parseXml(xmlContent);

		// Get shapes (with explicitChildren, they're in $$)
		let shapes = [];
		if (result.shapes && result.shapes.$$) {
			shapes = result.shapes.$$.filter(child => child['#name'] === 'shape');
		} else if (result.shape) {
			shapes = Array.isArray(result.shape) ? result.shape : [result.shape];
		}

		if (shapes.length === 0) {
			console.error('No shapes found in XML file');
			process.exit(1);
		}

		const converter = new XmlToSvgConverter();

		// Convert each shape
		for (let i = 0; i < shapes.length; i++) {
			const shapeData = await converter.convertShape(shapes[i]);

			let outFile;
			if (outputFile) {
				if (shapes.length === 1) {
					outFile = outputFile;
				} else {
					// Multiple shapes - create multiple files
					const basename = outputFile.replace(/\.svg$/, '');
					outFile = `${basename}_${i}_${shapeData.name.replace(/\s+/g, '_')}.svg`;
				}
			} else {
				const basename = inputFile.replace(/\.xml$/, '');
				if (shapes.length === 1) {
					outFile = `${basename}.svg`;
				} else {
					outFile = `${basename}_${i}_${shapeData.name.replace(/\s+/g, '_')}.svg`;
				}
			}

			writeFileSync(outFile, shapeData.svg);
			console.log(`Created: ${outFile} (${shapeData.width}x${shapeData.height})`);
		}

		console.log(`\nConverted ${shapes.length} shape(s) successfully!`);

	} catch (error) {
		console.error('Error converting XML to SVG:', error.message);
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { XmlToSvgConverter };
