---
description: Set up the official Acode AI Agent plugin, connect a model provider, and let an AI agent read, edit and run your project.
---

# Use the Acode AI Agent

[Acode AI Agent](https://acode.app/plugin/acode.ai.agent) is the official coding agent for Acode, made by the Acode Foundation. It opens as an editor tab, reads and edits files in your project, searches the web, and runs commands on terminal folders. You bring your own model provider, such as OpenRouter, OpenAI, Anthropic, Gemini, GitHub Copilot or a local server. There is no Acode backend in between.

This tutorial installs it, connects a provider, and walks through a first task safely.

## What You Need

- Acode version code `1002` or newer.
- A project folder open in Acode (local, terminal, SAF, FTP or SFTP).
- An API key or subscription for a model provider. If you aren't sure, an [OpenRouter](https://openrouter.ai) key gives access to many models with one key.

## Step 1: Install the Plugin

1. Open the sidebar and tap the **Plugins** icon, or go to **Settings** > **Plugins**.
2. Search for **Acode AI Agent** (by Acode Foundation) and install it.

A new **AI Agent** icon appears in the sidebar.

## Step 2: Open a Project

The agent only works inside an open folder. Open your project in the sidebar's file tree first.

For the best results, use a folder in the [built-in terminal](/user-guide/terminal) (**Terminal Public**, `~` in the terminal). There the agent can also run commands like `npm test` or `python3 main.py`. In SAF, FTP and SFTP folders it can still read, edit, move and delete files, but it can't run commands.

::: tip Just trying it out?
In the **AI Agent** sidebar, **Spin up new session** creates a starter project in your home folder and opens a chat in it.
:::

## Step 3: Open the Agent and Connect a Provider

1. Tap the **AI Agent** icon in the sidebar and start a session with **+**, or run **AI Agent: Open** from the [Command Palette](/user-guide/command-palette).
2. In the agent tab, tap **⋯** in the top-right corner and add a provider under **Provider access**:
   - **API key**: paste a key for OpenRouter, OpenAI, Anthropic, Gemini, xAI, Groq, DeepSeek and others.
   - **Subscription sign-in**: OpenRouter, ChatGPT Plus / Pro, Codex, GitHub Copilot, xAI and Kimi Code sign in through the browser or a device code.
   - **Local endpoint**: any OpenAI-compatible server, such as Ollama, LM Studio, llama.cpp or vLLM, at a URL like `http://192.168.1.10:8080/v1`.

Keys are kept in Acode's secure plugin storage, not in settings or chat history.

## Step 4: Choose a Mode and Model

The chip in the composer, for example `Ask · Med · <model>`, sets three things for the chat:

| Setting | What to pick |
| :------ | :----------- |
| **Permission mode** | Start with **Ask**: you approve every edit, delete and command. **Allow edits** lets it write files freely but still asks before deleting or running commands. **Full access** never asks. |
| **Thinking level** | **Med** is a good default. Higher levels think longer and cost more. |
| **Model** | Any model from your provider. You can also paste a model id that isn't in the list. |

::: warning
In **Full access** mode the agent can delete files and, in terminal folders, run any command without asking. Use it only in projects you can restore.
:::

## Step 5: Give It a First Task

An empty chat offers starter prompts such as **Map the project** and **Review the open file**. Try one, or write your own:

```text
Map this project and explain how the main pieces fit together. Don't edit anything.
```

Then ask for a small change:

```text
In @index.html, disable the Save button while the form is submitting.
```

Tips for good results:

- **Mention files with `@`** so the agent doesn't have to search for them.
- **Say how you'll know it's done** ("the button is disabled while saving").
- **For bigger changes, ask for a plan first** ("plan this, don't edit yet"), then tell it to go ahead.
- **Keep one task per chat.** Tap **+** when you switch topics.

## Step 6: Review and Undo Changes

- In **Ask** mode, each edit shows the removed (`−`) and added (`+`) lines before you approve it.
- Edits to files that are open in Acode stay **unsaved**, so you can read them and use the editor's undo before saving.
- After a turn, a card lists the changed files. **Undo** puts them back the way they were before that turn and deletes files it created. Moves, deletes and commands are not undone.

While a run is going, the work log shows each step. **Stop** ends the run, and sending a message steers it. If Android stops the app mid-run, the chat offers **Resume** from the last saved step.

## Step 7: Teach It About Your Project

Add an `AGENTS.md` file (or `CLAUDE.md`) to the root of your project with anything the agent should always know:

```md
# Project notes

- This is a plain HTML/CSS/JS site. No build step.
- Run `npx serve .` to preview it.
- Use tabs for indentation.
```

The agent reads it at the start of every chat. For repeatable jobs, add skills in `.agents/skills/<name>/SKILL.md`, or prompt templates in `.agents/prompts/` that become `/` commands.

## Useful Commands

Type `/` in the composer to see them all.

| Command | What it does |
| :------ | :----------- |
| `/model` | Change the model for this chat. |
| `/new` | Start a new chat. |
| `/compact` | Summarize older messages when the context ring fills up. |
| `/session` | Show this chat's token usage and cost. |
| `/tree` | Go back to an earlier point and branch from there. |
| `/resume` | List previous chats. |

The **AI Agent** sidebar lists chats per project, with search, so you can pick up where you left off.

## Troubleshooting

::: details "Open a folder first"
Open a project folder in the sidebar's file tree, then start a new chat.
:::

::: details The agent can't run commands
Commands only run in terminal folders. Move the project under **Terminal Public**, or let the agent edit files and run commands yourself in the [terminal](/user-guide/terminal).
:::

::: details Empty or failed replies
Try another model or a lower thinking level, and check that your provider key has credit.
:::

::: tip For plugin developers
Other plugins can add tools, providers and context to the agent through `acode.require("acode.ai.agent.runtime")`. See the plugin's [README](https://github.com/Acode-Foundation/acode-ai-agent) for the extension API.
:::
