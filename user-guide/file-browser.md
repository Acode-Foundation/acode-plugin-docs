<script setup>
import { 
  Check, 
  Plus, 
  MoreVertical, 
  File, 
  Folder, 
  Hammer, 
  Package, 
  Trash2, 
  Pencil, 
  Info, 
  ExternalLink, 
  Copy, 
  Baseline
} from 'lucide-vue-next';
</script>

# File Browser

The File Browser is the heart of your project management in Acode. It allows you to manage files from internal storage, external SD cards (via SAF), and remote servers (FTP/SFTP).

## Home View

The Home View acts as the centralized hub for all your file connections.

![File Browser Home](/file_browser.png)

### Top Bar Actions

|            Icon             | Name               | Description                                                               |
| :-------------------------: | :----------------- | :------------------------------------------------------------------------ |
|   <Baseline :size="20" />   | **Selection Mode** | Toggles selection mode to select multiple items (for batch delete, etc.). |
|     <Plus :size="20" />     | **Add Connection** | Opens a menu to add new storage paths or remote connections.              |
| <MoreVertical :size="20" /> | **Menu**           | Access global file browser settings and actions.                          |

::: details <Plus :size="16" style="display:inline; vertical-align:middle"/> Add Connection Options

- **Add Path**: select a local folder (e.g., from external SD card or internal storage) using the Android Storage Access Framework (SAF).
- **Add FTP**: Setup a connection to a standard FTP server.
- **Add SFTP**: Setup a secure connection to an SFTP server.
  :::

::: details <MoreVertical :size="16" style="display:inline; vertical-align:middle"/> Menu Options

- **Settings**: Configure file browser behavior (e.g., show hidden files, sorting).
- **Reset Connections**: Clear all saved remote connections and paths.
- **Reload**: Refresh the list of connections.
  :::

---

## Project & Folder View

Navigating into a folder or project changes the available tools to focus on content creation.

![File Browser Project View](/file_browser_project.png)

### Managing Files

When inside a folder, the <Plus :size="16" style="display:inline; vertical-align:middle"/> button allows you to create content:

- <File :size="16" style="display:inline; vertical-align:middle"/> **New File**: Create a blank file.
- <Folder :size="16" style="display:inline; vertical-align:middle"/> **New Folder**: Create a new subdirectory.
- <Hammer :size="16" style="display:inline; vertical-align:middle"/> **New Project**: Initialize a project from built-in templates.
- <Package :size="16" style="display:inline; vertical-align:middle"/> **Import Project**: Extract and import a project from a `.zip` file.

### Context Actions (Long Press)

::: tip Pro Tip
**Long press** on any file or folder to reveal the context menu.
:::

- <Trash2 :size="16" style="display:inline; vertical-align:middle"/> **Delete**: Remove the item permanently.
- <Pencil :size="16" style="display:inline; vertical-align:middle"/> **Rename**: Change the name of the file or folder.
- <Info :size="16" style="display:inline; vertical-align:middle"/> **Info**: View properties like size, permission, and full path.
- <ExternalLink :size="16" style="display:inline; vertical-align:middle"/> **Open With**: Force open a file with a specific mode or external app.
- <Copy :size="16" style="display:inline; vertical-align:middle"/> **Copy URI**: Copy the file's path to your clipboard.

### Active Workspace

::: info Open Folder
At the bottom right (or via the check button), you will see an **Open** button (<Check :size="16" style="display:inline; vertical-align:middle"/>).
:::

Clicking this sets the **currently visible folder** as your **Active Workspace** in the sidebar. This loads the folder into the side panel for quick access while editing files.
