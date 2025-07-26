# Loader

The `loader` ui component in Acode is utility that help you to display loading dialogs with customizable titles and messages. These loading dialogs offer an informative and engaging experience for users while waiting for various processes to complete. The component also provides options for setting timeouts and callback functions for handling loading process cancellations.

## Methods and Usage

The `loader` component offers a variety of methods to control and manage the loading dialog:

### `showTitleLoader()`

- **Usage:** Shows the title loader.

- **Parameters:**
  - `immortal {boolean}` If true, the loader will not be removed automatically

### `removeTitleLoader()`

- **Usage:** Hides the title loader.

- **Parameters:**
  - `immortal {boolean}` If not true, the loader will not remove when immortal was true when it was created.


:::tip
`showTitleLoader()` & `removeTitleLoader()` are loader methods to create and destroy a small spinner from title. Its good while opening any file in editor or working inside editor
:::

### `create(options: LoaderOptions)`

- **Usage:** Creates a new loading dialog with the specified options.
- **Parameters:**
  - `titleText (string)`: The title text to display on the loading dialog.
  - `message (string)`: The message to display on the loading dialog.
  - `cancel (object)`: An object containing the following properties:
    - `timeout (number)`: The time (in milliseconds) after which the loading process will automatically be cancelled.
    - `callback (Function)`: A function that will be called when the loading process is cancelled.

### `destroy()`

- **Usage:** Removes the loading dialog from the DOM permanently.

### `hide()`

- **Usage:** Hides the loading dialog temporarily. The dialog can be restored using the `show()` method.

### `show()`

- **Usage:** Shows a previously hidden loading dialog.

:::info
The `create()` method should be called before using other methods except `showTitleLoader()` & `removeTitleLoader()`.
:::

## Example

```javascript:line-numbers{1,4-7,11,16,21,25,29}
const loader = acode.require("loader");

// Create the loader with specified options
loader.create("Title Text", "Message...", {
  timeout: 5000,
  callback: () => window.toast("Loading cancelled", 4000),
});

// Hide the loader after 2 seconds
setTimeout(() => {
  loader.hide();
}, 2000);

// Show the loader after 4 seconds
setTimeout(() => {
  loader.show();
}, 4000);

// Destroy the loader after 6 seconds
setTimeout(() => {
  loader.destroy();
}, 6000);

// example of `showTitleLoader()` & `removeTitleLoader()`
loader.showTitleLoader();

// remove the title loader after 4 seconds
setTimeout(() => {
  loader.removeTitleLoader();
}, 4000);
```

In this example, the `create()` method is called with the specified options to create a loading dialog. The loader is then hidden after 2 seconds, shown after 4 seconds, and finally destroyed after 6 seconds.

:::tip

- Use the `loader` component to provide informative loading dialogs during time-consuming operations.
- Utilize the `timeout` and `callback` options to handle cancellations gracefully.
- Show and hide the loader as needed to keep users informed about the process.
  :::

:::danger

- Be cautious with long timeouts, as it may affect the user experience.
  :::