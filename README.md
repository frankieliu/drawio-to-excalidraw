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
# Clone draw.io repository first
git clone --recursive https://github.com/jgraph/drawio-desktop.git

# Convert all basic shapes
drawio-to-excalidraw drawio-desktop/drawio/src/main/webapp/stencils basic-shapes.excalidrawlib
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

- **Basic Shapes**: Stars, arrows, callouts, banners
- **Flowcharts**: Process, decision, database, document symbols
- **AWS**: All AWS service icons (multiple versions)
- **Azure**: Microsoft Azure cloud services
- **GCP**: Google Cloud Platform icons
- **Cisco**: Network equipment and diagrams
- **Electrical**: Circuit symbols and electronic components
- **UML**: Unified Modeling Language diagrams
- **BPMN**: Business Process Model and Notation
- **Network**: Racks, cabinets, network topology
- **Floor Plans**: Architectural symbols
- **And many more...**

Total: **8,746+ shapes** available!

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
