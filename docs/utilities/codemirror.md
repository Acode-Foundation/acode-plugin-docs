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

### Namespace shape

| Key | Package |
|---|---|
| `cm.autocomplete` | `@codemirror/autocomplete` |
| `cm.commands` | `@codemirror/commands` |
| `cm.language` | `@codemirror/language` |
| `cm.lint` | `@codemirror/lint` |
| `cm.search` | `@codemirror/search` |
| `cm.state` | `@codemirror/state` |
| `cm.view` | `@codemirror/view` |
| `cm.lezer` | `@lezer/highlight` plus nested `common`, `highlight`, `lr` |

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

::: tip
Prefer these requires over bundling your own copy of CodeMirror. Duplicate packages often break extension composition (`EditorState` / facet identity mismatches).
:::

## Related APIs

- Active editor: `editorManager.editor` — see [EditorManager](../global-apis/editor-manager.md)
- Language registration: `acode.require("editorLanguages")` — see [Editor Languages](./ace-modes.md)
- Theme registration: `acode.require("editorThemes")` — see [Editor Themes](./editor-themes.md)
- Language servers: `acode.require("lsp")` — see [LSP](../advanced-apis/lsp.md)
- Static highlighter for snippets and plugin tabs: `acode.require("codeHighlight")` — see [Code Highlight](./code-highlight.md)

## Minimal extension example

```js
const cm = acode.require("codemirror");
const { EditorView } = cm.view;
const { StateField } = cm.state;

const demoField = StateField.define({
  create() {
    return 0;
  },
  update(value) {
    return value;
  },
});

// Plugins typically register language/theme extensions via
// editorLanguages / editorThemes rather than patching the view directly.
void demoField;
void EditorView;
```
