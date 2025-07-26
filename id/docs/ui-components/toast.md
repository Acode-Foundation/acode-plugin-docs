# Toast

This ui component help in showing toast messages for given time interval.

## Usage

To use the `toast` component in your Acode plugin, you can require it using the following code:

```javascript
const toast = acode.require('toast');
```

Once you have the `toast` component, you can use it with the following syntax:

```javascript
toast('Hello, World!', 3000);
```

:::info 
You can also use toast function directly from the global object without requiring it using acode.
For eg:
```javascript
window.toast('Hello, World!', 3000);
```
:::

## Parameters

- **msg (string):**
  - The message to be displayed in the toast.
  
- **milliSecond (number):**
  - The duration in milliseconds for which the toast should be displayed.

## Example

```javascript:line-numbers
const toast = acode.require('toast');

toast('Hello, World!', 3000);

// or 
window.toast('Hello, World!', 3000);
```

This will display the message "Hello, World!" for 3 seconds (3000 milliseconds).