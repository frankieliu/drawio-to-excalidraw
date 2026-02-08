/**
 * XML to SVG Converter Library
 * Converts draw.io XML stencil shapes to SVG format
 * Based on the mxStencil conversion logic from draw.io
 *
 * Shared library used by xml-to-svg.js and stencil-to-excalidrawlib.js
 */

import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify((xml, options, callback) => {
	// Handle both 2 and 3 argument forms
	if (typeof options === 'function') {
		callback = options;
		options = {
			preserveChildrenOrder: true,
			explicitChildren: true,
			charsAsChildren: false
		};
	}
	parseString(xml, options, callback);
});

class XmlToSvgConverter {
	constructor() {
		this.path = [];
	}

	/**
	 * Extract color style mappings from shape attributes
	 * These are used in mockup shapes like fillColor2=#ffffff;fillColor3=#ffca8c
	 */
	extractColorMappings(shapeNode) {
		const colorMap = {};
		const attrs = shapeNode.$;

		if (!attrs) return colorMap;

		// Extract actual color values from attributes
		// Pattern: fillColor2="#ffffff" or as part of attribute string
		for (const [key, value] of Object.entries(attrs)) {
			if (key.match(/^(fillColor|strokeColor)\d+$/)) {
				colorMap[key] = value;
			}
		}

		return colorMap;
	}

	/**
	 * Parse a shape element from XML and convert to SVG
	 */
	async convertShape(shapeNode) {
		const name = shapeNode.$.name || 'shape';
		const w = parseFloat(shapeNode.$.w || 100);
		const h = parseFloat(shapeNode.$.h || 100);

		// Extract color mappings for mockup shapes
		const colorMap = this.extractColorMappings(shapeNode);

		// Initialize SVG
		const svgParts = [
			`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`
		];

		// Process background and foreground (use explicitChildren structure)
		if (shapeNode.$$) {
			for (const child of shapeNode.$$) {
				if (child['#name'] === 'background' && child.$$) {
					const bgSvg = this.processNodeList(child.$$, w, h, 1, 1, colorMap);
					if (bgSvg) svgParts.push(bgSvg);
				} else if (child['#name'] === 'foreground' && child.$$) {
					const fgSvg = this.processNodeList(child.$$, w, h, 1, 1, colorMap);
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
	processNodeList(children, w, h, sx, sy, colorMap = {}) {
		const svgParts = [];
		let currentPath = [];
		let currentShape = null; // Store current shape waiting for render command
		let currentStyle = {
			fill: '#e0e0e0',
			stroke: '#000000',
			strokeWidth: 1,
			fillOpacity: 1,
			strokeOpacity: 1
		};
		let textStyle = {
			fontSize: 12,
			fontColor: '#000000',
			fontStyle: 'normal',
			fontWeight: 'normal'
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
					// Store rect for later rendering
					currentShape = `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" STYLE_PLACEHOLDER/>`;
					break;

				case 'roundrect':
					const rrx = parseFloat(attrs.x || 0) * sx;
					const rry = parseFloat(attrs.y || 0) * sy;
					const rrw = parseFloat(attrs.w || 0) * sx;
					const rrh = parseFloat(attrs.h || 0) * sy;
					let arcsize = parseFloat(attrs.arcsize || 0.1);
					// In draw.io, arcsize is a percentage (stored as 0-100+)
					// Convert to decimal if > 1
					if (arcsize > 1) {
						arcsize = arcsize / 100;
					}
					const radius = Math.min(rrw, rrh) * arcsize;
					// Store roundrect for later rendering
					currentShape = `<rect x="${rrx}" y="${rry}" width="${rrw}" height="${rrh}" rx="${radius}" ry="${radius}" STYLE_PLACEHOLDER/>`;
					break;

				case 'ellipse':
					const ex = parseFloat(attrs.x || 0) * sx;
					const ey = parseFloat(attrs.y || 0) * sy;
					const ew = parseFloat(attrs.w || 0) * sx;
					const eh = parseFloat(attrs.h || 0) * sy;
					const ecx = ex + ew / 2;
					const ecy = ey + eh / 2;
					// Store ellipse for later rendering
					currentShape = `<ellipse cx="${ecx}" cy="${ecy}" rx="${ew/2}" ry="${eh/2}" STYLE_PLACEHOLDER/>`;
					break;

				case 'fillstroke':
					if (currentPath.length > 0) {
						svgParts.push(this.buildPathElement(currentPath, currentStyle));
						currentPath = [];
						inPath = false;
					} else if (currentShape) {
						// Render shape with fill and stroke
						svgParts.push(currentShape.replace('STYLE_PLACEHOLDER', this.styleToAttr(currentStyle)));
						currentShape = null;
					}
					break;

				case 'fill':
					if (currentPath.length > 0) {
						const fillStyle = { ...currentStyle, stroke: 'none' };
						svgParts.push(this.buildPathElement(currentPath, fillStyle));
						currentPath = [];
						inPath = false;
					} else if (currentShape) {
						// Render shape with fill only
						const fillStyle = { ...currentStyle, stroke: 'none' };
						svgParts.push(currentShape.replace('STYLE_PLACEHOLDER', this.styleToAttr(fillStyle)));
						currentShape = null;
					}
					break;

				case 'stroke':
					if (currentPath.length > 0) {
						const strokeStyle = { ...currentStyle, fill: 'none' };
						svgParts.push(this.buildPathElement(currentPath, strokeStyle));
						currentPath = [];
						inPath = false;
					} else if (currentShape) {
						// Render shape with stroke only
						const strokeStyle = { ...currentStyle, fill: 'none' };
						svgParts.push(currentShape.replace('STYLE_PLACEHOLDER', this.styleToAttr(strokeStyle)));
						currentShape = null;
					}
					break;

				case 'strokecolor':
					let color = attrs.color || '#000000';
					// Check for default attribute (used in mockup shapes)
					const defaultStrokeColor = attrs.default;
					// Resolve color variable if it exists in colorMap, or use default, or use color
					if (colorMap[color]) {
						color = colorMap[color];
					} else if (defaultStrokeColor) {
						color = defaultStrokeColor;
					}
					currentStyle.stroke = color;
					break;

				case 'fillcolor':
					let fillColor = attrs.color || '#ffffff';
					// Check for default attribute (used in mockup shapes)
					const defaultFillColor = attrs.default;
					// Resolve color variable if it exists in colorMap, or use default, or use color
					if (colorMap[fillColor]) {
						fillColor = colorMap[fillColor];
					} else if (defaultFillColor) {
						fillColor = defaultFillColor;
					}
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

				case 'fontsize':
					textStyle.fontSize = parseFloat(attrs.size || 12);
					break;

				case 'fontcolor':
					let fontColor = attrs.color || '#000000';
					// Check for default attribute
					const defaultFontColor = attrs.default;
					// Resolve color variable if it exists in colorMap, or use default, or use color
					if (colorMap[fontColor]) {
						fontColor = colorMap[fontColor];
					} else if (defaultFontColor) {
						fontColor = defaultFontColor;
					}
					textStyle.fontColor = fontColor;
					break;

				case 'fontstyle':
					// style="1" means bold, style="2" means italic, style="3" means bold+italic
					const style = parseInt(attrs.style || 0);
					if (style & 1) textStyle.fontWeight = 'bold';
					if (style & 2) textStyle.fontStyle = 'italic';
					break;

				case 'text':
					const textStr = attrs.str || '';
					const tx = parseFloat(attrs.x || 0) * sx;
					const ty = parseFloat(attrs.y || 0) * sy;
					const align = attrs.align || 'left';
					const valign = attrs.valign || 'top';

					// Convert valign to SVG dominant-baseline
					let dominantBaseline = 'hanging';
					if (valign === 'middle') dominantBaseline = 'middle';
					else if (valign === 'bottom') dominantBaseline = 'auto';

					// Convert align to SVG text-anchor
					let textAnchor = 'start';
					if (align === 'center') textAnchor = 'middle';
					else if (align === 'right') textAnchor = 'end';

					svgParts.push(`<text x="${tx}" y="${ty}" fill="${textStyle.fontColor}" font-size="${textStyle.fontSize}" font-style="${textStyle.fontStyle}" font-weight="${textStyle.fontWeight}" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${textStr}</text>`);
					break;
			}
		}

		// Close any remaining path or shape
		if (currentPath.length > 0) {
			svgParts.push(this.buildPathElement(currentPath, currentStyle));
		}
		if (currentShape) {
			// Render any pending shape with fillstroke by default
			svgParts.push(currentShape.replace('STYLE_PLACEHOLDER', this.styleToAttr(currentStyle)));
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

export { XmlToSvgConverter, parseXml };
