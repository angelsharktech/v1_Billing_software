import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { webuser, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        BillingApp
      </Typography>
    </Box>
  );
  const drawerWidth = 100;
  const handleNavClick = () => {
    logoutUser();
    navigate("/login");
  };
  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          // ml: { sm: `${drawerWidth}px` },
          // width: { sm: `calc(100% - ${drawerWidth}px)` },
          background: "linear-gradient(135deg, #182848, #324b84ff)",color: "#fff", 
          borderBottomRightRadius: 40,
        }}
      >
        <Toolbar sx={{ justifyContent: "flex-end" }}>
          <Typography variant="h4" noWrap component="div" mr={2}>
            Billing Desk
          </Typography>
          <Button
            // variant="outlined"
            color="#fff"
            onClick={handleNavClick}
          >
            <LogoutIcon titleAccess="LogOut" />
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
