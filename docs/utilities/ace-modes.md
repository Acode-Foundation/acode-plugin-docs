# Editor Languages (CodeMirror)

Acode now uses CodeMirror.  
For language registration, use `editorLanguages` as the primary API.

## Import

```javascript
const editorLanguages = acode.require("editorLanguages");
```

## Methods

### `register(name, extensions, caption?, loader?)`

Registers a language mode.

- `name`: Internal mode name.
- `extensions`: String or string array (without `.`), for example `"mymode"` or `["mymode", "mym"]`.
- `caption` (optional): Label shown in UI.
- `loader` (optional): Function returning a CodeMirror extension (or a Promise resolving to one).

```javascript
const editorLanguages = acode.require("editorLanguages");

editorLanguages.register(
  "myMode",
  ["mymode", "mym"],
  "My Custom Mode",
  async () => {
    // Return a CodeMirror language extension here
    return [];
  }
);
```

**Returns** `undefined`. There is no success flag — a mode is registered even if the loader later rejects.

| Argument | Type | Meaning |
|---|---|---|
| `name` | `string` | Mode id. Trimmed and lowercased. This becomes `file.currentMode` and the key used by `get()` / `listByName()`. |
| `extensions` | `string \| string[]` | An array is joined with `\|`. Each `\|`-separated part is either a bare file extension (`js`, `mjs`, `zsh`) or an anchored exact filename prefixed with `^` (`^Dockerfile`, `^.babelrc`). Never include the dot. |
| `caption` | `string` (optional) | UI label. Defaults to `name` with `_` replaced by spaces. |
| `loader` | `() => Extension \| Promise<Extension>` (optional) | Returns the CodeMirror language extension. May be sync or async — Acode reconfigures the language compartment as soon as the promise settles. |

**Filename → mode resolution order** (`getForPath` / `getModeForPath`): anchored and regex filename matches first, then extension matches ranked by specificity (a `^` pattern scores `1000 + pattern.length`, a bare extension scores its own length), then a linear `supportsFile()` scan, then the built-in `text` mode.

### `unregister(name)`

Removes a previously registered language mode.

```javascript
const editorLanguages = acode.require("editorLanguages");
editorLanguages.unregister("myMode");
```

**Returns** `undefined` — including when no such mode existed.

### Full method table

| Method | Aliases | Signature | Returns |
|---|---|---|---|
| `register` | `add` | `(name, extensions, caption?, loader?)` | `undefined` |
| `unregister` | `remove` | `(name)` | `undefined` |
| `list` | – | `()` | `Mode[]` — a copy of the array |
| `listByName` | – | `()` | `Record<string, Mode>` — a shallow copy |
| `get` | – | `(name)` | `Mode \| null` |
| `getForPath` | – | `(path)` | `Mode` — always resolves, falling back to `text` |

### The `Mode` object

| Member | Type | Description |
|---|---|---|
| `name` | `string` | Normalized (trimmed, lower-cased) mode id |
| `mode` | `string` | Alias of `name`, kept for Ace-era readers |
| `caption` | `string` | UI label |
| `extensions` | `string` | The `\|`-joined pattern string |
| `aliases` | `string[]` | Normalized aliases (only set through `options.aliases`) |
| `extRe` | `RegExp \| null` | Compiled filename matcher, or `null` when no patterns |
| `filenameMatchers` | `RegExp[]` | Extra filename regexes |
| `languageExtension` | `Function \| null` | The raw loader you supplied |
| `supportsFile(filename)` | `(filename) => boolean` | Does this mode claim that filename? |
| `getExtension()` | `() => Function \| null` | Returns `languageExtension` — the loader, **not** an extension |
| `isAvailable()` | `() => boolean` | `languageExtension !== null` |

::: warning
There is no `$id`, no `Ace`-style mode object, and no synchronous "give me the parsed language" accessor. `getExtension()` returns the loader function, so resolving the actual extension is always `await mode.languageExtension()`.
:::

## Apply A Mode To Active File

```javascript
editorManager.activeFile?.setMode("myMode");
```

`setMode(mode, { recommend: true })` sets `currentMode` to the resolved `Mode.name` and `currentLanguageExtension` to that mode's loader, then refreshes the tab icon. It emits the `changemode` event first and aborts if a listener calls `preventDefault()`; it also no-ops on non-editor files (custom tabs, default session).

```js
window.editorManager.on("file-loaded", (file) => {
  file.on("changemode", (event) => {
    console.log("mode ->", file.currentMode);
    // event.preventDefault() cancels the change
  });
});
```

## Legacy Alias (`aceModes`)

`acode.require("aceModes")` is still available for backward compatibility:

```javascript
const aceModes = acode.require("aceModes");
aceModes.addMode("myMode", ["mymode"], "My Custom Mode");
aceModes.removeMode("myMode");
```

### Full `aceModes` table

```js
const aceModes = acode.require("aceModes");
```

| Method | Signature | Returns | Identity |
|---|---|---|---|
| `addMode` | `(name, extensions, caption?, loader?, options?)` | `undefined` | the **raw** `addMode` from the mode registry |
| `removeMode` | `(name)` | `undefined` | the **raw** `removeMode` |
| `getModeForPath` | `(path)` | `Mode` | wrapper; coerces `path` with `String(path \|\| "")` |
| `getModes` | `()` | `Mode[]` (a copy) | wrapper |
| `getModesByName` | `()` | `Record<string, Mode>` (a copy) | wrapper |
| `getMode` | `(name)` | `Mode \| null` | wrapper; trims + lower-cases before lookup |

::: danger
Nothing here loads Ace. There is no Ace engine in this build, no Ace mode files, and no `ace.define`. `aceModes` is a misleading name for a thin wrapper over the same CodeMirror mode registry that `editorLanguages` uses — the names are legacy, the behaviour is not.
:::

### How This Relates To `editorLanguages`

Both modules read and write the **same** registry (`src/cm/modelist.ts`), so every method maps one-to-one:

| `aceModes` | `editorLanguages` | Same underlying call? |
|---|---|---|
| `addMode(name, ext, caption, loader)` | `register(name, ext, caption, loader)` / `add(...)` | yes — `register`/`add` forward straight to `addMode` |
| `removeMode(name)` | `unregister(name)` / `remove(...)` | yes — forward to `removeMode` |
| `getModeForPath(path)` | `getForPath(path)` | yes — both wrap `getModeForPath` |
| `getModes()` | `list()` | yes |
| `getModesByName()` | `listByName()` | yes |
| `getMode(name)` | `get(name)` | yes |

::: warning
One real difference: **`aceModes.addMode` is the raw registry function**, so it forwards a fifth `options` argument that `editorLanguages.register` / `add` silently drops:

```js
aceModes.addMode("MyLang", "ml|mdx", "My Lang", loader, {
  aliases: ["mylang", "myl"],
  filenameMatchers: [/\.myconfig$/],
});
```

`aliases` become additional lookup keys in `getModesByName()` / `get(name)`; `filenameMatchers` are extra `RegExp`s used by `supportsFile()` during path resolution. Reach for `editorLanguages.register` unless you specifically need those.
:::

For the wider picture — what is gone (`ace.edit`, `editor.session`, `editor.$id`, …) and how each Ace-era call maps over — see [CodeMirror and Legacy Ace Compatibility](../global-apis/ace.md).

## Migrating From `aceModes` <Badge type="tip" text="new" />

| Old pattern | New pattern |
|---|---|
| `acode.require("aceModes")` | `acode.require("editorLanguages")` |
| `aceModes.addMode(name, exts, caption, loader)` | `editorLanguages.register(name, exts, caption, loader)` |
| `aceModes.removeMode(name)` | `editorLanguages.unregister(name)` |
| `aceModes.getMode(name)` | `editorLanguages.get(name)` |
| `aceModes.getModes()` | `editorLanguages.list()` |
| `aceModes.getModesByName()` | `editorLanguages.listByName()` |
| `aceModes.getModeForPath(path)` | `editorLanguages.getForPath(path)` |
| `mode.$id` / `mode.mode` as an Ace mode path | `mode.name` |
| `session.setMode("js")` | `editorManager.activeFile?.setMode("javascript")` |
| `ace.define(...)` | `editorLanguages.register(...)` |

::: tip
Only the module name changed for the read paths, and nothing changed for the write paths. If your plugin already uses `aceModes`, the migration is mechanical: swap the require and rename five methods. Do it opportunistically — `aceModes` is not going away.
:::

## Complete Example <Badge type="tip" text="new" />

```js
const editorLanguages = acode.require("editorLanguages");
const { LanguageSupport, StreamLanguage, HighlightStyle, syntaxHighlighting } =
  acode.require("@codemirror/language");
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
  languageData: { commentTokens: { line: "#" } },
});

const notesHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "#c678dd" },
  { tag: tags.string, color: "#98c379" },
  { tag: tags.comment, color: "#5c6370", fontStyle: "italic" },
]);

acode.setPluginInit("com.example.notes-lang", () => {
  editorLanguages.register(MODE_NAME, ["notes", "note", "^NOTES"], "Notes", () =>
    new LanguageSupport(notesStream, [syntaxHighlighting(notesHighlight)]),
  );

  // The language is available for the already-open tab immediately.
  window.editorManager?.activeFile?.setMode(MODE_NAME);
});

acode.setPluginUnmount("com.example.notes-lang", () => {
  editorLanguages.unregister(MODE_NAME);
});
```

::: code-group

```js [Lezer grammar]
// A Lezer parser must be bundled with your plugin; the styling helpers do not.
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

editorLanguages.register("mylang", ["ml"], "MyLang", () => new LanguageSupport(lang));
```

```js [Aliases via aceModes]
// Only the raw addMode accepts the options argument.
const aceModes = acode.require("aceModes");

aceModes.addMode("MyLang", "ml", "My Lang", () => myExtension, {
  aliases: ["mylang", "myl"],
  filenameMatchers: [/^tsconfig\..*\.json$/],
});

aceModes.getMode("mylang"); // -> the same Mode object
```

:::

## Gotchas

::: warning
**Registering the same name twice leaks.** `addMode` overwrites the name lookup but **appends** a second entry to the mode array, so `list()` / `getModes()` can return duplicates. `unregister` then removes only the first array match, leaving the stale entry behind. Always `unregister` before re-registering, and register once from `setPluginInit` rather than from every file load.
:::

::: warning
**Names are case-insensitive and trimmed.** `register("MyMode", …)` stores the id `mymode`, so `file.currentMode` will read `"mymode"` and `get("MyMode")` still resolves. Use the lower-cased id when you compare `currentMode` yourself.
:::

::: warning
**Unregistering does not re-highlight open tabs.** The mode is gone from the registry but the tab keeps whatever language extension it was last configured with. Call `file.setMode()` again (with a different mode, or the same one) to force the update.
:::

::: warning
**A loader that throws leaves the tab unhighlighted.** Registration itself cannot fail, so a broken `loader` only shows up later as a console warning from the editor's language compartment. Test the loader once at plugin init with `await myLoader()`.
:::

## Related

- [CodeMirror packages](./codemirror.md) — the exact `@codemirror/*` and `@lezer/*` instances to build extensions from
- [Editor Themes API](./editor-themes.md) — pair a language with a syntax theme
- [Code Highlight](./code-highlight.md) — highlight code with a registered mode outside the editor
- [CodeMirror and Legacy Ace Compatibility](../global-apis/ace.md) — the full migration map
- [Editor File](../editor-components/editor-file.md) — `setMode`, `currentMode`, the `changemode` event
