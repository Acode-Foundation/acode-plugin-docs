# Theme Builder


### Introduction

The `ThemeBuilder` api from the `acode` core libraries  provides a solution for creating and customizing themes in Acode . It offers control over various UI elements, colors, and styles.

### Basic Usage

1. **Import the ThemeBuilder Class**

```javascript
const ThemeBuilder = acode.require('themeBuilder');
```

2. **Create a Theme Instance**

```javascript
const myTheme = new ThemeBuilder("MyDarkTheme", "dark");
```

- **Theme Name**: A descriptive name reflecting the theme's style (e.g., `"MyDarkTheme"`)
- **Theme Mode**: Specifies the base mode (`"light"` or `"dark"`)

3. **Customize Theme Properties**

```javascript
myTheme.primaryColor = "#333";
myTheme.secondaryColor = "#666";
myTheme.textColor = "#ffffff";
myTheme.backgroundColor = "#121212";
```

### Customizable Theme Properties

#### Color Palette
- `primaryColor`: Main color for primary elements
- `secondaryColor`: Accent color for secondary elements
- `textColor`: Main text color
- `backgroundColor`: Application background color
- `activeColor`: Color for active elements
- `dangerColor`: Color for error or destructive actions
- `linkTextColor`: Color for clickable links

#### Typography
- `fontFamily`: Font type and fallbacks
- `fontSize`: Base font size
- `fontWeight`: Text thickness

#### Specific Element Styles
- `buttonBackgroundColor`: Button background
- `buttonTextColor`: Button text color
- `borderColor`: Element border color
- `popupBackgroundColor`: Popup/modal background
- `scrollbarColor`: Scrollbar color

### More Styling Options

#### Color Manipulation
```javascript
// Generate a darker version of the primary color
const darkenedPrimaryColor = myTheme.darkenPrimaryColor();
```

#### Theme Types
- `"light"`: Light color scheme
- `"dark"`: Dark color scheme

### Complete Theme Configuration Example

```javascript
const myCustomTheme = new ThemeBuilder("ModernDark", "dark");

// Color Configuration
myCustomTheme.primaryColor = "#2196F3";
myCustomTheme.secondaryColor = "#FF4081";
myCustomTheme.textColor = "#FFFFFF";
myCustomTheme.backgroundColor = "#121212";

// Typography
myCustomTheme.fontFamily = "Roboto, sans-serif";
myCustomTheme.fontSize = "16px";
myCustomTheme.fontWeight = "400";

// Element-Specific Styles
myCustomTheme.buttonBackgroundColor = "#2196F3";
myCustomTheme.buttonTextColor = "#FFFFFF";
myCustomTheme.borderColor = "#333333";
```

### Best Practices
- Choose a consistent color palette
- Ensure sufficient contrast between text and background
- Test your theme across different components and states
- Use the `darkenPrimaryColor()` method for dynamic color variations

### Supported CSS Custom Properties

The ThemeBuilder generates the following CSS custom properties:
- `--primary-color`
- `--secondary-color`
- `--text-color`
- `--background-color`
- `--active-color`
- `--button-background-color`
- `--border-color`
- And many more...

### Notes
- Always import the ThemeBuilder from the `acode` library
- Theme customization is flexible and supports both light and dark modes
- You can override default styles for specific UI components
- for theme management check the `themes`documentation
=======
**Theme Builder**

**Introduction**

To create a new theme for your application, you'll need to utilize the `ThemeBuilder` class provided by the `acode` library. This class offers a straightforward way to customize various aspects of your theme, from primary and secondary colors to font styles and more.

**Basic Usage**

1. **Import the `ThemeBuilder` class:**
   ```javascript
   const ThemeBuilder = acode.require('themeBuilder');
   ```
2. **Create a new theme instance:**
   ```javascript
   const myTheme = new ThemeBuilder("MyDarkTheme", "dark");
   ```
   * **Theme Name:** The first argument, `"MyDarkTheme"`, is the name of your theme. It should be a descriptive name that reflects the theme's style.
   * **Theme Mode:** The second argument, `"dark"`, specifies the base mode of the theme (either "light" or "dark").

3. **Customize theme properties:**
   ```javascript
   myTheme.primaryColor = "#333";
   myTheme.secondaryColor = "#666";
   // ... other theme property customizations
   ```
   You can customize various theme properties, such as:
   * `primaryColor`
   * `secondaryColor`
   * `textColor`
   * `backgroundColor`
   * `fontFamily`
   * `fontSize`
   * `fontWeight`
   * // ... and many more


