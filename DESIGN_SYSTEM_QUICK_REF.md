# Sanctuari Design System - Quick Reference

**IMPORTANT:** Always use CSS variables, never hardcoded colors!

---

## 🎨 **Color Palette**

```css
/* Primary Colors */
--fog: #F5F4F5;         /* Light gray background */
--iris: #6F4FFF;        /* Primary purple */
--rose: #FD5478;        /* Error/Danger red */
--sun: #F6C754;         /* Warning yellow */
--ink: #070921;         /* Almost black text */
--white: #FFFFFF;       /* Pure white */

/* Ink Opacity Variants */
--ink-80: rgba(7, 9, 33, 0.8);
--ink-60: rgba(7, 9, 33, 0.6);
--ink-40: rgba(7, 9, 33, 0.4);
--ink-20: rgba(7, 9, 33, 0.2);
--ink-10: rgba(7, 9, 33, 0.1);

/* Color Variants */
--iris-light: rgba(111, 79, 255, 0.1);
--iris-hover: #5A3FE5;
--rose-light: rgba(253, 84, 120, 0.1);
--rose-hover: #E54766;
--sun-light: rgba(246, 199, 84, 0.1);
--sun-dark: #C89D2C;
```

---

## 📝 **Typography**

```css
/* Font Families */
--font-cabinet: 'Cabinet Grotesk';     /* Headings only */
--font-geist-sans: 'Geist';            /* Body text */
--font-geist-mono: 'Geist Mono';       /* Code */

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

**Usage:**
```css
h1, h2, h3 {
  font-family: var(--font-cabinet);
  font-weight: 700;
  letter-spacing: -0.02em;
}

p, span, div {
  font-family: var(--font-geist-sans);
}
```

---

## 📐 **Spacing**

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
```

**Common usage:**
- Card padding: `32px`
- Section gap: `24px`
- Element margin: `16px`

---

## 🔲 **Border Radius**

```css
--radius-sm: 0.25rem;    /* 4px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
```

**Standard:** Cards use `12px` (--radius-lg)

---

## 🌑 **Shadows**

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

**Wizard cards use:**
```css
box-shadow: 0 1px 3px rgba(7, 9, 33, 0.06), 0 4px 6px rgba(7, 9, 33, 0.04);
```

---

## 📦 **Common Components**

### Card
```css
.card {
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(7, 9, 33, 0.06), 0 4px 6px rgba(7, 9, 33, 0.04);
  padding: 32px;
}
```

### Primary Button
```css
.btn-primary {
  background: var(--iris);
  color: var(--white);
  padding: 12px 24px;
  border-radius: 8px;
  font-family: var(--font-geist-sans);
  font-weight: 600;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: var(--iris-hover);
}
```

### Secondary Button
```css
.btn-secondary {
  background: var(--white);
  color: var(--ink);
  padding: 12px 24px;
  border-radius: 8px;
  font-family: var(--font-geist-sans);
  font-weight: 600;
  font-size: 15px;
  border: 1px solid var(--ink-20);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: var(--ink-40);
  background: var(--fog);
}
```

### Heading
```css
.page-title {
  font-family: var(--font-cabinet);
  font-size: 28px;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.page-subtitle {
  font-family: var(--font-geist-sans);
  font-size: 16px;
  color: var(--ink-60);
  margin: 0;
  line-height: 1.6;
}
```

### Badge
```css
.badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--iris-light);
  color: var(--iris);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Loading Spinner
```css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--ink-10);
  border-top-color: var(--iris);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## ❌ **DO NOT Use**

### Wrong (Hardcoded Colors):
```css
/* NEVER DO THIS */
color: #111827;
background: #f9fafb;
border: 1px solid #e5e7eb;
```

### Correct (CSS Variables):
```css
/* ALWAYS DO THIS */
color: var(--ink);
background: var(--fog);
border: 1px solid var(--ink-10);
```

---

## ✅ **Quick Checklist**

Before committing CSS:
- [ ] No hardcoded hex colors (except in rgba for shadows)
- [ ] Using `var(--font-cabinet)` for headings
- [ ] Using `var(--font-geist-sans)` for body text
- [ ] Border radius is 12px for cards, 8px for buttons
- [ ] Padding is 32px for cards
- [ ] Letter spacing `-0.02em` for headings
- [ ] Shadows match existing components
- [ ] Hover states use color variants (--iris-hover, etc.)

---

## 📖 **Reference Files**

1. **`/apps/platform/src/styles/globals.css`** - All CSS variables defined
2. **`/apps/platform/src/app/rfq/[id]/create/page.css`** - Wizard example
3. **`/apps/platform/src/app/rfq/[id]/review/page.css`** - Review example
4. **`/packages/ui/components/TopBar/TopBar.css`** - TopBar example

---

**When in doubt, copy patterns from existing pages!**
