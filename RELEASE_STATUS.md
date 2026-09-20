# GOMA Release Status

## Current release

**Version:** v0.4.0-3d-alpha  
**Positioning:** 3D playable vertical slice / pre-production prototype  
**Deployment:** Static GitHub Pages client

## What changed

The previous 2D canvas prototype has been replaced as the active game entrypoint with a real WebGL/Three.js 3D slice.

### 3D foundation
- Perspective camera and WebGL renderer
- Third-person character presentation
- Pointer-lock mouse camera on desktop
- Responsive mobile controls
- Dynamic lighting, fog, shadows, day/night cycle

### World
- Procedural low-poly city blocks
- Roads and sidewalks
- Windows and rooftops
- Park with trees
- Harbor/water area
- Street lighting
- Six authored landmarks

### Gameplay
- WASD movement and sprint
- Vehicle entry/exit and driving
- Vehicle collision damage
- Five weapons with different fire profiles
- Hitscan/projectile combat foundation
- Enemy combat
- Police pursuit and wanted heat
- Civilian panic behavior
- Traffic
- Mission progression and rewards
- Cash, kills, ammo, health and armor
- Local save

### Presentation
- Dedicated title screen
- Clear control instructions before play
- Objective HUD
- Weapon/ammo HUD
- Health/armor/heat feedback
- Interaction prompts
- Toast feedback
- Camera shake
- Neon signage
- Night lighting and fog

## Research-driven design direction

The design pass was informed by the documented structure of Cry of Fear, Black Mesa, and GTA: San Andreas:

- Cry of Fear: atmosphere, cinematic progression, lateral thinking, survival-horror feedback, and authored campaign structure.
- Black Mesa: deliberate combat spaces, readable objectives, enemy AI, environment detail, sound, and presentation.
- San Andreas: third-person traversal, free-roam structure, explicit mission objectives, vehicles, weapons, safe locations, and police/wanted escalation.

These are design references only. GOMA uses original names, geometry, characters, mechanics implementation, and presentation.

## Not production-ready yet

The 3D slice is materially different from the previous 2D prototype, but it is still not a finished commercial game.

Remaining gates:

- Authored 3D asset pipeline
- Character and vehicle animation
- More detailed interiors
- Larger authored mission campaign
- Better police/search/cover/vehicle AI
- Original music and environmental audio
- Controller support
- Physical-device QA
- Low-end GPU profiling
- More extensive save-state coverage
- Accessibility and settings
- Public playtest and legal/release review

## Validation

The GitHub Pages workflow now checks both `main.js` and `main3d.js` syntax before deployment.

A browser/device playtest is still required for final verification.