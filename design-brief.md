# Kestrel: design brief

**Design read:** For engineers and finance leads who live in a spend ledger all day; the register is calm, exact, and fast, like a precision instrument that never makes you wait.

**Concept spine:** "Chaos into a ledger." Every surface shows loose spend becoming ordered rows: the film sorts floating receipts into columns, the console sorts 50,000 transactions in a frame, the design system is the ruler both are drawn with.

**Delivery tier:** cinema (Lenis smooth scroll on the landing route, scroll-scrub film as the Tier-1 hero, mount-fired headline builds).

**Locked palette:** paper `#F2F4F3`, paper-2 `#E8EBEA`, ink `#14181A`, ink-2 `#4A5257`, ink-3 `#7C858A`, line `#D5DADA`, accent cobalt `#2B45D4` (sole accent, 66% saturation), functional over-budget red `#B4362F` used only for budget breach state. Defense: a cool, paper-like ground reads as a printed ledger; cobalt is the color of a signed check and the card in the film. Avoids every banned family (light ground, no orange, no neon, no purple, no beige/brass).

**Locked type:** Geist (display + UI) and Geist Mono (all money, dates, ids, tabular numbers). No serif.

Animation mode: animated-website

**Journey shape:** single-shot. One subject (a card in a cloud of receipts) seen as it resolves into order; no second world is needed.

**Journey (chapters over the one film):**
1. *Every swipe leaves paper.* Focal: chaotic receipt cloud around the card. Body: spend arrives as a mess of slips, merchants and memos. Tags: none.
2. *Read 50,000 rows like one.* Focal: receipts beginning to straighten. Body: a virtualized ledger that filters and sorts off the main thread. Tags: Web Worker, 60fps scroll.
3. *Fix a hundred lines at once.* Focal: slips snapping into columns. Body: bulk recategorize with undo, saved as an event log. Tags: optimistic, undo.
4. *Spend, squared away.* Focal: the final bar-chart stacks with the card as baseline. Body: budgets, burn-down and receipts, reconciled. CTA: Open the console.

**World grammar:** pale cool-gray seamless studio, soft diffuse overhead key, cobalt card as the only saturated object, blank white receipts, slow push-in with a 30 degree orbit right, locked exposure, no text.

**Mobile framing:** subject kept in the center 50% of the frame; mobile encode capped at 720p with center object position; chapter copy stacks above the subject band.

**Delivery budget:** desktop clip at most 32 MiB, mobile at most 16 MiB.

**Section plan (landing `/`):**
1. Journey (scroll-scrub, 4 chapters), family: full-bleed film.
2. Console preview: split, left copy + right real screenshot of the live console (family: asymmetric split).
3. Engineering ledger: a measured spec table of how it is built (family: data table / spec strip).
4. Design system teaser: token swatches and component specimens in a bento (family: bento, 4 cells, 2 with visual variation).
5. Footer: wordmark, links (family: minimal footer).

**Other routes:** `/console` (the product), `/system` (design system docs, "Talon").

**Asset plan:** single-shot film (Kling 3.0 pro, start + end frame), its encoded posters, Kestrel wing mark (generated, redrawn as inline SVG), favicon set from the mark, console reference board, OG/cover image. Icons: Phosphor (dense functional UI fallback, documented).

**CTA inventory:**
- "Open the console" (journey ch.4 + hero nav): solid cobalt slab whose right edge is cut at 45 degrees like the wing mark; on hover the cut slides open to reveal an arrow.
- "Read the system" (design system teaser): underlined text link whose underline is a 3-bar ledger rule that extends on hover.
- "Try ⌘K" (console preview): a keycap-styled button that depresses 2px on press and shows the shortcut.
- Nav "Console" / "System": plain text links with a cobalt tick on the active route.

**Anti-convergence:** first build in this chat; no prior ledger.
