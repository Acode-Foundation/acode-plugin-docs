# Plugin Main File

The `main.js`(can be of any name but that must be specified in `plugin.json`) file is the heart of your Acode plugin, serving as the entry point and execution hub when the plugin is loaded. Here we'll explore the essential concept of `main.js`, focusing on initialization, registration, and cleanup.

## Plugin Initialization

### Entry Point for Your Plugin

The `main.js` file acts as the entry point for your Acode plugin. It is executed upon loading, providing the ideal space to initialize and configure your plugin.

### Access to Acode API

Within `main.js`, you gain access to the Acode API through the global variable [acode](../global-apis/acode). This variable serves as your gateway to interact with various Acode methods, enabling seamless integration of your plugin with the editor.

### Registering Your Plugin

To register your plugin, utilize the `acode.setPluginInit(pluginId: string, init: Function)` method. This method requires two parameters:

1. **pluginId:**
   - The unique identifier for your plugin.

2. **init function:**
   - The function to be executed when the plugin is loaded.

Upon execution, the `init` function will receive three parameters:

- **baseUrl (string):**
  - The base URL of the plugin, allowing access to files within the plugin directory.

- **$page (WcPage):**
  - A page object that facilitates the display of content within Acode.

- **cache (object):**
  - An object providing access to cached files, including:
    - **cacheFileUrl (string):**
      - URL of the cached file.
    - **cacheFile (File):**
      - File object of the cached file, enabling file read/write operations.

### Example main.js File

Here's an illustrative example of a `main.js` file:

```javascript
acode.setPluginInit('com.example.plugin', (baseUrl, $page, cache) => {
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

## Plugin Unmount Function

The `main.js` file must also define an unmount function, which is called when the plugin is unloaded or uninstalled. This function allows you to perform cleanup operations associated with your plugin.

### Example Unmount Function

```javascript
acode.setPluginUnmount('com.example.plugin', () => {
  const { commands } = editorManager.editor;
  commands.removeCommand('example-plugin');
});
```

In this example, the unmount function removes the 'example-plugin' command, ensuring that the plugin's impact on Acode is cleanly reverted upon unloading.

:::tip
You will not need to write this `unmount` or `initialize` functions for your plugin because templates comes with it , just you will need to write your plugin code inside the `AcodePlugin class`
:::
