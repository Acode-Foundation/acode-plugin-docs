# CodeMirror and Legacy Ace Compatibility

Acode now uses **CodeMirror 6** as the editor engine.

This page exists for plugin migration from Ace-era APIs.

## What To Use Now

- Use `window.editorManager.editor` as the active editor view (`EditorView`).
- Use `acode.require("commands")` for command registration/removal.
- Use `acode.require("editorLanguages")` to register or remove language modes.
- Use `acode.require("editorThemes")` to register or apply editor themes.
- Use `acode.require("codemirror")` (or `@codemirror/*` / `@lezer/*`) for the same CodeMirror packages the app uses — see [CodeMirror packages](../utilities/codemirror.md).
- Use `acode.require("codeHighlight")` to highlight static code blocks — see [Code Highlight](../utilities/code-highlight.md).
- Use `editorManager.isCodeMirror` as a cheap capability probe. It is a hard-coded `true` in this build, so it can never be `null`/`undefined` here — there is no Ace fallback to detect.

## Ground Truth For This Version

| Fact | Value |
|---|---|
| App version | `1.13.5` |
| `android-versionCode` | `1011` |
| Editor engine | CodeMirror 6 only |
| Ace engine bundled? | No — no `ace.edit`, no Ace editor instance, no Ace mode files |

::: warning
`aceModes` is a misleading name and nothing more. It is a thin wrapper over the CodeMirror mode registry — it does not load Ace and has no Ace mode objects behind it. Modes registered through it behave exactly like modes registered through `editorLanguages`.
:::

## Legacy Compatibility

Acode still provides some Ace-like compatibility for older plugins:

- `editorManager.editor.session` exposes a `Proxy` over the file's CodeMirror `EditorState` with Ace-style helpers (`getValue`, `setValue`, `getLine`, `getLength`, `getTextRange`, `insert`, `remove`, `replace`, `getWordRange`).
- `acode.require("aceModes")` still maps to mode registration helpers.
- A `window.ace` object is installed at startup. It is **not** the Ace library — it only adds one shimmed module:

```js
const modelist = window.ace.require("ace/ext/modelist"); // also "ace/ext/modelist.js"
```

That compat module exposes `modes`, `modesByName` and `getModeForPath(path)`, where every mode object additionally carries `mode: "ace/mode/<name>"`. `ace.require()` for any other module id returns `undefined` unless a plugin installed its own `ace.require` beforehand, and `ace.edit()`, `ace.define()` and the Ace editor object do not exist.

These compatibility layers are for transition only. Prefer CodeMirror-first APIs for new plugins.

## `acode.require("aceModes")`

```js
const aceModes = acode.require("aceModes");
```

| Method | Signature | Returns |
|---|---|---|
| `addMode` | `(name, extensions, caption?, loader?)` | `void` |
| `removeMode` | `(name)` | `void` |
| `getModeForPath` | `(path)` | `Mode` |
| `getModes` | `()` | `Mode[]` (a copy) |
| `getModesByName` | `()` | `Record<string, Mode>` (a copy) |
| `getMode` | `(name)` | `Mode \| null` |

`aceModes.addMode` and `aceModes.removeMode` are the *same function references* as `editorLanguages.add`/`register` and `editorLanguages.remove`/`unregister` — the two modules are interchangeable.

## `acode.require("editorLanguages")`

```js
const editorLanguages = acode.require("editorLanguages");
```

| Method | Aliases | Signature | Returns |
|---|---|---|---|
| `register` | `add` | `(name, extensions, caption?, loader?)` | `void` |
| `unregister` | `remove` | `(name)` | `void` |
| `list` | – | `()` | `Mode[]` (a copy) |
| `listByName` | – | `()` | `Record<string, Mode>` (a copy) |
| `get` | – | `(name)` | `Mode \| null` |
| `getForPath` | – | `(path)` | `Mode` |

### `addMode(name, extensions, caption, loader)` argument semantics

| Argument | Type | Meaning |
|---|---|---|
| `name` | `string` | Mode id. Trimmed and lowercased. This is what `file.currentMode` becomes and what `getMode` / `listByName` keys on. |
| `extensions` | `string \| string[]` | An array is joined with `\|`. Each `\|`-separated part is either a bare file extension (`js`, `mjs`, `zsh`) or an anchored exact filename prefixed with `^` (`^Dockerfile`, `^.babelrc`). |
| `caption` | `string` (optional) | UI label. Defaults to `name` with `_` replaced by spaces. |
| `loader` | `() => Extension \| Promise<Extension>` (optional) | Returns the CodeMirror language extension. May be sync or async — Acode reconfigures the language compartment as soon as the promise settles. |

Resolution order when mapping a filename to a mode (`getForPath`): anchored / regex filename matches first, then extension matches ranked by specificity (a `^` pattern scores above every extension, longer extensions beat shorter ones), then a linear `supportsFile()` scan, then the `text` mode.

### The `Mode` object

| Member | Type | Description |
|---|---|---|
| `name` | `string` | Normalized mode id |
| `mode` | `string` | Alias of `name` (kept for Ace-era readers) |
| `caption` | `string` | UI label |
| `extensions` | `string` | The `\|`-joined pattern string |
| `aliases` | `string[]` | Registered aliases |
| `extRe` | `RegExp \| null` | Compiled filename matcher |
| `filenameMatchers` | `RegExp[]` | Extra filename regexes |
| `languageExtension` | `Function \| null` | The raw loader |
| `supportsFile(filename)` | `() => boolean` | Does this mode claim the filename? |
| `getExtension()` | `() => Function \| null` | Returns `languageExtension` |
| `isAvailable()` | `() => boolean` | `languageExtension !== null` |

Apply a registered mode to a file:

```js
window.editorManager.activeFile?.setMode("myMode");
```

## `acode.require("editorThemes")`

```js
const editorThemes = acode.require("editorThemes");
```

### `register(spec) -> boolean`

Returns `false` (and logs a warning) when the spec is malformed, the id is empty, the id is already registered, or the produced extensions cannot be composed into an `EditorState`.

| Field | Aliases | Type | Required | Description |
|---|---|---|---|---|
| `id` | `name` | `string` | yes | Theme id. Trimmed and lowercased. |
| `caption` | `label` | `string` | no | UI label. Defaults to the id. |
| `isDark` | `dark` | `boolean` | no | Whether the theme is dark. Defaults to `false`. `isDark` wins when both are present. |
| `getExtension` | `extensions`, `extension`, `theme` | `Extension \| Extension[] \| () => Extension \| Extension[]` | yes | The CodeMirror extension(s), or a function returning them. |
| `config` | – | `object` | no | Theme metadata (colors), used by `getConfig`. |

### Theme management

| Method | Signature | Returns |
|---|---|---|
| `unregister` | `(id)` | `void` |
| `list` | `()` | `Array<{ id, caption, isDark, getExtension, config }>` |
| `get` | `(id)` | theme object or `null` |
| `getConfig` | `(id)` | The theme's `config`, or the built-in `one_dark` config |
| `apply` | `(id)` | `boolean` — applies the theme to the active editor view |
| `createTheme` | `({ styles, dark = false, highlightStyle, extensions = [] })` | `Extension[]` |
| `createHighlightStyle` | `(spec)` | `HighlightStyle` from an array of tag rules, or the value itself |

### `cm`

The theme module ships a small CodeMirror namespace of its own:

```js
const { cm } = acode.require("editorThemes");

cm.EditorView;          // @codemirror/view
cm.HighlightStyle;      // @codemirror/language
cm.syntaxHighlighting;  // @codemirror/language
cm.tags;                // @lezer/highlight
```

::: tip
See [Editor Themes API](../utilities/editor-themes.md) for a full theme-plugin walkthrough.
:::

## Complete Example

Register a language (StreamLanguage and/or Lezer) plus a theme.

```js
// acode.setPluginInit / setPluginUnmount style registration
const editorLanguages = acode.require("editorLanguages");
const editorThemes = acode.require("editorThemes");
const { StreamLanguage, HighlightStyle, LanguageSupport, syntaxHighlighting } =
  acode.require("@codemirror/language");
const { tags } = acode.require("@lezer/highlight");

const MODE_NAME = "example_notes";

const notesHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#c678dd" },
  { tag: tags.string, color: "#98c379" },
  { tag: tags.comment, color: "#5c6370" },
]);

// A StreamLanguage needs no external parser bundle.
const notesStream = StreamLanguage.define({
  name: MODE_NAME,
  token(stream) {
    if (stream.match(/^@[\w-]+/)) return "keyword";
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return "string";
    if (stream.match(/^#.*/)) return "comment";
    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: "#" },
  },
});

acode.setPluginInit("com.example.lang", () => {
  // name, extensions (no dots), caption, loader
  editorLanguages.register(MODE_NAME, ["notes", "note"], "Notes", () =>
    new LanguageSupport(notesStream, [syntaxHighlighting(notesHighlight)]),
  );

  editorThemes.register({
    id: "example_notes_dark",
    caption: "Example Notes Dark",
    dark: true,
    getExtension: () =>
      editorThemes.createTheme({
        dark: true,
        styles: {
          "&": { backgroundColor: "#101418", color: "#e6edf3" },
          ".cm-gutters": { backgroundColor: "#101418", color: "#637083" },
          ".cm-activeLine": { backgroundColor: "#18202a" },
        },
        highlightStyle: notesHighlight,
      }),
    config: {
      name: "example_notes_dark",
      dark: true,
      background: "#101418",
      foreground: "#e6edf3",
    },
  });
});

acode.setPluginUnmount("com.example.lang", () => {
  editorLanguages.unregister(MODE_NAME);
  editorThemes.unregister("example_notes_dark");
});

// Switch an open tab to the new mode and preview the theme.
window.editorManager.activeFile?.setMode(MODE_NAME);
editorThemes.apply("example_notes_dark");
```

::: code-group

```js [Lezer parser]
// Build a language around a generated Lezer parser. The parser itself must be
// bundled with your plugin; everything else comes from the app's own instances.
const { LRLanguage, LanguageSupport } = acode.require("@codemirror/language");
const { styleTags, tags } = acode.require("@lezer/highlight");
import { parser } from "./mygrammar/parser";

const lang = LRLanguage.define({
  name: "mylang",
  parser: parser.configure({
    props: [styleTags({ Keyword: tags.keyword, String: tags.string })],
  }),
  languageData: { commentTokens: { line: "//" } },
});

editorLanguages.register("mylang", ["ml"], "MyLang", () =>
  new LanguageSupport(lang),
);
```

```js [Custom tab]
// Highlight styles also reach static code blocks rendered inside custom tabs.
const EditorFile = acode.require("EditorFile");
const codeHighlight = acode.require("codeHighlight");

const source = '@tag "first line"';
const html = await codeHighlight.highlightCodeBlock(source, "example_notes");

const code = document.createElement("code");
code.className = codeHighlight.HIGHLIGHT_CLASS; // "cm-highlighted"
code.innerHTML = html;

new EditorFile("notes.examples", {
  type: "custom",
  content: code,
  highlightStyles: true,
  hideQuickTools: true,
});
```

:::

## Migration Quick Map

| Old pattern | New pattern |
|---|---|
| `acode.require("aceModes")` | `acode.require("editorLanguages")` |
| `aceModes.addMode(name, exts, caption, loader)` | `editorLanguages.register(name, exts, caption, loader)` |
| `aceModes.removeMode(name)` | `editorLanguages.unregister(name)` |
| `aceModes.getMode(name)` / `getModes()` / `getModesByName()` | `editorLanguages.get(name)` / `list()` / `listByName()` |
| `aceModes.getModeForPath(path)` | `editorLanguages.getForPath(path)` |
| `mode.$id` / Ace mode objects | `mode.name`, `mode.caption`, `mode.getExtension()` |
| `session.setMode(...)` (Ace session API) | `editorManager.activeFile?.setMode(...)` |
| `session.setValue(text)` | `editorManager.editor.dispatch({ changes: { from: 0, to: len, insert: text } })` or `view.setState(...)` |
| Ace global API usage (`ace.edit`, `ace.define`, Ace `Editor` object) | `window.editorManager.editor` + `editorLanguages` + `editorThemes` |
| `ace.require("ace/ext/modelist")` | `acode.require("editorLanguages")` (`list()`, `listByName()`, `getForPath()`) |

## What Was Removed

These Ace-era APIs have no CodeMirror replacement in the source and should not be used:

| Removed | Use instead |
|---|---|
| `ace.edit(...)` and the Ace `Editor` object | `window.editorManager.editor` (a CodeMirror `EditorView`) |
| `ace.define(...)` | `acode.require("editorLanguages").register(...)` |
| `ace.require(...)` for any module other than `ace/ext/modelist` | `acode.require("codemirror")` / the `@codemirror/*` requires |
| `editor.setTheme(...)` with raw CSS strings | `editorThemes.register({ id, getExtension })` |
| `editor.session.setAnnotations(...)` | LSP diagnostics, surfaced via the Problems page |
| `editor.renderer.*`, `editor.$blockScroller`, `editor.container` | `editorManager.container`, `editor.dom`, `editor.scrollDOM` |