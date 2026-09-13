## 2025-02-12 - Missing Memoization in Map Loops Causes O(N*3650) Operations
**Learning:** Calling heavy computation functions like `calculateHabitStats` (which iterates backwards up to 3650 days to determine streaks) directly inside array `.map()` iterations within the render cycle drastically impacts performance on simple state updates.
**Action:** Use `useMemo` to precompute a Map of stats for all rendered items, converting `O(N * 3650)` per render into `O(1)` map lookups per render, dramatically accelerating re-renders.
