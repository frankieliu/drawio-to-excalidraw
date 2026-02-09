# Project State Snapshot

**Last Updated:** 2025-02-08

## Quick Status

### What's Working ✅
- **XML Stencils:** 2,051+ shapes converted to Excalidraw format
- **MX Shapes - Basic:** 31 shapes exported to SVG (mxgraph.basic.*)
- **MX Shapes - Misc:** 16 shapes exported to SVG (curly brackets, isometric cubes, etc.)

### Current Work 🚧
- **MX Shapes - Mockup:** Not started (~50 shapes from mxgraph.mockup.*)

### What's Not Done Yet 📋
- SVG to Excalidraw library integration (not automated)
- Additional MX shape categories (iOS, Android, Infographic)

## How to Resume Work

1. **Read this first:** `docs/MX_SHAPES_QUICKSTART.md`
2. **Start draw.io server:**
   ```bash
   cd ../drawio-desktop/drawio/src/main/webapp
   python3 -m http.server 8080
   ```
3. **Test it works:**
   ```bash
   node mx-shape-to-excalidrawlib.js test
   ```

## File Structure

```
Current directory: /Users/frankliu/Projects/drawio-to-excalidraw

Key Files:
├── mx-shape-to-excalidrawlib.js          # Main converter script
├── parse-sidebar-dimensions.js            # Extract Basic shapes metadata
├── parse-misc-dimensions.js               # Extract Misc shapes metadata
├── shape-dimensions.json                  # 31 Basic shapes config
├── misc-dimensions.json                   # 16 Misc shapes config
├── mx-shape-svgs/                         # 31 Basic shapes SVGs
├── misc-svgs/                             # 16 Misc shapes SVGs
├── docs/MX_SHAPES_QUICKSTART.md          # Quick start guide (read this)
├── docs/MX_SHAPES_CONVERSION.md          # Complete technical docs
└── TODO.md                               # Detailed task list
```

## Next Step

**Goal:** Export Mockup shapes (~50 shapes)

**Command to try:**
```bash
node mx-shape-to-excalidrawlib.js list mxgraph.mockup
```

**If that works, try:**
```bash
node mx-shape-to-excalidrawlib.js mockup
```

**If "mockup" command doesn't exist yet:**
- See "Next Steps: Mockup Shapes" in `docs/MX_SHAPES_QUICKSTART.md`
- May need to create `parse-mockup-dimensions.js` first

## Key Dependencies

- **Node.js:** Installed ✅
- **Playwright:** Installed ✅ (v1.49.1)
- **Draw.io source:** `../drawio-desktop/` ✅
- **Local server:** Must be running on port 8080 ⚠️

## Recent Changes

**Latest commit:** `f13cc60` (2025-02-08)
- Added MX shape to SVG converter with Playwright automation
- 47 shapes exported (31 Basic + 16 Misc)
- Comprehensive documentation added

## Important Notes

⚠️ **Always start draw.io server before running converter**
⚠️ **Converter takes ~1.5 seconds per shape** (browser automation overhead)
⚠️ **Only shapes with sidebar definitions are exported** (UI-visible shapes only)

## Context

**What are MX Shapes?** JavaScript-based shapes in draw.io that require runtime execution to render (unlike XML stencils which are declarative).

**Why Playwright?** Uses draw.io's actual rendering engine for 100% accuracy. No need to mock mxGraph API or modify draw.io source.

**Two systems:**
1. **XML Stencils** (2,051+ shapes) - uses `stencil-to-excalidrawlib.js`
2. **MX Shapes** (47 so far) - uses `mx-shape-to-excalidrawlib.js`

## Success Metrics

- ✅ Basic shapes render correctly (polygon issue fixed)
- ✅ Misc shapes render correctly (curly bracket curves fixed)
- ✅ Generated SVGs match draw.io manual exports
- ⏳ Mockup shapes (not started)
- ⏳ SVG to .excalidrawlib automation (not started)

## Time Investment

- **XML Stencils:** Multiple weeks (already complete)
- **MX Basic shapes:** ~1 day
- **MX Misc shapes:** ~1 day (including debugging)
- **Total MX work so far:** ~2 days

**Estimate for Mockup:** ~1 day if pattern holds

## Quick Commands Reference

```bash
# Test single shape
node mx-shape-to-excalidrawlib.js test

# Export Basic shapes (31 shapes, ~45 seconds)
node mx-shape-to-excalidrawlib.js basic

# Export Misc shapes (16 shapes, ~25 seconds)
node mx-shape-to-excalidrawlib.js misc

# List shapes in namespace
node mx-shape-to-excalidrawlib.js list mxgraph.basic
node mx-shape-to-excalidrawlib.js list mxgraph.mockup

# Help
node mx-shape-to-excalidrawlib.js --help
```

## Git Info

**Repository:** `github.com:frankieliu/drawio-to-excalidraw.git`
**Branch:** `main`
**Status:** Up to date with origin

## Where to Get Help

- **"How do I run it?"** → `docs/MX_SHAPES_QUICKSTART.md`
- **"How does it work?"** → `docs/MX_SHAPES_CONVERSION.md`
- **"What's next?"** → `TODO.md`
- **"Why isn't X working?"** → `docs/MX_SHAPES_CONVERSION.md` (Common Issues section)

---

**Bottom Line:** You have a working MX shape converter that uses Playwright to automate draw.io. It exports shapes to SVG. Next step is exporting Mockup shapes using the same approach.
