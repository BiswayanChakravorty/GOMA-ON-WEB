# GOMA — The Last Signal

GOMA is an original **3D third-person story game** built for the browser. The current implementation is an authored **Act I playable build**, not the old open-city sandbox prototype.

## Current playable scope

Act I follows Aarav during the first stage of the disappearance investigation:

- **Prologue — 03:17:** establishes Aarav and Mira before the incident, the eleven-second signal, and Mira's disappearance.
- **Mission 1 — The Official Story:** search Mira's apartment, recover evidence, and challenge the police explanation.
- **Mission 2 — First Contact:** follow Mira's trail to the maintenance corridor, encounter impossible geometry, and hear her warning.
- **Mission 3 — Ward 7:** enter the abandoned hospital wing, fight the first signal-touched enemies, awaken Resonance: Sense, and recover transfer records.
- **Mission 4 — What She Knew:** assemble the evidence, discover Mira investigated before Day 7, and unlock the route below Veyra.

The Act I build is deliberately focused on **authored story spaces and progression** rather than generic free-roam content.

## Foundation systems now in place

- Three.js/WebGL third-person renderer
- Camera-relative movement and mouse camera
- Basic collision volumes and authored mission spaces
- Mission state machine for Prologue + Missions 1–4
- Dialogue/cutscene presentation
- Evidence collection and persistent story flags
- Local save / continue / reset
- Resonance meter and first ability progression
- Signal-touched combat and health/damage loop
- Mission-specific environments: residential apartment, maintenance corridor, St. Auguste Ward 7, evidence room
- Responsive HUD and story-first menu
- GitHub Pages deployment with JavaScript syntax validation

## Controls

**WASD** — move  
**Mouse** — camera  
**E** — interact / inspect  
**F / Space** — fire  
**Esc** — pause

## Development

The project intentionally has no build-step dependency for the browser prototype. Three.js is loaded as a pinned browser module.

Local server:

    python3 -m http.server 8080

Syntax validation:

    node --check main.js
    node --check main3d.js
    node --check src/main.js
    git diff --check

## Production direction

The old `main3d.js` sandbox remains in the repository for reference, but `index.html` now boots the new story foundation at `src/main.js`.

The next development step is **not** to jump to Act II. First, this Act I build should be playtested for:

1. movement and camera feel
2. story pacing
3. dialogue presentation
4. investigation readability
5. combat feel in Ward 7
6. evidence progression
7. save/continue reliability

After that feedback, the same foundation can be expanded into Act II without throwing away the architecture again.

GOMA is an original project. Do not add GTA, Black Mesa/Half-Life, Cry of Fear, Rockstar, Valve, or Team Psykskallar assets, maps, characters, dialogue, logos, or soundtrack material. Future third-party assets must be original, owned, or properly licensed.
