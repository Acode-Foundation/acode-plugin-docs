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
- `lsp.registerRuntimeProvider(...)`
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

## Custom URI Translation

Use `rootUri` and `documentUri` when the server does not see the same
filesystem layout as Acode.

Typical cases:

- the server runs in Termux
- the server runs behind a remote WebSocket bridge
- the editor opens files as `content://...` but the server expects `file://...`
- the default cache-file fallback does not point at the real project path

`rootUri` controls the workspace root sent during initialize and workspace
folder handling.

`documentUri` controls the URI used for opened documents, changes, formatting,
and similar file-scoped LSP requests.

Both hooks may be synchronous or async.

`documentUri(uri, context)` receives:

- `uri`: the original file URI known to Acode
- `context.normalizedUri`: Acode's default normalized URI, including
  `content:// -> file://` conversion or cache fallback when available
- the same context fields available to `rootUri`, such as `file`, `view`,
  `languageId`, and `rootUri`

Example:

```js
const lsp = acode.require("lsp");

const termuxWorkspaceUri =
  "file:///data/data/com.termux/files/home/projects/my-project";

function toTermuxDocumentUri(uri, fallbackUri) {
  if (typeof uri !== "string") return fallbackUri || null;

  if (uri.startsWith("file:///storage/emulated/0/")) {
    return uri.replace(
      "file:///storage/emulated/0/",
      "file:///data/data/com.termux/files/home/storage/shared/",
    );
  }

  return fallbackUri || uri;
}

const termuxServer = lsp.defineServer({
  id: "termux-typescript",
  label: "TypeScript (Termux)",
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
    url: "ws://127.0.0.1:2087/",
  },
  rootUri() {
    return termuxWorkspaceUri;
  },
  documentUri(uri, context) {
    return toTermuxDocumentUri(uri, context.normalizedUri);
  },
});

lsp.upsert(termuxServer);
```

## Definition API

### `lsp.defineServer(options)`

Builds a normalized server manifest for later registration.

Common fields:

- `id`: required, normalized to lowercase by the registry
- `label`: optional display label
- `runtimes`: optional array of runtime provider ids that this server can run in. (See [Register a Server For That Runtime](#register-a-server-for-that-runtime) for an example)
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
- `rootUri`: optional workspace-root resolver; if provided it takes precedence
  over Acode's default root detection
- `documentUri`: optional document URI resolver for translating file paths before
  they are sent to the server
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

### `lsp.registerRuntimeProvider(provider, options={ replace?: false })`

Registers a Runtime Provider

> [!Note]
> Plugins that provide a runtime should usually also register their own server definitions (For Example, see [Register a Server For That Runtime](#register-a-server-for-that-runtime)) for that runtime. Do not rely on taking over Acode's built-in server definitions.

Common Fields (`provider`):
> This are the provider options.
- `id`: required, normalized to lowercase by the registry
- `label`: (optional) display label
- `priority`: (optional) number, defaults to `0`. Higher numbers are preferred when multiple providers are available for the same runtime.
- `canHandle(server, context)`: (optional) function that returns a boolean indicating whether this provider can handle the given server and context.
- `checkInstallation(server, context)`: (optional) async function that returns an object with the following fields:
  - `status`: one of `"present"`, `"missing"`, or `"unknown"`
  - `version`: (optional) string indicating the version of the runtime
  - `canInstall`: (optional) boolean indicating whether the runtime can be installed
  - `canUpdate`: (optional) boolean indicating whether the runtime can be updated
- `install(server, context, mode)`: (optional) async function that installs the runtime. 
  > The `mode` parameter is one of `"install"`, `"update"`, or `"reinstall"`.
- `start(server, context)`: (optional) async function that starts the runtime. 
   - Method is expected to return an object with the following fields:
     - `kind`: one of `"websocket"`, `"transport"`
     - `providerId`: string indicating the id of the provider that started the runtime. This is useful for tracking which provider is responsible for a given runtime (mostly the same `id` of current runtime provider).
     - `url`: (optional) string indicating the URL of the runtime. This is only required if `kind` is `"websocket"`.
     - `transport`: (optional) object indicating the transport handle. This is only required if `kind` is `"transport"`.
     - `dispose`: async function that disposes the runtime. 

::: details Example ⤵️
```js
const lsp = acode.require("lsp");

lsp.registerRuntimeProvider({
	id: "proot-distro:debian",
	label: "Debian Distro",
	priority: 10,

	canHandle(server, context) {
		return (
			Array.isArray(server.runtimes) &&
			server.runtimes.includes("proot-distro:debian")
		);
	},

	async checkInstallation(server, context) {
		// Run inside your runtime.
		// Return: present, missing, failed, or unknown.
		return {
			status: "present",
			version: null,
			canInstall: true,
			canUpdate: true,
		};
	},

	async install(server, context, mode) {
		// Install/update inside your runtime.
		return true;
	},

	async start(server, context) {
		// Start the server and return either a WebSocket URL or a TransportHandle.
		return {
			kind: "websocket",
			providerId: "proot-distro:debian",
			url: "ws://127.0.0.1:45130/",
			dispose: async () => {
				// Stop your process if you own it.
			},
		};
	},
});
```
:::

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

## LSP Runtime Provider Plugin API
This API lets plugins run language servers outside Acode's built-in Alpine runtime.

Normal users should not need to choose a runtime manually. Built-in Acode language servers continue to use the built-in Alpine runtime for terminal-accessible files. A plugin runtime is used only by language server definitions that explicitly opt into it.

### Concepts
  An LSP setup has two separate parts:

- **Server definition**: which language server exists, which languages it supports, and how it is installed/launched.
- **Runtime provider**: where that server runs, for example built-in Alpine, a plugin-managed distro, Termux, or an external WebSocket process.

Plugins that provide a runtime should usually also register their own server definitions for that runtime. Do not rely on taking over Acode's built-in server definitions.

### Register a Runtime Provider (Example)
> Check the [lsp.registerRuntimeProvider()](#lsp-registerruntimeprovider-provider-options-replace-false) section for details on the available options.

```js
const lsp = acode.require("lsp");

lsp.registerRuntimeProvider({
	id: "proot-distro:debian",
	label: "Debian Distro",
	priority: 10,

	canHandle(server, context) {
		return (
			Array.isArray(server.runtimes) &&
			server.runtimes.includes("proot-distro:debian")
		);
	},

	async checkInstallation(server, context) {
		// Run inside your runtime.
		// Return: present, missing, failed, or unknown.
		return {
			status: "present",
			version: null,
			canInstall: true,
			canUpdate: true,
		};
	},

	async install(server, context, mode) {
		// Install/update inside your runtime.
		return true;
	},

	async start(server, context) {
		// Start the server and return either a WebSocket URL or a Transport Kind.
		return {
			kind: "websocket",
			providerId: "proot-distro:debian",
			url: "ws://127.0.0.1:45130/",
			dispose: async () => {
				// Stop your process if you own it.
			},
		};
	},
});
```

### Register a Server For That Runtime

The important field is `runtimes`. Without it, a plugin runtime will not auto-claim the server.

```js
lsp.register({
	id: "debian-typescript",
	label: "TypeScript (Debian)",
	languages: ["javascript", "typescript", "jsx", "tsx"],
	runtimes: ["proot-distro:debian"],
	transport: {
		kind: "stdio",
		command: "typescript-language-server",
		args: ["--stdio"],
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
			packages: ["typescript", "typescript-language-server"],
			executable: "typescript-language-server",
		},
	},
});
```

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
- If your server runs outside Acode's local filesystem view, define both `rootUri`
  and `documentUri` so the server receives paths it can resolve.

## Definitions

  ### `TransportHandle`
  > An Object used by the LSP client to manage the transport connection to a language server.

  Object Properties:
  - transport: An Object representing [Codemirror 6's LSP Transport](https://codemirror.net/docs/ref/#lsp-client.Transport)
  - dispose: An async function that cleans up the transport connection when the runtime is stopped or disposed.
  - ready: `Promise<void>` that resolves when the transport is ready for use.
  ---
  ### `TransportContext`
  > An Object that provides context information to the runtime provider when starting a language server.

  Object Properties:
  - uri: The URI of the file being edited in Acode.
  - file: `EditorFile` object representing the file being edited.
  - view: `EditorView` object representing the editor view.
  - languageId: The language ID of the file being edited.
  - rootUri?: `string | null` representing the workspace root URI, if available.
  - originalRootUri?: `string | null` representing the original workspace root URI before any translation, if available.
  - debugWebSocket?: `boolean` indicating whether the WebSocket connection should be in debug mode.
  - dynamicPort?: `number` Dynamically discovered port number for the language server, if applicable.
---

  ### `LSPRuntimeContext`
  > An Object that <u>extends</u> from `TransportContext` providing additional context information to the runtime provider when starting a language server.

  Object Properties:
  - All properties from `TransportContext`
  - documentUri?: `string | null` representing the document URI after any translation, if available.
  - originalDocumentUri?: `string` representing the original document URI before any translation, if available. 
  - serverId?: The ID of the language server being started.
  - workspaceKind?: `"app-private" | "builtin-alpine" | "termux-saf" | "saf" | "remote" | "proot-distro" | "virtual" | "unknown"` (**one** of the listed values) representing the kind of workspace the language server is running in.