# Acode Fonts Module

A straightforward API for managing fonts in your Acode project.

## Quick Start

```javascript
const fonts = acode.require('fonts');
```

## Core Methods

### `add(name, css)`
Adds a new font to your project.

**Parameters:**
- `name`: Unique identifier for the font
- `css`: CSS `@font-face` declaration

**Example:**
```javascript
fonts.add(
  'Developer Mono', 
  `@font-face {
    font-family: 'Developer Mono';
    src: url('/fonts/devmono.woff2') format('woff2');
    font-weight: 400;
  }`
);
```

### `get(name)`
Retrieves a specific font's details.

**Returns:** Font object with `name` and `css` properties

```javascript
const font = fonts.get('Developer Mono');
```

### `getNames()`
Lists all available font names.

```javascript
const fontList = fonts.getNames();
