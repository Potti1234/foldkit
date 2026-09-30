---
'@foldkit/ui': patch
---

ArrowDown past the last option and ArrowUp past the first now return the highlight to the input instead of wrapping, matching Base UI. From the input, ArrowDown highlights the first option and ArrowUp the last, so keyboard users can always get back to the text field with the opposite key. Previously the highlight wrapped from last to first and could never rest on the input. Pointer-leave now only clears the highlight when the pointer activated it, so a keyboard-driven highlight survives the mouse leaving the list.
