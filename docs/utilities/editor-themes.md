# Editor Themes API

The Editor Themes API lets plugins register CodeMirror themes in Acode.

## Import

```js
const editorThemes = acode.require("editorThemes");
```

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

### Full Plugin-Style Example

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
  editorThemes.register({
    id: "chai_theme",
    caption: "Chai Theme",
    dark: true,
    getExtension: () => buildChaiTheme(),
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
});

acode.setPluginUnmount("com.example.theme", () => {
  editorThemes.unregister("chai_theme");
});
```

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
    this.editorThemes.register({
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

`spec` fields:

- `id` (required): unique theme id (or `name` alias).
- `caption` (optional): display label (or `label` alias).
- `dark` (optional): whether the theme is dark (or `isDark` alias).
- `getExtension` / `extensions` / `extension` / `theme` (required): CodeMirror extension(s) or function returning them.
- `config` (optional): theme metadata object.

## `apply(id)`

Applies a registered theme to the active editor.

```js
editorThemes.apply("example-night");
```

## Theme Management Methods

- `unregister(id)`
- `list()`
- `get(id)`
- `getConfig(id)`

```js
const themes = editorThemes.list();
console.log(themes.map((t) => t.id));
```

## Helpers

### `createTheme({ styles, dark, highlightStyle, extensions })`

Builds a theme extension array.

### `createHighlightStyle(spec)`

Builds a `HighlightStyle` from tag rules.

### `cm`

CodeMirror helpers exposed by Acode:

- `EditorView`
- `HighlightStyle`
- `syntaxHighlighting`
- `tags`
