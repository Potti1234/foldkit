---
'@foldkit/ui': patch
---

The combobox popup now stays mounted when the filter removes every option, matching Base UI. `aria-expanded`, `aria-controls` and the backdrop remain live so the panel can host an empty-state message and stay dismissible; previously the panel unmounted on zero matches, which collapsed `aria-expanded` and dropped the modal backdrop while the combobox still read as open.
