# State Management Guide

Use each tool for what it does best:

- React Query: server state (API fetch/mutation, cache, stale/retry logic).
- Zustand: client state (UI toggles, auth/session view state, wizard progress).

## Stores

- `authStore.ts`
  - `user`
  - `permissionIds`
  - `initializing`
- `uiStore.ts`
  - `sidebarOpen`
  - `profileDrawerOpen`
  - `activeMainItem`

## Rules

1. Do not duplicate API response lists in Zustand if React Query already owns them.
2. Keep Zustand slices small and feature-focused.
3. Use selectors in components to avoid unnecessary re-renders.
