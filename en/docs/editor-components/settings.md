# Settings

The Settings module provides a way to interact with Acode's settings, allowing you to read, update and listen for changes to settings values.

## Getting Started

To use the Settings module, first import it:

```js
const settings = acode.require('settings');
```

## Basic Usage

### Reading Settings

Use the `get()` method to read a setting value:

```js
// Get current font size
const fontSize = settings.get('fontSize');

// Get current theme
const theme = settings.get('appTheme');
```

### Updating Settings

Update one or more settings using the `update()` method:

```js
// Update single setting
settings.update({
		fontSize: '16px'
});

// Update multiple settings
settings.update({
		fontSize: '16px',
		appTheme: 'dark',
		tabSize: 4
});
```

### Resetting Settings

Reset settings to their default values:

```js
// Reset all settings
settings.reset();

// Reset specific setting
settings.reset('fontSize');
```

## Event Handling

The settings module allows you to listen for setting changes using event handlers.

### Listening for Changes

```js
// Listen for font size changes
settings.on('update:fontSize', (newValue) => {
		console.log('Font size changed to:', newValue);
});

// Listen for theme changes
settings.on('update:appTheme', (newTheme) => {
		console.log('Theme changed to:', newTheme);
});
```

### Removing Event Listeners

```js
const handler = (value) => {
		console.log('Font size:', value);
};

// Add listener
settings.on('update:fontSize', handler);

// Remove listener when no longer needed
settings.off('update:fontSize', handler);
```

## API Reference

### Methods

#### `get(setting: string)`
Gets the value of a setting

Parameters:
- `setting`: Name of the setting to get

Returns: The current value of the setting

#### `update(settings: object, showToast?: boolean)`
Updates one or more settings

Parameters:
- `settings`: Object containing settings to update
- `showToast`: Whether to show a confirmation toast (default: true)

#### `reset(setting?: string)`
Resets settings to default values

Parameters:
- `setting`: Optional specific setting to reset. If omitted, resets all settings

#### `on(event: string, callback: Function)`
Adds an event listener

Parameters:
- `event`: Event name in format 'update:setting' or 'reset'
- `callback`: Function to call when event occurs

#### `off(event: string, callback: Function)`
Removes an event listener

Parameters:
- `event`: Event name
- `callback`: Function to remove
