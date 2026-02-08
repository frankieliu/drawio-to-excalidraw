# TODO: mxGraph JavaScript Shape Conversion

## Phase 1: Understanding mxGraph to SVG Conversion ✅ (Completed)

- ✅ Identified XML Stencils vs JavaScript Shapes distinction
- ✅ Located JavaScript shape files in `shapes/*/*.js`
- ✅ Documented both shape systems in `SHAPE_SYSTEMS.md`
- ✅ Successfully converted 8,746+ XML stencil shapes to SVG

## Phase 2: mxGraph JavaScript Shape to SVG Conversion (Next Steps)

### Step 1: Understand draw.io's mxGraph to SVG Conversion

**Goal:** Reverse-engineer how draw.io renders JavaScript shapes to SVG

**Tasks:**
1. Find the draw.io code that converts mxGraph JavaScript shapes to SVG
   - Look in `../drawio-desktop/drawio/src/main/webapp/js/`
   - Search for mxGraph canvas rendering code
   - Identify how `mxShape.prototype.paintVertexShape()` generates SVG
   - Understand how style parameters (strokeColor2, fillColor2, etc.) are applied

2. Analyze the mxGraph canvas abstraction layer
   - Find `mxAbstractCanvas2D` and its SVG implementation
   - Understand how drawing commands (ellipse, rect, text, etc.) map to SVG
   - Document the canvas API used by shape `foreground()` and `background()` methods

3. Document key JavaScript shape patterns
   - How shapes read style parameters: `mxUtils.getValue(this.style, 'strokeColor2', '#008cff')`
   - How shapes use bounds: `this.bounds.width`, `this.bounds.height`
   - How dynamic positioning works (e.g., magnifying glass at `w - 15`)
   - Common drawing patterns across multiple shapes

### Step 2: Build mxGraph Shape to SVG Converter

**Goal:** Create a tool that can execute JavaScript shapes and output SVG

**Approach Options:**

**Option A: JavaScript Runtime Approach**
- Use Node.js to execute shape JavaScript
- Mock the mxGraph library dependencies (mxShape, mxUtils, mxConstants)
- Capture canvas drawing commands and translate to SVG
- Pros: Can handle any shape complexity
- Cons: Requires full mxGraph library simulation

**Option B: Static Analysis Approach**
- Parse JavaScript shape code as AST
- Extract drawing commands from `foreground()` and `background()` methods
- Translate canvas commands directly to SVG
- Pros: Simpler, no runtime needed
- Cons: May fail on complex dynamic logic

**Option C: Hybrid Approach (Recommended)**
- Use headless browser (Puppeteer) with actual mxGraph library
- Load shape JavaScript in real draw.io environment
- Export rendered SVG from canvas
- Pros: Most accurate, uses actual draw.io code
- Cons: Heavier dependency

**Tasks:**
1. Choose approach based on complexity analysis
2. Create proof-of-concept with one shape (e.g., Search Box)
3. Implement style parameter injection (colors, text, sizes)
4. Test with multiple shape categories (mockup, iOS, basic)
5. Build batch converter for all JavaScript shapes
6. Document limitations and edge cases

### Step 3: Integration and Testing

**Tasks:**
1. Integrate mxGraph converter with existing XML stencil converter
2. Create unified interface for both shape systems
3. Test with all shape categories
4. Compare outputs with draw.io exports
5. Document usage and examples

## Research Files

**Key draw.io files to examine:**
- `drawio/src/main/webapp/js/mxClient.js` - Main mxGraph entry point
- `drawio/src/main/webapp/js/shape/mxShape.js` - Base shape class
- `drawio/src/main/webapp/js/util/mxUtils.js` - Utility functions
- `drawio/src/main/webapp/js/view/mxGraph.js` - Graph rendering
- `drawio/src/main/webapp/js/view/mxGraphView.js` - View/canvas management
- `drawio/src/main/webapp/shapes/mockup/mxMockupForms.js` - Example shape

## Success Criteria

- [ ] Can convert mxgraph.mockup.forms.searchBox to SVG with custom colors
- [ ] Can convert mxgraph.ios7.icons.alarm_clock to SVG matching document export
- [ ] Can handle style parameters (strokeColor2, mainText, etc.)
- [ ] Can process all shapes in `shapes/mockup/` directory
- [ ] Can process all shapes in `shapes/ios7/` directory
- [ ] Generated SVGs match draw.io GUI exports

## Resources

- **mxGraph Documentation**: https://jgraph.github.io/mxgraph/
- **draw.io GitHub**: https://github.com/jgraph/drawio
- **Shape Examples**: `../drawio-desktop/drawio/src/main/webapp/shapes/`
