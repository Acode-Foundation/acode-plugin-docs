---
title: Multi Prompt
description: Collect several values at once with a form-style dialog.
---

# Multi Prompt

`multiPrompt` shows one dialog containing several inputs (text fields, numbers, checkboxes and so on) and resolves with all the values together.

```js
const multiPrompt = acode.require("multiPrompt");
```

## Signature

```ts
multiPrompt(message, inputs, help?): Promise<Record<string, string | boolean>>
```

| Parameter | Type | Description |
| --- | --- | --- |
| `message` | `string` | Title of the dialog. |
| `inputs` | `Array<Input \| Array<Input \| string>>` | The fields to show, in order. An inner array creates a [group](#groups). |
| `help` | `string` | Optional. Adds a help icon to the title. See [Help](#help). |

## Returns

A `Promise` that resolves with an **object keyed by each input's `id`**:

- text-like inputs give a `string`
- `checkbox` and `radio` inputs give a `boolean`

```js
const { name, age, subscribe } = await multiPrompt("Sign up", [
  { id: "name", type: "text", placeholder: "Name", required: true },
  { id: "age", type: "number", placeholder: "Age" },
  { id: "subscribe", type: "checkbox", placeholder: "Send me updates" },
]);
```

::: warning Cancel rejects the promise
Pressing **Cancel** rejects the promise with no value. Wrap the call in `try`/`catch` if the user is allowed to cancel.

Closing the dialog with the back button does **not** reject or resolve: the promise stays pending.

```js
try {
  const values = await multiPrompt("Settings", inputs);
} catch {
  return; // cancelled
}
```
:::

::: info
Numbers are returned as strings, like the browser's `input.value`. Convert with `Number(age)` when you need a number.
:::

## Input options

| Option | Type | Description |
| --- | --- | --- |
| `id` | `string` | **Required.** Key of this value in the result. |
| `type` | `string` | Any [HTML input type](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types) such as `text`, `number`, `email`, `password`, `checkbox` or `radio`. Defaults to `text`. `textarea` is drawn, but its value is not included in the result and `required` is not checked for it. |
| `value` | `string \| boolean` | Initial value. For `checkbox` and `radio`, whether it starts checked. |
| `placeholder` | `string` | Placeholder text. For `checkbox` and `radio`, this is the **label** next to the box. |
| `required` | `boolean` | Block **OK** while the field is empty. |
| `match` | `RegExp` | The value must match, otherwise an "invalid value" message is shown and **OK** is disabled. |
| `hints` | `string[] \| function` | Autocomplete suggestions shown while typing. See [Input Hints](../../helpers/input-hints.md). |
| `name` | `string` | Group name for `radio` inputs; radios with the same `name` are mutually exclusive. |
| `disabled` | `boolean` | Show the field but do not let the user edit it. |
| `readOnly` | `boolean` | Show the value and allow selecting or copying it. |
| `hidden` | `boolean` | Keep the field in the result but do not show it. |
| `autofocus` | `boolean` | Focus this field when the dialog opens. |
| `sensitive` | `boolean` | Clear the field's contents when the dialog closes. `password` fields are always cleared. |
| `onclick` | `(event) => void` | Click handler. `this` is the input element (for `checkbox`/`radio`, its `<label>` wrapper). |
| `onchange` | `(event) => void` | Change handler. `this` is the input element (for `checkbox`/`radio`, its `<label>` wrapper). |

::: tip
For `checkbox` and `radio`, `this.checked` and `this.value` are `undefined` because `this` is the label. In `onchange`, read the state from the event instead: `event.target.checked`.
:::

### Custom validation

Inside `onchange` (or `onclick`), `this` is the input element (the `<label>` wrapper for `checkbox`/`radio`) and has a `setError(message)` method. Call it with a message to show an error and disable **OK**, or with an empty value to clear it:

```js
{
  id: "port",
  type: "number",
  placeholder: "Port",
  onchange() {
    const port = Number(this.value);
    this.setError(port > 0 && port < 65536 ? "" : "Port must be 1-65535");
  },
}
```

## Groups

Put inputs in an inner array to lay them out together. A **string** inside the array becomes the group's label.

```js
const values = await multiPrompt("Server", [
  ["Connection", { id: "host", placeholder: "Host" }, { id: "port", type: "number", placeholder: "Port" }],
  { id: "password", type: "password", placeholder: "Password", sensitive: true },
]);
```

## Help

The `help` argument adds a help icon to the title bar:

- If it starts with `http://` or `https://`, the icon opens that link.
- Any other string is shown in an alert when the icon is tapped.

## Example

```js
const multiPrompt = acode.require("multiPrompt");

try {
  const { host, port, ssl } = await multiPrompt(
    "Connect to server",
    [
      { id: "host", type: "text", placeholder: "Host", required: true },
      { id: "port", type: "number", placeholder: "Port", value: "22" },
      { id: "ssl", type: "checkbox", placeholder: "Use SSL", value: true },
    ],
    "https://example.com/help/connect",
  );
  connect(host, Number(port), ssl);
} catch {
  // cancelled
}
```

## See also

- [Prompt](./prompt.md) for a single value
