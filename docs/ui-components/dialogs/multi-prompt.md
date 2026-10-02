# Multi Prompt

The `multiPrompt` ui component in Acode is a dialog box for prompting users with multiple inputs at once. Whether you need to collect various pieces of information or gather complex input data.

::: info
Verified against Acode **v1.13.5**: `src/dialogs/multiPrompt.js`. `acode.require("multiPrompt")` and `acode.multiPrompt(...)` are the same function and forward all three arguments.
:::

## Usage

To use the `multiPrompt` component in your Acode plugin, you can require it using the following code:

```javascript
const multiPrompt = acode.require('multiPrompt');
```

Once you have the `multiPrompt` component, you can create an instance with the following syntax:

```javascript
const myPrompt = await multiPrompt(
  'Enter your name & age', // Message for the prompt modal
  [
    { type: 'text', id: 'name' },   // Example: Text input for the name
    { type: 'number', id: 'age' },  // Example: Number input for the age
  ],
  'https://example.com/help/' // Help URL or help text
);
```

### Signature

| Signature | Returns |
| --- | --- |
| `multiPrompt(message: string, inputs: Array<Input \| Array>, help?: string): Promise<Record<string, string \| boolean>>` | Rejects with `undefined` when Cancel is pressed |

The resolved value is an **object keyed by each input's `id`**, not an array:

```js
const values = await multiPrompt('Sign up', [
  {type: 'text', id: 'name', required: true, placeholder: 'Name'},
  {type: 'email', id: 'email', required: true, placeholder: 'Email'},
  {type: 'checkbox', id: 'newsletter', placeholder: 'Send me news'},
]);

values.name;       // string
values.email;      // string
values.newsletter; // boolean — checkboxes resolve to their checked state
```

## Parameters

- **`message (string):`**
  - The title for the prompt modal.

- **`inputs (Array<Input|Array<Input>>):`**
  - The inputs to prompt the user for. Each element is either a single `Input` object, or a **nested array** which becomes a labelled input group.

  :::tip
  - Provide clear and concise messages to guide users through the input process.
  - Utilize various input types, such as text, number, etc., based on the type of information you need. [Check this reference for more](http://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types).
  :::

- **`help (string):`**
  - The help affordance at the top-right of the `multiPrompt`.
  - If it starts with `http://` or `https://` an `<a class="icon help">` link is rendered.
  - Any other string renders a tappable `<span class="icon help">` that opens an `alert()` with the string as its body — so plain help text works just as well as a URL.

  ::: warning
  - Ensure that the help URL provided is accessible and relevant to assist users effectively.
  :::

### Parameters at a glance

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `message` | `string` | Yes | — | Dialog title. |
| `inputs` | `Array<Input \| Array>` | Yes | — | Fields to render. |
| `help` | `string` | No | `undefined` | Help link (URL) or help text (anything else). |

### Input shape <Badge type="tip" text="new" />

Every key below is optional except `id`, which becomes the key of the resolved object.

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | **Required.** Element id, and the key used in the resolved object. |
| `type` | `string` | `"text"` | `<input type>` or `"textarea"`. `"filename"` is rewritten to `"text"`. `"checkbox"` and `"radio"` render a switch/checkbox row instead of a text field. |
| `value` | `string \| boolean` | — | Initial value. For `checkbox` / `radio` it is the initial **checked** state. |
| `placeholder` | `string` | — | Placeholder text; for `checkbox` / `radio` this is the visible **label**. |
| `required` | `boolean` | `false` | Blocks OK and shows the localized "required" message when empty. |
| `match` | `RegExp` | — | On mismatch, shows "invalid value" and disables OK. |
| `name` | `string` | — | Sets the `name` attribute, which is what groups `radio` inputs. |
| `disabled` | `boolean` | `false` | Disables the field. |
| `readOnly` | `boolean` | `false` | Makes the field read-only. |
| `hidden` | `boolean` | `false` | Hides the field (useful for conditional flows driven from `onchange`). |
| `autofocus` | `boolean` | `false` | If several inputs set it, the **last** one wins and is focused on open. |
| `hints` | `string` | — | Adds an inline hint element to the field via Acode's `inputhints` helper. |
| `sensitive` | `boolean` | `false` | Clears the field's value when the dialog closes. `type: "password"` is always treated as sensitive. |
| `onclick` | `(e: Event) => void` | — | Bound with `this` set to the input element. |
| `onchange` | `(e: Event) => void` | — | Bound with `this` set to the input element. |

### Input groups

A nested array becomes a titled group. Inside a group, **string** elements set the group heading and object elements become fields (if several strings are given, the last one becomes the heading):

```js
const values = await multiPrompt('Add SFTP', [
  {id: 'alias', type: 'text', required: true, value: 'my-server'},
  [
    'Authentication',
    {
      id: 'usePassword',
      type: 'radio',
      name: 'authType',
      value: true,
      placeholder: 'Password',
      onchange() {
        // `this` is the input; `this.prompt` exposes the dialog internals.
        if (!this.checked) return;
        this.prompt.$body.get('#password').hidden = false;
        this.prompt.$body.get('#keyFile').hidden = true;
      },
    },
    {id: 'useKey', type: 'radio', name: 'authType', placeholder: 'Key file'},
  ],
  {id: 'password', type: 'password', hidden: true},
  {id: 'keyFile', type: 'text', hidden: true},
]);
```

::: info
Every created input exposes a `prompt` property of the shape `{ $body, hide }`:

- `$body` — the dialog body element; use `$body.get("#id")` to reach sibling fields.
- `hide()` — closes the dialog programmatically (the promise then stays pending, so set your own flag).

It also exposes `setError(message)` — pass a string to show a custom error and disable OK, or `""` to clear it.
:::

## Returns

The `multiPrompt` component returns a promise that resolves to an **object** whose keys are the `id` of each input. Text-like fields resolve to their string value; `checkbox` and `radio` fields resolve to a **boolean**. You can access the values using the provided IDs in the input configuration.

| Interaction | Outcome |
| --- | --- |
| **OK button / Enter** | Resolves with the values object |
| **Empty `required` field** | OK is blocked, "required" is shown next to the offending field |
| **Cancel button** | **Rejects with `undefined`** |
| **Backdrop tap** | Nothing happens — the backdrop has no click handler |
| **Android Back / Esc** | Nothing settles — see [Gotchas](#gotchas) |

## Example

```javascript:line-numbers
const multiPrompt = acode.require('multiPrompt');
const myPrompt = await multiPrompt(
  'Enter your name & age',
  [
    { type: 'text', id: 'name' },
    { type: 'number', id: 'age' },
  ],
  'https://example.com/help/'
);
```

Now you can access the values of the inputs using:

```javascript:line-numbers
const userName = myPrompt['name'];
const userAge = myPrompt['age'];
```

:::info
- The `multiPrompt` component supports a variety of input configurations. Refer to the html [`Input`](http://developer.mozilla.org/en-US/docs/Web/HTML/Element/input) element type for details.
:::

### Handling cancellation

```js
const multiPrompt = acode.require('multiPrompt');

try {
  const values = await multiPrompt('New project', [
    {id: 'name', type: 'text', required: true},
    {id: 'path', type: 'text', placeholder: 'Relative path'},
  ]);
  await createProject(values);
} catch {
  // The Cancel button rejects with `undefined`.
  acode.require('toast')('Project creation cancelled');
}
```

## Gotchas <Badge type="tip" text="new" />

- **Cancel rejects, it does not resolve `null`.** `reject()` is called with no argument, so `err` is `undefined` — `err.message` will throw. Use a bare `catch`.
- **Android Back / Esc leaves the promise pending forever.** The action stack entry points at the internal `hidePrompt()` teardown, which removes the dialog without settling the promise. Wrapping the call in `try/catch` does not help here.
- **`id` is mandatory in practice.** Without it the field cannot be read back from the resolved object, and duplicate `id`s overwrite each other.
- **Every value is a string.** `type: "number"` only changes the rendered input type; the resolved value is still `input.value`. Coerce with `Number()` yourself.
- **`match` disables the whole dialog.** One failing field disables OK for the entire prompt; the error message is a single shared node that gets moved next to the field being edited.
- **`sensitive` wipes the live field on close.** Values are snapshotted into the resolved object *before* the wipe, so read secrets from the result — a retained DOM reference will already be empty.
- **`help` is not required to be a URL.** Any other string becomes the body of an `alert()` when the help icon is tapped.
- **`multiPrompt` and `prompt` share the action-stack id `"prompt"`**, so opening one from inside the other's callbacks can confuse Back-navigation.

## See also

- [`prompt`](./prompt.md) — single-field equivalent
- [`confirm`](./confirm.md) — yes/no dialog
- [`select`](./select.md) — pick from a list
- [`alert`](./alert.md) — message with a single OK button
- [`colorPicker`](./color-picker.md) — pick a color
- [`dialogBox`](./custom-dialog.md) — build your own dialog
- [`loader`](./loader.md) — progress dialog
- [Input Hints](../../helpers/input-hints.md) — the `hints` option