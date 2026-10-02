---
lang: en-US
title: Acode Plugins
---
# Acode Plugins

> Welcome to the world of Acode plugins! 🚀


### What are Acode Plugins?

**Acode** plugins serve as powerful tools to enhance and extend the functionality of your **Acode editor**. Whether you're looking to introduce new features or tweak existing ones, plugins provide a flexible and customizable way to tailor Acode to your specific needs.

### Language Flexibility

Acode plugins are primarily written in JavaScript, offering a familiar and widely-used language for developers. Additionally, for those who prefer TypeScript, **good news 🥳** — Acode supports `TypeScript` for plugin development, providing the benefits of static typing and improved developer experience.

### Prerequisites <Badge type="tip" text="new" />

- **JavaScript** for your plugin logic. Acode injects your `main.js` as a plain `<script>`, so you write browser code — no build step is required.
- **CSS / HTML** for any UI you add. Acode's pages are DOM elements, so you set `innerHTML` and style them with your own stylesheet.
- The **`acode` global** (`window.acode`) — your gateway to the Acode API. Guard your registration with `if (window.acode)`.
- **`acode.require(name)`** for built-in modules such as `commands`, `fs`, `Url`, and `settings`. Names are case-insensitive, and `fileIcons` is the one module bound per plugin. Globals such as `editorManager` are plain `window` properties — read them directly, do not `require` them.

:::info
The Acode object is a global — you do not import it. `window.acode` is available by the time plugin scripts run, but keeping the `if (window.acode)` guard costs nothing and keeps the template working outside Acode.
:::

### What You Can Build <Badge type="tip" text="new" />

- **Commands and keybindings** in the command palette
- **Settings pages** for your plugin's own options
- **Editor tooling** — formatters, icon packs, syntax highlighting, language servers
- **UI surfaces** — sidebar apps, side buttons, context-menu entries, full pages
- **File handling** — custom file handlers, projects, file-type hooks
- **Integrations** — terminals, webviews, intents, and other plugins via `acode.waitForPlugin`

## Next Steps

- **[Create new plugin](./create-plugin.md)** — scaffold, build a zip, and install it
- **[Understanding Plugins](./understanding-plugin.md)** — the load/unload lifecycle, failure behavior, and troubleshooting
- **[Manifest — `plugin.json`](../plugin-essentials/manifest.md)** — every field the installer reads
- **[Plugin Main File](../plugin-essentials/core-file.md)** — writing and registering your entry file

## Installing Acode Plugins

Discovering and integrating plugins into your Acode editor is a simple and customizable process. There are multiple methods to install plugins, ensuring flexibility and convenience for developers. Before you proceed, it's essential to exercise caution when installing plugins from unknown sources, as they may potentially contain malicious code.

### Installation Methods:

1. **Local Installation:**
   - Download the plugin file(`.zip`) to your device.
   - Open Acode and navigate to **Settings**.
   - Click on **Plugins** and then the `'+'` icon.
   - Select **LOCAL** and choose the downloaded plugin file.

2. **Remote Installation:**
   - If you have a plugin file URL (e.g., a plugin file hosted on GitHub):
     - Open Acode and go to **Settings**.
     - Navigate to **Plugins** and click on the `'+'` icon.
     - Choose **REMOTE** and enter the plugin file URL.

3. **Acode Plugins Manager:**
   - Access the Acode **Settings** and click on **Plugins**.
   - Explore the available plugins and select the one you want.
   - Click on **Install** to seamlessly integrate the chosen plugin into your Acode editor.

4. **Acode SideBar:**
    - Click on three horizontal slashes from top left corner
    - Select plugin icon and Explore the plugins 


:::info

**Remembered Source:**
When you install from a URL or a picked file, Acode records that source in the installed `plugin.json` as `source`. That is why the sidebar's **Extensions** tab shows a reload icon for the plugin — pressing it re-runs the install from the same source. Uninstalling deletes the plugin folder along with that value, so a fresh install asks for the source again.
:::

:::danger

**Exercise Caution:**
It's crucial to exercise caution when installing plugins, especially from unfamiliar sources. Plugins have the potential to contain malicious code, so be discerning and opt for reputable and well-known plugins whenever possible.
:::

<br />
Your Acode journey has just begun. Dive in, experiment, and let your coding adventure flourish in this realm of endless possibilities! 🚀✨
