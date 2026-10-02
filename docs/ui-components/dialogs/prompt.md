# Prompt

The `prompt` ui component in Acode is a dialog box for displaying prompts to users, allowing them to provide input in a convenient and straightforward manner.

::: info
Verified against Acode **v1.13.5**: `src/dialogs/prompt.js`. `acode.require("prompt")` and `acode.prompt(...)` are the same function and forward all four arguments.
:::

## Usage

To use the `prompt` component in your Acode plugin, you can require it using the following code:

```javascript
const prompt = acode.require('prompt');
```

Once you have the `prompt` component, you can create an instance with the following syntax:

```javascript
const userEmail = await prompt(
  'What is your email?',   // Message for the prompt
  '',                       // Default value of the input
  'email',                  // Type of input (e.g., 'email', 'text', 'number')
  {
    match: emailRegex,      // Regular expression that the input must match
    required: true,         // Indicates whether the input is required
    placeholder: 'Enter your email',  // Placeholder text of the input
    test: (value) => emailRegex.test(value),  // Function to validate the input
  }
);
```

### Signature

| Signature | Returns |
| --- | --- |
| `prompt(message: string, defaultValue: string, type?: PromptType, options?: PromptOptions): Promise<string \| number \| null>` | Never rejects — Cancel resolves `null` |

```js
// Minimal call — every argument except the message can be omitted.
const name = await prompt('What is your name?');
```

## Parameters

- **`message (string):`**
  - A string that represents the message to be displayed to the user.

- **`defaultValue (string):`**
  - A string that represents the default value of the input.
  - Also seeds the field: if truthy the cursor is placed at the end of the text and **the OK button starts enabled**; if falsy the OK button starts **disabled** until the user types.

- **`type (string):`**
  - A string that represents the type of input, such as 

  | Input Types   |
  | ------------- |
  | textarea      |
  | text          |
  | number        |
  | tel           |
  | search        |
  | email         |
  | url           |

  `type` defaults to `"text"`. The value is applied verbatim as `input.type` (or `inputMode` for `textarea`), so any other valid HTML input type also works. `"filename"` is a special case that is rewritten to `"text"`.

- **`options (PromptOptions):`**
  - An object that contains additional options for the prompt.

### Parameters at a glance

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `message` | `string` | Yes | — | Label shown above the input. |
| `defaultValue` | `string` | Yes | — | Initial field value; also controls the initial enabled state of the OK button. |
| `type` | `PromptType` | No | `"text"` | `<input type>` (or `textarea`). |
| `options` | `PromptOptions` | No | `{}` | See below. |

### PromptOptions

- **`match (RegExp):`**
  - A regular expression that the input must match.
  - Evaluated on every `input` event. A mismatch disables the OK button and shows the localized `strings["invalid value"]` message.

- **`required (boolean):`**
  - A boolean that indicates whether the input is required or not.
  - Checked when OK is pressed; an empty value shows the localized `strings.required` message and keeps the dialog open.

  ::: warning
  - Be mindful of the `required` option, and consider the user experience when making input mandatory.
  :::

- **`placeholder (string):`**
  - A string that represents the placeholder text of the input.

- **`test (Function):`**
  - A function that takes in a value and returns a boolean indicating whether the value is valid.

  ::: info
  - The `test` function can be used for custom validation of the input.
  :::

- **`capitalize (boolean):`** <Badge type="tip" text="new" />
  - Sets the input's `autocapitalize` attribute to `"on"` or `"off"`. Defaults to `true`.

### PromptOptions at a glance

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `match` | `RegExp` | `undefined` | Pattern the value must match. |
| `required` | `boolean` | `undefined` | Block submit on an empty value. |
| `placeholder` | `string` | `undefined` | Placeholder text. |
| `test` | `(value: any) => boolean` | `undefined` | Custom validator, overrides `match`. |
| `capitalize` | `boolean` | `true` | `autocapitalize="on"` / `"off"`. |

## Returns

The `prompt` component returns a promise that resolves to a string, number, or null if the prompt is canceled.

| Interaction | Resolved value |
| --- | --- |
| **OK button** | The input's value — a `string`, or a `number` when `type` is `"number"` (the string is coerced with unary `+`) |
| **Enter key (form submit)** | The input's value, always as a `string` |
| **Cancel button** | `null` |
| **Backdrop tap** | Nothing happens — the backdrop has no click handler |
| **Android Back / Esc** | Nothing settles — see [Gotchas](#gotchas) |

The promise **never rejects**, so `try/catch` around `prompt()` is unnecessary.

## Example

```javascript:line-numbers{1,11}
const prompt = acode.require('prompt');

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const options = {
  match: emailRegex,
  required: true,
  placeholder: 'Enter your email',
  test: (value) => emailRegex.test(value),
};

const userEmail = await prompt('What is your email?', '', 'email', options);
```

In this example, a prompt is created with the given options and parameters, including email validation.

## Gotchas <Badge type="tip" text="new" />

- **The OK button starts disabled when `defaultValue` is empty.** `disabled: !defaultValue` is evaluated once, at creation. With `defaultValue: ''` the user must type at least one character before OK becomes clickable.
- **`test` silently overrides `match`.** Both run, but `test`'s result is assigned last, so a `match` that fails can still be accepted by `test` returning `true`. Pick one.
- **Enter and OK disagree on numbers.** The OK button coerces with `+` for `type: "number"`, while the form's `onsubmit` handler resolves the raw `input.value`. You can get `42` or `"42"` depending on how the user submitted. Normalize yourself.
- **Validation only runs on `input`.** `match` / `test` are never re-checked at submit time; the OK button's `disabled` flag is what gates the form submit.
- **Android Back / Esc leaves the promise pending forever.** The action stack entry points at the internal `hidePrompt()` teardown, which removes the dialog without resolving. If your flow depends on the answer, prefer [`confirm`](./confirm.md).
- **The input grabs focus and selects its content on focus**, and `system.setInputType("NORMAL")` is restored to the user's `keyboardMode` setting when the dialog closes.

## See also

- [`multiPrompt`](./multi-prompt.md) — several inputs in one dialog
- [`confirm`](./confirm.md) — yes/no dialog
- [`select`](./select.md) — pick from a list
- [`alert`](./alert.md) — message with a single OK button
- [`colorPicker`](./color-picker.md) — pick a color
- [`dialogBox`](./custom-dialog.md) — build your own dialog
- [Input Hints](../../helpers/input-hints.md) — datalist-style hints for `multiPrompt` inputs