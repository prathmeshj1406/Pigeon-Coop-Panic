# 🐦 Pigeon Coop Panic

A cartoon pigeon-shelter puzzle game powered by the **Pigeonhole Principle** (Discrete Mathematics ISE-2 project).

## Discrete Mathematics concept
**Pigeonhole Principle:** if `n` pigeons are placed into `k` holes, at least one hole contains at least `⌈n/k⌉` pigeons.
Example: 17 pigeons, 4 coops → ⌈17/4⌉ = 5, so some coop holds 5 or more.

## How the principle is used
- `math.js` computes `⌈n/k⌉` dynamically and builds the step-by-step **Show Why** proof (including proof by contradiction).
- `levels.js` uses it to size coop capacity: the pigeons that share the ordinary coops (all except VIPs and angry ones) need capacity of at least `⌈x / m⌉`, plus a few spare spots. Coop Overlord (level 5) has zero spare spots.
- Objective panel, Math Hint power-up, quizzes (Minimum Guarantee, Find the Mistake, Speed Round: required 3-question quiz after boss levels 5/10/15/20, one optional practice question after other levels) and the **Math Lab** all reuse the same engine.

## Features
- Main menu, 20 procedurally generated levels, boss every 5th level (Coop Overlord: no spare spots, The Falcon: timed coop closures, Pigeon King: extra impatient VIPs, Final Panic: falcon + impatient VIPs)
- 5 pigeon types: Normal, Social, Angry, VIP (golden coop is VIP-only), Twins; click a placed pigeon to send it back
- Panic, score, combo, 3 power-ups, random events (Rush, Coop Closed, Food Drop, Chaos)
- Show Why explanation, interactive Math Lab, stars + progress saved in `localStorage`

## Run locally
Open `index.html` in a browser. No build step, no server.

## Deploy on GitHub Pages
1. Create a GitHub repository and upload all files (`index.html` at the root).
2. Go to **Settings → Pages**.
3. Source: *Deploy from a branch*, branch `main`, folder `/ (root)`, then Save.
4. Open `https://<username>.github.io/<repo-name>/` after a minute.

## Team
| No. | Name | PRN | Domain |
|---|---|---|---|
| 1 | Anish Somani | 256109053 | Interface and visual design |
| 2 | Arjun Kedare | 256109065 | Pigeonhole Principle and Math Lab |
| 3 | Prathmesh Jadhav | 246109010 | Level generation and difficulty |
| 4 | Akash Gite | 256109084 | Gameplay, scoring and power-ups |
| 5 | Atharv Mane | 256109086 | Quiz, results and saved progress |

SY B.Tech IT B, Walchand College of Engineering, Sangli.

## Technologies
HTML5, CSS3 (animations), vanilla JavaScript, inline SVG, localStorage.
