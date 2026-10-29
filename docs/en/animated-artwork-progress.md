# Animated artwork · preview.5

The existing idle, seated and prone images now support continuous WebGL deformation: breathing, gentle head movement and hair sway. The seated contact point remains fixed. A small speech-time movement follows playback status; it is not phoneme lip sync.

The motion toggle is on by default and follows reduced-motion settings. Stop returns to still artwork. Hidden pages stop rendering. Unsupported or lost WebGL falls back to the original image. Drawing and native alpha hit testing share the deformation parameters.

## Validation

The packaged Windows app passed 22 native checks and 5 unit tests. Each pose rendered 23 frames over 700ms with actual pixel changes. Disabling motion stopped drawing and produced identical captures. Window following, 40 moves, minimization detach and speech interruption passed. Initial DSH startup timed out; the second run passed. Cold-start reliability needs further observation. The global shortcut was unavailable during this run; the independent stop-button path passed.

## Cubism work remaining

This is a flat-art animation preview, not Cubism SDK rendering. There is no finished moc3 model, separated face/eyes/mouth or rig. Blink, mouth shapes, true head rotation and skeletal limb motion remain unimplemented. The PSD remains a preparation scaffold.

Next: install Cubism Editor, extract and repaint one pose, rig eyes/mouth/head/breathing, export moc3/model3.json/textures/physics, then connect the existing motion controls to a Cubism renderer. Seated and prone require separate artwork rigs. The repository does not bundle Cubism Editor or SDK.
