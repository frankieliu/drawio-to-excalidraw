# MX Shapes Conversion - Quick Start Guide

## What Was Accomplished

Successfully implemented Playwright-based automation to convert draw.io JavaScript shapes to SVG format.

**Completed:**
- ✅ 31 Basic shapes (mxgraph.basic.*) → `mx-shape-svgs/`
- ✅ 16 Misc palette shapes → `misc-svgs/`

**Next:** Mockup shapes (~50 shapes from mxgraph.mockup.*)

## Prerequisites to Resume Work

### 1. Start Local Draw.io Server

The converter needs draw.io running locally. Start it with:

```bash
cd ../drawio-desktop/drawio/src/main/webapp
python3 -m http.server 8080
```

**Verify it's working:**
```bash
curl http://127.0.0.1:8080/
# Should return HTML content
```

**Keep this terminal open** while running the converter.

### 2. Install Dependencies (if not already installed)

```bash
cd /Users/frankliu/Projects/drawio-to-excalidraw
npm install
```

This installs Playwright and browser binaries (~200MB).

## How to Run the Converter

### Test Single Shape
```bash
node mx-shape-to-excalidrawlib.js test
```
- Exports `mxgraph.basic.rect` to `mx-shape-svgs/basic-rect.svg`
- Takes ~5 seconds (browser launch overhead)
- Use this to verify everything is working

### Export All Basic Shapes (31 shapes)
```bash
node mx-shape-to-excalidrawlib.js basic
```
- Takes ~45 seconds
- Outputs to `mx-shape-svgs/basic-*.svg`

### Export All Misc Shapes (16 shapes)
```bash
node mx-shape-to-excalidrawlib.js misc
```
- Takes ~25 seconds
- Outputs to `misc-svgs/misc-*.svg`

### List Available Shapes
```bash
node mx-shape-to-excalidrawlib.js list mxgraph.basic
node mx-shape-to-excalidrawlib.js list mxgraph.mockup
```

## Key Files to Know

### Scripts
```
mx-shape-to-excalidrawlib.js    # Main converter (run this)
parse-sidebar-dimensions.js      # Extract Basic shapes metadata (already run)
parse-misc-dimensions.js         # Extract Misc shapes metadata (already run)
```

### Configuration Files (Generated)
```
shape-dimensions.json            # 31 Basic shapes with dimensions/styles
misc-dimensions.json             # 16 Misc shapes with dimensions/styles
```

### Documentation
```
docs/MX_SHAPES_CONVERSION.md     # Complete technical documentation
docs/MX_SHAPES_QUICKSTART.md     # This file
TODO.md                          # Updated task list
```

### Debug Scripts (for troubleshooting)
```
debug-polygon.js                 # Test polygon rendering
debug-curlybracket.js            # Test curly bracket rendering
check-misc-shapes.js             # Verify Misc dimensions
```

## Next Steps: Mockup Shapes

### Step 1: Explore Mockup Shapes

List all available mockup shapes:
```bash
node mx-shape-to-excalidrawlib.js list mxgraph.mockup
```

This will show you shapes like:
- `mxgraph.mockup.forms.searchBox`
- `mxgraph.mockup.buttons.button`
- `mxgraph.mockup.containers.window`

### Step 2: Extract Mockup Dimensions

You'll need to create a parser for mockup shapes (similar to Misc palette).

**Option A: Find in Sidebar.js**

Look for `addMockupPalette()` or similar methods in:
```
../drawio-desktop/drawio/src/main/webapp/js/grapheditor/Sidebar.js
```

**Option B: Manual Exploration**

Create a test script to extract dimensions from draw.io:
```javascript
// test-mockup-shapes.js
import { MxShapeToExcalidrawConverter } from './mx-shape-to-excalidrawlib.js';

const converter = new MxShapeToExcalidrawConverter();
await converter.initialize();

// Try different mockup shapes with various dimensions
const testShapes = [
    'mxgraph.mockup.forms.searchBox',
    'mxgraph.mockup.buttons.button',
    // ... add more
];

for (const shapeName of testShapes) {
    try {
        const defaults = await converter.getShapeDefaults(shapeName);
        console.log(shapeName, defaults);
    } catch (error) {
        console.log(`${shapeName}: No sidebar def, trying manual dimensions`);
        // Try with fallback dimensions
    }
}
```

### Step 3: Update Converter for Mockup

Add mockup command to `mx-shape-to-excalidrawlib.js`:

```javascript
case 'mockup':
    console.log('MOCKUP SHAPES - SVG Export');
    await converter.exportNamespace('mxgraph.mockup', outputDir, 'mockup');
    break;
```

If mockup shapes don't have sidebar definitions, you may need to:
1. Use fallback dimensions (e.g., 150x100)
2. Let shapes render at their natural size
3. Create a manual mapping file

### Step 4: Test and Export

```bash
# Test with one mockup shape
node test-mockup-shapes.js

# Export all mockup shapes
node mx-shape-to-excalidrawlib.js mockup --output=./mockup-svgs
```

## Common Issues

### Issue: "Error: net::ERR_CONNECTION_REFUSED"

**Cause:** Draw.io server not running

**Solution:**
```bash
# Start the server in another terminal
cd ../drawio-desktop/drawio/src/main/webapp
python3 -m http.server 8080
```

### Issue: "No sidebar definition found for shape: X"

**Cause:** Shape doesn't have dimensions in JSON file

**Solution:**
1. Check if shape is actually in UI sidebar (may be internal shape)
2. Run dimension parser again: `node parse-sidebar-dimensions.js`
3. Add manual entry to dimension file if needed

### Issue: "Timeout waiting for draw.io to initialize"

**Cause:** Draw.io taking too long to load

**Solution:**
1. Check internet connection (draw.io may try to load external resources)
2. Increase timeout in `mx-shape-to-excalidrawlib.js` line 72:
   ```javascript
   await this.page.waitForFunction(() => { ... }, { timeout: 60000 });
   ```
3. Use offline draw.io build if available

### Issue: Shape renders incorrectly (wrong parameters)

**Cause:** customParams conflicting with sidebar style

**Solution:**
- For Misc-like shapes with complete styles: Ensure they use `sidebarStyle` path (line 262-264)
- For Basic-like shapes with parameters: Ensure they use `sidebarStyleSuffix` path (line 266-272)
- Check the condition at line 324: `if (customParams && !sidebarStyle)`

## Debugging Tips

### Enable Browser Window (see what's happening)

Edit `mx-shape-to-excalidrawlib.js` line 49:
```javascript
this.browser = await chromium.launch({
    headless: false,  // Change this to false
    devtools: true,   // Add this for DevTools
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});
```

### Inspect Generated SVG

```bash
# View in browser
open mx-shape-svgs/basic-polygon.svg

# Check SVG structure
cat mx-shape-svgs/basic-polygon.svg | grep '<path'

# Compare with reference
diff <(cat mx-shape-svgs/basic-polygon.svg) <(cat ~/Downloads/polygon.drawio.svg)
```

### Test Shape Rendering Manually

```bash
# Debug specific shape
node debug-curlybracket.js

# Check all Misc shapes
node check-misc-shapes.js
```

### Get Shape Metadata

Add to converter script:
```javascript
const debug = await converter.exploreDrawioEnvironment('shapeName');
console.log(JSON.stringify(debug, null, 2));
```

## Project Context

### Why This Approach?

We're using **headless browser automation** because:
1. MX shapes require JavaScript runtime execution
2. Draw.io already has perfect rendering code
3. No need to mock mxGraph API (error-prone)
4. No need to modify draw.io source (maintenance burden)

**Alternative approaches considered and rejected:**
- Node.js with mocked mxGraph API (too complex, error-prone)
- Modify draw.io source for batch export (high maintenance)
- Extract mxGraph SVG renderer (unknown complexity)

### Two Types of Shapes

**1. XML Stencils (already working)**
- 2,051+ shapes converted
- Uses `stencil-to-excalidrawlib.js`
- Simple XML → SVG pipeline

**2. MX Shapes (this project)**
- Requires JavaScript execution
- Uses `mx-shape-to-excalidrawlib.js`
- Browser automation pipeline

### Pipeline Overview

```
MX Shape Definition (JavaScript)
    ↓
Parse Sidebar (extract dimensions/styles)
    ↓
Browser Automation (render shape)
    ↓
SVG Export
    ↓
svg-to-excalidraw CLI (not yet automated)
    ↓
.excalidrawlib file
```

**Current status:** Steps 1-3 complete, Step 4 manual, Step 5 not started

## Architecture Decisions

### Why Two Dimension Files?

**`shape-dimensions.json`** - Basic shapes
- Use `shape=mxgraph.basic.X` + `styleSuffix`
- Example: `shape=mxgraph.basic.polygon;polygon;polyCoords=[[0.25,0],...]`

**`misc-dimensions.json`** - Misc palette
- Use complete `style` string from sidebar
- Example: `shape=curlyBracket;whiteSpace=wrap;html=1;rounded=1;...`

### Why Filter by Sidebar Definitions?

Some shapes exist in `mxCellRenderer.defaultShapes` but aren't in the UI:
- `mxgraph.basic.bendingArch` (actually in Infographic palette)
- `mxgraph.basic.numberedEntryVert` (internal helper)
- `mxgraph.basic.cross2` (not in UI)

We only export shapes with sidebar definitions = shapes users can actually access.

### Why No Color Variations?

User requested: "Default colors only"

Rationale:
- Simplifies implementation
- Users can change colors in Excalidraw
- Reduces library file size
- Can be added later if needed

## Environment Details

**Node.js version:** Check with `node --version`

**Playwright version:** 1.49.1 (in package.json)

**Draw.io version:** From `../drawio-desktop` repository

**Browser:** Chromium (bundled with Playwright)

**Draw.io URL:** `http://127.0.0.1:8080/?offline=1&splash=0&libs=0`
- `offline=1` - Skip online features
- `splash=0` - No splash screen
- `libs=0` - Don't load default libraries

## Performance Notes

**Current speed:**
- Browser startup: ~3 seconds
- Per shape: ~1-1.5 seconds
- Basic shapes (31): ~45 seconds
- Misc shapes (16): ~25 seconds

**Optimization opportunities:**
- ✅ Already reusing browser instance
- ⚠️ Batching multiple shapes per page (complex, not recommended)
- ⚠️ Parallel browser instances (limited benefit due to overhead)

**Expected for Mockup:**
- 50-60 shapes × 1.5 sec = ~75-90 seconds

## Testing Strategy

### Before Pushing Changes

1. **Test single shape:**
   ```bash
   node mx-shape-to-excalidrawlib.js test
   ```

2. **Re-export Basic shapes:**
   ```bash
   node mx-shape-to-excalidrawlib.js basic
   ```

3. **Visual spot check:**
   ```bash
   open mx-shape-svgs/basic-rect.svg
   open mx-shape-svgs/basic-polygon.svg
   open mx-shape-svgs/basic-ellipse.svg
   ```

4. **Compare with reference (if available):**
   ```bash
   diff mx-shape-svgs/basic-rect.svg ~/Downloads/rect.drawio.svg
   ```

### When Adding New Shape Categories

1. Export shapes
2. Check file count matches expected
3. Visual inspection of 5-10 shapes
4. Compare with draw.io manual export
5. Document any issues in TODO.md

## Git Workflow

```bash
# Check current status
git status

# Stage changes
git add <files>

# Commit with detailed message
git commit -m "descriptive message

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to remote
git push origin main
```

## Contact Information

**Project location:** `/Users/frankliu/Projects/drawio-to-excalidraw`

**Draw.io source:** `/Users/frankliu/Projects/drawio-desktop/drawio/src/main/webapp`

**Plan file:** `~/.claude/plans/wondrous-swimming-parasol.md`

**Latest commit:** `f13cc60 - Add MX shape to SVG converter with Playwright automation`

## Quick Reference

### Most Important Commands

```bash
# Start draw.io server (in separate terminal)
cd ../drawio-desktop/drawio/src/main/webapp && python3 -m http.server 8080

# Test converter is working
node mx-shape-to-excalidrawlib.js test

# Export Basic shapes
node mx-shape-to-excalidrawlib.js basic

# Export Misc shapes
node mx-shape-to-excalidrawlib.js misc

# List shapes in namespace
node mx-shape-to-excalidrawlib.js list mxgraph.mockup

# Help
node mx-shape-to-excalidrawlib.js --help
```

### Most Important Files

```
mx-shape-to-excalidrawlib.js     # Main script - start here
docs/MX_SHAPES_CONVERSION.md     # Full technical docs
TODO.md                          # Current status and next steps
shape-dimensions.json            # Basic shapes config
misc-dimensions.json             # Misc shapes config
```

### Where to Look for Answers

**"How does X work?"** → `docs/MX_SHAPES_CONVERSION.md`

**"What's next?"** → `TODO.md` (Step 4: Mockup Shapes)

**"How do I run it?"** → This file (Quick Reference section above)

**"Why did we do Y?"** → `docs/MX_SHAPES_CONVERSION.md` (Architecture Decisions)

**"Shape not rendering correctly?"** → `docs/MX_SHAPES_CONVERSION.md` (Common Issues)

## Summary for Future You

**What you built:** Playwright automation that renders draw.io JavaScript shapes to SVG by controlling a headless browser.

**What works:** 47 shapes exported (31 Basic + 16 Misc), all rendering correctly.

**What's next:** Export ~50 Mockup shapes using the same approach.

**Key insight:** Use draw.io's actual rendering engine instead of trying to mock it. Saves weeks of work and guarantees accuracy.

**Critical code:** Lines 222-347 in `mx-shape-to-excalidrawlib.js` - how shapes get their dimensions and styles. The `if (customParams && !sidebarStyle)` check on line 324 prevents rendering bugs.

**Time investment:** ~2 days for Basic + Misc. Expect ~1 day for Mockup if they follow the same pattern.

Good luck! 🚀
