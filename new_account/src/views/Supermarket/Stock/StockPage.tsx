import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Card, CardContent, Stack, TextField, Autocomplete, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Paper, Typography, Chip, InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { FormPageLayout } from "../../../components/Layout/FormPageLayout";
import PageTitle from "../../../components/PageTitle";
import Breadcrumb from "../../../components/BreadCrumb";
import PageLoader from "../../../components/PageLoader";
import { getStockList } from "../../../api/Inventory/StockListApi";
import { getItemCategories } from "../../../api/ItemCategories/ItemCategoriesApi";
import { useHomeCurrency } from "../../../hooks/useHomeCurrency";

/**
 * A read-only inventory browser — search by product name, stock ID, or
 * barcode, filter by category, see current quantity on hand. Purely a
 * reporting screen over existing tables (via /inventory/stock-list) — no
 * writes anywhere on this page, so it cannot affect accounting or stock
 * levels in any way, no matter what's clicked here.
 */
export default function StockPage() {
  const { formatCurrency } = useHomeCurrency();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<any>(null);

  const { data: categories } = useQuery({ queryKey: ["item-categories"], queryFn: () => getItemCategories() });
  const { data: stock, isLoading } = useQuery({
    queryKey: ["stock-list", search, category?.category_id],
    queryFn: () => getStockList({ search: search || undefined, category_id: category?.category_id }),
  });

  return (
    <FormPageLayout>
      <Box sx={{ p: 2, boxShadow: 2, borderRadius: 1, mb: 2 }}>
        <PageTitle title="Stock" />
        <Breadcrumb breadcrumbs={[{ title: "Smart Supermarket", href: "/supermarket" }, { title: "Stock" }]} />
        <Typography variant="caption" color="text.secondary">
          Current inventory — search by name, stock ID, or barcode, and filter by category.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth size="small"
              placeholder="Search by name, stock ID, or barcode — scan or type"
              value={search} onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <Autocomplete
              sx={{ minWidth: 240 }}
              options={categories ?? []}
              getOptionLabel={(c: any) => c.description ?? ""}
              value={category}
              onChange={(_, v) => setCategory(v)}
              renderInput={(p) => <TextField {...p} label="Category" size="small" />}
            />
          </Stack>
        </CardContent>
      </Card>

      {isLoading ? <PageLoader /> : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "var(--pallet-lighter-blue)" }}>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Stock ID</TableCell>
                <TableCell>Barcode</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Quantity on Hand</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(stock ?? []).map((s) => (
                <TableRow key={s.stock_id} hover>
                  <TableCell>{s.description}</TableCell>
                  <TableCell>{s.stock_id}</TableCell>
                  <TableCell>{s.barcode ?? "—"}</TableCell>
                  <TableCell>{s.category_name ?? "—"}</TableCell>
                  <TableCell align="right">{formatCurrency(s.purchase_cost)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={s.quantity}
                      color={s.quantity <= 0 ? "error" : "default"}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {(!stock || stock.length === 0) && (
                <TableRow><TableCell colSpan={6} align="center"><Typography variant="body2">No matching products.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </FormPageLayout>
  );
}
