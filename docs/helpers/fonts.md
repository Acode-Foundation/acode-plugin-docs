# Acode Fonts Module

A straightforward API for managing fonts in your Acode project.

:::info Verified against Acode v1.13.5
Every signature below is taken from `src/lib/fonts.js`.
:::

## Quick Start

```javascript
const fonts = acode.require('fonts');
```

::: warning `fonts` is not a global
It is only reachable through [`acode.require()`](../global-apis/acode.md). Module names are matched case-insensitively, and an unknown name returns `undefined` rather than throwing.
:::

## What a "font" is

::: tip There is no font object
The registry is a plain `Map` from name to CSS text. A font is therefore just the **pair** `(name, css)`, and `get()` hands you back only the CSS half:

```javascript
fonts.get('Developer Mono');
// "@font-face {\n  font-family: 'Developer Mono';\n  ... }"
```

The map is keyed by the **exact** name string, so lookups are case-sensitive.
:::

The `css` value must be one or more complete `@font-face` rules. The `font-family` inside it should be written with **single quotes and the exact same text as the name**, because that is the string the app uses to detect an already-injected face.

## Core Methods

| Method | Signature | Returns |
| --- | --- | --- |
| `add` | `add(name: string, css: string)` | `undefined` |
| `addCustom` | `addCustom(name: string, css: string)` | `undefined` |
| `get` | `get(name: string)` | `string \| undefined` |
| `getNames` | `getNames()` | `string[]` |
| `remove` | `remove(name: string)` | `boolean` |
| `has` | `has(name: string)` | `boolean` |
| `isCustom` | `isCustom(name: string)` | `boolean` |
| `setFont` | `setFont(name: string)` | `Promise<void>` |
| `setEditorFont` | `setEditorFont(name: string)` | `Promise<void>` |
| `setAppFont` | `setAppFont(name?: string)` | `Promise<void>` |
| `loadFont` | `loadFont(name: string)` | `Promise<string>` |
| `injectFontFace` | `injectFontFace(name: string)` | `undefined` |

### `add(name, css)`
Adds a new font to your project. Registered **for this session only** — it is not written to storage and disappears when the app restarts.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | — | Key the font is stored and looked up under. Overwrites any existing entry with the same name |
| `css` | `string` | Yes | — | One or more `@font-face` declarations |

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

::: info Use `addCustom` if you want the font to survive a restart
`addCustom()` does everything `add()` does and additionally records the name in the `custom_fonts` set and rewrites the whole `custom_fonts` entry in `localStorage`. On the next app start `loadCustomFonts()` reads that key back and re-registers every saved custom font.
:::

### `addCustom(name, css)`
Adds a font **and persists it** to `localStorage` under the key `custom_fonts`.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | — | Key the font is stored and looked up under |
| `css` | `string` | Yes | — | One or more `@font-face` declarations |

**Returns:** `undefined`

### `get(name)`
Retrieves a specific font's **CSS text**.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | — | Exact registry key |

**Returns:** the raw `@font-face` string, or `undefined` when the name is not registered.

```javascript
const css = fonts.get('Developer Mono');
```

### `getNames()`
Lists all available font names.

**Returns:** a new `Array` of every registered name — the 11 pre-installed fonts plus anything you added.

```javascript
const fontList = fonts.getNames();
```

Pre-installed fonts: `Fira Code`, `Roboto Mono` (the editor default), `MesloLGS NF Regular`, `Source Code`, `Victor Mono Italic`, `Victor Mono Medium`, `Cascadia Code`, `Proggy Clean`, `JetBrains Mono Bold`, `JetBrains Mono Regular`, `Noto Mono`.

### `remove(name)`
Removes a font from the registry.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | — | Exact registry key |

**Returns:** `boolean` — `true` when something was actually removed. On success the name is also dropped from the custom set and `localStorage` is rewritten.

### `has(name)`
Membership test.

**Returns:** `boolean`

### `isCustom(name)`
Returns `true` when the name was registered through `addCustom()` (and is therefore persisted).

**Returns:** `boolean`

### `setFont(name)` / `setEditorFont(name)`
Applies a font to the code editor. `setFont` is a plain alias of `setEditorFont` — the theme applier calls `fonts.setFont(...)` too.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | — | A name that exists in the registry |

**Returns:** `Promise<void>`. Shows a title loader while it works, then writes a `<style id="editor-font-style">` rule:

```js
// .editor-container.ace_editor { font-family: "<name>", NotoMono, Monaco, MONOSPACE !important; }
// .ace_text { font-family: inherit !important; }
```

If the font cannot be loaded it toasts `"<name> font not found"` and falls back to `Roboto Mono` — it never rejects.

### `setAppFont(name)`
Applies a font to the whole application UI.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` \| falsy | No | none — there is no JS default | A registered font name. Any falsy value (`undefined`, `""`, …) takes the early-return branch and resets to the `"Roboto", sans-serif` stack |

**Returns:** `Promise<void>`. Writes a `<style id="app-font-style">` rule:

```js
// :root { --app-font-family: "<name>", "Roboto", sans-serif; }
```

On failure it toasts `"<name> font not found"` and resets to the default stack. It does not reject.

### `loadFont(name)`
Loads a font into the document's `<style id="font-face-style">` element, resolving remote files first.

**Parameters:**
| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string` | Yes | — | A registered font name |

**Returns:** `Promise<string>` resolving with the (possibly rewritten) CSS text. **Rejects** with `Error("Font <name> not found")` when the name is not in the registry.

For every `url(...)` in the CSS that starts with `http(s)` — skipping `localhost` — the file is downloaded once into `<DATA_STORAGE>/fonts/<name>` and the URL is replaced with an internal file URI. Then `document.fonts.load("12px '<name>'")` is awaited so the face is actually parsed.

### `injectFontFace(name)`
Non-blocking best-effort injection of the `@font-face` block, with no download step.

**Returns:** `undefined`. Does nothing when `get(name)` is `undefined`.

## How a plugin applies a font

```javascript
const fonts = acode.require('fonts');

(async () => {
  fonts.addCustom(
    'Developer Mono',
    `@font-face {
      font-family: 'Developer Mono';
      src: url('https://acode.app/SourceCodePro.ttf') format('truetype');
      font-weight: 300 700;
      font-style: normal;
    }`
  );

  // Editor pane
  await fonts.setEditorFont('Developer Mono');

  // Whole app UI
  await fonts.setAppFont('Developer Mono');

  console.log(fonts.has('Developer Mono'));     // true
  console.log(fonts.isCustom('Developer Mono')); // true
  console.log(fonts.getNames());                 // [... 'Developer Mono']
})();
```

## Gotchas

::: warning `get()` returns a CSS string, not a font object
`fonts.get('Developer Mono')` is the `@font-face` text (or `undefined`). There is no `{ name, css }` record to read.
:::

::: danger Remote font downloads are cached under the font **name**, not the URL
`downloadFont()` writes to `<DATA_STORAGE>/fonts/<name>` and returns early if that file already exists. Two different `@font-face` rules whose `src` differs but whose registered name is the same will silently share one cached file. Give every distinct source its own name.
:::

::: warning `remove()` on a pre-installed font only lasts for the session
The eleven built-in fonts are re-registered when the module initialises, so `remove('Fira Code')` succeeds (`true`) but the font comes back on the next app start.
:::

::: info The `name` must match the `font-family` exactly, in single quotes
`injectFontFace()` and `loadFont()` both detect an already-injected face with `$style.textContent.includes(\`font-family: '${name}'\`)`. If your CSS uses `font-family: "My Font"` (double quotes), a different case, or extra whitespace inside the quotes, the dedupe and replace logic silently misses and the rule is appended again on every load.
:::

## See also

- [Theme Builder](./theme-builder.md) — an app theme can also pin a default editor font via `preferredFont`.
- [Themes](./themes.md) — how themes are registered and listed.
- [`acode.require()`](../global-apis/acode.md) — how modules are resolved.
