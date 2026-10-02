# Projects

This provide methods to manipulate project templates. This includes listing available projects, retrieving specific project details, and setting new project templates. This is particularly useful for creating and managing templates for different types of projects(frameworks), such as HTML templates, react, etc.

::: info
Verified against Acode **v1.13.5** (versionCode `1011`): `src/lib/projects.js`. There are only four members — `list()`, `get()`, `set()` and `delete()`. A "project" here is purely a **name → file-template + icon** record; it has no root path, no editor session and no settings of its own.
:::

## Importing Projects

To use the Projects utilities, you need to import them using the `acode.require` method:

```javascript
const projects = acode.require('projects');
```

## Methods

### `list()`

The `list` method returns an array of objects, each containing the name and icon of a project.

It is **synchronous**, and each entry is built by invoking the project's own factory — so the built-in `html` project re-registers its icon CSS class on every call. Iterate it freely; there is no filtering argument.

#### Example

```javascript
const projectList = projects.list();
console.log(projectList);
// Output: [{ name: 'html', icon: 'html-project-icon' }]
```

| Member | Type | Description |
| --- | --- | --- |
| `name` | `string` | The key you pass to `get()`. |
| `icon` | `string` | An **icon class name**, not a URL — e.g. `"html-project-icon"`. It is rendered with the app's `.icon` element and is registered through `acode.addIcon()`. |

### `get(name: string)`

The `get` method takes a project name as an argument and returns an object containing the files and icon of that project. It returns `undefined` for an unknown name, so guard before use.

#### Example

```javascript
async function readTemplate(name) {
  const template = projects.get(name);
  if (!template) return null;

  template.icon;                  // "html-project-icon"

  // files is a FUNCTION that must be awaited; it is not the map itself.
  const files = await template.files();
  // { "index.html": "...", "css/index.css": "", "js/index.js": "" }
  return files;
}
```

::: warning `files` is a function, not a map
`get()` hands back the template object without invoking `files`, so `projects.get(name).files` is `() => Promise<{...}>`. Awaiting it is mandatory — `console.log(projects.get('html'))` prints the function, not the files. This is exactly how the app consumes it in the file browser: `await projects.get(project).files()`.
:::

| Key | Type | Description |
| --- | --- | --- |
| `files` | `() => Promise<Record<string, string>>` | Async factory resolving to a map of **relative path → file content**. |
| `icon` | `string` | Icon class name for the project. |

### `set(project: string, files: () => Promise<Map<string, string>>, iconSrc: string)`

The `set` method allows you to add a new project template. It takes the project name, a function that returns a map of files, and an icon source as arguments.

It is synchronous, returns nothing, and **overwrites** an existing project with the same name. The icon is registered under the class name `${project}-project-icon`, and that same string becomes the template's `icon`.

#### Example

```javascript
const projectFiles = {
  'index.html': '<!DOCTYPE html>...',
  'css/index.css': '/* CSS file */',
  'js/index.js': '// JavaScript file',
};

const iconSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAABIUExURUdwTORPJuRPJuNOJeRPJuNQJ+RPJuNOJuNPJuROJeRPJuNOJuRPJuRQJONPJuNPJeVQI+NPJeROJuNPJuZPJ+NOJuRPJuNPJkmKsooAAAAXdFJOUwA6h5uxKGh/60/VE8BBll8izqXdDHT3jnqTYwAAAQRJREFUGBl9wY22azAURtGFhMS/Vvu9/5veHeGMMrhzAvoPkqBHgWTRo4XE6ZEjqfSoImn0qCGpZQYuBpmaJMpMXESZSFLIfLioZQoSLzMCzYmMJ+lkXsBbVx0bmR546YosSGqBUheBbJEUuFgkLWROpuMsSHJklYznTKYiK2WaHwWsMiXZRxceZpkP2SQzGO1mKGQmsigTwWvXQZSJZIVMDZ12K9QyBdks0wBDuUjvVw00MjNZJ1OxmWc2o0zHLkhynl9OUuDQyoS+jGx8PfZfSS2HXrvg6unVatdzcLrlOIy6NXIog26Ekj9+qlqdtNXkOSua/qvNt28Kbq1xfL/HuPLjH4f8MW+juHZUAAAAAElFTkSuQmCC';

projects.set('newProject', async () => projectFiles, iconSrc);
```

| Parameter | Type | Description |
| --- | --- | --- |
| `project` | `string` | Project name — also the key used by `list()` / `get()` and the prefix of the icon class. |
| `files` | `() => Promise<Record<string, string>>` | Async function returning the file map. Despite the `Map` in the JSDoc, **return a plain object** — the app reads it with `Object.keys()` and `project[fileUrl]`. |
| `iconSrc` | `string` | A `data:` URL (or any CSS `url()` value) for the project icon. |

:::warning
- Ensure that the function provided for the `files` parameter returns a Promise that resolves to a map of filenames and their contents.
:::

### `delete(project: string)` <Badge type="tip" text="new" />

Removes a project template. It is synchronous, returns nothing, and is a no-op when the project does not exist.

```js
projects.delete('newProject');
```

Use it in `acode.setPluginUnmount` to undo a `set()` instead of leaking the template into the session.

## File Map Semantics <Badge type="tip" text="new" />

The keys of the files map are **relative paths with `/` separators**, and nested directories are created for you. The file browser's "New project" flow (`src/pages/fileBrowser/fileBrowser.js`) walks the keys, splits each on `/`, and calls `createDirectory()` per missing segment before `createFile()` for the leaf:

```js
{
  'index.html': '...',            // -> <new folder>/index.html
  'css/index.css': '',            // -> <new folder>/css/index.css
  'js/index.js': '',              // -> <new folder>/js/index.js
}
```

Two template conventions the built-in project uses:

- **`<%name%>` placeholders are substituted** with the project name the user typed before the file is written (`data.replace(/<%name%>/g, projectName)`).
- **Content is written verbatim** — an empty string creates an empty file, and no encoding is passed, so write UTF-8 text.

## What a Project Affects <Badge type="tip" text="new" />

A project only feeds one place in the app: the **"New project" action of the file browser / create dialog**. It does **not** change the file-browser root, the open editor session, the sidebar folder list, or any setting.

| Affected | Not affected |
| --- | --- |
| The template picker built from `projects.list()` — `name` and `icon` become the option label and icon | `editorManager.activeFile`, open tabs, the current file |
| The files materialised by `createDirectory()` + `createFile()` under the folder the user picked | The sidebar folder roots — that is [OpenFolder](./open-folder.md) / `acode.require("addedFolder")` |
| The `<%name%>` substitution | Any settings key — `projects` stores nothing on disk by itself |

## Important Note on Using the `projects` Utility

The `projects` utility does not persist added project templates. To avoid losing your templates when restarting the app, you must save them manually. Here's what you need to do:

1. **Save the Template:** Store the project template data in a persistent storage solution of your choice.
2. **Re-add on Initialization:** When your plugin initializes, use the `projects` utility to re-add the template.

Failure to save and re-add your templates will result in their loss after the app restarts. Ensure you implement this to maintain your project templates effectively.

:::tip
Implement a function within your plugin to handle the saving and re-adding process automatically. 
:::

::: warning Re-adding is required on every launch
The template registry lives in memory only (`const projects = { … }` in `src/lib/projects.js`), so `set()` must run again from `acode.setPluginInit` after each restart. Persist the **files factory source**, not its result, and pass a fresh async function to `set()` each time.
:::

## Example

### Adding a New Project Template

Here is a complete example of how to add a new project template, list all projects, and retrieve details of a specific project.

```javascript
const projects = acode.require('projects');

async function addNewProject() {
  const projectFiles = {
    'index.html': '<!DOCTYPE html>...',
    'css/index.css': '/* CSS file */',
    'js/index.js': '// JavaScript file',
  };

  const iconSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAABIUExURUdwTORPJuRPJuNOJeRPJuNQJ+RPJuNOJuNPJuROJeRPJuNOJuRPJuRQJONPJuNPJeVQI+NPJeROJuNPJuZPJ+NOJuRPJuNPJkmKsooAAAAXdFJOUwA6h5uxKGh/60/VE8BBll8izqXdDHT3jnqTYwAAAQRJREFUGBl9wY22azAURtGFhMS/Vvu9/5veHeGMMrhzAvoPkqBHgWTRo4XE6ZEjqfSoImn0qCGpZQYuBpmaJMpMXESZSFLIfLioZQoSLzMCzYmMJ+lkXsBbVx0bmR546YosSGqBUheBbJEUuFgkLWROpuMsSHJklYznTKYiK2WaHwWsMiXZRxceZpkP2SQzGO1mKGQmsigTwWvXQZSJZIVMDZ12K9QyBdks0wBDuUjvVw00MjNZJ1OxmWc2o0zHLkhynl9OUuDQyoS+jGx8PfZfSS2HXrvg6unVatdzcLrlOIy6NXIog26Ekj9+qlqdtNXkOSua/qvNt28Kbq1xfL/HuPLjH4f8MW+juHZUAAAAAElFTkSuQmCC';

  projects.set('newProject', async () => projectFiles, iconSrc);

  // List all projects
  const projectList = projects.list();
  console.log('Project List:', projectList);

  // Get details of the newly added project
  const newProjectDetails = projects.get('newProject');
  console.log('New Project Details:', newProjectDetails);

  // files is a factory — await it to get the actual map
  console.log('Files:', await newProjectDetails.files());
}
```

### Persisting and Cleaning Up <Badge type="tip" text="new" />

```js
const projects = acode.require("projects");
const fs = acode.require("fs");

const TEMPLATE = {
  "index.html": "<h1><%name%></h1>",
  "css/index.css": "body { margin: 0 }",
};

// Any value CSS `url()` accepts. A small data: URL is the safe choice.
const ICON = "data:image/svg+xml;base64,PHN2Zy8+";

const STORE = `${CACHE_STORAGE}/my-plugin/project.json`;

function files() {
  // Async because the app awaits the factory — useful when the template
  // itself has to be fetched first.
  return Promise.resolve(TEMPLATE);
}

acode.setPluginInit(plugin.id, async () => {
  // Restore a template saved in a previous session, if there is one.
  if (await fs(STORE).exists()) {
    const saved = await fs(STORE).readFile("json");
    TEMPLATE["index.html"] = saved["index.html"];
  } else {
    await fs(CACHE_STORAGE).createDirectory("my-plugin");
    await fs(CACHE_STORAGE).createFile("project.json", JSON.stringify(TEMPLATE));
  }

  projects.set("myTemplate", files, ICON);
});

acode.setPluginUnmount(plugin.id, () => {
  projects.delete("myTemplate");
});
```

::: info
`list()`, `get()`, `set()` and `delete()` never touch the file system and never reject — they are synchronous, in-memory operations. Wrap only the *storage* of your template in error handling.
:::
