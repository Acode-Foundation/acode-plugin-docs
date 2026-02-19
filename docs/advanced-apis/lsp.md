# LSP API

Use this API to register/manage language servers used by Acode's CodeMirror LSP client.

## Import

```js
const lsp = acode.require("lsp");
```

## Important Transport Reality

CodeMirror's LSP client in Acode communicates via **WebSocket** transport.

- `transport.kind: "websocket"` is the recommended and practical mode.
- `transport.kind: "stdio"` is **not a direct stdio pipe** to the editor.
- In this codebase, `stdio` mode still expects a **WebSocket bridge URL**.

For local stdio language servers, use an **AXS bridge** (`launcher.bridge`) and keep transport as websocket.

::: warning
`stdio` with only `transport.command` is not enough in Acode.  
You still need a WebSocket bridge endpoint (AXS or equivalent) for the client connection.
:::

## Recommended Setup (Local Server via AXS Bridge)

```js
lsp.registerServer(
  {
    id: "typescript-custom",
    label: "TypeScript (Custom)",
    languages: ["javascript", "javascriptreact", "typescript", "typescriptreact", "tsx", "jsx"],
    transport: {
      kind: "websocket",
      // url can be omitted when using launcher.bridge auto-port mode
    },
    launcher: {
      bridge: {
        kind: "axs",
        command: "typescript-language-server",
        args: ["--stdio"],
      },
      checkCommand: "which typescript-language-server",
      install: {
        command:
          "apk add --no-cache nodejs npm && npm install -g typescript-language-server typescript",
      },
    },
    enabled: true,
    initializationOptions: {
      provideFormatter: true,
    },
  },
  { replace: true },
);
```

## Remote/External WebSocket Server

```js
lsp.registerServer({
  id: "remote-lsp",
  label: "Remote LSP",
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

## API Reference

### `registerServer(definition, options?)`

- `options.replace?: boolean` (default `false`)
  - `false`: existing server with same id is kept
  - `true`: existing server is replaced

Definition fields commonly used:

- `id` (required): normalized to lowercase
- `label` (optional)
- `languages` (required): non-empty array, normalized to lowercase
- `enabled` (optional, default `true`)
- `transport` (required)
  - `kind`: `"websocket"` or `"stdio"` (see transport note above)
  - `url?: string`
  - `command?: string` (required by registry validation when using `stdio`)
  - `args?: string[]`
  - `options?: { binary?, timeout?, reconnect?, maxReconnectAttempts? }`
- `launcher` (optional)
  - `startCommand?: string | string[]`
  - `command?: string`
  - `args?: string[]`
  - `checkCommand?: string`
  - `install?: { command?: string }`
  - `bridge?: { kind: "axs", command: string, args?: string[], port?: number, session?: string }`
- `initializationOptions?: object`
- `clientConfig?: object`
- `startupTimeout?: number`
- `capabilityOverrides?: object`
- `rootUri?: (uri, context) => string | null`
- `resolveLanguageId?: (context) => string | null`
- `useWorkspaceFolders?: boolean`

### Other Registry Methods

- `unregisterServer(id)`
- `updateServer(id, updater)`
- `getServer(id)`
- `listServers()`
- `getServersForLanguage(languageId, options?)`

```js
const jsServers = lsp.getServersForLanguage("javascript");

lsp.updateServer("typescript-custom", (current) => ({
  ...current,
  enabled: false,
}));
```

`getServersForLanguage` options:

- `includeDisabled?: boolean` (default `false`)

## Client Manager

- `clientManager.setOptions(options)`
- `clientManager.getActiveClients()`

```js
lsp.clientManager.setOptions({
  diagnosticsUiExtension: [],
});

const activeClients = lsp.clientManager.getActiveClients();
console.log(activeClients);
```
