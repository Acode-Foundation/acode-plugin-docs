# Editor Settings

Customize the CodeMirror editor used by Acode.

## Editor Options

| Setting | Description | Allowed Values / Notes | Default |
| :------ | :---------- | :--------------------- | :------ |
| **Autosave** | Auto-save after delay. | `0` (off) or `>= 1000` ms | `0` |
| **Font Size** | Editor text size. | CSS size string (e.g. `12px`) | `12px` |
| **Editor Font** | Font family used in editor. | Any installed editor font | `Roboto Mono` |
| **Line Height** | Line spacing in editor. | `1.0` to `2.0` | `2` |
| **Soft Tab** | Insert spaces instead of tab character. | On/Off | `On` |
| **Tab Size** | Visual/indent tab width. | `1` to `8` | `2` |
| **Show Line Numbers** | Show line number gutter. | On/Off | `On` |
| **Relative Line Numbers** | Show relative numbers from cursor line. | On/Off | `Off` |
| **Lint Gutter** | Show diagnostics markers in gutter (LSP-related). | On/Off | `On` |
| **Format on Save** | Runs selected formatter on save. | On/Off | `Off` |
| **Live Autocompletion** | Suggest completions while typing. | On/Off | `On` |
| **Text Wrap** | Wrap long lines in editor viewport. | On/Off | `On` |
| **Show Spaces** | Show spaces/tabs/trailing whitespace markers. | On/Off | `Off` |
| **Fade Fold Widgets** | Folds gutter icons fade until hover. | On/Off | `Off` |
| **Rainbow Brackets** | Color bracket pairs with nested colors. | On/Off | `On` |
| **Indent Guides** | Show indentation guide lines. | On/Off | `On` |
| **Color Preview** | Inline color swatches for color values. | On/Off | `On` |
| **Cursor Controller Size** | Touch cursor handle size. | `None`, `Small`, `Medium`, `Large` | `Medium` |
| **Line Based RTL Switching** | Per-line right-to-left direction support. | On/Off | `Off` |
| **Hard Wrap** | Legacy option in settings UI. | Currently limited/no-op in CodeMirror flow | `Off` |

## Scroll Settings (Sub-page)

The **Scroll Settings** item opens a sub-page.

| Setting | Description | Values | Default |
| :------ | :---------- | :----- | :------ |
| **Scrollbar Size** | Width/height of editor scrollbars. | `5`, `10`, `15`, `20` px | `20` |

## Notes

- Some old Ace-era options (print margin, elastic tabstops, textarea-for-IME) are no longer active in current CodeMirror editor settings flow.
- **Lint Gutter** visibility is tied to diagnostics UI from active language servers (LSP).
