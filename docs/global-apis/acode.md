---
title: Acode
description: "The global acode object: register plugins, load modules, and more."
---

# Acode

## window.acode or acode

The `acode` object is the global object that provides access to the **Acode API**. You can use this object to access the API methods.

## Methods

### `setPluginInit(pluginId, init, settings?)`

Registers the function Acode calls to start your plugin. See [Understanding Plugins](../getting-started/understanding-plugin.md) for when it runs.

| Parameter | Type | Description |
| --- | --- | --- |
| `pluginId` | `string` | The `id` from your `plugin.json`. |
| `init` | `(baseUrl, $page, options) => void \| Promise<void>` | Called when the plugin loads. See [`init` arguments](#init-arguments). |
| `settings` | `PluginSettings` | Optional. Adds a settings page for your plugin. See [Plugin settings](#plugin-settings). |

```js
acode.setPluginInit("com.example.plugin", async (baseUrl, $page, options) => {
  const commands = acode.require("commands");
  commands.addCommand({
    name: "example-plugin",
    bindKey: { win: "Ctrl-Alt-E", mac: "Command-Alt-E" },
    exec: () => {
      $page.innerHTML = `<h1>Example Plugin</h1>`;
      $page.show();
    },
  });
});
```

#### `init` arguments

| Argument | Type | Description |
| --- | --- | --- |
| `baseUrl` | `string` | Internal URL of your plugin folder. Use it to load files that ship with the plugin. It may not end with `/`; see [Understanding Plugins](../getting-started/understanding-plugin.md#recommended-main-js-shape). |
| `$page` | `WcPage` | A page object that facilitates the display of content within Acode. |
| `options.cacheFileUrl` | `string` | Internal URL of your plugin's cache file. |
| `options.cacheFile` | `fsOperation` | File handle for the cache file. Use its `readFile()` and `writeFile()` methods. |
| `options.firstInit` | `boolean` | `true` only on the run right after the plugin was installed. |
| `options.ctx` | `PluginContext \| null` | Encrypted secret storage and permission checks. May be `null` if the trusted native session is unavailable, so check it before use. See [Plugin Context](../plugin-essentials/plugin-context.md). |
| `options.fileIcons` | `object` | Plugin-bound [File Icons](../utilities/file-icons.md) API. Same as `acode.require("fileIcons")` called from your main script. Available from versionCode `1012`. |

#### Plugin settings

Pass a third argument to give your plugin a settings page under **Settings → Plugins → your plugin**.

```ts
{
  list: SettingItem[],
  cb: (key: string, value: any) => void
}
```

`cb` runs when the user changes an item. You are responsible for saving the value, for example with the [Settings](../editor-components/settings.md) module.

**`SettingItem` fields**

| Field | Type | Description |
| --- | --- | --- |
| `key` | `string` | **Required.** Identifier passed to `cb`. |
| `text` | `string` | **Required.** Label. |
| `info` | `string` | Description shown under the label. |
| `value` | `any` | Current value. |
| `valueText` | `(value) => string` | Turns `value` into the text displayed for it. |
| `icon` | `string` | Icon class shown on the row. |
| `iconColor` | `string` | Color of that icon. |
| `category` | `string` | Groups items under a heading. |
| `hidden` | `boolean` | Hide the item. |

Set exactly one of the following to choose how the user edits the item:

| Field | Type | Editing UI |
| --- | --- | --- |
| `checkbox` | `boolean` | Selects a checkbox UI and also supplies its initial checked state when truthy. Set it to the current boolean value, or set it to `false` and use `value` for the initial state. The value passed to `cb` is `true` or `false`. |
| `select` | `Array<string \| [value, text]>` | A [select](../ui-components/dialogs/select.md) dialog. |
| `prompt` | `string` | A [prompt](../ui-components/dialogs/prompt.md) with this text as the message. |
| `promptType` | `string` | Input type of that prompt (default `text`). Only with `prompt`. |
| `promptOptions` | `object` | [Prompt options](../ui-components/dialogs/prompt.md#options) such as `match`, `required`, `placeholder` and `test`. Only with `prompt`. |
| `color` | `boolean` | A [color picker](../ui-components/dialogs/color-picker.md). |
| `file` / `folder` | `boolean` | The file browser, in file or folder mode. The value is the chosen URL. |
| `link` | `string` | Opens this URL in the browser. `cb` is not called. |

```js
acode.setPluginInit(
  plugin.id,
  init,
  {
    list: [
      { key: "enabled", text: "Enable feature", checkbox: true, value: true },
      { key: "port", text: "Port", prompt: "Port number", promptType: "number", value: 8080 },
      { key: "mode", text: "Mode", select: ["fast", "safe"], value: "safe" },
    ],
    cb: (key, value) => save(key, value),
  },
);
```

### `setPluginUnmount(pluginId, unmount)`

Registers the function Acode calls when your plugin is disabled, uninstalled or reloaded. Use it to remove everything `init` added: commands, listeners, timers, UI elements and registered formatters.

Synchronous errors thrown by `unmount` are caught and logged, so they will not stop the plugin from unloading. Acode does not await the handler: if an `async` handler rejects, that rejection is not caught and may become an unhandled rejection. Acode also deletes your plugin's cache file after calling `unmount`.

**Example:**

```js
acode.setPluginUnmount("com.example.plugin", () => { // [!code focus]
  const commands = acode.require("commands");
  commands.removeCommand("example-plugin");
});
```

### `define(moduleName, module)`

Registers a module that other plugins can load with [`require`](#require-modulename). Module names are case-insensitive. Defining a name that already exists replaces the module, so prefix your names (for example `"my-plugin.utils"`) to avoid clashing with built-ins.

**Example:**

```js{1-5}
acode.define("say-hello", {
  hello: () => {
    console.log("Hello World!");
  },
});

// You can access the module using the module name

acode.require("say-hello").hello(); // Hello World!
```

### `require(moduleName)`

This method is used to require a module. This method takes one parameter, `moduleName`. The `moduleName` is the name of the module. Module name is case insensitive.

**Example:**

```js{1}
acode.require("say-hello").hello(); // Hello World!
```

### `exec(command, value?)`

Runs one of Acode's built-in app commands (the ones defined in Acode's `src/lib/commands.js`) and returns its result, or `false` if no command has that name. This is different from the [Commands API](../utilities/commands.md), which registers your own editor commands.

**Example:**

```js
acode.exec("console"); // Opens the console
```

### `registerFormatter(pluginId, extensions, format, displayName?)`

Registers a code formatter. Users choose it per language in **Settings → Formatter**.

- `extensions`: file extensions the formatter supports, for example `["js", "ts"]`. An empty array or missing value means all files (`"*"`).
- `format`: function that formats the active file. It receives no arguments and should modify the editor itself.
- `displayName`: name shown in the formatter picker. Always pass it; there is no fallback, so the picker shows no name without it.

**Example:**

```js
acode.registerFormatter("com.example.plugin", ["js"], () => { // [!code focus]
  // formats the active file if supported
  const view = editorManager.editor;
  const text = view.state.doc.toString();
  // format the text
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: text }
  });
});
```

### `unregisterFormatter(pluginId)`

Removes the formatter registered with `pluginId` and clears it from any language where the user had selected it. Call it from your unmount handler.

### `format(selectIfNull = true): Promise<boolean>`

Formats the active editor file using the selected formatter for the current mode.

- `selectIfNull` (optional): when `true`, Acode opens formatter selection if none is configured.

Returns `true` when formatting succeeds, otherwise `false`.

```js
await acode.format();
```

### `formatters: Array<{ id: string, name: string, exts: string[] }>`

List of registered formatters.

```js
console.log(acode.formatters);
```

### `getFormatterFor(extensions: string[]): Array<[string | null, string]>`

Returns formatter options for the given extensions.

```js
const options = acode.getFormatterFor(["js", "ts"]);
```

### `addIcon(iconName, iconSrc, options?)`

Registers a CSS class that shows an image as an icon.

- `iconName`: the class name to create.
- `iconSrc`: URL or data URI of the image.
- `options.monochrome`: when `true`, the image is used as a mask and takes the current text color, so an SVG follows the theme. Otherwise the image keeps its own colors.

::: info 
The `options.monochrome` is added in versionCode `967`.
:::

**Example:**

```js
acode.addIcon("my-icon", "https://example.com/icon.png");
```

Later you can use the icon by adding to class name my-icon to an element.

**Example:**

```html
<i class="icon my-icon"></i>
```

### `toInternalUrl(url)`

Converts a `file://` URL into an internal URL that `fetch`, `<img>` and `<script>` can load. Returns a `Promise<string>`.

```js
const src = await acode.toInternalUrl("file:///storage/emulated/0/photo.png");
image.src = src;
```

### `pushNotification(title: string, message: string, options?: Object)` <Badge type="tip" text="v954+" />

Displays a notification in Acode with a title, message and optional configuration.

The options parameter accepts the following properties:

* `icon?: string` - Icon for the notification. Can be a URL, base64 encoded image, icon class or SVG string
* `autoClose?: boolean` - Whether notification should auto close. Defaults to true
* `action?: Function` - Callback function when notification is clicked
* `type?: string` - Type of notification - can be 'info', 'warning', 'error' or 'success'. Defaults to 'info'

**Example:**

```js
acode.pushNotification(
  "Hello",
  "This is a notification",
  {
    icon: "my-icon",
    autoClose: false,
    action: () => {
      console.log("Notification clicked!");
    },
    type: "success"
  }
);
```

::: info
Requires version code `954` or above
:::

### `installPlugin(pluginId: string, installerPluginName: string): Promise<void>` <Badge type="tip" text="v954+" />

Installs an Acode plugin from registry with its id by the consent of user.

**Example:**

```js
await acode.installPlugin("com.example.pluginid", "mypluin.id");
```

::: info
This api is added in `v1.10.6` , versionCode: `954`
:::


### `newEditorFile(filename: string, options?: FileOptions): void`
::: warning
Requires version code `958` or above
:::

Creates a new EditorFile instance and adds it to the editor.

**Parameters:**

* `filename: string` - Name of the file
* `options?: FileOptions` - File creation options (see [EditorFile API](../editor-components/editor-file.md#fileoptions) for details)

**Example:**

```js
acode.newEditorFile("example.js", {
  text: 'console.log("Hello World");',
  editable: true,
});
```

::: tip
This method is equivalent to calling `new EditorFile(filename, options)`.
:::

::: info
This API was added in `v1.11.0` (versionCode: `956`) and marked stable in `v1.11.2` (versionCode: `958`)
:::

### `waitForPlugin(pluginId: string): Promise<boolean>`

Resolves when the target plugin has loaded.

```js
await acode.waitForPlugin("com.example.other-plugin");
```

### `clearBrokenPluginMark(pluginId: string): void`

Clears a plugin's broken mark so it can be retried on next load.

```js
acode.clearBrokenPluginMark("com.example.plugin");
```

## Related APIs

- Commands API (preferred for adding/removing commands): [Commands](../utilities/commands.md)
- CodeMirror editor theme API: [Editor Themes](../utilities/editor-themes.md)
- Static CodeMirror highlighter (versionCode `1008+`): [Code Highlight](../utilities/code-highlight.md)
- File and folder icon packs (versionCode `1012+`): [File Icons](../utilities/file-icons.md)
- Language server API: [LSP](../advanced-apis/lsp.md)
- File handler API: [File Handlers](../advanced-apis/file-handlers.md)
- Terminal API: [Terminal](../advanced-apis/terminal.md)
