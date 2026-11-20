---
'@foldkit/ui': patch
---

Home and End inside an open combobox now fall through to the browser, so they move the text caret in the input instead of navigating the highlighted option. Previously the keys activated the first and last items and suppressed the caret move, which made editing long queries awkward.
