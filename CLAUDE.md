# Happy Belly — Project Onboarding for Claude

## What This App Is
A family meal planning app. It uses AI to generate weekly meal plans tailored to each family member's nutritional needs, manages a grocery list, stores recipes, and tracks family profiles (including baby feeding stages). Built for daily use by a real family.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API (`claude-haiku-4-5`) |
| Icons | Lucide React (imported via ESM path: `lucide-react/dist/esm/icons/[name]`) |
| Fonts | Google Fonts — Montserrat (300, 400, 500, 600, 700) |
| Styling | Inline styles + custom CSS classes in `globals.css` (Tailwind is installed but rarely used) |

**Important:** Lucide React must always be imported via ESM path, e.g.:
```js
import Home from 'lucide-react/dist/esm/icons/home';
```
Never use `import { Home } from 'lucide-react'` — it breaks the build.

---

## Design System

### Background
```css
background: linear-gradient(135deg, #F9D7B5 0%, #EEBD94 40%, #E2A06F 100%);
background-attachment: fixed;
```
Plus two ambient blobs defined in `globals.css` via `body::before` (top-left soft teal) and `body::after` (bottom-right teal-blue).

### Color Palette
| Purpose | Value |
|---|---|
| Active / accent (amber) | `#D5824A` |
| Inactive nav icons | `rgba(80,50,20,0.6)` |
| Body text | `rgba(80,45,10,0.88)` |
| Muted text | `rgba(80,45,10,0.5)` |
| Label text (small caps) | `rgba(80,45,10,0.4)` |
| Sidebar / nav glass bg | `rgba(90,160,180,0.18)` |
| Grocery panel glass bg | `rgba(90,160,180,0.14)` |
| Glass card bg | `rgba(255,255,255,0.22)` |
| Glass card border | `rgba(255,255,255,0.42)` |
| Placeholder text | `rgba(80,45,10,0.35)` |

### Glassmorphism Card (`.glass-card`)
```css
background: rgba(255,255,255,0.22);
backdrop-filter: blur(18px);
-webkit-backdrop-filter: blur(18px);
border: 1px solid rgba(255,255,255,0.42);
border-radius: 20px;
box-shadow: 0 4px 24px rgba(180,120,60,0.10);
```

### Typography
- Font: `Montserrat, sans-serif` everywhere
- Section labels: `fontSize: 9-10px`, `fontWeight: 700`, `letterSpacing: '0.1em'`, `textTransform: 'uppercase'`, `color: rgba(80,45,10,0.4)`
- Body: `fontSize: 13-14px`, `fontWeight: 400-500`
- Headings: `fontSize: 22-24px`, `fontWeight: 800`

### Active / Inactive Nav Pattern (used in both Sidebar and BottomNav)
- Active: `color: '#D5824A'`, `strokeWidth: 2.2`, amber background highlight
- Inactive: `color: 'rgba(80,50,20,0.6)'`, `strokeWidth: 1.8`
- Active indicator: small `#D5824A` bar (left side on Sidebar, top on BottomNav)

---

## Responsive Layout Architecture

**Breakpoint:** 1024px (desktop vs mobile)

### How it works
- `layout.js` renders `{children}` exactly **once** inside `<DesktopLayout>`. There is no separate mobile render of children — this was a previous bug that caused mobile/desktop to diverge.
- `DesktopLayout.js` uses a `useState` + `useEffect` JS check (`window.innerWidth >= 1024`) to conditionally mount `<Sidebar>` and `<GroceryPanel>`. They simply don't exist in the DOM on mobile.
- `<BottomNav>` lives in a `.mobile-layout` wrapper in `layout.js`, hidden on desktop via CSS (`display: none` at 1024px+).

### CSS Classes (in `globals.css`)
```css
.sidebar-desktop   /* display: none mobile, display: flex desktop */
.grocery-panel-desktop  /* display: none mobile, display: flex desktop */
.mobile-layout     /* display: block mobile, display: none desktop */
.page-content      /* min-height: 100vh; desktop gets margin-left: 72px + padding */
.page-content--meals   /* adds margin-right: 300px on desktop (for grocery panel) */
.glass-card        /* glassmorphism utility */
.modal-sheet       /* full-screen modal, respects sidebar on desktop */
```

**Critical:** `Sidebar.js` and `GroceryPanel.js` do NOT have `display` in their inline styles — display is controlled entirely by the CSS class. If you ever add `display: flex` to their inline styles, it will override the CSS class and break mobile hiding.

---

## File Structure

```
app/
├── layout.js                    # Root layout — DesktopLayout + BottomNav
├── globals.css                  # All CSS classes + ambient background
├── page.js                      # Meals screen (main page)
├── recipes/page.js              # Recipes screen
├── profiles/page.js             # Family profiles screen
├── grocery/page.js              # Mobile grocery screen
├── components/
│   ├── DesktopLayout.js         # Responsive shell (JS-based breakpoint)
│   ├── Sidebar.js               # Desktop left nav (72px wide, fixed)
│   ├── GroceryPanel.js          # Desktop right grocery panel (300px wide, fixed)
│   ├── BottomNav.js             # Mobile bottom navigation (fixed)
│   └── ProfileModal.js          # First-time family profile setup modal
└── api/
    ├── generate/route.js        # Meal plan generation, swap, grocery list (Claude AI)
    ├── analyze-nutrition/route.js
    ├── baby-prep/route.js       # Baby meal prep instructions
    ├── extract-recipe-from-photos/route.js
    ├── fetch-recipes/route.js   # URL recipe import
    └── profile-chat/route.js

lib/
└── supabase.js                  # Supabase client singleton
```

---

## Supabase Database Schema

### `meal_plans` (single row, id=1)
| Column | Type | Notes |
|---|---|---|
| id | int | Always 1 — app uses a single plan record |
| plan_text | text | Full weekly meal plan (markdown-ish format) |
| grocery_items | jsonb | Array of `{ id, text, category, checked }` |

### `recipes`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | |
| ingredients | text | |
| instructions | text | |
| protein_source | text | |
| prep_time | text | |
| nutrition | jsonb | |
| tags | text[] | |
| notes | text | |
| image_url | text | |
| batch_friendly | bool | |
| baby_adaptable | bool | |
| one_pan | bool | |
| use_count | int | Incremented when included in a meal plan |

### `family_members`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| name | text | |
| role | text | `'baby'` triggers special handling |
| date_of_birth | date | Used to auto-calculate baby feeding stage |
| height | text | |
| weight | text | |
| activity_level | text | |
| goals | text | |
| supplements | text | |
| notes | text | |

### `meal_feedback`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| meal_name | text | |
| rating | text | `'liked'` or `'disliked'` |
| feedback_notes | text | Tags + optional note. "Taking a break" = skip temporarily |

---

## AI Integration (Claude API)

All AI calls go through `/api/generate/route.js`. The `type` parameter controls behavior:

| type | What it does |
|---|---|
| `meal-plan` | Generates full 7-day plan using family profiles + feedback + saved recipes |
| `swap-meal` | Replaces one specific meal with an alternative |
| `grocery-list` | Parses meal plan → structured JSON grocery list by category |

- Model: `claude-haiku-4-5-20251001`
- Family profiles are built dynamically from `family_members` table
- Baby feeding stage is auto-calculated from `date_of_birth`
- Meal feedback (liked/disliked/"on a break") is injected into every prompt
- Saved recipes are listed in meal-plan prompts to encourage reuse

---

## Features Built

### Meals Screen (`page.js`)
- Weekly meal plan display, parsed by day
- Day navigator with left/right arrows + swipe gestures on mobile
- Pull-to-refresh (mobile)
- "This Week's Context" textarea — auto-expands, feeds into AI prompt
- Generate Meal Plan button
- Per-meal: thumbs up / thumbs down / swap (shuffle) buttons
- Thumbs down opens a feedback modal with tags + optional note
- Baby 🍼 prep button on applicable meals — fetches AI baby prep instructions
- First-time profile setup modal if no family members exist

### Recipes Screen (`recipes/page.js`)
- Browse saved recipes with filter pills (All, Batch Friendly, Baby Adaptable, One Pan)
- Search / filter by tag
- Recipe detail view with ingredients, instructions, nutrition, notes
- Import recipe from URL
- Import recipe from photo (AI extraction)
- Manual recipe entry
- Favorite / unfavorite

### Profiles Screen (`profiles/page.js`)
- View and edit family member profiles
- Add new members
- Baby profile shows feeding stage based on age
- AI profile chat (conversational profile builder)

### Grocery Screen (`grocery/page.js`)
- Mobile-focused grocery list
- Check off items
- Organized by category

### Desktop Grocery Panel (`GroceryPanel.js`)
- Same data as grocery screen, shown on desktop as a fixed right panel
- Category grouping with completed section
- Progress bar (% checked)
- Refresh button

---

## Known Quirks & Decisions

1. **Single meal plan record:** The app always reads/writes `meal_plans` where `id = 1`. There's no multi-week or multi-plan support yet.

2. **No `display` in Sidebar/GroceryPanel inline styles:** The `display` property must stay out of their inline styles or mobile hiding breaks (CSS class `display: none` loses to inline style specificity).

3. **DesktopLayout JS breakpoint:** Uses `window.innerWidth >= 1024` in `useEffect`. This means on initial SSR render, `isDesktop = false`, so there's a brief flash on desktop before sidebar appears. Acceptable tradeoff.

4. **Lucide ESM imports:** Must use `lucide-react/dist/esm/icons/[name]` path. The barrel import breaks with `transpilePackages`.

5. **Grocery items format:** Stored as JSON array in `meal_plans.grocery_items`. Each item: `{ id: string, text: string, category: string, checked: boolean }`.

6. **Baby profile detection:** Any `family_members` row with `role = 'baby'` triggers baby-specific UI (prep buttons on meals, feeding stage display in profiles).

7. **Feedback "Taking a break":** If `feedback_notes` includes the string `"Taking a break"`, the meal is treated as "skip for a few weeks" rather than "disliked forever" in AI prompts.

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

---

## Current State (as of last session)

- ✅ Full responsive layout working (desktop sidebar + grocery panel, mobile bottom nav)
- ✅ Warm amber/brown color scheme applied across all pages
- ✅ Glassmorphism design system consistent across desktop and mobile
- ✅ Meal plan generation, swapping, feedback loop
- ✅ Grocery list with categories, check/uncheck, progress bar (desktop panel + mobile page)
- ✅ Recipe management (manual entry, URL import, photo import)
- ✅ Family profiles with baby stage auto-detection
- ✅ Pull-to-refresh, swipe navigation on mobile
- ⚠️ There is a temporary red "✅ UPDATED" test banner in `layout.js` — **remove it** before next commit
