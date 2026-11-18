# KidyCode V4 — colour system

Four learner palettes and one separate admin system. Every pair quoted here was measured, not estimated:
`node docs/v4/palette-contrast.mjs` prints each pair with its WCAG ratio and must report **56 of 56 passing**.
Rendered reference: `docs/v4/concepts/colour-system.html` → `docs/v4/concepts/colour-system.png`.

## Rules that apply to all four

1. **Ground is white or cool.** Pure `#FFFFFF`, icy blue, pale cool purple, cool grey-blue. No warm neutral appears
   anywhere, at any opacity, in any state (hover, focus, disabled, empty, error).
2. **Bright accents are fills, never small text.** `#FF7A1A` is 2.61:1 on white — correct for a bar, a chip or a star,
   wrong for a 14px label. Text on an accent fill uses dark ink and clears 4.5:1 (e.g. `#131A2E` on `#FFB020` = 11.1:1).
3. **Every hue that must carry text has a darkened variant** in the palette (`#B3490A`, `#C41F42`, `#0B6FA8`,
   `#0369A1`, `#8A5A00`), and those clear 4.5:1 on their own grounds.
4. **No green.** Not as a brand colour, not as a success colour, not in syntax highlighting, not in charts.
   Success and confirmation states use the group's brand hue or gold.
5. **Focus rings are visible at 3:1 minimum** against both the control and the surface behind it, with a 3px width and
   3px offset — matching the existing admin console's ring treatment so keyboard behaviour stays consistent.

## Token sets

### A · Ages 10–12 — Playful Discovery

| Token | Hex | Role | Measured |
| --- | --- | --- | --- |
| `--canvas` | `#FFFFFF` | page ground | — |
| `--surface` | `#EFF6FF` | icy blue cards | ink 15.88:1 |
| `--surface2` | `#F5F3FF` | pale lilac, badges | ink 15.76:1 |
| `--ink` | `#131A2E` | text | 17.29:1 on white |
| `--ink-soft` | `#4A5578` | secondary text | 7.34:1 on white |
| `--brand` | `#2563EB` | primary action | white label 5.17:1 |
| `--brand-deep` | `#1B49B8` | links on surfaces | 8.7:1 on `#EFF6FF` |
| `--orange` / `--orange-ink` | `#FF7A1A` / `#B3490A` | energy fill / accent text | fill 2.61:1 · text 4.9:1 |
| `--pink` / `--pink-ink` | `#FF4D8D` / `#C21F5E` | friendly fill / accent text | fill 3.14:1 · text 5.0:1 |
| `--violet` / `--violet-ink` | `#7C5CFF` / `#5A36D6` | curious fill / accent text | fill 4.35:1 · text 6.0:1 |
| `--gold` / `--gold-ink` | `#FFB020` / `#8A5A00` | star fill / accent text | ink on gold 11.1:1 · text 6.1:1 |
| `--line` | `#DCE6F7` | borders on the cool ground | — |

### B · Ages 13–15 — Creative Exploration

| Token | Hex | Role | Measured |
| --- | --- | --- | --- |
| `--canvas` | `#FFFFFF` | page ground | — |
| `--surface` | `#F4F2FF` | pale violet panels | ink 16.50:1 |
| `--surface2` | `#EEF3FF` | pale blue chips | ink 16.42:1 |
| `--ink` | `#14122B` | text | 18.24:1 on white |
| `--ink-soft` | `#4C4A6E` | secondary text | 8.36:1 |
| `--brand` | `#5B45F0` | primary action | white label 5.91:1 |
| `--brand-deep` | `#3F2CC4` | links on surfaces | 8.9:1 on `#F4F2FF` |
| `--azure` / `--azure-ink` | `#00A3FF` / `#0B6FA8` | fill / text | fill 2.73:1 · text 4.9:1 |
| `--rose` / `--rose-ink` | `#FF4D6D` / `#C41F42` | fill / text | fill 3.21:1 · text 5.2:1 |
| `--amber` / `--amber-ink` | `#FFB020` / `#8A5A00` | fill / text | ink on amber 11.1:1 · text 6.1:1 |
| `--line` | `#E2DFF7` | hairline | — |

### C · Ages 16–18 — Developer Studio (dark)

| Token | Hex | Role | Measured |
| --- | --- | --- | --- |
| `--canvas` | `#0A0F1E` | midnight ground | — |
| `--surface` | `#111A31` | panels | ink 14.88:1 |
| `--surface2` | `#18233F` | raised panels | ink 13.39:1 |
| `--ink` | `#E9EEFB` | text | 16.44:1 on canvas |
| `--ink-soft` | `#9AA8C7` | muted text | 8.00:1 on canvas |
| `--blue` | `#5B8DFF` | primary | dark label 6.09:1 |
| `--violet` | `#A66BFF` | secondary, keywords | 5.61:1 |
| `--gold` | `#FFC24B` | accent, strings | 11.88:1 |
| `--pink` | `#FF6B9A` | error, numbers | 7.11:1 |
| `--line` | `#26314F` | borders | — |

Syntax highlighting uses violet keywords, gold strings, blue tags, pink errors and a muted comment grey — **no green**,
which is the one place a developer-theme palette would normally reach for it.

### D · Adults — Professional Learning

| Token | Hex | Role | Measured |
| --- | --- | --- | --- |
| `--canvas` | `#FFFFFF` | page ground | — |
| `--surface` | `#F4F7FB` | cool grey-blue | ink 16.72:1 |
| `--surface2` | `#EEF3F9` | cool light blue chips | ink 16.10:1 |
| `--ink` | `#0E1726` | text | 17.96:1 on white |
| `--ink-soft` | `#46566E` | secondary text | 7.46:1 |
| `--brand` | `#1B4FBF` | primary action | white label 7.20:1 |
| `--brand-deep` | `#153F9B` | links on surfaces | 8.82:1 |
| `--sky` / `--sky-ink` | `#0EA5E9` / `#0369A1` | fill / text | fill 2.77:1 · text 5.93:1 |
| `--line` | `#D8E2EE` | hairline | — |

## Admin dashboard — separate system, gold refinement only

The admin console keeps midnight navy, sky blue and white exactly as approved, and its structure, sidebar, routes,
gates and data behaviour are untouched. The only proposal is to stop using one flat mustard for every gold role.

| Token | Hex | Role | Measured |
| --- | --- | --- | --- |
| `--adm-navy` (unchanged) | `#0F2D52` | chrome | white 13.84:1 |
| `--adm-navy-deep` | `#0B1B33` | chrome gradient end | white 17.23:1 |
| `--adm-blue` (unchanged) | `#1E5AA8` | links on light | 6.81:1 |
| `--adm-gold` (unchanged) | `#D4A63A` | gold text on navy | 6.14:1 |
| `--adm-gold-ink` (unchanged) | `#805A0C` | gold text on light | 6.20:1 |
| gradient highlights | `#FFF3C9` → `#F3CE6A` → `#C9902A` | the luminous ramp | navy label on `#F6D06B` 8.6:1 |
| ramp light-end | `#FFF7DC`, `#FFE9A8`, `#F6D06B`, `#E8B93F` | metallic steps | — |

Rule: the gradient is a **surface, never text**. Navy text sits on the gold button (6.14:1); gold text on a light ground
uses `#805A0C` (6.20:1). No gold decoration beyond the top-bar rule, primary actions, and the single most important
figure on a screen.

Rendered comparison (current flat gold vs the ramp, applied to the existing chrome): `colour-system.png`, lower panel.

## Verification

```bash
node docs/v4/palette-contrast.mjs     # prints every pair and ratio; expects 0 failing of 56
```

The admin panel's contrast test (`tests/admin/palette.test.mjs`) already guards the admin tokens against regression to
rejected colours; if the gold ramp is adopted, that test is the place to extend, not replace.
