# Code Highlight

::: warning
The static CodeMirror / Lezer highlighter described by earlier revisions of this page is currently **internal to Acode** (`src/utils/codeHighlight.js`). It is **not** exposed to plugins: neither `acode.require("codeHighlight")` nor `acode.require("codemirror").highlight` exists in the current plugin API, and the `EditorFile` `highlightStyles` option is **not implemented**.

Calling these throws `undefined is not a function` / `TypeError`. Do not use them until a future Acode release exposes the module.
:::

## What is available instead

Acode uses CodeMirror 6. Plugins can highlight or render code using the shared CodeMirror packages exposed via `acode.require("codemirror")`:

```js
const cm = acode.require("codemirror");
// cm.language.HighlightStyle, cm.state, cm.view, cm.lezer, ...
```

- Language registration: [Editor Languages](./ace-modes.md)
- Editor theme registration: [Editor Themes](./editor-themes.md)
- Shared CodeMirror packages: [CodeMirror packages](./codemirror.md)

For rendering syntax-highlighted HTML inside your own UI, bundle your own highlighter (e.g. `shiki`, `highlight.js`, or `@lezer/highlight` via the `@lezer/*` modules exposed under `acode.require("codemirror").lezer`).

## Related APIs

- Shared CodeMirror packages: [CodeMirror packages](./codemirror.md)
- Language registration: [Editor Languages](./ace-modes.md)
- Editor theme registration: [Editor Themes](./editor-themes.md)
- Custom tabs: [Editor File](../editor-components/editor-file.md)
