## 2024-09-23 - [O(1) Data lookups in React Components]
**Learning:** Performing O(N) array lookups (like `find` or `some`) and recalculating derived data (like `calculateHabitStats`) within React component render methods, particularly inside map loops, significantly degrades performance as list size grows.
**Action:** Use `useMemo` to construct O(1) Map lookups for frequently accessed list items and to pre-compute expensive derived stats, moving O(N*M) render logic to O(N) initialization.
