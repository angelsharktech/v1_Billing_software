import React, { useEffect, useState, useRef } from "react";
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
    subItems: ["ALT+S:Sale Bill","ALT+P:Purchase Bill","ALT+S+R:Sale Return","ALT+P+R:Purchase Return"],
  },
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
    subItems: ["Payment Given","Payment Received"],
  },
  {
    label: "Ledger",
    icon: <CreditScoreIcon />,
    subItems: ["Supplier Ledger","Customer Ledger"],
  },
  { label: "Quotation", icon: <Inventory2Icon /> },
];

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
  const [openDropdown, setOpenDropdown] = useState(null);
  const { webuser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const refs = useRef([]); // Refs for focusable items

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

  // Build a "visible items" list based on dropdown state
  const getVisibleItems = () => {
    const visible = [];
    navItems.forEach((item) => {
      visible.push(item.label);
      if (item.subItems && openDropdown === item.label) {
        item.subItems.forEach((sub) => visible.push(sub));
      }
    });
    return visible;
  };

  const handleKeyDown = (e, label) => {
    const visibleItems = getVisibleItems();
    const index = visibleItems.indexOf(label);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % visibleItems.length;
      const nextLabel = visibleItems[nextIndex];
      const nextRef = refs.current[nextLabel];
      nextRef?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + visibleItems.length) % visibleItems.length;
      const prevLabel = visibleItems[prevIndex];
      const prevRef = refs.current[prevLabel];
      prevRef?.focus();
    }
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
      <Box textAlign="center">
        <Avatar sx={{ width: 60, height: 60, mx: "auto", mb: 1 }} />
        <Typography fontWeight="bold" fontSize={14}>
          {webuser.first_name}
        </Typography>
        <Typography fontSize={12} color="gray">
          {webuser.email}
        </Typography>
      </Box>

      <List>
        {navItems.map((item) => {
          if (item.subItems) {
            return (
              <Box key={item.label}>
                <ListItemButton
                  ref={(el) => (refs.current[item.label] = el)}
                  onClick={() => handleDropdownClick(item.label)}
                  onKeyDown={(e) => handleKeyDown(e, item.label)}
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
                        ref={(el) => (refs.current[subLabel] = el)}
                        onClick={() => handleNavClick(subLabel)}
                        onKeyDown={(e) => handleKeyDown(e, subLabel)}
                        sx={selectedTab === subLabel ? selectedStyle : { pl: 4, ...unselectedStyle }}
                      >
                        <ListItemText primary={subLabel} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            );
          } else {
            return (
              <ListItemButton
                key={item.label}
                ref={(el) => (refs.current[item.label] = el)}
                onClick={() => handleNavClick(item.label)}
                onKeyDown={(e) => handleKeyDown(e, item.label)}
                sx={selectedTab === item.label ? selectedStyle : unselectedStyle}
              >
                <ListItemIcon sx={{ color: selectedTab === item.label ? "#182848" : "white" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          }
        })}
      </List>
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
