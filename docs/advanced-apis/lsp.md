# LSP API

Use the LSP API to register language servers for Acode's CodeMirror LSP integration.

```js
const lsp = acode.require("lsp");
```

## API Overview

The public module exposes:

- `defineServer(options)`: Creates a normalized server manifest for common local servers.
- `defineBundle(options)`: Groups multiple server manifests and optional install hooks.
- `register(entry, options?)`: Registers a server or bundle.
- `upsert(entry)`: Registers or replaces a server or bundle.
- `installers.*`: Helpers for structured install metadata.
- `servers.*`: Server registry inspection and updates.
- `bundles.*`: Bundle registry inspection.
- `runtimes.*`: Runtime provider registry helpers.
- `registerRuntimeProvider(provider)`: Alias for `runtimes.register(provider)`.
- `unregisterRuntimeProvider(id)`: Alias for `runtimes.unregister(id)`.
- `clientManager.*`: Limited client-manager access for advanced plugins.

Most plugins should use `defineServer()` plus `upsert()`. Use raw server manifests only when you need fields that the helper does not cover, such as `runtimes`.

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
- `transport.kind: "external"` is for custom transport factories.

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

Available helpers:

- `lsp.installers.apk(options)`
- `lsp.installers.npm(options)`
- `lsp.installers.pip(options)`
- `lsp.installers.cargo(options)`
- `lsp.installers.githubRelease(options)`
- `lsp.installers.manual(options)`
- `lsp.installers.shell(options)`

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

- Managed installers should declare the executable they provide.
- `githubRelease()` is intended for architecture-specific downloaded binaries.
- `manual()` is useful when the binary already exists at a known path.
- `shell()` is the advanced fallback when no structured installer fits.

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

Supported hooks:

- `getExecutable(serverId, manifest)`
- `checkInstallation(serverId, manifest)`
- `installServer(serverId, manifest, mode, options?)`

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

Runtime selection has two gates:

- `server.runtimes`, when present, limits which provider ids are allowed for that server.
- `provider.canHandle(server, context)` decides whether that provider can handle the current file, root, workspace kind, and server.

Acode derives `context.workspaceKind` from the current URI/root. These values come from Acode's `WorkspaceKind` type: `"app-private"`, `"builtin-alpine"`, `"termux-saf"`, `"saf"`, `"remote"`, `"proot-distro"`, `"virtual"`, and `"unknown"`.

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

Required provider fields:

- `id`
- `label`
- `canHandle(server, context)`
- `start(server, context)`

Optional provider fields:

- `priority`
- `resolveUris(server, context)`
- `checkInstallation(server, context)`
- `install(server, context, mode, options?)`
- `uninstall(server, context, options?)`
- `getInstallCommand(server, context, mode?)`
- `getUninstallCommand(server, context)`
- `stop(connection)`

Higher `priority` values are tried first. Provider ids are normalized to lowercase.

### Register a Server for a Runtime

The `runtimes` field restricts a server to specific runtime provider ids. `defineServer()` does not currently preserve `runtimes`, so use a raw server manifest for runtime-specific servers.

```js
const lsp = acode.require("lsp");

lsp.upsert({
  id: "termux-typescript",
  label: "TypeScript (Termux)",
  languages: ["javascript", "typescript", "jsx", "tsx"],
  enabled: true,
  runtimes: ["termux"],
  useWorkspaceFolders: true,
  transport: {
    kind: "stdio",
    command: "typescript-language-server",
    args: ["--stdio"],
  },
});
```

If `runtimes` is omitted, any registered provider whose `canHandle()` returns `true` may be selected. Use `runtimes` when your plugin owns both the runtime and the server definition.

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

`resolveUris()` receives:

- `originalDocumentUri`
- `originalRootUri`
- `normalizedDocumentUri`
- `normalizedRootUri`
- all `LspRuntimeContext` fields, including `file`, `view`, `languageId`, `documentUri`, `rootUri`, `serverId`, and `workspaceKind`

It may return `scope: "workspace"` or `scope: "document"`. Document scope starts a separate client for each document.

## Definition Reference

### `defineServer(options)`

Convenience helper for local bridge-backed servers.

Supported fields:

- `id`: Required server id.
- `label`: Required display label.
- `languages`: Required non-empty language id array.
- `enabled`: Defaults to `true`.
- `useWorkspaceFolders`: Use one client per server and workspace folders. Useful for TypeScript and Rust.
- `command`: Executable used for the AXS bridge.
- `args`: Arguments passed to `command`.
- `transport`: Optional partial transport descriptor. Defaults to `{ kind: "websocket" }`.
- `bridge`: Optional AXS bridge details such as `port` or `session`.
- `installer`: Structured installer config from `lsp.installers.*`.
- `checkCommand`
- `versionCommand`
- `updateCommand`
- `uninstallCommand`
- `startupTimeout`
- `initializationOptions`
- `clientConfig`
- `resolveLanguageId`
- `rootUri`
- `documentUri`
- `capabilityOverrides`

### Raw Server Manifest

Use a raw manifest when you need fields outside `defineServer()`.

Common fields:

- `id`
- `label`
- `enabled`
- `languages`
- `transport`
- `launcher`
- `runtimes`
- `useWorkspaceFolders`
- `initializationOptions`
- `clientConfig`
- `startupTimeout`
- `capabilityOverrides`
- `rootUri`
- `documentUri`
- `resolveLanguageId`

For `transport.kind: "websocket"`, provide either `transport.url` or `launcher.bridge.command`. For `transport.kind: "stdio"`, provide `transport.command`.

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

### `lsp.register(entry, options?)`

Registers a server or bundle. It throws if the id already exists unless `options.replace` is `true`.

```js
lsp.register(server, { replace: true });
```

### `lsp.upsert(entry)`

Registers or replaces a server or bundle.

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

Available methods:

- `lsp.servers.get(id)`
- `lsp.servers.list()`
- `lsp.servers.listForLanguage(languageId, options?)`
- `lsp.servers.update(id, updater)`
- `lsp.servers.unregister(id)`
- `lsp.servers.onChange(listener)`

`listForLanguage()` accepts `{ includeDisabled?: boolean }`.

### Bundles

```js
const bundles = lsp.bundles.list();
const bundle = lsp.bundles.getForServer("my-html");
lsp.bundles.unregister("my-web-tools");
```

Available methods:

- `lsp.bundles.list()`
- `lsp.bundles.getForServer(serverId)`
- `lsp.bundles.unregister(id)`

### Runtimes

```js
const runtimes = lsp.runtimes.list();
const runtime = lsp.runtimes.get("builtin-alpine");
lsp.runtimes.unregister("my-runtime");
```

Available methods:

- `lsp.runtimes.register(provider)`
- `lsp.runtimes.unregister(id)`
- `lsp.runtimes.get(id)`
- `lsp.runtimes.list()`
- `lsp.runtimes.select(server, context?)`

## Client Manager

The public client manager API is intentionally small.

```js
lsp.clientManager.setOptions({
  diagnosticsUiExtension: [],
});

const activeClients = lsp.clientManager.getActiveClients();
console.log(activeClients);
```

Available methods:

- `lsp.clientManager.setOptions(options)`
- `lsp.clientManager.getActiveClients()`

## Important Types

### `TransportHandle`

Object returned by transport factories.

- `transport`: CodeMirror LSP transport object.
- `dispose`: Function that cleans up the transport.
- `ready`: `Promise<void>` that resolves when the transport is ready.

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

### `LspRuntimeContext`

Context passed to runtime providers.

- `uri`
- `file`
- `view`
- `languageId`
- `rootUri`
- `originalRootUri`
- `documentUri`
- `originalDocumentUri`
- `serverId`
- `workspaceKind`: One of `"app-private"`, `"builtin-alpine"`, `"termux-saf"`, `"saf"`, `"remote"`, `"proot-distro"`, `"virtual"`, or `"unknown"`.
- `allowNonTerminalWorkspace`

## Best Practices

- Use `lsp.upsert()` during plugin initialization.
- Use `defineServer()` for ordinary local servers.
- Use a raw manifest when you need `runtimes` or a custom `launcher`.
- Prefer structured installers over shell installers.
- Use `useWorkspaceFolders: true` for heavy workspace-aware servers.
- If the server cannot see Acode's file paths, define `documentUri` and usually `rootUri`.
- Runtime plugins should register their own server definitions instead of taking over built-in Acode server ids.
