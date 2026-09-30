---
'@foldkit/ui': patch
---

The hidden inputs a combobox renders for form submission now carry `disabled` when the combobox `isDisabled`, so a disabled combobox no longer leaks its value into the enclosing form's submission.
