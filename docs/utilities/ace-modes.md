# Editor Languages (CodeMirror)

Acode now uses CodeMirror.  
For language registration, use `editorLanguages` as the primary API.

## Import

```javascript
const editorLanguages = acode.require("editorLanguages");
```

## Methods

### `register(name, extensions, caption?, loader?, options?)`

Registers a language mode.

- `name`: Internal mode name.
- `extensions`: String or string array (without `.`), for example `"mymode"` or `["mymode", "mym"]`.
- `caption` (optional): Label shown in UI.
- `loader` (optional): Function returning a CodeMirror extension (or a Promise resolving to one).
- `options` (optional):
  - `aliases`: other names that resolve to this mode.
  - `filenameMatchers`: `RegExp[]` matched against file names.
  - `formatAs`: name of a mode whose formatter this mode reuses. See [Formatting](#formatting).

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

### `unregister(name)`

Removes a previously registered language mode.

```javascript
const editorLanguages = acode.require("editorLanguages");
editorLanguages.unregister("myMode");
```

## Formatting

A new mode has no formatter, and the built-in Prettier doesn't know its name. If your language is a variant of an existing one, set `formatAs` to reuse that mode's formatter:

```javascript
editorLanguages.register(
  "json-bedrock",
  ["jsonbe"],
  "JSON (Bedrock)",
  loadBedrockLanguage,
  { formatAs: "json" }, // [!code focus]
);
```

When the user formats a `json-bedrock` file:

- Acode uses the formatter chosen for `json-bedrock` in **Settings → Formatter**, or the one chosen for `json` if there is none.
- Prettier formats it with the `json` parser.

In **Settings → Formatter**, the "JSON (Bedrock)" row shows the inherited formatter, for example "Prettier (JSON)", and its picker also lists the formatters available for `json`. Picking one there overrides the inherited choice. This works with any formatter, not only Prettier.

Older Acode versions ignore `formatAs`, so passing it is safe; the mode just has no formatter there.

## Apply A Mode To Active File

```javascript
editorManager.activeFile?.setMode("myMode");
```

## Legacy Alias (`aceModes`)

`acode.require("aceModes")` is still available for backward compatibility:

```javascript
const aceModes = acode.require("aceModes");
aceModes.addMode("myMode", ["mymode"], "My Custom Mode");
aceModes.removeMode("myMode");
```

Prefer `editorLanguages` for new plugins.
