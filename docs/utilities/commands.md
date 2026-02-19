# Commands API

Use the Commands API to register commands for command palette/keybindings and execute them programmatically.

## Preferred Access

```js
const commands = acode.require("commands");
```

::: tip
Prefer this API over `editorManager.editor.commands.*` (which is kept for compatibility).
:::

## `addCommand(descriptor)`

Registers a command.

```js
commands.addCommand({
  name: "example.sayHello",
  description: "Say hello",
  bindKey: { win: "Ctrl-Alt-H", mac: "Command-Alt-H" },
  exec: (view, args) => {
    acode.alert("Hello", `Args: ${JSON.stringify(args)}`);
    return true;
  },
});
```

Descriptor fields:

- `name` (required): unique command id.
- `description` (optional): command palette label.
- `bindKey` (optional): key combo string or `{ win, linux, mac }`.
- `exec` (required): function `(view, args) => boolean | void`.

## `removeCommand(name)`

Unregisters a command.

```js
commands.removeCommand("example.sayHello");
```

## `registry`

Low-level registry API:

- `registry.add(descriptor)`
- `registry.remove(name)`
- `registry.execute(name, view?, args?)`
- `registry.list()`

```js
commands.registry.execute("example.sayHello", editorManager.editor, {
  source: "plugin",
});

const all = commands.registry.list();
console.log(all.map((cmd) => cmd.name));
```

## Convenience Methods On `acode`

These call the same registry internally:

- `acode.addCommand(descriptor)`
- `acode.removeCommand(name)`
- `acode.execCommand(name, view?, args?)`
- `acode.listCommands()`
