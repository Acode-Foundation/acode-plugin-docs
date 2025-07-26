# Confirm

The `confirm` ui component in Acode is a dialog box for displaying confirmation message modals to users. Whether you're seeking user approval for a critical action or confirming a decision, this component is best suited for this process.

## Usage

To use the `confirm` component in your Acode plugin, you can require it using the following code:

```javascript
const confirm = acode.require('confirm');
```

Once you have the `confirm` component, you can create an instance with the following syntax:

```javascript
const confirmation = await confirm(
  'Warning',                   // Title of the confirmation message modal
  'Are you sure?'              // Body of the confirmation message modal
);
```

## Parameters

- **titleText (string):**
  - A string representing the title of the confirmation message modal. This title will be displayed at the top of the message modal.

- **message (string):**
  - A string representing the body of the confirmation message modal.

## Returns

The `confirm` component returns a promise that resolves to a `boolean` value. The boolean value represents whether the user confirmed or denied the message. A value of `true` represents confirmation, while `false` represents denial.

## Example

```javascript:line-numbers{1,3}
const confirm = acode.require('confirm');

let confirmation = await confirm('Warning', 'Are you sure?');
if (confirmation) {
  window.toast('File deleted...', 4000);
} else {
  window.toast('File not deleted...', 4000);
}
```

In this example, the `confirm` component is utilized to ask the user if they want to delete a file. If the user confirms, the message "File deleted." will be toasted. If the user denies, the message "File not deleted." will be toasted.