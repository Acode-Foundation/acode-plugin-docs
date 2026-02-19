# CodeMirror and Legacy Ace Compatibility

Acode now uses **CodeMirror 6** as the editor engine.

This page exists for plugin migration from Ace-era APIs.

## What To Use Now

- Use `editorManager.editor` as the active editor view (`EditorView`).
- Use `acode.require("commands")` for command registration/removal.
- Use `acode.require("editorLanguages")` to register or remove language modes.
- Use `acode.require("editorThemes")` to register or apply editor themes.

## Legacy Compatibility

Acode still provides some Ace-like compatibility for older plugins:

- `editorManager.editor.session` exposes a session object with Ace-style helper methods.
- `acode.require("aceModes")` still maps to mode registration helpers.

These compatibility layers are for transition only. Prefer CodeMirror-first APIs for new plugins.

## Migration Quick Map

| Old pattern | New pattern |
|---|---|
| `acode.require("aceModes")` | `acode.require("editorLanguages")` |
| `editor.session.setMode(...)` | `editorManager.activeFile?.setMode(...)` |
| Ace global API usage (`ace.*`) | `editorManager.editor` + `editorLanguages` + `editorThemes` |
