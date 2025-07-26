# File List API

The File List API provides functionality to manage and interact with files and folders in the Acode workspace. It returns a tree structure representing the file system hierarchy.

## Usage

### Basic Usage

```js
// Get the fileList API
const fileList = acode.require('fileList');

// Get list of all files
const files = await fileList();

// Process files
files.forEach(file => {
		console.log(`Name: ${file.name}`);
		console.log(`Path: ${file.path}`);
});
```

### Event Handling

```js
const fileList = acode.require('fileList');

// Listen for file changes
fileList.on('add-file', (file) => {
		console.log(`New file added: ${file.path}`);
});

fileList.on('remove-file', (file) => {
		console.log(`File removed: ${file.path}`);
});
```

## Tree Object

The Tree object represents files and folders in the workspace.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| name | string | Name of the file/folder |
| url | string | Absolute URL path |
| path | string | Relative path |
| children | Array&lt;Tree&gt; | Child files/folders (if directory) |
| parent | Tree | Parent folder reference |
| isConnected | boolean | Whether root is in open folder list |
| root | Tree | Root folder reference |

### Methods

#### update(url: string, name?: string)
Updates the file/folder URL and name

```js
tree.update('/new/path/file.txt', 'newname.txt');
```

#### toJSON()
Converts tree to JSON representation

```js
const json = tree.toJSON();
```

#### static fromJSON(json: object)
Creates tree from JSON data

```js
const tree = Tree.fromJSON(jsonData);
```

#### static create(url: string, name?: string, isDirectory?: boolean)
Creates a new tree instance

```js
const newTree = await Tree.create('/path/file.txt', 'file.txt');
```

## Events

The File List API emits the following events:

| Event | Description |
|-------|-------------|
| add-file | File added to workspace |
| remove-file | File removed from workspace |
| add-folder | Folder added to workspace |
| remove-folder | Folder removed from workspace |
| refresh | File list refreshed |

## Error Handling

The API includes built-in error handling with automatic retries for failed operations. Use try/catch blocks when calling async methods:

```js
try {
		const files = await fileList();
} catch (err) {
		console.error('Error accessing files:', err);
}
```
