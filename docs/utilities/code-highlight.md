# Code Highlight <Badge type="tip" text="v1008+" />

Acode exposes the same **static CodeMirror / Lezer highlighter** it uses for markdown previews, plugin pages, and LSP reference snippets. Plugins can highlight code without bundling a second highlighter, and the colors follow the user's editor theme.

::: info
Available from **versionCode `1008`** (the next Acode release). Set `"minVersionCode": 1008` in `plugin.json` when your plugin depends on it.
:::

## Import

```js
const codeHighlight = acode.require("codeHighlight");
```

The same object is also available as `acode.require("codemirror").highlight`.

## Highlight HTML

Both methods return **escaped HTML** with Lezer `tok-*` class names (`tok-keyword`, `tok-string`, …). Put the result inside an element with the `cm-highlighted` class (or `codeHighlight.HIGHLIGHT_CLASS`).

### `highlightCodeBlock(code, language?)`

Highlight a multi-line snippet. `language` is a mode name or markdown fence id (`"javascript"`, `"python"`, `"js"`, `"ts"`, …). Unknown languages fall back to escaped plain text.

```js
const codeHighlight = acode.require("codeHighlight");

const html = await codeHighlight.highlightCodeBlock(
  'const answer = 42;\nconsole.log(answer);',
  "javascript",
);

const pre = document.createElement("pre");
const code = document.createElement("code");
code.className = codeHighlight.HIGHLIGHT_CLASS;
code.innerHTML = html;
pre.appendChild(code);
```

`highlight(code, language?)` is an alias of `highlightCodeBlock`.

### `highlightLine(text, uri, symbolName?)`

Highlight a single line. Language is inferred from `uri`. When `symbolName` is set, matching text is wrapped in `<span class="symbol-match">`.

```js
const html = await codeHighlight.highlightLine(
  "export function greet() {}",
  "file:///sdcard/project/src/hello.js",
  "greet",
);
```

## Shadow DOM and custom editor tabs

Token colors live in a stylesheet, not in the returned HTML. Styles injected on `document` **do not pierce Shadow DOM**.

Custom editor tabs do **not** get this stylesheet by default. Opt in when the tab will render highlighted HTML:

```js
new EditorFile("snippet.js", {
  type: "custom",
  content: pre,
  highlightStyles: true,
});
```

For any other shadow root (a dialog, a custom element, a tab that did not set `highlightStyles`), adopt the shared sheet yourself:

```js
const host = document.createElement("div");
const shadow = host.attachShadow({ mode: "open" });

codeHighlight.applyStyles(shadow);
// or: codeHighlight.applyStyles(host); // resolves to host.shadowRoot
// or: codeHighlight.applyStyles(file.content); // custom tab host
```

`applyStyles` prefers `adoptedStyleSheets`. Theme changes then update every adopted root in place — you do not need to call it again.

```js
const css = codeHighlight.getStyles();
const sheet = codeHighlight.getStyleSheet();
```

Use `getStyles()` only if you need the raw CSS string. Prefer `applyStyles` so theme updates stay in sync.

## Cache

Results are cached per theme + language + source. Call `codeHighlight.clearCache()` after you register or unregister a language if stale HTML would be a problem.

## Custom tab example

```js
const EditorFile = acode.require("EditorFile");
const codeHighlight = acode.require("codeHighlight");

async function openSnippetTab(source, language) {
  const html = await codeHighlight.highlightCodeBlock(source, language);
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.className = codeHighlight.HIGHLIGHT_CLASS;
  code.innerHTML = html;
  pre.appendChild(code);

  new EditorFile(`${language} snippet`, {
    type: "custom",
    tabIcon: "file file_type_js",
    content: pre,
    highlightStyles: true,
    hideQuickTools: true,
  });
}
```

`highlightStyles: true` adopts the highlight stylesheet into the tab's shadow root, so the snippet uses the current editor theme.

## Related APIs

- Shared CodeMirror packages: [CodeMirror packages](./codemirror.md)
- Language registration: [Editor Languages](./ace-modes.md)
- Editor theme registration: [Editor Themes](./editor-themes.md)
- Custom tabs: [Editor File](../editor-components/editor-file.md)
