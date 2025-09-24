// src/components/shared/SearchBar.jsx
import React, { useEffect, useRef } from "react";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const FilterData = ({ value, onChange, autoFocusOnMount = false, fullWidth }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus when component mounts (if enabled)
    if (autoFocusOnMount && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocusOnMount]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "/" || (e.ctrlKey && e.key.toLowerCase() === "f")) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <TextField
      placeholder="Search... (ctrl+f)"
      variant="outlined"
      size="small"
      value={value}
      onChange={onChange}
      sx={{ mb: 2, width: fullWidth ? "100%" : "300px" }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      inputRef={inputRef}
    />
  );
};

export default FilterData;
