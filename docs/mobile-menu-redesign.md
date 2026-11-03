# Landscape mobile menus and shop

The shop now uses a fixed landscape board rather than stacking desktop sections into a long page. Its header keeps credits, inspect, reset, exit, and next round visible. The weapon strip shares space with a selected-gun starting action and grenade/streak selectors. The board keeps the fitted build on the left, all six attachment offers in the center, and weapons/perks/equipment on the right.

At 844 × 390, all six attachment offers and the fitted selectors fit without scrolling the page. Other purchase categories are visible alongside them. At 667 × 375 and 568 × 320, bounded local panes provide the necessary overflow while the header, weapon strip, credits, and next-round control remain fixed. Purchases, pins, comparisons, and refits preserve pane scroll positions, so buying a lower offer does not send the player back to the top.

The compact mode retains full prices, tradeoffs, ownership, affordability, the three-part replacement rule, free sights, and actual shared shop transactions. Supply descriptions use concise exact effects; accessible names retain the full descriptions and prices. A single starting-gun action replaces repeated small adjacent stars. The selected gun's reset action moves into the fixed header. A comparison stays on the same board, labels the fitted-stat panel COMPARING, and outlines the previewed part; it cannot spend credits or change the actual build. The three-part replacement choice uses a short row of options rather than another long vertical menu.

Arsenal and practice workbench use all six weapon choices in one strip, five attachment categories across the available width, and a three-column option grid. The fitted configuration and stats remain alongside the options. Native selectors show complete owned-option names when opened. Very short phone layouts place the five fitted selectors into two rows. These views retain the existing catalog/practice save isolation.

Other mobile screens now use the landscape more efficiently:

- Controls settings use three columns on wider phones, with the main controls visible together; narrower phones use two columns.
- Slider hit areas are taller, with the visible track remaining thin.
- Pause/guide spacing is reduced while keeping primary controls large.
- Weapon selection uses three columns instead of a tall two-column list.
- Results place round/placement information beside the complete standings, with next/menu actions fixed along the bottom.

The existing typography, paper/ink palette, industrial rules, safe-area handling, and pointer/touch ownership remain. No new framework, remote dependency, pagination system, or backend is introduced.

Validation: native browser checks at 844 × 390, 667 × 375, and 568 × 320 verified page bounds, fixed controls, live comparison, actual purchases, saved Continue restoration, and preservation of a scrolled lower-offer position after buying. Native settings and a full match-to-results flow were visually checked. `tests/mobile-menus.mjs` covers board routing, category/control counts, a unique reset action, actual transactions, and catalog run isolation; existing shop/loadout/mobile tests and the full suite passed.
