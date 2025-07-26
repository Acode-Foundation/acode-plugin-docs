# Encoding

This allow to **encode** and **decode** strings with different character sets. This is especially useful when working with **files** that require specific encodings or when handling international text.

## Importing Encodings

To use the Encoding utilities, you need to import them using the `acode.require` method:

```javascript
const encodings = acode.require('encodings');
```

## Usage

### Encoding a String

The `encode` method converts a string into an ArrayBuffer using the specified character set.

```javascript
const text = 'Hello World!';
const charset = 'utf-8';

const encoded = await encodings.encode(text, charset);
console.log(encoded);  // Output: ArrayBuffer
```

### Decoding an ArrayBuffer

The `decode` method converts an ArrayBuffer back into a string using the specified character set.

```javascript
const buffer = await encodings.encode(text, charset);
const decoded = await encodings.decode(buffer, charset);
console.log(decoded);  // Output: 'Hello World!'
```

## Methods

### `encode(text: string, charset: string): Promise<ArrayBuffer>`

Encodes a string with the specified character set.

- **text**: The text to encode.
- **charset**: The character set name (e.g., UTF-8, GBK).

### `decode(buffer: ArrayBuffer, charset: string): Promise<string>`

Decodes an ArrayBuffer into a string using the specified character set.

- **buffer**: The ArrayBuffer to decode.
- **charset**: The character set name (e.g., UTF-8, GBK).

## Properties

### `encodings: Array<Encoding>`

An array of all the supported encodings. Each `Encoding` object contains:

- **name**: The name of the encoding.
- **labels**: The labels of the encoding.
- **aliases**: The aliases of the encoding.

## Example

Here is a comprehensive example demonstrating how to encode and decode text using different character sets.

```javascript
const encodings = acode.require('encodings');

async function example() {
  const text = 'Hello World!';
  const charset = 'utf-8';

  try {
    // Encoding text
    const encoded = await encodings.encode(text, charset);
    console.log('Encoded:', encoded);

    // Decoding text
    const decoded = await encodings.decode(encoded, charset);
    console.log('Decoded:', decoded);

  } catch (error) {
    console.error('Encoding/Decoding error:', error);
  }
}

example();
```

:::info
Always handle encoding and decoding within a try-catch block to manage potential errors, such as unsupported character sets.
:::

### Checking Available Encodings

You can check all the available encodings supported by Acode:

```javascript
console.log(encodings.encodings);
```

This will print an array of `Encoding` objects, each containing details about the encoding.
