# API Documentation

## xml-to-svg.js

### XmlToSvgConverter

Convert draw.io XML stencil shapes to SVG format.

#### Constructor

```javascript
const converter = new XmlToSvgConverter();
```

#### Methods

##### convertShape(shapeNode)

Convert a single shape node to SVG.

**Parameters:**
- `shapeNode` (Object): Parsed XML shape node from xml2js

**Returns:**
```javascript
{
  name: string,      // Shape name
  width: number,     // Shape width
  height: number,    // Shape height
  svg: string        // Complete SVG markup
}
```

**Example:**
```javascript
import { XmlToSvgConverter } from './xml-to-svg.js';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXml = promisify(parseString);
const converter = new XmlToSvgConverter();

const xmlContent = readFileSync('shape.xml', 'utf-8');
const result = await parseXml(xmlContent);
const shapes = result.shapes.shape;

for (const shape of shapes) {
  const svgData = await converter.convertShape(shape);
  console.log(svgData.svg);
}
```

---

## xml-to-excalidraw.js

### XmlToExcalidrawConverter

Convert draw.io XML stencils to Excalidraw library format.

#### Constructor

```javascript
const converter = new XmlToExcalidrawConverter();
```

#### Methods

##### convertDirectory(inputDir, outputFile)

Convert all XML files in a directory to an Excalidraw library.

**Parameters:**
- `inputDir` (string): Path to directory containing XML files
- `outputFile` (string): Path for output `.excalidrawlib` file

**Returns:**
- Promise<Object>: Library object

**Example:**
```javascript
import { XmlToExcalidrawConverter } from './xml-to-excalidraw.js';

const converter = new XmlToExcalidrawConverter();
await converter.convertDirectory('./stencils', 'output.excalidrawlib');
```

##### convertXmlFile(filePath)

Convert a single XML file to library items.

**Parameters:**
- `filePath` (string): Path to XML file

**Returns:**
- Promise<Array>: Array of library items

**Example:**
```javascript
const items = await converter.convertXmlFile('./basic.xml');
console.log(`Converted ${items.length} shapes`);
```

##### convertShape(shapeNode)

Convert a single shape to an Excalidraw library item.

**Parameters:**
- `shapeNode` (Object): Parsed XML shape node

**Returns:**
- Promise<Object|null>: Library item or null if conversion fails

**Example:**
```javascript
const item = await converter.convertShape(shapeNode);
if (item) {
  console.log(`Created: ${item.name}`);
}
```

##### createElementFromSVG(shapeData)

Create an Excalidraw element from SVG data.

**Parameters:**
- `shapeData` (Object): Output from XmlToSvgConverter.convertShape()

**Returns:**
- Object|null: Library item with Excalidraw element

##### parsePathToPoints(pathData)

Parse SVG path data to point array.

**Parameters:**
- `pathData` (string): SVG path `d` attribute value

**Returns:**
- Array<[number, number]>: Array of [x, y] coordinate pairs

**Example:**
```javascript
const points = converter.parsePathToPoints('M 0 0 L 100 0 L 100 100 Z');
// Returns: [[0, 0], [100, 0], [100, 100], [0, 0]]
```

##### generateId()

Generate a random ID for Excalidraw elements.

**Returns:**
- string: Random alphanumeric ID

##### getXmlFiles(dir)

Recursively find all XML files in a directory.

**Parameters:**
- `dir` (string): Directory path

**Returns:**
- Array<string>: Array of file paths

---

## Data Types

### ShapeData

Output from XmlToSvgConverter.convertShape():

```typescript
interface ShapeData {
  name: string;      // Shape name from XML
  width: number;     // Shape width
  height: number;    // Shape height
  svg: string;       // Complete SVG markup
}
```

### LibraryItem

Individual item in Excalidraw library:

```typescript
interface LibraryItem {
  id: string;              // Unique identifier
  status: 'unpublished';   // Publication status
  created: number;         // Unix timestamp
  name: string;            // Shape name
  elements: ExcalidrawElement[];  // Array of Excalidraw elements
}
```

### ExcalidrawElement

Freedraw element structure:

```typescript
interface ExcalidrawElement {
  type: 'freedraw';
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  id: string;
  fillStyle: 'solid' | 'hachure' | 'cross-hatch' | 'zigzag';
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  roughness: number;
  opacity: number;
  angle: number;
  x: number;
  y: number;
  strokeColor: string;
  backgroundColor: string;
  width: number;
  height: number;
  seed: number;
  groupIds: string[];
  frameId: string | null;
  roundness: null;
  boundElements: any[];
  updated: number;
  link: string | null;
  locked: boolean;
  points: [number, number][];
  pressures: number[];
  simulatePressure: boolean;
}
```

### ExcalidrawLibrary

Complete library file structure:

```typescript
interface ExcalidrawLibrary {
  type: 'excalidrawlib';
  version: 2;
  source: 'drawio-converter';
  libraryItems: LibraryItem[];
}
```

---

## Command Line Usage

### xml-to-svg.js

```bash
node xml-to-svg.js <input.xml> [output.svg]
```

**Arguments:**
1. `input.xml` - Required: Path to draw.io XML stencil file
2. `output.svg` - Optional: Output SVG file path (defaults to input filename with .svg extension)

**Output:**
- Single shape: Creates one SVG file
- Multiple shapes: Creates multiple SVG files with pattern `output_N_ShapeName.svg`

**Exit Codes:**
- 0: Success
- 1: Error (file not found, parse error, etc.)

### xml-to-excalidraw.js

```bash
node xml-to-excalidraw.js <input-directory> <output.excalidrawlib>
```

**Arguments:**
1. `input-directory` - Required: Directory containing XML stencil files
2. `output.excalidrawlib` - Required: Output library file path

**Output:**
- Creates `.excalidrawlib` JSON file
- Prints progress to stdout
- Prints errors to stderr

**Exit Codes:**
- 0: Success
- 1: Error (directory not found, write error, etc.)

---

## Error Handling

### Common Errors

#### "No path data found, skipping shape"

Some shapes don't have path data (e.g., image-based shapes). These are automatically skipped.

```javascript
// This is handled internally
if (!pathMatch) {
  console.error(`    No path data found, skipping shape`);
  return null;
}
```

#### Parse Errors

XML parsing errors are caught and reported:

```javascript
try {
  const xmlContent = readFileSync(inputFile, 'utf-8');
  const result = await parseXml(xmlContent);
} catch (error) {
  console.error('Error converting XML to SVG:', error.message);
  process.exit(1);
}
```

---

## Extending the API

### Custom Shape Processing

To add custom shape processing:

```javascript
import { XmlToExcalidrawConverter } from './xml-to-excalidraw.js';

class CustomConverter extends XmlToExcalidrawConverter {
  async convertShape(shapeNode) {
    const result = await super.convertShape(shapeNode);

    // Add custom processing
    if (result) {
      result.customProperty = 'value';
    }

    return result;
  }
}
```

### Custom Element Types

To create different Excalidraw element types:

```javascript
createElementFromSVG(shapeData) {
  // Check if it's a rectangle
  if (this.isRectangle(shapeData)) {
    return this.createRectangleElement(shapeData);
  }

  // Fall back to freedraw
  return super.createElementFromSVG(shapeData);
}
```

---

## Performance Tips

1. **Batch processing**: Process multiple files in parallel
2. **Memory management**: Process large directories in chunks
3. **File filtering**: Skip non-XML files early
4. **Stream processing**: For very large XML files, use stream parsers

**Example - Parallel Processing:**
```javascript
const files = converter.getXmlFiles(inputDir);
const chunks = chunkArray(files, 10);

for (const chunk of chunks) {
  await Promise.all(chunk.map(file => converter.convertXmlFile(file)));
}
```
