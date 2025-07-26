# Multi Prompt

The `multiPrompt` ui component in Acode is a dialog box for prompting users with multiple inputs at once. Whether you need to collect various pieces of information or gather complex input data.

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
  'https://example.com/help/' // Help text with the associated URL
);
```

## Parameters

- **`message (string):`**
  - The title for the prompt modal.

- **`inputs (Array<Input|Array<Input>>):`**
  - The inputs to prompt the user for. It can be a single input or an array of inputs. Each input is defined by an object with various properties such as `id`, `type`, `placeholder`, etc.

  :::tip
  - Provide clear and concise messages to guide users through the input process.
  - Utilize various input types, such as text, number, etc., based on the type of information you need. [Check this reference for more](http://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types).
  :::

- **`help (string):`**
  - The help icon at the top of the `multiPrompt` will be enabled with the specified help URL.
  - It must be valid url

  :::warning
  - Ensure that the help URL provided is accessible and relevant to assist users effectively.
  :::

## Returns

The `multiPrompt` component returns a promise that resolves to an array of strings representing the user's input. You can access the values using the provided IDs in the input configuration.

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
