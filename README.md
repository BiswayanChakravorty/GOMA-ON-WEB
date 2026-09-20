# GOMA — Open City

GOMA is an original, dependency-free 2D open-city action game that runs directly in modern desktop and mobile browsers. It is designed for GitHub Pages and uses no external assets, runtime services, game-engine build step, or proprietary game branding.

## What is included in this release

This release implements the roadmap's recommended vertical slice rather than claiming that every Tier-B content target is complete. It includes walking with sprint/stamina, drivable vehicle entry/exit, vehicle health and collision damage, five original weapon slots, melee and ranged combat, ammunition, enemy health, projectiles, damage feedback, police escalation and wanted-level decay, fleeing civilians, mission chains, clear/escape objectives, XP and levels, cash rewards, five districts, ten landmarks, a safehouse, garage, armory, minimap, main menu, pause menu, map/inventory/settings/credits modals, local save/continue/reset, synthesized original sound effects, responsive HUD, touch movement/sprint/action/fire controls, and quality settings.

## Controls

On desktop, use **WASD or arrow keys** to move and drive, **Shift** to sprint, **E** to interact or enter/exit the vehicle, **F** to attack, **1–5** to switch weapons, and **Esc** to pause. On mobile, use the directional pad, SPRINT, FIRE, and ACTION buttons. Walking, combat, and driving are context-sensitive.

## Local development

No build step is required. Serve the repository over HTTP so browser module loading and localStorage behave like deployment:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`. The JavaScript is checked with `node --check main.js`.

## GitHub Pages

`.github/workflows/pages.yml` deploys the repository on every push to `main`. In GitHub, open **Settings → Pages** and select **GitHub Actions** under Build and deployment. The release remains a static client; accounts, cloud saves, validated leaderboards, and multiplayer require a separate backend and must not be implemented by trusting client-submitted scores.

## Roadmap status

The vertical slice is the foundation for the remaining Tier-B work. The documented launch targets that still need further production passes are: 12–20 authored main missions plus side content, five to eight authored vehicle types, larger combat and NPC variety, full interiors, original music loops, cross-device QA on physical devices, analytics, server-side leaderboard validation, asset pipeline/polish, and formal legal/release review. This repository should therefore be described as an **expanded playable alpha / vertical slice**, not as a finished commercial game or a GTA substitute.

## Legal and creative direction

All game names, text, mission concepts, map layout, visuals, audio synthesis, characters, and branding in this repository are original. Do not add Rockstar/GTA assets, characters, logos, map recreations, or soundtrack material. Any future third-party asset must be owned, original, or properly licensed before distribution.
