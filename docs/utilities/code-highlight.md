# Code Highlight <Badge type="tip" text="v1.13.2+" />

Acode exposes the same **static CodeMirror / Lezer highlighter** it uses for markdown previews, plugin pages, and LSP reference snippets. Plugins can highlight code without bundling a second highlighter, and the colors follow the user's editor theme.

::: info
Present in the Acode **v1.13.2** source tree and recorded in `CHANGELOG.md` as *"feat(plugins): expose static CodeMirror highlighter"* (PR 2769). `CHANGELOG.md` does not tie a `versionCode` to that release, so do not hardcode one — feature-detect with `acode.require("codeHighlight")?.highlightCodeBlock`.
:::

## Import

```js
const codeHighlight = acode.require("codeHighlight");
```

The same object is also available as `acode.require("codemirror").highlight`. Both are **frozen** — you cannot add or replace members.

## Module Shape

```js
Object.freeze({
  highlightLine,      // (text, uri, symbolName = null) => Promise<string>
  highlightCodeBlock, // (code, language)               => Promise<string>
  highlight: highlightCodeBlock, // alias of highlightCodeBlock
  clearCache,         // () => void
  applyStyles,        // (root = document) => CSSStyleSheet | HTMLStyleElement | null
  getStyles,          // () => string
  getStyleSheet,      // () => CSSStyleSheet | null
  HIGHLIGHT_CLASS,    // "cm-highlighted"
});
```

| Member | Signature | Returns |
|---|---|---|
| `highlightCodeBlock` | `(code, language) => Promise<string>` | escaped HTML with `tok-*` spans |
| `highlight` | `(code, language) => Promise<string>` | exact alias of `highlightCodeBlock` |
| `highlightLine` | `(text, uri, symbolName = null) => Promise<string>` | escaped HTML for one line |
| `clearCache` | `() => void` | – |
| `applyStyles` | `(root = document) => CSSStyleSheet \| HTMLStyleElement \| null` | the adopted sheet, the `<style>` element, or the injected fallback `<style>` |
| `getStyles` | `() => string` | the raw CSS text |
| `getStyleSheet` | `() => CSSStyleSheet \| null` | the shared `CSSStyleSheet`, or `null` where constructed stylesheets are unsupported |
| `HIGHLIGHT_CLASS` | `string` | `"cm-highlighted"` |

::: warning
There is no `sanitize`, `initHighlighting`, `getHighlightStyles`, `getHighlightStyleSheet` or `REF_PREVIEW_CLASS` on this module — those are the **internal** names in `src/utils/codeHighlight.js`. Plugins only ever see the eight members above, and `sanitize()` in particular is not exported.
:::

## Highlight HTML

Both methods return **escaped HTML** with Lezer `tok-*` class names (`tok-keyword`, `tok-string`, …). Put the result inside an element with the `cm-highlighted` class (or `codeHighlight.HIGHLIGHT_CLASS`).

::: warning
`highlightCodeBlock` and `highlightLine` escape the source text themselves (`&`, `<`, `>`, `"`), but they do **not** sanitise the produced markup, and they inject the literal string `<span class="symbol-match">` around matches. Treat the output as trusted HTML for your own content — it is safe to assign to `innerHTML` only when the input text is. Acode's own markdown preview additionally runs it through `DOMPurify` with `ALLOWED_TAGS: ["span"]` / `ALLOWED_ATTR: ["class"]` before insertion; do the same if your input is untrusted.
:::

### `highlightCodeBlock(code, language)`

Highlight a multi-line snippet. `language` is a mode name or markdown fence id (`"javascript"`, `"python"`, `"js"`, `"ts"`, …). Unknown languages fall back to escaped plain text.

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `code` | `string` | – | The source text. Falsy input returns `""` immediately. |
| `language` | `string` | – | Looked up case-insensitively in the mode registry (`getModesByName()`). If that misses, a synthetic `file.<language>` path is tried; if that misses too, the escaped plain text is returned. |

**Returns** `Promise<string>` — a string of escaped HTML where every token is wrapped in `<span class="tok-…">`.

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

`highlight(code, language)` is an alias of `highlightCodeBlock`.

### `highlightLine(text, uri, symbolName)`

Highlight a single line. Language is inferred from `uri`. When `symbolName` is set, matching text is wrapped in `<span class="symbol-match">`.

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `text` | `string` | – | The line. Whitespace-only or falsy input returns `""` immediately; otherwise the text is trimmed. |
| `uri` | `string` | – | File URI (or path) used to resolve the language parser. |
| `symbolName` | `string \| null` | `null` | When set, every case-insensitive match is wrapped in `<span class="symbol-match">`. Sanitised and regex-escaped before matching. |

**Returns** `Promise<string>`.

```js
const html = await codeHighlight.highlightLine(
  "export function greet() {}",
  "file:///sdcard/project/src/hello.js",
  "greet",
);
```

### Complete Example: Highlighting A Fenced Block <Badge type="tip" text="new" />

Render a markdown-style fenced code block inside a plugin page:

```js
async function renderFencedBlock(container, fenceLang, source) {
  const codeHighlight = acode.require("codeHighlight");

  // `fenceLang` is the info string of the markdown fence ("js",
  // "javascript", …). An empty string is fine — the app falls back to
  // escaped plain text.
  const html = await codeHighlight.highlightCodeBlock(source, fenceLang || "text");

  const pre = document.createElement("pre");
  const code = document.createElement("code");

  // The class is what the injected stylesheet scopes its rules to, and the
  // `tok-*` spans are what those rules colour.
  code.className = codeHighlight.HIGHLIGHT_CLASS;
  code.innerHTML = html;

  pre.appendChild(code);
  container.appendChild(pre);
}

acode.setPluginInit("com.example.snippets", (baseUrl, $page) => {
  renderFencedBlock(
    $page,
    "javascript",
    'export const hi = () => "there";\nconsole.log(hi());',
  );
});
```

::: tip
On the light DOM you do not need `applyStyles` at all — the app injects a `<style id="cm-static-highlight-styles">` into `document.head` at startup (`initHighlighting()` in `src/main.js`) and rebuilds it whenever the editor theme changes. Call `applyStyles` only for content that lives inside a shadow root.
:::

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

`applyStyles(root = document)` resolves the target first: `document` stays `document`, a `ShadowRoot` is used as-is, and any element with a `shadowRoot` is replaced by that shadow root. It then:

1. rebuilds the shared stylesheet from the current editor theme;
2. tries `root.adoptedStyleSheets.push(sheet)` and returns the `CSSStyleSheet` on success;
3. otherwise injects (or reuses) a `<style id="cm-static-highlight-styles">` **inside** that root and returns the element;
4. returns `null` if the root cannot host a stylesheet at all.

`applyStyles` prefers `adoptedStyleSheets`. Theme changes then update every adopted root in place — you do not need to call it again.

```js
const css = codeHighlight.getStyles();
const sheet = codeHighlight.getStyleSheet();
```

`getStyles()` returns the CSS text for **two** selectors: `.cm-highlighted` (with background/foreground) and `.ref-preview` (tokens only, no background — that class is used by the LSP references panel and is **not** exported to plugins).

Use `getStyles()` only if you need the raw CSS string. Prefer `applyStyles` so theme updates stay in sync.

## Where Acode Uses This <Badge type="tip" text="new" />

| Call site | What it does |
|---|---|
| `src/pages/markdownPreview/index.js` | Highlights every `<pre><code>` in the markdown preview; adds the `cm-highlighted` class, then re-inserts the result through DOMPurify (`ALLOWED_TAGS: ["span"]`) |
| `src/pages/plugin/plugin.js` | Highlights the code samples on the installed-plugin detail page |
| `src/components/referencesPanel/*` | `highlightLine()` per reference row, rendered into `.ref-preview` spans in the LSP references panel |
| `src/lib/editorFile.js` | Applies the stylesheet to a custom tab's shadow root when `highlightStyles: true` was passed |
| `src/utils/codeHighlight.js` | Listens for `settings.on("update:editorTheme:after")` and clears the cache whenever the active editor theme id actually changes |

## Cache

Results are cached per theme + language + source. Call `codeHighlight.clearCache()` after you register or unregister a language if stale HTML would be a problem.

```js
const editorLanguages = acode.require("editorLanguages");

editorLanguages.register("example_notes", ["notes"], "Notes", () => myExtension);
// Anything highlighted before this point was cached with the *old* parser.
codeHighlight.clearCache();
```

The cache is a bounded map of **500** entries with first-in-first-out eviction, keyed `line:<themeId>:<uri>:<text>:<symbolName>` for lines and `block:<themeId>:<language>:<code>` for blocks.

::: warning
`clearCache()` does not re-run any styling. `applyStyles()` and `getStyleSheet()` regenerate and re-inject the stylesheet, but `getStyles()` only recomputes the CSS string. Either way, HTML you already inserted keeps whatever classes it has — after changing the theme yourself, re-run the highlighter for the visible content.
:::

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
- Editor theme registration (`config` supplies these colours): [Editor Themes](./editor-themes.md)
- Custom tabs: [Editor File](../editor-components/editor-file.md)
- Switching editor themes (`changeEditorTheme`): [Commands API](./commands.md)
