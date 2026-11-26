---
title: "Autocomplete"
description: "AI-powered code autocompletion in Semafour"
---

# Autocomplete

Semafour's autocomplete feature provides intelligent code suggestions and completions while you're typing, helping you write code faster and more efficiently. It offers both automatic and manual triggering options.

## How Autocomplete Works

The extension uses **Fill-in-the-Middle (FIM)** completion. It analyzes the code before and after your cursor to generate contextually accurate inline suggestions.

You can use any model from a provider you have already configured, including local OpenAI-compatible servers such as llama.cpp. When you are signed in, the default is **Mercury Edit 2 (Next Edit)** through the Semafour Gateway. When you are not signed in, autocomplete uses the first configured provider instead of stopping at the Semafour login.

Built-in presets:

- **Codestral** (`mistralai/codestral-2508`) by Mistral AI, through Semafour or a Mistral API key.
- **Mercury Edit 2** (`inception/mercury-edit-2`) by Inception, through Semafour or an Inception API key. Next Edit predictions stay limited to these two providers. Other models use classic inline completion.

## Triggering Options

### Auto-trigger

Autocomplete is **enabled by default** and automatically shows inline suggestions as you type. Suggestions appear as ghost text that you can accept with `Tab`.

### Trigger on keybinding (Cmd+L)

Press `Cmd+L` (Mac) or `Ctrl+L` (Windows/Linux) to manually request a completion at your cursor position.

{% callout type="note" %}
This keybinding requires `kilo-code.new.autocomplete.enableSmartInlineTaskKeybinding` to be enabled in VS Code settings. It is **disabled by default**.
{% /callout %}

## Provider and Model

Pick the model under **Settings → Models → Autocomplete model**. The list includes the built-in presets for providers you have connected, plus every model from your other configured providers.

- **Mercury Edit 2 (Next Edit)** is the default while you are signed in to Semafour. The same model is available with an Inception API key.
- **Codestral** is available through Semafour or a Mistral API key. With a Mistral key, your Mistral plan and usage limits apply. See [Setting up Mistral for autocomplete](/docs/code-with-ai/features/autocomplete/mistral-setup).
- **Any other configured model**, including a local model from llama.cpp, uses classic inline completion.

{% callout type="note" %}
Next Edit predictions are limited to Mercury on Semafour and Inception. Every other model completes at the cursor.
{% /callout %}

## Status Bar

The extension displays an **autocomplete status indicator** in the VS Code status bar, including:

- Current autocomplete state (active/snoozed)
- Cumulative cost tracking for autocomplete requests

### Snooze / Unsnooze

You can temporarily disable autocomplete by clicking the status bar item to **snooze** it. Click again to **unsnooze** and re-enable suggestions.

## Copilot Conflict Detection

The extension automatically detects if **GitHub Copilot** inline suggestions are enabled and warns you about potential conflicts. Disable Copilot's inline completions for the best experience with Semafour autocomplete.

## Best Practices

1. **Use Manual Autocomplete for precision**: When you need suggestions at specific moments, use the keyboard shortcut rather than relying on auto-trigger
2. **Use chat for complex changes**: Chat is better suited for multi-file changes and substantial code modifications
3. **Steer autocomplete with comments**: Write a comment describing what you want before triggering autocomplete, or type a function signature — autocomplete will fill in the implementation

4. **Check the status bar tooltip**: Hover the status bar item to see autocomplete state and cost tracking

## Tips

{% callout type="tip" %}
**When to use chat vs autocomplete:** Use chat for multi-file changes, refactoring, or when you need to explain intent. Use autocomplete for quick, localized edits where the context is already clear from surrounding code.
{% /callout %}

{% callout type="tip" %}
**Treat suggestions as drafts:** Accept autocomplete suggestions quickly, then refine. It's often faster to fix a 90% correct suggestion than to craft the perfect prompt.
{% /callout %}

- Autocomplete works best with clear, well-structured code
- Comments above functions help autocomplete understand intent
- Variable and function names matter — descriptive names lead to better suggestions

## Related Features

- [Code Actions](/docs/code-with-ai/features/code-actions) - Context menu options for common coding tasks
