---
title: Themes
description: Add, look up, list and update app themes from a plugin.
---

# Themes

The `themes` module manages Acode's **app themes** (the colors of the UI: toolbar, dialogs, buttons and so on). To change how *code* is colored, see [Editor Themes](../utilities/editor-themes.md) instead.

```js
const themes = acode.require("themes");
```

Themes are [`ThemeBuilder`](./theme-builder.md) instances. A theme's **id** is its `name` in lowercase, and ids are unique.

## Methods

### `add(theme)`

Registers a theme so it appears in **Settings → Themes**.

**Parameters**

- `theme` (`ThemeBuilder`): the theme to register. Anything that is not a `ThemeBuilder` instance is silently ignored.

**Behavior**

- If a theme with the same id already exists, the call does nothing. Use [`update`](#update-theme) to change an existing theme.
- If the user already selected this theme (for example, they picked it in a previous session), it is applied as soon as it is added.

```js
const ThemeBuilder = acode.require("themeBuilder");

const theme = new ThemeBuilder("Modern Dark", "dark");
theme.primaryColor = "#1e1e2e";
theme.primaryTextColor = "#cdd6f4";

themes.add(theme);
```

### `get(name)`

Returns the registered `ThemeBuilder` for a name, or `undefined`. The lookup is case-insensitive.

```js
const theme = themes.get("Modern Dark");
```

### `list()`

Returns a summary of every registered theme (built-in and plugin-provided).

**Returns:** `Array<{ id: string, name: string, type: string, version: string, primaryColor: string }>`

`name` here is the id with its first letter capitalized (for example `"Ocean night"` for a theme named `"Ocean Night"`), not the original `name`. Compare by `id` instead.

```js
themes.list().forEach(({ id, name, type }) => {
  console.log(id, name, type);
});
```

### `update(theme)`

Copies every value from `theme.toJSON()` (`name`, `type`, `version` and **all** colors) onto the registered theme with the same id. If no such theme exists, it is added instead.

Colors you did not set on `theme` are copied too, as ThemeBuilder defaults. To change a few colors, edit the registered theme directly, or pass a theme with every color set:

```js
const theme = themes.get("Modern Dark");
theme.primaryColor = "#11111b";
```

::: info
`toJSON()` does not include `preferredEditorTheme`, `preferredTerminalTheme`, `preferredFont`, `autoDarkened` or `darkenedPrimaryColor`, so `update` does not copy them. Set those on the registered theme directly.
:::

::: warning
`update` (or editing the registered theme) changes the stored theme, but it does **not** re-render the UI. If the theme is currently active, its new colors show up the next time the theme is applied (for example, when the user re-selects it or restarts Acode).
:::

## Example: ship a theme with your plugin

```js
class AcodePlugin {
  async init() {
    const ThemeBuilder = acode.require("themeBuilder");
    const themes = acode.require("themes");

    const theme = new ThemeBuilder("Midnight", "dark");
    theme.primaryColor = "#0b1020";
    theme.primaryTextColor = "#e6e9f5";
    theme.secondaryColor = "#131a30";
    theme.secondaryTextColor = "#c9cee6";
    theme.activeColor = "#5b8cff";

    themes.add(theme);
  }

  async destroy() {}
}
```

::: info
There is no `remove` method: a theme stays registered until Acode restarts. Because `add` ignores duplicate ids, running `init` again in the same session is safe.
:::
