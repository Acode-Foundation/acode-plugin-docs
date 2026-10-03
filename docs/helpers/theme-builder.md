---
title: Theme Builder
description: Create and customize app themes with the ThemeBuilder class.
---

# Theme Builder

`ThemeBuilder` describes an **app theme**: a named set of colors that Acode turns into CSS variables on `:root`. Build one, then register it with the [`themes`](./themes.md) module.

```js
const ThemeBuilder = acode.require("themeBuilder");
```

## Create a theme

```js
new ThemeBuilder(name, type, version);
```

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | `""` | Theme name shown to the user. Its lowercase form is the theme [`id`](#id). |
| `type` | `"dark" \| "light"` | `"dark"` | Base color scheme. Sets the `theme-type` attribute on `<body>`. |
| `version` | `"free" \| "paid"` | `"free"` | Leave as `"free"`. Themes that are not `"free"` are treated as Pro themes, and Acode falls back to the default theme for users without Pro. |

```js
const theme = new ThemeBuilder("Midnight", "dark");
theme.primaryColor = "#0b1020";
theme.primaryTextColor = "#e6e9f5";
```

Every color starts from a default (listed below), so you only set the values you want to change. Colors can be any CSS color string: hex, `rgb()`, `rgba()`, and so on.

## Color and style properties

### Surface & text

| Property | CSS variable | Default |
| --- | --- | --- |
| `primaryColor` | `--primary-color` | `rgb(153, 153, 255)` |
| `primaryTextColor` | `--primary-text-color` | `rgb(255, 255, 255)` |
| `secondaryColor` | `--secondary-color` | `rgb(255, 255, 255)` |
| `secondaryTextColor` | `--secondary-text-color` | `rgb(37, 37, 37)` |
| `linkTextColor` | `--link-text-color` | `rgb(97, 94, 253)` |
| `borderColor` | `--border-color` | `rgba(122, 122, 122, 0.2)` |
| `boxShadowColor` | `--box-shadow-color` | `rgba(0, 0, 0, 0.2)` |
| `scrollbarColor` | `--scrollbar-color` | `rgba(0, 0, 0, 0.3)` |

### Accent & state

| Property | CSS variable | Default |
| --- | --- | --- |
| `activeColor` | `--active-color` | `rgb(51, 153, 255)` |
| `activeTextColor` | `--active-text-color` | `rgb(255, 215, 0)` |
| `activeIconColor` | `--active-icon-color` | `rgba(0, 0, 0, 0.2)` |
| `errorTextColor` | `--error-text-color` | `rgb(255, 185, 92)` |
| `successTextColor` | `--success-text-color` | `rgb(22, 152, 44)` |
| `dangerColor` | `--danger-color` | `rgb(160, 51, 0)` |

### Buttons

| Property | CSS variable | Default |
| --- | --- | --- |
| `buttonBackgroundColor` | `--button-background-color` | `rgb(51, 153, 255)` |
| `buttonTextColor` | `--button-text-color` | `rgb(255, 255, 255)` |
| `buttonActiveColor` | `--button-active-color` | `rgb(44, 142, 240)` |

### Popups & dialogs

| Property | CSS variable | Default |
| --- | --- | --- |
| `popupBackgroundColor` | `--popup-background-color` | `rgb(255, 255, 255)` |
| `popupTextColor` | `--popup-text-color` | `rgb(37, 37, 37)` |
| `popupIconColor` | `--popup-icon-color` | `rgb(153, 153, 255)` |
| `popupActiveColor` | `--popup-active-color` | `rgb(169, 0, 0)` |
| `popupBorderColor` | `--popup-border-color` | `rgba(0, 0, 0, 0)` |
| `popupBorderRadius` | `--popup-border-radius` | `4px` |

### Layout

| Property | CSS variable | Default |
| --- | --- | --- |
| `fileTabWidth` | `--file-tab-width` | `120px` |

::: tip Start with four
Most themes look coherent after setting just `primaryColor`, `primaryTextColor`, `secondaryColor` and `secondaryTextColor`. Adjust the rest as needed.
:::

::: info
The CSS variable `--danger-text-color` exists (default `rgb(255, 255, 255)`) but has no property on `ThemeBuilder`.
:::

## Other properties

### `id`

Read-only. The theme name in lowercase. The `themes` module uses it as the key, so two themes with names that differ only by case are the same theme.

### `darkenedPrimaryColor`

A darker variant of `primaryColor`. Acode uses it to darken the status and navigation bars while a dialog is open. While `autoDarkened` is `true` (the default), it is recalculated every time you assign `primaryColor`. Set `autoDarkened = false` first if you want to pick the value yourself:

```js
theme.autoDarkened = false;
theme.primaryColor = "#000000";
theme.darkenedPrimaryColor = "#000000";
```

### `preferredEditorTheme`, `preferredTerminalTheme`, `preferredFont`

Optional pairings that Acode applies together with the theme when the user selects it in **Settings → Themes**:

- `preferredEditorTheme`: id of an [editor theme](../utilities/editor-themes.md).
- `preferredFont`: name of a registered [font](./fonts.md).
- `preferredTerminalTheme`: id of a terminal theme (for example `"dark"`). Acode only applies this one the first time it applies a theme after starting, so don't rely on it to switch the terminal theme.

All three default to `null`, meaning "leave the user's choice alone".

## Methods

### `toJSON(colorType?)`

Returns a plain object with `name`, `type`, `version` and one camelCase key per color property (for example `primaryColor`).

`colorType` controls how colors are written: `"none"` (default) keeps them as you set them, `"hex"` converts to hex and `"rgba"` converts to `rgba()`.

### `toString()`

`JSON.stringify(theme.toJSON())`.

### `css`

Read-only getter that returns the theme as a single `:root { ... }` rule with all CSS variables.

### `matches(id)`

Returns `true` if the theme's id equals `id` (case-insensitive).

### `darkenPrimaryColor()`

Recomputes `darkenedPrimaryColor` from the current `primaryColor`. It returns nothing; read `darkenedPrimaryColor` afterwards.

### `ThemeBuilder.fromJSON(json)` <Badge type="tip" text="static" />

Creates a theme from an object shaped like the output of `toJSON()`. `name`, `type` and `version` are required; unknown keys are ignored.

```js
const copy = ThemeBuilder.fromJSON(theme.toJSON());
```

## Full example

```js
const ThemeBuilder = acode.require("themeBuilder");
const themes = acode.require("themes");

const theme = new ThemeBuilder("Ocean Night", "dark");

// Surfaces and text
theme.primaryColor = "#0d1b2a";
theme.primaryTextColor = "#e0e1dd";
theme.secondaryColor = "#1b263b";
theme.secondaryTextColor = "#c8ccd4";
theme.linkTextColor = "#7aa2f7";
theme.borderColor = "rgba(255, 255, 255, 0.12)";

// Accent and buttons
theme.activeColor = "#4cc9f0";
theme.buttonBackgroundColor = "#4cc9f0";
theme.buttonTextColor = "#0d1b2a";

// Popups
theme.popupBackgroundColor = "#1b263b";
theme.popupTextColor = "#e0e1dd";

// Pair it with an editor theme (optional)
theme.preferredEditorTheme = "tokyoNight";

themes.add(theme);
```

## Design tips

- Keep enough contrast between `primaryColor`/`primaryTextColor` and `secondaryColor`/`secondaryTextColor`.
- Set `type` to match your colors (`"dark"` for dark backgrounds). Acode exposes it as the `theme-type` attribute on `<body>`, which the built-in console and preview use to match light or dark.
- Test the theme on dialogs, the file browser and the settings pages, not only the editor.
