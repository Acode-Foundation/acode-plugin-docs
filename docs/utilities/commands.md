# Commands API

Use the Commands API to register commands for command palette/keybindings and execute them programmatically.

Every registered command automatically gets:

- a row in the **command palette** (`openCommandPalette`), labelled with its description;
- a **keybinding** in the editor, converted from its `bindKey`;
- a slot in the **quick tools** bar — typing the command's *own shortcut* there (with Ctrl / Alt / Meta held) runs it, matched against `key` rather than `name`;
- an entry in `acode.listCommands()`.

## Preferred Access

```js
const commands = acode.require("commands");
```

The module object has exactly three members:

| Member | Type | Notes |
|---|---|---|
| `commands.addCommand` | `(descriptor) => object \| null` | Registers a command **and** refreshes the active editor's keymap |
| `commands.removeCommand` | `(name) => void` | Unregisters and refreshes |
| `commands.registry` | `{ add, execute, remove, list }` | Low-level passthrough — see [`registry`](#registry) |

::: tip
Prefer this API over `editorManager.editor.commands.*` (which is kept for compatibility). The `editorManager` variant refreshes the keymap on **every** pane; `acode.addCommand` / `commands.addCommand` only refresh the focused view.
:::

## `addCommand(descriptor)`

Registers a command.

```js
commands.addCommand({
  name: "example.sayHello",
  description: "Say hello",
  bindKey: { win: "Ctrl-Alt-H", mac: "Command-Alt-H" },
  exec: (view, args) => {
    acode.alert("Hello", `Args: ${JSON.stringify(args)}`);
    return true;
  },
});
```

Descriptor fields:

| Field | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `name` | `string` | **yes** | – | Unique command id. Trimmed. Empty → registration skipped with a `console.warn`. Used verbatim as the keybinding-map name and the palette lookup key. |
| `exec` | `(view, args) => boolean \| void` | **yes** | – | The handler. Not a function → registration skipped with a `console.warn`. Anything other than a literal `false` return counts as success. |
| `description` | `string` | no | the name with `camelCase` split into words, `_` turned into spaces, first letter upper-cased (dots are **kept** — `example.sayHello` → `Example.say Hello`) | Palette / quick-tools label. |
| `readOnly` | `boolean` | no | `true` | When the target editor is read-only, only commands with `readOnly: true` run. Note the default is the **permissive** one for non-mutating commands; set `false` for anything that edits the document. |
| `requiresView` | `boolean` | no | `true` | When `true`, the command does nothing and reports failure if no `EditorView` can be resolved. Set `false` for pure app commands (open a palette, create a tab) — but note `view` is still handed to `exec` if an editor happens to be focused. |
| `bindKey` | `string` or `{ win?, linux?, mac? }` | no | `null` | Shortcut. See [`bindKey`](#bindkey). |

Exact validation messages, both emitted with `console.warn`:

```js
// name missing / not a string / empty after trim
console.warn("Command registration skipped: missing name", descriptor);

// exec missing or not a function
console.warn(`Command registration skipped for "${name}": exec must be a function.`);
```

::: warning
The stored entry also carries internal fields you should ignore: `defaultDescription`, `defaultKey`, `key` and `run` (a wrapper around your `exec`). Passing them in has no effect — `bindKey` is the only key field the public API reads.
:::

**Returns** the stored command object (`{ name, description, defaultDescription, defaultKey, key, readOnly, requiresView, run }`), or `null` when validation failed. `commands.addCommand` logs `Failed to add command <name>` and **re-throws** if anything goes wrong; `acode.addCommand` propagates the error unchanged.

### `bindKey`

Two forms are accepted.

**String** — one combo, or several joined with `|`:

```js
bindKey: "Ctrl-Shift-K"          // one combo
bindKey: "Ctrl-Shift-K|Mod-Shift-K"  // two combos -> both get registered
```

**Platform object** — `win`, `linux` and `mac` keys are collected (in that order), trimmed, and joined with `|`:

```js
bindKey: { win: "Ctrl-Alt-H", linux: "Ctrl-Alt-H", mac: "Command-Alt-H" }
// becomes the string "Ctrl-Alt-H|Ctrl-Alt-H|Command-Alt-H"
```

::: info
All three platform variants are registered, and Acode collapses each one to CodeMirror's portable `Mod`, which the runtime maps to Ctrl (or Cmd on macOS). `Ctrl`, `Control`, `Mod`, `Cmd` and `Meta` all become `Mod`; `Alt` and `Option` become `Alt`; modifiers are always emitted in the order `Mod-Alt-Shift`, and single letters are lower-cased. So `Command-Alt-H` and `Ctrl-Alt-H` end up as the identical binding `Mod-Alt-h` — on a device where only one of the two is reachable, prefer spelling it once in a plain string instead of the platform object.
:::

Space-separated tokens form a **chord** (a multi-stroke sequence):

```js
bindKey: "Ctrl-K Ctrl-S"   // press Ctrl-K, then Ctrl-S
```

Recognised key names include `left` / `right` / `up` / `down` → `ArrowLeft` … `ArrowDown`, and `esc`, `escape`, `return`, `enter`, `space`, `del`, `delete`, `backspace`, `tab`, `home`, `end`, `pageup`, `pagedown`, `insert`. A trailing `-` (`"Ctrl--"` for the minus key) is preserved.

If a combo collides with a binding that outranks yours it is dropped from the keymap and recorded as an internal conflict — but the conflict is **not** surfaced to plugins, and `listCommands()` still reports your `bindKey` verbatim. Built-in app bindings outrank plugin commands, so avoid `Ctrl-1` … `Ctrl-9`, `Ctrl-P`, `Ctrl-Q`, `Ctrl-W` and friends.

### `exec(view, args)`

- `view` is the resolved `EditorView` — the view you passed to `execCommand`, otherwise `window.editorManager.editor`, otherwise `null`.
- `args` is passed through untouched from `execCommand`'s third argument.
- If your `exec` throws, the registry logs `Command "<name>" failed` with the error and the command reports failure.
- Only a literal `return false` marks the command as failed. `undefined`, `true`, and any other value are all treated as success (which matters: returning `false` from a keybinding handler tells CodeMirror "not handled").

## `removeCommand(name)`

Unregisters a command.

```js
commands.removeCommand("example.sayHello");
```

**Returns** `undefined` (there is no "did it exist?" signal on this path). Passing an empty name is a no-op.

::: danger
`removeCommand` works for **any** name, including the built-ins. `commands.removeCommand("saveFile")` deletes Acode's own Save command from the registry and the keymap, and nothing restores it until the app restarts. Only remove names you registered.
:::

## `registry`

Low-level registry API:

- `registry.add(descriptor)`
- `registry.remove(name)`
- `registry.execute(name, view?, args?)`
- `registry.list()`

```js
commands.registry.execute("example.sayHello", window.editorManager.editor, {
  source: "plugin",
});

const all = commands.registry.list();
console.log(all.map((cmd) => cmd.name));
```

| Member | Signature | Returns |
|---|---|---|
| `registry.execute` | `(name, view?, args?)` | `boolean` — whether the command ran. Works correctly. |
| `registry.list` | `()` | `Array<{ name, description, key }>`. Works correctly. |
| `registry.add` | `(descriptor)` | **Not usable in v1.13.5** — throws `TypeError`. |
| `registry.remove` | `(name)` | **Not usable in v1.13.5** — throws `TypeError`. |

::: warning
`registry.add` and `registry.remove` are stored as **unbound** method references, so when they are called as properties of the `registry` object their `this` is that plain object instead of the `acode` instance. Both methods then reach `this.#refreshCommandBindings()` — a private class field — and throw:

```
TypeError: Cannot read private member #refreshCommandBindings from an object whose class did not declare it
```

The command registration/removal itself has already happened by the time it throws, so the throw is not a safety net. Use `commands.addCommand` / `commands.removeCommand` (or `acode.addCommand` / `acode.removeCommand`) for all writes, and `registry.execute` / `registry.list` only for the reads that work.
:::

`registry.list()` returns a fresh array of `{ name, description, key }` — this is a snapshot of the registry, so it reflects re-registration and the user's keybinding overrides, but for a plugin command `key` is simply the raw `bindKey` you registered (the `win|linux|mac` join in the object form), or `null` when you passed none.

## Convenience Methods On `acode`

These call the same registry internally:

- `acode.addCommand(descriptor)`
- `acode.removeCommand(name)`
- `acode.execCommand(name, view?, args?)`
- `acode.listCommands()`

| Call | Returns |
|---|---|
| `acode.addCommand(descriptor)` | the stored command object, or `null` if validation failed |
| `acode.removeCommand(name)` | `undefined` |
| `acode.execCommand(name, view?, args?)` | `boolean` |
| `acode.listCommands()` | `Array<{ name, description, key }>` |

## `execCommand(name, view, args)` <Badge type="tip" text="new" />

```js
const view = window.editorManager?.editor; // optional
const ok = acode.execCommand("example.sayHello", view, { source: "plugin" });
```

1. **Unknown name** → `false`. Nothing runs.
2. **`view` defaulting** — `view` is resolved as `view || window.editorManager.editor`. Passing `null`/`undefined` therefore targets the focused editor; passing a specific view lets you run against another pane.
3. **`requiresView: true` and no view resolvable** → `false`, `exec` is never called. With `requiresView: false` the command still runs, and `exec` receives `null` as its first argument.
4. **`readOnly` gating** — the gate is: *no view at all* → only `readOnly: true` commands run; *read-only editor* → only `readOnly: true` commands run; *editable editor* → everything runs. So `readOnly` defaults to `true` in a way that only blocks you when the editor is read-only.
5. **`args` reaches `exec`** verbatim as the second argument.
6. **Result** — `exec` returning exactly `false` yields `false`; anything else yields `true`. A thrown error is logged as `Failed to execute command <name>` and yields `false`.

## Built-In Commands <Badge type="tip" text="new" />

`acode.listCommands()` already returns 92 explicitly registered app commands plus every `@codemirror/commands` export. **Check the name before you pick one** — registering a plugin command with an existing name replaces the built-in.

### App and editor commands

| Name | Description |
|---|---|
| `focusEditor` | Focus editor |
| `findFile` | Find file in workspace |
| `closeCurrentTab` | Close current tab |
| `newPane` | Create new editor pane |
| `moveTabToNewPane` | Move current tab to new pane |
| `closePane` | Close active editor pane |
| `focusNextPane` | Focus next editor pane |
| `focusPreviousPane` | Focus previous editor pane |
| `closeAllTabs` | Close all tabs |
| `togglePinnedTab` | Pin or unpin current tab |
| `newFile` | Create new file |
| `openFile` | Open a file |
| `openFolder` | Open a folder |
| `saveFile` | Save current file |
| `saveFileAs` | Save as current file |
| `saveAllChanges` | Save all changes |
| `nextFile` | Open next file tab |
| `prevFile` | Open previous file tab |
| `nextFileHistory` | Open next file tab from history |
| `prevFileHistory` | Open previous file tab from history |
| `showSettingsMenu` | Show settings menu |
| `renameFile` | Rename active file |
| `run` | Preview HTML and MarkDown |
| `openInAppBrowser` | Open In-App Browser |
| `toggleFullscreen` | Toggle full screen mode |
| `toggleSidebar` | Toggle sidebar |
| `toggleMenu` | Toggle main menu |
| `toggleEditMenu` | Toggle edit menu |
| `openPluginsPage` | Open Plugins Page |
| `openFileExplorer` | File Explorer |
| `openTerminal` | Open Terminal |
| `openLogFile` | Open Log File |
| `copyDeviceInfo` | Copy Device info |
| `changeAppTheme` | Change App Theme |
| `changeEditorTheme` | Change Editor Theme |
| `increaseUiZoom` / `decreaseUiZoom` | Increase / Decrease UI zoom |
| `increaseFontSize` / `decreaseFontSize` | Increase / Decrease editor font size |
| `openCommandPalette` | Open command palette |
| `modeSelect` | Change language mode… |
| `gotoline` | Go to line… |
| `find` / `replace` | Find / Replace |
| `problems` | Show errors and warnings |
| `toggleQuickTools` | Toggle quick tools |
| `acode:showWelcome` | Show Welcome |
| `run-tests` | Run Tests |
| `dev:openInspector` | Open Inspector |
| `dev:toggleDevTools` | Toggle Developer Tools |

Editing commands:

| Name | Description | `readOnly` |
|---|---|---|
| `selectall` | Select all | `true` |
| `selectWord` | Select current word | `false` |
| `selectline` | Select line | `true` |
| `selectlinesdown` / `selectlinesup` | Select line down / up | `true` |
| `selectlinestart` / `selectlineend` | Select line start / end | `true` |
| `simplifySelection` | Simplify selection | `true` |
| `copy` / `cut` / `paste` / `share` | Copy / Cut / Paste / Share | `true` / `false` / `false` / `true` |
| `duplicateSelection` | Duplicate selection | `false` |
| `copylinesdown` / `copylinesup` | Copy lines down / up | `false` |
| `movelinesdown` / `movelinesup` | Move lines down / up | `false` |
| `removeline` | Remove line | `false` |
| `insertlineafter` | Insert line after | `false` |
| `indent` / `outdent` / `indentselection` | Indent / Outdent / Indent selection | `false` |
| `newline` | Insert newline | `false` |
| `joinlines` | Join lines | `false` |
| `deletetolinestart` / `deletetolineend` | Delete to line start / end | `false` |
| `togglecomment` / `comment` / `uncomment` | Toggle / add / remove line comment | `false` |
| `toggleBlockComment` | Toggle block comment | `false` |
| `undo` / `redo` | Undo / Redo | `false` |
| `foldCode` / `unfoldCode` | Fold selection / unfold selected lines | `true` |
| `foldAll` / `unfoldAll` | Fold all / unfold all | `true` |

::: warning
Nearly every command in the second table is declared `readOnly: false` and therefore **silently refuses to run in a read-only editor** — `copy` and `share` are the exceptions (`readOnly: true`), but `cut`, `paste`, `undo` and `redo` are not. `acode.execCommand` returns `false` with no error, which is the usual cause of "my command does nothing in a preloaded file".
:::

### Language-server commands

| Name | Description | `requiresView` |
|---|---|---|
| `formatDocument` | Format document (Language Server) | yes |
| `renameSymbol` | Rename symbol (Language Server) | yes |
| `showSignatureHelp` | Show signature help | yes |
| `nextSignature` / `prevSignature` | Next / Previous signature | yes |
| `jumpToDefinition` | Go to definition (Language Server) | yes |
| `jumpToDeclaration` | Go to declaration (Language Server) | yes |
| `jumpToTypeDefinition` | Go to type definition (Language Server) | yes |
| `jumpToImplementation` | Go to implementation (Language Server) | yes |
| `findReferences` | Find all references (Language Server) | yes |
| `findReferencesInTab` | Find all references in new tab (Language Server) | yes |
| `closeReferencePanel` | Close references panel | no |
| `documentSymbols` | Go to Symbol in Document… | yes |
| `restartAllLspServers` | Restart all running LSP servers | no |
| `stopAllLspServers` | Stop all running LSP servers | no |

All of the `jumpTo*` commands, `formatDocument`, `renameSymbol`, `showSignatureHelp`, `findReferences` and `findReferencesInTab` check for an active LSP plugin and toast **"Language server not available"** before returning `false`. `nextSignature` and `prevSignature` do the same check but stay silent. `closeReferencePanel`, `documentSymbols`, `restartAllLspServers` and `stopAllLspServers` do not check at all.

### Lint / diagnostics commands

| Name | Description |
|---|---|
| `openLintPanel` | Open lint panel |
| `closeLintPanel` | Close lint panel |
| `nextDiagnostic` | Go to next diagnostic |
| `previousDiagnostic` | Go to previous diagnostic |

### Auto-registered CodeMirror commands

Every function exported by `@codemirror/commands` is also registered, except the three non-command exports `history`, `redoDepth` and `undoDepth`. Names Acode itself imports from that package — and which are therefore guaranteed to appear in `acode.listCommands()` — include:

`cursorCharLeft`, `cursorCharRight`, `cursorDocEnd`, `cursorDocStart`, `cursorGroupLeft`, `cursorGroupRight`, `cursorLineDown`, `cursorLineEnd`, `cursorLineStart`, `cursorLineUp`, `cursorMatchingBracket`, `cursorPageDown`, `cursorPageUp`, `deleteCharBackward`, `deleteCharForward`, `deleteGroupBackward`, `deleteGroupForward`, `deleteLine`, `deleteLineBoundaryForward`, `deleteToLineEnd`, `deleteToLineStart`, `copyLineDown`, `copyLineUp`, `moveLineDown`, `moveLineUp`, `indentLess`, `indentMore`, `indentSelection`, `insertBlankLine`, `insertNewlineAndIndent`, `lineComment`, `lineUncomment`, `selectAll`, `selectCharLeft`, `selectCharRight`, `selectDocEnd`, `selectDocStart`, `selectGroupLeft`, `selectGroupRight`, `selectLine`, `selectLineDown`, `selectLineEnd`, `selectLineStart`, `selectLineUp`, `selectMatchingBracket`, `selectPageDown`, `selectPageUp`, `toggleBlockComment`, `toggleLineComment`.

Their descriptions are the humanized command name (`cursorLineDown` → "Cursor Line Down"), and their `key` is whatever survived CodeMirror's default keymaps **minus** every combo already claimed by an app binding — so it may be `null`. `undo`, `redo` and `simplifySelection` are in the app list above rather than this one, because they are registered explicitly first.

::: info
The precise set is whatever `acode.listCommands()` reports at runtime. Do not hard-code an expectation that a given CodeMirror command is bound to a given key — print `listCommands()` and read the effective `key`.
:::

## Complete Example <Badge type="tip" text="new" />

A command with a keybinding, a selection-menu entry that runs it, and a clean unmount:

```js
const PLUGIN_ID = "com.example.uppercase";

acode.setPluginInit(PLUGIN_ID, () => {
  const commands = acode.require("commands");
  const selectionMenu = acode.require("selectionMenu");

  // 1. The command itself. `readOnly: false` because it mutates the document —
  //    which also means the registry refuses it in a read-only tab. The
  //    `requiresView: false` lets it still run with nothing focused, in which
  //    case `exec` receives `null` as the view.
  commands.addCommand({
    name: "example.uppercaseSelection",
    description: "Uppercase selection",
    readOnly: false,
    requiresView: false,
    bindKey: {
      win: "Ctrl-Alt-U",
      linux: "Ctrl-Alt-U",
      mac: "Command-Alt-U",
    },
    exec(view, args) {
      if (!view) {
        acode.toast("No active editor");
        return false;
      }

      view.dispatch({
        changes: view.state.changeByRange((range) => ({
          if (range.empty) return {};
          changes: {
            from: range.from,
            to: range.to,
            insert: view.state.sliceDoc(range.from, range.to).toUpperCase(),
          },
        })),
      });

      if (args?.notify) acode.toast(`Uppercased${args.count ? ` ${args.count}` : ""}`);
      return true;
    },
  });

  // 2. A context-menu row that executes it. `selectionMenu.exec()` forwards to
  //    the focused editor's execCommand, so the readOnly gate is enforced
  //    exactly as it is for the keybinding. The `text` argument must be a real
  //    DOM node — a string is inserted with textContent, never parsed as HTML.
  const icon = document.createElement("span");
  icon.className = "icon text_fields";

  selectionMenu.add(
    () => selectionMenu.exec("example.uppercaseSelection"),
    icon,
    "selected",
    false,
    { id: "uppercase-selection", label: "Uppercase" },
  );
});

acode.setPluginUnmount(PLUGIN_ID, () => {
  acode.removeCommand("example.uppercaseSelection");
});
```

::: warning
`selectionMenu.add()` has **no remove API** — items are pushed onto a module-level array and stay in the menu for the rest of the session. Toggling the plugin off and on therefore accumulates duplicate rows. If that matters, drive the row's visibility from plugin state inside `onclick` instead of adding it repeatedly.
:::

## Gotchas

::: warning
**Duplicate names replace silently.** Registering a name that already exists deletes the previous entry and installs yours — including when the previous entry was a built-in such as `saveFile`. There is no warning and no "already registered" return; inspect `acode.listCommands()` first if the name matters to you.
:::

::: warning
**The keymap is rebuilt on every write.** Both `addCommand` and `removeCommand` end with a `reconfigure` of the registry's keymap compartment, so the shortcut is live immediately. But `acode.addCommand` / `acode.removeCommand` only reconfigure the **focused** view — in a multi-pane layout, panes that are not focused keep the old keymap until they are focused and the bindings are re-applied. `window.editorManager.editor.commands.addCommand(...)` refreshes every pane instead.
:::

::: warning
**`return false` means "not handled".** It is the only falsy result that makes `execCommand` report failure, and in the keymap it tells CodeMirror the keystroke was not consumed. Return `true` (or nothing) from any command that did its work.
:::

::: warning
**A conflicting `bindKey` is dropped without telling you.** App-owned bindings (and the user's keybinding overrides) outrank a plugin command, so your combo can be discarded while `listCommands()` still echoes it back. The only visible symptom is that the shortcut does nothing — the command still works from the palette and quick tools. Pick an unusual combo, or check `editorManager.editor` after registering.
:::

::: warning
**`requiresView: false` does not mean "no view".** The view is still resolved and passed to `exec`; the flag only controls whether execution is aborted when nothing is focused. Set `readOnly` deliberately rather than relying on `requiresView` to keep a mutating command out of read-only editors.
:::

## Related

- [CodeMirror packages](./codemirror.md) — `EditorView`, `EditorState`, `keymap`
- [EditorManager](../global-apis/editor-manager.md) — `editorManager.editor.execCommand(name, args)`
- [Selection Menu](../ui-components/selection-menu.md) — `selectionMenu.add()` / `selectionMenu.exec()`
- [Editor Languages](./ace-modes.md) — register the language your command operates on
