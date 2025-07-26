# Alert

The `alert` component in Acode is a dialog box for displaying messages, warnings, or errors to users within a modal window. Similar to the traditional JavaScript `alert()`.

## Usage

To use the `alert` component in your Acode plugin, you can require it using the following code:

```javascript
const alert = acode.require('alert');
```

Once you have the `alert` component, you can create an instance with the following syntax:

```js
alert(
  'Title of Alert',          // Title of the alert modal
  'The alert body message..', // Message to display in the body of the alert modal
  () => {
    // Optional function to call when the alert modal is closed
    window.toast('Alert modal closed', 4000);
  }
);
```

## Parameters

- **titleText (string):**
  - The text to display in the title of the alert modal.

- **message (string):**
  - The message to display in the body of the alert modal.

- **onhide (Function):**
  - An optional function to call when the alert modal is closed.

## Example

```javascript:line-numbers{1,7}
const alert = acode.require('alert');

const handleOnHide = () => {
  window.toast('Alert modal closed', 4000);
};

alert('Title of Alert', 'The alert body message..', handleOnHide);
```

In this example, when the alert modal is closed, the `handleOnHide` function will be called, and a toast message **'Alert modal closed'** will be displayed for 4000 milliseconds. This allows you to perform additional actions or provide feedback when the user interacts with the alert dialog.