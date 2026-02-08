# Architecture

## Overview

The draw.io to Excalidraw converter follows a three-stage pipeline:

```
XML Stencil → XML Parser → SVG Generator → Excalidraw Elements
```

## Data Flow

### Stage 1: XML Parsing

Input: Draw.io XML stencil files
- Uses `xml2js` library to parse XML
- Extracts shape definitions with metadata (name, width, height)
- Processes path commands (move, line, curve, quad, arc, close)
- Extracts style information (fill, stroke, width)

### Stage 2: SVG Generation

The `XmlToSvgConverter` class processes XML nodes:

**Path Commands:**
- `<move>` → SVG `M` command
- `<line>` → SVG `L` command
- `<curve>` → SVG `C` command (cubic Bézier)
- `<quad>` → SVG `Q` command (quadratic Bézier)
- `<arc>` → SVG `A` command (elliptical arc)
- `<close>` → SVG `Z` command

**Primitives:**
- `<rect>` → SVG `<rect>` element
- `<roundrect>` → SVG `<rect>` with `rx`/`ry` attributes
- `<ellipse>` → SVG `<ellipse>` element

**Styles:**
- `<fillstroke>` → Apply both fill and stroke
- `<fill>` → Apply fill only (stroke: none)
- `<stroke>` → Apply stroke only (fill: none)
- `<strokecolor>` → Set stroke color
- `<fillcolor>` → Set fill color
- `<strokewidth>` → Set stroke width
- `<alpha>`, `<fillalpha>`, `<strokealpha>` → Set opacity

Output: SVG files with proper styling

### Stage 3: Excalidraw Conversion

The `XmlToExcalidrawConverter` class:

1. **Parses SVG path data** using regex
2. **Converts to point arrays**:
   - M/m → Move to point
   - L/l → Line to point
   - C/c → Cubic curve end point
   - Q/q → Quadratic curve end point
   - A/a → Arc end point
   - Z/z → Close path (connect to first point)

3. **Calculates bounding box**:
   - Find min/max X and Y coordinates
   - Compute width and height

4. **Creates Excalidraw freedraw element**:
```javascript
{
  type: 'freedraw',
  points: [...], // Normalized relative to top-left
  pressures: [...], // Simulated pressure for each point
  x, y, width, height,
  strokeColor, backgroundColor,
  strokeWidth, fillStyle, strokeStyle,
  // ... metadata
}
```

5. **Packages as library item**:
```javascript
{
  id: 'drawio_N',
  status: 'unpublished',
  created: timestamp,
  name: 'Shape Name',
  elements: [element]
}
```

Output: `.excalidrawlib` JSON file

## File Structure

```
drawio-to-excalidraw/
├── xml-to-svg.js            # Core SVG converter
│   └── XmlToSvgConverter    # Class handling XML → SVG
├── xml-to-excalidraw.js     # Core Excalidraw converter
│   └── XmlToExcalidrawConverter  # Class handling XML → Excalidraw
├── package.json
├── README.md
├── examples/                # Sample inputs/outputs
└── docs/                    # Documentation
```

## Key Classes

### XmlToSvgConverter

**Methods:**
- `convertShape(shapeNode)` - Main entry point for converting a shape
- `processNodeList(nodeContainer, w, h, sx, sy)` - Process background/foreground nodes
- `processPathNode(pathNode, pathData, sx, sy)` - Extract path commands
- `buildPathElement(pathData, style)` - Create SVG path element
- `styleToAttr(style)` - Convert style object to SVG attributes

**State:**
- Tracks current path data
- Maintains style context (fill, stroke, width, opacity)

### XmlToExcalidrawConverter

**Methods:**
- `convertDirectory(inputDir, outputFile)` - Main entry point
- `convertXmlFile(filePath)` - Process single XML file
- `convertShape(shapeNode)` - Convert single shape
- `createElementFromSVG(shapeData)` - Create Excalidraw element
- `parsePathToPoints(pathData)` - Convert SVG path to points
- `getXmlFiles(dir)` - Recursively find XML files

**State:**
- Uses XmlToSvgConverter internally
- Maintains library item collection

## Draw.io XML Format

Example:
```xml
<shapes name="mxgraph.basic">
  <shape aspect="variable" h="92" name="4 Point Star" w="92">
    <background>
      <path>
        <move x="46" y="0"/>
        <line x="56" y="36"/>
        <close/>
      </path>
    </background>
    <foreground>
      <fillstroke/>
    </foreground>
  </shape>
</shapes>
```

## Excalidraw Library Format

```json
{
  "type": "excalidrawlib",
  "version": 2,
  "source": "drawio-converter",
  "libraryItems": [
    {
      "id": "string",
      "status": "unpublished",
      "created": 1234567890,
      "name": "string",
      "elements": [
        {
          "type": "freedraw",
          "points": [[x, y], ...],
          "pressures": [0.5, ...],
          "x": 0, "y": 0,
          "width": 100, "height": 100,
          "strokeColor": "#000000",
          "backgroundColor": "#e0e0e0",
          "strokeWidth": 1,
          // ... more properties
        }
      ]
    }
  ]
}
```

## Design Decisions

### Why freedraw elements?

Excalidraw supports several element types:
- rectangle, diamond, ellipse - parametric shapes
- line, arrow - linear elements
- freedraw - arbitrary paths

We chose **freedraw** because:
1. Preserves arbitrary shape outlines from draw.io
2. No need to detect/convert to parametric forms
3. Simple, universal conversion path
4. Works for complex paths with curves

### Why not use svg-to-excalidraw?

The npm package `svg-to-excalidraw` exists but:
1. Requires browser/DOM environment (uses DOMParser)
2. Not designed for Node.js CLI usage
3. Our direct conversion is simpler and faster
4. Better control over output format

### Coordinate normalization

Points are normalized relative to the bounding box top-left corner:
```javascript
points: points.map(p => [p[0] - minX, p[1] - minY])
```

This ensures shapes are positioned correctly when inserted into Excalidraw.

## Performance

Typical conversion speeds:
- Single XML file (30 shapes): ~100ms
- Full stencils directory (8,746 shapes): ~5-10 seconds

Memory usage:
- Peaks at ~200MB for full conversion
- Output file: ~48MB for 8,746 shapes

## Future Improvements

1. **Detect parametric shapes**: Recognize rectangles, circles, etc. and convert to native Excalidraw types
2. **Text support**: Extract and convert text elements
3. **Grouping**: Maintain shape groupings from draw.io
4. **Connectors**: Convert connection points to Excalidraw bindings
5. **Image support**: Handle image-based stencils
6. **Optimize output**: Compress point data, reduce file size
