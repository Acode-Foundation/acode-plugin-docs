# Acode Theme Management

Acode provides a flexible and intuitive module for managing themes, enabling developers to seamlessly add, retrieve, update, and list themes within their project.

## API Overview

```javascript
const themes = acode.require('themes');
```

## Methods

### `add(theme: ThemeBuilder)`

Adds a new theme to the theme collection.

**Parameters:**
- `theme` (required): An instance of ThemeBuilder defining the theme's properties

**Example:**
```javascript
const theme = new ThemeBuilder('Modern Dark', 'dark');
themes.add(theme);
```

### `get(name: string)`

Retrieves a specific theme by its name.

**Parameters:**
- `name` (required): The unique name of the theme to retrieve

**Returns:** 
- ThemeBuilder instance representing the requested theme

**Example:**
```javascript
const theme = themes.get('Modern Dark');
```

### `update(theme: ThemeBuilder)`

Updates an existing theme in the theme collection.

