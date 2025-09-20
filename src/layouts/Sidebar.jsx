import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Avatar,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Store as StoreIcon,
  Category as CategoryIcon,
  Inventory2 as Inventory2Icon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ReceiptLong as ReceiptLongIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: <DashboardIcon /> },
  {
    label: "Bills",
    icon: <ReceiptLongIcon />,
    subItems: [ "Sale Bill","Purchase Bill","Sale Return","Purchase Return"],
  },
  // { label: "Sale Bill", icon: <ReceiptLongIcon /> },
  // { label: "Sale Bill Return", icon: <ReceiptLongIcon /> },
  // { label: "Purchase Bill", icon: <AccountBalanceWalletIcon /> },
  // { label: "Purchase Bill Return", icon: <AccountBalanceWalletIcon /> },
  { label: "Suppliers", icon: <StoreIcon /> },
  { label: "Customer", icon: <PeopleIcon /> },
  { label: "Category", icon: <CategoryIcon /> },
  { label: "Product", icon: <Inventory2Icon /> },
  {
    label: "Reports",
    icon: <AssessmentIcon />,
    subItems: ["Purchase Report" ,"Sale Report" ],
  },
  {
    label: "Payment",
    icon: <CurrencyRupeeIcon />,
    subItems: [ "Payment Given","Payment Received"],
  },
  // { label: "Payment Given", icon: <ReceiptLongIcon /> },
  // { label: "Payment Received", icon: <ReceiptLongIcon /> },
  
  {
    label: "Ledger",
    icon: <CreditScoreIcon />,
    subItems: [ "Supplier Ledger","Customer Ledger"],
  },
  { label: "Quotation", icon: <Inventory2Icon /> },
  
];

const billReportsSubItems = ["Sale Report", "Purchase Report"];
const ledgerSubItem = ["Customer Ledger", "Supplier Ledger"];
// const billReportsSubItems = ["Sale Bill Report", "Purchase Bill Report","HSN Report"];  

const selectedStyle = {
  background: "#fff !important",
  color: "#182848 !important",
  borderRadius: "8px",
  fontWeight: 600,
  boxShadow: 2,
};

const unselectedStyle = {
  color: "white",
  borderRadius: "8px",
  fontWeight: 500,
  transition: "background 0.2s, color 0.2s",
  "&:hover": {
    backgroundColor: "#fff",
    color: "#182848",
    "& .MuiListItemIcon-root": {
      color: "#182848",
    },
  },
};


const Sidebar = ({ selectedTab, setSelectedTab }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // track which dropdown is open
  const { webuser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const toggleDrawer = () => setMobileOpen(!mobileOpen);

  const handleNavClick = (label) => {
    if (label === "Logout") {
      logoutUser();
      navigate("/login");
    } else {
      setSelectedTab(label);
    }
    if (isMobile) toggleDrawer();
  };

  const handleDropdownClick = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const renderSidebarContent = () => (
    <Box
      sx={{
        width: 200,
        background: "linear-gradient(135deg, #182848, #324b84ff)",
        color: "#fff",
        height: `100vh`,
        px: 2,
        pt: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderTopRightRadius: 40,
        borderBottomRightRadius: 60,
        position: "fixed",
      }}
    >
      {/* User Info */}
      <Box textAlign="center">
        <Avatar sx={{ width: 60, height: 60, mx: "auto", mb: 1 }} />
        <Typography fontWeight="bold" fontSize={14}>
          {webuser.first_name}
        </Typography>
        <Typography fontSize={12} color="gray">
          {webuser.email}
        </Typography>
      </Box>

      {/* Navigation */}
      <Box>
        <List>
          {navItems.map((item) =>
            item.subItems ? (
              <Box key={item.label}>
                <ListItemButton
                  onClick={() => handleDropdownClick(item.label)}
                  sx={selectedTab === item.label ? selectedStyle : unselectedStyle}
                >
                  <ListItemIcon sx={{ color: selectedTab === item.label ? "#182848" : "white" }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                  {openDropdown === item.label ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>

                <Collapse in={openDropdown === item.label} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subLabel) => (
                      <ListItemButton
                        key={subLabel}
                        onClick={() => handleNavClick(subLabel)}
                        sx={
                          selectedTab === subLabel
                            ? selectedStyle
                            : { pl: 4, ...unselectedStyle }
                        }
                      >
                        <ListItemText primary={subLabel} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ) : (
              <ListItemButton
                key={item.label}
                selected={selectedTab === item.label}
                onClick={() => handleNavClick(item.label)}
                sx={selectedTab === item.label ? selectedStyle : unselectedStyle}
              >
                <ListItemIcon sx={{ color: selectedTab === item.label ? "#182848" : "white" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            )
          )}
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <Box position="fixed" top={10} left={10} zIndex={1201}>
          <IconButton onClick={toggleDrawer} sx={{ color: "#e4eeeeff" }}>
            <MenuIcon />
          </IconButton>
        </Box>
      )}

      <Drawer anchor="left" open={mobileOpen} onClose={toggleDrawer} ModalProps={{ keepMounted: true }}>
        {renderSidebarContent()}
      </Drawer>

      {!isMobile && <Box sx={{ height: "100vh", zIndex: 1100 }}>{renderSidebarContent()}</Box>}
    </>
  );
};

export default Sidebar;
