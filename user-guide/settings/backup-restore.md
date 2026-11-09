---
description: Back up Acode's settings, key bindings and installed plugins to a file and restore them on any device.
---

# Backup & Restore

Save your Acode setup to a single file and bring it back later, on the same phone or a new one.

Open it from **Settings** > **Backup & Restore**.

## What Is Included

| Included | Not included |
| :------- | :----------- |
| All settings (including your custom theme) | FTP / SFTP connections |
| Key bindings | Open files, folders and other app state |
| The list of installed plugins | Terminal files (see [Terminal backup](../terminal#backup-restore)) |

## Creating a Backup

1. Tap **Backup**.
2. Choose a folder.

Acode creates a `Backup` folder inside it and saves a file named like `Acode_backup_20261109_2030.backup` (date and time). Copy this file somewhere safe, such as cloud storage, if you are moving to a new phone.

## Restoring a Backup

1. Tap **Restore** and pick a `.backup` file.
2. Acode checks the file and shows what it will restore: settings, key bindings and the number of plugins. If the file was modified or comes from an older version of Acode, the summary includes a warning.
3. Confirm to continue. Restoring replaces your current settings and key bindings, and can't be undone.

Plugins in the backup are downloaded and installed again from the plugin registry, so you need an internet connection. Paid plugins are restored with your existing purchase. When it finishes, Acode asks to reload so the changes take effect.

::: tip
To go back to the default settings instead, use **Restore default settings** in the Maintenance section of Settings.
:::
