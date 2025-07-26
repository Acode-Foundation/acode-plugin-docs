# Prompt

The `prompt` ui component in Acode is a dialog box for displaying prompts to users, allowing them to provide input in a convenient and straightforward manner.

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

## Parameters

- **`message (string):`**
  - A string that represents the message to be displayed to the user.

- **`defaultValue (string):`**
  - A string that represents the default value of the input.

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

- **`options (PromptOptions):`**
  - An object that contains additional options for the prompt.

### PromptOptions

- **`match (RegExp):`**
  - A regular expression that the input must match.

- **`required (boolean):`**
  - A boolean that indicates whether the input is required or not.

  :::warning 
  - Be mindful of the `required` option, and consider the user experience when making input mandatory.
  :::

- **`placeholder (string):`**
  - A string that represents the placeholder text of the input.

- **`test (Function):`**
  - A function that takes in a value and returns a boolean indicating whether the value is valid.

  :::info
  - The `test` function can be used for custom validation of the input.
  :::


## Returns

The `prompt` component returns a promise that resolves to a string, number, or null if the prompt is canceled.

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
