import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: JSX.Element;
  iconColor?: string;
  onClick?: () => void;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  iconColor = "#024271",
  onClick,
  subtitle,
}) => {
  const isPositive = change >= 0;
  const showChange = Math.abs(change) >= 0.05;

  return (
    <Paper
      className="erp-stat-card"
      elevation={0}
      onClick={onClick}
      sx={{
        p: 2.5,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box
          className="erp-stat-card__icon"
          sx={{
            backgroundColor: `${iconColor}12`,
            color: iconColor,
          }}
        >
          {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 22 } })}
        </Box>
        <Box
          className={`erp-stat-card__change ${isPositive ? "erp-stat-card__change--up" : "erp-stat-card__change--down"}`}
          sx={{ visibility: showChange ? "visible" : "hidden" }}
        >
          {isPositive ? (
            <TrendingUpIcon sx={{ fontSize: 14, mr: 0.25 }} />
          ) : (
            <TrendingDownIcon sx={{ fontSize: 14, mr: 0.25 }} />
          )}
          {Math.abs(change)}%
        </Box>
      </Box>
      <Typography
        variant="caption"
        sx={{ color: "#64748b", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}
      >
        {title}
      </Typography>
      <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75, color: "#0f172a", letterSpacing: "-0.02em" }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 0.5 }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default StatCard;
