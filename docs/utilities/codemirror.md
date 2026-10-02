# CodeMirror packages

Acode re-exports the CodeMirror 6 and Lezer packages used by the app so plugins can share the **same module instances** as the editor (important for extensions, facets, and state fields).

## Recommended import

```js
const cm = acode.require("codemirror");

const { EditorView } = cm.view;
const { EditorState, StateField, StateEffect } = cm.state;
const { syntaxTree } = cm.language;
const { tags } = cm.lezer;
```

::: info
`acode.require(name)` lower-cases the name before the lookup, so `acode.require("CodeMirror")` and `acode.require("@Lezer/Common")` return the same objects as the lower-case spellings. An unknown name returns `undefined` — it does not throw.
:::

### Namespace shape

`acode.require("codemirror")` is built once in `src/lib/acode.js` and is a **frozen** object. These are all of its keys:

```js
Object.freeze({
  autocomplete, // * as cmAutocomplete  from "@codemirror/autocomplete"
  commands,     // * as cmCommands     from "@codemirror/commands"
  language,     // * as cmLanguage     from "@codemirror/language"
  lezer: Object.freeze({
    ...lezerHighlight, // spread of "@lezer/highlight" -> tags, classHighlighter, ...
    common, // * as "@lezer/common"
    highlight, // * as "@lezer/highlight"
    lr, // * as "@lezer/lr"
  }),
  lint, // * as cmLint    from "@codemirror/lint"
  search, // * as cmSearch  from "@codemirror/search"
  state, // * as cmState   from "@codemirror/state"
  view, // * as cmView    from "@codemirror/view"
  highlight, // the same object as acode.require("codeHighlight")
});
```

| Key | Package | Notes |
|---|---|---|
| `cm.autocomplete` | `@codemirror/autocomplete` | `autocompletion`, `closeBrackets`, `completionStatus`, `indentOnInput`, … |
| `cm.commands` | `@codemirror/commands` | `undo`, `redo`, `selectLine`, `indentWithTab`, … |
| `cm.language` | `@codemirror/language` | `LanguageSupport`, `StreamLanguage`, `LRLanguage`, `HighlightStyle`, `syntaxHighlighting`, `syntaxTree`, `foldCode`, `indentUnit`, … |
| `cm.lezer` | `@lezer/highlight` spread, plus `common` / `highlight` / `lr` | See below |
| `cm.lint` | `@codemirror/lint` | `linter`, `lintGutter`, `openLintPanel`, `nextDiagnostic`, … |
| `cm.search` | `@codemirror/search` | `search`, `searchKeymap`, `highlightSelectionMatches`, … |
| `cm.state` | `@codemirror/state` | `EditorState`, `EditorSelection`, `Compartment`, `StateField`, `StateEffect`, `Transaction`, `Text`, `RangeSet` |
| `cm.view` | `@codemirror/view` | `EditorView`, `keymap`, `ViewPlugin`, `Decoration`, `ViewUpdate`, `lineNumbers`, `highlightActiveLine`, … |
| `cm.highlight` | — | Identical object to `acode.require("codeHighlight")` |

`cm.lezer` is flattened, so the top level *is* the `@lezer/highlight` namespace (`tags`, `classHighlighter`, `styleTags`, `highlightTree`, …), with three extra keys:

| Key | Package |
|---|---|
| `cm.lezer.common` | `@lezer/common` — `Tree`, `NodeType`, `LRParser`, `NodeSet`, … |
| `cm.lezer.highlight` | `@lezer/highlight` — same namespace as the flattened one |
| `cm.lezer.lr` | `@lezer/lr` — `LRParser`, `buildParser`, `buildLezerGrammar` |

## Direct package requires

You can also require packages by their npm names (same instances as above):

```js
const view = acode.require("@codemirror/view");
const state = acode.require("@codemirror/state");
const language = acode.require("@codemirror/language");
const autocomplete = acode.require("@codemirror/autocomplete");
const commands = acode.require("@codemirror/commands");
const lint = acode.require("@codemirror/lint");
const search = acode.require("@codemirror/search");

const lezerCommon = acode.require("@lezer/common");
const lezerHighlight = acode.require("@lezer/highlight");
const lezerLr = acode.require("@lezer/lr");
```

These ten names are the **complete** list of CodeMirror/Lezer packages passed to `acode.define()`. Versions resolved by the app (`package.json`):

| Require name | Version in the app |
|---|---|
| `@codemirror/autocomplete` | `^6.20.3` |
| `@codemirror/commands` | `^6.11.0` |
| `@codemirror/language` | `^6.12.4` |
| `@codemirror/lint` | `^6.9.7` |
| `@codemirror/search` | `^6.7.1` |
| `@codemirror/state` | `^6.7.1` |
| `@codemirror/view` | `^6.43.9` |
| `@lezer/common` | `^1.5.2` |
| `@lezer/highlight` | `^1.2.3` |
| `@lezer/lr` | `^1.4.10` |

`acode.require("@codemirror/view") === cm.view` and `acode.require("@lezer/highlight") === cm.lezer.highlight` — the aliases are the same objects, not copies.

::: warning
Packages the app itself uses but does **not** expose: `@codemirror/theme-one-dark`, `@codemirror/lsp-client`, `@codemirror/lang-javascript`, `@codemirror/lang-html`, `@codemirror/language-data`, `@emmetio/codemirror6-plugin`. `acode.require()` returns `undefined` for all of them — bundle your own copy, or use the higher-level APIs ([Editor Languages](./ace-modes.md), [Editor Themes](./editor-themes.md), [`acode.require("lsp")`](../advanced-apis/lsp.md)).
:::

::: tip
Prefer these requires over bundling your own copy of CodeMirror. Duplicate packages often break extension composition (`EditorState` / facet identity mismatches).
:::

## Why sharing the app's instances matters <Badge type="tip" text="new" />

`src/lib/acode.js` imports these packages with `import * as cmView from "@codemirror/view"` and hands the very same namespace objects to `acode.define()`. The editor itself is built from those imports too (`src/lib/editorManager.js`, `src/cm/**`). So a plugin and the app agree on **object identity** for everything that CodeMirror 6 compares by reference:

```js
const { EditorState, Compartment, StateField } = acode.require("@codemirror/state");
const { EditorView } = acode.require("@codemirror/view");

const view = window.editorManager?.editor;

// The live view is an instance of *your* EditorView class…
console.log(view instanceof EditorView); // true

// …and your StateField is the very same class the editor already knows about,
// so `view.state.field(myField)` works instead of throwing "field not present".
const myField = StateField.define({ create: () => 0, update: (v) => v });

const probe = EditorState.create({ doc: "", extensions: [myField] });
console.log(probe.field(myField) === 0); // true
```

If you bundled a second copy of `@codemirror/state`, the duplicated `StateField` would be a foreign key and the editor would reject it; likewise a duplicated `@codemirror/view` would give you a `keymap` facet that the live `EditorView` never consults.

::: warning
`cm`, `cm.lezer` and the `codeHighlight` module are all `Object.freeze`d, and the `cm.*` package namespaces are ES-module namespace objects, which are frozen by spec. Assigning `cm.view = …` (or adding a key to `cm`) throws in strict mode and is silently dropped otherwise. Read-only — do not try to monkey-patch the exports.
:::

## Reaching The Live Editor <Badge type="tip" text="new" />

| What | How to get it |
|---|---|
| Active `EditorView` | `window.editorManager?.editor` |
| Live `EditorState` | `view.state` (never re-read it once — it is replaced on every transaction) |
| Active file | `window.editorManager?.activeFile` (an `EditorFile`) |
| Multi-pane views | `window.editorManager?.panes` — each pane has its own `editor` |

```js
const view = window.editorManager?.editor;
if (!view) return; // boot has not created the first EditorView yet

const text = view.state.doc.toString();
```

`window.editorManager` is `null` until the first `EditorView` is constructed, so read it **lazily** — inside a command, an event callback, or after an `await` — never at module top level. Full reference: [EditorManager](../global-apis/editor-manager.md).

The state object itself is immutable; to change anything you dispatch a transaction:

```js
view.dispatch({
  changes: { from: 0, to: view.state.doc.length, insert: "hello" },
});
```

## Related APIs

- Active editor: `editorManager.editor` — see [EditorManager](../global-apis/editor-manager.md)
- Language registration: `acode.require("editorLanguages")` — see [Editor Languages](./ace-modes.md)
- Theme registration: `acode.require("editorThemes")` — see [Editor Themes](./editor-themes.md)
- Language servers: `acode.require("lsp")` — see [LSP](../advanced-apis/lsp.md)
- Static highlighter for snippets and plugin tabs: `acode.require("codeHighlight")` — see [Code Highlight](./code-highlight.md)
- File and folder icon packs: `acode.require("fileIcons")` — see [File Icons](./file-icons.md)
- Keybindings: register a command instead of shipping a raw `keymap` — see [Commands API](./commands.md)

## Minimal extension example

A plugin-owned `Compartment` is what makes an extension removable again on unmount — reconfigure it to install the extension, and again with `[]` to take it away:

```js
const cm = acode.require("codemirror");
const { EditorView } = cm.view;
const { Compartment, StateField } = cm.state;

// 1. A real piece of state, defined with the app's own StateField class.
const activeLength = StateField.define({
  create: () => 0,
  update(value, transaction) {
    return transaction.docChanged ? transaction.newDoc.length : value;
  },
});

// 2. A plugin-owned compartment. Reconfiguring it swaps the whole extension
//    in or out without rebuilding the document.
const compartment = new Compartment();
const extension = [activeLength, EditorView.theme({ "&": { tabSize: "4" } })];

acode.setPluginInit("com.example.editor-ext", () => {
  const view = window.editorManager?.editor;
  if (!view) return;

  view.dispatch({ effects: compartment.reconfigure(extension) });

  // 3. Read the field back off the live state.
  console.log("document length:", view.state.field(activeLength));
});

acode.setPluginUnmount("com.example.editor-ext", () => {
  window.editorManager?.editor?.dispatch({
    effects: compartment.reconfigure([]),
  });
});
```

::: tip
The same `compartment` can be reconfigured at any time with a different extension list — that is how the app itself swaps themes, indent units, wrapping and read-only state.
:::

## Language Example (StreamLanguage) <Badge type="tip" text="new" />

`StreamLanguage` lets you ship a language with **no** parser bundle — the tokenizer is plain JavaScript running against CodeMirror's own `StringStream`. Acode's built-in Luau mode is defined exactly this way (`src/cm/modes/luau/index.ts`).

```js
const editorLanguages = acode.require("editorLanguages");
const {
  LanguageSupport,
  StreamLanguage,
  HighlightStyle,
  syntaxHighlighting,
} = acode.require("@codemirror/language");
const { tags } = acode.require("@lezer/highlight");

const MODE_NAME = "example_notes";

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

const notesHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#c678dd" },
  { tag: tags.string, color: "#98c379" },
  { tag: tags.comment, color: "#5c6370", fontStyle: "italic" },
]);

acode.setPluginInit("com.example.notes-lang", () => {
  // name, extensions (no dots), caption, loader
  editorLanguages.register(MODE_NAME, ["notes", "note"], "Notes", () =>
    new LanguageSupport(notesStream, [syntaxHighlighting(notesHighlight)]),
  );
});

acode.setPluginUnmount("com.example.notes-lang", () => {
  editorLanguages.unregister(MODE_NAME);
});

// Apply it to the open tab.
window.editorManager?.activeFile?.setMode(MODE_NAME);
```

The loader may be sync or async — Acode reconfigures the editor's language compartment as soon as the returned promise settles. For a Lezer grammar instead of a tokenizer, use `LRLanguage.define({ parser })` with a parser you bundle; see [Editor Languages](./ace-modes.md) and [CodeMirror and Legacy Ace Compatibility](../global-apis/ace.md).

## Gotchas

::: warning
`window.editorManager.editor` is only the **focused pane's** view. In a multi-pane layout the other panes keep their own `EditorView` instances, so a `Compartment` you reconfigure on `editorManager.editor` leaves the other panes untouched. Either iterate `editorManager.panes` and dispatch on each `pane.editor`, or register a [command](./commands.md) and let the app route it to the right pane.
:::

::: warning
A new `EditorView` is created per pane, not per file — a `StateField` you add stays installed across tab switches within that pane, and it is **not** applied to views created later (a new pane, or a view created before your `setPluginInit` ran). Re-dispatch `compartment.reconfigure(extension)` when a view becomes available.
:::

::: warning
Do not ship a raw `keymap.of([...])` extension to grab keys. The command registry owns a dedicated `commandKeymapCompartment` and rebuilds it whenever a command is added or removed; register a command with a `bindKey` instead so users can rebind it in settings. See [Commands API](./commands.md).
:::
