## 2024-09-15 - Memoizing derived state in HomeScreen

**Learning:** `HomeScreen` was recalculating `calculateOverallStats` and filtering habits on every single re-render. Since `calculateOverallStats` calls `calculateHabitStats` (which runs O(N) over checkins) for *every* habit to find the `bestOverallStreak`, this was highly inefficient, especially when typing into the search query where rapid re-renders are triggered.

**Action:** Whenever a component calculates expensive derived data (like looping over history to find stats) based on global lists (`habits`, `checkins`), wrap those calculations in `useMemo` to prevent unnecessary recalculations on local state changes (e.g., search queries, active modals, ui toggles).
