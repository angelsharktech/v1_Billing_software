import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";
import { SettingsApplications } from "@mui/icons-material";

const Navbar = ({ setSelectedTab, onMenuClick }) => {
  const { webuser, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background: "linear-gradient(135deg, #182848, #324b84ff)",
          color: "#fff",
          borderBottomRightRadius: 40,
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {/* Menu Icon for Mobile - Left Side */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onMenuClick}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Flexible Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Title - Right Side */}
          <Typography 
            fontSize={28} 
            noWrap 
            component="div" 
            sx={{ 
              mr: 2,
              display: { xs: isMobile ? 'none' : 'block', sm: 'block' }
            }}
          >
            Angel Bill
          </Typography>

          {/* Avatar - Right Side */}
          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ width: 35, height: 35 }}>
              {webuser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
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
            <Typography
              fontWeight="bold"
              fontSize={14}
              align="center"
              padding={2}
            >
              {webuser.name + " "}
            </Typography>
            <Divider></Divider>
            <MenuItem
              onClick={() => {
                setSelectedTab("Settings");
                handleMenuClose();
              }}
            >
              <SettingsApplications fontSize="small" sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <Divider></Divider>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default Navbar;