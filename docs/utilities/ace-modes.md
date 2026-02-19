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

### `unregister(name)`

Removes a previously registered language mode.

```javascript
const editorLanguages = acode.require("editorLanguages");
editorLanguages.unregister("myMode");
```

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
