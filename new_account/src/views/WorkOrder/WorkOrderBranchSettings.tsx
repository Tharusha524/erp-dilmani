import React from "react";
import WoSheetLookupSettings from "./WoSheetLookupSettings";
import {
  createWoSheetBranch,
  deleteWoSheetBranch,
  getWoSheetBranches,
  updateWoSheetBranch,
} from "../../api/WorkOrder/workOrderLookupsApi";

export default function WorkOrderBranchSettings() {
  return (
    <WoSheetLookupSettings
      title="Branch"
      description="Manage the list of branches available on the order sheet's Branch dropdown."
      queryKey="wo-sheet-branches"
      getItems={getWoSheetBranches}
      createItem={createWoSheetBranch}
      updateItem={updateWoSheetBranch}
      deleteItem={deleteWoSheetBranch}
    />
  );
}
