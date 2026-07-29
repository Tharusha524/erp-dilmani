import React from "react";
import WoSheetLookupSettings from "./WoSheetLookupSettings";
import {
  createWoSheetFabricType,
  deleteWoSheetFabricType,
  getWoSheetFabricTypes,
  updateWoSheetFabricType,
} from "../../api/WorkOrder/workOrderLookupsApi";

export default function WorkOrderFabricTypeSettings() {
  return (
    <WoSheetLookupSettings
      title="Kind of Fabric"
      description="Manage the list of fabric types available on the order sheet's Kind of Fabric dropdown."
      queryKey="wo-sheet-fabric-types"
      getItems={getWoSheetFabricTypes}
      createItem={createWoSheetFabricType}
      updateItem={updateWoSheetFabricType}
      deleteItem={deleteWoSheetFabricType}
    />
  );
}
