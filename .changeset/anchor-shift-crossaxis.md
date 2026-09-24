---
'@foldkit/ui': patch
---

Enable `crossAxis` on the anchor's `shift` middleware so floating elements with `side: 'left'` or `side: 'right'` are clamped against their escape edge instead of overflowing off-screen when the reference sits near the viewport edge.
