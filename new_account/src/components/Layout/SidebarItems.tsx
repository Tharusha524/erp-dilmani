import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ScienceIcon from "@mui/icons-material/Science";
import EmergencyIcon from "@mui/icons-material/Emergency";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import FolderIcon from "@mui/icons-material/Folder";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

export interface SidebarItem {
  title?: string;
  headline?: string;
  icon?: JSX.Element;
  open?: boolean;
  href?: string;
  disabled?: boolean;
  accessKey?: string;
  nestedItems?: {
    title: string;
    href: string;
    icon?: JSX.Element;
    accessKey?: string;
    open?: boolean;
    disabled?: boolean;
    nestedItems?: {
      accessKey?: string;
      title: string;
      href: string;
      icon?: JSX.Element;
      disabled?: boolean;
    }[];
  }[];
}

const baseSidebarItems: Array<SidebarItem> = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <DashboardIcon fontSize="small" />,
  },
  {
    title: "Sales",
    href: "/sales",
    icon: <ShoppingCartOutlinedIcon fontSize="small" />,
    nestedItems: [
      {
        title: "Transactions",
        href: "/sales/transactions",
      },
      {
        title: "Inquiries and Reports",
        href: "/sales/inquiriesandreports",
      },
      {
        title: "Maintenance",
        href: "/sales/maintenance",
      },
    ],
  },
  {
    title: "Purchase",
    href: "/purchase",
    icon: <LocalMallOutlinedIcon fontSize="small" />,
    nestedItems: [
      {
        title: "Transactions",
        href: "/purchase/transactions",
      },
      {
        title: "Inquiries and Reports",
        href: "/purchase/inquiriesandreports",
      },
      {
        title: "Maintenance",
        href: "/purchase/maintenance",
      },
    ],
  },
  {
    title: "Item and inventory",
    href: "/itemsandinventory",
    icon: <Inventory2OutlinedIcon fontSize="small" />,
    nestedItems: [
      {
        title: "Transactions",
        href: "/itemsandinventory/transactions",
      },
      {
        title: "Inquiries and Reports",
        href: "/itemsandinventory/inquiriesandreports",
      },
      {
        title: "Maintenance",
        href: "/itemsandinventory/maintenance",
      },
      {
        title: "Pricing and Costs",
        href: "/itemsandinventory/pricingandcosts",
      },
    ],
  },
  {
    title: "Manufacturing",
    href: "/manufacturing",
    icon: <PrecisionManufacturingOutlinedIcon fontSize="small" />,
    nestedItems: [
      {
        title: "Transactions",
        href: "/manufacturing/transactions",
      },
      {
        title: "Inquiries and Reports",
        href: "/manufacturing/inquiriesandreports",
      },
      {
        title: "Maintenance",
        href: "/manufacturing/maintenance",
      },
    ],
  },
  {
    title: "Fixed Assets",
    href: "/fixedassets",
    icon: <EmergencyIcon fontSize="small" />,
    nestedItems: [
      {
        title: "Transactions",
        href: "/fixedassets/transactions",
      },
      {
        title: "Inquiries and Reports",
        href: "/fixedassets/inquiriesandreports",
      },
      {
        title: "Maintenance",
        href: "/fixedassets/maintenance",
      },
    ],
  },
  {
    title: "Dimension",
    href: "/dimension",
    icon: <ChangeHistoryIcon fontSize="small" />,
    nestedItems: [
      {
        title: "Transactions",
        href: "/dimension/transactions",
      },
      {
        title: "Inquiries and Reports",
        href: "/dimension/inquiriesandreports",
      },
      {
        title: "Maintenance",
        href: "/dimension/maintenance",
      },
    ],
  },
  {
    title: "Banking And General ledger",
    href: "/bankingandgeneralledger",
    icon: <AccountBalanceWalletOutlinedIcon fontSize="small" />,
    nestedItems: [
      {
        title: "Transactions",
        href: "/bankingandgeneralledger/transactions",
      },
      {
        title: "Inquiries and Reports",
        href: "/bankingandgeneralledger/inquiriesandreports",
      },
      {
        title: "Maintenance",
        href: "/bankingandgeneralledger/maintenance",
      },
    ],
  },
];

export interface SidebarModuleFlags {
  manufacturingEnabled?: boolean;
  fixedAssetsEnabled?: boolean;
  useDimensions?: boolean;
}

// Filter modules by Company Setup flags; optionally append Setup for admins.
export const getSidebarItems = (
  canAccessSetup = false,
  moduleFlags: SidebarModuleFlags = {}
): Array<SidebarItem> => {
  const {
    manufacturingEnabled = true,
    fixedAssetsEnabled = true,
    useDimensions = true,
  } = moduleFlags;

  const items = baseSidebarItems.filter((item) => {
    if (item.title === "Manufacturing") return manufacturingEnabled;
    if (item.title === "Fixed Assets") return fixedAssetsEnabled;
    if (item.title === "Dimension") return useDimensions;
    return true;
  });

  if (canAccessSetup) {
    items.push({
      title: "Setup",
      href: "/setup",
      icon: <SettingsOutlinedIcon fontSize="small" />,
      nestedItems: [
        {
          title: "Company Setup",
          href: "/setup/companysetup",
        },
        {
          title: "Miscellaneous",
          href: "/setup/miscellaneous",
        },
        {
          title: "Maintenance",
          href: "/setup/maintenance",
        },
      ],
    });
  }

  return items;
};