# Acode

## window.acode or acode

The `acode` object is the global object that provides access to the **Acode API**. You can use this object to access the API methods.

It is a single instance created in `src/lib/acode.js` and exported as the app global, so every method below is available on both `window.acode` and the bare `acode` identifier inside plugin scripts.

## Methods

### `setPluginInit(pluginId: string, init: Function, settings? Object)`

This method is used to register the plugin. This method takes two parameters, `pluginId` and init function. The `pluginId` is the ID of your plugin. The `init` function is the function that will be called when the plugin is loaded.

The optional third `settings` argument (`{ list, cb }`) is stored as a generated settings page under `acode.require("settings").uiSettings["plugin-<pluginId>"]`. Acode always builds it with `preserveOrder: true`, `pageClassName: "detail-settings-page"`, `listClassName: "detail-settings-list"`, `valueInTail: true` and `groupByDefault: true`. The page is removed again by [`unmountPlugin`](#unmountplugin-id-string-void).

**Example:**

```js
acode.setPluginInit('com.example.plugin', (baseUrl, $page, cache) => { // [!code focus]
  const commands = acode.require("commands");
  commands.addCommand({
    name: 'example-plugin',
    bindKey: { win: 'Ctrl-Alt-E', mac: 'Command-Alt-E' },
    exec: () => {
      $page.innerHTML = `
        <h1>Example Plugin</h1>
        <p>This is an example plugin.</p>
      `;
      $page.show();
    },
  });
});
```

**Example with an auto-generated settings page:**

```js
acode.setPluginInit(
  "com.example.plugin",
  (baseUrl) => {
    const settings = acode.require("settings");
    console.log(settings.value.examplePlugin);
  },
  {
    list: [
      {
        key: "examplePlugin",
        text: "Enable example feature",
        type: "switch",
        value: true,
      },
    ],
    cb(key, value) {
      const settings = acode.require("settings");
      settings.update({ [key]: value }, false);
    },
  },
);
```

### `init(baseUrl: string, $page: WCPage, options: object)`

When the init function is called, it will receive 3 parameters:

* `baseUrl: string` The base URL of the plugin. You can use this URL to access the files in the plugin directory.

* `$page: WcPage` This page object can be used to show content.

* `options: object` This object can be used to access the cached files.

   * `cacheFileUrl: string` Url of the cached file.

   * `cacheFile File: object` File object of the cached file. Using this object, you can write/read the file.
   * `firstInit: boolean` If this is the first time the plugin is loaded, this value will be true. Otherwise, it will be `false`.
   * `ctx: PluginContext | null` Your plugin's native context: encrypted secret storage and permission checks. It may be `null` if the trusted native session is unavailable, so guard it before use. See [Plugin Context (`ctx`)](../plugin-essentials/plugin-context.md).
   * `fileIcons` Plugin-bound [File Icons](../utilities/file-icons.md) API. Same instance as `acode.require("fileIcons")` captured in the main script. Available from **versionCode `1011`** (Acode v1.13.5).

### `Settings Object`

This parameter is optional. You can use this parameter to define the settings of the plugin. The settings will be displayed in the plugin page.

Settings requires the following properties

* `list: Array<object>` An array of settings.

   * `key: string` The key of the setting. This key will be used to access the value of the setting.

   * `text: string` The text of the setting. This text will be displayed in the settings page.

   * `icon?: string` The icon of the setting. This icon will be displayed in the settings page.

   * `iconColor?: string` The icon color of the setting. This icon color will be displayed in the settings page.

   * `info?: string` The info of the setting. This info will be displayed in the settings page.

   * `value?: any` The value of the setting. This value will be displayed in the settings page.

   * `valueText?: (value:any)=>string` The value text of the setting. This value text will be displayed in the settings page.

   * `checkbox?: boolean` If this property is set to true, the setting will be displayed as a checkbox.

   * `select?: Array<Array<string>|string>` If this property is set to an array, the setting will be displayed as a select. The array should contain the options of the select. Each option can be a string or an array of two strings. If the option is a string, the value and the text of the option will be the same. If the option is an array of two strings, the first string will be the value of the option and the second string will be the text of the option.

   * `prompt?: string` If this property is set to true, the setting will be displayed as a prompt.

   * `promptType?: string` The type of the prompt. This property is only used when the prompt property is set to true. The default value is text.

   * `promptOptions?: Array<object>` The options of the prompt. This property is only used when the prompt property is set to true and the promptType property is set to select.

     * `match: RegExp` The regular expression to match the value.

     * `required: boolean` If this property is set to true, the value is required.

     * `placeholder: string` The placeholder of the prompt.

     * `test: (value: any) => boolean` The test function to test the value.

* `cb: (key: string, value: any) => void` The callback function that will be called when the settings are changed.

### `setPluginUnmount(pluginId: string, unmount: Function)`

This method is used to set the unmount function. This function will be called when the plugin is unloaded. You can use this function to clean up the plugin.

**Example:**

```js
acode.setPluginUnmount("com.example.plugin", () => { // [!code focus]
  const commands = acode.require("commands");
  commands.removeCommand("example-plugin");
});
```

### `setLoadingMessage(message: string): void` <Badge type="tip" text="new" />

Sets the small status message shown on the app body by writing the `data-small-msg` attribute.

```js
acode.setLoadingMessage("Loading workspace…");
```

### `initPlugin(id: string, baseUrl: string, $page: WCPage, options?: object): Promise<void>` <Badge type="tip" text="new" />

Runs the init function previously stored by [`setPluginInit`](#setplugininit-pluginid-string-init-function-settings-object) for `id`. The function is awaited, so a rejected promise from `init` propagates to the caller. If no init function is registered for `id`, nothing happens.

```js
await acode.initPlugin("com.example.other-plugin", baseUrl, $page);
```

### `unmountPlugin(id: string): void` <Badge type="tip" text="new" />

Tears a plugin down. In order, it:

1. Calls the unmount function stored by [`setPluginUnmount`](#setpluginunmount-pluginid-string-unmount-function). If that function throws, the error is grouped and logged to the console instead of being propagated.
2. Deletes `CACHE_STORAGE/<id>` (only when an unmount function was registered).
3. Deletes `acode.require("settings").uiSettings["plugin-<id>"]`.
4. Calls `fileIcons.unregisterByPlugin(id)`, removing every icon pack registered by that plugin.

This is what the plugin management UI calls when a plugin is uninstalled or disabled.

```js
acode.unmountPlugin("com.example.plugin");
```

### `define(moduleName: string, module: any): void`

This method is used to define a module. This method takes two parameters, `moduleName` and module. The `moduleName` is the name of the module. The module is the module object. Module name is case insensitive because the name is stored with `name.toLowerCase()`. Defining the same name twice replaces the previous module.

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

### `require(moduleName: string): any`

This method is used to require a module. This method takes one parameter, `moduleName`. The `moduleName` is the name of the module. Module name is case insensitive because the lookup uses `module.toLowerCase()`. Unknown module names return `undefined`.

See [Available Modules](#available-modules) for the built-in list.

**Example:**

```js{1}
acode.require("say-hello").hello(); // Hello World!
```

::: warning
`"fileIcons"` is special-cased. `acode.require("fileIcons")` calls `fileIcons.getPluginApi(document.currentScript)`, which returns the API bound to the **calling plugin script**. If the script has no binding (for example when called from a nested module or after the plugin was unmounted) it throws:

`Require "fileIcons" in the plugin main script, or use options.fileIcons in the init callback`
:::

### `exec(command: string, value?: any)`

This method executes a command defined in file `src/lib/commands.js`. This method takes one or two parameters, `command` and `value`. The value returned by the command handler is passed through. If the command is not found, `false` is returned.

::: warning
Command names are **case sensitive**. The lookup is a plain `key in commands`, and the built-in commands use lowercase, dash-separated names such as `"save"`, `"close-all-tabs"`, `"open-inapp-browser"` or `"new-terminal"`.
:::

**Example:**

```js
acode.exec("console"); // Opens the console
acode.exec("open", "settings"); // Opens the settings page
```

### `registerFormatter(pluginId: string, extensions: string[] | string, format: Function, displayName?: string): void`

This method is used to register a formatter. It takes `pluginId`, `extensions`, formatter function, and optional display name.

`extensions` is normalized before it is stored:

| Input | Stored `exts` |
|---|---|
| Array (falsy entries removed) | that array, or `["*"]` when the array becomes empty |
| Non-empty string | `[extensions]` |
| Anything else (empty array, `""`, `undefined`, `null`, …) | `["*"]` |

Formatters are **unshifted**, so when two formatters claim the same extension the **last registered** formatter is found first by [`format`](#format-selectifnull-true-promise-boolean).

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
}, "Example Formatter");
```

### `unregisterFormatter(pluginId: string): void`

This method is used to unregister a formatter. This method takes one parameter, `pluginId`. The pluginId is the ID of your plugin.

Besides removing the formatter from the in-memory list, it also deletes `pluginId` from `appSettings.value.formatter` for **every** language mode that points at it and then calls `appSettings.update(false)` to persist the cleanup.

### `format(selectIfNull = true): Promise<boolean>`

Formats the active editor file using the selected formatter for the current mode.

- `selectIfNull` (optional): when `true`, Acode opens formatter selection if none is configured.

Returns `true` when formatting succeeds, otherwise `false`.

```js
await acode.format();
```

Resolution order:

1. Returns `false` immediately when there is no active file or when the active file is not an editor tab (`file.type !== "editor"`).
2. Resolves `modeName` from `editorManager.activeFile.currentMode`, falling back to `getModeForPath(file.filename)?.name`, then to `"text"`.
3. Looks the formatter up in `appSettings.value.formatter[modeName]` and finds the matching registered formatter.
4. If nothing matches, the stale setting is deleted and persisted, then either the formatter settings page opens (`selectIfNull === true`) or a "please select a formatter" toast is shown, and `false` is returned.
5. Otherwise `formatter.format()` is awaited. A thrown error is reported through `helpers.error()` and `false` is returned.

### `formatters: Array<{ id: string, name: string, exts: string[] }>`

List of registered formatters. `name` falls back to `id` when no display name was given. The getter returns a new array on every access and does not include the `format` callback.

```js
console.log(acode.formatters);
```

### `getFormatterFor(extensions: string[]): Array<[string | null, string]>`

Returns formatter options for the given extensions. The first entry is always `[null, "None"]`; a formatter is included when it shares at least one extension with `extensions` or declares the `"*"` wildcard.

```js
const options = acode.getFormatterFor(["js", "ts"]);
```

### `addIcon(className: string, iconSrc: string, options?: { monochrome?: boolean }): void`

This method is used to add an icon. This method takes two parameters, `iconName` , `iconSrc` and a optional. The `iconName` is the name of the icon. The `iconSrc` is the URL of the icon. If `options.monochrome` true, uses CSS masks to render the icon. This allows it to inherit the theme's currentColor(in case of svg).

Acode looks for an existing `<style icon="className">` in `document.head` first and only injects a new one when none exists, so calling `addIcon` again with the same `className` is a no-op.

| Mode | Generated CSS |
|---|---|
| `monochrome: true` | `.icon.<className>::before` with `-webkit-mask` / `mask: url(src) no-repeat center / contain` and `background-color: currentColor` |
| default | `.icon.<className>{ background: url(src) no-repeat center / 24px; }` |

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

### `toInternalUrl(url: string): Promise<string>`

When making Ajax or fetch requests, you need to convert file:// URLs to internal URLs. This method do it for you.

It wraps `helpers.toInternalUri`, which calls `window.resolveLocalFileSystemURL()` and resolves with `entry.toInternalURL()`. The promise **rejects** when the URL cannot be resolved, so always catch it. The same function is available as the `acode.require("toInternalUrl")` module.

```js
const internalUrl = await acode.toInternalUrl(url);
```

### `joinUrl(...args: string[]): string` <Badge type="tip" text="new" />

Thin wrapper over `Url.join(...)` from `src/utils/Url.js`. Use it to resolve a plugin-relative path the same way the app does.

```js
const baseUrl = "file:///data/user/0/com.foxdebug.acode/files/plugins/com.example.plugin/";
acode.joinUrl(baseUrl, "assets", "icon.svg");
```

### `fsOperation(file: string): File` <Badge type="tip" text="new" />

Returns the `FileSystem` handle for a URL. Equivalent to `acode.require("fs")` and `acode.require("fsOperation")` — see [FS](../utilities/fs.md).

```js
const fs = acode.fsOperation("file:///storage/emulated/0/test.txt");
const text = await fs.readFile("utf-8");
```

### `newEditorFile(filename: string, options?: FileOptions): void`

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
This method is equivalent to calling `new EditorFile(filename, options)`. It returns `undefined` — use `acode.require("EditorFile")` directly when you need the instance.
:::

::: info
This API was added in `v1.11.0` (versionCode: `956`) and marked stable in `v1.11.2` (versionCode: `958`)
:::

### `addCommand(descriptor): object | null` <Badge type="tip" text="new" />

Registers a command in the shared command registry and refreshes the keymap of the active editor.

`descriptor` fields:

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | Required. Trimmed. Replaces an existing command with the same name. |
| `exec` | `(view, args) => boolean \| void` | Required. Called with the resolved view (or `null`) and the `args` from [`execCommand`](#execcommand-name-string-view-editorview-args-any-boolean). |
| `description` | `string` | Optional. Defaults to a humanized version of `name`. |
| `bindKey` | `string \| { win?, linux?, mac? }` | Optional. Object forms are joined with `\|` into one combo string. |
| `readOnly` | `boolean` | Optional, defaults to `true`. When `false` the command is skipped in a read-only editor. |
| `requiresView` | `boolean` | Optional, defaults to `true`. When `true` and no view can be resolved, the command returns `false` without running. |

Returns the stored command entry, or `null` when the descriptor was rejected — in that case a `console.warn` explains why (`Command registration skipped: missing name` or `Command registration skipped for "<name>": exec must be a function.`). Exceptions thrown by `exec` are caught, logged as `Command "<name>" failed`, and reported as `false`.

```js
acode.addCommand({
  name: "example.sayHello",
  description: "Say hello",
  bindKey: { win: "Ctrl-Alt-H", linux: "Ctrl-Alt-H", mac: "Command-Alt-H" },
  exec(view, args) {
    acode.alert("Hello", `Args: ${JSON.stringify(args)}`);
    return true;
  },
});
```

### `removeCommand(name: string): void` <Badge type="tip" text="new" />

Removes a command from the registry and refreshes the keymap. A falsy `name` is ignored.

```js
acode.removeCommand("example.sayHello");
```

### `execCommand(name: string, view?: EditorView, args?: any): boolean` <Badge type="tip" text="new" />

Executes a registered command. When `view` is omitted the active editor (`window.editorManager.editor`) is used.

Returns `false` when `name` is falsy, when the command is unknown, when a view is required but unavailable, when the command is blocked by `readOnly`, or when the command threw. Otherwise it returns `true`.

```js
acode.execCommand("example.sayHello", undefined, { source: "plugin" });
```

### `listCommands(): Array<{ name: string, description: string, key: string | null }>` <Badge type="tip" text="new" />

Returns every registered command with its resolved description and effective key.

```js
console.log(acode.listCommands().map((cmd) => cmd.name));
```

::: tip
`acode.addCommand` / `removeCommand` / `execCommand` / `listCommands` and `acode.require("commands")` (`{ addCommand, removeCommand, registry: { add, execute, remove, list } }`) call the same registry. See [Commands](../utilities/commands.md).
:::

### `registerFileHandler(id: string, options: { extensions: string[], handleFile: Function }): void` <Badge type="tip" text="new" />

Registers a handler that opens files with unknown extensions. Extensions are lowercased and a leading dot is stripped; `"*"` acts as a catch-all.

Throws when `id` is already registered, when `extensions` is missing/empty, or when `handleFile` is not a function.

```js
acode.registerFileHandler("com.example.drawio", {
  extensions: ["drawio", "dio"],
  async handleFile(file) {
    // file: { name, uri, stats, readOnly, options }
  },
});
```

See [File Handlers](../advanced-apis/file-handlers.md).

### `unregisterFileHandler(id: string): void` <Badge type="tip" text="new" />

Removes a previously registered file type handler. Unknown ids are ignored.

```js
acode.unregisterFileHandler("com.example.drawio");
```

### `registerQuickToolsAdapter(tab: EditorFile, adapter: object): () => void` <Badge type="tip" text="new" />

Routes quick tools input for one custom tab. The adapter must provide `getState()`, `canHandle(action)`, `execute(action, ctx)`, `subscribe(cb)` and optionally `captureSelection()`, `restoreSelection(snapshot)`, `focus()`, `cancel()` and `onError(error)`.

Throws a `TypeError` when the adapter is incomplete and throws `This tab already has a quicktools adapter.` when the tab already has one. Returns a `dispose()` function; the registration is also disposed automatically when the tab emits `close`.

```js
const EditorFile = acode.require("EditorFile");

acode.setPluginInit("com.example.canvas", () => {
  const tab = new EditorFile("canvas", { type: "custom" });

  const dispose = acode.registerQuickToolsAdapter(tab, {
    getState: () => ({ enabled: true, busy: false }),
    canHandle: (action) => action.type === "key" && action.key === "Enter",
    subscribe: (cb) => {
      // call cb() whenever getState() changes
      return () => {};
    },
    execute: async (action, { signal }) => {
      // handle the action
    },
  });

  acode.setPluginUnmount("com.example.canvas", () => dispose());
});
```

### `pushNotification(title: string, message: string, options?: { icon?: string, action?: Function, type?: string }): void`

Displays a notification in Acode with a title, message and optional configuration.

The options parameter accepts the following properties:

* `icon?: string` - Icon for the notification. Can be a URL, base64 encoded image, icon class or SVG string
* `action?: Function` - Callback function when notification is clicked. It receives the notification object
* `type?: string` - Type of notification - can be 'info', 'warning', 'error' or 'success'. Defaults to 'info'

The notification is stored in the sidebar notification app and also shown as a toast. Title and message are sanitized before rendering.

::: warning
There is no `autoClose` option. Toasts stay until they are dismissed by the user.
:::

**Example:**

```js
acode.pushNotification(
  "Hello",
  "This is a notification",
  {
    icon: "my-icon",
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

This method **rejects** on failure, so it must be used with `try`/`catch`.

| Rejection | Cause |
|---|---|
| `Error("Plugin already installed")` | `PLUGIN_DIR/<pluginId>` already exists |
| `Error("User cancelled installation")` | The user declined the confirmation dialog |
| `Error("Failed to fetch plugin details")` | `<API_BASE>/plugin/<pluginId>` could not be read |
| The underlying error | Any failure of the `exists()` check |

For paid plugins (`remotePlugin.price > 0`) the flow resolves the SKU through `iap`, reads an existing `purchaseToken`, and — when there is none — checks API status and starts an `iap.purchase()` with a purchase listener. On purchase it POSTs the token to `<API_BASE>/plugin/order`. The promise resolves only after the internal installer finishes.

**Example:**

```js
try {
  await acode.installPlugin("com.example.pluginid", "myplugin.id");
} catch (error) {
  acode.alert("Install failed", error.message);
}
```

::: info
This api is added in `v1.10.6` , versionCode: `954`
:::

### `waitForPlugin(pluginId: string): Promise<boolean>`

Resolves when the target plugin has loaded.

- Resolves `true` immediately when the id is already in `LOADED_PLUGINS`.
- Otherwise it registers a one-shot watcher and resolves (with `undefined`) when that plugin finishes loading.
- **Rejects** with `Error("Plugin '<id>' failed to load.")` when the plugins load phase completes without it (for example because the plugin failed, timed out, was disabled or was already marked broken).

```js
try {
  await acode.waitForPlugin("com.example.other-plugin");
  const other = acode.require("other-plugin");
} catch (error) {
  console.warn(error.message);
}
```

::: warning
Always attach a `catch` handler. Without one you get an unhandled rejection when the plugin never loads.
:::

### `clearBrokenPluginMark(pluginId: string): void`

Clears a plugin's broken mark so it can be retried on next load. Plugins listed in `BROKEN_PLUGINS` are skipped by the loader, so this is the way to retry a plugin after fixing the cause of the failure. Failures are swallowed with a `console.warn`.

```js
acode.clearBrokenPluginMark("com.example.plugin");
```

### `exitAppMessage: string | null` <Badge type="tip" text="new" />

Read-only getter. Returns the localized "unsaved files, close app" warning when the editor has unsaved changes, otherwise `null`. `actionStack.pop()` uses it to build its confirmation message.

```js
console.log(acode.exitAppMessage);
```

## Dialogs <Badge type="tip" text="new" />

Each dialog is also available as a module, e.g. `acode.require("prompt")`.

| Method | Returns | Notes |
|---|---|---|
| `prompt(message, defaultValue?, type?, options?)` | `Promise<any>` | `type` may be `"text"`, `"number"`, `"url"`, `"email"`, `"password"`, `"tel"`, `"select"`, … See [Prompt](../ui-components/dialogs/prompt.md) |
| `confirm(title, message)` | `Promise<boolean>` | See [Confirm](../ui-components/dialogs/confirm.md) |
| `select(title, options, config?)` | `Promise<any>` | See [Select](../ui-components/dialogs/select.md) |
| `multiPrompt(title, inputs, help?)` | `Promise<Array<any>>` | See [Multi Prompt](../ui-components/dialogs/multi-prompt.md) |
| `alert(title, message, onhide?)` | `void` | See [Alert](../ui-components/dialogs/alert.md) |
| `loader(title, message?, options?)` | `Loader` | See [Loader](../ui-components/dialogs/loader.md) |
| `fileBrowser(mode?, info?, openLast?, ...defaultDir)` | `Promise<{type, url, name}>` | See [File Browser](../editor-components/file-browser.md) |

::: info
The third argument of `loader` is a `LoaderOptions` object (`{ timeout?: number, oncancel?: () => void }`), not a bare cancel callback. The returned handle exposes `setTitle(title)`, `setMessage(message)`, `hide()`, `show()` and `destroy()`.
:::

```js
const $loader = acode.loader("Working", "Downloading…", {
  timeout: 3000,
  oncancel: () => console.log("cancelled"),
});
$loader.setMessage("Almost done");
$loader.hide();
```

## Available Modules

Every name below is registered by the `Acode` constructor with `this.define(...)`. Lookups are case-insensitive.

| Module | Shape / purpose |
|---|---|
| `config` | **Read-only** app constants (`BASE_URL`, `API_BASE`, `HAS_PRO`, …). See [Read-only config](#config-read-only) |
| `Url` | URL utilities — see [Url](../utilities/url.md) |
| `page` | `Page` component — see [Page](../editor-components/page.md) |
| `Color` | Color helpers — see [Color](../helpers/color.md) |
| `fonts` | Font registry (`add`, `addCustom`, `get`, `getNames`, `remove`, `has`, `isCustom`, `setFont`/`setEditorFont`, `setAppFont`, `loadFont`, `injectFontFace`) — see [Fonts](../helpers/fonts.md) |
| `toast` | Toast messages — see [Toast](../ui-components/toast.md) |
| `alert` | Alert dialog — see [Alert](../ui-components/dialogs/alert.md) |
| `select` | Select dialog — see [Select](../ui-components/dialogs/select.md) |
| `loader` | Loader dialog — see [Loader](../ui-components/dialogs/loader.md) |
| `dialogBox` | Generic dialog — see [Custom Dialog](../ui-components/dialogs/custom-dialog.md) |
| `prompt` | Prompt dialog — see [Prompt](../ui-components/dialogs/prompt.md) |
| `multiPrompt` | Multi-input prompt — see [Multi Prompt](../ui-components/dialogs/multi-prompt.md) |
| `confirm` | Confirm dialog — see [Confirm](../ui-components/dialogs/confirm.md) |
| `colorPicker` | Color picker — see [Color Picker](../ui-components/dialogs/color-picker.md) |
| `intent` | `{ addHandler, removeHandler }` for `acode://` intents — see [Intent](../advanced-apis/intent.md) |
| `fileList` | **Deprecated.** Use `fileIndex`. See [fileList (deprecated)](#filelist-deprecated) |
| `fileIndex` | Native workspace index (`supports`, `scan`, `update`, `query`, `search`, `get`, `markDirty`, `clear`, `whenReady`, `subscribe`, `cancel`) — see [File Index](../editor-components/file-index.md) |
| `fs` / `fsOperation` | `FileSystem` factory — see [FS](../utilities/fs.md) |
| `helpers` | Utility helpers (`error`, `errorMessage`, `uuid`, `parseJSON`, `getIconForFile`, `getIconForFolder`, `promisify`, `toInternalUri`, `isBinary`, …) |
| `palette` | Command palette — see [Palette](../editor-components/palette.md) |
| `projects` | Project registry — see [Projects](../utilities/projects.md) |
| `tutorial` | First-run tutorial — see [Tutorial](../ui-components/tutorial.md) |
| `aceModes` | Legacy language registry (`addMode`, `removeMode`, `getModeForPath`, `getModes`, `getModesByName`, `getMode`) — see [Editor Languages](../utilities/ace-modes.md) |
| `editorLanguages` | Language registration — see [Editor Languages](../utilities/ace-modes.md) |
| `editorThemes` | CodeMirror theme registration — see [Editor Themes](../utilities/editor-themes.md) |
| `themes` | App (UI) theme list — see [Themes](../helpers/themes.md) |
| `themeBuilder` | `ThemeBuilder` class — see [Theme Builder](../helpers/theme-builder.md) |
| `lsp` | Language server registry — see [LSP](../advanced-apis/lsp.md) |
| `settings` | App settings (`value`, `uiSettings`, `update()`, `on()`, `off()`, `get()`) — see [Settings](../editor-components/settings.md) |
| `sideButton` | `SideButtons({ text, icon, onclick, backgroundColor, textColor })` returning `{ show, hide }` — see [Side Buttons](../interface-apis/side-buttons.md) |
| `EditorFile` | `EditorFile` class — see [Editor File](../editor-components/editor-file.md) |
| `inputhints` | Input hints — see [Input Hints](../helpers/input-hints.md) |
| `openfolder` | Folder picker — see [Open Folder](../utilities/open-folder.md) |
| `addedfolder` | List of opened folders — see [Added Folder](./added-folder.md) |
| `contextMenu` | `Contextmenu(content, options)` — see [Context Menu](../interface-apis/context-menu.md) |
| `selectionMenu` | `selectionMenu(options?)` returning quick-tools items — see [Selection Menu](../ui-components/selection-menu.md) |
| `actionStack` | Back-navigation stack — see [Action Stack](../advanced-apis/action-stack.md) |
| `sidebarApps` | `{ add, get, remove }` — see [Sidebar Apps](../interface-apis/sidebar-apps.md) |
| `fileBrowser` | File/folder picker — see [File Browser](../editor-components/file-browser.md) |
| `keyboard` | Hardware keyboard handling — see [Keyboard](../utilities/keyboard.md) |
| `windowResize` | Resize observer helpers — see [Window Resize](../utilities/window-resize.md) |
| `createKeyboardEvent` | `KeyboardEvent(type, dict)` factory — see [Keyboard Event](../utilities/keyboard-event.md) |
| `encodings` | `{ encodings, encode, decode }` — see [Encoding](../utilities/encoding.md) |
| `terminal` | Terminal manager — see [Terminal](../advanced-apis/terminal.md) |
| `webview` | `webview.create(options)` returning a native WebView handle — see [WebView](../advanced-apis/webview.md) |
| `orientation` | `{ lock(mode), unlock() }` for the fullscreen session (`"landscape"` / `"portrait"`) |
| `fullscreen` | `setBackHandler(cb)` to claim or release Android Back while fullscreen |
| `codemirror` | Shared CodeMirror / Lezer packages — see [CodeMirror packages](../utilities/codemirror.md) |
| `codeHighlight` | Static CodeMirror / Lezer highlighter — see [Code Highlight](../utilities/code-highlight.md) |
| `@codemirror/autocomplete`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/lint`, `@codemirror/search`, `@codemirror/state`, `@codemirror/view` | Individual CodeMirror packages, same instances as `codemirror.*` |
| `@lezer/common`, `@lezer/highlight`, `@lezer/lr` | Individual Lezer packages |
| `toInternalUrl` | `helpers.toInternalUri` — see [`acode.toInternalUrl`](#tointernalurl-url-string-promise-string) |
| `commands` | `{ addCommand, removeCommand, registry }` — see [Commands](../utilities/commands.md) |
| `fileIcons` | Special-cased per-plugin File Icons API — see [File Icons](../utilities/file-icons.md) |

### `config` (read-only) <Badge type="tip" text="new" />

`acode.require("config")` returns a **Proxy around the app config object**. Reads work normally, but every mutation is blocked and only logs a warning:

| Attempt | Console message |
|---|---|
| `config.X = 1` | `[Security Alert] Attempt to modify read-only config property 'X' blocked.` |
| `Object.defineProperty(config, "X", …)` | `[Security Alert] Attempt to define property 'X' on read-only config blocked.` |
| `delete config.X` | `[Security Alert] Attempt to delete property 'X' on read-only config blocked.` |
| `Object.setPrototypeOf(config, …)` | `[Security Alert] Attempt to change prototype of read-only config blocked.` |

Each trap returns `true`, so the operation silently "succeeds" from the caller's point of view while nothing changes. Note that `config.HAS_PRO` is a getter/setter pair inside the underlying object; writing it through the proxy is still blocked.

```js
const config = acode.require("config");
console.log(config.API_BASE); // read is fine
config.API_BASE = "https://evil.example"; // blocked + console.warn
```

### `fileList` (deprecated) <Badge type="tip" text="new" />

::: warning
`acode.require("fileList")` is **deprecated**. Use the asynchronous [`fileIndex`](../editor-components/file-index.md) API for native SAF and `file://` workspaces.
:::

The exported function logs a single one-time warning on first call:

`acode.require("fileList") is deprecated. Use the asynchronous "fileIndex" API. fileList now contains only non-native storage providers.`

It also carries the markers `fileList.deprecated === true` and `fileList.replacement === "fileIndex"`. Only the own enumerable properties of the module's default export (`on` and `off`) survive `Object.assign`, so the named exports (`append`, `remove`, `refresh`, `rename`, `whenReady`, `addRoot`, `initFileList`, `Tree`) are **not** reachable from `acode.require("fileList")`. What remains is only the compatibility index for **non-native** providers such as FTP/SFTP.

```js
const fileList = acode.require("fileList");
console.log(fileList.deprecated, fileList.replacement); // true "fileIndex"
```

### `editorLanguages` <Badge type="tip" text="new" />

```js
const editorLanguages = acode.require("editorLanguages");
```

| Method | Description |
|---|---|
| `register(name, extensions, caption?, loader?)` | Alias of `add` |
| `add(name, extensions, caption?, loader?)` | Registers a mode. `name` is trimmed + lowercased; `extensions` is a string or string array; `loader` returns a CodeMirror `Extension` or a promise for one |
| `unregister(name)` | Alias of `remove` |
| `remove(name)` | Removes the mode and its aliases |
| `list()` | Array of all registered modes |
| `listByName()` | Object map of name (and aliases) to mode, including built-ins |
| `get(name)` | Mode for a trimmed + lowercased name, or `null` |
| `getForPath(path)` | Best matching mode for a path, falling back to the `text` mode |

::: tip
`editorLanguages` does not forward `addMode`'s 5th `options` parameter, so `aliases` and `filenameMatchers` are only reachable through the legacy `acode.require("aceModes").addMode(...)`.
:::

### `editorThemes` <Badge type="tip" text="new" />

```js
const editorThemes = acode.require("editorThemes");
```

`register(spec)` accepts:

| Field | Aliases | Notes |
|---|---|---|
| `id` | `name` | Required |
| `caption` | `label` | Defaults to `id` |
| `isDark` | `dark` | Defaults to `false`. `isDark` wins when both are present |
| `getExtension` | `extensions`, `extension`, `theme` | Required. A CodeMirror extension (or array) or a function returning one |
| `config` | — | Theme metadata, defaults to `null` |

It returns `false` for an invalid spec. The exact validation warnings are:

- `[editorThemes] register(spec) expects an object: { id, caption?, dark?, getExtension|extensions|extension|theme, config? }`
- ``[editorThemes] register(spec) requires a valid `id`.``
- `[editorThemes] register('<id>') requires extensions via getExtension/extensions/extension/theme.`

The registry also rejects (returns `false`) an empty id or an id that is already registered — ids are compared trimmed and lowercased — and logs once per theme via `console.error` when the extensions fail `EditorState.create()` validation (`[editorThemes] Theme '<id>' is invalid: no extensions were returned`).

| Method | Description |
|---|---|
| `unregister(id)` | Removes the theme |
| `list()` | All registered theme entries |
| `apply(id)` | `editorManager.editor.setTheme(id)` on the active editor |
| `get(id)` | Theme entry or `null` |
| `getConfig(id)` | Theme config, falling back to the `one_dark` config |
| `createTheme({ styles, dark, highlightStyle, extensions })` | Builds a theme extension array |
| `createHighlightStyle(spec)` | `HighlightStyle.define(spec)` when `spec` is an array, otherwise returns `spec` as-is |
| `cm` | `{ EditorView, HighlightStyle, syntaxHighlighting, tags }` |

See [Editor Themes](../utilities/editor-themes.md).

### `themes` <Badge type="tip" text="new" />

App (UI) theme list, **not** the editor theme registry.

```js
const themes = acode.require("themes");
```

| Method | Description |
|---|---|
| `add(theme: ThemeBuilder)` | Registers a `ThemeBuilder` |
| `get(name: string)` | Theme for a lowercased name, or `undefined` |
| `list()` | All registered app themes |
| `update(theme: ThemeBuilder)` | Updates an existing theme in place; calls `add()` when the id is unknown. Ignores non-`ThemeBuilder` values |
| `apply()` | **Deprecated no-op.** It does nothing — use the app theme setting instead |

See [Themes](../helpers/themes.md).

### `encodings` <Badge type="tip" text="new" />

```js
const encodings = acode.require("encodings");
```

| Member | Description |
|---|---|
| `encodings` | Getter for the live map of available charsets (`{ [name]: { label, aliases, name } }`), populated natively on startup |
| `encode(text, charset): Promise<ArrayBuffer>` | Encodes text with the resolved charset |
| `decode(buffer, charset): Promise<string \| any>` | Decodes an `ArrayBuffer`. Passing `"json"` parses the result |

Charset resolution is case-insensitive and also matches aliases; an empty charset falls back to `settings.value.defaultFileEncoding` (`"auto"` means `"UTF-8"`), and unknown charsets fall back to `UTF-8`.

### `lsp` <Badge type="tip" text="new" />

`acode.require("lsp")` is a spread of `src/cm/lsp/api.ts` plus a limited client manager:

- `defineServer`, `defineBundle`, `installers`
- `register(entry, options?)`, `upsert(entry)`
- `servers` — `{ get, list, listForLanguage, update, unregister, onChange }`
- `bundles` — `{ list, getForServer, unregister }`
- `runtimes` — `{ register, unregister, get, list, select }`
- `workers.createTransport(options)`
- `registerRuntimeProvider` / `unregisterRuntimeProvider`
- `clientManager` — `{ setOptions(options), getActiveClients() }`

See [LSP](../advanced-apis/lsp.md).

### `terminal` <Badge type="tip" text="new" />

```js
const terminal = acode.require("terminal");
```

| Method | Description |
|---|---|
| `create(options)` / `createLocal(options)` / `createServer(options)` | Create a terminal tab |
| `get(id)` / `getAll()` | Look up terminals |
| `write(id, data)` | **Filtered** write, see below |
| `clear(id)` / `close(id)` | Clear or dispose a terminal |
| `moreOptions` / `touchSelection.moreOptions` | `{ add, remove, list }` touch-selection extra actions |
| `themes` | `{ register, unregister, get, getAll, getNames, createVariant }` |

::: warning
`write(id, data)` passes through a security filter before it reaches the terminal:

- Non-string `data` is ignored (with `Terminal write data must be a string`) and the call returns `undefined`.
- Blocked patterns abort the write and show the toast `Potentially dangerous command blocked for security` (command substitution uses `Command substitution blocked for security`). Blocked patterns include `rm -rf /`, `rm -rf *`, `rm -rf ~`, `mkfs.*`, `dd if=/…`, the `:(){ :|:& };:` fork bomb, `sudo dd if=/…`, `sudo rm -rf /`, `curl … | sh`, `wget … | sh`, `bash <(…)`, `sh <(…)`, `nc -l -p <port>`, `ncat -l -p <port>`, `python … SimpleHTTPServer`, `python … http.server`, `kill -9 1`, `killall -9 *`, `chmod 777 /…`, `chown … /…`, `cat /etc/passwd`, `cat /etc/shadow`, `cat /root/…` and any payload containing a null byte.
- Data longer than **64 KB** is truncated and `\n[Data truncated for security]\n` is appended (with a `console.warn`).
- `$(...)` substitutions are scanned for those same patterns.
- When blocked, the function returns `undefined`.
:::

```js
terminal.write(id, "Hello World!\r\n");
```

See [Terminal](../advanced-apis/terminal.md).

### `sidebarApps` and `intent` <Badge type="tip" text="new" />

```js
const sidebarApps = acode.require("sidebarApps");
const intent = acode.require("intent");

sidebarApps.add("my-icon", "com.example.my-app", "My App", (container) => {
  container.innerHTML = "<p>Hello</p>";
});

const $container = sidebarApps.get("com.example.my-app"); // throws if unknown
sidebarApps.remove("com.example.my-app");

const onIntent = (event) => {
  // event: { module, action, value, preventDefault(), stopPropagation() }
};
intent.addHandler(onIntent);
intent.removeHandler(onIntent);
```

See [Sidebar Apps](../interface-apis/sidebar-apps.md) and [Intent](../advanced-apis/intent.md).

### `codemirror` <Badge type="tip" text="new" />

`acode.require("codemirror")` is frozen and exposes `autocomplete`, `commands`, `language`, `lint`, `search`, `state`, `view`, `highlight` (the static highlighter, same object as `codeHighlight`) and a frozen `lezer` namespace that spreads `@lezer/highlight` and also nests `common` (`@lezer/common`), `highlight` and `lr` (`@lezer/lr`).

```js
const cm = acode.require("codemirror");
const { EditorView } = cm.view;
const { tags } = cm.lezer;
const lezerHighlight = cm.lezer.highlight;
const lezerCommon = cm.lezer.common;
const lezerLr = cm.lezer.lr;
```

The same instances are available directly as `@codemirror/view`, `@codemirror/state`, `@codemirror/language`, `@codemirror/commands`, `@codemirror/autocomplete`, `@codemirror/lint`, `@codemirror/search`, `@lezer/common`, `@lezer/highlight` and `@lezer/lr`.

See [CodeMirror packages](../utilities/codemirror.md).

## Related APIs

- Commands API (preferred for adding/removing commands): [Commands](../utilities/commands.md)
- Active editor and active file: [EditorManager](./editor-manager.md)
- CodeMirror editor theme API: [Editor Themes](../utilities/editor-themes.md)
- Shared CodeMirror / Lezer packages: [CodeMirror packages](../utilities/codemirror.md)
- Static CodeMirror highlighter (added in `v1.13.2`): [Code Highlight](../utilities/code-highlight.md)
- File and folder icon packs (available in versionCode `1011`): [File Icons](../utilities/file-icons.md)
- Language server API: [LSP](../advanced-apis/lsp.md)
- File handler API: [File Handlers](../advanced-apis/file-handlers.md)
- Terminal API: [Terminal](../advanced-apis/terminal.md)
- Native WebView plugin API: [WebView](../advanced-apis/webview.md)
- Native WebView plugin context: [Plugin Context (`ctx`)](../plugin-essentials/plugin-context.md)
- Workspace index (replacement for `fileList`): [File Index](../editor-components/file-index.md)
- Other globals such as `PLUGIN_DIR` or `CACHE_STORAGE`: [Other Global Utilities](./global-utilities.md)