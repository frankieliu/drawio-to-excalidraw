# Draw.io to Excalidraw Converter

Convert draw.io shapes (XML stencils and JavaScript MX shapes) into SVG and Excalidraw library formats.

## Features

### XML Stencils (Completed)
- ✅ Convert draw.io XML stencils to SVG format
- ✅ Convert draw.io XML stencils to Excalidraw libraries
- ✅ Preserve colors, stroke width, and fills
- ✅ Support for paths, curves, arcs, and basic shapes
- ✅ Process entire directories recursively
- ✅ **2,051+ shapes** converted from draw.io stencils library

### MX Shapes (In Progress)
- ✅ Convert JavaScript-based mxGraph shapes to SVG using Playwright automation
- ✅ **31 Basic shapes** (mxgraph.basic.*) - rectangles, polygons, ellipses, etc.
- ✅ **16 Misc palette shapes** - curly brackets, isometric cubes, crossbars, etc.
- 🚧 Mockup shapes (~50 shapes) - coming next
- 📋 iOS, Android, Infographic shapes - planned

See [MX Shapes Quick Start](./docs/MX_SHAPES_QUICKSTART.md) for the new JavaScript shape converter.

## Installation

```bash
npm install -g drawio-to-excalidraw
```

Or use directly with npx:

```bash
npx drawio-to-excalidraw <input-directory> <output.excalidrawlib>
```

## Quick Start

### Getting Draw.io Stencils

First, you need the draw.io stencils XML files. Clone the draw.io repository:

```bash
# Clone draw.io repository (includes submodule with stencils)
git clone --recursive https://github.com/jgraph/drawio-desktop.git

# Or if already cloned without --recursive:
cd drawio-desktop
git submodule update --init --recursive
```

**Stencils Location:** `drawio-desktop/drawio/src/main/webapp/stencils/`

This directory contains 200+ XML files organized by category:
- **Root level:** `basic.xml`, `flowchart.xml`, `arrows.xml`, `aws4.xml`, `azure.xml`, `gcp2.xml`, etc.
- **Subdirectories:** `electrical/`, `cisco/`, `aws/`, `aws2/`, `gcp/`, `office/`, `rack/`, etc.

### Convert XML to SVG

```bash
# Using the CLI
drawio-to-svg input.xml output.svg

# Using Node
node xml-to-svg.js input.xml output.svg
```

### Convert XML Directory to Excalidraw Library

```bash
# Using the CLI
drawio-to-excalidraw basic arrows flowchart

# Using Node
node stencil-to-excalidrawlib.js basic arrows flowchart
```

### Convert Specific Stencil Categories

```bash
# Convert basic, arrows, and flowchart categories
node stencil-to-excalidrawlib.js basic arrows flowchart

# Convert all supported categories
node stencil-to-excalidrawlib.js all

# Specify custom output directory
node stencil-to-excalidrawlib.js basic --output=./my-libraries
```

## Usage Examples

### Example 1: Convert Basic Shapes

```bash
# After cloning drawio-desktop repository
# Stencils are located at: drawio-desktop/drawio/src/main/webapp/stencils/

# Convert all basic shapes
drawio-to-excalidraw basic

# Or convert entire stencils directory (8,746+ shapes)
# Note: Use individual categories for better control
drawio-to-excalidraw all
```

### Example 2: Convert Specific Category

```bash
# Convert flowchart shapes
drawio-to-excalidraw flowchart

# Convert arrows
drawio-to-excalidraw arrows
```

### Example 3: Convert Single File to SVG

```bash
drawio-to-svg drawio-desktop/drawio/src/main/webapp/stencils/flowchart.xml flowchart.svg
```

## Using the Excalidraw Library

1. Open [Excalidraw](https://excalidraw.com)
2. Click the library icon (📚) in the toolbar
3. Click "Browse libraries" or drag and drop your `.excalidrawlib` file
4. All shapes will appear in your library panel
5. Click any shape to add it to your canvas

## Available Shape Categories

When converting the full draw.io stencils library, you get access to:

**Cloud Platforms:**
- `aws3.xml`, `aws3d.xml`, `aws4.xml` - Amazon Web Services (multiple versions)
- `aws/`, `aws2/` - Additional AWS shape collections
- `azure.xml` - Microsoft Azure
- `gcp2.xml`, `gcp/` - Google Cloud Platform
- `alibaba_cloud.xml` - Alibaba Cloud
- `ibm.xml`, `ibm_cloud.xml` - IBM Cloud
- `openstack.xml` - OpenStack

**Network & Infrastructure:**
- `cisco19.xml`, `cisco/`, `cisco_safe/` - Cisco networking equipment
- `networks.xml`, `networks2.xml` - Network diagrams
- `rack/` - Server racks and data center equipment
- `cabinets.xml` - Cabinet diagrams

**Software & Diagrams:**
- `flowchart.xml` - Flowchart symbols
- `basic.xml` - Basic geometric shapes
- `arrows.xml` - Various arrow styles
- `bpmn.xml` - Business Process Model and Notation
- `uml.xml` - Unified Modeling Language
- `kubernetes.xml`, `kubernetes2.xml` - Kubernetes icons
- `eip.xml` - Enterprise Integration Patterns

**Mobile & Web:**
- `ios7/`, `android/` - Mobile UI elements
- `mockup/` - UI mockup components
- `bootstrap.xml` - Bootstrap UI elements
- `webicons.xml`, `weblogos.xml` - Web icons and logos
- `gmdl.xml` - Google Material Design

**Enterprise:**
- `atlassian.xml` - Atlassian products
- `salesforce.xml` - Salesforce
- `citrix.xml`, `citrix2.xml` - Citrix
- `veeam/` - Veeam backup solutions
- `office/` - Microsoft Office shapes

**Engineering:**
- `electrical/` - Electrical and electronic symbols (20+ subcategories)
- `fluid_power.xml` - Hydraulic and pneumatic symbols
- `pid/` - Piping and Instrumentation Diagrams

**Other:**
- `floorplan.xml` - Architectural floor plans
- `lean_mapping.xml` - Lean manufacturing
- `signs/` - Safety and informational signs
- `sitemap.xml` - Website sitemap symbols
- `clipart/` - General clipart
- `mscae/` - Microsoft Cloud and Enterprise
- `vvd.xml` - VMware Validated Design

**Path:** All stencils are located at `drawio-desktop/drawio/src/main/webapp/stencils/`

Total: **8,746+ shapes** available across **200+ XML files**!

## Stencil Categories

The `stencil-to-excalidrawlib.js` script converts specific draw.io stencil categories into separate Excalidraw libraries:

**Supported Categories (XML-based):**
- `basic` - Basic geometric shapes (rectangles, circles, stars, etc.)
- `arrows` - Various arrow styles and directions
- `flowchart` - Flowchart symbols (process, decision, data, etc.)

**Not Yet Supported (JavaScript-based, requires Phase 2):**
- `er` - Entity Relationship diagram shapes
- `uml` - UML diagram shapes
- `general`, `misc`, `advanced` - These are JavaScript-based shape categories

See `TODO.md` for the roadmap to support JavaScript-based shapes.

## Command Line Options

### stencil-to-excalidrawlib.js

```bash
node stencil-to-excalidrawlib.js [categories...] [--output=DIR]
```

**Categories:**
- `basic` - Basic shapes
- `arrows` - Arrow shapes
- `flowchart` - Flowchart symbols
- `all` - Convert all supported categories

**Options:**
- `--output=DIR` - Output directory (default: `./excalidraw-libraries`)
- `--help, -h` - Show help message

**Examples:**
```bash
# Convert multiple categories
node stencil-to-excalidrawlib.js basic arrows flowchart

# Convert all supported categories
node stencil-to-excalidrawlib.js all

# Custom output directory
node stencil-to-excalidrawlib.js basic --output=./libraries
```

### xml-to-svg.js

```bash
node xml-to-svg.js <input.xml> [output.svg]
```

**Arguments:**
- `input.xml` - Path to draw.io XML stencil file
- `output.svg` - (Optional) Output SVG file path

If the XML contains multiple shapes, creates multiple SVG files with pattern: `output_0_ShapeName.svg`

### stencil-to-excalidrawlib.js

```bash
node stencil-to-excalidrawlib.js [categories...] [--output=DIR]
```

**Arguments:**
- `categories` - One or more category names (basic, arrows, flowchart) or 'all'
- `--output=DIR` - (Optional) Output directory (default: ./excalidraw-libraries)

See the stencil categories section above for full usage details.

## Documentation

### XML Stencils (Completed)
- [Usage Guide](./docs/USAGE.md) - Detailed examples and use cases
- [API Documentation](./docs/API.md) - API reference and code examples
- [Architecture](./docs/ARCHITECTURE.md) - Technical architecture overview
- [Contributing](./docs/CONTRIBUTING.md) - Contribution guidelines

### MX Shapes (New - JavaScript-based shapes)
- [Quick Start Guide](./docs/MX_SHAPES_QUICKSTART.md) - **Start here** to resume MX shape work
- [Technical Documentation](./docs/MX_SHAPES_CONVERSION.md) - Complete architecture and implementation details
- [TODO](./TODO.md) - Current status and next steps

## Examples

The `examples/` directory contains:
- `basic-shapes/` - Sample XML stencil files
- `basic-shapes.excalidrawlib` - Pre-built library with 30 shapes

## Requirements

- Node.js >= 16.0.0
- npm >= 7.0.0

## Development

```bash
# Clone the repository
git clone https://github.com/frankieliu/drawio-to-excalidraw.git
cd drawio-to-excalidraw

# Install dependencies
npm install

# Run tests
npm test

# Run converter
node stencil-to-excalidrawlib.js basic arrows flowchart
```

## Limitations

- Shapes are converted to freedraw paths (not parametric shapes)
- Text elements are not converted
- Image-based stencils are skipped
- Complex curves may be approximated

## License

Apache-2.0 (same as draw.io)

## Credits

- [draw.io](https://github.com/jgraph/drawio) - Original shape library
- [Excalidraw](https://github.com/excalidraw/excalidraw) - Target platform
- Based on mxGraph shape rendering logic

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details.

## Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/frankieliu/drawio-to-excalidraw/issues).
