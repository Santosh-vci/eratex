---
name: Industrial Logic
colors:
  surface: '#fbf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fbf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f4'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45474c'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#1e1200'
  on-tertiary: '#ffffff'
  tertiary-container: '#35260c'
  on-tertiary-container: '#a38c6a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#fadfb8'
  tertiary-fixed-dim: '#ddc39d'
  on-tertiary-fixed: '#271902'
  on-tertiary-fixed-variant: '#564427'
  background: '#fbf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e3'
  risk-on-track: '#10B981'
  risk-watch: '#F59E0B'
  risk-action: '#EF4444'
  risk-critical: '#111827'
  grid-border: '#E2E8F0'
  surface-muted: '#F8FAFC'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  data-tabular:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-row-height: 32px
  drawer-width: 400px
  nav-collapsed-width: 64px
  nav-expanded-width: 240px
  gutter: 12px
  margin-sm: 8px
  margin-md: 16px
---

## Brand & Style

The design system is an "Operations Control Cockpit" for high-stakes industrial manufacturing. It is technical, disciplined, and authoritative, designed to enforce operational rigor through a "Gate-Driven" workflow. The brand personality is one of extreme accountability—prioritizing the visibility of bottlenecks, exceptions, and "at-risk" metrics over decorative aesthetics.

The visual style is **Corporate / Modern** with a lean toward **High-Density Functionalism**. It utilizes a "Compact" philosophy to maximize data visibility on a single screen, ensuring that production planners can monitor complex order lifecycles without excessive scrolling. The aesthetic is "exception-first," using high-contrast semantic signals to break through a neutral, professional environment.

## Colors

This design system uses a restricted professional palette of "Slate" grays and "Navy" blues to provide a calm, neutral backdrop for critical data. 

The **Risk Badge System** is the primary driver of user attention. These semantic colors are reserved exclusively for status and urgency indicators:
- **Green (#10B981):** On track / Passed checklist.
- **Yellow (#F59E0B):** Moderate risk / Conditional readiness.
- **Red (#EF4444):** Blocked / Overloaded / Action required.
- **Black (#111827):** Critical miss / Management intervention required.

Neutral tones facilitate high-density reading; use `#F8FAFC` for alternating row stripes and `#E2E8F0` for thin, 1px borders in data grids.

## Typography

Typography is optimized for legibility at small scales (12px–14px). **Inter** is the primary workhorse, selected for its tall x-height and clarity in data-heavy environments. **JetBrains Mono** is used selectively for technical strings, such as Order IDs, PO numbers, and "Last Updated" timestamps, to ensure character distinction.

- **Data Tables:** Use `data-tabular` (12px) for the majority of grid content to maximize vertical density.
- **Status Badges:** Use `label-caps` for high-visibility state indicators.
- **Headers:** Keep page headers compact (`headline-lg`) to preserve vertical workspace.

## Layout & Spacing

The layout utilizes a **Fixed Grid** logic for structural elements and a **Dense Fluid** logic for data tables. 

### Core Layout Modules
- **Global Header:** Fixed at the top, containing Global Search and the Critical Alert icon.
- **Collapsible Navigation:** A left-hand rail that defaults to a collapsed state (64px) to maximize the horizontal "Main Work Area."
- **Action Drawer:** A right-aligned, 400px surface that slides over the main content. This is the primary container for "Detail" views, checklists, and impact previews, allowing the user to maintain context of the main list.
- **Data Grids:** Rows are locked at 32px height. Sticky headers and sticky first columns (Order ID/Style) are mandatory for multi-axial scrolling.

### Breakpoints
- **Desktop (1440px+):** Full workbench view with open Right Drawer.
- **Tablet (1024px):** Drawer becomes a full-screen overlay; Grid columns collapse into "Essential" views.

## Elevation & Depth

This system avoids heavy shadows to prevent visual clutter in high-density views. Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Base):** The main workbench background (`#F8FAFC`).
- **Level 1 (Surface):** White cards and grid rows.
- **Level 2 (Interaction):** The Right Action Drawer uses a soft, neutral shadow (8px blur, 4% opacity) and a 1px border (`#E2E8F0`) to distinguish itself from the grid below.
- **Sticky States:** Sticky headers use a subtle bottom border (`1px solid #CBD5E1`) rather than a shadow to indicate they are "above" the scrolling content.

## Shapes

The shape language is **Soft** (4px / 0.25rem), reflecting a precise, industrial feel. 

- **Components:** Buttons, Input Fields, and Cards use the base 4px radius.
- **Status Badges:** Use a "Capsule" or "Pill" shape (fully rounded) to visually distinguish them from interactive buttons or data cells.
- **Workcenter Cards:** Use sharp vertical separators to imply a "modular" or "stacked" manufacturing line.

## Components

### Buttons & Inputs
- **Primary Action:** Solid `#1E293B` with white text. High-density padding (4px 12px).
- **Ghost Actions:** Transparent background with 1px slate border. Used for "Add Exception" or "Export."
- **Inputs:** 32px height, 1px border. Focus state uses a 2px blue ring.

### Data Grids & Status Badges
- **Compact Grids:** 1px borders between all cells. Row hover state uses `#F1F5F9`.
- **Status Badges:** Compact labels (11px caps). Backgrounds use 10% opacity of the risk color with 100% opacity text for the label.
- **Capacity Indicators:** A progress bar component used within grid cells to show "Workcenter Load" (e.g., a red bar for >100% load).

### Specialized Components
- **Readiness Checklist:** A vertical list within the Right Drawer. Each item contains a checkbox, an owner avatar, a status badge (Green/Yellow/Red), and a "Notes" icon.
- **Impact Preview:** A temporary "Split-View" in the drawer that shows a "Before vs. After" comparison of production dates when a user attempts to reschedule an order.
- **Stale Data Indicator:** A small, monospaced timestamp in the footer or header (e.g., "SYNC: 2m ago") to ensure data freshness.