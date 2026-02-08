# Usage Guide

Detailed examples and use cases for the draw.io to Excalidraw converter.

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Converting Draw.io Stencils](#converting-drawio-stencils)
- [Working with Specific Categories](#working-with-specific-categories)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## Installation

### Global Installation

```bash
npm install -g drawio-to-excalidraw
```

After global installation, you can use the commands directly:

```bash
drawio-to-svg input.xml output.svg
drawio-to-excalidraw ./stencils output.excalidrawlib
```

### Local Usage (No Installation)

```bash
# Clone the repository
git clone https://github.com/frankieliu/drawio-to-excalidraw.git
cd drawio-to-excalidraw

# Install dependencies
npm install

# Use directly with node
node xml-to-svg.js input.xml output.svg
node xml-to-excalidraw.js ./stencils output.excalidrawlib
```

### Using npx (No Installation Required)

```bash
npx drawio-to-excalidraw ./stencils output.excalidrawlib
```

## Basic Usage

### Convert a Single XML File to SVG

```bash
# Simple conversion
node xml-to-svg.js basic.xml basic.svg

# The output filename is optional (defaults to input name)
node xml-to-svg.js basic.xml
# Creates: basic.svg

# If XML has multiple shapes, creates multiple files
node xml-to-svg.js flowchart.xml flowchart.svg
# Creates: flowchart_0_Process.svg, flowchart_1_Decision.svg, etc.
```

### Convert Directory to Excalidraw Library

```bash
# Convert all XML files in a directory
node xml-to-excalidraw.js ./xml-stencils my-library.excalidrawlib

# The tool searches recursively
node xml-to-excalidraw.js ./stencils complete-library.excalidrawlib
```

## Converting Draw.io Stencils

### Step 1: Get Draw.io Source

First, clone the draw.io repository to access the stencils:

```bash
# Clone draw.io (includes stencils as submodule)
git clone --recursive https://github.com/jgraph/drawio-desktop.git

# Or if you already cloned without --recursive:
git clone https://github.com/jgraph/drawio-desktop.git
cd drawio-desktop
git submodule update --init --recursive
```

### Step 2: Convert All Stencils

```bash
# Navigate to converter directory
cd /path/to/drawio-to-excalidraw

# Convert all draw.io stencils
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils \
  complete-drawio-library.excalidrawlib

# This will take about 5-10 seconds and create a ~50MB file with 8,746+ shapes
```

### Step 3: Import to Excalidraw

1. Open https://excalidraw.com
2. Click the library icon (📚) in the left toolbar
3. Click "Browse libraries" or drag-drop the `.excalidrawlib` file
4. All 8,746+ shapes are now available!

## Working with Specific Categories

### AWS Shapes

```bash
# All AWS shapes (across multiple versions)
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/aws* \
  aws-shapes.excalidrawlib

# Just AWS 4 (latest)
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/aws4.xml \
  aws4-shapes.excalidrawlib
```

### Network Diagrams

```bash
# Cisco network equipment
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/cisco \
  cisco-shapes.excalidrawlib

# All network-related shapes
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/cisco* \
  network-shapes.excalidrawlib
```

### Cloud Services

```bash
# Azure
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/azure.xml \
  azure-shapes.excalidrawlib

# GCP
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/gcp* \
  gcp-shapes.excalidrawlib

# All cloud (AWS + Azure + GCP + Alibaba)
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/{aws*,azure*,gcp*,alibaba*} \
  cloud-shapes.excalidrawlib
```

### Flowcharts and Diagrams

```bash
# Flowcharts
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/flowchart.xml \
  flowchart-shapes.excalidrawlib

# UML
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/uml* \
  uml-shapes.excalidrawlib

# BPMN
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/bpmn.xml \
  bpmn-shapes.excalidrawlib
```

### Basic Shapes

```bash
# Basic geometric shapes
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/basic.xml \
  basic-shapes.excalidrawlib

# Arrows
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/arrows.xml \
  arrows-shapes.excalidrawlib
```

### Electrical/Engineering

```bash
# All electrical symbols
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/electrical \
  electrical-shapes.excalidrawlib

# Logic gates
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/electrical/logic_gates.xml \
  logic-gates.excalidrawlib
```

## Advanced Usage

### Custom Directory Structure

```bash
# Create organized libraries
mkdir -p excalidraw-libraries

# Convert each category separately
for category in aws azure gcp cisco; do
  node xml-to-excalidraw.js \
    ../drawio-desktop/drawio/src/main/webapp/stencils/${category}* \
    excalidraw-libraries/${category}.excalidrawlib
done
```

### Filtering Specific Files

```bash
# Convert only files matching a pattern
find ../drawio-desktop/drawio/src/main/webapp/stencils -name "aws*.xml" \
  -exec dirname {} \; | sort -u | while read dir; do
    node xml-to-excalidraw.js "$dir" aws-complete.excalidrawlib
  done
```

### Batch Processing

```bash
# Process multiple categories in parallel
categories=("basic" "flowchart" "arrows" "uml")

for cat in "${categories[@]}"; do
  node xml-to-excalidraw.js \
    ../drawio-desktop/drawio/src/main/webapp/stencils/${cat}.xml \
    ${cat}-shapes.excalidrawlib &
done

wait
echo "All conversions complete!"
```

### Combining Libraries

Note: Excalidraw doesn't support merging libraries directly. To combine, you need to:

1. Convert each category separately
2. Import each library individually in Excalidraw
3. Or manually merge the JSON (advanced)

**Manual JSON Merge:**
```bash
# Merge two libraries (requires jq)
jq -s '.[0].libraryItems + .[1].libraryItems | {type: "excalidrawlib", version: 2, source: "drawio-converter", libraryItems: .}' \
  library1.excalidrawlib library2.excalidrawlib > merged.excalidrawlib
```

## Troubleshooting

### "No path data found" Messages

Some shapes use images instead of vector paths. These are automatically skipped:

```
Processing aws4.xml...
    No path data found, skipping shape
  Added 203 shape(s)
```

This is normal and expected. Image-based shapes cannot be converted to Excalidraw paths.

### Large File Sizes

The complete library is ~50MB. For better performance:

```bash
# Create smaller, category-specific libraries
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/aws \
  aws-only.excalidrawlib  # Much smaller file
```

### Memory Issues

For very large conversions:

```bash
# Increase Node.js memory
node --max-old-space-size=4096 xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils \
  complete.excalidrawlib
```

### Git LFS for Large Files

If committing large libraries to git:

```bash
# Install Git LFS
git lfs install

# Track large library files
git lfs track "*.excalidrawlib"

# Commit as usual
git add .gitattributes *.excalidrawlib
git commit -m "Add excalidraw libraries"
```

### Permission Errors

```bash
# Make scripts executable (if needed)
chmod +x xml-to-svg.js xml-to-excalidraw.js

# Run with explicit node
node xml-to-excalidraw.js input output
```

## Tips and Best Practices

### Organize by Use Case

Create libraries based on how you work:

```bash
# For cloud architecture diagrams
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/{aws*,azure*,gcp*} \
  cloud-architecture.excalidrawlib

# For network diagrams
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/{cisco*,rack*,network*} \
  network-diagrams.excalidrawlib

# For software design
node xml-to-excalidraw.js \
  ../drawio-desktop/drawio/src/main/webapp/stencils/{uml*,flowchart*,bpmn*} \
  software-design.excalidrawlib
```

### Test with Small Libraries First

```bash
# Start with the provided example
node xml-to-excalidraw.js \
  examples/basic-shapes \
  test-library.excalidrawlib

# Import to Excalidraw to verify it works
# Then proceed with larger conversions
```

### Keep Original XMLs

```bash
# Copy XMLs to your project before converting
mkdir my-stencils
cp ../drawio-desktop/drawio/src/main/webapp/stencils/my-needed-files.xml my-stencils/

# Convert your curated collection
node xml-to-excalidraw.js my-stencils my-custom-library.excalidrawlib
```

## Examples Directory

The repository includes a ready-to-use example:

```bash
# Use the included example
ls examples/
# basic-shapes/basic.xml
# basic-shapes.excalidrawlib

# Import examples/basic-shapes.excalidrawlib to Excalidraw
# Contains 30 basic shapes ready to use
```

## Need Help?

- Check the [API documentation](./API.md)
- Review [Architecture](./ARCHITECTURE.md)
- Open an issue on [GitHub](https://github.com/frankieliu/drawio-to-excalidraw/issues)
