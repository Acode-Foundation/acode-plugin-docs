# Action Stack

The Action Stack is a crucial component for managing back button behavior in Acode. It allows you to handle navigation and state management by maintaining a stack of actions that can be executed when users press the back button.

Verified against Acode **v1.13.5** (versionCode `1011`): `src/lib/actionStack.js` in full, plus its call sites in `src/main.js`, `src/lib/loadPlugin.js`, `src/dialogs/*` and `src/pages/*`. Registered in `src/lib/acode.js:427` as `this.define("actionStack", actionStack)`.

## Getting Started

To use the Action Stack in your plugin, first require it:

```js
const actionStack = acode.require('actionStack');
```

::: warning One global stack, shared by everything
`src/lib/actionStack.js` holds a single module-level array. Every page, dialog, drawer, the search bar, the file browser and every other plugin share it, in one LIFO order. There is no per-plugin stack and no namespacing — an `id` is the only thing that keeps your entries addressable.
:::

## Core Concepts

The Action Stack works by maintaining a LIFO (Last In First Out) queue of actions. When the back button is pressed, the most recently added action is executed and removed from the stack.

The hardware / gesture back button is wired to exactly one function in `src/main.js`:

```js
function backButtonHandler() {
	if (keydownState.esc) {
		keydownState.esc = false;
		return;
	}
	actionStack.pop();
}
```

::: warning Escape is treated as Back
`keydownState.esc` makes the very next back press a no-op, so pressing Escape and then Back does nothing on the first press. Pop from your own code instead of relying on this.
:::

When the stack is **empty**, `pop()` does not fail — it asks for confirmation (when `settings.confirmOnExit` is on) and then calls `navigator.app.exitApp()`, first awaiting `actionStack.onCloseApp` if you set one. Acode itself sets `actionStack.onCloseApp = () => acode.exec("save-state")` in `src/main.js`.

## API Reference

`src/lib/actionStack.js` default-exports a single object literal with these members:

| Member | Type | Signature |
| --- | --- | --- |
| `length` | getter | `number` — current stack depth |
| `onCloseApp` | accessor | get/set a `Function` called before the app exits |
| `push(action)` | method | `(action: { id: string, action: Function }) => void` |
| `pop(repeat?)` | method | `(repeat?: number) => Promise<void>` |
| `get(id)` | method | `(id: string) => object \| undefined` |
| `remove(id)` | method | `(id: string) => boolean` |
| `has(id)` | method | `(id: string) => boolean` |
| `setMark()` | method | `() => void` |
| `clearFromMark()` | method | `() => void` |
| `freeze()` | method | `() => void` |
| `unfreeze()` | method | `() => void` |
| `windowCopy()` | method | `() => object` — **deprecated**, see below |

### push(action)

Adds a new action to the stack. Returns `undefined`.

The `action` object is stored **by reference**, not cloned, and nothing about it is validated. `id` is used by `get()`, `has()` and `remove()`; `action` is the callback `pop()` invokes.

**Parameters:**

- `action` (Object)
  - `id` (string): Unique identifier for the action. Not enforced — the same id may be pushed twice, and `remove()` then removes only the first match.
  - `action` (Function): Callback function to execute when back is pressed.

::: warning Push is unconditional
`push()` never dedupes, never replaces and never throws — not even while frozen. If you push the same id twice, back will run the newest entry, and `remove(id)` removes the *oldest* one. Call `has()` (or `remove()`) before pushing if you manage the entry yourself.
:::

**Example:**

```js
actionStack.push({
  id: 'close-search',
  action() {
    searchPanel.hide();
    editor.focus();
  }
});
```

### pop(repeat?)

Executes and removes the most recent action from the stack. Returns a `Promise` (it is `async`).

**Parameters:**

- `repeat` (number, optional): Number of actions to pop and execute.

**Example:**

```js
// Pop single action
actionStack.pop();

// Pop multiple actions
actionStack.pop(3);
```

**What actually happens, step by step:**

1. If the stack is **frozen**, `pop()` returns immediately — it does nothing at all, not even the exit flow.
2. If `repeat` is a number **greater than 1**, it recurses `repeat` times (`this.pop()` with no argument each time) and returns. Each recursive call is `async` but is *not* awaited, so the deeper pops are not sequential in practice.
3. Otherwise it pops the newest entry and calls `fun.action()` **synchronously and without awaiting it**. If that callback returns a promise, the promise is ignored and `pop()` resolves anyway.
4. If nothing was on the stack, it optionally shows a confirm dialog (`settings.confirmOnExit`) and, on confirmation, runs `onCloseApp` and `navigator.app.exitApp()`. A returned promise from `onCloseApp` is awaited via `.finally(exitApp)`.

::: danger Your action must not throw
`fun.action()` is called with no `try`/`catch` and no `.catch()`. A throwing action escapes into `pop()`'s promise and **leaves the entry already removed from the stack** — the state you meant to restore is gone and the exception escapes into the back-button handler. Wrap your own teardown in `try { ... } catch (e) { console.error(e); }`.
:::

::: warning `repeat` only matters when it is greater than 1
The multi-pop branch is guarded by `typeof repeat === "number" && repeat > 1`. So `pop(1)` and `pop(0)` take the normal single-action path, and a non-numeric `repeat` is ignored entirely.
:::

### get(id)

Retrieves an action from the stack by its ID.

**Parameters:**

- `id` (string): The action identifier.

**Returns:** The stored action object if found, `undefined` otherwise. This is a **reference** to the live object, so mutating it mutates the stack entry.

**Example:**

```js
const searchAction = actionStack.get('close-search');
if (searchAction) {
  // Action exists — mutate or invoke it
  searchAction.action();
}
```

### remove(id)

Removes an action from the stack without executing it.

**Parameters:**

- `id` (string): The action identifier.

**Returns:** `boolean` — `true` if an action was found and removed.

Only the **first** match is removed, scanning from the bottom of the stack. Acode's own `handlers/quickToolsState.js` shows the idiom for removing every duplicate:

```js
export function removeActionStackEntries(actionStack, id) {
  while (actionStack.remove(id)) {}
}
```

**Example:**

```js
actionStack.remove('close-search');
```

### has(id)

Checks if an action exists in the stack.

**Parameters:**

- `id` (string): The action identifier.

**Returns:** `boolean` — `true` if any entry with that id exists.

**Example:**

```js
if (actionStack.has('close-search')) {
  // Action exists in stack
}
```

### length

A getter, not a function. Read it directly:

```js
console.log(actionStack.length); // e.g. 3
```

::: warning Read it, do not assign
`length` is defined with a getter and no setter. Assigning to it has no effect (and throws a `TypeError` in strict-mode code). To empty part of the stack, use `clearFromMark()` or `pop(n)`.
:::

### Stack Markers

The Action Stack provides methods to mark positions and clear actions above them.

#### setMark()

Sets a marker at the current stack position: `mark = stack.length`. There is only **one** marker; calling it again overwrites the previous position.

#### clearFromMark()

Removes all actions added after the last marker with `stack.splice(mark)`, then resets the marker to `null`. If no marker was ever set, it is a no-op — and note that it clears without executing.

**Example:**

```js
// Mark current position
actionStack.setMark();

// Add temporary actions
actionStack.push({
  id: 'temp-action',
  action() {
    // Handle temporary state
  }
});

// Clear all actions added since mark
actionStack.clearFromMark();
```

The file browser uses exactly this pattern: `actionStack.setMark()` when it opens, then `clearFromMark()` plus `remove("filebrowser")` when it closes.

### freeze() / unfreeze()

`freeze()` sets a module-level flag that makes `pop()` a complete no-op; `unfreeze()` clears it. Nothing else observes the flag — `push()`, `remove()`, `get()`, `has()` and `setMark()` all keep working while frozen.

Acode uses it for modal loaders (`src/dialogs/loader.js`): `actionStack.freeze()` when the loader appears and `actionStack.unfreeze()` 300 ms later, once the fade-out has removed the dialog. That is the pattern to copy for a blocking overlay of your own.

::: warning `freeze()` is not re-entrant
It is a boolean, not a counter. Two overlapping loaders that both freeze will both call `unfreeze()`, and the first one to finish releases the stack while the second is still up. If you freeze yourself, track your own depth and only call `unfreeze()` when it returns to zero.
:::

### onCloseApp

A get/set accessor, not a method. Reading it returns the callback (or `undefined`); assigning replaces it globally — there is only one, and Acode overwrites it with `() => acode.exec("save-state")` at startup.

Acode's own store-and-exit example:

```js
actionStack.onCloseApp = () => acode.exec("save-state");
```

A promise returned by your callback is awaited and `exitApp()` runs in its `finally`, so an async cleanup is respected. If it returns a non-promise, `exitApp()` runs immediately.

::: danger Setting this replaces Acode's session save
Acode assigns `onCloseApp` once during startup. If you assign it, the user is relying on *your* callback to persist state — call `acode.exec("save-state")` yourself or you will lose the editor session on exit. Always read the previous value first if you must wrap it.
:::

### windowCopy() <Badge type="tip" text="deprecated" />

Returns a shallow copy of the module with a wrapped `pop()` that logs `"Deprecated: \`window.actionStack\` is deprecated, import \`actionStack\` instead"` and then delegates. `src/main.js` uses it for `window.actionStack = actionStack.windowCopy()`.

It copies the **current** value of the `length` getter and `onCloseApp` accessor as plain properties, so the copy's `length` is frozen at that moment. Do not use it in a plugin; use `acode.require('actionStack')`.

## Ordering Semantics

| Question | Answer |
| --- | --- |
| Is it LIFO? | Yes — `stack.pop()` takes the newest entry. |
| Are actions executed in registration order? | No, reverse. |
| Does a popped action re-add itself? | Only if your callback pushes again, which is how a page that stays open can survive back. Acode's own search bar uses `actionStack.get("search-bar")?.action()`. |
| Are async actions awaited? | No. `fun.action()` is invoked bare; its return value is discarded. |
| Is `id` required? | No, but `get`/`has`/`remove` are useless without one. |
| Is the id unique? | Not enforced. Duplicates are allowed and `remove()` takes the oldest. |
| Does a thrown action leave the stack intact? | No — the entry is already removed. |

## How Pages, Dialogs and the Editor Push and Pop

Every interactive surface in Acode follows the same three-line pattern: push on open, remove on close.

**A plugin page — automatic.** `src/lib/loadPlugin.js` wires your plugin's `$page` for you:

```js
const $page = Page("Plugin");
$page.show = () => {
  actionStack.push({
    id: pluginId,
    action: $page.hide,
  });

  app.append($page);
};

$page.onhide = function () {
  actionStack.remove(pluginId);
};
```

That is the whole mechanism: **you do not need to push anything for your plugin page to participate in back navigation.** It is already done, keyed by your plugin id. Pushing your own entries on top of it is how you layer sub-screens, and the action-stack order guarantees yours are popped first.

**Dialogs.** `src/dialogs/confirm.js`, `alert.js`, `select.js`, `prompt.js`, `multiPrompt.js`, `color.js` and `dialog.js` all push a unique id on open and `actionStack.remove(actionId)` in their `hide()` — so dismissing a dialog with back does not leave a stale entry behind.

```js
actionStack.push({
  id: actionId,     // e.g. "confirm-<n>", unique per open dialog
  action: cancel,   // what back should do: the cancel path
});
// ...
function hide() {
  actionStack.remove(actionId);
  hideAlert();
}
```

**Nested pages.** `src/pages/*` (about, plugins, plugin, problems, sponsors, settings, changelog, font manager, …) each push a stable literal id such as `"about"`, `"plugins"`, `"plugin"` or `"problems"` on show and remove it on close. `handlers/quickTools.js` pushes `"search-bar"`, the file browser pushes one entry per opened directory **keyed by the directory url**, and its selection mode pushes `"fbSelection"`.

**The editor itself.** The editor tabs are *not* on the action stack. Back from a clean editor goes to the empty-stack exit flow.

**WebViews.** A fullscreen WebView runs in its own Android activity and therefore never touches this stack — see [WebView](./webview.md#relationship-with-the-action-stack).

**Loaders.** `dialogs/loader.js` freezes the stack instead of pushing, so a modal loader swallows back entirely.

## How a Plugin Uses It

Add a layer on top of the automatic plugin-page entry:

```js
const actionStack = acode.require('actionStack');

function openSubScreen($subScreen) {
  // Back closes the sub-screen, not the plugin page.
  actionStack.push({
    id: 'my-plugin-sub-screen',
    action() {
      closeSubScreen();
    },
  });

  app.append($subScreen);
}

function closeSubScreen() {
  actionStack.remove('my-plugin-sub-screen');
  $subScreen.remove();
}
```

Make it survive back when it should:

```js
function openSubScreen($subScreen) {
  if (actionStack.has('my-plugin-sub-screen')) return;

  actionStack.push({
    id: 'my-plugin-sub-screen',
    action() {
      // `pop()` has already removed this entry. Re-push so the next back
      // press can close it again, or forward to the plugin page.
      $subScreen.hide();
      actionStack.push({
        id: 'my-plugin-sub-screen',
        action: () => $subScreen.remove(),
      });
    },
  });

  app.append($subScreen);
}
```

## Gotchas <Badge type="tip" text="new" />

- `pop()` with an empty stack exits the app (after an optional confirm). Anything you forget to `remove()` keeps the user one press away from the exit dialog instead of leaving your screen.
- `pop()` is `async` but does not await your action. Do not rely on back-press ordering for async cleanup.
- A throwing action is not caught and the entry is already gone.
- `freeze()`/`unfreeze()` are a boolean pair, not a counter.
- `clearFromMark()` clears without executing, and a single mark is shared globally.
- `onCloseApp` is a single global slot that Acode already owns.
- `length` is a getter with no setter.
- `windowCopy()` is deprecated; `window.actionStack` logs an error on every `pop()`.
- `push()` accepts any object. If `action` is not a function, back throws `fun.action is not a function`.
- `remove(id)` removes the **oldest** duplicate, `pop()` executes the **newest**.

## Example

Here's a complete example showing how to use the Action Stack for managing a file preview feature:

```js
const actionStack = acode.require('actionStack');

class FilePreviewPlugin {
  async showPreview(file) {
    // Create preview UI
    const preview = document.createElement('div');
    preview.className = 'preview-container';
    preview.innerHTML = await this.renderPreview(file);
    document.body.appendChild(preview);

    // Only one preview at a time — the id is stable for this purpose.
    if (actionStack.has(`preview-${file.name}`)) return;

    // Add to action stack
    actionStack.push({
      id: `preview-${file.name}`,
      action: () => {
        // Clean up preview when back is pressed.
        // `pop()` already removed the entry before calling us.
        preview.remove();
        editor.focus();
      }
    });
  }

  async renderPreview(file) {
    // Preview rendering logic
  }
}
```

When the user clicks the back button, the preview will be automatically cleaned up and focus returned to editor.

## Complete plugin lifecycle <Badge type="tip" text="new" />

Everything above, wired together the way a real plugin should — push on show, remove on close, and never leave an entry behind on unmount. Plugins are loaded as **classic scripts**, so there are no `import` / `export` statements.

```js
const PLUGIN_ID = 'com.example.plugin';
const actionStack = acode.require('actionStack');
const Page = acode.require('page');

const PREVIEW_ID = 'my-plugin-preview';
const OVERLAY_ID = 'my-plugin-settings';

let $preview = null;
let $overlay = null;

function showPreview(html) {
  // Guard against a second push with the same id.
  if (actionStack.has(PREVIEW_ID)) return;

  $preview = Page('Preview');
  $preview.innerHTML = html;

  actionStack.push({
    id: PREVIEW_ID,
    action: () => {
      // `pop()` removed this entry already, so no `remove()` here.
      // Never let a throwing action escape `pop()`.
      try {
        $preview.remove();
      } catch (error) {
        console.error('preview teardown failed', error);
      }
      $preview = null;
    },
  });

  app.append($preview);
}

function closePreview() {
  // Explicit close (a button, for example): remove without executing.
  actionStack.remove(PREVIEW_ID);
  $preview?.remove();
  $preview = null;
}

function openSettings($settings) {
  $overlay = $settings;

  actionStack.push({
    id: OVERLAY_ID,
    action: closeSettings,
  });

  app.append($overlay);
}

function closeSettings() {
  actionStack.remove(OVERLAY_ID);
  $overlay?.remove();
  $overlay = null;
}

// Freeze the stack while a blocking overlay of our own is up. Track our own
// depth, because freeze()/unfreeze() are a boolean pair, not a counter.
let freezeDepth = 0;

function showBlockingOverlay($node) {
  if (freezeDepth++ === 0) actionStack.freeze();
  app.append($node);
}

function hideBlockingOverlay($node) {
  $node.remove();
  if (--freezeDepth === 0) actionStack.unfreeze();
}

// Plugin unload / disable / update. Every id we pushed is removed here so a
// reload never inherits a stale entry.
acode.setPluginUnmount(PLUGIN_ID, () => {
  actionStack.remove(PREVIEW_ID);
  actionStack.remove(OVERLAY_ID);
  $preview = null;
  $overlay = null;
  freezeDepth = 0;
});
```