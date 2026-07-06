import { useState } from "react";
import { Box, Stack } from "@mui/material";
import Breadcrumb from "../../../../../components/BreadCrumb";
import PageTitle from "../../../../../components/PageTitle";
import theme from "../../../../../theme";
import EntityAttachmentsTable from "../../../../../components/entityAttachments/EntityAttachmentsTable";
import EntityAttachmentsForm from "../../../../../components/entityAttachments/EntityAttachmentsForm";

interface AttachmentsProps {
  customerId?: string | number;
}

export default function AttachmentsTable({ customerId }: AttachmentsProps) {
  const [showForm, setShowForm] = useState(false);

  if (!customerId) {
    return null;
  }

  const breadcrumbItems = [
    { title: "Home", href: "/dashboard" },
    { title: "Attachments" },
  ];

  return (
    <Stack>
      <Box
        sx={{
          padding: theme.spacing(2),
          boxShadow: 2,
          marginY: 2,
          borderRadius: 1,
        }}
      >
        <PageTitle title="Attachments" />
        <Breadcrumb breadcrumbs={breadcrumbItems} />
      </Box>

      {showForm ? (
        <EntityAttachmentsForm
          entityType="customer"
          entityId={customerId}
          entityIdLabel="Customer ID"
          onCancel={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      ) : (
        <EntityAttachmentsTable
          entityType="customer"
          entityId={customerId}
          onAdd={() => setShowForm(true)}
        />
      )}
    </Stack>
  );
}
