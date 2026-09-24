---
'@foldkit/ui': minor
---

Add an `inputValue` field to the combobox `init` config so a parent that restores a selection before mount can seed the input's display text. Previously `init` always set `inputValue: ''`, so a pre-selected combobox showed the placeholder until the first open and close.
