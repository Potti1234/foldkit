---
'@foldkit/ui': patch
---

The menu backdrop now prevents the native context menu, so right-clicking the backdrop of an open menu no longer opens the browser menu over the UI or closes it. This uses the new `OnContextMenuPreventDefault` attribute, which swallows the event without dispatching.
