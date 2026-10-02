---
lang: en-US
title: Create Acode Plugin
---

# Create Acode Plugin

## Overview

Acode opens up a world of possibilities with its extensibility through plugins. In this guide, you'll learn how to create plugins using JavaScript, with the added option of TypeScript. Whether you're customizing your coding experience or adding entirely new features, creating plugins for Acode is a straightforward and rewarding process.

## Plugin Structure

Acode plugins follow a specific structure within a zip file. The necessary components include:

1. **plugin.json:**

   - Contains crucial information about the plugin, such as its name, version, author, and more.

2. **main.js:**

   - The heart of the plugin, this file contains the actual plugin code.

3. **readme.md:**
   - Contains the description or about plugin

4. **changelogs.md:**
   - contains changelogs of your plugin updates.

`plugin.json` must be at the **root** of the zip: Acode reads it from the archive root and refuses the install otherwise. The full field reference lives in [Manifest — `plugin.json`](../plugin-essentials/manifest.md), and the entry file is covered in [Plugin Main File](../plugin-essentials/core-file.md).

## Minimal Plugin From Scratch <Badge type="tip" text="new" />

If you would rather skip the templates, this is the smallest plugin Acode will load.

```text
my-plugin/
├── plugin.json
└── main.js
```

::: code-group
```json [plugin.json]
{
	"id": "com.example.plugin",
	"name": "Example Plugin",
	"main": "main.js",
	"version": "1.0.0",
	"readme": "readme.md",
	"icon": "icon.png",
	"author": {
		"name": "Example Author"
	}
}
```

```js [main.js]
import plugin from "../plugin.json";

if (window.acode) {
	acode.setPluginInit(plugin.id, async (baseUrl, $page) => {
		const commands = acode.require("commands");

		commands.addCommand({
			name: "example-plugin",
			description: "Open the example plugin page",
			bindKey: { win: "Ctrl-Alt-E", mac: "Command-Alt-E" },
			exec: () => {
				$page.innerHTML = "<h1>Example Plugin</h1>";
				$page.show();
				return true;
			},
		});
	});

	acode.setPluginUnmount(plugin.id, () => {
		acode.require("commands").removeCommand("example-plugin");
	});
}
```
:::

Notes on that shape, taken from the loader:

- `import plugin from "../plugin.json"` is a bundler feature, used by the official templates. If you hand-write `main.js` with no bundler, inline the id as a string — Acode never reads the id out of your script, it only uses the folder name and your `plugin.json`.
- The `init` callback receives `(baseUrl, $page, options)`, where `options` is `{ cacheFileUrl, cacheFile, firstInit, ctx, fileIcons }`. This example only uses `$page`; [Plugin Main File](../plugin-essentials/core-file.md) documents every option.
- `init` is awaited by Acode, so it may be `async`. `setPluginInit`'s third argument (`{ list, cb }`) is optional and adds a settings page for your plugin.
- `main.js` is injected as a plain `<script>` tag, so only the callbacks you register participate in Acode's lifecycle. Keep the rest of your code inside them.

## Packaging The Plugin Zip <Badge type="tip" text="new" />

The zip must contain `plugin.json` **at the root** — not inside a folder:

```text
plugin.zip            <- the file you install
├── plugin.json       <- root, required
├── main.js           <- or whatever `main` points to
├── icon.png          <- what `icon` points to
├── readme.md
└── changelogs.md
```

:::danger
Zipping the containing folder (so the zip contains `my-plugin/plugin.json`) makes the install fail: Acode looks for `plugin.json` in the archive root and reports `Invalid Plugin`.
:::

While installing, Acode normalizes what it finds:

| Manifest field | Behaviour when the file is missing |
| --- | --- |
| `main` | Patched to `main.js`; if that is also missing, the install fails with `Invalid Plugin` |
| `icon` | Patched to `icon.png` |
| `readme` | Patched to `readme.md` |
| `changelogs` | Left as declared — ship the file or drop the field |

Zip entry paths are sanitized before extraction: absolute entries (leading `/`, network paths, `C:/`-style roots) are skipped and reported as `Skipped N unsafe archive entries (e.g., …)`, and `..` segments cannot escape the plugin folder.

Files present in a previous install but absent from the new zip are deleted, so an update replaces the plugin folder instead of merging into it.

## Plugin Templates

To make your journey smoother, we provide comprehensive plugin templates, which are preconfigured and catering to various use cases:

1. **[JavaScript Template](https://github.com/Acode-Foundation/acode-plugin)** <Badge type="tip" text="official" /> : Javascript based template for plugin development and comes preconfigured

2. **[TypeScript Template](https://github.com/Acode-Foundation/AcodeTSTemplate)** <Badge type="tip" text="official" /> : Typescript template for plugin development and comes with type checking and all typescript feature

## Getting Started

1.  **Clone the Plugin Template:**

    - Choose the template that suits your needs and clone it.

2.  **Customize plugin.json:**

    - Open the `plugin.json` file and update it with your plugin's information.

3.  **Install the dependency:**

    - Install the required dependency by your package manager but first navigate to the plugin template folder by `cd acode-template`

    ::: code-group
    ```sh [npm]
    $ npm install
    ```

    ```sh [pnpm]
    $ pnpm install
    ```

    ```sh [yarn]
    $ yarn install
    ```

    ```sh [bun]
    $ bun install
    ```
    :::

4.  **Develop Locally:**

    - Use given commands to initiate a development server that watches for changes.
    - The development server automatically creates a plugin zip file, ready for installation.
    
    ::: code-group
    ```sh [npm]
    $ npm run dev
    ```

    ```sh [pnpm]
    $ pnpm dev
    ```

    ```sh [yarn]
    $ yarn dev
    ```

    ```sh [bun]
    $ bun run dev
    ```
    :::

    - Or you can build every time manually on changes using(this will build production build):

    ::: code-group
    ```sh [npm]
    $ npm run build
    ```

    ```sh [pnpm]
    $ pnpm build
    ```

    ```sh [yarn]
    $ yarn build
    ```

    ```sh [bun]
    $ bun run build
    ```
    :::

5.  **Install the Plugin:**

    - Use the **REMOTE** option in Acode's plugin manager.
    - This option is available on both sidebar extension tab or on Plugin page from settings.
    - Provide the plugin URL (e.g., `http://\<ip\>:3000/dist.zip`) when prompted.
    - Or if you are building manually then you can use the **Local** option in Acode's plugin manager and select the plugin zip

:::info
Development server will only build the zip on file changes
:::

:::tip 
For local development, start a dev server using `npm run dev`. In Acode, use the **Remote** option, either from the **sidebar** or the **plugin page**. Enter the server URL, hit **Install**, and the plugin will be installed.  

It's more convenient to manage this from the sidebar. When you install a local plugin(either using url or selecting the zip), Acode will add a **reload** icon in the **Extensions** tab of the sidebar. This is useful because the server automatically builds the plugin ZIP when changes are made. Simply press the reload button to apply the latest changes instantly.  

This makes plugin development a much smoother experience—previously, it was quite frustrating, but this feature was recently added to improve the workflow.
:::

## Testing The Plugin <Badge type="tip" text="new" />

Acode installs a plugin from three kinds of source, and both entry points — *Settings → Plugins* and the sidebar's **Extensions** tab — accept the same two inputs: a **Remote** URL, or a **Local** file picked in the file browser.

| Source | What you give Acode | Notes |
| --- | --- | --- |
| Remote | A URL to your `plugin.zip` | Downloaded with the Cordova HTTP client, so it can be any `http(s)`, `file`, or `content` URL |
| Local | A file picked in the file browser | The selected `content://` / `file://` path is used directly |
| Registry | A plugin id from the plugin list | Downloads the published zip from the Acode API |

After the files are extracted, Acode loads the plugin immediately — there is no restart. A loader dialog shows the download/extract progress, and any error is surfaced as a toast.

:::warning
The **reload** icon in the sidebar's **Extensions** list only appears for plugins installed from a URL or a picked file. Acode stores that source in the manifest as `source`, and the icon re-runs the install from it. Plugins installed from the registry have no `source`, so there is nothing to reload.
:::

## Debugging <Badge type="tip" text="new" />

Plugin failures are reported to the Acode console — open it from **Settings → Advanced → Console**, or run `acode.exec("console")` from another plugin. Turn on **Settings → Advanced → Developer mode** if you also want the in-app developer tools loaded at startup. Then reinstall your plugin and read the log — these are the exact strings Acode emits, so you can search for them:

```text
Failed to load script for plugin <id>: <error.message | error>
Plugin load timeout
Error loading plugin <id>: <error>
Error while calling unmount callback for plugin "<id>"
Command registration skipped: missing name
Command registration skipped for "<name>": exec must be a function.
Command "<name>" failed
Failed to add command <name>
Plugin installer: skipped unsafe absolute paths in archive: <list>
```

What they mean:

- **`Failed to load script for plugin <id>`** — the `<script>` tag for your entry file failed to load or execute. Usually a wrong `main` path or a syntax error in the bundle.
- **`Plugin load timeout`** — `init` did not settle within 15 seconds. Move slow work out of `init`.
- **`Error loading plugin <id>`** — the batch loader caught a rejected load; the full error object follows.
- **`Command registration skipped …`** — the command was silently ignored. `name` and `exec` are both required.
- **`Command "<name>" failed`** — your `exec` threw; Acode catches it so one bad command cannot crash the palette.

:::tip
If your plugin stops loading after an update, it was probably auto-disabled: Acode disables a plugin that throws, shows it switched off in the plugin list, and skips it on every later start. Toggle it back on (or reinstall) once you have fixed the error. See [Understanding How Plugins Work → Failure Behavior](./understanding-plugin.md#failure-behavior-you-should-know).
:::

## Creating Plugins with the CLI<Badge type="warning" text="community" />

You can also quickly scaffold new Acode plugins using the [Acode Plugin CLI](https://github.com/itsvks19/acode-plugin-cli). This tool provides an interactive wizard to generate a plugin project from the official JavaScript or TypeScript templates.

### Installation

If you have Rust installed, you can install the CLI with:

```bash
cargo install acode-plugin-cli
```

### Usage

Run the CLI in your terminal:

```bash
acode-plugin-cli
```

The wizard will guide you to:

- Choose plugin name, ID, version, and description
- Enter author information
- Pick license and keywords
- Select JavaScript or TypeScript template

After completion, your plugin folder will be ready to use.

## Building and Publishing

To share your plugin with the Acode community, follow these steps:

1. **Bundle for production:**

   - Use `build` command to create a production build. which will be lower in size

   ::: code-group

    ```sh [npm]
    $ npm run build
    ```

    ```sh [pnpm]
    $ pnpm build
    ```

    ```sh [yarn]
    $ yarn build
    ```

    ```sh [bun]
    $ bun run build
    ```
    :::

2. **Publish:**

   - Publish your release build on [Acode's](https://acode.app) official website, making your plugin accessible to the broader community.

   - Tutorial for publishing a plugin : [Youtube](https://youtube.com/shorts/cxF2pxyN1HM?si=kQ5_BRtIO2RU-zhb)

## Tutorial

- Checkout a small tutorial of 👉 [How to create Acode Plugins?](https://youtu.be/ls--txHX3RQ?si=ZSvJMsb1KFeQA8zd)

## Customization

Certainly! You have the flexibility to either utilize your own template or start your plugin from scratch. Additionally, you're free to employ alternative bundlers and tools. We'll delve deeper into these customization possibilities in subsequent sections.

Happy coding, and may your plugins bring new dimensions to your Acode experience! 🚀✨
