# LSP API

Use the LSP API to register language servers for Acode's CodeMirror LSP integration.

```js
const lsp = acode.require("lsp");
```

Verified against Acode **v1.13.5** (versionCode `1011`): `src/cm/lsp/api.ts`, `src/cm/lsp/providerUtils.ts`, `src/cm/lsp/serverRegistry.ts`, `src/cm/lsp/serverCatalog.ts`, `src/cm/lsp/runtimeProviders.ts`, `src/cm/lsp/types.ts`, `src/cm/lsp/workerTransport.ts`, plus `src/lib/acode.js` (lines 247–253), which is where the module is assembled.

## API Overview

`acode.require("lsp")` is **not** the raw `lspApi` default export. `src/lib/acode.js` builds it as a spread plus one extra namespace:

```js
// src/lib/acode.js:247
const lspModule = {
  ...lspApi,
  clientManager: {
    setOptions: (options) => lspClientManager.setOptions(options),
    getActiveClients: () => lspClientManager.getActiveClients(),
  },
};
```

So the module has exactly these keys:

| Key | Type | Signature |
| --- | --- | --- |
| `defineServer` | `function` | `defineServer(options: ManagedServerOptions): LspServerManifest` |
| `defineBundle` | `function` | `defineBundle(options: { id, label?, servers, hooks? }): LspServerBundle` |
| `register` | `function` | `register(entry, options?: { replace?: boolean }): LspServerDefinition \| LspServerBundle` |
| `upsert` | `function` | `upsert(entry): LspServerDefinition \| LspServerBundle` |
| `installers` | `object` | `apk` / `npm` / `pip` / `cargo` / `manual` / `shell` / `githubRelease` |
| `servers` | `object` | `get`, `list`, `listForLanguage`, `update`, `unregister`, `onChange` |
| `bundles` | `object` | `list`, `getForServer`, `unregister` |
| `runtimes` | `object` | `register`, `unregister`, `get`, `list`, `select` |
| `workers` | `object` | `createTransport(options): TransportHandle` |
| `registerRuntimeProvider` | `function` | Alias of `runtimes.register` |
| `unregisterRuntimeProvider` | `function` | Alias of `runtimes.unregister` |
| `clientManager` | `object` | `setOptions(options)`, `getActiveClients()` |

::: warning `runtimes.select` is the only `async` member
`runtimes.select(server, context?)` returns a `Promise` (`selectRuntimeProvider` is `async`). Every other method on the module is synchronous — `register()`, `upsert()`, `servers.*`, `bundles.*`, `runtimes.register/unregister/get/list`, `workers.createTransport()` and both `clientManager` methods return their value directly, not a promise.
:::

`clientManager` is intentionally tiny. Acode's own LSP plumbing (`diagnostics.ts`, `codeActions.ts`, `formatter.ts`, `definition.ts`, `rename.ts`, `references.ts`, `documentSymbols.ts`, `documentColors.ts`, `inlayHints.ts`, `logs.ts`) is exported from `src/cm/lsp/index.ts` for internal use only and is **not** reachable from `acode.require("lsp")`. There is no `lsp.formatDocument()`, no `lsp.getLspDiagnostics()` and no `lsp.addLspLog()` in the plugin surface.

Most plugins should use `defineServer()` plus `upsert()`. Use a custom runtime when the server does not run through the built-in Alpine/AXS path (for example a plugin-bundled Web Worker).

## Server Setup

This is the recommended shape for a plugin that contributes one local language server. `defineServer()` turns `command`, `args`, and `installer` into the internal `launcher` configuration that Acode uses to start the server through its AXS WebSocket bridge.

```js
const lsp = acode.require("lsp");

const server = lsp.defineServer({
  id: "typescript-custom",
  label: "TypeScript (Custom)",
  languages: [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "jsx",
    "tsx",
  ],
  useWorkspaceFolders: true,
  command: "typescript-language-server",
  args: ["--stdio"],
  checkCommand: "command -v typescript-language-server",
  installer: lsp.installers.npm({
    executable: "typescript-language-server",
    packages: ["typescript", "typescript-language-server"],
  }),
  initializationOptions: {
    provideFormatter: true,
  },
});

lsp.upsert(server);
```

`upsert()` is preferred during plugin startup because it replaces an existing definition with the same id instead of throwing.

## Transport Model

Acode's CodeMirror LSP client talks to language servers through a transport object. In practice, local stdio servers are normally proxied through AXS and reached by WebSocket.

- `transport.kind: "websocket"` connects to a WebSocket URL or to an auto-discovered AXS bridge port.
- `transport.kind: "stdio"` is not a direct editor-to-process pipe. It still resolves through the WebSocket transport layer and needs a bridge URL or a runtime-provided dynamic port.
- `transport.kind: "external"` is for custom transport factories and runtime-provided handles (for example Web Worker language services).

::: warning
Do not register a plain stdio process and expect Acode to pipe directly to it from the editor. For local servers, use `defineServer()` with `command` and `args`, or provide a `launcher.bridge` manually.
:::

## Remote WebSocket Server

Use a raw manifest when the language server is already running and exposes a WebSocket endpoint.

```js
const lsp = acode.require("lsp");

lsp.upsert({
  id: "remote-json",
  label: "Remote JSON",
  languages: ["json"],
  enabled: true,
  transport: {
    kind: "websocket",
    url: "ws://127.0.0.1:2087/",
    options: {
      timeout: 5000,
      binary: true,
    },
  },
});
```

This is managed by Acode's built-in external WebSocket runtime. Install and update actions are not available for this shape because the server is externally managed.

## Structured Installers

Structured installers describe how Acode can install or update the executable for a local server.

Available helpers (each returns a plain `LauncherInstallConfig` object with `kind` and a default `source`):

| Helper | Required options | Optional options |
| --- | --- | --- |
| `lsp.installers.apk(options)` | `packages`, `executable` | `label`, `source` (default `"apk"`) |
| `lsp.installers.npm(options)` | `packages`, `executable` | `label`, `source` (default `"npm"`), `global` |
| `lsp.installers.pip(options)` | `packages`, `executable` | `label`, `source` (default `"pip"`), `breakSystemPackages` |
| `lsp.installers.cargo(options)` | `packages`, `executable` | `label`, `source` (default `"cargo"`) |
| `lsp.installers.manual(options)` | `binaryPath` | `executable` (defaults to `binaryPath`), `label`, `source` (default `"manual"`) |
| `lsp.installers.shell(options)` | `command`, `executable` | `updateCommand`, `uninstallCommand`, `label`, `source` (default `"custom"`) |
| `lsp.installers.githubRelease(options)` | `repo`, `binaryPath`, `assetNames` | `executable` (defaults to `binaryPath`), `extractFile`, `archiveType` (`"zip"` \| `"binary"`), `label`, `source` (default `"github-release"`) |

::: warning Every non-`shell` installer must name its executable
`sanitizeDefinition()` throws `LSP server <id> managed installers must declare install.binaryPath or install.executable` for any `install.kind` other than `shell` when neither field is present. Passing `executable: ""` or `undefined` fails the same check — the value is `.trim()`-tested.
:::

Example:

```js
const pythonServer = lsp.defineServer({
  id: "python-pylsp",
  label: "Python (pylsp)",
  languages: ["python"],
  command: "pylsp",
  args: [],
  checkCommand: "command -v pylsp",
  installer: lsp.installers.pip({
    executable: "pylsp",
    packages: ["python-lsp-server[all]"],
  }),
});

lsp.upsert(pythonServer);
```

Notes:

- Managed installers should declare the executable they provide — it is mandatory, not advisory.
- `githubRelease()` is intended for architecture-specific downloaded binaries. `archiveType` is coerced: anything other than `"binary"` becomes `"zip"`.
- `manual()` is useful when the binary already exists at a known path.
- `shell()` is the advanced fallback when no structured installer fits. It is the one kind exempt from the registry's "must declare `binaryPath` or `executable`" check, although `executable` is still a required constructor argument.
- `installers.*` helpers only build data. Acode's own installer runner lives in `src/cm/lsp/installerUtils.ts`, `installRuntime.ts` and `runtimeActions.ts` and is not exposed to plugins.

## Bundles

Use a bundle when one plugin contributes multiple related servers or owns shared install logic.

```js
const lsp = acode.require("lsp");

const htmlServer = lsp.defineServer({
  id: "my-html",
  label: "HTML",
  languages: ["html"],
  command: "vscode-html-language-server",
  args: ["--stdio"],
  installer: lsp.installers.npm({
    executable: "vscode-html-language-server",
    packages: ["vscode-langservers-extracted"],
  }),
});

const cssServer = lsp.defineServer({
  id: "my-css",
  label: "CSS",
  languages: ["css", "scss", "less"],
  command: "vscode-css-language-server",
  args: ["--stdio"],
  installer: lsp.installers.npm({
    executable: "vscode-css-language-server",
    packages: ["vscode-langservers-extracted"],
  }),
});

lsp.upsert(
  lsp.defineBundle({
    id: "my-web-tools",
    label: "Web Tools",
    servers: [htmlServer, cssServer],
  }),
);
```

### Bundle Hooks

Bundles can also provide behavior for their servers.

```js
const bundle = lsp.defineBundle({
  id: "my-toolchain",
  label: "My Toolchain",
  servers: [htmlServer, cssServer],
  hooks: {
    getExecutable(serverId, manifest) {
      return manifest.launcher?.install?.binaryPath
        || manifest.launcher?.install?.executable
        || null;
    },
    async checkInstallation(serverId, manifest) {
      return {
        status: "present",
        version: null,
        canInstall: true,
        canUpdate: true,
      };
    },
    async installServer(serverId, manifest, mode) {
      console.log("install", serverId, mode);
      return true;
    },
  },
});

lsp.upsert(bundle);
```

Supported hooks (this is the complete `BundleHooks` interface, spread onto the bundle by `defineBundle()`):

| Hook | Signature |
| --- | --- |
| `getExecutable` | `(serverId: string, manifest: LspServerManifest) => string \| null \| undefined` |
| `checkInstallation` | `(serverId, manifest) => Promise<InstallCheckResult \| null \| undefined>` |
| `installServer` | `(serverId, manifest, mode: "install" \| "update" \| "reinstall", options?: { promptConfirm?: boolean }) => Promise<boolean>` |

`InstallCheckResult` is `{ status: "present" \| "missing" \| "failed" \| "unknown", version?: string \| null, canInstall: boolean, canUpdate: boolean, message?: string }`.

::: tip `uninstallServer` is a fourth hook on the type, but not on `defineBundle()`
`LspServerBundle` in `types.ts` declares `uninstallServer(serverId, manifest, options?)`, yet `BundleHooks` (the type of `defineBundle`'s `hooks` argument) omits it. Because `defineBundle()` does `return { id, label, getServers: () => servers, ...hooks }`, an `uninstallServer` key you pass through is still copied onto the bundle and is still found by the type — TypeScript just will not autocomplete it.
:::

`lsp.bundles.getForServer(serverId)` resolves through this bundle's `getServers()`, so a bundle is also the unit of ownership: registering a second bundle that contains a server the first bundle owns requires `replace: true`.

## URI Translation

Use `rootUri` and `documentUri` when the language server sees a different filesystem layout than Acode.

Common cases:

- The server runs in Termux.
- The server runs behind a remote bridge.
- Acode opens a file as `content://...`, but the server expects `file://...`.
- The default cache-file fallback is not the project path that the server should analyze.

`rootUri(uri, context)` controls the workspace root sent during initialization and workspace-folder handling.

`documentUri(uri, context)` controls the URI used for opened documents, changes, formatting, and other file-scoped requests. Its context includes `normalizedUri`, which is Acode's default normalized URI.

Both hooks may return a string, `null`, or a promise.

```js
const lsp = acode.require("lsp");

function toTermuxUri(uri, fallbackUri) {
  if (typeof uri !== "string") return fallbackUri || null;

  if (uri.startsWith("file:///storage/emulated/0/")) {
    return uri.replace(
      "file:///storage/emulated/0/",
      "file:///data/data/com.termux/files/home/storage/shared/",
    );
  }

  return fallbackUri || uri;
}

const server = lsp.defineServer({
  id: "termux-typescript",
  label: "TypeScript (Termux bridge)",
  languages: ["javascript", "typescript", "jsx", "tsx"],
  useWorkspaceFolders: true,
  transport: {
    kind: "websocket",
    url: "ws://127.0.0.1:2087/",
  },
  rootUri(uri, context) {
    return toTermuxUri(context.rootUri || uri, context.rootUri || null);
  },
  documentUri(uri, context) {
    return toTermuxUri(uri, context.normalizedUri);
  },
});

lsp.upsert(server);
```

## Runtime Providers

A runtime provider decides where and how a server runs. Built-in Acode servers normally use the built-in Alpine runtime for terminal-accessible files. A plugin can register its own runtime for cases such as a plugin-managed distro, Termux, or another external process manager.

Runtime providers are advanced API. If your plugin only registers a normal local server, use `defineServer()`.

Runtime selection has **three** gates, in this order (`src/cm/lsp/runtimeProviders.ts`, `selectRuntimeProvider`):

1. **User setting override.** `settings.lsp.runtime.default`, `settings.lsp.runtime.servers[serverId]` and `settings.lsp.runtime.workspaces[pathPrefix]` are consulted first (longest matching workspace prefix wins). A configured id that is not `auto` is tried on its own; if its `canHandle()` returns falsy the app logs a warning and **falls through** to the automatic scan.
2. **`server.runtimes`,** when present, limits which provider ids are allowed for that server. Provider ids are compared lowercased.
3. **`provider.canHandle(server, context)`,** in descending `priority` order (ties broken by `id.localeCompare`). The first provider that returns a truthy value wins; a provider that throws is skipped with a console warning.

Acode derives `context.workspaceKind` from the current URI/root via `inferWorkspaceKind()`. The declared `WorkspaceKind` type is `"app-private"`, `"builtin-alpine"`, `"termux-saf"`, `"saf"`, `"remote"`, `"proot-distro"`, `"virtual"` or `"unknown"` — but note that `inferWorkspaceKind()` in v1.13.5 can only ever produce `unknown`, `app-private`, `virtual`, `remote`, `builtin-alpine`, `termux-saf` and `saf`. `proot-distro` exists in the type only.

### Built-in providers vs. bundled providers <Badge type="tip" text="new" />

Acode registers exactly three runtime providers at module load, and it does so with `replace: true` (`src/cm/lsp/runtimes/registerBuiltins.ts`):

| Id | `label` | `priority` | What it actually does |
| --- | --- | --- | --- |
| `web-worker` | `Built-in Web Worker` | `100` | Serves the four bundled servers (`html`, `css`, `json`, `typescript`) from `build/*LspWorker.js`. `canHandle()` returns true only for those exact ids. `checkInstallation()` reports `{ status: "present", version: "bundled", canInstall: false, canUpdate: false }`. |
| `external-websocket` | `External WebSocket` | `-50` | Connects to `server.transport.url` when the transport kind is `websocket` **and** a `url` is present. `checkInstallation()` reports `{ status: "unknown", canInstall: false, canUpdate: false }`. |
| `builtin-alpine` | `Built-in Alpine` | `-100` | Starts the server through Acode's own terminal/AXS bridge (`ensureServerRunning`) and hands back a `TransportHandle`. `checkInstallation()` delegates to `checkServerInstallation(server)`, and `install()` refuses with a "Terminal not installed" prompt when the Terminal plugin is missing. |

::: warning `registerRuntimeProvider` throws on a duplicate id
`runtimes.register(provider)` calls `registerRuntimeProvider(provider)` with **no** options object, so the internal `{ replace: true }` escape hatch is not reachable through `acode.require("lsp")`. Registering an id twice throws `LSP runtime provider <id> is already registered`. Always `unregisterRuntimeProvider(id)` first when reloading during development.
:::

The bundled web-worker servers are declared in `src/cm/lsp/servers/`. Their ids are `html`, `css`, `json`, `typescript`, `html-stdio`, `css-stdio`, `json-stdio`, `typescript-native`, `vtsls`, `eslint`, `ty`, `python`, `clangd`, `gopls`, `rust-analyzer`, `tailwindcss` and `luau`, grouped into the bundles `builtin-javascript`, `builtin-python`, `builtin-luau`, `builtin-web`, `builtin-systems` and `builtin-tailwindcss`. Register your own ids instead of replacing these.

### Register a Runtime Provider

Runtime provider ids must be unique. If your plugin can be reloaded during development, unregister the old provider before registering it again.

```js
const lsp = acode.require("lsp");

lsp.unregisterRuntimeProvider("termux");

lsp.registerRuntimeProvider({
  id: "termux",
  label: "Termux",
  priority: 10,

  canHandle(server, context) {
    const isTermuxServer = server.runtimes?.includes("termux");
    const isTermuxWorkspace = context.workspaceKind === "termux-saf"
      || /termux/i.test(context.rootUri || context.uri || "");

    return isTermuxServer && isTermuxWorkspace;
  },

  async checkInstallation(server, context) {
    // Check inside Termux whether the server executable exists.
    return {
      status: "present",
      version: null,
      canInstall: true,
      canUpdate: true,
    };
  },

  async install(server, context, mode) {
    // Install or update inside Termux, for example with npm, pip, or pkg.
    console.log("install in Termux", server.id, mode);
    return true;
  },

  async start(server, context) {
    const command = [
      server.transport.command,
      ...(server.transport.args || []),
    ].filter(Boolean).join(" ");

    // Start the command inside Termux and expose it through a WebSocket bridge.
    console.log("start in Termux", command);

    return {
      kind: "websocket",
      providerId: "termux",
      url: "ws://127.0.0.1:45130/",
      dispose: async () => {
        // Stop the Termux process or bridge if this plugin owns it.
      },
    };
  },
});
```

Required provider fields (each one is validated on registration):

- `id` — trimmed and lowercased; a missing/empty id throws `LSP runtime provider requires a non-empty id`.
- `label` — must be a non-empty string, else `LSP runtime provider <id> requires a label`.
- `canHandle(server, context)` — must be a function, may return a boolean **or** a promise.
- `start(server, context)` — must be a function, must return a `Promise<LspRuntimeConnection>`.

Optional provider fields:

- `priority` — non-numeric values are coerced to `0`.
- `resolveUris(server, context)`
- `checkInstallation(server, context)`
- `install(server, context, mode, options?)`
- `uninstall(server, context, options?)`
- `getInstallCommand(server, context, mode?)`
- `getUninstallCommand(server, context)`
- `stop(connection)`

Any of these being present but **not** a function also throws (`LSP runtime provider <id> has invalid <method>()`), so do not set them to `null` or a non-function truthy value.

Higher `priority` values are tried first. Provider ids are normalized to lowercase.

### Register a Server for a Runtime

The `runtimes` field restricts a server to specific runtime provider ids. Pass it through `defineServer()` or a raw server manifest.

```js
const lsp = acode.require("lsp");

lsp.upsert(
  lsp.defineServer({
    id: "termux-typescript",
    label: "TypeScript (Termux)",
    languages: ["javascript", "typescript", "jsx", "tsx"],
    runtimes: ["termux"],
    useWorkspaceFolders: true,
    transport: {
      kind: "stdio",
      command: "typescript-language-server",
      args: ["--stdio"],
    },
  }),
);
```

If `runtimes` is omitted, any registered provider whose `canHandle()` returns `true` may be selected. Use `runtimes` when your plugin owns both the runtime and the server definition.

## Worker Transport <Badge type="tip" text="corrected" />

Creates a CodeMirror-compatible LSP transport backed by a Web Worker.

::: warning There is no `versionCode` for this API
`CHANGELOG.md` records no `versionCode` for `lsp.workers.createTransport()` — the headings stop annotating build numbers after `v1.12.0 (970)`, and `config.xml` only declares the current build (`android-versionCode="1011"` for v1.13.5). Do **not** hardcode `"minVersionCode": 1002`; `CHANGELOG.md` lists *"feat(lsp): add web worker language servers as defaults"* under **v1.12.7**, but that is a PR, not a build number. Feature-detect instead:

```js
if (lsp?.workers?.createTransport) {
  // safe to use
}
```
:::

```js
const handle = lsp.workers.createTransport({
  url,
  name,
  serverId,
  startupTimeout,
  configure,
  hostHandlers,
});
```

### What it does

- Starts a `Worker` from `url`
- Posts an optional `configure` payload
- Resolves `ready` when the worker sends `{ kind: "ready" }`
- Rejects `ready` when the worker sends `{ kind: "error" }`, fires `onerror`, or hits the startup timeout
- Forwards JSON-RPC **string** messages between CodeMirror and the worker
- Dispatches `{ kind: "host-request" }` to `hostHandlers` and replies with `{ kind: "host-response" }`
- Forwards `{ kind: "log" }` / `{ kind: "status" }` to Acode's LSP logs
- Terminates the worker on `dispose()` or on `{ kind: "error" }`

### `lsp.workers.createTransport(options)`

| Option | Type | Description |
| --- | --- | --- |
| `url` | `string` | Required. Absolute or app-relative URL of the worker script. Throws `createWorkerTransport requires a worker url` when missing. |
| `name` | `string` | Optional worker name (`WorkerOptions.name`) and default log identity. Defaults to `"acode-lsp-worker"`. |
| `serverId` | `string` | Optional id for LSP logs and error messages. Defaults to `name`. |
| `startupTimeout` | `number` | Milliseconds to wait for `{ kind: "ready" }`. Default `10000`; values that are not `> 0` fall back to the default. |
| `configure` | `object` | Optional message posted right after the worker is created (before `ready` is awaited). |
| `hostHandlers` | `Record<string, (params) => unknown \| Promise<unknown>>` | Handlers for worker host requests, keyed by method name. Defaults to `{}`. |

The function throws `Web Workers are not available in this environment` when `typeof Worker === "undefined"`.

Returns a `TransportHandle`:

- `transport`: `{ send(message: string): void, subscribe(handler), unsubscribe(handler) }`. `send()` throws `The <serverId> worker is closed` after disposal, and `subscribe()` silently no-ops after disposal.
- `ready`: `Promise<void>`
- `dispose()`: cleanup and `worker.terminate()` — idempotent, returns `undefined` (not a promise).

### Worker protocol

**Configure** (main → worker), optional:

```js
{
  kind: "configure",
  serverId: "my-worker-server",
  rootUri: "file:///path/to/project",
  initializationOptions: {},
}
```

**Ready** (worker → main) after successful initialization:

```js
{ kind: "ready" }
```

**Error** (worker → main) if initialization fails — rejects `ready` immediately and tears down the worker:

```js
{ kind: "error", message: "Failed to initialize worker" }
```

Prefer this over throwing from the configure path. An uncaught rejection does not always surface as `Worker.onerror`, so the host would otherwise wait until `startupTimeout`.

**JSON-RPC** as strings in both directions (no LSP headers):

```js
// main → worker / worker → main
JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })
```

**Host request** (worker → main):

```js
// Nested params
{
  kind: "host-request",
  id: 1,
  method: "readFile",
  params: { uri: "file:///path/to/file.css" },
}

// Flat fields also work
{
  kind: "host-request",
  id: 1,
  method: "readFile",
  uri: "file:///path/to/file.css",
}
```

**Host response** (main → worker):

```js
{ kind: "host-response", id: 1, result: "..." }
// or
{ kind: "host-response", id: 1, error: "message" }
```

Nested `params` and flat fields are both normalized into the object passed to `hostHandlers[method]` — every key except `kind`, `id`, `method` and `params` is copied. Thrown handler errors become `error` on the response, and a `host-request` whose `method` has no entry in `hostHandlers` is answered with `error: "Unsupported worker host method: <method>"` rather than being ignored. Responses are never posted after disposal.

**Optional logs** (worker → main):

```js
{ kind: "log", level: "info", message: "Loaded project" }
{ kind: "status", message: "Scanning workspace" }
```

### Example

```js
const lsp = acode.require("lsp");
const RUNTIME_ID = "my-css-web-worker";
const SERVER_ID = "my-css-worker";
const PLUGIN_ID = "com.example.plugin";

// Your plugin's base URL, e.g. "https://localhost/plugins/com.example.plugin/"
const baseUrl = "https://localhost/plugins/com.example.plugin/";

function createRuntime(workerBaseUrl) {
  const workerUrl = new URL("language.worker.js", workerBaseUrl).href;

  return {
    id: RUNTIME_ID,
    label: "My CSS Web Worker",
    priority: 200,

    canHandle(server) {
      return server.id === SERVER_ID && typeof Worker !== "undefined";
    },

    resolveUris(_server, context) {
      return {
        documentUri: context.originalDocumentUri,
        rootUri: context.originalRootUri,
        scope: "workspace",
      };
    },

    async checkInstallation() {
      return {
        status: "present",
        version: "bundled",
        canInstall: false,
        canUpdate: false,
      };
    },

    async start(server, context) {
      const handle = lsp.workers.createTransport({
        url: workerUrl,
        name: "my-css-language-service",
        serverId: server.id,
        startupTimeout: server.startupTimeout ?? 20_000,
        configure: {
          kind: "configure",
          serverId: server.id,
          rootUri: context.originalRootUri ?? context.rootUri ?? null,
          initializationOptions: server.initializationOptions ?? {},
        },
        hostHandlers: {
          async readFile(params) {
            const fs = acode.require("fs")(String(params.uri ?? ""));
            if (!fs) throw new Error(`No filesystem provider for ${params.uri}`);
            return String(await fs.readFile("utf-8"));
          },
        },
      });

      return {
        kind: "transport",
        providerId: RUNTIME_ID,
        transport: handle,
      };
    },
  };
}

lsp.unregisterRuntimeProvider(RUNTIME_ID);
lsp.runtimes.register(createRuntime(baseUrl));
lsp.upsert(
  lsp.defineServer({
    id: SERVER_ID,
    label: "My CSS (Web Worker)",
    languages: ["html", "css"],
    runtimes: [RUNTIME_ID],
    transport: { kind: "external" },
    useWorkspaceFolders: true,
    enabled: true,
    startupTimeout: 20_000,
  }),
);

// On unmount
acode.setPluginUnmount(PLUGIN_ID, () => {
  lsp.servers.unregister(SERVER_ID);
  lsp.runtimes.unregister(RUNTIME_ID);
});
```

Use `transport: { kind: "external" }` for worker servers — the runtime returns the real transport handle. Register your own server id; do not replace built-in ids like `html`, `css`, `json`, or `typescript`.

::: warning `runtimes.register()` throws if the id is taken
Registering the provider on every plugin load without unregistering first throws `LSP runtime provider <id> is already registered`. Always `unregisterRuntimeProvider(RUNTIME_ID)` before `registerRuntimeProvider(...)`, as above.
:::

### Runtime URI Resolution

A runtime provider can translate both document and root URIs after it has been selected.

```js
lsp.unregisterRuntimeProvider("termux");

lsp.registerRuntimeProvider({
  id: "termux",
  label: "Termux",
  priority: 10,

  canHandle(server, context) {
    return server.runtimes?.includes("termux")
      && context.workspaceKind === "termux-saf";
  },

  resolveUris(server, context) {
    function toTermuxShared(uri) {
      return uri?.replace(
        "file:///storage/emulated/0/",
        "file:///data/data/com.termux/files/home/storage/shared/",
      ) || null;
    }

    return {
      documentUri: toTermuxShared(context.normalizedDocumentUri),
      rootUri: toTermuxShared(context.normalizedRootUri),
      scope: "workspace",
    };
  },

  async start(server, context) {
    return {
      kind: "websocket",
      providerId: "termux",
      url: "ws://127.0.0.1:45130/",
    };
  },
});
```

`resolveUris()` receives `LspRuntimeUriResolutionContext` — `originalDocumentUri`, `originalRootUri`, `normalizedDocumentUri`, `normalizedRootUri` plus every `LspRuntimeContext` field (`file`, `view`, `languageId`, `documentUri`, `rootUri`, `serverId`, `workspaceKind`, …). It may return `{ documentUri?, rootUri?, scope? }` with `scope: "workspace"` (the default) or `"document"`; document scope starts a separate client for each document. It runs **after** this provider has been selected, so one runtime cannot rewrite another runtime's documents. See [`LspRuntimeUriResolutionContext`](#lspruntimeuriresolutioncontext).

## Definition Reference

### `defineServer(options)`

Convenience helper for local bridge-backed servers (and worker-backed servers when combined with a custom runtime).

Supported fields (this is the complete `ManagedServerOptions` interface):

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` | — | Required. Normalized to trimmed lowercase. |
| `label` | `string` | — | Display label; falls back to `id` after registration. |
| `languages` | `string[]` | — | Required, must be non-empty after normalization. |
| `enabled` | `boolean` | `true` | Only `enabled === false` disables. |
| `useWorkspaceFolders` | `boolean` | `false` | One client per server, folders added over time. Acode's own comment: *"Heavy LSP servers like TypeScript and rust-analyzer should use this."* |
| `runtimes` | `string[]` | unset | Restricts which provider ids may run this server. Lowercased. |
| `command` | `string` | unset | Turns into `launcher.bridge.command`. |
| `args` | `string[]` | unset | Turns into `launcher.bridge.args`. |
| `transport` | `Partial<TransportDescriptor>` | `{ kind: "websocket" }` | Spread **after** the default, so `kind` is overridable. |
| `bridge` | `Partial<BridgeConfig> \| null` | unset | Merged with `command` / `args`; `port` and `session` pass straight through. `kind` must be `"axs"` — anything else throws. |
| `installer` | `LauncherInstallConfig` | unset | Becomes `launcher.install`. |
| `checkCommand` | `string` | unset | `launcher.checkCommand`. |
| `versionCommand` | `string` | unset | `launcher.versionCommand`. |
| `updateCommand` | `string` | unset | `launcher.updateCommand`. |
| `uninstallCommand` | `string` | unset | `launcher.uninstallCommand`. |
| `logOutput` | `"all" \| "warnings-and-errors"` | `"all"` | Anything other than `"warnings-and-errors"` becomes `"all"`. |
| `startupTimeout` | `number` | unset | Copied to `clientConfig.timeout` as the LSP connect timeout. |
| `initializationOptions` | `object` | unset | Deep-cloned via `JSON.parse(JSON.stringify(...))`; functions do not survive. Merged with `clientConfig.initializationOptions` (client wins). |
| `workspaceConfiguration` | `object` | unset | Same JSON clone. |
| `clientConfig` | `object` | unset | See [Formatters and Diagnostics](#formatters-and-diagnostics). |
| `resolveLanguageId` | `fn` | unset | `(context: { languageId, languageName?, uri?, file? }) => string \| null`. |
| `rootUri` | `fn` | unset | `(uri, context: RootUriContext) => string \| null \| Promise<…>`. |
| `documentUri` | `fn` | unset | `(uri, context: DocumentUriContext) => string \| null \| undefined \| Promise<…>`. |
| `capabilityOverrides` | `object` | unset | Stored but **never read** in v1.13.5 — see [Gotchas](#gotchas). |

::: tip `defineServer()` is not a validator
It never throws and never fills in an id. Everything is validated later by `sanitizeDefinition()` when the manifest reaches `lsp.register()` / `lsp.upsert()`. Note it always emits a `launcher` object, even an empty one, and always emits a `transport` object.
:::

### Raw Server Manifest

Use a raw manifest when you need fields outside `defineServer()`.

Common fields:

- `id`
- `label`
- `enabled`
- `priority` — number, default `0`. Higher wins for single-provider features such as formatting.
- `languages`
- `transport`
- `launcher` — `{ command, args, startCommand, checkCommand, versionCommand, updateCommand, uninstallCommand, logOutput, install, bridge }`
- `runtimes`
- `useWorkspaceFolders`
- `initializationOptions`
- `workspaceConfiguration`
- `clientConfig`
- `startupTimeout`
- `capabilityOverrides`
- `rootUri`
- `documentUri`
- `resolveLanguageId`

For `transport.kind: "websocket"`, provide either `transport.url` or `launcher.bridge.command`. For `transport.kind: "stdio"`, provide `transport.command`. A raw manifest **defaults `transport.kind` to `"stdio"`**, which is why a raw manifest without `transport.command` is rejected.

::: warning Two `transport` fields are silently dropped from every raw manifest
`sanitizeDefinition()` rebuilds the transport descriptor from a fixed key list and never copies `transport.protocols` or `transport.create`. Consequences:

- `external-websocket` reads `server.transport.protocols` when building its connection, so it is always `undefined` after registration.
- `transport.create(server, context)` never survives, so `transport: { kind: "external" }` on a **raw** manifest always throws `LSP server <id> declares an external transport without a create() factory` at connect time. `kind: "external"` only works when a **runtime provider** supplies the transport (return `{ kind: "transport", providerId, transport }` from `start()`), which is how the bundled web-worker servers do it.
:::

::: tip Raw `"stdio"` is not an editor-to-process pipe
`createStdioTransport()` throws `STDIO transport for <id> is missing a websocket bridge url` unless `transport.url` is set or `context.dynamicPort` was discovered by the launcher, and then it just delegates to `createWebSocketTransport()`. It also logs an info message when `transport.options.binary` is not set, because it falls back to text frames.
:::

Raw local bridge example:

```js
lsp.upsert({
  id: "raw-typescript",
  label: "TypeScript (Raw)",
  languages: ["javascript", "typescript", "jsx", "tsx"],
  enabled: true,
  useWorkspaceFolders: true,
  transport: {
    kind: "websocket",
  },
  launcher: {
    bridge: {
      kind: "axs",
      command: "typescript-language-server",
      args: ["--stdio"],
    },
    checkCommand: "command -v typescript-language-server",
    install: {
      kind: "npm",
      executable: "typescript-language-server",
      packages: ["typescript", "typescript-language-server"],
    },
  },
});
```

## Registration

### `lsp.register(entry, options?)` <Badge type="tip" text="corrected" />

Registers a server or bundle and returns the **normalized** definition (`LspServerDefinition` for a server, `LspServerBundle` for a bundle). `options.replace` defaults to `false`.

::: warning It does **not** throw on a duplicate id
`registerServer()` does this when the id already exists:

```ts
const exists = registry.has(normalized.id);
if (exists && !replace) {
  const existing = registry.get(normalized.id);
  if (existing) return existing; // ← returns the OLD definition
}
```

So a second `lsp.register(server)` for the same id is a **silent no-op that returns the previously registered definition** — your new fields are discarded with no warning. Bundles behave the same way for their own id. This is exactly why `upsert()` exists.
:::

There is one case where registration *does* throw, and it is not about the entry's own id: when a **bundle** claims a server id that a *different* bundle already owns.

```js
// LSP server eslint is already provided by builtin-javascript;
// my-web must replace explicitly
lsp.register(bundle); // throws
```

| Throw | Message |
| --- | --- |
| Bundle claims a server owned by another bundle | `LSP server <id> is already provided by <owner>; <bundle> must replace explicitly` |
| Bundle entry without an id | `LSP server bundle <id> returned a server without id` |
| Bundle without an id | `LSP server bundle requires a non-empty id` |
| Validation (see [Gotchas](#gotchas)) | `LSP server definition requires a non-empty id`, `… must declare supported languages`, `… (stdio) requires a command`, `… (websocket) requires a url or a launcher bridge`, `… managed installers must declare install.binaryPath or install.executable` |

```js
// Force replacement
lsp.register(server, { replace: true });
```

::: tip A bundle's own servers are always registered with `replace: true`
Inside `registerServerBundle()` each member manifest is passed to `registry.registerServer(definition, { replace: true })`, so re-registering a bundle refreshes its servers even though the bundle's `replace` option defaults to `false`.
:::

### `lsp.upsert(entry)`

Registers or replaces a server or bundle — literally `register(entry, { replace: true })`.

```js
lsp.upsert(server);
```

## Inspection and Updates

### Servers

```js
const jsServers = lsp.servers.listForLanguage("javascript");
const server = lsp.servers.get("typescript-custom");

lsp.servers.update("typescript-custom", (current) => ({
  ...current,
  enabled: false,
}));

const unsubscribe = lsp.servers.onChange((event, changedServer) => {
  console.log(event, changedServer.id);
});
```

| Method | Signature | Returns |
| --- | --- | --- |
| `lsp.servers.get(id)` | `(id: string) => LspServerDefinition \| null` | `null` when unknown. The id is trimmed + lowercased. |
| `lsp.servers.list()` | `() => LspServerDefinition[]` | Every registered server, including disabled ones. |
| `lsp.servers.listForLanguage(languageId, options?)` | `(languageId: string, options?: { includeDisabled?: boolean }) => LspServerDefinition[]` | Enabled servers whose `languages` contain the (lowercased) id, **sorted by `priority` descending**. Pass `{ includeDisabled: true }` to include disabled servers. |
| `lsp.servers.update(id, updater)` | `(id: string, updater: (current) => Partial<LspServerDefinition> \| null) => LspServerDefinition \| null` | `null` when the id is unknown. `updater` receives a **shallow copy**; returning `null` aborts the update and the current definition is returned unchanged. Otherwise the merged result is re-validated and re-normalized. |
| `lsp.servers.unregister(id)` | `(id: string) => boolean` | `true` when something was removed. |
| `lsp.servers.onChange(listener)` | `(listener: (event: "register" \| "unregister" \| "update", server: LspServerDefinition) => void) => () => void` | Unsubscribe function. Listener exceptions are caught and logged, so one bad listener cannot break the others. A non-function listener yields a no-op unsubscribe. |

### Bundles

```js
const bundles = lsp.bundles.list();
const bundle = lsp.bundles.getForServer("my-html");
lsp.bundles.unregister("my-web-tools");
```

| Method | Signature | Returns |
| --- | --- | --- |
| `lsp.bundles.list()` | `() => LspServerBundle[]` | Every registered bundle, including the six built-ins. |
| `lsp.bundles.getForServer(id)` | `(id: string) => LspServerBundle \| null` | The bundle that **owns the server** with that id, or `null` for a standalone server. |
| `lsp.bundles.unregister(id)` | `(id: string) => boolean` | `true` when removed. This also unregisters every server the bundle still owned. |

### Runtimes

```js
const runtimes = lsp.runtimes.list();
const runtime = lsp.runtimes.get("builtin-alpine");
lsp.runtimes.unregister("my-runtime");
```

| Method | Signature | Returns |
| --- | --- | --- |
| `lsp.runtimes.register(provider)` | `(provider: LspRuntimeProvider) => LspRuntimeProvider` | The normalized provider (id lowercased). **Throws** if the id is already registered. |
| `lsp.runtimes.unregister(id)` | `(id: string) => boolean` | `true` when removed. |
| `lsp.runtimes.get(id)` | `(id: string) => LspRuntimeProvider \| null` | `null` when unknown. |
| `lsp.runtimes.list()` | `() => LspRuntimeProvider[]` | All providers sorted by `priority` descending, ties broken by `id.localeCompare`. |
| `lsp.runtimes.select(server, context?)` | `(server: LspServerDefinition, context?: LspRuntimeContext) => Promise<LspRuntimeProvider \| null>` | The winning provider, or `null`. Honors the settings override and `server.runtimes`. |

`registerRuntimeProvider` and `unregisterRuntimeProvider` are the same functions under different names.

### Workers

```js
const handle = lsp.workers.createTransport({
  url: "https://localhost/plugins/my-plugin/language.worker.js",
  name: "my-language-worker",
  serverId: "my-worker-server",
  startupTimeout: 15_000,
  configure: {
    kind: "configure",
    serverId: "my-worker-server",
    rootUri: "file:///project",
  },
  hostHandlers: {
    async readFile(params) {
      const fs = acode.require("fs")(String(params.uri ?? ""));
      return String(await fs.readFile("utf-8"));
    },
  },
});

await handle.ready;
handle.transport.send(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }));
handle.dispose();
```

Available methods:

- `lsp.workers.createTransport(options)`

## Formatters and Diagnostics

There is no formatter or diagnostics function on `acode.require("lsp")`. Both are wired through the server manifest's `clientConfig` instead, and Acode resolves them for you.

### Formatting

Acode registers **one** formatter named `lsp` (display name `Language Server`) at startup, via `registerLspFormatter(acode)` which `src/lib/acode.js` calls once while defining modules. When the user runs "Format":

1. `supportsBuiltinFormatting(server)` filters candidates — it is `server.clientConfig?.builtinExtensions?.formatting !== false`, so a server opts out only with `builtinExtensions: { formatting: false }`.
2. Candidates come from `getServersForLanguage(languageId)` (highest `priority` first) and are filtered by the same check.
3. `lspClientManager.formatDocument(fullMetadata)` then walks the same candidates in `priority` order and uses the first one that resolves a runtime target **and** reports `serverCapabilities.documentFormattingProvider`. If a server returns no edits at all, formatting is treated as a success. Failures surface as the toasts `LSP formatter unavailable`, `Unknown language for LSP formatting`, `No LSP formatter available` or `LSP formatter failed`.

There is no public "format now" call. The supported way to control formatting from a plugin is to opt in/out per server:

```js
lsp.upsert(
  lsp.defineServer({
    id: "my-language-server",
    label: "My Language Server",
    languages: ["mylang"],
    command: "my-language-server",
    args: ["--stdio"],
    // Opt in to Acode's built-in hover / completion / signature / keymaps /
    // diagnostics / formatting / document-color features for this server.
    clientConfig: {
      builtinExtensions: {
        hover: true,
        completion: true,
        signature: true,
        keymaps: true,
        diagnostics: true,
        formatting: true,
        documentColors: true,
        inlayHints: false,
      },
    },
  }),
);
```

### Diagnostics

`builtinExtensions.diagnostics` (default `true`) adds the `textDocument/publishDiagnostics` handler, the `workspace/diagnostic/refresh` handler and the CodeMirror lint integration. Setting it to `false` disables them for that server only.

The UI half — the lint gutter, the `linter()` extension and the panel wiring — is **global**, not per server. It comes from `clientManager.options.diagnosticsUiExtension`, which Acode sets from the `lintGutter` setting:

```js
appSettings.on("update:lintGutter", function (value) {
  lspClientManager.setOptions({
    diagnosticsUiExtension: lspDiagnosticsUiExtension(value !== false),
  });
  // ...
});
```

To observe diagnostics from a plugin, register your own handler for the same method. Because the client merges `clientConfig.extensions` **after** the built-ins and drops `diagnosticsExtension` when one of your extensions declares `clientCapabilities.textDocument.publishDiagnostics`, doing this **replaces** Acode's handler for that server:

```js
lsp.upsert(
  lsp.defineServer({
    id: "my-language-server",
    label: "My Language Server",
    languages: ["mylang"],
    command: "my-language-server",
    args: ["--stdio"],
    clientConfig: {
      // Keep Acode's diagnostics UI. If you declare
      // `clientCapabilities.textDocument.publishDiagnostics` on your own
      // extension instead, Acode drops its diagnosticsExtension for this
      // server and your handler becomes the only one.
      extensions: [
        {
          notificationHandlers: {
            "textDocument/publishDiagnostics": (client, params) => {
              // params: { uri, version?, diagnostics: [{ range, severity, message }] }
              const { uri, diagnostics } = params;
              const errors = diagnostics.filter((d) => d.severity === 1).length;
              console.log(`[mylang] ${errors} error(s) in ${uri}`);
              return true; // returning true marks the notification handled
            },
          },
        },
      ],
    },
  }),
);
```

::: warning Handlers are `(client, params) => boolean` and not awaited
The contract is LSP-shaped: return `true` when you consumed the notification. Returning `false` leaves it available to other handlers in the chain, which is how you can observe without claiming.
:::

::: warning `clientConfig.notificationHandlers` for `window/*` and `$/progress` is not yours
Acode builds the final handler map by spreading your handlers first and then assigning its own for `"window/logMessage"`, `"window/showMessage"` and `"$/progress"`, so those three always win. Every other method name is preserved.
:::

### Complete example: server + formatter + diagnostics <Badge type="tip" text="new" />

```js
// main.js — Acode loads plugins as *classic* scripts, so no top-level await
// and no import/export statements. See core-file.md.
const PLUGIN_ID = "com.example.plugin";
const lsp = acode.require("lsp");
const SERVER_ID = "my-plugin-toml";

const server = lsp.defineServer({
  id: SERVER_ID,
  label: "TOML (plugin)",
  languages: ["toml"],
  enabled: true,
  // One client shared across the whole workspace rather than one per root.
  useWorkspaceFolders: true,
  command: "taplo",
  args: ["lsp"],
  checkCommand: "command -v taplo",
  startupTimeout: 15_000,
  installer: lsp.installers.cargo({
    executable: "taplo",
    packages: ["taplo-cli"],
  }),
  initializationOptions: {
    formatting: { enabled: true },
  },
  clientConfig: {
    // Formatting is opt-out: "formatting !== false" enables it.
    builtinExtensions: {
      hover: true,
      completion: true,
      signature: true,
      diagnostics: true,
      formatting: true,
      documentColors: false,
    },
    notificationHandlers: {
      // Acode's own window/logMessage, window/showMessage and $/progress
      // handlers always win; any other method name is preserved.
      "my-plugin/telemetry": (client, params) => {
        console.log("taplo telemetry", params);
        return true;
      },
    },
  },
});

// upsert() == register(entry, { replace: true }), so re-registering on a
// plugin reload replaces rather than silently returning the old definition.
lsp.upsert(server);

// Read-only inspection.
(async () => {
  const registered = lsp.servers.get(SERVER_ID);
  console.log(registered.id, registered.transport.kind, registered.languages);

  // Which provider would run it for a given document?
  const runtime = await lsp.runtimes.select(registered, {
    uri: "file:///project/Cargo.toml",
  });
  console.log("runtime:", runtime ? runtime.id : "none");

  // Which live clients does the editor hold for it right now?
  for (const state of lsp.clientManager.getActiveClients()) {
    if (state.server.id !== SERVER_ID) continue;
    console.log("root:", state.rootUri);
  }
})();

// Cleanup on plugin unload.
acode.setPluginUnmount(PLUGIN_ID, () => {
  lsp.servers.unregister(SERVER_ID);
});
```

## Client Manager

The public client manager API is intentionally small — two methods.

### `clientManager.setOptions(options)` <Badge type="tip" text="corrected" />

```ts
setOptions(next: Partial<ClientManagerOptions>): void
```

A **shallow merge** into the live options object of the editor's single `LspClientManager` singleton:

```ts
this.options = { ...this.options, ...next };
```

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `diagnosticsUiExtension` | `Extension \| Extension[]` | unset | Appended to *every* server's merged extension list. Acode sets it from the `lintGutter` setting. |
| `clientExtensions` | `Extension \| Extension[]` | unset | Appended to every server's client, after the built-ins. |
| `resolveRoot` | `(context: RootUriContext) => Promise<string \| null>` | unset | Acode uses it to compute the workspace root. |
| `displayFile` | `(uri: string) => Promise<EditorView \| null>` | unset | Focus an already-open editor for a URI. |
| `openFile` | `(uri: string) => Promise<EditorView \| null>` | unset | Open a URI and return its editor view. |
| `resolveLanguageId` | `(uri: string) => string \| null` | unset | Per-URI language resolution for the workspace file list. |
| `clientIdleGracePeriodMs` | `number` | `DEFAULT_CLIENT_IDLE_GRACE_PERIOD_MS` = `15000` | Delay before an unreferenced client is reported idle. |
| `onClientIdle` | `(info: ClientIdleInfo) => void` | unset | `info` is `{ server, client, rootUri, dispose }`; `dispose()` tears down **only that** idle client. |
| `allowNonTerminalWorkspace` | `boolean` | `false` | Lets `builtin-alpine` serve a workspace it cannot reach natively, by falling back to the cache file. |

::: danger Do not call this to "reset" options
`setOptions` merges, it never resets, and the editor itself keeps writing to the same object. Setting `diagnosticsUiExtension: []` — as older versions of this page suggested — does not disable anything for your plugin: it **overwrites the editor's lint gutter and diagnostics panel** for every server until the user toggles the `lintGutter` setting again. If you want your own CodeMirror extensions applied to every LSP client, use `clientExtensions` and do not touch `diagnosticsUiExtension`.

There is also no read-back accessor: `setOptions` returns `undefined` and the manager exposes no `getOptions()`, so you cannot restore a previous value yourself.
:::

### `clientManager.getActiveClients()`

```ts
getActiveClients(): ClientState[]
```

Returns `Array.from(this.#clients.values())` — a snapshot array of every **currently initialized** client. It excludes clients still initializing (`#pendingClients` is a separate map) and is not live; call it again to refresh.

Each `ClientState` is:

| Field | Type | Description |
| --- | --- | --- |
| `server` | `LspServerDefinition` | The normalized server definition this client belongs to. |
| `client` | `LSPClient` | The `@codemirror/lsp-client` instance. |
| `transport` | `TransportHandle` | `{ transport, dispose, ready }` for the underlying transport. |
| `rootUri` | `string \| null` | Normalized workspace root, or `null` for document-scoped clients. |
| `attach` | `(uri: string, view: EditorView, aliases?: string[]) => void` | Bind this client to a document. |
| `detach` | `(uri: string, view?: EditorView) => void` | Unbind. |
| `dispose` | `() => Promise<void>` | Tear down this client. |

```js
lsp.clientManager.setOptions({
  // Not recommended — see the warning above.
  diagnosticsUiExtension: [],
});

const activeClients = lsp.clientManager.getActiveClients();
console.log(activeClients);
```

## Important Types

### `LspMessageTransport`

CodeMirror-compatible JSON-RPC transport used by `TransportHandle.transport`.

- `send(message: string): void`
- `subscribe(handler: (message: string) => void): void`
- `unsubscribe(handler: (message: string) => void): void`

Messages contain only JSON-RPC payloads as strings (no LSP Content-Length headers).

### `TransportHandle`

Object returned by transport factories and by `lsp.workers.createTransport()`.

- `transport`: `LspMessageTransport`
- `dispose`: Function that cleans up the transport.
- `ready`: `Promise<void>` that resolves when the transport is ready.

### `LspWorkerTransportOptions`

Options for `lsp.workers.createTransport(options)`:

- `url` (required)
- `name?`
- `serverId?`
- `startupTimeout?`
- `configure?`
- `hostHandlers?`

### `LspRuntimeConnection`

Runtime providers return one of these shapes from `start()`.

```js
{
  kind: "websocket",
  providerId: "my-runtime",
  url: "ws://127.0.0.1:45130/",
  protocols: [],
  dispose: async () => {},
}
```

```js
{
  kind: "transport",
  providerId: "my-runtime",
  transport: transportHandle,
  dispose: async () => {},
}
```

`protocols` and `dispose` are optional in both shapes.

### `LspRuntimeContext`

Context passed to runtime providers. It extends `TransportContext`:

- `uri`, `file`, `view`, `languageId`, `rootUri`, `originalRootUri`, `debugWebSocket`, `dynamicPort` — from `TransportContext`
- `documentUri`
- `originalDocumentUri`
- `serverId` — defaults to `server.id`
- `workspaceKind` — derived by `inferWorkspaceKind()` when the caller does not set it. The declared type is `"app-private"`, `"builtin-alpine"`, `"termux-saf"`, `"saf"`, `"remote"`, `"proot-distro"`, `"virtual"` or `"unknown"`; see [Runtime Providers](#runtime-providers) for which of those Acode actually produces.
- `allowNonTerminalWorkspace`
- `runtimeAction` — one of `"checkInstallation"`, `"install"`, `"uninstall"`, `"command"` when the provider is being asked for install metadata rather than a connection

### `LspRuntimeUriResolutionContext`

`resolveUris()` receives this instead. It is `LspRuntimeContext` plus:

- `originalDocumentUri` (non-optional `string`)
- `originalRootUri` (`string | null`)
- `normalizedDocumentUri` (`string | null`)
- `normalizedRootUri` (`string | null`)

and returns `{ documentUri?, rootUri?, scope? }` where `scope` is `"workspace"` (default) or `"document"`. Document scope starts a separate client per document.

## Best Practices

- Use `lsp.upsert()` during plugin initialization.
- Use `defineServer()` for ordinary local servers, including `runtimes` when you own a custom runtime.
- Prefer structured installers over shell installers.
- Use `useWorkspaceFolders: true` for heavy workspace-aware servers.
- If the server cannot see Acode's file paths, define `documentUri` and usually `rootUri`.
- Runtime plugins should register their own server definitions instead of taking over built-in Acode server ids.
- For Web Worker language services, use `lsp.workers.createTransport()`.
- Feature-detect `lsp.workers?.createTransport` rather than declaring a `minVersionCode`; see the [Worker Transport](#worker-transport) section.

## Gotchas <Badge type="tip" text="new" />

- **`register()` does not throw on a duplicate id.** `registerServer()` returns the *already registered* definition when `replace` is not set. Only the bundle-ownership case throws: claiming a server id that another bundle already owns without `replace: true` throws `LSP server <id> is already provided by <owner>; <bundle> must replace explicitly`.
- **Validation happens before registration, and it throws.** A raw manifest must have a non-empty `id`, a non-empty `languages` array, and — for `transport.kind: "stdio"` — a `transport.command`. `websocket` needs a `transport.url` **or** a `launcher.bridge.command`. Any managed installer (`kind` other than `shell`) must declare `install.binaryPath` or `install.executable`.
- **Ids are normalized.** Server ids, runtime provider ids, `languages` entries and `runtimes` entries are all trimmed and lowercased. `label` defaults to the id, `priority` to `0`, `enabled` to `true` (only `enabled === false` disables), `useWorkspaceFolders` to `false` (only `=== true` enables it), and `rootUri` / `documentUri` / `resolveLanguageId` to `null` when they are not functions.
- **`defineServer()` sets `transport.kind` to `"websocket"`; a raw manifest defaults to `"stdio"`.**
- **`capabilityOverrides` is dead in v1.13.5.** It is declared in `types.ts`, accepted by `defineServer()` and stored by `sanitizeDefinition()`, but nothing in `src/` ever reads it. To change capabilities, use `clientConfig.extensions` / `clientConfig.clientCapabilities`.
- **`clientConfig.notificationHandlers` cannot override `window/logMessage`, `window/showMessage` or `$/progress`.** Acode spreads your handlers first and then assigns its own for those three keys, so yours are silently replaced. Any other method name you add is kept.
- **`server.startupTimeout` is copied into `clientConfig.timeout`** (unless you set one yourself), where it becomes the LSP client connect timeout — it does not bound the Web Worker startup, which is `lsp.workers.createTransport({ startupTimeout })`.
- **`inlayHints` is opt-in.** Every other `clientConfig.builtinExtensions` flag is opt-out (`!== false`); `inlayHints` must be `true`.
- **Adding a server after startup does not extend the LSP formatter.** `registerLspFormatter(this)` runs once during Acode's module definition and snapshots `serverRegistry.listServers()` at that moment to build its extension list. A plugin server registered later is not in that list unless the snapshot happened to be empty (`["*"]`), so "Format" may not appear for your language. Formatting still works through the client manager if the command is invoked.
- **Registering `textDocument/publishDiagnostics` yourself suppresses Acode's built-in diagnostics extension** for that server — `wantsCustomDiagnostics` makes the client drop `diagnosticsExtension` from the merged extension list.
- **`lsp.bundles.unregister(id)` also unregisters every server the bundle owned.**
- **`lsp.bundles.getForServer()` takes a *server* id**, not a bundle id.
- **`runtimes.select()` can return `null`** (no provider's `canHandle()` matched). Nothing throws in that case; the client manager just logs `Cannot resolve runtime or document URI for LSP server <id>` and skips that server.
- **Settings can override your runtime.** `settings.lsp.runtime.*` is consulted before `canHandle()`, so a user's choice can route your server to a provider you did not expect (or fail and fall through).
- **`resolveUris()` only runs for the selected provider**, after selection, so one runtime cannot rewrite another runtime's documents.
- **Bundled built-in servers may be handed to the web-worker runtime regardless of `server.runtimes`** — `web-worker.canHandle()` checks only the server id, so registering your own server under a bundled id takes it over. Do not reuse `html`, `css`, `json` or `typescript`.
