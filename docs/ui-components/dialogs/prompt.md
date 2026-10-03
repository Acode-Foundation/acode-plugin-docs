---
title: Prompt
description: Ask the user for a line of text or a number in a modal dialog.
---

# Prompt

`prompt` shows a modal with an input field and resolves with what the user typed.

```js
const prompt = acode.require("prompt");
```

## Signature

```ts
prompt(message, defaultValue?, type?, options?): Promise<string | number | null>
```

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `message` | `string` | | Text shown above the input. |
| `defaultValue` | `string` | | Initial value of the input. |
| `type` | `string` | `"text"` | Input type. One of `text`, `textarea`, `number`, `tel`, `search`, `email`, `url`. |
| `options` | `PromptOptions` | `{}` | Validation and appearance. See [Options](#options). |

## Returns

A `Promise` that resolves with:

- the typed **string**, or a **number** when `type` is `"number"`
- `null` if the user pressed **Cancel**

Closing the dialog with the back button does **not** resolve: the promise stays pending.

Always check for `null` before using the result. An empty string is a valid answer unless you set `required`.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `placeholder` | `string` | none | Placeholder text of the input. |
| `required` | `boolean` | `false` | Refuse an empty answer and show a "required" message. |
| `match` | `RegExp` | none | The input must match this expression. |
| `test` | `(value: string) => boolean` | none | Custom validator. Return `false` to reject the value. |
| `capitalize` | `boolean` | `true` | Ask the keyboard to capitalize the first letter. Set to `false` for code, paths and identifiers. |

While the value is invalid, the **OK** button is disabled and an "invalid value" message is shown under the input.

::: info
If you set both `match` and `test`, only `test` decides. Do the regex check inside `test` if you need both.
:::

## Examples

### Simple

```js
const name = await prompt("Project name", "my-project");
if (name === null) return; // cancelled
```

### Validated email

```js
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const email = await prompt("What is your email?", "", "email", {
  placeholder: "you@example.com",
  required: true,
  test: (value) => emailRegex.test(value),
});
```

### Number

```js
const port = await prompt("Port", "8080", "number", {
  test: (value) => Number(value) > 0 && Number(value) < 65536,
});
// port is a number (or null)
```

### Multi-line input

```js
const notes = await prompt("Notes", "", "textarea", { capitalize: false });
```

## See also

- [Multi Prompt](./multi-prompt.md) to ask for several values at once
