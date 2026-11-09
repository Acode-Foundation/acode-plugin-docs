---
description: Add autocomplete, diagnostics, hover docs, go to definition and rename to Acode with language servers.
---

# Language Servers

Language servers give the editor code intelligence: autocomplete, errors and warnings, hover documentation, signature help, inlay hints, formatting, go to definition, find references and rename. Acode speaks the Language Server Protocol (LSP), so it works with the same servers other editors use.

## Opening the Settings

Go to **Settings** > **Language Servers**.

The page has three groups:

| Group | What it lists |
| :---- | :------------ |
| **Built-in servers** | Servers Acode knows how to install and start for you. |
| **Plugin servers** | Servers added by installed plugins. |
| **Custom servers** | Servers you registered yourself, plus **Add custom server**. |

Enabled servers are listed first. Under each name you can see the languages it handles and where it is installed from (for example `python • pip`).

## How Servers Run

- **Web Worker** servers run inside Acode itself. They need no setup and work in any folder.
- **STDIO** servers are programs that run in Acode's built-in [Terminal](./terminal). Install the terminal first; Acode then installs the server inside it with `apk`, `npm`, `pip`, `cargo` or a release download.

When you open a file whose server is enabled but not installed, Acode posts a notification: **"… language server is not installed. Tap to install."** Tap it to install the server in the terminal.

## Built-in Servers

| Server | Languages | Runs as | On by default |
| :----- | :-------- | :------ | :-----------: |
| HTML (Web Worker) | html, vue, svelte | Web Worker | ✓ |
| CSS (Web Worker) | css, scss, less | Web Worker | ✓ |
| JSON (Web Worker) | json, jsonc | Web Worker | ✓ |
| TypeScript / JavaScript (Web Worker) | javascript, typescript, jsx, tsx | Web Worker | ✓ |
| Python (ty) | python | pip | ✓ |
| Go (gopls) | go, go.mod, go.sum, gotmpl | apk | ✓ |
| Rust (rust-analyzer) | rust | apk | ✓ |
| C / C++ (clangd) | c, cpp | apk | |
| Python (pylsp) | python | pip | |
| TypeScript / JavaScript (vtsls) | javascript, typescript, jsx, tsx | npm | |
| TypeScript 7 / JavaScript (Native STDIO) | javascript, typescript, jsx, tsx | npm | |
| ESLint | JavaScript, TypeScript, Vue, Svelte, HTML, Markdown, JSON | npm | |
| HTML / CSS / JSON (STDIO) | same as the Web Worker versions | npm | |
| Tailwind CSS | html, jsx, tsx, svelte, astro | manual | |
| Luau | luau | release download | |

::: tip
Turn on only one server per language unless they do different jobs. ESLint, for example, is meant to run next to a TypeScript server.
:::

## Server Settings

Tap a server to open its page.

| Setting | What it does |
| :------ | :----------- |
| **Enabled** | Turn the server on or off. |
| **Startup timeout** | How long Acode waits for the server to start before giving up. |
| **Installation status** | Shows whether the server is installed, and its version when known. |
| **Install / repair** | Install the server, or reinstall it if it is broken. |
| **Update server** | Update the server when it has an update command. |
| **Uninstall server** | Remove the packages or binaries the server installed. |
| **Edit initialization options** | Server-specific options, as JSON, sent when the server starts. |
| **View initialization options** | The options the server actually receives, including defaults. |
| **Features** | Turn individual features on or off: hover information, code completion, signature help, diagnostics, inlay hints and formatting. |

## Using a Server in the Editor

Once a server is running for the current file:

- **Suggestions, hover and signature help** appear as you type and tap.
- **Errors and warnings** are underlined in the editor. Open the **Problems** list with `Ctrl` + `Shift` + `M`, or the Problems side button, and tap an entry to jump to it.
- **Select a word** and open the selection menu for **Code Actions** (quick fixes) and **LSP Actions**: go to definition, declaration, implementation or type definition, find references and rename symbol.
- **LSP Info** in the file menu (the pencil icon in the header) shows which servers are attached to the file and their status.

| Command | Shortcut |
| :------ | :------- |
| Go to definition | `F12` |
| Find all references | `Shift` + `F12` |
| Go to next / previous diagnostic | `F8` / `Shift` + `F8` |
| Show problems | `Ctrl` + `Shift` + `M` |
| Format document (Language Server) | `Alt` + `Shift` + `F` |
| Rename symbol, Go to symbol in document | [Command Palette](./command-palette) |

All of these are in the Command Palette, and you can rebind them in [Keybindings](./keybindings).

## Folders Outside the Terminal

STDIO servers run inside the terminal, which can only see the terminal's own files and public storage folders. Folders opened through the Android file picker (SAF), other external locations and [remote](./remote-access) folders are skipped by default.

If you still want to try a server on them, turn on **Run LSP on external folders** at the top of the Language Servers page. The server then works on cached or virtual paths, so some features may not work correctly.

## Adding a Custom Server

Tap **Add custom server** and answer the prompts:

1. **Server ID** and **Server label**.
2. **Language IDs**, comma separated (for example `python` or `javascript, typescript`).
3. **Transport**:
   - **STDIO** launches a command in the terminal. Enter the **Binary command** and its **Binary args** as a JSON array, for example `["--stdio"]`.
   - **WebSocket** connects to a server that is already running. Enter a `ws://` or `wss://` URL.
4. For STDIO servers, choose an **install method** (APK, npm, pip or Cargo packages, a custom shell command, or a manual binary) and optionally an update command and a check command.

Custom servers show up under **Custom servers**, where you can edit them like built-in ones or remove them with **Remove custom server**.

::: tip For plugin developers
Plugins can register their own servers with the [LSP API](/docs/advanced-apis/lsp). They appear under **Plugin servers**.
:::
