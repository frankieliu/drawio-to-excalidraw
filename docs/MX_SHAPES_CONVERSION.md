# MX Shapes Conversion Guide

## Overview

This document describes the process for converting draw.io JavaScript-based mxGraph shapes to Excalidraw library format using headless browser automation.

## What Are MX Shapes?

MX shapes are JavaScript-based shapes in draw.io that require runtime execution to render. Unlike XML stencils (which are declarative SVG templates), MX shapes use dynamic JavaScript code to draw their geometry.

**Examples:**
- `mxgraph.basic.*` - Basic shapes (rectangle, ellipse, polygon, etc.)
- `mxgraph.mockup.*` - UI mockup components (buttons, forms, etc.)
- Misc palette shapes (curly brackets, isometric cubes, etc.)

## Architecture

The conversion process uses a 3-stage pipeline:

```
MX Shape (JavaScript) → Headless Browser Automation → SVG → svg-to-excalidraw CLI → Excalidraw Library
```

### Stage 1: Shape Dimension Extraction

**Purpose:** Extract default dimensions and styles from draw.io's sidebar definitions

**Scripts:**
- `parse-sidebar-dimensions.js` - Extracts Basic shapes from `Sidebar.prototype.addBasicPalette()`
- `parse-misc-dimensions.js` - Extracts Misc palette shapes from `Sidebar.prototype.addMiscPalette()`

**Output Files:**
- `shape-dimensions.json` - Basic shapes (mxgraph.basic.*) with dimensions and styleSuffix
- `misc-dimensions.json` - Misc palette shapes with complete style strings

**Example dimension entry:**
```json
{
  "mxgraph.basic.polygon": {
    "width": 120,
    "height": 120,
    "title": "Polygon",
    "styleSuffix": "polygon;polyCoords=[[0.25,0],[0.75,0],[1,0.25],[1,0.75],[0.75,1],[0.25,1],[0,0.75],[0,0.25]];"
  },
  "curlyBracket": {
    "width": 20,
    "height": 120,
    "title": "Left Curly Bracket",
    "style": "shape=curlyBracket;whiteSpace=wrap;html=1;rounded=1;labelPosition=left;verticalLabelPosition=middle;align=right;verticalAlign=middle;"
  }
}
```

### Stage 2: SVG Export via Browser Automation

**Purpose:** Use Playwright to automate draw.io and render shapes as SVG

**Script:** `mx-shape-to-excalidrawlib.js`

**Process:**
1. Launch headless Chromium browser
2. Load draw.io web app at `http://127.0.0.1:8080/?offline=1&splash=0&libs=0`
3. For each shape:
   - Look up dimensions and style from JSON files
   - Create mxGraph instance
   - Insert shape with correct style string
   - Extract rendered SVG from DOM
   - Save to file
4. Close browser

**Key Implementation Details:**

#### Shape Style String Construction

**For Basic shapes (mxgraph.basic.*):**
```javascript
// Use shape name + styleSuffix from sidebar
const style = 'shape=mxgraph.basic.polygon' + styleSuffix;
// Result: "shape=mxgraph.basic.polygon;polygon;polyCoords=[[0.25,0],...];"
```

**For Misc palette shapes:**
```javascript
// Use complete style string from sidebar
const style = sidebarStyle;
// Result: "shape=curlyBracket;whiteSpace=wrap;html=1;rounded=1;..."
```

#### Avoiding customParams Conflicts

The converter reads `customProperties` from shape instances to get default parameter values. However, these can conflict with sidebar styles.

**Critical logic:**
```javascript
// Only append customParams if we don't have complete sidebarStyle
if (customParams && !sidebarStyle) {
    styleString = styleString + ';' + customParams;
}
```

This prevents conflicts like:
- Sidebar style has `rounded=1` (use quadratic bezier curves)
- customParams has `rounded=true` (boolean, causes straight lines)
- Without the check, both get applied and customParams wins

#### Shape Variations

Some shapes have multiple variants in the sidebar (e.g., left vs right curly bracket). These are handled with suffixes:

```javascript
// First occurrence: "curlyBracket"
// Second occurrence: "curlyBracket_2"
// Third occurrence: "curlyBracket_3"
```

### Stage 3: SVG to Excalidraw Conversion

**Purpose:** Convert exported SVGs to Excalidraw library format

**Script:** `../svg-to-excalidraw/bin/svg-to-excalidraw.js` (existing tool)

**Note:** This stage is currently manual. Integration pending.

## Usage

### Prerequisites

1. Start local draw.io server:
```bash
cd ../drawio-desktop/drawio/src/main/webapp
python3 -m http.server 8080
```

2. Ensure dimension files exist:
```bash
# Extract Basic shapes dimensions
node parse-sidebar-dimensions.js

# Extract Misc palette dimensions
node parse-misc-dimensions.js
```

### Export Shapes

**Test single shape:**
```bash
node mx-shape-to-excalidrawlib.js test
# Exports mxgraph.basic.rect to mx-shape-svgs/basic-rect.svg
```

**Export Basic shapes (~31 shapes):**
```bash
node mx-shape-to-excalidrawlib.js basic
# Exports all mxgraph.basic.* shapes with sidebar definitions
# Output: mx-shape-svgs/basic-*.svg
```

**Export Misc palette (16 shapes):**
```bash
node mx-shape-to-excalidrawlib.js misc
# Exports all Misc palette shapes
# Output: misc-svgs/misc-*.svg
```

**List available shapes:**
```bash
node mx-shape-to-excalidrawlib.js list mxgraph.basic
```

**Export Mockup shapes (planned):**
```bash
node mx-shape-to-excalidrawlib.js mockup
# Not yet implemented
```

### Custom Output Directory

```bash
node mx-shape-to-excalidrawlib.js basic --output=./custom-dir
```

## How It Works: Technical Deep Dive

### 1. Draw.io API Access

The converter uses draw.io's internal API by evaluating JavaScript in the browser context:

```javascript
const svg = await page.evaluate(({ shapeName, defaults }) => {
    // Access draw.io globals
    const graph = new mxGraph(container);
    const parent = graph.getDefaultParent();

    // Insert shape
    graph.getModel().beginUpdate();
    const cell = graph.insertVertex(
        parent, null, '', 50, 50,
        defaults.width, defaults.height,
        defaults.styleString
    );
    graph.getModel().endUpdate();

    // Render and extract SVG
    graph.refresh();
    const state = graph.view.getState(cell);
    const shapeNode = state.shape.node;

    // Create clean SVG document
    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    newSvg.appendChild(shapeNode.cloneNode(true));

    return new XMLSerializer().serializeToString(newSvg);
}, { shapeName, defaults });
```

### 2. Adaptive Color Handling

Draw.io has an "adaptive colors" feature that changes stroke/fill based on theme. We disable this to get consistent output:

```javascript
// Override adaptive color validation
const originalValidateBackgroundStyles = mxGraphView.prototype.validateBackgroundStyles;
mxGraphView.prototype.validateBackgroundStyles = function() { return; };

// Set fixed color scheme
graph.getAdaptiveColors = function() {
    return { color: '#000000', fill: '#ffffff', stroke: '#000000' };
};

// Restore after rendering
mxGraphView.prototype.validateBackgroundStyles = originalValidateBackgroundStyles;
```

### 3. Shape Filtering

Only shapes that appear in the draw.io sidebar are exported. This prevents exporting internal/hidden shapes:

```javascript
const registeredShapes = await enumerateShapes('mxgraph.basic');
// Returns: ['mxgraph.basic.rect', 'mxgraph.basic.ellipse', 'mxgraph.basic.bendingArch', ...]

const shapes = registeredShapes.filter(shapeName => {
    const hasSidebarDef = !!(SHAPE_DIMENSIONS[shapeName] || MISC_DIMENSIONS[shapeName]);
    if (!hasSidebarDef) {
        console.log(`Skipping ${shapeName} (not in sidebar panel)`);
    }
    return hasSidebarDef;
});
// Returns: ['mxgraph.basic.rect', 'mxgraph.basic.ellipse', ...] (bendingArch excluded)
```

### 4. SVG Extraction and Cleanup

The converter extracts only the shape's SVG node (not the entire canvas):

```javascript
// Get the rendered shape's SVG node
const shapeNode = state.shape.node;

// Get bounding box for viewBox
const bbox = shapeNode.getBBox();

// Create clean SVG with proper viewBox
const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
const padding = 5;
newSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + 2*padding} ${bbox.height + 2*padding}`);
newSvg.setAttribute('width', bbox.width + 2*padding);
newSvg.setAttribute('height', bbox.height + 2*padding);

// Clone and append shape
const clonedShape = shapeNode.cloneNode(true);
newSvg.appendChild(clonedShape);
```

## Common Issues and Solutions

### Issue 1: Polygon Shape Renders Empty

**Symptom:** SVG file created but shows no visible shape

**Cause:** Missing `polyCoords` parameter that defines polygon vertices

**Solution:** Ensure `parse-sidebar-dimensions.js` captures the `styleSuffix` field:
```javascript
dimensions[shapeName] = {
    width, height, title,
    styleSuffix: shapeSuffix  // Must include polyCoords
};
```

### Issue 2: Curly Bracket Has Straight Lines Instead of Curves

**Symptom:** Generated SVG uses `L` (line) commands instead of `Q` (quadratic bezier) commands

**Cause:** `customParams` containing `rounded=true` conflicts with sidebar style's `rounded=1`

**Solution:** Only append customParams when no complete sidebarStyle exists:
```javascript
if (customParams && !sidebarStyle) {
    styleString = styleString + ';' + customParams;
}
```

**Technical explanation:**
- Misc shapes have complete style strings from sidebar including `rounded=1`
- Shape's `customProperties` define `rounded` with `defVal: true`
- Appending both creates: `rounded=1;rounded=true`
- JavaScript's `true` value causes straight line rendering
- Solution: Trust sidebar style for Misc shapes, only use customParams for Basic shapes

### Issue 3: Shape Not Found in Sidebar

**Symptom:** Error: "No sidebar definition found for shape: X"

**Cause:** Shape exists in `mxCellRenderer.defaultShapes` but not in sidebar palette

**Examples:**
- `mxgraph.basic.bendingArch` (actually in Infographic sidebar)
- `mxgraph.basic.numberedEntryVert`
- `mxgraph.basic.cross2`

**Solution:** These shapes are correctly skipped. They either:
1. Belong to a different sidebar category
2. Are internal/helper shapes not meant for direct use

### Issue 4: Draw.io Not Loading

**Symptom:** Timeout waiting for draw.io to initialize

**Causes:**
1. Local server not running
2. Wrong port/URL
3. Browser cache issues

**Solutions:**
```bash
# 1. Verify server is running
curl http://127.0.0.1:8080/

# 2. Check correct draw.io location
cd ../drawio-desktop/drawio/src/main/webapp
ls index.html  # Should exist

# 3. Clear browser cache (handled by headless mode)
```

## File Structure

```
drawio-to-excalidraw/
├── mx-shape-to-excalidrawlib.js    # Main converter script
├── parse-sidebar-dimensions.js      # Extract Basic shapes dimensions
├── parse-misc-dimensions.js         # Extract Misc palette dimensions
├── shape-dimensions.json            # Basic shapes metadata (generated)
├── misc-dimensions.json             # Misc shapes metadata (generated)
├── mx-shape-svgs/                   # Basic shapes SVG output
│   ├── basic-rect.svg
│   ├── basic-ellipse.svg
│   └── ...
└── misc-svgs/                       # Misc palette SVG output
    ├── misc-curlybracket.svg
    ├── misc-curlybracket_2.svg
    ├── misc-isocube.svg
    └── ...
```

## Completed Work

### Phase 1: Proof of Concept ✅
- Installed Playwright dependency
- Created `mx-shape-to-excalidrawlib.js` with browser automation
- Successfully tested with `mxgraph.basic.rect`
- Verified SVG export matches draw.io manual export

### Phase 2: Basic Shapes ✅
- Implemented shape enumeration from `mxCellRenderer.defaultShapes`
- Created `parse-sidebar-dimensions.js` to extract metadata
- Added `styleSuffix` support for parametric shapes (polygon)
- Implemented sidebar filtering (only export UI-visible shapes)
- Exported 31 Basic shapes with correct dimensions and styles

### Phase 3: Misc Palette ✅
- Created `parse-misc-dimensions.js` to extract Misc palette metadata
- Implemented shape variation handling (suffixes: _2, _3, etc.)
- Fixed curly bracket rendering (customParams conflict)
- Exported 16 Misc shapes including:
  - Left/Right Curly Brackets
  - Isometric Cubes
  - Double Ellipses
  - Crossbars
  - Partial Rectangles
  - Waypoint

## Next Steps

### Phase 4: Mockup Shapes (Not Started)
**Goal:** Export all UI mockup shapes (~50 shapes from 8 files)

**Tasks:**
1. Enumerate shapes from `mxgraph.mockup.*` namespace
2. Handle mockup-specific parameters (mainText, buttonText, etc.)
3. Test with various mockup categories:
   - Forms (searchBox, comboBox, etc.)
   - Buttons
   - Navigation
   - Containers
   - Text
   - Graphics
   - Markup
   - Misc

**Estimated shapes:** 50-60 shapes

### Phase 5: SVG to Excalidraw Integration (Not Started)
**Goal:** Automate conversion from SVG to .excalidrawlib format

**Tasks:**
1. Update converter to call `svg-to-excalidraw` CLI automatically
2. Generate library metadata (name, version, source)
3. Create unified output files:
   - `basic-js.excalidrawlib`
   - `misc.excalidrawlib`
   - `mockup.excalidrawlib`
4. Add deterministic ID generation (consistent with XML pipeline)
5. Test loading in Excalidraw application

### Phase 6: Additional Shape Categories (Future)
**Potential targets:**
- `mxgraph.ios7.*` - iOS 7 UI components
- `mxgraph.android.*` - Android UI components
- `mxgraph.infographic.*` - Infographic shapes
- Other JavaScript-based shape libraries

## Performance Considerations

**Current performance (headless browser):**
- Basic shapes (31): ~45 seconds
- Misc shapes (16): ~25 seconds
- Average: ~1.5 seconds per shape

**Bottlenecks:**
1. Browser launch/initialization: ~3 seconds
2. Per-shape rendering: ~1 second
3. SVG extraction and serialization: ~0.5 seconds

**Optimization opportunities:**
- Reuse browser instance across multiple shapes ✅ (already implemented)
- Batch multiple shapes in single page (complex)
- Parallel browser instances (limited benefit due to overhead)

## Limitations

### Current Limitations

1. **Colors:** Only default colors exported (no color variations)
   - Mitigation: Can be added later if needed

2. **Text Content:** Shapes exported without sample text
   - Mitigation: Excalidraw users can add text after insertion

3. **Shape Parameters:** Only default parameter values used
   - Example: Polygon always exports as octagon
   - Mitigation: Users can modify shapes in Excalidraw

4. **Manual Pipeline:** SVG to Excalidraw conversion not automated
   - Mitigation: Phase 5 will automate this

### Known Working Shapes

**Basic shapes (31 total):**
- Geometric: rectangle, rounded rectangle, ellipse, polygon, hexagon, triangle, rhombus, parallelogram, trapezoid
- Lines/Arrows: orEllipse, xorGate, corner, tee, cross
- Special: arc, partialRectangle, wave, callout, step

**Misc shapes (16 total):**
- Brackets: curlyBracket (left), curlyBracket_2 (right)
- Isometric: isoCube, isoCube2
- Ellipses: doubleEllipse, semiEllipse variants
- Other: crossbar, partialRectangle variants, waypoint

## References

- [Draw.io GitHub Repository](https://github.com/jgraph/drawio)
- [mxGraph Documentation](https://jgraph.github.io/mxgraph/)
- [Playwright Documentation](https://playwright.dev/)
- [Excalidraw Libraries](https://libraries.excalidraw.com/)
- Project plan: `~/.claude/plans/wondrous-swimming-parasol.md`

## Troubleshooting

### Enable Debug Output

```javascript
// In mx-shape-to-excalidrawlib.js
const browser = await chromium.launch({
    headless: false,  // Show browser window
    devtools: true    // Open DevTools
});
```

### Inspect Generated SVG

```bash
# View SVG in browser
open mx-shape-svgs/basic-polygon.svg

# Inspect SVG structure
cat mx-shape-svgs/basic-polygon.svg | grep '<path'
```

### Test Shape Rendering Manually

Use the debug scripts:
```bash
# Debug single shape
node debug-curlybracket.js

# Test with exact sidebar style
node test-curlybracket-rounded.js
```

## Contributing

When adding support for new shape categories:

1. **Check sidebar definition:**
   - Find the `addXxxPalette()` method in draw.io source
   - Identify dimension extraction pattern

2. **Create parser script:**
   - Copy `parse-misc-dimensions.js` as template
   - Update regex patterns for new palette
   - Generate `xxx-dimensions.json`

3. **Update converter:**
   - Load new dimensions file
   - Add export method (follow `exportMiscShapes()` pattern)
   - Add CLI command

4. **Test thoroughly:**
   - Export all shapes
   - Visual comparison with draw.io manual exports
   - Check for missing parameters or rendering issues

5. **Document:**
   - Update this file with new category
   - Add examples and known issues
   - Update TODO.md
