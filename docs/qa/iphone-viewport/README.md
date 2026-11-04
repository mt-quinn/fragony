# Installed iPhone display follow-up

User device: iPhone16ProMax, iOS26.6.2. Screenshot2868×1320 physical pixels; rendered game ends at1134, consistent with a62CSS-pixel band at DPR3.

The earlier fixed-body/default-status-meta attempt failed ondevice. This release removes the fixed touch root, anchors the game layers to a common document rectangle, measures that rectangle for renderer/camera/control sizing, settles rotation and page resume, requests fullscreen installation with standalone fallback, and removes the deprecated status-bar-style key.

Verified:
- Focused viewport/mobile/menu/settings tests pass, including a956×440 stage with stale378 window height, rotated440×956 stage, empty-box fallback and safe inset handling.
- Additional presentation and input-control checks pass.
- Isolated production preview has stage, canvas and controls all440px high at956×440; document scrollHeight440.
- Portrait stage/canvas/controls all956px high at440×956; document scrollHeight956, rotation prompt and pause shown.
- Return to landscape restores440px extents; no browser errors. Display report is available under Settings→Visuals.
-203-file production package252684495 bytes, below250MiB. Map data/geometry untouched.

These are desktop layout regression checks. No actual iOS26.6.2 Home Screen session is available here. WebKit313800 and301994 describe a system-owned62px strip outside DOM rendering, and317153 records install-time differences. Physical-device resolution is **not confirmed**. If relaunch still shows the band, the user-invoked display report captures the screen, visual viewport, document, stage, canvas, controls and insets; do not repeat a CSS-only claim of success without that evidence.

The release was isolated from another active antialiasing change in the shared workspace. That work was preserved and excluded from this source commit.
