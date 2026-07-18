import { FormPageLayout } from "../../../../../components/Layout/FormPageLayout";
import { useState } from "react";
import { Stack } from "@mui/material";
import EntityAttachmentsTable from "../../../../../components/entityAttachments/EntityAttachmentsTable";
import EntityAttachmentsForm from "../../../../../components/entityAttachments/EntityAttachmentsForm";

interface SuppliersAttachmentsProps {
  supplierId?: string | number;
}

export default function SuppliersAttachmentsTable({ supplierId }: SuppliersAttachmentsProps) {
  const [showForm, setShowForm] = useState(false);

  if (!supplierId) return null;

  return (
    <FormPageLayout>
      {showForm ? (
        <EntityAttachmentsForm
          entityType="supplier"
          entityId={supplierId}
          entityIdLabel="Supplier ID"
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      ) : (
        <EntityAttachmentsTable
          entityType="supplier"
          entityId={supplierId}
          onAdd={() => setShowForm(true)}
        />
      )}
    </FormPageLayout>
  );
}
