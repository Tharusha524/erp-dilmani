import { useState } from "react";
import { Stack } from "@mui/material";
import EntityAttachmentsTable from "../../../../../components/entityAttachments/EntityAttachmentsTable";
import EntityAttachmentsForm from "../../../../../components/entityAttachments/EntityAttachmentsForm";

interface FixedAssetsAttachmentsProps {
  itemId?: string | number;
}

export default function FixedAssetsAttachmentsTable({ itemId }: FixedAssetsAttachmentsProps) {
  const [showForm, setShowForm] = useState(false);

  if (!itemId) return null;

  return (
    <Stack>
      {showForm ? (
        <EntityAttachmentsForm
          entityType="fixed_asset"
          entityId={itemId}
          entityIdLabel="Asset ID"
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      ) : (
        <EntityAttachmentsTable
          entityType="fixed_asset"
          entityId={itemId}
          onAdd={() => setShowForm(true)}
        />
      )}
    </Stack>
  );
}
