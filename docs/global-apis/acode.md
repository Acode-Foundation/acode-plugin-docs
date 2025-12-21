# Acode

## window.acode or acode

The `acode` object is the global object that provides access to the **Acode API**. You can use this object to access the API methods.

## Methods

### `setPluginInit(pluginId: string, init: Function, settings? Object)`

This method is used to register the plugin. This method takes two parameters, `pluginId` and init function. The `pluginId` is the ID of your plugin. The `init` function is the function that will be called when the plugin is loaded.

**Example:**

```js
acode.setPluginInit('com.example.plugin', (baseUrl, $page, cache) => { // [!code focus]
  const { commands } = editorManager.editor;
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

### `init(baseUrl: string, $page: WCPage, options: object)`

When the init function is called, it will receive 3 parameters:

* `baseUrl: string` The base URL of the plugin. You can use this URL to access the files in the plugin directory.

* `$page: WcPage` This page object can be used to show content.

* `options: object` This object can be used to access the cached files.

   * `cacheFileUrl: string` Url of the cached file.

   * `cacheFile File: object` File object of the cached file. Using this object, you can write/read the file.
   * `firstInit: boolean` If this is the first time the plugin is loaded, this value will be true. Otherwise, it will be `false`.

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
  const { commands } = editorManager.editor;
  commands.removeCommand("example-plugin");
});
```

### `define(moduleName: string, module: any)`

This method is used to define a module. This method takes two parameters, `moduleName` and module. The `moduleName` is the name of the module. The module is the module object. Module name is case insensitive.

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

### `require(moduleName: string)`

This method is used to require a module. This method takes one parameter, `moduleName`. The `moduleName` is the name of the module. Module name is case insensitive.

**Example:**

```js{1}
acode.require("say-hello").hello(); // Hello World!
```

### `exec(command: string, value?: any)`

This method executes a command defined in file `src/lib/commands.js`. This method takes one or two parameters, `command` and `value`. The command is the name of the command. The value is the value of the command. Command name is case insensitive.

**Example:**

```js
acode.exec("console"); // Opens the console
```

### `registerFormatter(pluginId: string, extensions: string[], format: Function)`

This method is used to register a formatter. This method takes three parameters, `pluginId`, `extensions` and format function. The `pluginId` is the ID of your plugin. The `extensions` is an array of file extensions. The format function is the function that will be called when the file is formatted.

**Example:**

```js
acode.registerFormatter("com.example.plugin", ["js"], () => { // [!code focus]
  // formats the active file if supported
  const text = editorManager.editor.session.getValue();
  // format the text
  editorManager.editor.session.setValue(text);
});
```

### `unregisterFormatter(pluginId: string)`

This method is used to unregister a formatter. This method takes one parameter, `pluginId`. The pluginId is the ID of your plugin.

### `addIcon(iconName: string, iconSrc: string, options?: { monochrome?: boolean })`

This method is used to add an icon. This method takes two parameters, `iconName` , `iconSrc` and a optional. The `iconName` is the name of the icon. The `iconSrc` is the URL of the icon. If `options.monochrome` true, uses CSS masks to render the icon. This allows it to inherit the theme's currentColor(in case of svg).

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


### `newEditorFile(filename: string, options?: FileOptions): EditorFile`
::: warning
Requires version code `958` or above
:::

Creates a new EditorFile instance. This is an alternative to using the [EditorFile](../editor-components/editor-file.md) constructor directly.

**Parameters:**

* `filename: string` - Name of the file
* `options?: FileOptions` - File creation options (see [EditorFile API](../editor-components/editor-file.md#fileoptions) for details)

**Returns:**

* `EditorFile` - A new EditorFile instance

**Example:**

```js
const file = acode.newEditorFile('example.js', {
    text: 'console.log("Hello World");',
    editable: true
});
```

::: tip
This method is equivalent to `new EditorFile(filename, options)`. Both methods accept and return the same parameters.
:::

::: info
This API was added in `v1.11.0` (versionCode: `956`) and marked stable in `v1.11.2` (versionCode: `958`)
:::
