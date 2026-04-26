# Quick sanity check vs. hu.wikipedia.org/wiki/Malom_(játék)

Date checked: 2026-04-26

## Verdict

The implementation is **mostly conformant** to the Hungarian Wikipedia description of classical nine men's morris, with a few defaults that are more “modern/house-rule” than strict classical wording.

## Matches

- **9–9 pieces** and two-player setup are implemented.
- **Three phases** are implemented: placement, adjacent movement, and flying (jumping) when reduced to three pieces.
- **Mill capture rule** is implemented, including the standard restriction that pieces in a mill are protected unless all opponent pieces are in mills.
- **Blocked player loses** condition is implemented in movement phase.
- **Csiki-csuki (re-forming a broken mill) is legal by default**, matching the article's description.

## Differences / caveats

- **Double-mill capture (2 captures) is OFF by default** in this project, while the article presents it as a special-case rule. It is available as a house rule toggle.
- **Automatic draw after 13 move-pairs without capture is ON by default** in this project, but this is not part of the base rule summary in the article.
- **Win-on-2-pieces check is deferred until after placement is complete** (the code checks `<3` only once both players placed all pieces). Some rule descriptions treat “reduced to 2” as immediate loss.
- The project presents the human as **X (dark ink)** and X starts; the article says “the light side starts”. This is largely representational, but worth noting if strict traditional presentation is desired.

## Suggested “Wikipedia-classic” defaults

If the goal is to match the Hungarian Wikipedia article as closely as possible out-of-the-box:

1. Set `double_mill_double_capture: true`.
2. Set `draw_after_13_pairs: false`.
3. Optionally add a “classic starts: light” presentation mode.
4. Decide whether “drop to 2 pieces” should end the game immediately even during placement.
