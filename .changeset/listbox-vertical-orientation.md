---
'@foldkit/ui': patch
---

A vertical listbox no longer emits `aria-orientation="vertical"`. `vertical` is the default orientation in the ARIA spec, so the explicit attribute is noise; horizontal listboxes still emit `aria-orientation="horizontal"`.
