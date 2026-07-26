// Every page's "View" permission id (from PERMISSION_ID_MAP / navigationTree)
// gets a paired "Edit" id at a fixed offset, instead of hand-duplicating a
// second id per page across map.ts and navigationTree.ts. Both ids travel
// through the exact same `sections` semicolon-list plumbing already used for
// View — no backend/schema change is needed for this to work.
export const EDIT_ID_OFFSET = 100000;

export const toEditId = (viewId: number): number => viewId + EDIT_ID_OFFSET;

export const isEditId = (id: number): boolean => id >= EDIT_ID_OFFSET;

export const toViewId = (editId: number): number => editId - EDIT_ID_OFFSET;
