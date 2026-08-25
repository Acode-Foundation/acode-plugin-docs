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

Both instances share the same methods.

## One-off execution

### `execute(command, alpine?)`

- Purpose: Runs a single shell command and waits for it to finish. Output is returned after the process exits (no live streaming of output).
- Parameters:
  - `command` (string): The command to run.
  - `alpine` (boolean, optional): Run inside the Alpine sandbox when `true`; run in the Android environment when `false`.
- Returns: `Promise<string>` that resolves with stdout on success, or rejects with an error/stderr on failure.

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

## Long-running processes

### `start(command, onData, alpine?)`

- Starts a shell process and enables real-time streaming of `stdout`, `stderr`, and `exit`.
- Parameters:
  - `command` (string): The command to run (e.g. `"sh"`, `"ls -al"`).
  - `onData` (function): `(type, data) => void`. `type` is `"stdout"`, `"stderr"`, or `"exit"` (the process exit code); `data` is the output line or exit code.
  - `alpine` (boolean, optional): Run inside the Alpine sandbox when `true`.
- Returns: `Promise<string>` resolving to a unique process UUID used by `write()`, `stop()`, and `isRunning()`.

```js
const uuid = await Executor.start("sh", (type, data) => {
  console.log(`[${type}] ${data}`);
});
Executor.write(uuid, "echo Hello World\r");
Executor.stop(uuid);
```

### `write(uuid, input)`

Sends input to a running process's stdin.

- Returns: `Promise<string>`.

```js
await Executor.write(uuid, "ls /sdcard\r");
```

### `stop(uuid)`

Terminates a running process.

- Returns: `Promise<string>`.

### `isRunning(uuid)`

Checks whether a process is still running.

- Returns: `Promise<boolean>`.

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

## Managing processes

### `listProcesses()`

Lists the processes currently managed by this Executor.

- Returns: `Promise<Array<{ id, command, alpine, startedAt, background }>>`. `background` is `true` for a `BackgroundExecutor`.

### `listAllProcesses()`

Lists all running OS processes under the app's user id.

- Returns: `Promise<Array<{ pid, ppid, name, command, state, memory, isSelf }>>`.

### `killProcess(pid)`

Forcefully kills a process by its native PID.

- Returns: `Promise<string>`.

## Service control

### `moveToForeground()` / `moveToBackground()`

Moves the Executor service between foreground (shows the notification) and background.

- Returns: `Promise<string>`.

### `stopService()`

Stops the Executor service completely. This does **not** guarantee that all running processes are killed - the service just stops being active. The processes will keep running until stopped.

- Returns: `Promise<string>`.

## Advanced

### `loadLibrary(path)`

Loads a native library from the given path.

- Returns: `Promise<string>`.

```js
await Executor.loadLibrary('/path/to/library.so');
```

> [!Warning]
> `loadLibrary()` has been deprecated and is no longer supported on newer Acode versions.

### `setProotDebug(enabled)`

Toggles proot debug output (used for the Alpine sandbox).

- Returns: `Promise<string>`.

## Related APIs

- Visual terminal sessions: [Terminal](./terminal.md)
