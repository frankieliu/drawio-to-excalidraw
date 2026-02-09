# TODO: mxGraph JavaScript Shape Conversion

## Phase 1: Understanding mxGraph to SVG Conversion ✅ (Completed)

- ✅ Identified XML Stencils vs JavaScript Shapes distinction
- ✅ Located JavaScript shape files in `shapes/*/*.js`
- ✅ Documented both shape systems in `SHAPE_SYSTEMS.md`
- ✅ Successfully converted 8,746+ XML stencil shapes to SVG

## Phase 2: mxGraph JavaScript Shape to SVG Conversion ✅ (In Progress)

### Approach Selected: Headless Browser Automation (Playwright)

**Rationale:** Uses actual draw.io rendering engine for 100% accuracy, requires no draw.io source modifications (easiest to maintain).

See detailed documentation: `docs/MX_SHAPES_CONVERSION.md`

### ✅ Step 1: Proof of Concept (Completed)
- ✅ Installed Playwright dependency
- ✅ Created `mx-shape-to-excalidrawlib.js` script
- ✅ Tested single shape conversion (mxgraph.basic.rect)
- ✅ Verified SVG export matches draw.io manual export
- ✅ Implemented browser automation with draw.io API access

### ✅ Step 2: Basic Shapes Category (Completed)
- ✅ Created `parse-sidebar-dimensions.js` to extract shape metadata
- ✅ Implemented shape enumeration from `mxCellRenderer.defaultShapes`
- ✅ Added `styleSuffix` support for parametric shapes (polygon with polyCoords)
- ✅ Implemented sidebar filtering (only export UI-visible shapes)
- ✅ Fixed polygon empty rendering issue
- ✅ Filtered out non-sidebar shapes (bendingArch, numberedEntryVert, cross2)
- ✅ Exported 31 Basic shapes to `mx-shape-svgs/`

**Key files created:**
- `shape-dimensions.json` - Metadata for 31 Basic shapes
- `mx-shape-svgs/basic-*.svg` - 31 exported SVG files

### ✅ Step 3: Misc Palette Category (Completed)
- ✅ Created `parse-misc-dimensions.js` to extract Misc palette metadata
- ✅ Implemented shape variation handling (suffixes: _2, _3, etc.)
- ✅ Fixed curly bracket rendering issue (customParams conflict)
- ✅ Exported 16 Misc shapes to `misc-svgs/`

**Shapes exported:**
- Left/Right Curly Brackets (curlyBracket, curlyBracket_2)
- Isometric Cubes (isoCube, isoCube2)
- Double Ellipses (doubleEllipse, semiEllipse variants)
- Crossbars (crossbar, crossbar_2)
- Partial Rectangles (partialRectangle variants)
- Waypoint (waypoint variants)

**Key files created:**
- `misc-dimensions.json` - Metadata for 16 Misc shapes
- `misc-svgs/misc-*.svg` - 16 exported SVG files

### 🚧 Step 4: Mockup Shapes Category (Next)
**Goal:** Export all UI mockup shapes (~50 shapes from 8 files)

**Tasks:**
1. [ ] Enumerate shapes from `mxgraph.mockup.*` namespace
2. [ ] Handle mockup-specific parameters (mainText, buttonText, etc.)
3. [ ] Test with various mockup categories:
   - Forms (searchBox, comboBox, etc.)
   - Buttons
   - Navigation
   - Containers
   - Text
   - Graphics
   - Markup
   - Misc
4. [ ] Export to `mockup-svgs/`

**Estimated:** 50-60 shapes

### Step 5: SVG to Excalidraw Integration (Planned)
**Goal:** Automate conversion from SVG to .excalidrawlib format

**Tasks:**
1. [ ] Update converter to call `svg-to-excalidraw` CLI automatically
2. [ ] Generate library metadata (name, version, source)
3. [ ] Create unified output files:
   - `basic-js.excalidrawlib`
   - `misc.excalidrawlib`
   - `mockup.excalidrawlib`
4. [ ] Add deterministic ID generation (consistent with XML pipeline)
5. [ ] Test loading in Excalidraw application
6. [ ] Document integration process

### Step 6: Additional Shape Categories (Future)
**Potential targets:**
- [ ] `mxgraph.ios7.*` - iOS 7 UI components
- [ ] `mxgraph.android.*` - Android UI components
- [ ] `mxgraph.infographic.*` - Infographic shapes
- [ ] Other JavaScript-based shape libraries

## Technical Documentation

**Architecture and process:** `docs/MX_SHAPES_CONVERSION.md`

**Key scripts:**
- `mx-shape-to-excalidrawlib.js` - Main converter (Playwright automation)
- `parse-sidebar-dimensions.js` - Extract Basic shapes metadata
- `parse-misc-dimensions.js` - Extract Misc palette metadata

**Key learnings:**
1. **Shape filtering:** Only export shapes with sidebar definitions (UI-visible)
2. **Style composition:** Basic shapes use `shape=name` + `styleSuffix`, Misc shapes use complete `style` strings
3. **customParams handling:** Avoid conflicts by not appending when complete style exists
4. **Shape variations:** Handle multiple variants with suffixes (_2, _3, etc.)

## Success Criteria

- ✅ Can convert mxgraph.basic.* shapes to SVG with default styles
- ✅ Generated SVGs match draw.io GUI exports (verified)
- ✅ Can handle parametric shapes (polygon with polyCoords)
- ✅ Can handle Misc palette shapes (curly brackets, isometric cubes, etc.)
- [ ] Can convert mxgraph.mockup.* shapes to SVG
- [ ] Can automatically generate .excalidrawlib files
- [ ] Can handle style parameters (strokeColor2, mainText, etc.)

## Resources

- **mxGraph Documentation**: https://jgraph.github.io/mxgraph/
- **draw.io GitHub**: https://github.com/jgraph/drawio
- **Shape Examples**: `../drawio-desktop/drawio/src/main/webapp/shapes/`

---

# TODO: Remaining XML Stencil Conversions

## Completed XML Stencils (14)

- ✅ arrows
- ✅ basic
- ✅ flowchart
- ✅ bpmn (39 shapes)
- ✅ networks (57 shapes)
- ✅ networks2 (115 shapes)
- ✅ kubernetes (40 shapes)
- ✅ kubernetes2 (39 shapes)
- ✅ aws3 (293 shapes)
- ✅ aws3d (16 shapes)
- ✅ aws4 (1,031 shapes)
- ✅ azure (89 shapes)
- ✅ gcp2 (297 shapes)
- ✅ eip (36 shapes)

**Total: 2,051+ shapes converted**

## Remaining XML Stencils (19)

### Cloud Platforms
- [ ] alibaba_cloud
- [ ] ibm
- [ ] ibm_cloud
- [ ] openstack

### Enterprise/SaaS
- [ ] atlassian
- [ ] citrix
- [ ] citrix2
- [ ] salesforce

### UI/Web
- [ ] bootstrap
- [ ] gmdl (Google Material Design)
- [ ] webicons
- [ ] weblogos

### Engineering/Infrastructure
- [ ] cabinets
- [ ] cisco19
- [ ] fluid_power
- [ ] vvd (VMware Validated Design)

### Other
- [ ] floorplan
- [ ] lean_mapping
- [ ] sitemap

## How to Convert

```bash
# Convert a single category
node stencil-to-excalidrawlib.js <category-name>

# Convert multiple categories at once
node stencil-to-excalidrawlib.js alibaba_cloud atlassian bootstrap

# Convert all remaining stencils
node stencil-to-excalidrawlib.js alibaba_cloud atlassian bootstrap cabinets cisco19 citrix citrix2 floorplan fluid_power gmdl ibm ibm_cloud lean_mapping openstack salesforce sitemap vvd webicons weblogos
```
