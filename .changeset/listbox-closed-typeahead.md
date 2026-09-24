---
'@foldkit/ui': patch
---

Select a matching item when a printable key is pressed on a closed listbox button, matching native `<select>` prefix-search behaviour. Previously a closed listbox ignored typeahead keys entirely and only Enter, Space, or the arrow keys did anything. Read-only listboxes still refuse the commit.
