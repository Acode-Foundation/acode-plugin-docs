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
  SlidersHorizontal,
  Smartphone,
  Zap,
  ArchiveRestore
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

### Core Settings

|              Icon               | Category                                              | Description                                 |
| :-----------------------------: | :---------------------------------------------------- | :------------------------------------------ |
| <SlidersHorizontal :size="18"/> | [**App Settings**](./settings/app-settings)           | General application behavior & preferences. |
|       <Edit3 :size="18"/>       | [**Editor Settings**](./settings/editor-settings)     | Code editor customization.                  |
|     <Terminal :size="18"/>      | [**Terminal Settings**](./settings/terminal-settings) | Built-in terminal configuration.            |
|        <Eye :size="18"/>        | [**Preview Settings**](./settings/preview-settings)   | In-app web preview settings.                |

### Customization

|          Icon           | Category                      | Description                                                                                              |
| :---------------------: | :---------------------------- | :------------------------------------------------------------------------------------------------------- |
|  <Palette :size="18"/>  | [**Theme**](./settings/themes) | Change app or editor themes.                                                                             |
| <Smartphone :size="18"/> | **App Icon**                  | Pick the icon shown on your home screen. The app closes to apply it; some icons need Pro or a short ad. |

### Tools

|          Icon          | Category                                      | Description                                                        |
| :--------------------: | :-------------------------------------------- | :----------------------------------------------------------------- |
| <AlignLeft :size="18"/> | [**Formatter**](./settings/formatter)         | Configure code formatters per language.                            |
|  <Puzzle :size="18"/>  | [**Plugins**](/user-guide/plugins)            | Manage installed plugins or install new ones.                      |
|    <Zap :size="18"/>    | [**Language Servers**](/user-guide/language-servers) | Autocomplete, diagnostics and other code intelligence. |

### Maintenance

|             Icon             | Category                                            | Description                                  |
| :--------------------------: | :-------------------------------------------------- | :------------------------------------------- |
| <ArchiveRestore :size="18"/> | [**Backup & Restore**](./settings/backup-restore)   | Save your setup to a file or restore it.     |
|    <FileJson :size="18"/>    | **Edit settings.json**                              | Manually edit the JSON settings file.        |
|   <RotateCcw :size="18"/>    | **Restore Defaults**                                | Reset all settings to defaults.              |

### About Acode

|          Icon          | Category      | Description                   |
| :--------------------: | :------------ | :---------------------------- |
| <FileText :size="18"/> | **Changelog** | Latest app release notes.     |
