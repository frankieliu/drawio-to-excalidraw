# Draw.io to Excalidraw Converter

Convert draw.io XML stencil shapes into SVG and Excalidraw library formats.

## Features

- ✅ Convert draw.io XML stencils to SVG format
- ✅ Convert draw.io XML stencils to Excalidraw libraries
- ✅ Preserve colors, stroke width, and fills
- ✅ Support for paths, curves, arcs, and basic shapes
- ✅ Process entire directories recursively
- ✅ 8,746+ shapes from draw.io stencils library

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
drawio-to-excalidraw ./xml-stencils/ output.excalidrawlib

# Using Node
node xml-to-excalidraw.js ./xml-stencils/ output.excalidrawlib
```

## Usage Examples

### Example 1: Convert Basic Shapes

```bash
# After cloning drawio-desktop repository
# Stencils are located at: drawio-desktop/drawio/src/main/webapp/stencils/

# Convert all basic shapes
drawio-to-excalidraw drawio-desktop/drawio/src/main/webapp/stencils/basic.xml basic-shapes.excalidrawlib

# Or convert entire stencils directory (8,746+ shapes)
drawio-to-excalidraw drawio-desktop/drawio/src/main/webapp/stencils complete-library.excalidrawlib
```

### Example 2: Convert Specific Category

```bash
# Convert only AWS shapes
drawio-to-excalidraw drawio-desktop/drawio/src/main/webapp/stencils/aws aws-shapes.excalidrawlib

# Convert only network diagrams
drawio-to-excalidraw drawio-desktop/drawio/src/main/webapp/stencils/cisco cisco-shapes.excalidrawlib
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

## Command Line Options

### xml-to-svg.js

```bash
node xml-to-svg.js <input.xml> [output.svg]
```

**Arguments:**
- `input.xml` - Path to draw.io XML stencil file
- `output.svg` - (Optional) Output SVG file path

If the XML contains multiple shapes, creates multiple SVG files with pattern: `output_0_ShapeName.svg`

### xml-to-excalidraw.js

```bash
node xml-to-excalidraw.js <input-directory> <output.excalidrawlib>
```

**Arguments:**
- `input-directory` - Directory containing XML stencil files (searched recursively)
- `output.excalidrawlib` - Output Excalidraw library file path

## Documentation

- [Usage Guide](./docs/USAGE.md) - Detailed examples and use cases
- [API Documentation](./docs/API.md) - API reference and code examples
- [Architecture](./docs/ARCHITECTURE.md) - Technical architecture overview
- [Contributing](./docs/CONTRIBUTING.md) - Contribution guidelines

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
node xml-to-excalidraw.js <input-dir> <output-file>
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
