# Side Buttons <Badge type="tip" text="v318+" />

The side buttons are buttons that appear vertically along the right side of the editor screen.

## Description

`acode.require("sideButton")` creates and renders custom side buttons that users can interact with.

:::info
`sideButton` was added to the plugin API in **v1.8.7, versionCode `318`**, together with the "show side buttons" setting.

`acode.require` lower-cases the module name, so `acode.require("SideButton")` returns the same function. It is **not** a class — do not call it with `new`.
:::

### Where the button is anchored

`sideButton` appends into a single shared container, `<div class="side-buttons">`, which is styled `position: absolute; right: 0; top: 0; z-index: 10000` and holds its children in a vertical flex column with a 5 px gap. The app attaches that container to the **active editor pane's content element**, and detaches it from the DOM entirely when the `showSideButtons` setting is `false`. Individual buttons are 15 px wide, with the text rendered vertically.

## Usage

```js
const SideButton = acode.require('sideButton');

const sideButton = SideButton({
  text: 'My Side Button',
  icon: 'notes',
  onclick() {
    console.log('clicked');
  },
  backgroundColor: '#fff',
  textColor: '#000',
});

// Show the side button
sideButton.show();

// Hide the side button
sideButton.hide();
```

## API Reference

### Signature

```js
SideButton(options: {
  text: string,
  icon: string,
  onclick: (event: MouseEvent) => void,
  backgroundColor: string,
  textColor: string,
}): { show: () => void, hide: () => void }
```

`SideButton` is a plain factory function that destructures a single object. It builds the `<button class="side-button">` immediately and returns a handle with exactly two methods.

### Options

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| text | `string` | Yes | `undefined` | The text label for the button, rendered vertically in a `<span>`. |
| icon | `string` | Yes | `undefined` | CSS class name for the button icon, applied as `class="icon {icon}"`. See [Built-in Icons](#built-in-icons). |
| onclick | `(event: MouseEvent) => void` | Yes | `undefined` | Click handler function, bound directly to the `<button>`. |
| backgroundColor | `string` | Yes | `undefined` | Background color of the button. Any CSS color, including `var(--…)` references. |
| textColor | `string` | Yes | `undefined` | Text color of the button. Any CSS color, including `var(--…)` references. |

There are no defaults for these options: they are all read straight off the object. `backgroundColor` and `textColor` in particular are applied verbatim to the inline `style`, so omitting them simply leaves the corresponding property unset.

A spring "press" animation (scale `0.95` → `1`) is attached to every button automatically. It is skipped when `<body>` carries the `no-animation` class.

### Returns

Returns an object with the following methods:

| Method | Type | Description |
|--------|------|-------------|
| show | `() => void` | Appends the button to the shared `sideButtonContainer`, which makes it visible (if the "show side buttons" setting is enabled). |
| hide | `() => void` | Removes the button element from the DOM. |

Both methods return `undefined`. `show()` moves the existing element, so calling it twice does **not** create two buttons. There is no `addItem`, no `remove`/`removeItem` and no `destroy` — create one handle per button.

:::tip
CSS custom properties are the idiomatic choice for colors, because they follow the active theme. The app's own button does exactly that:

```js
const problemButton = SideButton({
  text: strings.problems,
  icon: 'warningreport_problem',
  backgroundColor: 'var(--danger-color)',
  textColor: 'var(--danger-text-color)',
  onclick() { acode.exec('open', 'problems'); },
});
```

:::

## Complete Plugin Example <Badge type="tip" text="new" />

```js
acode.setPluginInit('com.example.sideactions', () => {
  const SideButton = acode.require('sideButton');
  const settings = acode.require('settings');

  let problemsButton = null;
  let wordCountButton = null;

  function syncWordCountButton() {
    const text = editorManager.editor?.state.doc.toString() ?? '';

    if (!text.trim()) {
      wordCountButton?.hide();
      return;
    }
    if (wordCountButton) {
      wordCountButton.show();
      return;
    }

    wordCountButton = SideButton({
      text: `${text.trim().split(/\s+/).length} words`,
      icon: 'notes',
      onclick() {
        acode.require('toast')(`${text.length} characters`);
      },
      backgroundColor: 'var(--primary-color)',
      textColor: 'var(--primary-text-color)',
    });
    wordCountButton.show();
  }

  if (settings.value.showSideButtons) {
    problemsButton = SideButton({
      text: 'Lint',
      icon: 'warningreport_problem',
      onclick() { acode.exec('open', 'problems'); },
      backgroundColor: 'var(--danger-color)',
      textColor: 'var(--danger-text-color)',
    });
    problemsButton.show();
  }

  editorManager.on('file-loaded', syncWordCountButton);
  editorManager.on('save-file', syncWordCountButton);
  syncWordCountButton();

  acode.setPluginUnmount('com.example.sideactions', () => {
    problemsButton?.hide();
    wordCountButton?.hide();
    // Acode never unsubscribes plugin listeners for you, so remove them here
    editorManager.off('file-loaded', syncWordCountButton);
    editorManager.off('save-file', syncWordCountButton);
  });
});
```

## Gotchas

:::warning
The options object is destructured, so calling `SideButton()` or `SideButton(null)` throws a `TypeError`. Always pass an object.
:::

:::warning
The whole container is removed from the DOM when the user's **"show side buttons"** setting is off (default `true`). `show()` still appends to the detached container, so nothing appears and there is no error to hint at the cause. Listen to `acode.require('settings').on('update:showSideButtons', ...)` if you want to re-check the value.
:::

:::warning
There is no lifecycle management. The handle you get back is not tied to your plugin, so a plugin that is disabled or unmounted leaves its buttons on screen until it calls `hide()`. Wire `hide()` into `acode.setPluginUnmount` — see [`acode`](../global-apis/acode.md).

Event subscriptions need the same treatment: `acode.unmountPlugin()` only runs your unmount callback, deletes the `plugin-<id>` settings page and unregisters your file icons — it never touches listeners you registered with `editorManager.on()`, so remove every one of them in your unmount handler or they stay active after a reload.
:::

:::warning
Buttons share one container in call order — the first `show()` is the topmost. Acode's Problems button is created during editor start-up, so plugin buttons generally appear below it unless you re-`show()` after it.
:::

:::info
The icon is rendered as `<spam class="icon {icon}">` — a mistyped custom tag that exists in the shipped source. The `code-editor-icon` font still applies (the CSS targets the `.icon` class, not the tag name), so the glyph shows up correctly, but `querySelector('span.icon')` will not match it. Style it by class, never by tag name.
:::

## Built-in Icons <Badge type="tip" text="new" />

All icon classes below ship with Acode and can be passed straight to `icon`, or used on any element as `class="icon {name}"`.

```html
<i class="icon icon-name"></i>
```

Newer glyphs (`\f…`):

| Icon | Icon | Icon | Icon |
|---|---|---|---|
| `like` | `like-solid` | `text-search` | `wand` |
| `wand-sparkles` | `link` | `brain` | `paperclip` |
| `palette` | `loader` | `square-terminal` | `house` |
| `message-circle` | `user-round` | `funnel` | `zap` |
| `verified` | `terminal` | `tag` | `scale` |
| `cart` | `lightbulb` | `pin` | `pin-off` |

Main glyph set (`\e9…` / `\ea…`):

| Icon | Icon | Icon | Icon |
|---|---|---|---|
| `document-information` | `document-information-outline` | `document-forbidden` | `document-forbidden-outline` |
| `document-remove` | `document-remove-outline` | `document-checked` | `document-checked-outline` |
| `document-cancel` | `document-cancel-outline` | `document-error` | `document-error-outline` |
| `document-locked` | `document-locked-outline` | `document-unlocked` | `document-unlocked-outline` |
| `document-search` | `document-search-outline` | `document-code` | `document-code-outline` |
| `document-text` | `document-text-outline` | `text_format` | `chat_bubble` |
| `movie` | `videocam` | `document-add` | `document-add-outline` |
| `documents` | `documents-outline` | `folder-information` | `folder-information-outline` |
| `folder-remove` | `folder-remove-outline` | `folder-add` | `folder-add-outline` |
| `folder-upload` | `folder-upload-outline` | `folder-download` | `folder-download-outline` |
| `folder-search` | `folder-search-outline` | `folder` | `folder-outline` |
| `folder2` | `folder2-outline` | `android` | `angular` |
| `css3` | `dev-dot-to` | `facebook` | `git` |
| `github` | `gmail` | `googlechrome` | `googledrive` |
| `googleplay` | `html5` | `instagram` | `ionic` |
| `javascript` | `jekyll` | `linkedin` | `markdown` |
| `npm` | `python` | `react` | `stackexchange` |
| `stackoverflow` | `telegram` | `twitter` | `visualstudiocode` |
| `webpack` | `yarn` | `youtube` | `error` |
| `error_outline` | `warningreport_problem` | `library_addqueueadd_to_photos` | `library_music` |
| `new_releases` | `not_interesteddo_not_disturb` | `pause` | `pause_circle_filled` |
| `pause_circle_outline` | `play_arrow` | `play_circle_filled` | `play_circle_outline` |
| `repeat` | `repeat_one` | `replay` | `shuffle` |
| `skip_next` | `skip_previous` | `emailmailmarkunreadlocal_post_office` | `vpn_key` |
| `add` | `add_box` | `add_circle` | `add_circle_outlinecontrol_point` |
| `block` | `clearclose` | `copy` | `cut` |
| `paste` | `edit` | `drafts` | `forward` |
| `remove` | `remove_circledo_not_disturb_on` | `remove_circle_outline` | `send` |
| `undo` | `save_alt` | `file_copy` | `sd_storagesd_card` |
| `attach_file` | `attach_money` | `format_bold` | `format_color_fill` |
| `music_video` | `format_size` | `format_underlined` | `insert_chartpollassessment` |
| `insert_emoticontag_facesmood` | `insert_invitationevent` | `image` | `publish` |
| `vertical_align_bottom` | `vertical_align_top` | `monetization_on` | `cloud` |
| `cloud_done` | `cloud_download` | `cloud_uploadbackup` | `file_downloadget_app` |
| `file_upload` | `audiotrack` | `music_note` | `movie_filter` |
| `local_moviestheaters` | `keyboard_arrow_down` | `keyboard_arrow_left` | `keyboard_arrow_right` |
| `keyboard_arrow_up` | `keyboard_backspace` | `keyboard_capslock` | `keyboard_hide` |
| `keyboard_tab` | `keyboard_voice` | `laptop_chromebook` | `laptop_mac` |
| `laptop_windows` | `phone_android` | `phone_iphone` | `color_lenspalette` |
| `colorize` | `navigate_beforechevron_left` | `navigate_nextchevron_right` | `remove_red_eyevisibility` |
| `tune` | `add_photo_alternate` | `image_search` | `beenhere` |
| `apps` | `arrow_back` | `arrow_drop_down` | `arrow_drop_down_circle` |
| `arrow_drop_up` | `arrow_forward` | `cancel` | `check` |
| `expand_less` | `expand_more` | `fullscreen` | `fullscreen_exit` |
| `menu` | `keyboard_control` | `more_vert` | `refresh` |
| `unfold_less` | `unfold_more` | `arrow_upward` | `subdirectory_arrow_left` |
| `subdirectory_arrow_right` | `arrow_downward` | `first_page` | `last_page` |
| `arrow_left` | `arrow_right` | `arrow_back_ios` | `arrow_forward_ios` |
| `folder_special` | `priority_high` | `notifications` | `notifications_none` |
| `person` | `public` | `share` | `sentiment_dissatisfied` |
| `sentiment_neutral` | `sentiment_satisfied` | `sentiment_very_dissatisfied` | `sentiment_very_satisfied` |
| `stargrade` | `star_half` | `star_outline` | `account_box` |
| `account_circle` | `android-full` | `autorenew` | `cached` |
| `check_circle` | `code` | `delete` | `exit_to_app` |
| `extension` | `favorite` | `favorite_outline` | `help` |
| `highlight_remove` | `historyrestore` | `home` | `httpslock` |
| `info` | `info_outline` | `input` | `label` |
| `label_outline` | `perm_media` | `power_settings_new` | `search` |
| `settings` | `settings_applications` | `shop` | `spellcheck` |
| `stars` | `translate` | `visibility_off` | `update` |
| `g_translate` | `check_circle_outline` | `delete_outline` | `drive_folder_upload` |
| `library_add_check` | `replay_circle_filled` | `redo` | `save` |
| `zip` | `zip-outline` | `logout` | `folder_open` |
| `launchopen_in_new` | `open_in_browser` | `vue` | `angularuniversal` |
| `linkinsert_link` | `document-text2` | `document-text2-outline` | `document-text4` |
| `document-text5` | `folder4` | `shift` | `replace` |
| `replace_all` | `moveline-up` | `moveline-down` | `copyline-up` |
| `copyline-down` | `acode` | `patreon` | `paypal` |
| `ruby` | `font_download` | `notes` | `http` |
| `compare_arrows` | `home_filled` | `height` | `all_inclusive` |

:::tip
Names are not always what you would guess — the font packs several glyphs onto one class, e.g. `error_outline`, `stargrade`, `library_addqueueadd_to_photos`, `add_circle_outlinecontrol_point`, `remove_circledo_not_disturb_on`, `launchopen_in_new`, `android-full`, `historyrestore`, `httpslock`, `sd_storagesd_card`, `insert_chartpollassessment`, `insert_emoticontag_facesmood`, `emailmailmarkunreadlocal_post_office`, `cloud_uploadbackup`, `local_moviestheaters`, `navigate_beforechevron_left`, `remove_red_eyevisibility`, `not_interesteddo_not_disturb`, `folder4`, `document-text4`.

To register your own icon class instead of using one of these, call `acode.addIcon(className, iconSrc, { monochrome })` — see [`acode.addIcon`](../global-apis/acode.md).
:::

## Quick Tools Adapters <Badge type="tip" text="new" />

The modern companion to side buttons: if your plugin opens a **custom tab** and wants the quick tools bar (and hardware-keyboard / paste handling) to target that tab instead of the code editor, register a *quick tools adapter*.

:::warning
`acode.require("quickToolsAdapter")` returns `undefined`. The registry is internal and is **not** registered with `acode.define`. The only supported entry point is the `acode.registerQuickToolsAdapter(tab, adapter)` method — see [`acode`](../global-apis/acode.md).
:::

### `acode.registerQuickToolsAdapter(tab, adapter): () => void`

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `tab` | `EditorFile` | Yes | The tab that owns the adapter. Auto-dispose listens on `tab.on("close", …)` and detaches with `tab.off("close", …)`; both calls are optional-chained. |
| `adapter` | `QuickToolsAdapter` | Yes | See the method surface below. |

**Returns:** a `dispose()` function. It removes the registration, calls the unsubscribe function returned by `adapter.subscribe()`, detaches the tab's `"close"` listener, aborts in-flight work and calls `adapter.cancel?.()`.

**Throws:**

| Error | Condition |
|---|---|
| `TypeError("A quicktools adapter needs a tab, state, availability and execution handlers.")` | `tab` is falsy, or the adapter is missing any of `getState`, `canHandle`, `execute`, `subscribe` |
| `Error("This tab already has a quicktools adapter.")` | The tab already has a registration |

**Auto-dispose:** the registry attaches `tab.on("close", dispose)`, so closing the tab disposes the adapter for you. `dispose()` is also safe to call twice — the second call is a no-op.

**Active tab only:** routing follows `editorManager.activeFile`. When the user switches to another tab, the previous entry is cancelled and its `AbortSignal` aborted; switching back re-enables it.

### Required adapter surface

| Method | Type | Description |
|---|---|---|
| `getState()` | `() => { enabled: boolean, busy: boolean }` | Read on every availability check. When `enabled` is `false` or `busy` is `true`, queued actions are dropped, the `AbortSignal` is aborted and `cancel()` is called. |
| `canHandle(action)` | `(action: QuickToolsAction) => boolean` | Whether this adapter wants the action. |
| `subscribe(cb)` | `(cb: () => void) => (() => void) \| void` | Call `cb()` whenever `getState()` changes. The returned function is used to unsubscribe on dispose. |
| `execute(action, ctx)` | `(action: QuickToolsAction, ctx: { signal: AbortSignal }) => any` | Performs the action. Errors are routed to `onError` instead of being thrown. |

### Optional adapter methods

| Method | Type | Description |
|---|---|---|
| `captureSelection()` | `() => any` | Snapshots the current selection so it can be restored before the next action. |
| `restoreSelection(snapshot)` | `(snapshot: any) => any` | Restores a snapshot taken by `captureSelection()`. |
| `focus()` | `() => any` | Called when quick tools regains focus after a routed action. |
| `cancel()` | `() => void` | Called after the signal has been aborted, so you can drop queued work. |
| `onError(error)` | `(error: any) => void` | Receives `execute` / `focus` rejections while the entry is still valid. |

### Action shapes

| `type` | Fields | Produced by |
|---|---|---|
| `text` | `text: string` | Quick tools insert, and `command: "paste"` / <kbd>Ctrl</kbd>+<kbd>V</kbd> which the registry rewrites into `{ type: "text", text }` after reading the native clipboard |
| `key` | `key: string`, plus `shiftKey`, `ctrlKey`, `altKey`, `metaKey` | Quick tools keys and captured key presses |
| `command` | `command: string` | Quick tools command buttons, e.g. `find`, `undo`, `redo` |

`type: "modifier"` actions (`shift` / `ctrl` / `alt` / `meta`) are handled by the quick tools handler itself for selection capture and are **not** passed to `execute`.

:::warning
Once an adapter is registered for a tab, it **owns all editing actions** on that tab. Actions it does not handle are swallowed and never fall through to the code editor — even while an asynchronous action is still pending. If a native context menu is open (`.prompt`, `#palette`, `.context-menu`, `.mask`), routing is additionally blocked and pending work is cancelled.
:::

:::tip
While an adapter is registered for a tab, the quick tools toggler's visibility follows `getState().enabled` and ignores the tab's `hideQuickTools` option. Return `enabled: false` from `getState()` to hide the bar for that tab.
:::

:::info
For `type: "custom"` tabs the `content` element is mounted inside an **open shadow root** that adopts the app stylesheet. Keep a direct reference to your element (as above) instead of querying the document, and remember that the overlay watcher deliberately never observes shadow roots — your tab can never spuriously block quick tools.
:::

### Complete adapter example

```js
acode.setPluginInit('com.example.canvas', () => {
  const EditorFile = acode.require('EditorFile');

  const panel = document.createElement('div');
  panel.tabIndex = 0;
  panel.style.outline = 'none';
  let text = '';

  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn());

  function setText(value, { focus = false } = {}) {
    text = value;
    panel.textContent = value;
    notify();
    if (focus) panel.focus();
  }

  const tab = new EditorFile('canvas', {
    type: 'custom',
    content: panel,
    // hideQuickTools is ignored while an adapter is registered: quick tools
    // visibility then follows getState().enabled.
  });

  const dispose = acode.registerQuickToolsAdapter(tab, {
    getState: () => ({ enabled: true, busy: false }),

    canHandle: (action) =>
      action.type === 'text' ||
      (action.type === 'key' && action.key === 'Enter') ||
      (action.type === 'command' && action.command === 'paste'),

    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },

    // Snapshot before a modifier key (Shift/Ctrl/…) is held, so the caret the
    // next action runs at is the one produced by the previous action.
    captureSelection: () => ({ caret: text.length }),

    restoreSelection: () => panel.focus(),

    execute: async (action) => {
      if (action.type === 'text') return setText(text + action.text, { focus: true });
      if (action.type === 'key' && action.key === 'Enter') return setText(text + '\n', { focus: true });
    },

    onError: (error) => acode.require('toast')(error.message, 3000),
  });

  acode.setPluginUnmount('com.example.canvas', () => {
    dispose(); // the tab's own "close" event would do this too
  });
});
```

## Related

- [`acode`](../global-apis/acode.md) — `require`, `addIcon`, `addCommand`, `setPluginInit` / `setPluginUnmount`
- [Settings](../editor-components/settings.md) — the "show side buttons" toggle
- [Sidebar Apps](./sidebar-apps.md) — persistent sidebar UI
- [Context Menu API](./context-menu.md) — menus anchored to arbitrary elements
- [Editor File API](../editor-components/editor-file.md) — `EditorFile`, required for custom tabs and quick tools adapters
