---
description: Find and replace in the current file, across every open folder, or jump to a file by name.
---

# Search

Acode has three kinds of search: find and replace in the current file, search across every open folder, and find a file by name.

## Find in the Current File

Open the search bar with **`Ctrl` + `F`**, the search button (magnifying glass) in [QuickTools](./quicktools), or **Find** in the [Command Palette](./command-palette).

The QuickTools area turns into a search bar with **Search** and **Replace** fields and a match counter (for example `3 of 12`):

| Button | Action |
| :----- | :----- |
| **← / →** | Previous and next match. |
| **Replace** | Replace the current match. |
| **Replace All** | Replace every match in the file. |
| **Settings** (gear) | Turn on **Case sensitive**, **Regular expression** or **Whole word**. |
| **×** | Close the search bar. |

## Search in Files

Open the sidebar and tap the **search** icon to search every folder open in the [File Browser](./file-browser).

Type in the **Search** box and results appear as you type, grouped by file with the count of matches and files. Tap a result to open that file at the match.

### Options

| Toggle | Meaning |
| :----: | :------ |
| `aA` | Case sensitive. |
| `a-z` | Match whole words only. |
| `.*` | Treat the query as a regular expression. |
| `IDX` | Build an index of the open folders. The first search takes longer; repeated searches in large projects are faster. |

### Replace in Files

Tap the **replace** icon in the header to show the **Replace** field, enter the new text, then tap the replace button next to it to replace every match in the results.

::: warning
Replace in files writes straight to every matching file, including files that aren't open. Check the results before replacing.
:::

### Include and Exclude Files

Tap the **filter** icon in the header to show two more fields:

- **Exclude files**: skip files that match any of these patterns.
- **Include files**: search only files that match one of these patterns.

Both take comma-separated glob patterns, for example `*.min.js, dist/**` or `*.ts, *.tsx`. Binary files are always skipped.

## Find a File by Name

Press **`Ctrl` + `P`**, or open the menu (⋮) and tap **Find file**, then type part of a file name to open it from any open folder. **Open recent** in the same menu lists files and folders you opened before.
