---
'foldkit': minor
---

Two event attributes covered common DOM behaviour the builder could not express. `OnClick` only told you a click happened, so a handler could not distinguish a real click (`event.detail > 0`) from a virtual one (`element.click()`, `event.detail === 0`), which components like listboxes use to ignore programmatic activation on unhighlighted items. And `OnContextMenu` always dispatched a message, so a handler could not just swallow the event — a backdrop that must block the native context menu without telling the app anything had no spelling.

`OnClickDetail(f)` hands the handler the click's `detail` and dispatches the `Option` it returns, and `OnContextMenuPreventDefault(message?)` always prevents the default and only dispatches when a message is given. `Scene.click` now reports `detail: 0`, matching what a browser produces for programmatic clicks.
