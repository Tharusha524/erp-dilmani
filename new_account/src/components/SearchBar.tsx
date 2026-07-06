import React from "react";
import { TextField } from "@mui/material";

export default function SearchBar({ searchQuery, setSearchQuery, placeholder }) {
  return (
    <TextField
      variant="outlined"
      size="small"
      fullWidth
      placeholder={placeholder || "Search..."}
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  );
}
