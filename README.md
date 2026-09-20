# GOMA — Open City

GOMA is an original **3D third-person browser action game** built as a focused playable vertical slice. The current build uses Three.js/WebGL, procedural low-poly environments, a perspective camera, authored districts, vehicles, NPCs, combat, police response, missions, progression, and responsive desktop/mobile controls.

## Design direction

GOMA is intentionally taking structural inspiration from several established game-design patterns without copying their protected assets, characters, maps, dialogue, or branding:

- **Cry of Fear:** authored atmosphere, tension, readable survival/combat feedback, purposeful progression, and environmental storytelling. Its official Steam description emphasizes cinematic experience, immersion, lateral thinking, atmosphere, and a long single-player campaign.
- **Black Mesa:** deliberate combat spaces, environmental guidance, enemy AI, audiovisual feedback, and authored campaign progression. Its developers describe redesigned combat arenas, clearer puzzles/objectives, improved AI, detailed environments, soundtrack, and voice acting.
- **GTA: San Andreas:** third-person open-world traversal, missions with explicit objectives, free roaming, vehicles, weapons, safehouses, and a wanted/police loop.

The goal is not to make “GTA in a browser.” The goal is to build an original game with a coherent identity and a playable loop.

## Current 3D vertical slice

- Real WebGL 3D rendering with a perspective camera
- Third-person character controller
- Mouse camera / pointer-lock aiming on desktop
- WASD movement, sprint, weapon switching, interaction, shooting
- Touch movement, sprint, fire, and action controls
- Procedural city blocks with roads, sidewalks, windows, rooftops, park, harbor, street lights
- Six authored locations: Police HQ, Garage, Safehouse, Warehouse 9, Night Club, Harbor
- Driveable vehicle with steering, acceleration, collision damage, enter/exit
- Pedestrian NPCs and traffic
- Enemy archetype foundation and police pursuit
- Wanted/heat escalation and civilians reacting to danger
- Five weapons: pistol, SMG, shotgun, bat, rifle
- Five authored mission beats with reach, clear, heat, and survival objectives
- Cash rewards, kills, weapon ammo, local persistence
- Dynamic day/night lighting and fog
- Camera shake, hit feedback, neon signage, shadows, and responsive HUD
- No proprietary game assets or Rockstar/Valve/Team Psykskallar assets

## Controls

### Desktop

**WASD** move/drive · **Mouse** rotate camera · **Left click** fire · **E** interact/enter/exit · **Shift** sprint · **1–5** weapons · **Esc** pause · **M** map hint.

### Mobile

Directional controls, **SPRINT**, **FIRE**, and **ACTION** are shown automatically on smaller screens.

## Development

The game is intentionally dependency-light: Three.js is loaded as a pinned browser module from jsDelivr, while game content is generated locally in JavaScript.

For local development:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

Validate syntax:

```bash
node --check main3d.js
node --check main.js
git diff --check
```

## Roadmap

This is an **alpha / vertical slice**, not a finished commercial release.

Next production gates are:

1. Replace procedural placeholder geometry with an authored modular asset set.
2. Add character animation states and better vehicle models.
3. Build a connected mission campaign with authored encounters and scripted events.
4. Add interiors for the core locations.
5. Improve enemy/police AI with cover, search, line-of-sight, and vehicle pursuit.
6. Add original music loops, ambience, voice/dialogue, and environmental sound.
7. Add controller/gamepad support.
8. Perform Chrome/Edge/Firefox/Safari and physical Android/iOS QA.
9. Profile low-end hardware and add quality presets.
10. Run a public playtest before calling the game production-ready.

## IP and legal direction

GOMA is an original project. Research references are design references only. Do not add GTA, Black Mesa/Half-Life, Cry of Fear, Rockstar, Valve, or Team Psykskallar assets, maps, characters, dialogue, logos, or soundtrack material. Future third-party assets must be original, owned, or properly licensed.
