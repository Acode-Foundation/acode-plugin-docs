# Custom Dialog

The `dialogBox` API in Acode provides a way to create custom dialog boxes within your plugins. Basically it creates a dialog and gives you the freedom to display whatever you wish.

::: info
Verified against Acode **v1.13.5**: `src/dialogs/dialog.js`. `dialogBox` is registered as a module only (`acode.js`, `this.define("dialogBox", dialog)`) — there is **no** `acode.dialogBox()` method, so `acode.require("dialogBox")` is the only way in.
:::

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
  'hideButtonText',           // Text for the OK button
  'cancelButtonText'          // Text for the cancel button
);
```

### Forming a Dialog Box Instance

```javascript
/**
 * Dialog Box Instance
 * @param {string} titleText - Title text
 * @param {string} html - HTML string
 * @param {string|boolean} [hideButtonText] - Text for the OK button, or `true` to render no buttons at all
 * @param {string} [cancelButtonText] - Text for the cancel button
 * @returns {DialogBox} - A thenable handle, NOT a Promise
 */
```

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `titleText` | `string` | Yes | — | Title text, rendered as plain text. |
| `html` | `string` | Yes | — | Body HTML, assigned via `innerHTML` **without sanitizing**. |
| `hideButtonText` | `string \| boolean` | No | `strings.ok` | Label of the primary/OK button. Passing the boolean `true` **hides the entire button row**. |
| `cancelButtonText` | `string` | No | — | Label of the cancel button. The button is only rendered when this is truthy. |

Both buttons start with the `disabled` class and are enabled on the next tick, unless a `wait()` countdown pushes that back.

### Returns

`dialogBox()` returns a **thenable handle object** — not a real `Promise`. It has no `catch()`, no `finally()`, and its `then(cb)` is a *setter*, not a resolver:

| Member | Signature | Description |
| --- | --- | --- |
| `hide` | `() => void` | Closes the dialog. No-op while a `wait()` countdown is running. Revokes object URLs of any `<img>` inside the box. |
| `wait` | `(time: number) => DialogBox` | Keeps both buttons disabled for `time` ms while counting down. |
| `onclick` | `(cb: (this: HTMLElement, e: Event) => void) => DialogBox` | Called when the body is clicked. |
| `onhide` | `(cb: () => void) => DialogBox` | Called when the dialog is hidden. |
| `then` | `(cb: (children: HTMLCollection) => void) => DialogBox` | Called with the body element's `children` right after the dialog is inserted. |
| `ok` | `(cb: () => void) => DialogBox` | Called when the OK button is pressed. Defaults to hiding the dialog. |
| `cancel` | `(cb: () => void) => DialogBox` | Called when the Cancel button is pressed. **Does not close the dialog.** |

Every setter returns the *same* handle object, so calls chain:

```js
const DialogBox = acode.require('dialogBox');

const box = DialogBox('Delete?', 'This cannot be undone.', 'Delete')
  .wait(1500)
  .ok(() => {
    doDelete();
    box.hide();
  })
  .cancel(() => box.hide())
  .onhide(() => acode.require('toast')('Closed'));
```

## Methods

### 1. `hide()`

The `hide` method is used to hide the dialog box. It removes the box and its mask after the ~300 ms close animation, and calls `URL.revokeObjectURL()` for every `<img>` it contains (so `URL.createObjectURL()` previews stop working once closed). While a `wait()` countdown is active `hide()` is a no-op.

```javascript
myDialogBox.hide();
```

### 2. `wait(time: number)`

The `wait` method disables the OK button (and the cancel button, if present) for the specified time (in milliseconds). The time is rounded **down to whole seconds** and the button label counts down the remaining seconds, e.g. `"Pick (1sec)"` → `"Pick"`.

```javascript
myDialogBox.wait(1000);
```

### 3. `onhide(callback: Function)`

The `onhide` method sets a callback function to be called when the dialog box is hidden. It runs on a backdrop tap and on the default OK behaviour — i.e. only when `hide()` was reached through the OK button or the mask. Call `box.hide()` yourself to close it.

```javascript
myDialogBox.onhide(() => {
  console.log('Dialog box is hidden');
});
```

### 4. `onclick(callback: Function)`

The `onclick` method sets a callback function to be called when the content is clicked. The callback's `this` is the body `<div class="message">`.

```javascript
myDialogBox.onclick((e) => {
  const target = e.target;
  console.log(target, 'is clicked');
});
```

### 5. `then(callback: Function)`

The `then` method sets a callback function that receives the dialog body's `children` (an `HTMLCollection`) as soon as the dialog has been inserted — it is **not** tied to the OK button.

```javascript
myDialogBox.then((children) => {
  console.log('Dialog body has', children.length, 'child nodes');
});
```

### 6. `ok(callback: Function)`

The `ok` method sets a callback function to be called when the OK button is clicked. It **replaces** the default behaviour (hide), so the dialog stays open until you call `hide()` yourself.

```javascript
myDialogBox.ok(() => {
  console.log('OK button is clicked');
});
```

### 7. `cancel(callback: Function)`

The `cancel` method sets a callback function to be called when the Cancel button is clicked. The dialog is **not** closed for you.

```javascript
myDialogBox.cancel(() => {
  console.log('Cancel button is clicked');
});
```

## How it differs from the preset dialogs

| | `dialogBox` | `confirm` / `prompt` / `select` / `multiPrompt` / `colorPicker` |
| --- | --- | --- |
| Return value | Thenable **handle** with methods | Real `Promise` |
| Body content | Your raw `innerHTML` | Text / sanitized HTML / native controls |
| Buttons | You choose labels, and can remove them entirely | Fixed OK + Cancel from the app's locale |
| Result delivery | Callbacks (`ok`, `cancel`, `onhide`) | `resolve` / `reject` |
| Cancellation | No built-in "dismissed" signal — the promise never rejects | `false`, `null`, `undefined` or `Error("cancelled")` |
| Sanitization | **None** — you own the escaping | `alert`, `select`, `loader`, `colorPicker` and `confirm(isHTML)` use DOMPurify |

## Example

```javascript
const DialogBox = acode.require('dialogBox');

const box = DialogBox(
  'Pick a build flavour',
  `
    <div style="display:flex;gap:8px">
      <button class="btn" value="free">Free</button>
      <button class="btn" value="pro">Pro</button>
    </div>
  `,
  'Pick',
).wait(1000);

box.onclick((e) => {
  const flavour = e.target.getAttribute?.('value');
  if (!flavour) return;
  box.hide();
  localStorage.setItem('buildFlavour', flavour);
});

box.cancel(() => box.hide());
box.onhide(() => acode.require('toast')('Dialog dismissed'));
```

## Gotchas <Badge type="tip" text="new" />

- **It is not a `Promise`.** There is no `catch()` and no `finally()`; `await box` resolves almost immediately with the body's `children` rather than waiting for the user. Drive the dialog with callbacks instead.
- **`then()` is a setter, not a resolver.** It fires as soon as the dialog is mounted — before the user has done anything. Use `ok()` / `cancel()` / `onhide()` for user intent.
- **`ok()` and `cancel()` do not close the dialog.** The default `ok` action is `hide()`, but the moment you override `ok` that behaviour is gone — and `cancel` never closes anything and does not fire `onhide`. Always call `hide()` yourself.
- **Android Back / Esc bypasses every callback.** The action stack entry points at the raw teardown, so the DOM disappears without `ok`, `cancel` or `onhide` running.
- **`wait()` blocks `hide()`.** While the countdown runs, `hide()` returns immediately, so a `wait()` that is never completed locks the dialog open.
- **`hideButtonText: true` renders no buttons at all** — it is tested with `typeof hideButtonText === "boolean"`, so passing the boolean `true` (and only `true`) removes the whole button row. Backdrop tap then becomes your only close gesture.
- **`html` is not sanitized.** Any string you pass becomes live DOM. Never interpolate untrusted values — escape them yourself.
- **`hide()` revokes object URLs** of every `<img>` in the box, so reusing a `URL.createObjectURL()` preview after close will fail.
- **The action-stack id is fixed (`"box"`)**, shared with the color picker — two such dialogs at once will fight over Back-navigation.

## See also

- [`confirm`](./confirm.md) — yes/no dialog
- [`alert`](./alert.md) — message with a single OK button
- [`prompt`](./prompt.md) — free-text input
- [`select`](./select.md) — pick from a list
- [`multiPrompt`](./multi-prompt.md) — many inputs in one dialog
- [`colorPicker`](./color-picker.md) — pick a color
- [`loader`](./loader.md) — progress dialog