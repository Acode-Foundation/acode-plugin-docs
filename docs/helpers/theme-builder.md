# Theme Builder


### Introduction

The `ThemeBuilder` api from the `acode` core libraries  provides a solution for creating and customizing themes in Acode . It offers control over various UI elements, colors, and styles.

:::info Verified against Acode v1.13.5
Every signature below is taken from `src/theme/builder.js`.
:::

### Basic Usage

1. **Import the ThemeBuilder Class**

```javascript
const ThemeBuilder = acode.require('themeBuilder');
```

2. **Create a Theme Instance**

```javascript
const myTheme = new ThemeBuilder("MyDarkTheme", "dark");
```

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | No | `""` | Display name. Also the registry key, via `theme.id === name.toLowerCase()` |
| `type` | `"dark" \| "light"` | No | `"dark"` | Base mode. Copied to `<body theme-type="…">` when the theme is applied |
| `version` | `"free" \| "paid"` | No | `"free"` | `"paid"` themes are ignored on builds without Pro. Keep `"free"` for plugin themes |

3. **Customize Theme Properties**

```javascript
myTheme.primaryColor = "#333";
myTheme.secondaryColor = "#666";
myTheme.textColor = "#ffffff";
myTheme.backgroundColor = "#121212";
```

::: warning Two of the four lines above do nothing
`textColor` and `backgroundColor` are **not** ThemeBuilder properties, and there are no `--text-color` / `--background-color` custom properties in this build. Assigning them just creates inert own properties on the object. The real text colour property is `secondaryTextColor`, and the surface colour is `secondaryColor`. See the full table below.
:::

### Customizable Theme Properties

Every colour is a plain getter/setter pair backed by one CSS custom property. The right-hand column is the default a fresh builder starts with.

#### Color Palette
| Property | CSS custom property | Default | Description |
| --- | --- | --- | --- |
| `primaryColor` | `--primary-color` | `rgb(153, 153, 255)` | Main colour for primary elements. Assigning it also recomputes `darkenedPrimaryColor` when `autoDarkened` is on |
| `primaryTextColor` | `--primary-text-color` | `rgb(255, 255, 255)` | Text drawn on `--primary-color` |
| `secondaryColor` | `--secondary-color` | `rgb(255, 255, 255)` | Surface / panel colour |
| `secondaryTextColor` | `--secondary-text-color` | `rgb(37, 37, 37)` | Body text colour |
| `activeColor` | `--active-color` | `rgb(51, 153, 255)` | Highlight for the selected row, active tab |
| `activeTextColor` | `--active-text-color` | `rgb(255, 215, 0)` | Text on the active element |
| `activeIconColor` | `--active-icon-color` | `rgba(0, 0, 0, 0.2)` | Tint for icons on the active element |
| `linkTextColor` | `--link-text-color` | `rgb(97, 94, 253)` | Clickable links |
| `dangerColor` | `--danger-color` | `rgb(160, 51, 0)` | Destructive actions |
| `errorTextColor` | `--error-text-color` | `rgb(255, 185, 92)` | Validation / error text |
| `successTextColor` | `--success-text-color` | `rgb(22, 152, 44)` | Confirmation text |

#### Typography
There are **no** `fontFamily`, `fontSize` or `fontWeight` properties on `ThemeBuilder`. Typography is not themed here — it comes from [`fonts.setAppFont()`](./fonts.md), which writes `--app-font-family`, and from `fonts.setEditorFont()`.

#### Specific Element Styles
| Property | CSS custom property | Default | Description |
| --- | --- | --- | --- |
| `buttonBackgroundColor` | `--button-background-color` | `rgb(51, 153, 255)` | Button fill |
| `buttonTextColor` | `--button-text-color` | `rgb(255, 255, 255)` | Button label |
| `buttonActiveColor` | `--button-active-color` | `rgb(44, 142, 240)` | Pressed button fill |
| `borderColor` | `--border-color` | `rgba(122, 122, 122, 0.2)` | Generic separators |
| `boxShadowColor` | `--box-shadow-color` | `rgba(0, 0, 0, 0.2)` | Shadows |
| `scrollbarColor` | `--scrollbar-color` | `rgba(0, 0, 0, 0.3)` | Scrollbar thumb |
| `fileTabWidth` | `--file-tab-width` | `120px` | Fixed tab width — **a length, not a colour** |
| `popupBackgroundColor` | `--popup-background-color` | `rgb(255, 255, 255)` | Popup / dialog surface |
| `popupTextColor` | `--popup-text-color` | `rgb(37, 37, 37)` | Popup text |
| `popupIconColor` | `--popup-icon-color` | `rgb(153, 153, 255)` | Popup icons |
| `popupActiveColor` | `--popup-active-color` | `rgb(169, 0, 0)` | Highlighted popup row |
| `popupBorderColor` | `--popup-border-color` | `rgba(0, 0, 0, 0)` | Popup outline |
| `popupBorderRadius` | `--popup-border-radius` | `4px` | Popup corner radius — **a length** |

### Non-CSS properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | `""` | Display name |
| `type` | `"dark" \| "light"` | `"dark"` | Base mode |
| `version` | `"free" \| "paid"` | `"free"` | Pro gate |
| `id` (getter only) | `string` | — | `name.toLowerCase()` |
| `autoDarkened` | `boolean` | `true` | When `true`, assigning `primaryColor` recomputes `darkenedPrimaryColor` |
| `preferredEditorTheme` | `string \| null` | `null` | CodeMirror theme applied alongside this theme on first use |
| `preferredTerminalTheme` | `string \| null` | `null` | Terminal palette applied alongside this theme on first use |
| `preferredFont` | `string \| null` | `null` | Editor font name, must exist in [`fonts`](./fonts.md) |
| `darkenedPrimaryColor` | `string` | *unset* | Not a declared accessor — see Gotchas |

### API

| Member | Signature | Returns |
| --- | --- | --- |
| `css` (getter) | `css` | `string` — a complete `:root { … }` rule |
| `toJSON` | `toJSON(colorType?: "rgba" \| "hex" \| "none")` | `Object<string, string>` |
| `toString` | `toString()` | `string` — `JSON.stringify(this.toJSON())` |
| `darkenPrimaryColor` | `darkenPrimaryColor()` | `undefined` |
| `matches` | `matches(id: string)` | `boolean` |
| `fromCSS` (static) | `ThemeBuilder.fromCSS(name: string, css: string)` | `ThemeBuilder` — **always throws, see Gotchas** |
| `fromJSON` (static) | `ThemeBuilder.fromJSON(theme: object)` | `ThemeBuilder` |

### `css`

Returns the whole theme as one CSS rule.

```javascript
const myTheme = new ThemeBuilder("MyDarkTheme", "dark");
myTheme.primaryColor = "#333";
myTheme.css;
// ":root {--popup-border-radius: 4px;--active-color: rgb(51, 153, 255);...--primary-color: #333;...}"
```

Note the exact shape: `:root {` immediately followed by `--key: value;` pairs — no space after the `{`, none before the `:`, one space after it. Every pair, including the last, ends in `;`, and the rule closes with `}`.

### `toJSON(colorType?)`

Flattens the theme into a plain object.

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `colorType` | `"rgba" \| "hex" \| "none"` | No | `"none"` | `"none"` returns the raw stored strings; `"hex"` runs every value through [`Color`](./color.md); `"rgba"` throws |

Returns `name`, `type`, `version`, then every CSS variable as a **PascalCase** key (`--primary-color` → `PrimaryColor`):

```javascript
new ThemeBuilder("MyDarkTheme", "dark").toJSON();
// {
//   name: "MyDarkTheme", type: "dark", version: "free",
//   PopupBorderRadius: "4px", ActiveColor: "rgb(51, 153, 255)",
//   PrimaryColor: "rgb(153, 153, 255)", FileTabWidth: "120px", ...
// }
```

### `matches(id)`

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | — | Compared case-insensitively against `this.id` |

Returns `boolean`. It throws if `id` is not a string, because both sides go through `.toLowerCase()`.

### `ThemeBuilder.fromJSON(theme)`

Rebuilds a builder from a `toJSON()` snapshot — this is how the app restores the saved **Custom** theme.

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `theme` | `object` | Yes | — | Must be an object with `name`, `type` and `version` |

**Throws** with a specific `Error` for each validation failure:

| Condition | Message |
| --- | --- |
| falsy | `Theme is required` |
| not an object | `Theme must be an object` |
| no `name` | `Theme name is required` |
| no `type` | `Theme type is required` |
| no `version` | `Theme version is required` |

Only keys that exist as a descriptor on `ThemeBuilder.prototype` are copied, so unknown keys in the JSON are silently ignored.

### `darkenPrimaryColor()`

Recomputes and stores `darkenedPrimaryColor` from the current `primaryColor`:

```javascript
this.darkenedPrimaryColor = Color(this.primaryColor).darken(0.4).hex.toString();
```

Returns `undefined` — the result is on the instance, not the return value.

### More Styling Options

#### Color Manipulation
```javascript
// Generate a darker version of the primary color.
// Returns undefined — read the value off the instance.
myTheme.darkenPrimaryColor();
console.log(myTheme.darkenedPrimaryColor); // "#…"
```

#### Theme Types
- `"light"`: Light color scheme
- `"dark"`: Dark color scheme

### Complete Theme Configuration Example

```javascript
const myCustomTheme = new ThemeBuilder("ModernDark", "dark");

// Color Configuration
myCustomTheme.primaryColor = "#2196F3";
myCustomTheme.secondaryColor = "#FF4081";
myCustomTheme.textColor = "#FFFFFF";
myCustomTheme.backgroundColor = "#121212";

// Typography
myCustomTheme.fontFamily = "Roboto, sans-serif";
myCustomTheme.fontSize = "16px";
myCustomTheme.fontWeight = "400";

// Element-Specific Styles
myCustomTheme.buttonBackgroundColor = "#2196F3";
myCustomTheme.buttonTextColor = "#FFFFFF";
myCustomTheme.borderColor = "#333333";
```

Only `primaryColor` and `secondaryColor` from the Color Configuration block have any effect, together with the whole Element-Specific Styles block. `textColor`, `backgroundColor`, `fontFamily`, `fontSize` and `fontWeight` are not ThemeBuilder properties. See the worked example below for the corrected version.

### Worked example: build a theme and register it

```javascript
const ThemeBuilder = acode.require('themeBuilder');
const themes = acode.require('themes');
const settings = acode.require('settings');
const Color = acode.require('Color');

const theme = new ThemeBuilder('Modern Dark', 'dark');
theme.primaryColor = '#2196F3';
theme.primaryTextColor = '#FFFFFF';
theme.secondaryColor = 'rgb(18, 20, 24)';
theme.secondaryTextColor = 'rgb(236, 240, 245)';
theme.activeColor = 'rgb(33, 150, 243)';
theme.activeTextColor = '#FFFFFF';
theme.linkTextColor = 'rgb(129, 199, 255)';
theme.borderColor = 'rgba(255, 255, 255, 0.08)';
theme.popupBackgroundColor = 'rgb(18, 20, 24)';
theme.popupTextColor = 'rgb(236, 240, 245)';
theme.popupIconColor = 'rgb(236, 240, 245)';
theme.scrollbarColor = 'rgba(255, 255, 255, 0.2)';
theme.dangerColor = 'rgb(220, 38, 38)';

// Optional app-level hooks, all honoured on first apply
theme.preferredEditorTheme = 'noctisLilac';
theme.preferredTerminalTheme = 'dark';
theme.preferredFont = 'Roboto Mono';

// `primaryColor` already computed this for us, because autoDarkened defaults to true
console.log(theme.darkenedPrimaryColor); // "#085B9D"

// Register it, then read it back out of the registry
themes.add(theme);
const registered = themes.get('Modern Dark');
console.log(registered === theme); // true — same live instance

// Persist the choice and paint it (themes.apply is a no-op for plugins)
settings.update({ appTheme: registered.id }, false);
const $style = document.head.get('style#app-theme') ?? (<style id="app-theme"></style>);
document.body.setAttribute('theme-type', registered.type);
$style.textContent = registered.css;
if (!$style.isConnected) document.head.append($style);

// Snapshot it — this is the shape ThemeBuilder.fromJSON() accepts
const saved = theme.toJSON(); // { name, type, version, PrimaryColor, ... }
const restored = ThemeBuilder.fromJSON(saved);
console.log(restored.css === theme.css); // true

// Pick readable text automatically
theme.primaryTextColor = Color(theme.primaryColor).isDark ? '#FFFFFF' : '#121212';
```

### Best Practices
- Choose a consistent color palette
- Ensure sufficient contrast between text and background
- Test your theme across different components and states
- Use the `darkenPrimaryColor()` method for dynamic color variations

### Supported CSS Custom Properties

The ThemeBuilder generates these 25 custom properties, all under `:root`:

- `--popup-border-radius`
- `--active-color`
- `--active-text-color`
- `--active-icon-color`
- `--border-color`
- `--box-shadow-color`
- `--button-active-color`
- `--button-background-color`
- `--button-text-color`
- `--error-text-color`
- `--success-text-color`
- `--primary-color`
- `--primary-text-color`
- `--secondary-color`
- `--secondary-text-color`
- `--link-text-color`
- `--scrollbar-color`
- `--popup-border-color`
- `--popup-icon-color`
- `--popup-background-color`
- `--popup-text-color`
- `--popup-active-color`
- `--danger-color`
- `--danger-text-color`
- `--file-tab-width`

::: info Two of those are not colours
`--popup-border-radius` (`4px`) and `--file-tab-width` (`120px`) are lengths. There is no `--text-color` and no `--background-color`.
:::

### Notes
- Always import the ThemeBuilder from the `acode` library
- Theme customization is flexible and supports both light and dark modes
- You can override default styles for specific UI components
- for theme management check the `themes`documentation

### Gotchas

::: danger `ThemeBuilder.fromCSS()` always throws
Two separate failure paths:

```javascript
static fromCSS(name, css) {
  const themeBuilder = new ThemeBuilder(name);
  const rules = css.match(/:root\s*{([^}]*)}/);
  if (!rules) throw new Error("Invalid CSS string");          // (a)
  const variables = rules[1].match(/--[\w-]+:\s*[^;]+/g);
  if (!variables) throw new Error("Invalid CSS string");       // (b)
  variables.forEach((variable) => {
    const [key, value] = variable.split(":");
    themeBuilder(ThemeBuilder.#toPascal(key.trim()), value.trim()); // (c) ← not callable
  });
  return themeBuilder;
}
```

If the CSS has no `:root { … }` block you get `Error("Invalid CSS string")`. If it has one but no custom properties you get the same error. If it parses, line (c) calls the **instance** as a function, which throws `TypeError: themeBuilder is not a function`. There is no input for which `fromCSS()` returns a builder.
:::

::: danger `toJSON("rgba")` throws
The `"rgba"` branch calls `Color(value).rgba.toString()`, but [`Color`](./color.md) has no `rgba` getter — it only defines `rgb`, `hex` and `hsl`. The call throws `TypeError: Cannot read properties of undefined (reading 'toString')`. Use the default `toJSON()` or `toJSON("hex")`.
:::

::: danger `toJSON("hex")` corrupts the non-colour values
`--popup-border-radius: 4px` and `--file-tab-width: 120px` are not colours. Running them through `Color()` hands an unparseable string to the canvas, which keeps its previous fill style and yields a plausible-looking colour instead of the length. After `toJSON("hex")` those two keys hold garbage. The app itself only ever calls `toJSON("hex")` to feed `system.setUiTheme()`, so this never shows up in the UI.
:::

::: warning `darkenedPrimaryColor` is not a real accessor
There is no `get darkenedPrimaryColor()` / `set darkenedPrimaryColor()` on the prototype. Assigning to it creates an ordinary own property that is **not** a CSS variable and is **not** part of `css` or `toJSON()`. That is deliberate: it is the value Acode hands to the native `system.setUiTheme()` to darken the status and navigation bars while a modal mask is up. Pre-installed themes set it by hand (for example `oled.darkenedPrimaryColor = "rgb(0, 0, 0)"`), and `darkenPrimaryColor()` recomputes it on demand.
:::

::: warning `autoDarkened` does not darken `--primary-color`
Setting `theme.primaryColor = '#2196F3'` stores `#2196F3` in `--primary-color` verbatim. The only side effect is that `darkenedPrimaryColor` is recomputed as `Color('#2196F3').darken(0.4)`. The built-in themes turn `autoDarkened` off because they set `darkenedPrimaryColor` explicitly.
:::

::: warning `--danger-text-color` has no accessor
It is present in the default variable map and therefore appears in `css` and `toJSON()` as `DangerTextColor`, but the class declares no getter/setter for it. Assigning `theme.dangerTextColor = …` silently creates an inert own property, and `fromJSON()` skips it because there is no descriptor on the prototype. It stays at its default, `rgb(255, 255, 255)`.
:::

::: warning `ThemeBuilder` is not a global
`acode.require('themeBuilder')` is the only way in. Register the result with [`themes.add()`](./themes.md) — the module stores `instanceof ThemeBuilder` objects only.
:::

### See also

- [Themes](./themes.md) — the registry that consumes `ThemeBuilder` instances.
- [Fonts](./fonts.md) — what `preferredFont` resolves against.
- [Color API](./color.md) — the helper behind `darkenPrimaryColor()` and `toJSON("hex")`.
- [Editor Themes](../utilities/editor-themes.md) — the separate CodeMirror theme registry, for `preferredEditorTheme`.
- [`acode.require()`](../global-apis/acode.md) — how modules are resolved.
