import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import invoice from "../assets/invoice.jpg";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/UserService";
import { useAuth } from "../context/AuthContext";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

const Login = () => {
  const { loginData } = useAuth();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const res = await loginUser(credentials);
      if (res) {
        loginData(res.user, res.token);
        localStorage.setItem("token", res.token); // store token if needed
        setSnackbarMessage("Login successful!");
        setShowSnackbar(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      }
    } catch (err) {
      if(err.error){
        setSnackbarMessage(err.error);
        setShowSnackbar(true);
      }
      if(err.message){
        setSnackbarMessage(err.message);
        setShowSnackbar(true);
      }
    }
  };

 return (
    <Box
      sx={{
        height: "100vh",
        backgroundImage: `url(${invoice})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column", // column layout for content + footer
      }}
    >
      {/* Main content wrapper */}
      <Box
        sx={{
          flex: 1, // pushes footer down
          display: "flex",
          alignItems: "center",
          justifyContent: "left",
          overflow: "hidden",
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            maxWidth: 500,
            width: "50%",
            maxHeight: "90vh",
            overflowY: "auto",
            marginLeft: "10%",
            borderRadius: 5,
          }}
        >
          <Typography variant="h4" gutterBottom>
            Login
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                sx={{ mt: "10%" }}
              >
                Login
              </Button>
            </Grid>

            <Grid item xs={12} textAlign="right" mt={"3%"}>
              <Link
                to="/register"
                style={{ textDecoration: "none", color: "#1976d2" }}
              >
                No Account? Register Here
              </Link>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Footer inside flex column */}
      <Box
        component="footer"
        sx={{
          textAlign: "center",
          py: 2,
          color: "black",
          fontSize: "1 rem",
        }}
      >
        © {new Date().getFullYear()} Angel Shark IT Solution. All rights reserved. Visit our website 
        <a href='https://www.angelshark.in/' target="blank" style={{color:'black'}}> www.angelshark.in </a>
      </Box>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage === "Login successful!" ? "success" : "error"}
          onClose={() => setShowSnackbar(false)}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
