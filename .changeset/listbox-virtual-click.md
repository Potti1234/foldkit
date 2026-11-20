---
'@foldkit/ui': patch
---

A listbox item now ignores a virtual click (`event.detail === 0`, like `element.click()`) while it is not highlighted, matching Base UI's guard on programmatic activation. Clicks on the highlighted item and real pointer clicks still commit, reported through the existing `IgnoredMouseClick` no-op message.
