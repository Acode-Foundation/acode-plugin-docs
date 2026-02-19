# File Handlers API

Use this API to register custom open handlers for file extensions.

## `acode.registerFileHandler(id, options)`

Registers a handler.

```js
acode.registerFileHandler("com.example.svg-viewer", {
  extensions: ["svgx", ".svgalt"],
  handleFile: async (fileInfo) => {
    console.log(fileInfo.name, fileInfo.uri);
  },
});
```

`options` fields:

- `extensions` (required): extension array. Dots are allowed and normalized.
- `handleFile` (required): async function receiving file info.

## `acode.unregisterFileHandler(id)`

Removes a handler.

```js
acode.unregisterFileHandler("com.example.svg-viewer");
```

## Notes

- Handler ids must be unique.
- Extensions are matched case-insensitively.
- `"*"` can be used to match any extension.
