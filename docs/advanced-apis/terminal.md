# Terminal

The `terminal` module exposes Acode’s xterm.js-based terminal. Require it with `acode.require('terminal')` to create terminals, manage sessions, add themes, and register touch-selection "More" actions.

## Import

```js
const terminal = acode.require('terminal');
```

## API Overview

The module exposes these methods:

- `create(options)`: Creates a new terminal tab. Returns an instance object.
- `createLocal(options)`: Creates a local-only terminal (no backend).
- `createServer(options)`: Creates a server-connected terminal (by default it connects to the Alpine/AXS sandbox).
- `get(id)`: Returns a terminal instance by id, or `null`.
- `getAll()`: Returns the live `Map` of all terminals.
- `write(id, data)`: Writes text to a terminal (ANSI supported). This only writes input into the terminal, **it does not automatically submit/execute shell commands**. To execute a command, include a line ending (carriage return/newline) such as `\r` or `\r\n`.
- `clear(id)`: Clears a terminal screen.
- `close(id)`: Closes and disposes a terminal session.
- `moreOptions.add(option)`: Registers a touch-selection "More" menu entry.
- `moreOptions.remove(id)`: Removes a previously registered entry.
- `moreOptions.list()`: Returns an array of the registered entries.
- `touchSelection.moreOptions`: The **same object** as `moreOptions` (alias).
- `themes.register(name, theme, pluginId)`: Adds a custom theme. Returns a `boolean`.
- `themes.unregister(name, pluginId)`: Removes a theme registered by your plugin. Returns a `boolean`.
- `themes.get(name)`: Returns a theme object by name (falls back to `dark`).
- `themes.getAll()`: Returns a plain object map of all themes.
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
  theme: terminal.themes.get('dark'), // must be an OBJECT, not a name
});

// Local terminal (no backend). An empty terminal instance where you can write
// output. It does not open any shell and accepts no input.
const local = await terminal.createLocal({ name: 'Plugin Output' });

// Server terminal (connects to the Alpine/AXS backend)
const server = await terminal.createServer({ name: 'Server Shell' });

// Or via command (always creates a SERVER terminal)
acode.exec('new-terminal');
```

### `create` vs `createLocal` vs `createServer` <Badge type="tip" text="new" />

All three funnel into the same `TerminalManager.createTerminal(options)`. They differ only in the `serverMode` flag they force:

| Function | `serverMode` | Behaviour |
| --- | --- | --- |
| `create(options)` | `options.serverMode !== false`, so **default `true`** | Server mode unless you explicitly pass `serverMode: false` |
| `createLocal(options)` | forced `false` | No backend, no PTY, no shell. Acode writes `Local terminal mode - ready for output` once at creation |
| `createServer(options)` | forced `true` | Starts/uses the AXS sandbox backend, creates a PTY, connects a WebSocket |

::: warning `create()` defaults to server mode
`terminal.create({ name: 'x' })` with no `serverMode` runs the **full install + AXS startup flow**, exactly like `createServer()`. If you want a pure output pane you must pass `serverMode: false` or call `createLocal()`. `serverMode` is also honoured as `false` only when it is strictly `false` (`serverMode !== false`), so `0` and `null` still mean server mode.
:::

::: tip `createLocal` still respects `terminal.write()`
A local terminal has no PTY, so everything you `write()` is rendered by xterm as literal output. ANSI colour codes work. Nothing you write can ever be executed.
:::

### TerminalOptions

Options are split in two: keys consumed by `TerminalManager.createTerminal()` itself, and everything else, which is forwarded verbatim into the xterm.js constructor.

**Consumed by the manager**

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | `string` | `` `Terminal ${terminalNumber}` `` | Tab/file name. Trimmed. If it matches `^Terminal\s+(\d+)` that number becomes `terminalNumber` and the tab prefix |
| `serverMode` | `boolean` | `true` | `false` for local mode. Overridden by `createLocal` / `createServer` |
| `render` | `boolean` | `true` | `false` creates the tab without rendering (`render !== false`) |
| `pinned` | `boolean` | `false` | Passed to the `EditorFile`; a pinned tab is not closed by `file.remove()` |
| `reconnecting` | `boolean` | `false` | Suppresses the error alert dialog on failure (used by session restore) |
| `pid` | `string` | — | Attach to an existing AXS session instead of creating one. Only meaningful in server mode |

**Forwarded to xterm.js**

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `rows` | `number` | `24` | Initial size hint |
| `cols` | `number` | `80` | Initial size hint |
| `port` | `number` | `8767` | AXS HTTP/WebSocket port on `127.0.0.1`. Used for session create, resize and terminate |
| `renderer` | `string` | `"auto"` | `"auto"` and `"webgl"` both load `@xterm/addon-webgl` and silently fall back to canvas if WebGL fails; `"canvas"` never loads it |
| `theme` | `object` | app setting `"dark"` resolved | **Must be a theme object**, see below |
| `fontSize` | `number` | `12` | App terminal setting |
| `fontFamily` | `string` | `"MesloLGS NF Regular"` | App terminal setting |
| `fontWeight` | `string` | `"normal"` | App terminal setting |
| `cursorBlink` | `boolean` | `true` | App terminal setting |
| `cursorStyle` | `string` | `"block"` | App terminal setting |
| `cursorInactiveStyle` | `string` | `"outline"` | App terminal setting |
| `scrollback` | `number` | `1000` | App terminal setting |
| `tabStopWidth` | `number` | `4` | App terminal setting |
| `convertEol` | `boolean` | `true` | App terminal setting |
| `letterSpacing` | `number` | `0` | App terminal setting |
| `allowProposedApi` | `boolean` | `true` | xterm option |
| `scrollOnUserInput` | `boolean` | `true` | xterm option |

Any other xterm.js option (`overviewRuler`, `minimumContrastRatio`, `drawBoldTextInBrightColors`, …) is also passed straight through.

::: danger `theme` must be an object, not a name
The component resolves the app's theme setting **before** merging your options:

```js
this.options = {
  // ...
  theme: TerminalThemeManager.getTheme(terminalSettings.theme),
  // ...
  ...options,   // your `theme` wins
};
```

Because your options are spread **last**, `theme: 'dark'` replaces the resolved object with a plain string. Nothing re-resolves it afterwards — `mount()` then does `this.container.style.background = this.options.theme.background`, which is `undefined` for a string, and xterm receives a string where it expects a theme object. Always pass the object:

```js
const out = await terminal.createLocal({
  name: 'Plugin Output',
  theme: terminal.themes.get('nord'),
});
```

`component.updateTheme(nameOrObject)` is the one place that **does** accept a name string, because it explicitly calls `TerminalThemeManager.getTheme()` for strings.
:::

::: warning There is no PTY spawn options
Acode does **not** expose node-pty style spawn arguments. `args`, `cwd`, `env`, `term`, `type` and a caller-supplied `id` are **not** options. The PTY is created server-side by AXS with a fixed `POST /terminals` body of `{ cols, rows }` only. To run a different program, write it to a server terminal instead of trying to spawn it.
:::

### What is a "server terminal"? <Badge type="tip" text="new" />

A server terminal is a real interactive shell. In server mode the manager:

1. Checks `Terminal.isInstalled()` and `Terminal.isSupported()`, and if needed opens a **"Terminal Installation"** tab and streams the Alpine/AXS download + extraction log into it. Creation only continues if `Terminal.install()` resolves `true`.
2. Starts AXS if it is not already running (`Terminal.isAxsRunning()`), calls `Executor.setProotDebug(...)`, then polls `http://127.0.0.1:<port>/status` up to **20 times, 500 ms apart**, waiting for `OK`.
3. `POST /terminals` with `{ cols, rows }` to get a **PID**, which becomes the terminal id.
4. Opens `ws://127.0.0.1:<port>/terminals/<pid>`, attaches xterm's `AttachAddon`, and forwards keystrokes both ways.

Because it is a live PTY, `terminal.write(id, 'ls -la\r')` really does execute `ls -la`. This is why the module-level `write()` is filtered (see below), and it is exactly why `Executor` exists as a separate, unfiltered path for background work.

### Remote (SSH) terminals <Badge type="tip" text="new" />

`createTerminal()` accepts an internal `remoteSsh` option, which switches the transport from AXS WebSocket to the `sftp` native plugin's interactive shell:

```js
{
  remoteSsh: {
    profileId: 'profile-xxxx',      // must start with "profile-"
    displayName: 'my-server',       // shown as the tab subtitle
    initialDirectory: '/srv/app',   // optional; a `cd` is sent when it isn't "/"
  }
}
```

When `remoteSsh` is set: `component.pid` becomes `` `ssh:<sessionId>` ``, session data flows over `sftp.writeShell()` instead of a WebSocket, and Acode **ignores `port`**. The manager exposes a dedicated helper, `createRemoteTerminal(storage, options)`, which builds this from an SFTP storage URL, but that helper is **not** part of the `acode.require('terminal')` module — it is reachable only from inside Acode.

::: tip OSC 7777 is local-only
A remote SSH host can emit `\e]7777;open;file;/path\e\\`, but Acode ignores it when `remoteSsh` is set — a remote machine must not be able to ask for files on the Android device.
:::

### Return Value

All three create functions resolve to an instance object:

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | `component.pid` when the backend supplied one, otherwise a generated `terminal_1`, `terminal_2`, … |
| `name` | `string` | Tab/file name |
| `terminalNumber` | `number` | Ordinal used for the `Terminal N` tab prefix |
| `component` | `TerminalComponent` | The xterm.js wrapper — see [Terminal instance surface](#terminal-instance-surface) |
| `file` | `EditorFile` | EditorFile tab representing the terminal |
| `container` | `HTMLElement` | The `div.terminal-content` DOM element hosting the terminal |

The promise is rejected when creation fails (install failure, AXS not ready, unsupported architecture, WebSocket connect timeout of 5 s), after Acode has already disposed the component and force-removed the tab.

## Manage

```js
// Get a terminal by id
const t = terminal.get('terminal_1');

// Iterate all terminals
for (const [id, inst] of terminal.getAll()) {
  console.log(id, inst.name, inst.component.pid);
}

// Write text (ANSI supported). Needs \r to actually submit in server mode.
terminal.write('terminal_1', 'Hello World!\r\n');

// Clear and close
terminal.clear('terminal_1');
terminal.close('terminal_1');
```

### `get(id)`

Returns the instance object for `id`, or **`null`** when there is no such terminal (it is not `undefined`). Silently no-ops on `write`/`clear`/`close` for an unknown id.

### `getAll()`

Returns the manager's **live internal `Map`** keyed by terminal id — not a copy. Mutating it corrupts Acode's registry. Iterate it, don't write to it.

### `write(id, data)`

```js
terminal.write(id, 'plain output\r\n');
terminal.write(id, '\u001b[36mcyan\u001b[0m\r\n');
terminal.write(id, 'ls -la\r');       // server mode: actually executes
```

| Parameter | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Terminal id from `create*()` or `get(id).id` |
| `data` | `string` | **Must be a string.** Anything else is dropped with a console warning |

- **Returns: `undefined`.** It is fire-and-forget.
- In **server mode** the data is sent through the PTY's WebSocket, so it is *input*, not output.
- In **local mode** (or when the socket is not `OPEN`) it is handed straight to `terminal.write(data)`, i.e. rendered as output.
- It routes through a private security filter. See below.

> [!Note]
> `terminal.write()` is the only filtered path. `terminal.get(id).component.write(data)` calls `TerminalComponent.write()` **directly and bypasses every check** — the filter lives in the module wrapper, not in the component.

### The `write()` security filter <Badge type="tip" text="new" />

`acode.js` routes `terminal.write` through a private `#secureTerminalWrite(id, data)`. Every plugin-authored write passes these checks, in this order:

| # | Check | On failure |
| --- | --- | --- |
| 1 | `typeof data !== "string"` | `console.warn("Terminal write data must be a string")`, write dropped, returns `undefined` |
| 2 | 24 dangerous patterns — 23 anchored command lines plus the null-byte check (table below) | `console.warn("Blocked potentially dangerous terminal command: …")` + toast **`"Potentially dangerous command blocked for security"`** (3 s) |
| 3 | Command substitution: if the data contains both `$(` and `)`, every `$( … )` group is re-tested against the same 24 patterns | `console.warn("Blocked command substitution with dangerous content: …")` + toast **`"Command substitution blocked for security"`** (3 s) |
| 4 | `data.length > 64 * 1024` | `console.warn("Terminal write data truncated - exceeded 65536 characters")`, then the payload is cut to 65536 chars and **`"\n[Data truncated for security]\n"`** is appended |

Nothing is ever partially written: on a block the function returns before touching the terminal.

#### Blocked patterns

Every command pattern is anchored with `^ … $` **and the `m` flag**, so it must match a whole **line**. `rm -rf /` is blocked; `echo hi; rm -rf /` is **not** (the line does not start with `rm`), and `sudo rm -rf /data` is blocked by the `sudo rm -rf /` rule because `/data` still starts with `/`.

| # | Regex (as written in source) | Blocked example |
| --- | --- | --- |
| 1 | `/^\s*rm\s+-rf?\s+\/[^\r\n]*[\r\n]?$/m` | `rm -rf /` |
| 2 | `/^\s*rm\s+-rf?\s+\*[^\r\n]*[\r\n]?$/m` | `rm -rf *` |
| 3 | `/^\s*rm\s+-rf?\s+~[^\r\n]*[\r\n]?$/m` | `rm -rf ~` |
| 4 | `/^\s*mkfs\.[^\r\n]*[\r\n]?$/m` | `mkfs.ext4 /dev/block/sda` |
| 5 | `/^\s*dd\s+if=\/[^\r\n]*[\r\n]?$/m` | `dd if=/dev/zero of=/dev/sda` |
| 6 | `/^\s*:(){ :\|:& };:[^\r\n]*[\r\n]?$/m` | `:(){ :\|:& };:` (fork bomb) |
| 7 | `/^\s*sudo\s+dd\s+if=\/[^\r\n]*[\r\n]?$/m` | `sudo dd if=/dev/zero of=/dev/sda` |
| 8 | `/^\s*sudo\s+rm\s+-rf?\s+\/[^\r\n]*[\r\n]?$/m` | `sudo rm -rf /` |
| 9 | `/^\s*curl\s+[^\r\n]*\|\s*sh[^\r\n]*[\r\n]?$/m` | `curl -fsSL https://get.example.com/i.sh \| sh` |
| 10 | `/^\s*wget\s+[^\r\n]*\|\s*sh[^\r\n]*[\r\n]?$/m` | `wget -qO- https://get.example.com/i.sh \| sh` |
| 11 | `/^\s*bash\s+<\s*\([^\r\n]*[\r\n]?$/m` | `bash <(curl -s https://get.example.com/i.sh)` |
| 12 | `/^\s*sh\s+<\s*\([^\r\n]*[\r\n]?$/m` | `sh <(curl -s https://get.example.com/i.sh)` |
| 13 | `/^\s*nc\s+-l\s+-p\s+\d+[^\r\n]*[\r\n]?$/m` | `nc -l -p 4444` |
| 14 | `/^\s*ncat\s+-l\s+-p\s+\d+[^\r\n]*[\r\n]?$/m` | `ncat -l -p 4444` |
| 15 | `/^\s*python\s+.*SimpleHTTPServer[^\r\n]*[\r\n]?$/m` | `python -m SimpleHTTPServer 8000` |
| 16 | `/^\s*python\s+.*http\.server[^\r\n]*[\r\n]?$/m` | `python3 -m http.server` |
| 17 | `/^\s*kill\s+-9\s+1\s*[\r\n]?$/m` | `kill -9 1` |
| 18 | `/^\s*killall\s+-9\s+\*[^\r\n]*[\r\n]?$/m` | `killall -9 *` |
| 19 | `/^\s*chmod\s+777\s+\/[^\r\n]*[\r\n]?$/m` | `chmod 777 /` |
| 20 | `/^\s*chown\s+[^\s]+\s+\/[^\r\n]*[\r\n]?$/m` | `chown root /` |
| 21 | `/^\s*cat\s+\/etc\/passwd[^\r\n]*[\r\n]?$/m` | `cat /etc/passwd` |
| 22 | `/^\s*cat\s+\/etc\/shadow[^\r\n]*[\r\n]?$/m` | `cat /etc/shadow` |
| 23 | `/^\s*cat\s+\/root\/[^\r\n]*[\r\n]?$/m` | `cat /root/.bashrc` |
| 24 | `/\x00/g` | any payload containing a NUL byte |

::: tip The filter is a blocklist, not a sandbox
It is a **line-anchored blocklist**, so it is trivially bypassable. These all pass and still do the damage:

| Bypasses | Why |
| --- | --- |
| `rm -rf ${HOME}` | No literal `/` after `-rf`, and no `*` or `~` |
| `rm -fr /` | `-rf?` only matches `-r` / `-rf`, never `-fr` |
| `sudo sh -c 'rm -rf /'` | The `sudo rm -rf /` rule requires `sudo` immediately followed by `rm` |
| `$(echo rm -rf /)` | The substitution scan re-tests the whole `$( … )` group, and the group still does not *start* with `rm` |
| `nc -l 4444` | The netcat rules require the full `-l -p <port>` form |
| `curl -s url -o s.sh && sh s.sh` | The pipe-to-shell rules need a literal `\| sh` on the same line |
| `echo cm0=… \| base64 -d \| sh` | No `$`, no `-p`, and the first line does not start with `curl`/`wget` |

Do not treat `terminal.write()` as a security boundary for untrusted input. If you need to execute a command with attacker-controlled arguments, validate them yourself, or use a local (non-server) terminal, which has no PTY to attack at all.
:::

::: warning Null bytes and truncation are silent from the caller's side
Both a block and a truncation return `undefined`. The only signals are the console warning and the toast. If a plugin needs to know, keep its own length check before calling.
:::

### `clear(id)`

Calls `component.clear()` → `xterm.clear()`. Clears the viewport and the scrollback buffer. Returns `undefined`. No-op for an unknown id.

### `close(id)` <Badge type="tip" text="new" />

```js
terminal.close(instance.id); // disposes the session
instance.file.remove(true);  // ALSO removes the tab, if you want that
```

`terminal.close(id)` maps to `TerminalManager.closeTerminal(id)` where the second parameter `removeTab` **defaults to `false`**.

| What happens | |
| --- | --- |
| Sets `component.intentionalClose = true` | so the resulting socket close is not treated as a crash |
| Removes the persisted session record | only for non-remote server terminals |
| Disconnects the `ResizeObserver` and focus handlers | |
| Calls `component.dispose()` | terminates the PTY (`POST /terminals/<pid>/terminate`), disposes addons and xterm |
| Deletes the instance from the registry | |
| **Does not remove the editor tab** | you must call `instance.file.remove(true)` yourself |
| Calls `Executor.stopService()` when it was the last terminal | side effect worth knowing about |

**Returns `Promise<void>`.** To fully close a terminal from a plugin, call `close(id)` then `file.remove(true, { ignorePinned: true })`.

::: warning Do not reuse Acode's event callbacks
`TerminalManager.setupTerminalHandlers()` already assigns `component.onConnect`, `onDisconnect`, `onError`, `onTitleChange`, `onProcessExit` and `onOscOpen`. They are **single-assignment callback properties**, not an EventEmitter — assigning your own handler **overwrites** Acode's exit/disconnect cleanup and can leave a zombie tab with a dead PTY. If you need exit notifications, chain instead:

```js
const previous = instance.component.onProcessExit;
instance.component.onProcessExit = (data) => {
  previous.call(instance.component, data);
  // your logic here
};
```

For raw streaming, subscribe to the xterm instance instead — that *is* EventEmitter-style and returns a disposable:

```js
const sub = instance.component.terminal.onData((data) => { /* keystrokes */ });
sub.dispose();
```

The component's own `onConnect`/`onDisconnect`/`onError`/`onTitleChange`/`onBell`/`onProcessExit`/`onOscOpen` are declared as no-op prototype methods and are always overwritten by the manager right after `create*()` resolves.
:::

## Touch selection "More" options <Badge type="tip" text="new" />

`terminal.moreOptions` and `terminal.touchSelection.moreOptions` are **the same object literal** — pick either spelling. Options registered here appear in the sheet opened by the "More" row of Acode's terminal touch-selection context menu.

```js
const id = terminal.moreOptions.add({
  id: 'com.example.plugin.copy-cwd',
  label: 'Copy working directory',
  icon: 'content_copy',
  enabled: (ctx) => !!ctx.selection,
  action: async (ctx) => {
    // ctx.selection may be empty
  },
});

terminal.moreOptions.list();   // [{ id, label, icon, enabled, action }, …]
terminal.moreOptions.remove(id);
```

| Method | Signature | Returns |
| --- | --- | --- |
| `add` | `add(option) => string \| null` | The normalised id, or `null` if the option was rejected |
| `remove` | `remove(id) => boolean` | `true` if an option was deleted |
| `list` | `list() => Array<object>` | Shallow copies of every registered option |

### Option shape

| Key | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | `string \| (ctx) => string` | **Yes** | Aliases: `text`, `title`. A function is resolved at menu-open time; if it returns `""`/`null` the entry is hidden |
| `action` | `(ctx) => void \| Promise<void>` | **Yes** | Aliases: `onselect`, `onclick`. Awaited; a throw is caught, logged, and toasted as `Failed to execute action.` |
| `id` | `string` | No | Generated as `` `terminal_more_option_${n}` `` when omitted or empty. Re-using an id **replaces** the option |
| `icon` | `string` | No | Defaults to `null` |
| `enabled` | `boolean \| (ctx) => boolean` | No | Defaults to enabled. `false`/a function returning `false` greys the row out and blocks `action` |

### `action` context

| Field | Type | Description |
| --- | --- | --- |
| `terminal` | `Terminal` | The raw xterm instance |
| `touchSelection` | `TerminalTouchSelection` | The selection controller |
| `selection` | `string` | Current selection (falls back to `terminal.getSelection()`) |
| `clearSelection` | `() => void` | Force-clear the selection |
| `copySelection` | `() => void` | Copy selection to clipboard |
| `pasteFromClipboard` | `() => void` | Paste clipboard into the terminal |
| `selectAll` | `() => void` | Select all terminal text |

::: tip A built-in entry always exists
Acode pre-registers `__acode_terminal_select_all__` ("Select all"). It is returned by `list()` and is guaranteed to be present; you can add your own entries alongside it but you should not remove it.
:::

::: warning Nothing auto-cleans these
Touch-selection options are stored in a module-level `Map` with **no plugin scoping** — unlike themes, there is no `pluginId`. Remove your own options from `acode.setPluginUnmount(...)` or they will fire against the next version of your plugin.
:::

## Themes

Register custom themes or derive variants from existing ones. You can also query available themes.

```js
// Register — returns true on success, false on conflict or invalid shape
terminal.themes.register('myTheme', {
  background: '#1a1a1a', foreground: '#ffffff', cursor: '#ffffff', cursorAccent: '#1a1a1a',
  selectionBackground: '#ffffff40',
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

`register()` validates the theme and **refuses** it (returns `false`, logs the offending colour) unless all **18** of these keys are present and are strings:

- background, foreground, cursor
- black, red, green, yellow, blue, magenta, cyan, white
- brightBlack, brightRed, brightGreen, brightYellow, brightBlue, brightMagenta, brightCyan, brightWhite

::: tip `cursorAccent` and `selection` are optional
`cursorAccent`, `selectionBackground` / `selection`, `selectionForeground`, `selectionInactiveBackground`, `scrollbarSliderBackground`, `scrollbarSliderHoverBackground`, `scrollbarSliderActiveBackground` and `overviewRulerBorder` are **not** validated. For legacy themes written against older xterm.js, a `selection` key is automatically renamed to `selectionBackground` on registration and the original `selection` key is deleted.
:::

### Method reference

| Method | Signature | Behaviour |
| --- | --- | --- |
| `register` | `register(name, theme, pluginId) => boolean` | `false` if `name` collides with a **built-in** theme (logged as a conflict), `false` if validation fails. Otherwise stores `{ ...normalizedTheme, _pluginId: pluginId, _isPlugin: true }` and returns `true` |
| `unregister` | `unregister(name, pluginId) => boolean` | `false` if no such theme, `false` if `theme._pluginId !== pluginId`. This `pluginId` check is the **only** ownership scoping in the theme API |
| `get` | `get(name) => object` | Plugin themes first, then built-ins, then **falls back to the built-in `dark`** for unknown names — it never returns `undefined` |
| `getAll` | `getAll() => object` | Shallow merge of built-ins and plugin themes into a new object |
| `getNames` | `getNames() => string[]` | `Object.keys(getAll())` |
| `createVariant` | `createVariant(baseName, overrides) => object` | `{ ...getTheme(baseName), ...overrides }` |

Built-in names: `dark`, `light`, `solarizedDark`, `solarizedLight`, `monokai`, `dracula`, `nord`, `gruvbox`, `oneDark`, `material`, `tokyoNight`, `catppuccin`, `synthwave`, `cyberpunk`, `forest`, `sunset`, `ocean`, `glass`, `glassDark`.

::: warning `pluginId` is ownership metadata only
It is stamped onto the theme as `_pluginId` and checked by `unregister()`. It does **not** namespace the theme, does not prevent another plugin from reading it via `get()`, and does not auto-clean anything — `unregisterPluginThemes(pluginId)` exists on the manager but is never called from anywhere in Acode and is not exposed on `terminal.themes`. Call `terminal.themes.unregister(name, pluginId)` yourself from `acode.setPluginUnmount(id, ...)`.
:::

::: warning `createVariant` has no override allowlist
`createVariant` merges **any** key you pass. If the base is a **plugin** theme, the variant inherits its `_pluginId` and `_isPlugin` markers, so registering the variant under a new name carries the original plugin's ownership over to it — and `unregister(variantName, yourId)` will then fail. Variant a **built-in** theme, or strip the metadata, if you intend to register the result.
:::

::: tip Registering the same plugin name twice overwrites
The built-in collision check only looks at built-ins, so `register('myTheme', v1, 'p')` followed by `register('myTheme', v2, 'p')` silently replaces `v1`. Changing a plugin's `pluginId` between those calls will make the theme permanently un-unregisterable.
:::

## Terminal instance surface <Badge type="tip" text="new" />

`instance.component` is a `TerminalComponent`. These are the members you can rely on.

**Methods**

| Member | Signature | Notes |
| --- | --- | --- |
| `write` | `write(data)` | Remote SSH → `sftp.writeShell`; connected server → `websocket.send`; otherwise `terminal.write(data)`. **Unfiltered** |
| `writeln` | `writeln(data)` | Always `terminal.writeln(data)` — never goes to the PTY |
| `clear` | `clear()` | `terminal.clear()` |
| `focus` / `blur` | `focus()` / `blur()` | |
| `fit` | `fit()` | `FitAddon.fit()` |
| `fitAndResizeTerminal` | `fitAndResizeTerminal(forceServerSync = false)` | Fit, then sync dims to the PTY if they changed or if forced |
| `resizeTerminal` | `resizeTerminal(cols, rows, force = false)` | Skips duplicate `colsxrows` requests; server mode only |
| `search` | `search(term, skip, backward) => boolean` | Uses `SearchAddon.findNext` / `findPrevious` with the app's regex/whole-word/case settings. Returns `false` for an empty term. The `skip` argument is accepted but **never read** in the source — it always starts from the first match |
| `updateTheme` | `updateTheme(theme: object \| string)` | **Accepts a theme name string** and resolves it via the theme manager |
| `updateOptions` | `updateOptions(options)` | Writes keys onto both `terminal.options` and `this.options`; routes `theme` through `updateTheme` |
| `updateFontSize` | `updateFontSize(fontSize)` | Persists to `settings.terminalSettings.fontSize`, refreshes and re-fits. No-op if unchanged |
| `increaseFontSize` / `decreaseFontSize` | `()` | Clamped to 8–24 |
| `updateImageSupport` | `updateImageSupport(enabled)` | Loads/disposes `ImageAddon` |
| `updateFontLigatures` | `updateFontLigatures(enabled)` | Loads/disposes the ligatures addon |
| `updateScrollbarVisibility` | `updateScrollbarVisibility(visible)` | Toggles the scrollbar gutter via `overviewRuler.width` |
| `updateBackgroundColor` | `updateBackgroundColor()` | Syncs container + xterm background to the theme |
| `copySelection` / `pasteFromClipboard` | `()` | Clipboard helpers; silently no-op without `cordova.plugins.clipboard` |
| `mount` | `mount(container)` | Opens xterm, loads addons, first fit + focus |
| `createContainer` | `createContainer()` | Builds the `div.terminal-container` |
| `createSession` | `createSession() => Promise<string>` | Throws in local mode. Returns the new PTY pid |
| `connectToSession` | `connectToSession(pid?)` | Throws in local mode. Creates a session if `pid` is omitted. Rejects after a 5 s connect timeout |
| `terminate` | `terminate() => Promise<void>` | Closes the SSH shell or WebSocket, then `POST /terminals/<pid>/terminate`. Sets `intentionalClose` |
| `dispose` | `dispose()` | `terminate()` + dispose addons, xterm, listeners and remove the container |
| `handleOscOpen` | `handleOscOpen(type, path)` | Invokes `onOscOpen`; Acode's handler is a no-op for remote SSH |
| `loadTerminalFont` | `loadTerminalFont() => Promise<void>` | Injects + awaits the configured font |

**Properties**

| Property | Type | Notes |
| --- | --- | --- |
| `terminal` | `Terminal` (xterm) | Full xterm.js API. `onData` / `onResize` / `onTitleChange` / `onBell` return `{ dispose() }` |
| `pid` | `string \| null` | AXS pid, or `` `ssh:<sessionId>` `` for remote terminals |
| `isConnected` | `boolean` | |
| `serverMode` | `boolean` | |
| `remoteSsh` | `object \| null` | |
| `options` | `object` | The merged option set actually handed to xterm |
| `websocket` | `WebSocket \| null` | |
| `fitAddon`, `attachAddon`, `searchAddon`, `unicode11Addon`, `webLinksAddon`, `webglAddon`, `imageAddon`, `ligaturesAddon` | `object \| null` | Loaded conditionally |
| `touchSelection`, `touchScrolling` | `object \| null` | Mobile only, created after the first animation frame |
| `intentionalClose`, `processExited` | `boolean` | Lifecycle flags; read them before acting on `onDisconnect` |
| `container` | `HTMLElement` | |

**Event callbacks** (assignable properties, already claimed by Acode): `onConnect()`, `onDisconnect(info)`, `onError(error)`, `onTitleChange(title)`, `onBell()`, `onProcessExit(exitData)`, `onOscOpen(type, path)`.

- `onDisconnect` receives `{ intentional, processExited, code, reason }`.
- `onProcessExit` receives the AXS exit JSON (`{ exit_code, signal? }`) or `{ exit_code }` for SSH. Acode turns it into a toast such as `Process exited successfully (code 0)`.

## Behavior & Lifecycle

- Installation flow: When serverMode is true (default) and it is not a remote SSH terminal, the terminal checks `Terminal.isInstalled()` / `Terminal.isSupported()`. If missing, an installation terminal opens and streams progress. Creation proceeds only if `Terminal.install()` resolves `true`.
- IDs: If the backend provides a PID, it becomes the terminal id; otherwise a generated id like `terminal_1` is used. The counter is shared with installation terminals, which consume ids in the form `install_terminal_N`.
- Tab: Each terminal is an `EditorFile` tab with a `icon square-terminal` tab icon and a custom title (PID, SSH display name, or the terminal id). On process exit the tab closes and a toast shows the exit status.
- Session persistence: non-remote server terminals are stored in `localStorage` under `acodeTerminalSessions` as `{ pid, name, pinned }` and restored on next launch — but only while `Terminal.isAxsRunning()` reports the backend alive.
- Close confirmation: closing a tab asks for confirmation unless `settings.terminalSettings.confirmTabClose === false`. The forced removal inside `closeTerminal(id, true)` sets `_skipTerminalCloseConfirm`, but because `terminal.close(id)` passes `removeTab = false` it never reaches that path — a tab the user closes by hand after a plugin called `terminal.close(id)` still prompts.
- End-of-session convergence: process exit, unexpected disconnect and socket errors all funnel into one idempotent `finishTerminalSession()`, so a missed exit message cannot leave a zombie tab.

## Native Terminal Environment

Use the global `Terminal` object when you need to inspect or manage the underlying terminal runtime directly. It is clobbered onto `window.Terminal` by the terminal plugin.

| Method | Signature | Returns |
| --- | --- | --- |
| `isInstalled` | `isInstalled() => Promise<boolean>` | `true` when `alpine/`, `.downloaded`, `.extracted` and `.configured` all exist under the app files dir |
| `isSupported` | `isSupported() => Promise<boolean>` | `true` for `arm64-v8a`, `armeabi-v7a`, `x86_64` |
| `isAxsRunning` | `isAxsRunning() => Promise<boolean>` | Checks the pid file and `kill -0` |
| `install` | `install(logger?, err_logger?) => Promise<boolean>` | Runs the download/extract/configure pipeline; `false` on failure |
| `startAxs` | `startAxs(installing?, logger?, err_logger?, failsafe?) => Promise<boolean \| void>` | |
| `stopAxs` | `stopAxs() => Promise<void>` | `kill -KILL` on the pid file |
| `backup` | `backup() => Promise<string>` | Resolves the URI of `aterm_backup.tar` |
| `restore` | `restore() => Promise<string>` | Resolves `"ok"` |
| `uninstall` | `uninstall() => Promise<string>` | Resolves `"ok"`. Does **not** clean `$PREFIX` |
| `migrateLegacyHome` | `migrateLegacyHome() => Promise<void>` | One-shot migration of old `alpine/home` + `alpine/root` into `public/MIGRATE` |
| `formatError` | `formatError(error) => string` | Normalises cordova/Error/string payloads for display |

`lastInstallError` holds the most recent install failure message.

```js
if (globalThis.Terminal) {
  const installed = await Terminal.isInstalled();

  if (!installed) {
    console.log('Terminal environment is not installed yet.');
  }
}
```

This is useful when a plugin needs to decide whether it can use terminal-backed features before opening a server terminal. For normal terminal creation, prefer `terminal.create()` or `terminal.createServer()`, because they already run the install flow when needed.

::: danger Do not call `install()`, `uninstall()` or `restore()` from a plugin
These mutate the user's sandbox, wipe their files, and `install()` is called automatically by `createServer()`. Use them only in a dedicated settings screen, and never on plugin load.
:::

## Background Execution (No Terminal)

Use the globally available `Executor` to run shell commands without opening a visual terminal session - one-off commands, long-running processes with streaming output, and background-mode execution.

See [Executor](./executor.md).

## Gotchas <Badge type="tip" text="new" />

- **`create()` defaults to server mode.** Forgetting `serverMode: false` triggers the whole Alpine install/AXS startup flow. Use `createLocal()` for output panes.
- **`theme` must be an object**, not a name string. See [the note above](#create).
- **`write()` goes into the PTY in server mode.** Anything you write is *input*. Include `\r` to submit, or you are just typing into the prompt.
- **`write()` is filtered; `component.write()` is not.** The security filter is only on the module wrapper.
- **`terminal.close(id)` does not close the tab.** Follow it with `file.remove(true, { ignorePinned: true })`.
- **Do not overwrite `component.onProcessExit` / `onDisconnect` / `onError`.** You will break Acode's session teardown. Chain instead.
- **`getAll()` returns the live internal `Map`.** Read-only by convention.
- **`get(unknownId)` is `null`, and `write`/`clear`/`close` silently no-op** rather than throwing.
- **All theme and touch-selection registrations are global and unscoped except by `_pluginId`.** Nothing is cleaned up when your plugin unmounts.
- **Closing the last terminal calls `Executor.stopService()`**, which unbinds and stops `TerminalService`.
- **Font, cursor, scrollback and theme defaults come from `settings.terminalSettings`**, not from your options, unless you pass them explicitly. `updateFontSize()` also *persists* to app settings.
- **Touch selection and touch scrolling only initialise on mobile** (`window.cordova` present), after the first animation frame. Never assume `component.touchSelection` exists.
- **Server terminals are recoverable across app restarts.** A plugin-created server terminal can reappear after a reload. Untrack your ids accordingly.

## Example: Themed Output Terminal

```js
const terminal = acode.require('terminal');
const PLUGIN_ID = 'com.example.plugin';

// Ensure your theme exists (or use a built-in one)
terminal.themes.register(
  'cyberpunkCustom',
  { /* all 18 required colour keys */ },
  PLUGIN_ID,
);

// Create a local output terminal and log
const out = await terminal.createLocal({
  name: 'Plugin Output',
  theme: terminal.themes.get('cyberpunkCustom'),
});
terminal.write(out.id, '\u001b[36mPlugin initialized\u001b[0m\r\n');
```

## Complete plugin example <Badge type="tip" text="new" />

A runnable plugin that creates a local output terminal, sends a command to a server terminal, streams the result back, and cleans up on unmount.

```js
// main.js
if (window.acode) {
  const PLUGIN_ID = 'com.example.terminal-demo';
  const terminal = acode.require('terminal');
  const THEME_NAME = 'demoOutput';

  const THEME = {
    background: '#1a1a1a',
    foreground: '#f8f8f2',
    cursor: '#ff5555',
    cursorAccent: '#1a1a1a',
    selectionBackground: '#ffffff40',
    black: '#000000',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#44475a',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  };

  // Theme must be registered BEFORE create*, because the options object is
  // resolved once at construction time.
  terminal.themes.register(THEME_NAME, THEME, PLUGIN_ID);

  let outputTerminal = null;
  let serverTerminal = null;

  const write = (text, ansi = '') => {
    if (!outputTerminal) return;
    terminal.write(outputTerminal.id, `${ansi}${text}\u001b[0m\r\n`);
  };

  async function run() {
    // 1. A local pane to render our own log lines into.
    outputTerminal = await terminal.createLocal({
      name: 'Demo Output',
      theme: terminal.themes.get(THEME_NAME),
    });
    write('Local output terminal ready.', '\u001b[32m');

    // 2. A server terminal: a real Alpine shell behind a PTY.
    serverTerminal = await terminal.createServer({
      name: 'Demo Shell',
      theme: terminal.themes.get(THEME_NAME),
    });
    write(`Server terminal id: ${serverTerminal.id}`, '\u001b[36m');

    // 3. Subscribe to raw xterm events. This is EventEmitter-style and
    //    disposable, and does not clobber Acode's own callbacks.
    const subscription = serverTerminal.component.terminal.onData((data) => {
      if (data === '\r') write('[shell] user pressed Enter');
    });

    // 4. Chain Acode's exit hook instead of replacing it.
    const previousExit = serverTerminal.component.onProcessExit;
    serverTerminal.component.onProcessExit = function (data) {
      previousExit.call(this, data);
      write(`Shell exited: ${JSON.stringify(data)}`, '\u001b[31m');
      subscription.dispose();
    };

    // 5. Execute a command in the shell. \r submits it.
    terminal.write(serverTerminal.id, 'echo hello from a plugin\r');
    write('Command sent.', '\u001b[32m');
  }

  run().catch((error) => {
    write(`Failed: ${error?.message || error}`, '\u001b[31m');
  });

  // Touch selection: a "More" entry scoped to this plugin, removed on unmount.
  const moreOptionId = terminal.moreOptions.add({
    id: `${PLUGIN_ID}.report`,
    label: 'Report this terminal id',
    action: (ctx) => {
      console.log('Demo terminal:', serverTerminal?.id, 'selection:', ctx.selection);
    },
  });

  acode.setPluginUnmount(PLUGIN_ID, () => {
    terminal.moreOptions.remove(moreOptionId);
    terminal.themes.unregister(THEME_NAME, PLUGIN_ID);

    for (const instance of [serverTerminal, outputTerminal]) {
      if (!instance) continue;
      // close() disposes the session; file.remove() actually closes the tab.
      terminal.close(instance.id);
      instance.file.remove(true, { ignorePinned: true });
    }
  });
}
```

::: tip Use `Executor` instead when you do not need a tab
`terminal.write()` is filtered and drives a visible PTY. For a one-off command or a background process, [Executor](./executor.md) has no filter and no UI cost.
:::