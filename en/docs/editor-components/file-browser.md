# File Browser API

The File Browser API provides a way to let users browse and select files or folders within Acode.

## Import

```js
const fileBrowser = acode.require('fileBrowser');
```

## Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| mode | `'file'` \| `'folder'` \| `'both'` | The file browser mode | `'file'` |
| info | `string` | Message shown to user explaining purpose | - |
| doesOpenLast | `boolean` | Open last visited directory | `true` |
| defaultDir | `Array<{name: string, url: string}>` | Default directory to open | - |

## Return Value

Returns a Promise that resolves to a `SelectedFile` object:

```typescript
interface SelectedFile {
		type: 'file' | 'folder';  // Type of selected item
		url: string;              // Full path/URL
		name: string;            // File/folder name
}
```

## Examples

### Basic File Selection

```js
// Open file browser to select a file
const fileBrowser = acode.require('fileBrowser');

try {
		const result = await fileBrowser('file', 'Please select a configuration file');
		console.log(`Selected file: ${result.name}`);
		console.log(`File path: ${result.url}`);
} catch (err) {
		console.error('File selection was cancelled');
}
```

### Folder Selection with Default Directory

```js
// Open folder browser with default directory
const fileBrowser = acode.require('fileBrowser');

const defaultDir = [{
		name: 'Documents',
		url: '/storage/emulated/0/Documents'
}];

try {
		const result = await fileBrowser('folder', 'Select project folder', true, defaultDir);
		if (result.type === 'folder') {
				console.log(`Selected folder: ${result.name}`);
		}
} catch (err) {
		console.error('Folder selection was cancelled');
}
```

### Allow Both File and Folder Selection

```js
// Allow selecting either files or folders
const fileBrowser = acode.require('fileBrowser');

try {
		const result = await fileBrowser('both', 'Select file or folder');
		if (result.type === 'file') {
				console.log('File selected:', result.name);
		} else {
				console.log('Folder selected:', result.name);
		}
} catch (err) {
		console.error('Selection was cancelled');
}
```

## Error Handling

The File Browser promise will reject if:
- User cancels the selection
- File/folder access is denied
- Selected item cannot be opened

:::tip
Always wrap File Browser calls in try/catch blocks for proper error handling.
:::
