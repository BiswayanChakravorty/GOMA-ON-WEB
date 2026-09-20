# GOMA Tier-B Roadmap Status

## Release identity

**Version:** `v0.3.0-polished-alpha`  
**Positioning:** Expanded playable alpha / production-polished vertical slice  
**Deployment:** Static GitHub Pages client

The roadmap explicitly recommends proving a vertical slice before expanding to full Tier-B content. This release follows that recommendation and does not claim that the complete 1.0 launch checklist is finished.

## Implemented in this release

| Roadmap area | Status | Notes |
|---|---|---|
| Stable game loop | Complete | Canvas loop, responsive resize, DPR handling, capped frame delta |
| Player controller | Complete | Walking, acceleration feel, sprint, stamina, collision, health feedback |
| Vehicle foundation | Complete | Enter/exit, steering, acceleration, collision damage, destruction/reset |
| Combat foundation | Complete | Fists, bat, pistol, SMG, shotgun, ammo, projectiles, hit points, enemy health |
| Police foundation | Complete | Wanted levels, police spawning, pursuit, contact damage, heat decay |
| NPC reaction | Partial | Civilians flee during heat; full pathfinding/reporting is future work |
| Mission framework | Complete for vertical slice | Go, clear-area, and escape-heat objectives with chained unlocks |
| Progression | Complete for vertical slice | Cash, XP, levels, weapon slots, rewards |
| Save system | Complete | localStorage autosave, manual save, continue, reset, settings persistence |
| City districts | Complete | Downtown, Industrial, Residential, Harbor, Outskirts labels |
| Landmarks | Complete | Police HQ, garage, safehouse, armory, hospital, club, warehouse, harbor, bank, fuel station |
| Interactive locations | Complete for slice | Safehouse save, garage repair, armory weapon rotation, landmark prompts |
| UI/UX | Complete for slice | Main menu, pause, map, inventory, settings, credits, HUD, toast feedback |
| Audio | Complete for slice | Original synthesized interaction, combat, alert, and mission feedback sounds |
| Mobile controls | Complete for slice | Direction pad, sprint, action, fire, responsive HUD |
| Performance foundation | Partial | View culling for world entities, capped delta, bounded entity counts; deeper pooling/streaming remains |
| GitHub Pages | Complete | Existing Actions workflow retained and documented |
| Original/IP-safe direction | Complete | No external game assets, proprietary brands, or copied soundtrack |

## Production polish completed in this pass

- Five selectable vehicle archetypes with distinct handling and presentation
- Three enemy archetypes with different health/speed profiles
- Dynamic day/night tint and wanted-state visual treatment
- Damage vignette and camera-shake feedback
- Player movement animation/bob and vehicle presentation polish
- Synthesized gameplay music layer with different tension notes during heat
- Vehicle HUD and improved mobile/control messaging
- Runtime particle cap and additional browser-performance safeguards
- JavaScript syntax and whitespace validation added to the Pages workflow

## Remaining Tier-B production gates

The complete roadmap still calls for more authored content and validation: 12–20 main missions plus 5–10 side missions, 5–8 distinct vehicle types, broader NPC and enemy variety, full interiors, original music loops, 8–12 polished landmarks, physical-device QA, analytics, server-side leaderboard validation if online features are added, production art/animation/effects, formal legal review, and a public beta with tester feedback.

Until those gates are completed and tested, the product should be described as an **expanded playable alpha / vertical slice** rather than a finished commercial Tier-B release.

## QA checklist for the next pass

- [x] JavaScript syntax check (`node --check main.js`)
- [x] Git whitespace check (`git diff --check`)
- [x] Static server smoke check (HTTP 200 for `/` and `/main.js`)
- [x] GitHub Pages workflow present
- [ ] Desktop browser matrix: Chrome, Edge, Firefox, Safari
- [ ] Mobile device matrix: Android Chrome and iOS Safari
- [ ] Physical-device frame-rate and rotation testing
- [ ] GitHub Pages production URL verification after Actions deployment

## Safe release commands

```bash
node --check main.js
git diff --check
python3 -m http.server 8080
```

All game data is client-side. Do not add online scores, accounts, or secrets without a separately validated backend.
