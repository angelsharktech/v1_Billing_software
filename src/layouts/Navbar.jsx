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
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { webuser, logoutUser } = useAuth();
  const navigate = useNavigate();
   const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logoutUser();
    navigate("/login");
    console.log("Logged out");
  };

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
        background: "linear-gradient(135deg, #182848, #324b84ff)",
        color: "#fff",
        borderBottomRightRadius: 40,
      }}
    >
      <Toolbar sx={{ justifyContent: "flex-end" }}>
        <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
          <Avatar sx={{ width: 35, height: 35 ,marginRight:'35px' }} >U</Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <Typography fontWeight="bold" fontSize={14} align="ceter" padding={2}>
          {webuser.name +" "}
        </Typography>
        <Divider></Divider>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>
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
