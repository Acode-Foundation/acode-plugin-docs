---
description: Set up Python autocomplete, error checking and go to definition in Acode with the built-in terminal and a language server.
---

# Python Autocomplete and Error Checking

This tutorial sets up a Python project in Acode with full code intelligence: suggestions as you type, errors underlined in the editor, hover docs and go to definition. It uses Acode's built-in terminal and the **Python (ty)** [language server](/user-guide/language-servers). You don't need any other app.

It takes about five minutes, most of it waiting for downloads.

## What You Need

- Acode with the [built-in terminal](/user-guide/terminal) available.
- An internet connection for the first setup.

## Step 1: Install the Terminal

1. Open the menu (⋮) in the top-right corner and tap **Terminal**.
2. If the terminal isn't installed yet, Acode installs it. Wait until you see a shell prompt.

## Step 2: Create a Project in the Terminal's Folder

Language servers run inside the terminal, so keep the project in a folder the terminal can see. Your terminal home folder (`~`) is the easiest; it shows up as **Terminal Public** in Acode's file browser.

In the terminal, run:

```bash
mkdir -p ~/hello-python
cd ~/hello-python
acode .
```

`acode .` opens the folder in Acode's sidebar.

::: warning
Folders added with the Android file picker (SAF), other external storage and FTP/SFTP folders are skipped by language servers by default, so autocomplete won't work there. See [Folders outside the terminal](/user-guide/language-servers#folders-outside-the-terminal).
:::

## Step 3: Create a Python File

In the sidebar, create a new file named `main.py` in `hello-python` and add:

```python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("Acode"))
```

## Step 4: Install the Language Server

**Python (ty)** is enabled by default, so opening a `.py` file is enough to start it. The first time, it isn't installed yet:

1. A notification appears: **"Python (ty) language server is not installed. Tap to install."** If you miss it, open the sidebar and tap the bell icon.
2. Tap the notification. Acode runs the install in the terminal: it adds Python and pip with `apk`, then installs `ty` with pip.
3. Wait for the **Installing Python (ty)…** notification to finish.

You can also install it from **Settings** > **Language Servers** > **Python (ty)** > **Install / repair**. The same page shows **Installed** once it's ready.

## Step 5: Try It Out

Back in `main.py`:

- Type `greet(` on a new line: signature help shows the `name: str` parameter.
- Type `"text".` and suggestions for string methods appear.
- Change `return f"Hello, {name}!"` to `return 42`. The line is underlined, and the error is listed in **Problems** (`Ctrl` + `Shift` + `M`).
- Select `greet` in the last line and pick **LSP Actions** > **Go to Definition** from the selection menu.

To check what is running for the file, open the pencil menu in the header and tap **LSP Info**.

## Step 6: Run the Script

In the terminal:

```bash
cd ~/hello-python
python3 main.py
```

You should see `Hello, Acode!`.

## Troubleshooting

::: details No suggestions or errors appear
- Check that the folder is under **Terminal Public** (`~` in the terminal), not a SAF or remote folder.
- Open **Settings** > **Language Servers** > **Python (ty)** and check that **Enabled** is on and the status says **Installed**.
- Open **LSP Info** from the pencil menu to see whether the server started and read its log.
:::

::: details The install fails
- Make sure you're online, then run `apk update` in the terminal.
- Try again with **Install / repair** on the server's settings page.
:::

::: details I prefer pylsp
Turn off **Python (ty)** and turn on **Python (pylsp)** in **Settings** > **Language Servers**. Only keep one Python server enabled at a time.
:::
