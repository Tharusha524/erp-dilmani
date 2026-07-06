import { useState } from "react";
import { Stack } from "@mui/material";
import EntityAttachmentsTable from "../../../../../components/entityAttachments/EntityAttachmentsTable";
import EntityAttachmentsForm from "../../../../../components/entityAttachments/EntityAttachmentsForm";

interface ItemAttachmentProps {
  itemId?: string | number;
}

export default function ItemAttachmentsTable({ itemId }: ItemAttachmentProps) {
  const [showForm, setShowForm] = useState(false);

  if (!itemId) return null;

  return (
    <Stack>
      {showForm ? (
        <EntityAttachmentsForm
          entityType="item"
          entityId={itemId}
          entityIdLabel="Item ID"
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      ) : (
        <EntityAttachmentsTable entityType="item" entityId={itemId} onAdd={() => setShowForm(true)} />
      )}
    </Stack>
  );
}
