# Projects

This provide methods to manipulate project templates. This includes listing available projects, retrieving specific project details, and setting new project templates. This is particularly useful for creating and managing templates for different types of projects(frameworks), such as HTML templates, react, etc.

## Importing Projects

To use the Projects utilities, you need to import them using the `acode.require` method:

```javascript
const projects = acode.require('projects');
```

## Methods

### `list()`

The `list` method returns an array of objects, each containing the name and icon of a project.

#### Example

```javascript
const projectList = projects.list();
console.log(projectList);
// Output: [{ name: 'html', icon: 'html-project-icon' }]
```

### `get(name: string)`

The `get` method takes a project name as an argument and returns an object containing the files and icon of that project.

#### Example

```javascript
const projectDetails = projects.get('html');
console.log(projectDetails);
// Output: 
// {
//   files: {
//     'index.html': '...',
//     'css/index.css': '',
//     'js/index.js': '',
//   },
//   icon: 'html-project-icon',
// }
```

### `set(project: string, files: () => Promise<Map<string, string>>, iconSrc: string)`

The `set` method allows you to add a new project template. It takes the project name, a function that returns a map of files, and an icon source as arguments.

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

:::warning
- Ensure that the function provided for the `files` parameter returns a Promise that resolves to a map of filenames and their contents.
:::

## Important Note on Using the `projects` Utility

The `projects` utility does not persist added project templates. To avoid losing your templates when restarting the app, you must save them manually. Here's what you need to do:

1. **Save the Template:** Store the project template data in a persistent storage solution of your choice.
2. **Re-add on Initialization:** When your plugin initializes, use the `projects` utility to re-add the template.

Failure to save and re-add your templates will result in their loss after the app restarts. Ensure you implement this to maintain your project templates effectively.

:::tip
Implement a function within your plugin to handle the saving and re-adding process automatically. 
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
}

addNewProject();
```
