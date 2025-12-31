<script setup>
import { 
  Edit3, 
  Terminal, 
  Eye, 
  FileText, 
  RotateCcw, 
  FileJson, 
  AlignLeft, 
  Puzzle, 
  Palette,
  EllipsisVertical,
  SlidersHorizontal
} from 'lucide-vue-next';
</script>

# Settings

Customize every aspect of Acode to suit your workflow.

## Accessing Settings

You can open the Settings page using any of the following methods:

| Method              | How                                                                                                            |
| :------------------ | :------------------------------------------------------------------------------------------------------------- |
| **Menu**            | Open the menu(<EllipsisVertical :size="16" style="display:inline; vertical-align:middle"/>) → tap **Settings** |
| **Shortcut**        | Press **`Ctrl` + `,`**                                                                                         |
| **Command Palette** | Search for **"Show Settings"**                                                                                 |

## Settings Categories

|              Icon               | Category                                              | Description                                   |
| :-----------------------------: | :---------------------------------------------------- | :-------------------------------------------- |
| <SlidersHorizontal :size="18"/> | [**App Settings**](./settings/app-settings)           | General application behavior & preferences.   |
|       <Edit3 :size="18"/>       | [**Editor Settings**](./settings/editor-settings)     | Code editor customization.                    |
|     <Terminal :size="18"/>      | [**Terminal Settings**](./settings/terminal-settings) | Built-in terminal configuration.              |
|        <Eye :size="18"/>        | [**Preview Settings**](./settings/preview-settings)   | In-app web preview settings.                  |
|     <FileText :size="18"/>      | **Changelog**                                         | Latest app release notes.                     |
|     <RotateCcw :size="18"/>     | **Restore Defaults**                                  | Reset all settings to defaults.               |
|     <FileJson :size="18"/>      | **Edit settings.json**                                | Manually edit the JSON settings file.         |
|     <AlignLeft :size="18"/>     | [**Formatter**](./settings/formatter)                 | Configure code formatters per language.       |
|      <Puzzle :size="18"/>       | [**Plugins**](/user-guide/plugins)                    | Manage installed plugins or install new ones. |
|      <Palette :size="18"/>      | [**Theme**](./settings/themes)                        | Change app or editor themes.                  |
