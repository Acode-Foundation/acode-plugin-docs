# Editor Themes API

The Editor Themes API lets plugins register CodeMirror themes in Acode.

This is the **editor** (syntax colouring) registry. It is a different API from [`acode.require("themes")`](../helpers/themes.md), which registers app/UI themes — a theme plugin normally registers with both.

::: code-group

```js [app themes]
// Different API: Acode's own UI (pages, dialogs, scrollbars, system bars).
const ThemeBuilder = acode.require("themeBuilder");
acode.require("themes").add(new ThemeBuilder("Modern Dark", "dark"));
```

```js [editor themes]
// This page: the CodeMirror editor's syntax colouring.
editorThemes.register({
  id: "example-night",
  caption: "Example Night",
  dark: true,
  getExtension: () => editorThemes.createTheme({ dark: true, styles: { "&": { color: "#d6deeb" } } }),
});
```

:::

## Import

```js
const editorThemes = acode.require("editorThemes");
```

## API Surface

| Member | Signature | Returns |
|---|---|---|
| `register` | `(spec) => boolean` | `true` when registered, `false` on any validation failure |
| `unregister` | `(id) => void` | – |
| `list` | `() => Array<ThemeEntry>` | every registered theme, in registration order |
| `get` | `(id) => ThemeEntry \| null` | – |
| `getConfig` | `(id) => object` | the theme's `config`, or the built-in `one_dark` config |
| `apply` | `(id) => boolean \| undefined` | applies the theme to `window.editorManager.editor` |
| `createTheme` | `({ styles, dark, highlightStyle, extensions }) => Extension[]` | a ready-to-register extension list |
| `createHighlightStyle` | `(spec) => HighlightStyle` | – |
| `cm` | `{ EditorView, HighlightStyle, syntaxHighlighting, tags }` | a small CodeMirror namespace |

## `register(spec)`

Registers a theme.

```js
editorThemes.register({
  id: "example-night",
  caption: "Example Night",
  dark: true,
  extensions: editorThemes.createTheme({
    dark: true,
    styles: {
      "&": {
        backgroundColor: "#0f1115",
        color: "#d6deeb",
      },
    },
  }),
});
```

### `spec` fields

| Field | Aliases | Type | Required | Default | Meaning |
|---|---|---|---|---|---|
| `id` | `name` | `string` | **yes** | – | Theme id. Trimmed and lower-cased by the registry. |
| `caption` | `label` | `string` | no | the `id` you passed | Label shown in the editor-theme picker. |
| `isDark` | `dark` | `boolean` | no | `false` | Whether the theme is dark. |
| `getExtension` | `extensions`, `extension`, `theme` | `Extension \| Extension[] \| () => Extension \| Extension[]` | **yes** | – | The CodeMirror extension(s), or a function returning them. A function is re-invoked each time the editor asks for the extension. Nested arrays are flattened. |
| `config` | – | `object` | no | `null` | Plain colour metadata. Not used for rendering — see [`config`](#what-config-is-for). |

The alias resolution order is fixed: `id` → `name`, `caption` → `label`, `isDark` → `dark` (so `isDark` **wins** when both are present), and `getExtension` → `extensions` → `extension` → `theme`.

### Exact validation messages

`register` returns `false` and logs one of these three `console.warn` messages:

```js
// spec is missing, not an object, or an array
"[editorThemes] register(spec) expects an object: { id, caption?, dark?, getExtension|extensions|extension|theme, config? }"

// neither `id` nor `name` was truthy
"[editorThemes] register(spec) requires a valid `id`."

// none of getExtension / extensions / extension / theme was provided
"[editorThemes] register('<id>') requires extensions via getExtension/extensions/extension/theme."
```

`register` also returns `false` **silently** in two cases the registry handles:

- the id is already registered — `addTheme` refuses duplicates, so re-registering an id is a no-op rather than a replacement;
- the extensions could not be composed — the registry runs `EditorState.create({ doc: "", extensions })` against Acode's own CodeMirror instance. If that throws, or if the getter returns nothing, it logs once per theme id:

```
[editorThemes] Theme '<id>' is invalid: no extensions were returned
[editorThemes] Theme '<id>' is invalid.
```

::: warning
Validation calls your getter **immediately**, at registration time, and it must return extensions **synchronously**. An `async getExtension` yields a `Promise`, which fails `EditorState.create()` and makes `register` return `false`. Do any `await import(...)` in `setPluginInit` first, then register with the resolved array.
:::

::: tip
`register` makes the theme **appear** in the editor-theme picker (which lists every registered theme with its `caption`) — it does not switch to it. Use [`apply`](#apply-id) to switch now, or let the user pick it.
:::

### What `config` is for

`config` is stored verbatim and read back through `getConfig(id)`. Acode uses it for **non-CodeMirror** colour consumers — most importantly `codeHighlight`, which generates the `.tok-*` CSS rules for static code blocks from `getThemeConfig(editorTheme)`. A theme with no `config` gets Acode's built-in `one_dark` palette for those consumers.

The keys it understands:

| Key | Used for |
|---|---|
| `background`, `foreground` | Base block colours |
| `keyword`, `string`, `number`, `comment`, `function`, `variable`, `type`, `class`, `constant`, `operator`, `invalid` | Token colours |

Anything else in `config` is ignored by the highlighter but is a convenient place to park your own metadata (the built-in themes put their `name` and `dark` flags there too).

## `apply(id)`

Applies a registered theme to the active editor.

```js
editorThemes.apply("example-night");
```

**Returns** `true` when the extension was dispatched, `false` only if the dispatch threw — and `undefined` when there is no active editor view.

::: warning
An unknown id does **not** fail: the theme lookup falls back to Acode's built-in `one_dark` extension (with `-` in the id also retried as `_`), so `apply("does-not-exist")` returns `true` and quietly resets the editor to One Dark. Call `editorThemes.get(id)` first if you need to know the theme exists.
:::

::: warning
`apply` only reconfigures the **focused pane's** view. In a multi-pane layout, loop `editorManager.panes` and call `pane.editor.setTheme(id)` for each one you want to change.
:::

## Theme Management Methods

- `unregister(id)`
- `list()`
- `get(id)`
- `getConfig(id)`

```js
const themes = editorThemes.list();
console.log(themes.map((t) => t.id));
```

| Method | Signature | Returns |
|---|---|---|
| `unregister` | `(id)` | `undefined`. Id is lower-cased; unknown ids are ignored. Removing the active theme does not reset the editor — call `apply` with another id. |
| `list` | `()` | `Array<{ id, caption, isDark, getExtension, config }>` |
| `get` | `(id)` | the theme object, or `null` for an unknown id |
| `getConfig` | `(id)` | `theme.config ?? oneDarkConfig` — always an object |

::: warning
`list()` and `get()` return the live theme objects, so `getExtension()` on them is the normalised getter — call it with no arguments and expect an extension array (nested arrays are flattened).
:::

## Helpers

### `createTheme({ styles, dark, highlightStyle, extensions })`

Builds a theme extension array.

| Argument | Type | Default | Meaning |
|---|---|---|---|
| `styles` | `object` | – | Passed to `EditorView.theme(styles, { dark: !!dark })`. Omitted → no theme extension. |
| `dark` | `boolean` | `false` | Passed to `EditorView.theme` as its `dark` option. |
| `highlightStyle` | `HighlightStyle \| Array<{ tag, … }>` | – | An array is run through `HighlightStyle.define`; a value is used as-is. Falsy → skipped. |
| `extensions` | `Extension \| Extension[]` | `[]` | Appended after the theme and highlight extensions. |

**Returns** `Extension[]` — always an array, even for one extension.

### `createHighlightStyle(spec)`

Builds a `HighlightStyle` from tag rules.

```js
const t = editorThemes.cm.tags; // @lezer/highlight tags
editorThemes.createHighlightStyle([
  { tag: t.keyword, color: "#ffb86c" },
  { tag: [t.string, t.special(t.string)], color: "#a5ff90" },
]);
```

- `Array` → `HighlightStyle.define(spec)`
- anything else truthy → returned unchanged (so you can pass a `HighlightStyle` you already built)
- falsy → `null`

### `cm`

CodeMirror helpers exposed by Acode:

| Key | Package |
|---|---|
| `EditorView` | `@codemirror/view` |
| `HighlightStyle` | `@codemirror/language` |
| `syntaxHighlighting` | `@codemirror/language` |
| `tags` | `@lezer/highlight` |

## Full Plugin-Style Example

```js
const editorThemes = acode.require("editorThemes");

function buildChaiTheme() {
  const { cm, createTheme, createHighlightStyle } = editorThemes;
  const t = cm.tags;

  const highlight = createHighlightStyle([
    { tag: t.keyword, color: "#ffb86c" },
    { tag: [t.string, t.special(t.string)], color: "#a5ff90" },
    { tag: [t.number, t.bool], color: "#ffd866" },
    { tag: t.comment, color: "#7f8c98" },
    { tag: [t.function(t.variableName), t.propertyName], color: "#8be9fd" },
    { tag: [t.typeName, t.className], color: "#bd93f9" },
    { tag: t.invalid, color: "#ff6b6b" },
  ]);

  return createTheme({
    dark: true,
    styles: {
      "&": { color: "#e6edf3", backgroundColor: "#101418" },
      ".cm-content": { caretColor: "#f8f8f2" },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#f8f8f2" },
      ".cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "#2a3340",
      },
      ".cm-gutters": {
        backgroundColor: "#101418",
        color: "#637083",
        border: "none",
      },
      ".cm-activeLine": { backgroundColor: "#18202a" },
      ".cm-activeLineGutter": { backgroundColor: "#18202a" },
    },
    highlightStyle: highlight,
  });
}

acode.setPluginInit("com.example.theme", () => {
  const ok = editorThemes.register({
    id: "chai_theme",
    caption: "Chai Theme",
    dark: true,
    getExtension: buildChaiTheme,
    config: {
      name: "chai_theme",
      dark: true,
      background: "#101418",
      foreground: "#e6edf3",
      keyword: "#ffb86c",
      string: "#a5ff90",
      number: "#ffd866",
      comment: "#7f8c98",
      function: "#8be9fd",
      variable: "#e6edf3",
      type: "#bd93f9",
      class: "#bd93f9",
      constant: "#ffd866",
      operator: "#ffb86c",
      invalid: "#ff6b6b",
    },
  });

  // register() returns false on a bad spec or a duplicate id — find out.
  if (!ok) acode.toast("Chai Theme failed to register");
});

acode.setPluginUnmount("com.example.theme", () => {
  editorThemes.unregister("chai_theme");
});
```

`config` is what lets `codeHighlight` colour static code blocks (markdown previews, plugin pages, LSP reference snippets) in your theme's colours instead of One Dark's — see [Code Highlight](./code-highlight.md).

### Sample (Class + `plugin.json` style)

```js
import plugin from "../plugin.json";

class ChaiThemePlugin {
  constructor() {
    this.themeId = "chai_theme";
    this.editorThemes = acode.require("editorThemes");
  }

  buildExtensions() {
    const { cm, createTheme, createHighlightStyle } = this.editorThemes;
    const t = cm.tags;

    const highlight = createHighlightStyle([
      { tag: t.keyword, color: "#ffb86c" },
      { tag: [t.string, t.special(t.string)], color: "#a5ff90" },
      { tag: t.comment, color: "#7f8c98" },
    ]);

    return createTheme({
      dark: true,
      styles: {
        "&": { color: "#e6edf3", backgroundColor: "#101418" },
        ".cm-gutters": { backgroundColor: "#101418", border: "none" },
      },
      highlightStyle: highlight,
    });
  }

  init() {
    this.registered = this.editorThemes.register({
      id: this.themeId,
      caption: "Chai Theme",
      dark: true,
      getExtension: () => this.buildExtensions(),
    });
  }

  destroy() {
    this.editorThemes.unregister(this.themeId);
  }
}

const acodePlugin = new ChaiThemePlugin();

acode.setPluginInit(plugin.id, () => {
  acodePlugin.init();
});

acode.setPluginUnmount(plugin.id, () => {
  acodePlugin.destroy();
});
```

## Gotchas

::: warning
**Ids are lower-cased and unique.** `register({ id: "My_Theme" })` stores `my_theme`, and `get("My_Theme")` resolves because lookups are lower-cased too — but `getConfig("My_Theme")` on an id that was never registered silently returns the `one_dark` palette rather than `null`.
:::

::: warning
**Unregister is not "switch away".** If the theme currently applied to the editor is unregistered, the live `EditorView` keeps its styles until something reconfigures the theme compartment. `unregister` on unmount is correct; just do not expect the editor to fall back on its own.
:::

::: warning
**`getExtension` is re-invoked, `extensions` is not.** Only the *function* form is treated as a getter; a pre-built extension array is normalised once and reused. Rebuilding a theme per switch (as in the examples above) keeps each application independent, but it also means the `EditorView.theme` class names are regenerated — do not depend on them.
:::

::: warning
**A theme cannot register twice.** The second `register` with the same id returns `false` with no warning. Disable and re-enable the plugin in one session and the second `setPluginInit` will silently do nothing unless the matching `unregister` ran first.
:::

## Related

- [Acode Theme Management](../helpers/themes.md) — app/UI themes, a **different** registry
- [Code Highlight](./code-highlight.md) — how `config` drives `.tok-*` colours outside the editor
- [CodeMirror packages](./codemirror.md) — the shared `@codemirror/*` instances behind `cm`
- [EditorManager](../global-apis/editor-manager.md) — `editorManager.editor.setTheme(id)`
