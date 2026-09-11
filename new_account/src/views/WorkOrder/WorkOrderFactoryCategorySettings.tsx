import React from "react";
import WoSheetLookupSettings from "./WoSheetLookupSettings";
import {
  createWoSheetFactoryCategory,
  deleteWoSheetFactoryCategory,
  getWoSheetFactoryCategories,
  updateWoSheetFactoryCategory,
} from "../../api/WorkOrder/workOrderLookupsApi";

export default function WorkOrderFactoryCategorySettings() {
  return (
    <WoSheetLookupSettings
      title="Factory Category"
      description="Manage the list of categories available on the Factory order sheet's Category dropdown."
      queryKey="wo-sheet-factory-categories"
      getItems={getWoSheetFactoryCategories}
      createItem={createWoSheetFactoryCategory}
      updateItem={updateWoSheetFactoryCategory}
      deleteItem={deleteWoSheetFactoryCategory}
    />
  );
}
