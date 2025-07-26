# Custom Dialog

The `dialogBox` API in Acode provides a way to create custom dialog boxes within your plugins. Basically it creates a dialog and gives you the freedom to display whatever you wish.

## Getting Started

To use the DialogBox ui component in your Acode plugin, you can require it using the following code:

```javascript
const DialogBox = acode.require('dialogBox');
```

Once you have the DialogBox component, you can create a new instance with the following syntax:

```javascript
const myDialogBox = DialogBox(
  'Title',                    // Title of the dialog box
  '<h1>Dialog content</h1>',  // Content of the dialog box (HTML supported)
  'hideButtonText',           // Text for the hide button
  'cancelButtonText'          // Text for the cancel button
);
```

### Forming a Dialog Box Instance

```javascript
/**
 * Dialog Box Instance
 * @param {string} titleText - Title text
 * @param {string} html - HTML string
 * @param {string} [hideButtonText] - Text for hide button
 * @param {string} [cancelButtonText] - Text for cancel button
 * @returns {PromiseLike} - A promise representing the Dialog Box instance
 */
```

## Methods

### 1. `hide()`

The `hide` method is used to hide the dialog box.

```javascript
myDialogBox.hide();
```

### 2. `wait(time: number)`

The `wait` method disables the OK button for the specified time (in milliseconds).

```javascript
myDialogBox.wait(1000);
```

### 3. `onhide(callback: Function)`

The `onhide` method sets a callback function to be called when the dialog box is hidden.

```javascript
myDialogBox.onhide(() => {
  console.log('Dialog box is hidden');
});
```

### 4. `onclick(callback: Function)`

The `onclick` method sets a callback function to be called when the content is clicked.

```javascript
myDialogBox.onclick((e) => {
  const target = e.target;
  console.log(target, 'is clicked');
});
```

### 5. `then(callback: Function)`

The `then` method sets a callback function to be called when the OK button is clicked.

```javascript
myDialogBox.then(() => {
  console.log('OK button is clicked');
});
```

### 6. `ok(callback: Function)`

The `ok` method sets a callback function to be called when the OK button is clicked.

```javascript
myDialogBox.ok(() => {
  console.log('OK button is clicked');
});
```

### 7. `cancel(callback: Function)`

The `cancel` method sets a callback function to be called when the Cancel button is clicked.

```javascript
myDialogBox.cancel(() => {
  console.log('Cancel button is clicked');
});
```
