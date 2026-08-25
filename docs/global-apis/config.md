# Config

The `config` module exposes Acode's internal read-only configuration: app constants, ports, URLs, and feature flags.

Require it with `acode.require('config')`.

```js
const config = acode.require("config");
```

## Read-only proxy

The module is a **read-only proxy** around the internal `config` object (`src/lib/config.js`). Any attempt to set, define, delete, or change the prototype of a property is blocked and logged to the console as a security warning. Values can be read at any time; they cannot be mutated by plugins.

```js
config.API_BASE; // https://acode.app/api
config.FONT_SIZE; // /^[0-9\.]{1,3}(px|rem|em|pt|mm|pc|in)$/
```

## Properties

### App identity & API

| Property | Type | Description |
|----------|------|-------------|
| `BASE_URL` | `string` | Root URL of the Acode website (`https://acode.app`) |
| `API_BASE` | `string` | Base URL of the Acode plugin API (`https://acode.app/api`) |
| `PLAY_STORE_URL` | `string` | Play Store listing URL for the current app package |
| `FEEDBACK_EMAIL` | `string` | Support email (`acode@foxdebug.com`) |
| `ERUDA_CDN` | `string` | CDN URL of the Eruda console (`https://cdn.jsdelivr.net/npm/eruda`) |

### Pro / monetization

| Property | Type | Description |
|----------|------|-------------|
| `HAS_PRO` | `boolean` | The real free/Pro flag. `true` when the user is on a Pro (paid) build or has Pro unlocked, `false` on the free build. **This is the replacement for the undocumented `IS_FREE_VERSION` global, which does not exist.** |
| `SKU_LIST` | `string[]` | Frozen array of purchase SKUs (`crystal`, `bronze`, `silver`, `gold`, `platinum`, `titanium`) |

### Editor

| Property | Type | Description |
|----------|------|-------------|
| `SUPPORTED_EDITOR` | `string` | Editor engine identifier (`"cm"` for CodeMirror 6) |
| `FILE_NAME_REGEX` | `RegExp` | Regex that matches valid file names |
| `FONT_SIZE` | `RegExp` | Regex that matches valid font-size CSS values |
| `DEFAULT_FILE_NAME` | `string` | Default name for a new file (`untitled.txt`) |
| `DEFAULT_FILE_SESSION` | `string` | Session id used for the default untitled tab (`default-session`) |
| `CUSTOM_THEME` | `string` | CSS selector for the custom theme (`body[theme="custom"]`) |

### Ports

| Property | Type | Description |
|----------|------|-------------|
| `CONSOLE_PORT` | `number` | Port used by the app console (`8159`) |
| `SERVER_PORT` | `number` | Port used by the local preview server (`8158`) |
| `PREVIEW_PORT` | `number` | Port used by the live preview (`8158`) |

### Behaviour constants

| Property | Type | Description |
|----------|------|-------------|
| `VIBRATION_TIME` | `number` | Short vibration duration in ms (`30`) |
| `VIBRATION_TIME_LONG` | `number` | Long vibration duration in ms (`150`) |
| `SCROLL_SPEED_SLOW` | `string` | Slow scroll speed constant (`"SLOW"`) |
| `SCROLL_SPEED_NORMAL` | `string` | Normal scroll speed constant (`"NORMAL"`) |
| `SCROLL_SPEED_FAST` | `string` | Fast scroll speed constant (`"FAST"`) |
| `SCROLL_SPEED_FAST_X2` | `string` | 2× fast scroll speed constant (`"FAST_X2"`) |
| `SIDEBAR_SLIDE_START_THRESHOLD_PX` | `number` | Drag distance in px before the sidebar starts sliding (`20`) |
| `LOG_FILE_NAME` | `string` | Name of the log file written to `DATA_STORAGE` (`Acode.log`) |

### Social links

| Property | Type | Description |
|----------|------|-------------|
| `DOCS_URL` | `string` | `https://docs.acode.app` |
| `GITHUB_URL` | `string` | `https://github.com/Acode-Foundation/Acode` |
| `TELEGRAM_URL` | `string` | `https://t.me/foxdebug_acode` |
| `DISCORD_URL` | `string` | `https://discord.gg/nDqZsh7Rqz` |
| `TWITTER_URL` | `string` | `https://x.com/foxbiz_io` |
| `INSTAGRAM_URL` | `string` | `https://www.instagram.com/foxbiz.io/` |
| `FOXBIZ_URL` | `string` | `https://foxbiz.io` |

## Example

```js
const config = acode.require("config");

// Feature-gate behaviour on Pro
if (config.HAS_PRO) {
  // premium-only feature
}

// Build a link to the plugin registry API
fetch(`${config.API_BASE}/plugin/com.example.plugin`);

// Open the Play Store listing in the browser
system.openInBrowser(config.PLAY_STORE_URL);
```

## Related APIs

- [Other Global Utilities](./global-utilities.md) - storage directories, `BuildInfo`, `window.log`, etc.
