# Terminal

The `terminal` module exposes Acode’s xterm.js-based terminal. Require it with `acode.require('terminal')` to create terminals, manage sessions, and add themes.

## Import

```js
const terminal = acode.require('terminal');
```

## API Overview

The module exposes these methods:

- `create(options)`: Creates a new terminal tab. Returns an instance object.
- `createLocal(options)`: Creates a local-only terminal (no backend).
- `createServer(options)`: Creates a server-connected terminal when available(By default it will connect to Alpine).
- `get(id)`: Returns a terminal instance by id or null.
- `getAll()`: Returns a Map-like collection of all terminals.
- `write(id, data)`: Writes text to a terminal (ANSI supported). This only write input into the terminal, **it does not automatically submit/execute shell commands**. To execute a command, include a line ending (carriage return/newline) such as `\r` or `\r\n`.
- `clear(id)`: Clears a terminal screen.
- `close(id)`: Closes and disposes a terminal.
- `themes.register(name, theme, pluginId)`: Adds a custom theme.
- `themes.unregister(name, pluginId)`: Removes a theme registered by your plugin.
- `themes.get(name)`: Returns a theme by name.
- `themes.getAll()`: Returns an object map of all themes.
- `themes.getNames()`: Returns an array of available theme names.
- `themes.createVariant(baseName, overrides)`: Clones a theme with overrides.

::: tip
The native terminal environment is also exposed globally as `Terminal`. Methods such as `Terminal.isInstalled()` are available on that global object, not on `acode.require('terminal')`.
:::

## Create

```js
// Generic create (chooses mode from options)
const term = await terminal.create({
  name: 'My Terminal',
  theme: 'dark', // Any installed theme
});

// Local terminal (no backend), It is like a empty terminal instance where you can write stuff , it doesn't opens any shell
const local = await terminal.createLocal({ name: 'Plugin Output' });

// Server terminal (connects to backend if available)
const server = await terminal.createServer({ name: 'Server Shell' });

// Or via command
acode.exec('new-terminal');
```

### TerminalOptions

Common options accepted by create functions:

- `name`: Display name for the terminal tab.
- `serverMode`: Boolean to force server connection (default true) or local mode (false).
- `port`: Useful in server mode to connect to specific `axs` port. Backend HTTP/WS port (default 8767).
- `theme`: Theme name to apply (see Themes).
- `rows, cols`: Preferred initial size hints.
- `renderer`: Preferred xterm.js renderer. Accepts `'auto'` (default; prefers `webgl`), `'webgl'`, or `'canvas'`. Use `webgl` for best performance; `canvas` is a fallback and may be slower.
- `fontSize`: Initial font size.
- And other xtermjs terminal options such as: allowProposedApi,scrollOnUserInput,fontFamily,fontWeight,cursorBlink,cursorStyle,cursorInactiveStyle,scrollback,letterSpacing, etc

### Return Value

The create methods resolve to an instance object:

- id: Unique id (PID when available; fallback to generated id).
- name: Terminal name.
- component: [TerminalComponent instance](https://github.com/Acode-Foundation/Acode/blob/a38f019444cac4c155aff5f18df52d8685fb171d/src/components/terminal/terminal.js#L24).
- file: EditorFile tab representing the terminal.
- container: The DOM element hosting the terminal.

## Manage

```js
// Get a terminal by id
const t = terminal.get('terminal_1');

// Iterate all terminals
for (const [id, inst] of terminal.getAll()) {
  console.log(id, inst.name);
}

// Write text (ANSI supported)
terminal.write('terminal_1', 'Hello World!\r\n');

// Clear and close
terminal.clear('terminal_1');
terminal.close('terminal_1');
```

> [!Note]
> write uses a secured path internally to prevent unintended escape sequences from breaking state.

## Themes

Register custom themes or derive variants from existing ones. You can also query available themes.

```js
// Register
terminal.themes.register('myTheme', {
  background: '#1a1a1a', foreground: '#ffffff', cursor: '#ffffff', cursorAccent: '#1a1a1a', selection: '#ffffff40',
  black: '#000000', red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c', blue: '#bd93f9', magenta: '#ff79c6', cyan: '#8be9fd', white: '#f8f8f2',
  brightBlack: '#44475a', brightRed: '#ff6e6e', brightGreen: '#69ff94', brightYellow: '#ffffa5', brightBlue: '#d6acff', brightMagenta: '#ff92df', brightCyan: '#a4ffff', brightWhite: '#ffffff',
}, 'my-plugin-id');

// Variants
const darkVariant = terminal.themes.createVariant('dark', { background: '#000', red: '#ff3030', green: '#30ff30' });
terminal.themes.register('darkCustom', darkVariant, 'my-plugin-id');

// Query
const theme = terminal.themes.get('dark');
const all = terminal.themes.getAll();
const names = terminal.themes.getNames();

// Unregister
terminal.themes.unregister('myTheme', 'my-plugin-id');
terminal.themes.unregister('darkCustom', 'my-plugin-id');
```

### Required Theme Keys

- background, foreground, cursor, cursorAccent, selection
- black, red, green, yellow, blue, magenta, cyan, white
- brightBlack, brightRed, brightGreen, brightYellow, brightBlue, brightMagenta, brightCyan, brightWhite

## Behavior & Lifecycle

- Installation flow: When serverMode is true (default), terminal checks if the backend is installed and supported. If missing, an installation terminal opens and streams progress. Creation proceeds only if install succeeds.
- IDs: If the backend provides a PID, it becomes the terminal id; otherwise a generated id like `terminal_1` is used.
- Tab: Each terminal is an EditorFile tab with an icon and custom title (PID or generated id). On process exit, the tab closes and a toast shows the exit status.

## Native Terminal Environment

Use the global `Terminal` object when you need to inspect or manage the underlying terminal runtime directly.

### `Terminal.isInstalled()`

Returns a `Promise<boolean>` that resolves to `true` when the Alpine terminal environment has already been downloaded and extracted.

```js
if (globalThis.Terminal) {
  const installed = await Terminal.isInstalled();

  if (!installed) {
    console.log('Terminal environment is not installed yet.');
  }
}
```

This is useful when a plugin needs to decide whether it can use terminal-backed features before opening a server terminal. For normal terminal creation, prefer `terminal.create()` or `terminal.createServer()`, because they already run the install flow when needed.

## Background Execution (No Terminal)

Use the globally available `Executor` when you need to run a one‑off shell command without opening a visual terminal session.

> [!Warning]
> Prefer visible terminals for transparency. Avoid hiding work in the background and do not start long‑running processes via `Executor.execute`. For interactive or long‑lived tasks, use a terminal session instead.

### `Executor.execute(command, alpine?)`

- Purpose: Runs a single shell command and waits for it to finish. Output is returned after the process exits (no live streaming of output).
- Parameters:
  - `command` (string): The command to run.
  - `alpine` (boolean, optional): Run inside the Alpine sandbox when `true`; run in the Android environment when `false`.
- Returns: `Promise<string>` that resolves with stdout on success, or rejects with an error/stderr on failure.

#### Example

```js
// Quick directory listing without opening a terminal UI
Executor.execute('ls -l')
  .then(console.log)
  .catch(console.error);
```

## Example: Themed Output Terminal

```js
const terminal = acode.require('terminal');

// Ensure your theme exists (or use a built-in one)
terminal.themes.register('cyberpunk', { /* colors */ }, 'my-plugin');

// Create a local output terminal and log
const out = await terminal.createLocal({ name: 'Plugin Output', theme: 'cyberpunk' });
// Or
const out = await terminal.create({ name: 'Plugin Output', serverMode: false, theme: 'cyberpunk' });
terminal.write(out.id, '\u001b[36mPlugin initialized\u001b[0m\r\n');
```
