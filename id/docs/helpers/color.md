# Color API

The Color API provides functionality for color manipulation and conversion. It allows you to create, modify, and analyze colors in different formats.

## Importing the API

```js
const Color = acode.require('Color');
```

## Usage

```js
const color = Color("#ff0000"); // Create a color from hex string
```

## Constructor

### Color(color: string)

Creates a new Color instance from a color string.

- `color`: A valid CSS color string (hex, rgb, hsl, color name etc.)

```js
const red = Color("#ff0000");
const blue = Color("rgb(0,0,255)");
const green = Color("green");
```

## Methods

### darken(ratio: number)

Darkens the color by the specified ratio.

- `ratio`: Number between 0 and 1 indicating how much to darken
- Returns: The modified Color instance

```js
const color = Color("#ff0000");
color.darken(0.2); // Makes the red 20% darker
```

### lighten(ratio: number)

Lightens the color by the specified ratio.

- `ratio`: Number between 0 and 1 indicating how much to lighten
- Returns: The modified Color instance

```js
const color = Color("#ff0000");
color.lighten(0.3); // Makes the red 30% lighter
```

## Properties

### isDark

Returns `true` if the color is considered dark (luminance < 0.5).

```js
Color("#000000").isDark // true
Color("#ffffff").isDark // false
```

### isLight

Returns `true` if the color is considered light (luminance >= 0.5).

```js
Color("#ffffff").isLight // true
Color("#000000").isLight // false
```

### lightness

Returns the HSL lightness value of the color (between 0 and 1).

```js
Color("#808080").lightness // 0.5
```

### luminance

Returns the perceived brightness of the color (between 0 and 1).

```js
Color("#ff0000").luminance // ~0.2126
```

### hex

Returns the hexadecimal representation of the color.

```js
Color("rgb(255,0,0)").hex // "#ff0000"
```

### hsl

Returns the HSL representation of the color.

```js
Color("#ff0000").hsl // {h: 0, s: 1, l: 0.5}
```
