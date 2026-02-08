# Draw.io Shape Systems

Draw.io uses **two different systems** for rendering shapes:

## 1. XML Stencils (Static Definitions)

**Location:** `drawio/src/main/webapp/stencils/*.xml`

**Example files:**
- `stencils/mockup/misc.xml` - Mockup misc shapes
- `stencils/ios7/icons.xml` - iOS 7 icons
- `stencils/flowchart.xml` - Flowchart shapes

**Characteristics:**
- ✅ Static, declarative shape definitions
- ✅ Fixed default colors (typically gray #e0e0e0, black #000000)
- ✅ Standard sizes defined in XML
- ✅ Simple to parse and convert
- ✅ Our converter handles these perfectly

**XML Structure:**
```xml
<shape name="Search Box" h="44" w="350" aspect="1">
    <foreground>
        <strokecolor color="#000000"/>
        <fillcolor color="#fafafa"/>
        <roundrect x="0" y="0" w="350" h="44" arcsize="6.4"/>
        <fillstroke/>
        <text str="Search" x="272" y="22" valign="middle" align="center"/>
    </foreground>
</shape>
```

**Converted Output:** Standard SVG with fixed colors and sizes

---

## 2. JavaScript Shapes (Programmable)

**Location:** `drawio/src/main/webapp/shapes/*/*.js`

**Example files:**
- `shapes/mockup/mxMockupForms.js` - Form elements (Search Box, Sign In, etc.)
- `shapes/ios7/mxIOS7Ui.js` - iOS UI components (App Bar, Sliders, etc.)
- `shapes/mockup/mxMockupMisc.js` - Misc mockup shapes

**Characteristics:**
- 🎨 **Programmable** - JavaScript code renders shapes dynamically
- 🎨 **Customizable colors** via style parameters (strokeColor2, fillColor2, etc.)
- 🎨 **Resizable** - Width/height parameters affect rendering
- 🎨 **User-configurable** through draw.io's GUI properties panel
- ❌ **Cannot be directly converted** - requires JavaScript execution

**JavaScript Structure:**
```javascript
function mxShapeMockupSearchBox(bounds, fill, stroke, strokewidth) {
    mxShape.call(this);
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
}

mxShapeMockupSearchBox.prototype.customProperties = [
    {name: 'strokeColor2', dispName: 'Icon Color', type: 'color', primary:true}
];

mxShapeMockupSearchBox.prototype.foreground = function(c, w, h) {
    var strokeColor2 = mxUtils.getValue(this.style, 'strokeColor2', '#008cff');
    var mainText = mxUtils.getValue(this.style, 'mainText', 'Search');

    c.text(5, h * 0.5, 0, 0, mainText, mxConstants.ALIGN_LEFT, ...);
    c.setStrokeColor(strokeColor2);
    c.ellipse(w - 15, h * 0.5 - 8, 10, 10);  // Magnifying glass
    c.stroke();
};
```

**Shape Names in draw.io:**
- `mxgraph.mockup.forms.searchBox`
- `mxgraph.ios7.icons.alarm_clock`
- `mxgraph.ios7ui.appBar`

---

## Key Differences

| Feature | XML Stencils | JavaScript Shapes |
|---------|-------------|-------------------|
| **Definition** | Static XML | JavaScript code |
| **Colors** | Fixed defaults | User-customizable |
| **Size** | Standard size | Scales dynamically |
| **Customization** | None | Properties panel in GUI |
| **Conversion** | ✅ Easy | ❌ Requires JS execution |
| **Examples** | Flowchart shapes, basic icons | UI components, mockups |

---

## Why Document Files Look Different

When you use draw.io's GUI:

1. **Select shape** from shape panel
2. **Drag to canvas** - creates shape with custom size
3. **Edit colors** in properties panel - overrides defaults
4. **Save as SVG** - exports with your custom settings

**Example:**

**XML Stencil (Search Box):**
- Size: 350×44px
- Colors: Gray (#fafafa), Black (#000000)
- Icon: Left side, dark blue (#2c457e)

**JavaScript Shape (mxgraph.mockup.forms.searchBox):**
- Size: Whatever you set (e.g., 150×30px)
- Colors: Customizable via properties (e.g., #008cff light blue)
- Icon: Positioned dynamically based on width

---

## JavaScript Shape Locations

### Mockup Shapes
- `shapes/mockup/mxMockupForms.js` - Search boxes, sign in forms, combo boxes
- `shapes/mockup/mxMockupButtons.js` - Buttons, toggles
- `shapes/mockup/mxMockupContainers.js` - Windows, panels
- `shapes/mockup/mxMockupMisc.js` - Misc UI elements
- `shapes/mockup/mxMockupiOS.js` - iOS-specific mockups

### iOS7 Shapes
- `shapes/ios7/mxIOS7Ui.js` - iOS 7 UI components
  - App Bar, On/Off Button, Slider
  - Download Bar, Icon Grid, Phone
  - Search Box, URL Bar, Action Dialog

### Other JavaScript Shapes
- `shapes/mxBasic.js` - Basic shapes
- `shapes/mxArrows.js` - Arrow shapes
- `shapes/mxGCP2.js` - Google Cloud Platform
- `shapes/mxAWS3D.js` - AWS shapes
- And many more...

---

## Our Converter

**What we convert:** ✅ XML Stencils
- All shapes in `stencils/*.xml` directories
- 8,746+ shapes across 200+ files
- Outputs standard SVG with fixed colors

**What we cannot convert:** ❌ JavaScript Shapes
- Shapes defined in `shapes/*/*.js` files
- Requires JavaScript runtime and mxGraph library
- Would need headless browser or JS engine to render

---

## Summary

Your **document files** use **JavaScript shapes** with custom styling from the GUI:
- `mxgraph.mockup.forms.searchBox` - 150×30, light blue (#008cff)
- `mxgraph.ios7.icons.alarm_clock` - 27×30, light blue (#0080f0)

Our **generated files** use **XML stencils** with default styling:
- Search Box from `stencils/mockup/misc.xml` - 350×44, dark blue (#2c457e)
- Alarm Clock from `stencils/ios7/icons.xml` - 90×101, gray (#e0e0e0)

Both are valid - they're just from different shape systems in draw.io!
