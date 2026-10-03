---
title: Fonts
description: Register, remove and apply editor and app fonts from a plugin.
---

# Fonts

The `fonts` module manages the fonts Acode can use for the editor and the app UI. Plugins use it to register extra fonts, so they appear in the **Editor font**, **App font** and terminal font pickers and in the Font Manager, and to apply a font programmatically.

```js
const fonts = acode.require("fonts");
```

A font is stored as a name plus a CSS `@font-face` declaration. Acode ships with several built-in fonts (for example `Roboto Mono`, `Fira Code`, `JetBrains Mono Regular`).

## Methods

| Method | Returns | Description |
| --- | --- | --- |
| [`add(name, css)`](#add-name-css) | `void` | Register a font for this session. |
| [`addCustom(name, css)`](#addcustom-name-css) | `void` | Register a font and persist it across restarts. |
| [`get(name)`](#get-name) | `string \| undefined` | Get the `@font-face` CSS of a font. |
| [`getNames()`](#getnames) | `string[]` | List every registered font name. |
| [`has(name)`](#has-name) | `boolean` | Check whether a font is registered. |
| [`isCustom(name)`](#iscustom-name) | `boolean` | Check whether a font was added with `addCustom`. |
| [`remove(name)`](#remove-name) | `boolean` | Unregister a font. |
| [`setEditorFont(name)`](#seteditorfont-name) | `Promise<void>` | Apply a font to the editor. |
| [`setAppFont(name?)`](#setappfont-name) | `Promise<void>` | Apply a font to the app UI. |
| [`loadFont(name)`](#loadfont-name) | `Promise<string>` | Load a font's files and inject its `@font-face`. |

### `add(name, css)`

Registers a font in memory. It is gone after Acode restarts, so call it from your plugin's `init` every time.

**Parameters**

- `name` (`string`): unique font name. Registering an existing name replaces it.
- `css` (`string`): a complete `@font-face` declaration. The `font-family` inside it should match `name`.

```js
fonts.add(
  "Developer Mono",
  `@font-face {
    font-family: 'Developer Mono';
    src: url('https://example.com/devmono.woff2') format('woff2');
    font-weight: 400;
  }`,
);
```

::: tip Remote fonts are cached
When a font is applied, every `http(s)://` URL in its `src` (except `localhost`) is downloaded once and stored in Acode's data directory under `fonts/`. Later loads use the local copy, so the font works offline.
:::

### `addCustom(name, css)`

Same as `add`, but the font is also saved to storage and restored on the next launch. This is what the Font Manager uses when a user adds a font.

```js
fonts.addCustom("Developer Mono", css);
```

::: warning
A plugin that calls `addCustom` should also call `remove` in its unmount handler if the font must disappear when the plugin is uninstalled. Otherwise the font stays registered.
:::

### `get(name)`

Returns the stored CSS string, or `undefined` if no font has that name.

```js
const css = fonts.get("Developer Mono");
```

### `getNames()`

Returns the names of all registered fonts, built-in and custom.

```js
console.log(fonts.getNames()); // ["Fira Code", "Roboto Mono", ...]
```

### `has(name)`

```js
if (!fonts.has("Developer Mono")) {
  fonts.add("Developer Mono", css);
}
```

### `isCustom(name)`

Returns `true` for fonts registered with `addCustom` (including ones restored from a previous session).

### `remove(name)`

Removes a font. If it was a custom font, the saved copy is removed as well.

**Returns:** `true` if a font was removed, `false` if the name was unknown.

### `setEditorFont(name)`

Loads the font and applies it to the editor. If the font is unknown or fails to load, Acode shows an error toast and falls back to `Roboto Mono`.

`fonts.setFont(name)` is an alias for this method.

```js
await fonts.setEditorFont("Fira Code");
```

::: info
This changes the active editor style only. It does not update the saved **Editor font** setting. To make the choice persist, also call `acode.require("settings").update({ editorFont: name })` (see [Settings](../editor-components/settings.md)).
:::

### `setAppFont(name?)`

Loads the font and applies it as the app UI font (`--app-font-family`). Call it without arguments to restore the default (`Roboto`).

```js
await fonts.setAppFont("Developer Mono");
await fonts.setAppFont(); // back to default
```

### `loadFont(name)`

Downloads any remote files referenced by the font, injects the `@font-face` rule and waits for the browser to load it. `setEditorFont` and `setAppFont` call this for you; use it directly only when you need the font available (for example in your own UI) without changing the editor or app font.

**Throws** an `Error` if the font is not registered.

```js
await fonts.loadFont("Developer Mono");
element.style.fontFamily = "'Developer Mono'";
```

## Example: bundle a font with your plugin

```js
async init(_page, _cacheFile, _cacheFileUrl, _firstInit) {
  const fonts = acode.require("fonts");
  const fontUrl = `${this.baseUrl}fonts/Mono.woff2`;

  fonts.add(
    "My Plugin Mono",
    `@font-face {
      font-family: 'My Plugin Mono';
      src: url('${fontUrl}') format('woff2');
    }`,
  );
}

async destroy() {
  acode.require("fonts").remove("My Plugin Mono");
}
```

Remember to list font files in the [`files`](../plugin-essentials/manifest.md#files) array of `plugin.json` so they are included in your zip.
