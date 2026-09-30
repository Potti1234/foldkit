---
'@foldkit/ui': patch
---

Arrow-key navigation in a listbox now stops at the first and last items instead of wrapping, matching Base UI. `findFirstEnabledIndex` and `keyToIndex` take a `wrapAround` flag (defaulting to `true`, so tabs and menus keep wrapping); the listbox's arrow navigation passes `false`. An arrow at an edge still reports the key as handled without emitting a scroll command, and Home, End, PageUp, PageDown and typeahead are unchanged.
