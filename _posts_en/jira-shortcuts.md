---
title: 'Jira Efficiency: A Guide to Common Keyboard Shortcuts'
date: 2025-11-15
author: Tang Moying
categories: [plan]
tags: [Jira, Shortcuts, Efficiency, Requirements Management]
lang: en
alt_url: /post/jira-shortcuts
---


## 1. Why Use Shortcuts

In the daily work of managing requirements in Jira, a lot of time goes into creating Issues, editing fields, switching views, and searching and filtering. If every action means clicking around with the mouse, your efficiency takes a big hit.

Jira ships with a rich set of keyboard shortcuts, and once you're fluent with them they can greatly boost how efficiently you work. This article collects the most practical shortcuts for everyday use, grouped by scenario.

> **Tip**: The first time you use them, press `?` to see all the shortcuts available on the current page. Shortcuts may differ slightly from page to page.

## 2. Global Shortcuts

Global shortcuts work on any page:

| Shortcut | Function |
|--------|------|
| `g` + `d` | Jump to the Dashboard |
| `g` + `p` | Jump to my project list |
| `g` + `b` | Jump to the current project's Backlog |
| `g` + `c` | Jump to the current project's board (Board) |
| `g` + `s` | Jump to the current project's Sprints (iteration list) |
| `/` | Focus the search box |
| `?` | Open the keyboard shortcut help panel |
| `j` | Select the next Issue |
| `k` | Select the previous Issue |
| `o` or `Enter` | Open the currently selected Issue |
| `e` | Quick-edit the current Issue |
| `m` | Add a comment |
| `s` | Watch/unwatch the current Issue |
| `l` | Focus the assignee field |
| `a` | Focus the assignee field and open the people picker |
| `u` | Open the links panel for the current Issue |
| `t` | Change the Issue's status |
| `Tab` | Move between fields on the current Issue detail page |
| `Esc` | Close the current dialog or cancel the selection |

> **The `g` combo pattern**: `g` is short for Go, and the following d/p/b/c/s correspond to Dashboard/Projects/Backlog/Board/Sprints respectively — remember this pattern and you remember a whole string of shortcuts.

## 3. Issue List Page Shortcuts

Used in Issue lists (such as the Backlog, board and Sprint views):

| Shortcut | Function |
|--------|------|
| `c` | Create a new Issue |
| `/` | Open advanced search (JQL) |
| `g` + `i` | Open the "My Issues" quick filter |
| `,` | Open the current project's settings |
| `m` | Bulk-add comments (after selecting multiple Issues) |
| `b` | Bulk-assign the assignee (after selecting multiple Issues) |
| `p` | Bulk-move to a project |
| `d` | Bulk delete (use with caution) |

### List Navigation

| Shortcut | Function |
|--------|------|
| `j` | Select the Issue on the next row |
| `k` | Select the Issue on the previous row |
| `Space` | Expand/collapse the details of the selected Issue |
| `→` | Expand the selected Issue's subtasks or links |
| `←` | Collapse the expanded content |
| `Home` | Jump to the top of the list |
| `End` | Jump to the bottom of the list |

## 4. Issue Detail Page Shortcuts

Once you've opened an Issue, on the detail page you can use:

| Shortcut | Function |
|--------|------|
| `e` | Quick-edit (opens the edit dialog) |
| `a` | Change the assignee |
| `l` | Focus the assignee field |
| `t` | Change the status |
| `p` | Change the priority |
| `m` | Add a comment |
| `s` | Toggle watch status |
| `o` | Open the raw comment view |
| `r` | Reply to the selected comment |
| `y` | Toggle showing/hiding completed workflow steps |
| `v` | Open the vote panel |
| `w` | Open the watchers panel |
| `u` | Open the links panel |
| `Esc` | Close the detail page |

### Comment Editor

| Shortcut | Function |
|--------|------|
| `Ctrl + Enter` | Submit the comment |
| `Ctrl + Shift + C` | Clear the comment content |
| `Ctrl + B` | Bold |
| `Ctrl + I` | Italic |
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |

## 5. Shortcut Actions in Editors

In editors such as the Issue description and comments:

| Shortcut | Function |
|--------|------|
| `@` | Mention a user (typing `@` pops up the user picker) |
| `#` | Reference another Issue (typing `#` pops up the Issue picker) |
| `{` | Insert a macro (such as `{code}...{code}`) |
| `!` | Insert an attachment placeholder |

For example, typing `[PROJ-123]` is automatically resolved into a clickable Issue link. Typing `/quote` quickly inserts a quote block.

## 6. Board View Shortcuts

In a Scrum or Kanban board:

| Shortcut | Function |
|--------|------|
| `c` | Create an Issue in the current swimlane |
| `s` | Open the current swimlane's settings |
| `n` | Create a new swimlane |
| `r` | Rename the swimlane |
| `d` | Delete the swimlane |
| `,` | Open the board settings |

### Actions Within a Swimlane

| Shortcut | Function |
|--------|------|
| `j` | Select the next card |
| `k` | Select the previous card |
| `→` / `←` | Move the card to the adjacent column |
| `↑` / `↓` | Move the card up and down within the column |
| `Space` | Expand/collapse the card details |
| `o` | Open the card details |

## 7. Search and Filter Shortcuts

| Shortcut | Function |
|--------|------|
| `/` | Quick search — jump to the search box |
| `g` + `f` | Open filter management |
| `Ctrl + /` | Toggle Quick Filter |
| `Ctrl + S` | Save the current search as a filter |

### Quick Filters

Boards usually have a quick filter bar at the top; press `Tab` to focus it and type a keyword to filter the cards.

## 8. General Browser Shortcuts

Besides Jira's own shortcuts, browsers have some commonly used actions too:

| Shortcut | Function |
|--------|------|
| `Ctrl + L` | Focus the address bar |
| `Ctrl + R` | Refresh the page |
| `Ctrl + D` | Bookmark the current page |
| `Ctrl + Tab` | Switch to the next tab |
| `Ctrl + Shift + Tab` | Switch to the previous tab |
| `Ctrl + T` | Open a new tab |
| `Ctrl + W` | Close the current tab |
| `Ctrl + F` | Find on the current page |

## 9. Custom Shortcuts

Jira lets administrators customize some shortcuts for a project:

- **Workflow transition shortcuts**: set keyboard shortcuts for commonly used status transitions
- **Bulk operation shortcuts**: set shortcuts for bulk assign, bulk move and so on

Where to set it: **Project Settings → Shortcuts**

## 10. Practical Advice

A few practical tips for using shortcuts:

1. **Start with the high-frequency actions**: first memorize `j`/`k` (move up/down), `o` (open), `e` (edit) and `m` (comment) — these four cover 80% of your daily actions.
2. **Make good use of the `?` help**: when you're unsure about a shortcut, press `?` to see the full list for the current page.
3. **Remember the `g` combos**: `g` is short for Go, and the following d/p/b/c/s correspond to Dashboard/Projects/Backlog/Board/Sprints respectively.
4. **Don't rote-memorize — you'll remember them naturally through use**: after you repeat a frequently used action a few times, your fingers remember the shortcut on their own; there's no need to deliberately drill it.

## 11. Summary

Shortcuts are a "lever" for boosting efficiency: invest a little time learning them and you save a lot of mouse-clicking time over the long run. I suggest starting with the four most common ones — `j`/`k` to navigate, `o` to open, `e` to edit, `m` to comment — and once you're fluent, gradually expanding to the other scenarios.

A small step forward every day is a new height!
