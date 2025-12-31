<script setup>
import {
  EllipsisVertical
} from 'lucide-vue-next';
</script>

# Terminal

Acode provides a full Linux terminal environment using proot with Alpine Linux.

## Getting Started

### Installation

1. Tap the **<EllipsisVertical :size="16" style="display:inline; vertical-align:middle"/>** in the top-right corner of the app
2. Select **Terminal**
3. If not installed, it will begin the installation process
4. Once installed, the terminal opens as an editor tab

::: info Background Process
The terminal runs as a foreground service. It will continue running in the background unless you explicitly close it or your device kills the process.
:::

## File Access

| Location                     | Access                                                                                                                             |
| :--------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Home directory** (`/home`) | Always accessible                                                                                                                  |
| **Public folder**            | Always accessible                                                                                                                  |
| **Internal storage**         | Requires **All Files Access** permission (from Terminal Settings). Not available on Play Store version. Only works on Android 10+. |

## Using the Terminal

### Package Management

The terminal uses Alpine Linux's `apk` package manager:

```bash
# Search for a package
apk search <query>

# Install a package
apk add <package>

# Uninstall a package
apk del <package>

# Update all packages
apk update && apk upgrade
```

::: warning Alpine Packages Only
Only Alpine Linux packages are supported. For Alpine-specific queries, refer to the [Alpine Linux documentation](https://wiki.alpinelinux.org/).
:::

### Acode CLI Tool

A built-in `acode` command lets you open files and folders directly in the Acode editor from the terminal:

```bash
# Open a file
acode file.txt

# Open current folder
acode .

# Open a specific folder
acode ~/project

# Show help
acode --help
```

## Customization

### Shell Configuration

You can customize your terminal using standard shell configuration files like:

- `/etc/profile`
- `~/.bashrc`
- `/etc/bash/bashrc`

### The `/initrc` File

Every time a terminal session starts, the `/initrc` script runs. This file allows you to:

- Set environment variables
- Customize your prompt (`PS1`)
- Source additional configuration files
- Define shell functions and aliases

::: details Example /initrc Configuration

```bash
# Custom environment variables
export EDITOR=nano

# Custom aliases
alias ll="ls -la"
alias update="apk update && apk upgrade"

# Custom prompt (already has a fish-style path shortening by default)
# PS1="\[\033[1;32m\]\u\[\033[0m\]@localhost \[\033[1;34m\]\w\[\033[0m\] \$ "
```

:::

### Default Features

The default `/initrc` includes:

- **Fish-style path shortening** in the prompt (e.g., `~/p/s/components`)
- **Command-not-found handler** that suggests packages to install
- **MOTD (Message of the Day)** display
- Automatic sourcing of standard rc files

## Terminal Settings

Configure terminal appearance and behavior in **Settings → Terminal Settings**. See [Terminal Settings](./settings/terminal-settings) for details.

## Multiple Terminal Tabs

You can open multiple terminal sessions as separate tabs. Each tab runs an independent shell session.

## Copy & Paste

- **Copy**: Long-press to select text, then use the copy option or `Ctrl+Shift+C`
- **Paste**: Long-press and select paste, or use `Ctrl+Shift+V`

## Backup & Restore

From **Terminal Settings**, you can:

| Action        | Description                                                |
| :------------ | :--------------------------------------------------------- |
| **Backup**    | Creates a backup of your terminal installation and config. |
| **Restore**   | Restores a previous backup.                                |
| **Uninstall** | Completely removes the terminal installation.              |

## Troubleshooting

::: details Terminal won't start

- Check if you have sufficient storage space
- Try uninstalling and reinstalling the terminal from Terminal Settings
- Clear the app cache and try again
  :::

::: details Packages fail to install

- Run `apk update` first to refresh package lists
- Check your internet connection
- Some packages may not be available for the ARM architecture
  :::

::: details Internal storage not accessible

- Enable **All Files Access** in Terminal Settings
- This feature is not available on the Play Store version
- Requires Android 10 or higher
  :::
