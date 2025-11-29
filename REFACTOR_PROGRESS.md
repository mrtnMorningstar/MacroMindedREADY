# MacroMinded Refactoring Progress

## ✅ Completed Steps

### Step 1: Split Contexts ✅
- ✅ Created `src/context/AuthContext.tsx` - handles user, userDoc, authentication logic
- ✅ Created `src/context/PurchaseContext.tsx` - handles purchase, data, macros, packageTier, isUnlocked
- ✅ Created `src/context/UIContext.tsx` - handles sessionExpired and UI states
- ✅ Created `src/context/index.tsx` - combines all providers and exports unified hooks
- ✅ Updated `src/app/layout.tsx` to use new AppProvider
- ✅ Updated all component imports from `@/context/AppContext` to `@/context`
- ✅ Maintained backward compatibility with `useAppContext()` hook

**Files Updated:**
- All guard components (RequireAuth, RequireWizard, RequireAdmin, RequirePackage, RequireProfileCompletion)
- All dashboard pages and components
- Navbar, AdminLayout, AuthGate, and other components

### Step 2: Design System Foundation ✅
- ✅ Created `src/components/ui/Button.tsx` with variants (primary, secondary, ghost) and sizes
- ✅ Created `src/components/ui/Card.tsx` with consistent styling and hover support
- ✅ Created `src/components/ui/Section.tsx` with max-width options
- ✅ Created `src/components/ui/Heading.tsx` with H1-H4 typography scale
- ✅ Created `src/components/ui/index.ts` barrel export
- ✅ Created `src/lib/utils.ts` with `cn()` utility function

### Step 3: Tailwind Design Tokens ✅
- ✅ Updated `src/app/globals.css` with semantic color tokens:
  - Background & Surface colors
  - Primary, Secondary, Accent colors
  - Text color variants (primary, secondary, muted)
  - Border colors
  - Spacing scale variables
- ✅ Maintained existing @theme inline configuration for Tailwind v4

### Step 4: Framer Motion Optimization ✅
- ✅ Created `src/lib/animations.ts` with shared animation variants:
  - `fadeInUp`, `fadeIn`, `scaleIn`
  - `slideInRight`, `slideInLeft`
  - `staggerContainer`, `staggerItem`
  - `usePrefersReducedMotion()` hook
- ⚠️ Dynamic imports for framer-motion not yet implemented (can be added if needed for bundle optimization)

---

## 🚧 Remaining Steps

### Step 5: Accessibility & Responsiveness
**Status:** Not Started

**Tasks:**
- [ ] Audit all pages in `src/app/` for missing aria-labels
- [ ] Add `role` attributes where needed
- [ ] Ensure all buttons and links are keyboard accessible
- [ ] Check color contrast ratios (especially on gradients)
- [ ] Wrap icons in accessible buttons with proper labels
- [ ] Test mobile breakpoints (sm, md, lg) on all pages
- [ ] Add focus indicators to interactive elements

**Files to Review:**
- `src/app/page.tsx` (homepage)
- `src/app/dashboard/**/*.tsx`
- `src/app/admin/**/*.tsx`
- All component files in `src/components/`

### Step 6: Developer Experience Enhancements
**Status:** Not Started

**Tasks:**
- [ ] Install and configure ESLint with `eslint-config-next`
- [ ] Add `eslint-plugin-tailwindcss`
- [ ] Configure import/order rule
- [ ] Install and configure Prettier with `prettier-plugin-tailwindcss`
- [ ] Install Storybook or Ladle
- [ ] Create component stories for Button, Card, Section, Heading
- [ ] Add scripts to package.json for linting and formatting

**Required Dependencies:**
```json
{
  "devDependencies": {
    "eslint-plugin-tailwindcss": "^0.0.x",
    "prettier": "^3.x",
    "prettier-plugin-tailwindcss": "^0.6.x",
    "@storybook/react": "^8.x" // or Ladle
  }
}
```

### Step 7: Folder Structure Alignment
**Status:** Not Started

**Tasks:**
- [ ] Create `src/components/layout/` directory (move layout components)
- [ ] Create `src/components/shared/` directory (move shared components)
- [ ] Reorganize `src/components/` to match structure:
  ```
  src/components/
  ├── ui/          (✅ already exists)
  ├── layout/      (create - move DashboardShell, ConditionalLayout, etc.)
  └── shared/      (create - move common components)
  ```
- [ ] Create `src/lib/firebase/` directory (move firebase.ts, firebase-admin.ts)
- [ ] Create `src/lib/utils/` directory (utils.ts already exists)
- [ ] Update all imports project-wide
- [ ] Verify RootLayout wraps all three context providers (✅ already done)

### Step 8: Final Sanity Pass
**Status:** Not Started

**Checklist:**
- [ ] Run dev server (`npm run dev`)
- [ ] Fix any TypeScript errors
- [ ] Verify hot reload works
- [ ] Test font loading (Anton, Geist)
- [ ] Test page transitions
- [ ] Verify toasts render properly
- [ ] Test ErrorBoundary
- [ ] Verify responsive layouts on mobile
- [ ] Check for context re-render storms (use React DevTools Profiler)
- [ ] Run production build (`npm run build`)

---

## 📝 Notes

### Context Migration
- The new context structure is backward compatible
- `useAppContext()` still works via the unified hook in `src/context/index.tsx`
- Files can gradually migrate to specific hooks (`useAuth()`, `usePurchase()`, `useUI()`)
- Old `AppContext.tsx` can be deprecated/removed after full migration

### Design Tokens
- Tailwind v4 uses CSS variables in `globals.css` rather than JS config
- All existing Tailwind classes continue to work
- New semantic tokens available for future component updates

### Next Steps Priority
1. **High Priority:** Step 5 (Accessibility) - affects user experience
2. **Medium Priority:** Step 7 (Folder Structure) - improves maintainability
3. **Medium Priority:** Step 6 (DX) - improves developer workflow
4. **Low Priority:** Step 8 (Sanity Pass) - final verification

---

## 🔧 Quick Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Find all AppContext imports (should be minimal now)
grep -r "from.*@/context/AppContext" src/

# Find components using old context pattern
grep -r "useAppContext" src/ | grep -v "from.*@/context"
```

---

**Last Updated:** [Current Date]
**Status:** Steps 1-4 Complete | Steps 5-8 Pending

