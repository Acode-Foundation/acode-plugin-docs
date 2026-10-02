# Acode Theme Management

Acode provides a flexible and intuitive module for managing themes, enabling developers to seamlessly add, retrieve, update, and list themes within their project.

:::info Verified against Acode v1.13.5
Every signature below is taken from `src/theme/list.js` and the plugin-facing wrapper in `src/lib/acode.js`.
:::

## API Overview

```javascript
const themes = acode.require('themes');
```

::: warning `themes` is not a global
It is only reachable through [`acode.require()`](../global-apis/acode.md).
:::

## App themes vs editor themes

This module manages **app / UI themes**: a `:root { --custom-property: value; … }` block of CSS custom properties that restyles Acode's chrome, dialogs, popups and scrollbars.

It is a **completely different registry** from the CodeMirror syntax themes you register with `acode.require('editorThemes')`.

| | `acode.require('themes')` | `acode.require('editorThemes')` |
| --- | --- | --- |
| Styles | Acode's own UI (pages, dialogs, quick tools, native system bars) | The code editor's syntax colouring only |
| Object you pass | A `ThemeBuilder` **instance** | A plain spec object `{ id, caption?, dark?, getExtension \| extensions }` |
| Registry method | `add(builder)` | `register(spec)` |
| Keys | `name.toLowerCase()` | The `id` you pass |
| Apply | **Deprecated no-op** — see below | `editorThemes.apply(id)` |

See [Editor Themes](../utilities/editor-themes.md) for the editor-side API. A theme plugin normally registers with **both**.

## Methods

The module object handed to plugins has exactly five members.

| Method | Signature | Returns |
| --- | --- | --- |
| `add` | `add(theme: ThemeBuilder)` | `undefined` |
| `get` | `get(name: string)` | `ThemeBuilder \| undefined` |
| `list` | `list()` | `Array<ThemeSummary>` |
| `update` | `update(theme: ThemeBuilder)` | `undefined` |
| `apply` | `apply(id: string, init?: boolean)` | `undefined` — **does nothing** |

### `add(theme: ThemeBuilder)`

Adds a new theme to the theme collection.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `theme` | `ThemeBuilder` | Yes | — | An **instance** of [`ThemeBuilder`](./theme-builder.md). Anything else is silently ignored |

Returns: `undefined`.

There is no success/failure signal. The call bails out silently — again with `undefined` — when:

1. `theme` is not `instanceof ThemeBuilder`. A plain object literal, however perfect, is dropped.
2. A theme with that `id` is already registered. The registry key is `theme.id`, which is `theme.name.toLowerCase()`.

Otherwise the theme is stored, and if its `id` matches the currently selected `settings.value.appTheme`, the app immediately applies it. That last step works even though `themes.apply` is a no-op for plugins, because `add()` calls the internal applier directly.

**Example:**
```javascript
const ThemeBuilder = acode.require('themeBuilder');
const themes = acode.require('themes');

const theme = new ThemeBuilder('Modern Dark', 'dark');
theme.primaryColor = 'rgb(33, 150, 243)';
themes.add(theme);
```

::: warning Theme ids are the lower-cased name
`new ThemeBuilder('Modern Dark')` registers under `modern dark`. `get('modern dark')` and `get('Modern Dark')` both work because `get()` lower-cases its argument, but two themes whose names differ only in case collide.
:::

::: warning `version` gates whether the theme is usable
A theme with `version: 'paid'` is replaced by `default` on a build without Pro, and the selection is silently rewritten to `default`. `new ThemeBuilder(name, type)` defaults `version` to `'free'`, which is what you want for a plugin theme.
:::

### `get(name: string)`

Retrieves a specific theme by its name.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | — | The theme name; lower-cased before the lookup |

**Returns:** the live `ThemeBuilder` instance, or `undefined` when no theme has that id.

Because it returns the **registered instance**, mutating it mutates the theme in place:

```javascript
const theme = themes.get('Modern Dark');
if (theme) {
  theme.primaryColor = 'rgb(0, 122, 255)';
  theme.activeColor = 'rgb(0, 122, 255)';
}
```

### `list()`

Returns a summary of every registered theme.

**Returns:** `Array` of plain objects:

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | `name.toLowerCase()` |
| `name` | `string` | The theme name, **title-cased** by `String.prototype.capitalize()` — `"modern dark"` comes back as `"Modern Dark"` |
| `type` | `string` | `"light"` or `"dark"` |
| `version` | `string` | `"free"` or `"paid"` |
| `primaryColor` | `string` | The theme's `--primary-color` value |

Note this is a **summary, not the theme**: the returned objects have no `css`, no `toJSON()` and no accessors. Use `get(theme.id)` when you need the builder.

```javascript
themes.list().forEach(({ id, name, type }) => {
  console.log(`${id} — ${name} (${type})`);
});
```

### `update(theme: ThemeBuilder)`

Updates an existing theme in the theme collection.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `theme` | `ThemeBuilder` | Yes | — | A `ThemeBuilder` **instance**. Non-instances are ignored |

**Returns:** `undefined`.

Two distinct behaviours:

- **Not registered yet** → it delegates to `add(theme)`, so an unknown id is created rather than updated.
- **Already registered** → every key of `theme.toJSON()` is copied onto the existing builder, which means it goes through the accessors and updates the underlying CSS variables in place. `name`, `type` and `version` are copied as plain fields.

Because `toJSON()` only returns the theme's own colour variables plus `name`/`type`/`version`, non-colour extras you attach to a builder (`preferredFont`, `darkenedPrimaryColor`, …) are **not** copied by `update()`.

### `apply(id, init?)` <Badge type="warning" text="deprecated" />

::: danger `apply` is a no-op
The plugin-facing module replaces it with an empty arrow function:

```javascript
const themesModule = {
  add: themes.add,
  get: themes.get,
  list: themes.list,
  update: themes.update,
  // Deprecated, not supported anymore
  apply: () => {},
};
```

Calling `themes.apply('modern dark')` returns `undefined` and changes nothing — no CSS, no settings, no repaint. Use [`Settings`](../editor-components/settings.md) to persist a selection and inject the CSS yourself.
:::

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `string` | Yes | — | Ignored |
| `init` | `boolean` | No | `undefined` | Ignored |

## Complete example

Register a theme, read it back, and make it live:

```javascript
const themes = acode.require('themes');
const ThemeBuilder = acode.require('themeBuilder');
const settings = acode.require('settings');

const theme = new ThemeBuilder('Acme', 'dark');
theme.primaryColor = 'rgb(33, 150, 243)';
theme.secondaryColor = 'rgb(24, 28, 34)';
theme.popupBackgroundColor = 'rgb(18, 20, 24)';
theme.popupTextColor = 'rgb(236, 240, 245)';
// Assigning primaryColor already computed this, because autoDarkened defaults to true
theme.darkenedPrimaryColor = 'rgb(8, 91, 157)';

// 1. Register it. Silently ignored if the id already exists.
themes.add(theme);

// 2. Confirm it is in the registry.
console.log(themes.list().map((t) => t.id)); // [..., 'acme']
const registered = themes.get('Acme');      // the very same instance you added
console.log(registered === theme); // true

// 3. Persist the selection so it survives a restart.
settings.update({ appTheme: registered.id }, false);

// 4. themes.apply() is a no-op, so do what the app's internal applier does.
const $style = document.head.get('style#app-theme') ?? (<style id="app-theme"></style>);
document.body.setAttribute('theme-type', registered.type);
$style.textContent = registered.css;
if (!$style.isConnected) document.head.append($style);
```

## Gotchas

::: warning `settings.update({ appTheme })` does **not** repaint
The only `update:appTheme` listener is the system colour-scheme watcher. Writing `appTheme` persists the choice; it does not regenerate the `<style id="app-theme">` element. Inject `theme.css` yourself, as in step 4 above.
:::

::: warning `add()` returns `undefined` even when it does nothing
There is no way to tell "registered" from "rejected because the id was taken" from the return value. Check with `themes.get(id) === undefined` first if that matters.
:::

::: warning Mutating a builder does not repaint either
`themes.get(id).primaryColor = '…'` changes the value object, but the live `<style id="app-theme">` was written once at apply time. Re-inject `theme.css` after any mutation.
:::

::: warning `list()` title-cases the name but `id` stays lower-case
Matching a `list()` result against `settings.value.appTheme` must be done on `id`, since `appTheme` may hold either casing and `name` is rewritten by `capitalize()`.
:::

::: info Internal members are not exposed
The internal registry also exports `init()`, `applied` and `updateSystemThemeWatcher()`, but the plugin-facing module omits all three. You cannot force a re-apply or re-run the system-theme sync from a plugin.
:::

## See also

- [Theme Builder](./theme-builder.md) — the object `add`/`get`/`update` require.
- [Editor Themes](../utilities/editor-themes.md) — the separate CodeMirror theme registry.
- [Fonts](./fonts.md) — `preferredFont` and `fonts.setEditorFont()`.
- [Color API](./color.md) — how `ThemeBuilder` derives its darkened primary colour.
- [`acode.require()`](../global-apis/acode.md) — how modules are resolved.
