## 2024-05-18 - Memoize Derived State and Map Operations in Lists
**Learning:** In a React Native list view (like HomeScreen.tsx), computing stats inside `.map()` for every item creates significant CPU overhead on every re-render.
**Action:** Always extract and memoize derived arrays before rendering, and use a `useMemo` backed Map (e.g., `habitStatsCache`) to compute expensive item-level derived stats exactly once per render cycle for the specific list of items.
