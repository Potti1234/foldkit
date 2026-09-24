---
'@foldkit/ui': patch
---

Reconcile the tooltip's hover state with the DOM when the trigger mounts. A trigger remounted under a stationary pointer fires no `mouseenter`, so the model kept `isHovered: true` while no show-delay wait was ever armed again — the tooltip wedged shut until the pointer left and re-entered.
