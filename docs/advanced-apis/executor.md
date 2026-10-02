# Executor

The `Executor` API lets you run shell commands on the device without opening a visual terminal session. It supports one-off commands, long-running processes with real-time streaming, stdin writes, and background execution via a foreground service.

> [!Warning]
> Prefer visible terminals for transparency. Avoid hiding work in the background and do not start long‑running processes without good reason. For interactive or long‑lived tasks, use a [terminal session](./terminal.md) instead.

## Access

The global `Executor` is an `Executor` instance (clobbered to `window.Executor` by the terminal plugin). It has a built-in `BackgroundExecutor` instance for background-mode processes.

```js
const Executor = globalThis.Executor; // Executor instance
const background = Executor.BackgroundExecutor; // BackgroundExecutor instance
```

Both instances share the same **JavaScript** class — but they are backed by two different native plugins, so they do **not** support the same actions. See [The two instances are not identical](#the-two-instances-are-not-identical).

> [!NOTE]
> **Which executor should I use?**
>
> - Use the **background executor** (`Executor.BackgroundExecutor`) for **short-running commands**. It starts processes directly with no foreground service and no notification, so it is lighter, but Android can kill the process once the app leaves the foreground. Use it for quick, self-contained commands that finish in seconds.
> - Use the **foreground executor** (`Executor`) for **long-running commands**. Its processes run under a foreground service with a persistent notification, which keeps them alive while the app is in the background. This is the default mode; `moveToForeground()` / `moveToBackground()` switch it at runtime.

### `Executor` is **not** requirable <Badge type="tip" text="new" />

This is the single most common mistake with this API. **`acode.require("Executor")` returns `undefined`.**

| Access | Works? |
| --- | --- |
| `acode.require("Executor")` | ❌ returns `undefined` |
| `acode.require("executor")` | ❌ returns `undefined` |
| `window.Executor` | ✅ |
| `globalThis.Executor` | ✅ |
| Bare `Executor` | ✅ (same global, but shadow it with `const` and you lose it for nested code) |

Evidence:

- `Acode#define(name, module)` stores modules in a private `#modules` map keyed by `name.toLowerCase()`, and `require(module)` is a plain lookup in that map. **Nothing anywhere in `src/` calls `this.define("Executor", …)`** — the only terminal-adjacent registration is `this.define("terminal", terminalModule)`.
- `Executor` is instead a **Cordova clobber**. `src/plugins/terminal/plugin.xml` declares:

  ```xml
  <js-module name="Executor" src="www/Executor.js">
      <clobbers target="window.Executor" />
  </js-module>
  ```

  and `www/Executor.js` ends with `module.exports = executorInstance;`.
- Acode's own typings agree: `src/index.d.ts` declares `Executor` only as a global (`declare const Executor: Executor | undefined;` plus `declare global { var Executor: Executor | undefined; }`) — there is no `require(module: "Executor")` overload.

::: danger Always null-check it
`src/index.d.ts` types the global as `Executor | undefined`, and Acode itself guards before use (`if (typeof Executor === "undefined")`). Do the same, because a plugin can load before the Cordova clobber is applied:

```js
const executor = globalThis.Executor;
if (!executor) {
  acode.toast('Terminal plugin is not ready');
  return;
}
```
:::

::: warning Do not shadow the global
`const Executor = globalThis.Executor;` works, but any inner scope that also declares `Executor` silently changes which executor a nested call uses. Prefer `const exec = globalThis.Executor;` and pass it around.
:::

### The two instances are **not** identical <Badge type="tip" text="corrected" />

`Executor.BackgroundExecutor` is a **second, independent native plugin class**, not a mode flag. `BackgroundExecutor.java` only implements these actions:

`start`, `write`, `stop`, `exec`, `isRunning`, `listProcesses`, `listAllProcesses`, `killProcess`, `loadLibrary`, `setProotDebug`

Everything else falls into its `default:` branch and **rejects** with `"Unknown action: …"`. So:

| Method | `Executor` (foreground) | `Executor.BackgroundExecutor` |
| --- | --- | --- |
| `execute`, `start`, `write`, `stop`, `isRunning` | ✅ | ✅ |
| `listProcesses`, `listAllProcesses`, `killProcess` | ✅ | ✅ |
| `loadLibrary`, `setProotDebug` | action accepted, but `loadLibrary` always rejects | action accepted, but `loadLibrary` always rejects |
| `spawnStream` | ✅ (handled before service binding) | ❌ rejects, `"Unknown action: spawnStream"` |
| `moveToForeground`, `moveToBackground` | ✅ | ❌ rejects, `"Unknown action: moveToForeground"` |
| `stopService` | ✅ | ❌ rejects, `"Unknown action: stopService"` |

"Both instances share the same methods" is true of the **JavaScript** class (`Executor.js` gives both the same prototype) and false of the **native** side. Always call `spawnStream` and the three service-control methods on `Executor` only.

::: warning "Both instances share the same methods" is only half true
`Executor.js` builds both objects from the same class, so the methods exist in JS. But `Executor` and `BackgroundExecutor` are two different `CordovaPlugin` classes with different `switch` blocks. Calling a service-control method on the background instance **rejects**; it does not silently no-op.
:::

### Where commands actually run <Badge type="tip" text="new" />

Both executors delegate to the same `ProcessManager`, which does exactly this:

```java
String xcmd = useAlpine ? "source $PREFIX/init-sandbox.sh " + cmd : cmd;
ProcessBuilder builder = new ProcessBuilder("sh", "-c", xcmd);
```

- **Everything runs through `sh -c`.** There is no direct `execve`; your `command` string is always shell text.
- `alpine = true` prefixes `source $PREFIX/init-sandbox.sh ` to your command — the AXS/proot sandbox. `alpine = false` (the default) runs on the plain Android shell under the app's own UID.
- The environment is always seeded with `PREFIX` (app files dir), `NATIVE_DIR` (native library dir), `ANDROID_TZ`, and `FDROID`. When proot debug is on, `PROOT_VERBOSE=2` is added.
- `spawnStream()` is the exception: it runs `new ProcessBuilder(cmd)` with **no** environment setup and `redirectErrorStream(true)`, and its signature has no `alpine` parameter at all.

::: danger No plugin-declared permission gates any of this
`Executor` is part of the app's own Cordova build. Its `plugin.xml` declares `WAKE_LOCK`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE` and `POST_NOTIFICATIONS` into the **app** manifest — there is no runtime check against the calling plugin, and no manifest field a plugin can use to request it. Any plugin can spawn a shell. See [System](./system.md) for the same situation.
:::

## One-off execution

### `execute(command, alpine?)`

- Purpose: Runs a single shell command and waits for it to finish. Output is returned after the process exits (no live streaming of output).
- Parameters:
  - `command` (string): The command to run.
  - `alpine` (boolean, optional, default `false`): Run inside the Alpine sandbox when `true`; run in the Android environment when `false`.
- Returns: `Promise<string>`. Resolves with **trimmed stdout** when the exit code is `0`; **rejects** with trimmed stderr (or `"Command exited with code: N"` when stderr is empty) otherwise.

```js
// Outputting hello on stdout
Executor.execute('echo hello')
  .then(console.log)
  .catch(console.error);
```

or with `async/await`:

```js
const output = await Executor.execute('echo hello');
console.log(output);
```

> [!Warning]
> Do not run things like an infinite loop or a shell because `execute()` waits for the process to exit and a shell never exits on its own, avoid running those commands with this function.

::: tip `execute()` is not filtered
Unlike [`terminal.write()`](./terminal.md#the-write-security-filter), there is **no command blocklist** on `Executor.execute()`. It runs whatever you pass. Validate any user- or file-derived arguments yourself before interpolating them.
:::

## Long-running processes

### `start(command, onData, alpine?)`

- Starts a shell process and enables real-time streaming of `stdout`, `stderr`, and `exit`.
- Parameters:
  - `command` (string): The command to run (e.g. `"sh"`, `"ls -al"`).
  - `onData` (function): `(type, data) => void`. `type` is `"stdout"`, `"stderr"`, or `"exit"` (the process exit code); `data` is the output **line** or exit code. A frame that does not parse as `^([^:]+):(.*)$` is delivered as `("unknown", message)`.
  - `alpine` (boolean, optional, default `false`): Run inside the Alpine sandbox when `true`.
- Returns: `Promise<string>` resolving to a unique process UUID used by `write()`, `stop()`, and `isRunning()`.

```js
const uuid = await Executor.start("sh", (type, data) => {
  console.log(`[${type}] ${data}`);
});
await Executor.write(uuid, "echo Hello World\r");
await Executor.stop(uuid);
```

The UUID is delivered as the **first** native callback, before any output, and the promise is resolved with it. `stdout`/`stderr` arrive **line by line** (`StreamHandler.streamOutput` reads with a `BufferedReader`), so partial lines are never delivered, but a single line has no size cap. There is no backpressure and no ring buffer: a chatty process will call `onData` thousands of times, and every call crosses the Cordova bridge.

### `write(uuid, input)`

Sends input to a running process's stdin.

- Returns: `Promise<string>` resolving with `"Written to process"`. **Rejects** with `"Process not found or closed"` if the uuid is unknown (background executor), or `"Write error: …"` on an `IOException`.

```js
await Executor.write(uuid, "ls /sdcard\r");
```

### `stop(uuid)`

Terminates a running process.

- Returns: `Promise<string>` resolving with `"Process terminated"`. The background executor kills the whole **process group** (`kill -9 -<pid>`) and then `destroy()`s the `Process`, so children die too. Rejects with `"No such process"` for an unknown uuid.

### `isRunning(uuid)`

Checks whether a process is still running.

- Returns: `Promise<boolean>`. The native side answers `"running"`, `"exited"`/`"stopped"`, or `"not_found"`; the JS wrapper collapses all three non-`"running"` answers to **`false`**, so you cannot distinguish "finished" from "never existed".

```js
if (await Executor.isRunning(uuid)) {
  await Executor.stop(uuid);
}
```

### `spawnStream(cmd, callback, onError?)`

Spawns a process and exposes it as a raw WebSocket stream. Once the process is ready the callback is invoked with the connected `WebSocket`; use `ws.send()` to write to stdin and `ws.onmessage` to read stdout.

- Parameters:
  - `cmd` (string[]): Command and arguments (e.g. `["sh", "-c", "echo hi"]`).
  - `callback` (function): `(ws) => void`.
  - `onError` (function, optional): error handler.
- Returns: **`undefined`** — this method is callback-only and wraps no promise. It resolves an ephemeral local port internally and connects to `ws://127.0.0.1:<port>`.

```js
Executor.spawnStream(
  ["sh", "-c", "while read l; do echo \"got: $l\"; done"],
  (ws) => {
    ws.send("hello\n");   // message frames are forwarded to stdin
  },
  (err) => console.error(err),
);
```

::: warning `spawnStream()` is foreground-executor only and behaves differently
- Native `BackgroundExecutor` has no `spawn` case → it rejects with `"Unknown action: spawnStream"`.
- It uses `new ProcessBuilder(cmd)` directly, so **no** `sh -c`, **no** Acode environment (`PREFIX`, `NATIVE_DIR`, `FDROID`, … are absent) and **no** `alpine` option whatsoever. Put `-c` in `cmd` yourself if you need a shell.
- `redirectErrorStream(true)` means **stderr is merged into the same stream**; you cannot separate them.
- Frames are binary `ArrayBuffer` chunks (`ws.binaryType = "arraybuffer"`), truncated at the server's 8 KB buffer. Chunk boundaries are arbitrary and may split UTF-8 sequences.
- Closing the socket destroys the process (`onClose` → `process.destroy()`).
:::

## Managing processes

### `listProcesses()`

Lists the processes currently managed by this Executor.

- Returns: `Promise<Array<{ id, command, alpine, startedAt, pid, background }>>`. `background` is added by the JS wrapper and is `true` for a `BackgroundExecutor`. `pid` is the real OS pid; `startedAt` is a `Date.now()` timestamp.
- Only **live** processes are listed — dead ones are skipped, so the list changes without any event.
- The foreground `Executor` returns an **empty array immediately** when its service is not yet bound, rather than starting the service.

```js
for (const p of await Executor.listProcesses()) {
  console.log(p.background ? 'bg' : 'fg', p.id, p.pid, p.command);
}
```

### `listAllProcesses()`

Lists all running OS processes under the app's user id.

- Returns: `Promise<Array<{ pid, ppid, name, command, state, memory, isSelf, startedAt }>>`, read straight from `/proc`. `memory` is `VmRSS` **in kB**, `ppid` is `-1` when unreadable, and `startedAt` is the `/proc/<pid>` directory mtime (not a real start time). Processes owned by other UIDs are filtered out; unreadable ones are skipped.

### `killProcess(pid)`

Forcefully kills a process by its native PID.

- Returns: `Promise<string>` resolving with `"Process terminated"`.
- Runs `kill -9 <pid>` as a separate process and **rejects** with `Failed to kill process: …` if `kill` exits non-zero — so killing a pid you do not own is an error, not a silent no-op.

## Service control

### `moveToForeground()` / `moveToBackground()`

Moves the `Executor` service between foreground (shows the notification) and background.

- Returns: `Promise<string>` — `"Service moved to foreground mode"` / `"Service moved to background mode"`.
- **Foreground executor only.** `Executor.BackgroundExecutor` rejects with `"Unknown action: …"`.

### `stopService()`

Stops the `Executor` service completely. This does **not** guarantee that all running processes are killed - the service just stops being active. The processes will keep running until stopped.

- Returns: `Promise<string>` resolving with `"Service stopped"`.
- Unbinds the service, calls `context.stopService(TerminalService)`, and clears the cached messenger.
- **Foreground executor only.** `Executor.BackgroundExecutor` rejects with `"Unknown action: stopService"`.

::: warning `terminal.close()` calls this for you
`TerminalManager.closeTerminal()` calls `Executor.stopService()` whenever the last terminal goes away. If your plugin is holding a long-lived `Executor` process, closing the user's terminal will drop the service out from under it.
:::

## Advanced

### `loadLibrary(path)`

Loads a native library from the given path.

- Returns: a rejected `Promise` — always.

> [!Warning]
> `loadLibrary()` has been deprecated and is no longer supported on newer Acode versions.

::: danger It does not "do nothing" — it rejects
Both native classes short-circuit the action with an error and no `System.load` at all:

```
This feature is no longer supported. Loading native libraries directly from
JavaScript is no longer allowed due to security reasons.
```

Do not call it, and do not wrap it in `try/catch` expecting a fallback.
:::

### `setProotDebug(enabled)`

Toggles proot debug output (used for the Alpine sandbox). Sets the **static** `ProcessManager.prootDebug` flag, which is shared by both executors and controls `PROOT_VERBOSE=2` in every subsequently spawned process.

- Returns: `Promise<string>` — `"PRoot debug enabled"` / `"PRoot debug disabled"`.
- Acode manages this from `settings.terminalSettings.prootDebug`; it calls it on **both** instances whenever AXS is (re)started, so any value you set is overwritten the next time a server terminal is created.

## Gotchas <Badge type="tip" text="new" />

- `acode.require("Executor")` is `undefined`. Use `globalThis.Executor` and null-check it.
- `Executor.BackgroundExecutor` is a different native plugin: no `spawnStream`, no `moveToForeground`/`moveToBackground`, no `stopService`. Those calls reject.
- Everything runs as `sh -c <command>`; `alpine: true` prepends `source $PREFIX/init-sandbox.sh `. There is no argv-array API except `spawnStream`.
- There is **no** security filter here. `terminal.write()` blocks 23 dangerous line patterns; `execute()` does not.
- `execute()` trims stdout and rejects on **any** non-zero exit code — a `grep` that legitimately finds nothing will reject.
- `isRunning()` cannot distinguish "exited" from "not_found"; both are `false`.
- `start()` streams by line, uncapped and without backpressure.
- Foreground `listProcesses()` returns `[]` (not a pending promise) while the service is unbound.
- `loadLibrary()` always rejects.
- `setProotDebug()` is global and gets reset by Acode's terminal startup.
- `stopService()` can be triggered by Acode itself when the last terminal closes.
- `POST_NOTIFICATIONS` is requested by the native `Executor` plugin's own `initialize()` at app startup — not by your code, and not something you can suppress.

## Related APIs

- Visual terminal sessions: [Terminal](./terminal.md)
- Low-level device bridge (`window.system`): [System](./system.md)