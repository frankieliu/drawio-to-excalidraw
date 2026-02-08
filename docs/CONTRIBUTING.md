# Contributing to Draw.io to Excalidraw Converter

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/drawio-to-excalidraw.git
   cd drawio-to-excalidraw
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Making Changes

1. Make your changes in the appropriate files
2. Test your changes thoroughly
3. Add or update documentation as needed
4. Commit your changes with clear messages

### Testing Your Changes

```bash
# Test XML to SVG conversion
node xml-to-svg.js examples/basic-shapes/basic.xml test-output.svg

# Test XML to Excalidraw conversion
node xml-to-excalidraw.js examples/basic-shapes test-output.excalidrawlib

# Verify output
ls -lh test-output*
```

### Code Style

- Use tabs for indentation (matching draw.io-desktop conventions)
- Use clear, descriptive variable names
- Add comments for complex logic
- Keep functions focused and modular
- Follow existing code patterns

Example:
```javascript
/**
 * Parse SVG path data to point array
 * @param {string} pathData - SVG path d attribute
 * @returns {Array<[number, number]>} Array of coordinate pairs
 */
parsePathToPoints(pathData) {
	// Implementation
}
```

## Types of Contributions

### Bug Fixes

Found a bug? Great! Please:
1. Check if an issue already exists
2. If not, create a new issue describing the bug
3. Fork and fix the bug
4. Submit a pull request referencing the issue

### New Features

Want to add a feature? Please:
1. Open an issue first to discuss the feature
2. Get feedback from maintainers
3. Implement the feature
4. Add tests and documentation
5. Submit a pull request

### Documentation

Documentation improvements are always welcome:
- Fix typos or unclear explanations
- Add examples
- Improve API documentation
- Add tutorials or guides

### Examples

Adding example conversions:
- Add new XML files to `examples/`
- Generate corresponding `.excalidrawlib` files
- Document what makes this example interesting

## Commit Message Guidelines

Use clear, descriptive commit messages:

```
Add support for text elements in SVG conversion

- Implement text node processing in processNodeList()
- Add font size and family attributes
- Update tests and documentation
```

**Format:**
- First line: Brief summary (50 chars or less)
- Blank line
- Detailed explanation if needed

**Good examples:**
- `Fix path parsing for relative arc commands`
- `Add support for gradient fills`
- `Update README with installation instructions`

**Bad examples:**
- `fix bug`
- `updates`
- `WIP`

## Pull Request Process

1. **Update documentation** if you've changed APIs
2. **Add tests** if you've added functionality
3. **Update README.md** if needed
4. **Ensure all tests pass**
5. **Submit PR** with clear description:
   - What problem does it solve?
   - How does it solve it?
   - Any breaking changes?

### PR Template

```markdown
## Description
Brief description of changes

## Motivation
Why is this change needed?

## Changes
- List of changes made

## Testing
How was this tested?

## Screenshots (if applicable)
Before/after screenshots

## Checklist
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Code Review Process

1. Maintainers will review your PR
2. Address any feedback or requested changes
3. Once approved, maintainer will merge

## Reporting Issues

### Bug Reports

Please include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (Node version, OS, etc.)
- Sample files if applicable

**Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
1. Run command '...'
2. See error

**Expected behavior**
What you expected to happen

**Actual behavior**
What actually happened

**Environment:**
- OS: [e.g., macOS 14.0]
- Node version: [e.g., 20.10.0]
- Package version: [e.g., 1.0.0]

**Additional context**
Any other relevant information
```

### Feature Requests

Please include:
- Clear description of the feature
- Use case (why is it needed?)
- Proposed solution (if you have one)
- Alternatives considered

## Development Setup

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0
- git

### Project Structure

```
drawio-to-excalidraw/
├── xml-to-svg.js            # Core SVG converter
├── xml-to-excalidraw.js     # Core Excalidraw converter
├── package.json             # Dependencies and metadata
├── README.md                # Main documentation
├── LICENSE                  # Apache 2.0 license
├── .gitignore              # Git ignore rules
├── examples/                # Example files
│   ├── basic-shapes/       # Sample XML files
│   └── basic-shapes.excalidrawlib
└── docs/                    # Documentation
    ├── API.md              # API documentation
    ├── ARCHITECTURE.md     # Architecture overview
    └── CONTRIBUTING.md     # This file
```

## Adding New Shape Support

To add support for a new shape type:

1. **Identify the XML structure**:
   ```xml
   <shape>
     <background>
       <newshapetype x="0" y="0" .../>
     </background>
   </shape>
   ```

2. **Add parser in xml-to-svg.js**:
   ```javascript
   case 'newshapetype':
     const x = parseFloat(attrs.x || 0) * sx;
     const y = parseFloat(attrs.y || 0) * sy;
     // Process shape
     break;
   ```

3. **Test with sample XML**:
   ```bash
   node xml-to-svg.js test-new-shape.xml output.svg
   ```

4. **Add to documentation**

## Adding New Element Types

To create Excalidraw elements other than freedraw:

1. **Detect shape type** in createElementFromSVG():
   ```javascript
   if (this.isRectangle(shapeData)) {
     return this.createRectangleElement(shapeData);
   }
   ```

2. **Implement creator method**:
   ```javascript
   createRectangleElement(shapeData) {
     return {
       type: 'rectangle',
       // ... properties
     };
   }
   ```

3. **Test conversion**
4. **Update documentation**

## Questions?

- Open an issue for questions
- Check existing issues and documentation first
- Be respectful and constructive

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks
- Trolling or inflammatory comments
- Publishing others' private information

### Enforcement

Violations may result in temporary or permanent ban from the project.

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- README.md (for major features)

Thank you for contributing! 🎉
