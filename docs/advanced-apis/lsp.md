# LSP API

Use this API to register and manage language servers for Acode's CodeMirror LSP integration.

## Import

```js
const lsp = acode.require("lsp");
```

## Current API Shape

The public API is intentionally small:

- `lsp.defineServer(...)`
- `lsp.defineBundle(...)`
- `lsp.register(entry, options?)`
- `lsp.upsert(entry)`
- `lsp.installers.*`
- `lsp.servers.*`
- `lsp.bundles.*`

`bundle` is the public name for what the internal runtime still calls a provider:

- a bundle can own one or more server definitions
- a bundle can also provide install/check behavior hooks
- most plugins only need a single server
- use a bundle when you ship a family of related servers or custom install logic

## Transport Reality

Acode's LSP client still speaks WebSocket to the transport layer.

- `transport.kind: "websocket"` is the normal and recommended setup
- local stdio servers should usually be launched through `launcher.bridge`
- `transport.kind: "stdio"` still expects a WebSocket bridge URL
- `transport.kind: "external"` is available for custom transport factories

For local servers, prefer `transport.kind: "websocket"` plus an AXS bridge.

::: warning
`transport.kind: "stdio"` is not a direct pipe from the editor to the server.
It still resolves to the WebSocket transport layer and requires a bridge URL.
:::

## Recommended Single-Server Setup

Use `defineServer()` and `upsert()` for idempotent registration.

```js
const lsp = acode.require("lsp");

const typescriptServer = lsp.defineServer({
  id: "typescript-custom",
  label: "TypeScript (Custom)",
  languages: [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "tsx",
    "jsx",
  ],
  useWorkspaceFolders: true,
  transport: {
    kind: "websocket",
  },
  command: "typescript-language-server",
  args: ["--stdio"],
  checkCommand: "which typescript-language-server",
  installer: lsp.installers.npm({
    executable: "typescript-language-server",
    packages: ["typescript-language-server", "typescript"],
  }),
  initializationOptions: {
    provideFormatter: true,
  },
});

lsp.upsert(typescriptServer);
```

## Bundle Setup

Use a bundle when one plugin contributes multiple servers or needs custom install behavior.

```js
const lsp = acode.require("lsp");

const htmlServer = lsp.defineServer({
  id: "my-html",
  label: "My HTML Server",
  languages: ["html"],
  transport: {
    kind: "websocket",
  },
  command: "vscode-html-language-server",
  args: ["--stdio"],
  installer: lsp.installers.npm({
    executable: "vscode-html-language-server",
    packages: ["vscode-langservers-extracted"],
  }),
});

const cssServer = lsp.defineServer({
  id: "my-css",
  label: "My CSS Server",
  languages: ["css", "scss", "less"],
  transport: {
    kind: "websocket",
  },
  command: "vscode-css-language-server",
  args: ["--stdio"],
  installer: lsp.installers.npm({
    executable: "vscode-css-language-server",
    packages: ["vscode-langservers-extracted"],
  }),
});

const webBundle = lsp.defineBundle({
  id: "my-web-bundle",
  label: "My Web Bundle",
  servers: [htmlServer, cssServer],
});

lsp.upsert(webBundle);
```

## Bundle Hooks

Bundles can own behavior, not just server lists.

Available hooks:

- `getExecutable(serverId, manifest)`
- `checkInstallation(serverId, manifest)`
- `installServer(serverId, manifest, mode, options?)`

Example:

```js
const bundle = lsp.defineBundle({
  id: "my-bundle",
  label: "My Bundle",
  servers: [myServer],
  hooks: {
    getExecutable(serverId, manifest) {
      return manifest.launcher?.install?.binaryPath || null;
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
```

## Structured Installers

Prefer structured installers over raw shell whenever possible.

Available installer builders:

- `lsp.installers.apk(...)`
- `lsp.installers.npm(...)`
- `lsp.installers.pip(...)`
- `lsp.installers.cargo(...)`
- `lsp.installers.githubRelease(...)`
- `lsp.installers.manual(...)`
- `lsp.installers.shell(...)`

Example:

```js
const server = lsp.defineServer({
  id: "python-custom",
  label: "Python (pylsp)",
  languages: ["python"],
  command: "pylsp",
  installer: lsp.installers.pip({
    executable: "pylsp",
    packages: ["python-lsp-server[all]"],
  }),
});
```

### Installer Notes

- managed installers should declare the executable they provide
- `githubRelease()` is intended for arch-aware downloaded binaries
- `manual()` is useful when the binary already exists at a known path
- `shell()` should be treated as the advanced fallback, not the default path

## Remote WebSocket Server

```js
lsp.upsert({
  id: "remote-json-lsp",
  label: "Remote JSON LSP",
  languages: ["json"],
  transport: {
    kind: "websocket",
    url: "ws://127.0.0.1:2087/",
    options: {
      binary: true,
      timeout: 5000,
    },
  },
  enabled: true,
});
```

## Definition API

### `lsp.defineServer(options)`

Builds a normalized server manifest for later registration.

Common fields:

- `id`: required, normalized to lowercase by the registry
- `label`: optional display label
- `languages`: required non-empty array
- `enabled`: defaults to `true`
- `transport`
- `command` and `args`: used to create an AXS launcher bridge
- `installer`: structured installer config
- `checkCommand`
- `versionCommand`
- `updateCommand`
- `initializationOptions`
- `clientConfig`
- `startupTimeout`
- `capabilityOverrides`
- `rootUri`
- `resolveLanguageId`
- `useWorkspaceFolders`

### `lsp.defineBundle(options)`

Creates a bundle record.

Fields:

- `id`: required bundle id
- `label`: optional
- `servers`: array returned by `lsp.defineServer(...)`
- `hooks?`: optional behavioral hooks

## Registration API

### `lsp.register(entry, options?)`

Registers either a server or bundle if the id is free.

- `options.replace?: boolean` defaults to `false`

### `lsp.upsert(entry)`

Registers or replaces either a server or bundle. This is the preferred method for plugin startup code.

## Server Inspection API

- `lsp.servers.get(id)`
- `lsp.servers.list()`
- `lsp.servers.listForLanguage(languageId, options?)`
- `lsp.servers.update(id, updater)`
- `lsp.servers.unregister(id)`
- `lsp.servers.onChange(listener)`

Example:

```js
const jsServers = lsp.servers.listForLanguage("javascript");

lsp.servers.update("typescript-custom", (current) => ({
  ...current,
  enabled: false,
}));
```

`listForLanguage()` options:

- `includeDisabled?: boolean` default `false`

## Bundle Inspection API

- `lsp.bundles.list()`
- `lsp.bundles.getForServer(serverId)`
- `lsp.bundles.unregister(id)`

## Client Manager

- `lsp.clientManager.setOptions(options)`
- `lsp.clientManager.getActiveClients()`

```js
lsp.clientManager.setOptions({
  diagnosticsUiExtension: [],
});

const activeClients = lsp.clientManager.getActiveClients();
console.log(activeClients);
```

## Best Practices

- Prefer `lsp.upsert(...)` during plugin init.
- Prefer `defineServer()` and `defineBundle()` instead of hand-assembling objects everywhere.
- Prefer structured installers over raw shell commands.
- Use a bundle when your plugin owns a family of related servers or custom install logic.
- Use `useWorkspaceFolders: true` for heavy workspace-aware servers like TypeScript or Rust.
