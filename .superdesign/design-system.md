# TOC Interactive Lab - Design System

The platform is a professional, modern developer tool for automata simulation. It uses a **clean dark developer-tool style** prioritizing minimal layout, low eyestrain, clear categorizations, and an interactive workspace.

## 1. Global Color Palette (Dark Theme)

- **Primary background**: `#0F172A`
- **Secondary background**: `#111827`
- **Card / container bg**: `#1F2937`
- **Border color**: `#374151`

**Accents**:
- **Primary accent** (main actions): `#6366F1`
- **Secondary accent** (run/success): `#22C55E`
- **Highlight accent** (step/warn): `#F59E0B`
- **Error color** (reset/danger): `#EF4444`

**Text**:
- **Primary text**: `#F9FAFB`
- **Secondary text**: `#9CA3AF`
- **Muted text**: `#6B7280`

## 2. Typography

- **Font family**: `Inter`, system-ui, sans-serif
- **Code / Mono**: `JetBrains Mono`, monospace
- **Body text**: 16px

**Headings**:
- H1 → 42px
- H2 → 30px
- H3 → 22px
- H4 → 18px

## 3. Layout Structure

All pages follow this shell:
```
------------------------------------------------
Navbar (top, 70px height, #111827)
------------------------------------------------
Sidebar (left, 260px wide, #111827) | Workspace Area (#0F172A, 32px padding)
------------------------------------------------
Footer (bottom, 60px height)
```

## 4. UI Component Styles

### Buttons
- **Primary**: bg `#6366F1`, text `white`, hover `#4F46E5`, 8px radius, padded 10px 18px.
- **Secondary**: border `1px solid #6366F1`, text `#6366F1`, transparent bg, hover `rgba(99,102,241,0.1)`.
- **Run / Success**: bg `#22C55E`, hover `#16A34A`
- **Step / Warning**: bg `#F59E0B`, hover `#D97706`
- **Reset / Danger**: bg `#EF4444`, hover `#DC2626`

### Tool Panels
- Background: `#1F2937`
- Border: `1px solid #374151`
- Border radius: `10px`
- Padding: `20px`

### Tables (Transition Tables)
- Table bg: `#111827`
- Header bg: `#1F2937`
- Border: `#374151`

### Visualization / Logs
- Background: `#111827`
- Border: `#374151`
- Code text color for logs: `#22C55E`
- Tape head indicator color: `#F59E0B`
