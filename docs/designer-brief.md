---
tags: [project, design]
type: designer-brief
status: superseded-by-handoff
date: 2026-04-23
---

# Velvet Note — Designer Engagement Brief

Historical first-person prompt for a professional UI/UX designer. The resulting handoff is now checked in under `docs/design-handoff/velvet-note/`; use that handoff for implementation decisions.

---

Hi — I'm building a mobile app called **Velvet Note** (working name "Fragrance App" in code). It's a personal fragrance collection tracker for iOS + Android, Expo / React Native on the front, Supabase behind it. I'm shipping in phases and I want to get the visual language right before I keep building. I need your help.

**What the app does.** I own a fragrance collection and remember nothing. The app is a searchable catalog of the bottles I actually own — brand, name, concentration (EDT / EDP / Parfum / Cologne / Other), a freeform list of accords, a 0–10 rating, and a wear calendar. Current screens: sign-in, collection list, calendar, add form, detail (with edit, delete, and log today). Eventually barcode scanning and a shared fragrance DB. I'm not trying to compete with Fragrantica or Parfumo — those are review communities with spreadsheet aesthetics. This is a private companion that lives on one person's phone.

**The feel I want.** Collector's companion, not data entry form. Think the composure of an Aesop or Le Labo store. Think the editorial restraint of Nilufar Depot's product pages. Think the way a good cocktail menu treats typography. Every bottle in my collection has a story, and the app should respect that. It's dark-first — deep neutrals with bone-colored text — and uses a single accent color: a muted oxblood. Exactly one. I don't want a rainbow. The app should feel like something a person would willingly pay for, not a freemium utility.

**What to avoid.** Fragrantica-style dense UI. Material Design elevation for its own sake. Gratuitous gradients. "Luxury" clichés like gold on black or fake leather textures. Brand logos anywhere in the UI — brands are typeset, never imaged. Second accent colors. More than one icon family. Loud empty states. Playful illustration — this is premium, not charming.

**What's already locked — don't redesign these without a reason.** The Phase 1/1.5 app is built and running, and the design tokens are live in code. Working palette, in hex: background `#0F0E0D`, surface `#1A1917`, raised surface `#252320`, border `#2F2C28`, bone text `#EDE6DA`, dim text `#B5AD9E`, muted text `#7F7869`, accent `#8B3A3A`, accent muted `#5E2828`, error `#C4594F`. Type stack is Georgia for display / titles (weight 400, letter-spacing 0.2), system sans for body, 12pt uppercase captions with letter-spacing 0.5. Spacing scale is 4 / 8 / 16 / 24 / 32 / 48. Radius is 4 / 8 / 16. Navigation is a three-tab shell (Collection, Calendar, Add) with the detail screen stack-pushed on top. If you want to break any of this, make the case in writing.

**What I need you to resolve.**

1. **Bottle imagery** — there's no image field yet, but there will be. Show me what the list row and detail screen look like with images, and what they look like without, so I can decide whether to prioritize adding the field.
2. **Note hierarchy** — fragrances have top / heart / base notes. Right now I'm collapsing them into a single chip array. Explore a structured visualization that I can grow into in Phase 2.
3. **Accord chips** — currently plain text. Families (woody, fresh, oriental, floral) would add meaning; a curated vocabulary would add polish. Pick a direction.
4. **Rating visualization** — today it's just the numeral. Make it feel like the most satisfying element on the detail screen.
5. **The wear calendar screen** — resolved by the handoff: Month grid root, selected-day detail sheet, and By bottle segmented view.
6. **One signature motion** — a single transition or micro-interaction that sets the tone. Don't layer five. Pick one.
7. **Icon family** — one family, not three. I'll follow your recommendation.

**Original scope for the first deliverable.** A Figma file with four frame groups:

- **Phase 1 current screens** at full fidelity — sign-in, collection list in three states (empty / populated / searching), add form, detail in both read and edit modes.
- **Phase 1.5 calendar screen** with one good month-view exploration plus a day-detail state.
- **Detail v2 with hero imagery** so I can evaluate the upgrade.
- **Tokens / type specimen page.**

Don't design barcode flow, settings, paywall, or shared catalog — all Phase 2+ and out of scope.

**Constraints.** Design at iPhone 15 Pro width (393pt). Dark only for now — a light theme is a Phase 4 conversation. Body text against background should hit 4.5:1 contrast minimum. No custom fonts for Phase 1 — if a mockup demands Canela or GT Sectra or Tiempos, call it out as a future upgrade, not a present dependency.

**What I want back.** Working Figma file, organized frames, named layers. A short note explaining the choices where you made judgment calls (calendar format, accord treatment, rating viz, motion pick, icon family). Flag anything you think I have wrong in the tokens.

**Budget and timeline:** [fill in].

Happy to iterate, but I'd rather see one confident direction than three half-explored ones in the first pass.
