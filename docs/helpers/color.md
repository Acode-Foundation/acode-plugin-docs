# Color API

The Color API provides functionality for color manipulation and conversion. It allows you to create, modify, and analyze colors in different formats.

:::info Verified against Acode v1.13.5
Every signature below is taken from `src/utils/color/index.js`, `hex.js`, `hsl.js` and `rgb.js`.
:::

## Importing the API

```js
const Color = acode.require("Color");
```

::: warning `Color` is not a global
`Color` is only reachable through [`acode.require()`](../global-apis/acode.md). Acode does not put it on `window`.
:::

:::tip Module names are case-insensitive
`acode.require("Color")`, `acode.require("color")` and `acode.require("COLOR")` all resolve to the same module — `require()` lower-cases the name before the lookup. An unknown name returns `undefined` instead of throwing.
:::

## Usage

```js
const color = Color("#ff0000"); // Create a color from hex string
```

## Constructor

### `Color(color: string)`

`acode.require("Color")` is a **factory function**, not a class. Calling it with `new` throws a `TypeError`, because the exported value is an arrow function:

```js
export default (/**@type {string}*/ color) => {
	return new Color(color);
};
```

Call it without `new`:

```js
const red = Color("#ff0000");
const blue = Color("rgb(0,0,255)");
const green = Color("green");
```

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `color` | `string` | Yes | — | Any color string the WebView's 2D-canvas `fillStyle` parser accepts. Parsing is delegated to the canvas: Acode clears a 1×1 pixel, assigns the string to `ctx.fillStyle`, fills it, and reads the pixel back into an `Rgb` |

### Accepted input formats

The constructor does **not** validate the string. Whatever the canvas accepts is accepted.

| Format | Examples |
| --- | --- |
| Hex | `"#f00"`, `"#ff0000"`, `"#ff0000ff"`, `"#ff000080"` |
| `rgb()` | `"rgb(255,0,0)"`, `"rgb(100% 0% 0%)"`, `"rgb(255 0 0)"` |
| `rgba()` | `"rgba(255,0,0,0.5)"`, `"rgba(255 0 0 / 50%)"` |
| `hsl()` | `"hsl(0, 100%, 50%)"`, `"hsl(0deg 100% 50%)"` |
| `hsla()` | `"hsla(0, 100%, 50%, 0.5)"` |
| Named | `"green"`, `"rebeccapurple"`, `"transparent"` |

The exact set Acode itself considers a valid *user-entered* color is the `colorRegex.anyStrict` pattern in `src/utils/color/regex.js`, which covers named colors, `rgb`, `rgba`, `hsl`, `hsla` and `#` + 3–8 hex digits.

## Methods

`Color` exposes exactly **two** mutating methods.

| Method | Signature | Returns | Description |
| --- | --- | --- | --- |
| `darken` | `darken(ratio: number)` | `Color` (the same instance, `this`) | Reduces HSL lightness by `ratio × lightness` |
| `lighten` | `lighten(ratio: number)` | `Color` (the same instance, `this`) | Raises HSL lightness by `ratio × lightness` |

### `darken(ratio: number)`

Darkens the color by the specified **ratio of its current lightness**, not by an absolute amount.

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `ratio` | `number` | Yes | — | Fraction of the current lightness to remove. Clamped by `Math.max(0, l - ratio * l)`, so the lightness never goes below `0` |

- Returns: the modified Color instance (`this`)

```js
const color = Color("#ff0000");
color.darken(0.2).hex.toString(); // "#CC0000"
```

### `lighten(ratio: number)`

Lightens the color by the specified **ratio of its current lightness**, not by an absolute amount.

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `ratio` | `number` | Yes | — | Fraction of the current lightness to add. Clamped by `Math.min(1, l + ratio * l)`, so the lightness never goes above `1` |

- Returns: the modified Color instance (`this`)

```js
const color = Color("#ff0000");
color.lighten(0.3).hex.toString(); // "#FF4D4D"
```

:::info There is no `toHex()`, `toRgb()`, `toHsl()`, `toGrayscale()`, `contrast()`, `mix()` or `invert()`
Those methods do not exist in this build. Conversion is done by reading the `hex`, `hsl` and `rgb` properties and calling `.toString()` on the value object. There is also no alpha setter and no CSS-variable integration on the `Color` side.
:::

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `rgb` | `Rgb` instance | **A value object, not a string.** `{ r, g, b }` are integers `0`–`255`; `a` is `0`–`1` |
| `hex` | `Hex` instance | **A value object, not a string.** `String(color.hex)` yields the hex text |
| `hsl` | `Hsl` instance | `{ h, s, l }` each `0`–`1`, plus `a` `0`–`1` |
| `isDark` | `boolean` | `luminance < 0.5` |
| `isLight` | `boolean` | `luminance >= 0.5` |
| `lightness` | `number` `0`–`1` | Shorthand for `color.hsl.l` |
| `luminance` | `number` | `0.2126·r + 0.7152·g + 0.0722·b` on the `0`–`1` channels |

### `isDark`

Returns `true` if the color is considered dark (luminance < 0.5).

```js
Color("#000000").isDark; // true
Color("#ffffff").isDark; // false
```

### `isLight`

Returns `true` if the color is considered light (luminance >= 0.5).

```js
Color("#ffffff").isLight; // true
Color("#000000").isLight; // false
```

### `lightness`

Returns the HSL lightness value of the color (between 0 and 1). Note this is `Color`'s own `0`–`1` value, **not** the `0`–`100` `Hsl.lightness` getter.

```js
Color("#808080").lightness; // 0.5019607843137255  (128 / 255)
Color("#ffffff").lightness; // 1
```

### `luminance`

Returns the perceived brightness of the color (between 0 and 1).

```js
Color("#ff0000").luminance; // 0.2126
Color("#ffffff").luminance; // 1
```

### `hex`

Returns a **`Hex` value object**, not a string. Call `.toString()` (or `String()`) on it.

```js
const hex = Color("rgb(255,0,0)").hex; // Hex { r: 255, g: 0, b: 0, a: 255 }
hex.toString(); // "#FF0000"  (uppercase)
```

| `Hex` member | Type | Description |
| --- | --- | --- |
| `r`, `g`, `b` | `number` | Channel values |
| `a` | `number` | Alpha, `0`–`255` |
| `toString(alpha?)` | `string` | With no argument: `#RRGGBB` when `a === 255`, otherwise `#RRGGBBAA`. `toString(true)` always appends alpha, `toString(false)` never does |
| `rgb` | `Rgb` | Round-trips back to an `Rgb` instance |

### `hsl`

Returns an **`Hsl` value object**, not a plain `{h, s, l}` literal.

```js
const hsl = Color("#ff0000").hsl; // Hsl { h: 0, s: 1, l: 0.5, a: 1 }
hsl.hValue; // 0    (0-360)
hsl.sValue; // 100  (0-100)
hsl.lValue; // 50   (0-100)
hsl.toString(); // "hsl(0, 100%, 50%)"
hsl.rgb.toString(); // "rgb(255, 0, 0)"
```

| `Hsl` member | Type | Description |
| --- | --- | --- |
| `h`, `s`, `l`, `a` | `number` | `h`/`s`/`l` normalised to `0`–`1`, `a` `0`–`1` |
| `hValue`, `hue` | `number` | Hue in degrees, `0`–`360` |
| `sValue`, `saturation` | `number` | Saturation in percent, `0`–`100` |
| `lValue` | `number` | Lightness in percent, `0`–`100` |
| `lightness` | `number` | Alias of `lValue` — **percent**, unlike `Color.lightness` |
| `rgb` | `Rgb` | Convert back to RGB (channels are rounded with `Math.round`) |
| `toString(alpha?)` | `string` | `hsl(H, S%, L%)`, or `hsla(H, S%, L%, A)` when `a !== 1` |

### `rgb`

Returns the **`Rgb` value object**. This is the only safe representation for translucent colors.

```js
const rgb = Color("rgba(255,0,0,0.5)").rgb; // Rgb { r: 255, g: 0, b: 0, a: 0.5 }
rgb.toString(); // "rgba(255, 0, 0, 0.5)"
```

| `Rgb` member | Type | Description |
| --- | --- | --- |
| `r`, `g`, `b` | `number` | Integer channels, `0`–`255` |
| `a` | `number` | Alpha, `0`–`1` |
| `toString(alpha?)` | `string` | With no argument: `rgb(r, g, b)` when `a === 1`, otherwise `rgba(r, g, b, a)`. `toString(true)` forces `rgba(...)`, `toString(false)` forces `rgb(...)` |

## Complete example

```js
const Color = acode.require("Color");
const ThemeBuilder = acode.require("themeBuilder");

const brand = "#2196F3";

// Every call returns a brand new instance, so build each step from the original
// string — darken()/lighten() mutate and return `this`, they do not copy.
const ramp = [
  brand,
  Color(brand).darken(0.15).hex.toString(),
  Color(brand).darken(0.35).hex.toString(),
  Color(brand).lighten(0.25).hex.toString(),
]; // ["#2196F3", "#0C81DF", "#0963AA", "#62B5F7"]

// Pick a readable foreground for any background
function textColorFor(bg) {
  return Color(bg).isDark ? "#FFFFFF" : "#121212";
}

// Feed the result straight into a theme. Assigning primaryColor also recomputes
// darkenedPrimaryColor, because autoDarkened defaults to true.
const theme = new ThemeBuilder("Ramp", "dark");
theme.primaryColor = brand;
theme.primaryTextColor = textColorFor(theme.primaryColor);

console.log(ramp);
console.log(theme.darkenedPrimaryColor); // "#085B9D"
console.log(String(Color("rgba(255,0,0,0.5)").rgb)); // "rgba(255, 0, 0, 0.5)"
```

## Gotchas

::: warning Invalid input never throws — it silently returns the previous color
`ctx.fillStyle = color` is ignored by the canvas when the string is unparseable, and the fill style from the **previous** `Color(...)` call is kept. `clearRect()` does not reset it. So:

```js
Color("not-a-color").hex.toString(); // "#000000" — canvas default, on a fresh session
Color("#ff0000");
Color("not-a-color").hex.toString(); // "#FF0000" — the previous color, not an error
```

Validate strings yourself before passing them in.
:::

::: warning `.hex` is an object, not a string
`Color("#ff0000").hex === "#ff0000"` is **false**. `hex`, `hsl` and `rgb` all return value objects. Use `.toString()` (or `String(...)`) whenever you need text.
:::

::: danger `.hex.toString()` is broken for translucent colors
`Hex.fromRgb()` stores `alpha × 255` **without rounding**. When that product is not a whole number the alpha becomes a fraction and the output is malformed:

```js
Color("rgba(255,0,0,0.5)").hex.toString(); // "#FF00007f.8"  <- not a valid CSS color
Color("rgba(255,0,0,0.5)").rgb.toString(); // "rgba(255, 0, 0, 0.5)"  <- correct
```

Use `.rgb.toString()` (or `.hsl.toString()`) whenever alpha is involved.
:::

::: warning `Color` has no `rgba` getter
`ThemeBuilder.toJSON("rgba")` calls `Color(value).rgba.toString()` internally, but `rgba` does not exist on `Color` — that call path throws a `TypeError`. Use `toJSON("hex")` or the default `toJSON()`. See [Theme Builder](./theme-builder.md).
:::

::: info `luminance` is not WCAG relative luminance
It is a plain weighted sum of the non-linearised `0`–`1` channels (`0.2126/0.7152/0.0722`) with no gamma correction, so it does not match the contrast ratios in WCAG 2.x. Use it for "light vs dark" decisions, as `isDark`/`isLight` do.
:::

::: warning `darken`/`lighten` are relative and mutate in place
The `ratio` is a fraction of the **current** lightness, so `darken(0.2)` twice is not the same as `darken(0.4)` once, and the methods return `this` rather than a copy. They also cannot move pure black: `Color("#000000").lighten(0.5)` stays black because `ratio × 0 === 0`.
:::

## See also

- [Theme Builder](./theme-builder.md) — `ThemeBuilder` builds on this helper for `darkenPrimaryColor()` and `toJSON("hex")`.
- [Themes](./themes.md) — how themes are registered and listed.
- [`acode.require()`](../global-apis/acode.md) — how modules are resolved.
