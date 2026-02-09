# Space Botanics: Alien Defense

A lane-based tower defense game playable directly in the browser. Defend your
space garden from waves of alien invaders by placing botanical defenders on a
5-lane grid.

## How to Run

1. Open `index.html` in any modern browser (Chrome, Firefox, Safari, Edge).
2. No build tools, servers, or dependencies required.

## Controls

| Action | Input |
|---|---|
| Select a defender | Click a card in the top toolbar |
| Place a defender | Click an empty grid cell |
| Sell a defender | Right-click a placed defender (50% refund) |
| Pause / Resume | Click the Pause button or press `Escape` |
| Toggle sound | Click the sound button in the HUD |

## Game Mechanics

- **Stardust** is the resource used to buy defenders. It is earned passively,
  from Star Bloom generators, and from killing enemies.
- **Waves** increase in difficulty. Every 5th wave includes a boss. Survive all
  15 waves to win.
- **Difficulty** can be set on the start menu (Easy / Normal / Hard), adjusting
  enemy HP, speed, spawn rate, and starting resources.

## Defender Types

| Defender | Cost | Role |
|---|---|---|
| Photon Sprout | 50 | Basic single-target shooter |
| Nebula Nut | 50 | High-HP wall that blocks enemies |
| Plasma Pea | 100 | Rapid-fire lower-damage shooter |
| Solar Flare | 175 | Area-of-effect explosive attacker |
| Cosmic Vine | 75 | Slows enemies with frost spores |
| Star Bloom | 50 | Generates Stardust pickups over time |

## Enemy Types

| Enemy | Traits |
|---|---|
| Drone | Standard alien, balanced stats |
| Runner | Fast movement, low HP |
| Brute | Slow, high HP, heavy damage |
| Shielder | Has a shield that absorbs damage before HP |
| Overlord (Boss) | Very high HP and damage, appears every 5 waves |

## Code Structure

```
index.html    — Page structure: start menu, game screen, overlays
styles.css    — All styling, 2.5D perspective transforms, animations
game.js       — Complete game logic, organized into labeled sections:
  1. Constants & Configuration
  2. Audio (WebAudio beeps)
  3. Game State
  4. Defender Definitions
  5. Enemy Definitions
  6. Wave Definitions
  7. DOM Helpers
  8. Board Rendering
  9. Defender Toolbar
 10. Placement & Selling
 11. Projectile System
 12. Enemy Spawning & Movement
 13. Combat & Collisions
 14. Defender Attacks
 15. Resource System (Stardust pickups)
 16. Wave Manager
 17. HUD Update
 18. Game Over
 19. Game Loop
 20. Game Start / Restart / Menu
 21. UI Event Wiring
 22. Initialization
```

All game logic lives in a single `game.js` file with clearly commented sections.
No external libraries or assets are used — audio is synthesized with the
WebAudio API and visuals use CSS shapes and emoji placeholders.
