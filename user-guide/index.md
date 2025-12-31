<script setup>
import { 
  Command, 
  FolderOpen, 
  Globe, 
  Puzzle, 
  Terminal, 
  Settings, 
  Keyboard,
  Zap
} from 'lucide-vue-next';
</script>

# Acode User Guide

Welcome to the Acode User Guide! This section helps you master every feature of the Acode editor.

## What is Acode?

Acode is a powerful, lightweight code editor for Android with features like syntax highlighting, a built-in terminal, remote file access, and an extensive plugin ecosystem.

## Quick Links

<div class="grid-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1.5rem 0;">

<div style="padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
<Command :size="20" style="color: var(--vp-c-brand-1);"/>

**[Command Palette](./command-palette)**

Quickly access any command with `Ctrl+Shift+P`

</div>

<div style="padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
<FolderOpen :size="20" style="color: var(--vp-c-brand-1);"/>

**[File Browser](./file-browser)**

Manage files, workspaces, and projects

</div>

<div style="padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
<Globe :size="20" style="color: var(--vp-c-brand-1);"/>

**[Remote Access](./remote-access)**

Connect to FTP and SFTP servers

</div>

<div style="padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
<Puzzle :size="20" style="color: var(--vp-c-brand-1);"/>

**[Plugins](./plugins)**

Extend functionality with plugins

</div>

<div style="padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
<Terminal :size="20" style="color: var(--vp-c-brand-1);"/>

**[Terminal](./terminal)**

Full Alpine Linux terminal environment

</div>

<div style="padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
<Settings :size="20" style="color: var(--vp-c-brand-1);"/>

**[Settings](./settings)**

Customize every aspect of the editor

</div>

<div style="padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
<Keyboard :size="20" style="color: var(--vp-c-brand-1);"/>

**[Keybindings](./keybindings)**

Custom keyboard shortcuts

</div>

<div style="padding: 1rem; border: 1px solid var(--vp-c-divider); border-radius: 8px;">
<Zap :size="20" style="color: var(--vp-c-brand-1);"/>

**[QuickTools](./quicktools)**

Fast access toolbar for touch devices

</div>

</div>
