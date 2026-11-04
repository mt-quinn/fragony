# Findings
Game uses vendored Three.js, custom FrameRenderer with world/weapon separation, AO/bloom and display finishing. Existing working tree contains unrelated ongoing work; lab will be isolated.

Primary sources:
- https://threejs.org/manual/pages/post-processing.html — render targets and sequential fullscreen passes.
- https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_pixel.html — RenderPixelatedPass, including depth/normal outlines. Our color-only pixel experiment is a cheaper approximation; geometry-aware outlines are a future step.
- https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/ — ordered dithering, quantization and CRT techniques.
- https://blog.maximeheckel.com/posts/moebius-style-post-processing/ — stylized outlines, crosshatched shadows; depth/normal edges improve on image-only edges.
- https://threejs.org/examples/webgl_postprocessing_glitch.html — digital displacement and channel separation.
- https://threejs.org/examples/webgl_postprocessing_rgb_halftone.html — print halftone.
- https://github.com/niccolofanton/morphing-ascii-shader — GPU glyph atlas and Sobel-based ASCII; possible follow-up rather than CPU DOM ASCII.

Experiments are independently authored interpretations of techniques, not copied code. Scene assets are existing game modules.

## Artistic assessment
- Pixel Forge: strongest retro identity. Palette mapping rather than just lowering resolution; target silhouettes need gameplay evaluation.
- Inklands: strongest illustrated identity; image-only contours should become depth/normal contours before shipping.
- Chalk Range: most distinctive departure. Colored line deposits preserve some shell color, but health readability needs deliberate treatment.
- Riso Riot: effective round-end cards and marketing imagery. Halftone screen crawl makes it less appropriate as an untested default.
- Lost Broadcast / Phosphor: atmosphere at reduced intensity; keep UI outside distortion.
- Buffer Rot: short reactive events, rather than persistent interference.
- Heatprint: special mode; luminance is not physical heat and does not identify enemies semantically.

## Integration
The lab shares arena builders, character rigs, rifle mesh and environment with the game, but is an isolated art-viewer renderer. Its clean reference uses a simple PBR/ACES path, not the exact production FrameRenderer AO/bloom/AA stack. To integrate: capture the composed HDR world and weapon after FrameRenderer finishing, decide whether weapon should be stylized separately, apply one finishing shader, draw HUD afterward. Avoid double tone mapping: the lab shader currently performs ACES and gamma itself. For pixel/ink/chalk, add depth and normal buffers for stable geometry contours. No new production setting or gameplay change has been made.

World texture preview uses the official Three.js depth-texture mechanism (https://threejs.org/docs/pages/DepthTexture.html; https://threejs.org/examples/webgl_depth_texture.html). A separate viewmodel color target prevents its depth clear from destroying scene depth. Reconstructing surface position before selecting the dither threshold anchors it to surfaces. The existing screen-space pixel color sampling and its distance/detail impression are deliberately unchanged; no new depth-of-field or pixel-size falloff was added. Preview lives in the excluded art lab only.
