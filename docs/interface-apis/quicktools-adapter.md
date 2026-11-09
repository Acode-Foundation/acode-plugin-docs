---
description: Route QuickTools keys, text and commands to a plugin's own editor tab with acode.registerQuickToolsAdapter.
---

# QuickTools Adapter <Badge type="tip" text="v1012+" />

QuickTools is the row of keys above the keyboard (`Ctrl`, `Tab`, arrows, brackets, undo, redo and so on). By default those keys only drive the code editor. A **QuickTools adapter** lets a [custom editor tab](../editor-components/editor-file#creating-a-custom-file-type) handle them instead, so a plugin's own editor (a spreadsheet, a canvas, a hex editor) works with QuickTools like the code editor does.

## Usage

```js
const dispose = acode.registerQuickToolsAdapter(tab, adapter);
```

| Parameter | Type | Description |
| :-------- | :--- | :---------- |
| `tab` | `EditorFile` | The custom tab the adapter belongs to. |
| `adapter` | `QuickToolsAdapter` | The handlers described below. |

It returns a `dispose()` function that removes the adapter. The adapter is also removed automatically when the tab closes.

Each tab can have only one adapter; registering a second one throws an error.

## How It Works

While the tab with an adapter is active:

- **The adapter owns all QuickTools input for the tab.** Actions it doesn't handle are ignored. They never fall through to the code editor.
- **QuickTools is shown while `getState().enabled` is `true`** and hidden otherwise. This replaces the tab's `hideQuickTools` option.
- **Actions run one at a time, in order.** Each `execute()` call waits for the previous one to finish.
- **Pending actions are cancelled** when the user switches tabs, when the adapter reports `enabled: false` or `busy: true`, or when a dialog or other overlay opens. The `signal` passed to `execute()` is aborted, and `cancel()` is called.
- **Paste becomes text.** A paste command or `Ctrl` + `V` is read from the clipboard and delivered as a `text` action.
- **Save and the Command Palette always run normally**, even with an adapter. To make **Save** work for your tab, handle the tab's [`save` event](../editor-components/editor-file#saving-a-custom-tab).

## Adapter

```ts
interface QuickToolsAdapter {
	// Required
	getState(): { enabled: boolean; busy?: boolean };
	subscribe(listener: () => void): () => void;
	canHandle(action: QuickToolsAction): boolean;
	execute(action: QuickToolsAction, options: { signal: AbortSignal }): void | Promise<void>;

	// Optional
	focus?(): void | Promise<void>;
	captureSelection?(): unknown | Promise<unknown>;
	restoreSelection?(snapshot: unknown): void | Promise<void>;
	cancel?(): void;
	onError?(error: unknown): void;
}
```

| Method | Description |
| :----- | :---------- |
| `getState()` | Current state. `enabled: false` hides QuickTools for the tab; `busy: true` pauses input while your editor is working. |
| `subscribe(listener)` | Call `listener` whenever the state changes. Return a function that unsubscribes. |
| `canHandle(action)` | Return `true` if the adapter can run this action right now. Other actions are dropped. **Undo** and **Redo** are shown disabled while it returns `false` for them. |
| `execute(action, { signal })` | Perform the action. Check `signal.aborted` before any slow step. |
| `focus()` | Give focus back to your editor after a QuickTools key is used. |
| `captureSelection()` | Return a snapshot of the selection or caret before QuickTools takes focus. |
| `restoreSelection(snapshot)` | Put that selection back before the next action runs. |
| `cancel()` | Called when pending actions are cancelled. |
| `onError(error)` | Called if `execute()`, `restoreSelection()` or `focus()` throws. |

## Actions

```ts
type QuickToolsAction =
	| { type: "text"; text: string }
	| {
			type: "key";
			key: string; // KeyboardEvent.key, for example "ArrowLeft", "Tab", "Escape", "a"
			shiftKey: boolean;
			ctrlKey: boolean;
			altKey: boolean;
			metaKey: boolean;
	  }
	| { type: "command"; command: string }
	| { type: "modifier"; key: "shift" | "ctrl" | "alt" | "meta" };
```

| Type | Sent when |
| :--- | :-------- |
| `text` | A character key like `{`, `;` or `"` is tapped, or text is pasted. |
| `key` | A key like **Tab**, **Esc** or an arrow is tapped, or the user types a key while `Ctrl`, `Shift`, `Alt` or `Meta` is active. |
| `command` | A command button is tapped: `undo`, `redo`, `selectall`, `movelinesup`, `movelinesdown`, `copylinesup`, `copylinesdown` or `find` (the search button). |
| `modifier` | Only checked with `canHandle()`. Return `true` to let the user turn on that modifier; Acode then sends the next typed key as a `key` action with the modifier set. |

## Example

A minimal custom tab with a `<textarea>` editor:

```js
const EditorFile = acode.require("EditorFile");

const textarea = document.createElement("textarea");
const tab = new EditorFile("Notes", { type: "custom", content: textarea });

const listeners = new Set();
let state = { enabled: true, busy: false };

function insert(text) {
	textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, "end");
}

const dispose = acode.registerQuickToolsAdapter(tab, {
	getState: () => state,
	subscribe(listener) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
	canHandle(action) {
		if (action.type === "text") return true;
		if (action.type === "key") return ["ArrowLeft", "ArrowRight", "Tab"].includes(action.key);
		if (action.type === "command") return action.command === "selectall";
		return false;
	},
	execute(action, { signal }) {
		if (signal.aborted) return;
		const pos = textarea.selectionStart;
		if (action.type === "text") insert(action.text);
		else if (action.key === "Tab") insert("\t");
		else if (action.key === "ArrowLeft") textarea.setSelectionRange(pos - 1, pos - 1);
		else if (action.key === "ArrowRight") textarea.setSelectionRange(pos + 1, pos + 1);
		else if (action.command === "selectall") textarea.select();
	},
	focus: () => textarea.focus(),
	captureSelection: () => [textarea.selectionStart, textarea.selectionEnd],
	restoreSelection: ([start, end]) => textarea.setSelectionRange(start, end),
});

// Hide QuickTools while the tab is read-only, for example.
function setEnabled(enabled) {
	state = { ...state, enabled };
	for (const listener of listeners) listener();
}
```

Call `dispose()` in your plugin's unmount function if the tab can outlive the plugin.
