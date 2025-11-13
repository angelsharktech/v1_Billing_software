import React, { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";

const IncomeNameAutocomplete = ({ formData, setFormData }) => {
  // Load saved options from localStorage or use default list
  const [IncomeNames, setExpenseNames] = useState(() => {
    const saved = localStorage.getItem("IncomeNames");
    return saved
      ? JSON.parse(saved)
      : [
          "Rent Received",
          "Commission Received",
          "Divident Received",
          "Interest Received",
          "Discount received"
        ];
  });

  // Save updated options to localStorage
  useEffect(() => {
    localStorage.setItem("IncomeNames", JSON.stringify(IncomeNames));
  }, [IncomeNames]);

  const handleChange = (event, newValue) => {
    if (typeof newValue === "string") {
      // User typed a new value manually
      addNewExpense(newValue);
    } else if (newValue && newValue.inputValue) {
      // User hit enter to create a new option
      addNewExpense(newValue.inputValue);
    } else {
      // Selected an existing one
      setFormData((prev) => ({ ...prev, name: newValue || "" }));
    }
  };

  const addNewExpense = (newName) => {
    if (newName && !IncomeNames.includes(newName)) {
      const updated = [...IncomeNames, newName];
      setExpenseNames(updated);
    }
    setFormData((prev) => ({ ...prev, name: newName }));
  };

  return (
    
    <Autocomplete
      freeSolo
      sx={{width:'200px'}}
      value={formData.name}
      onChange={handleChange}
      options={IncomeNames}
      renderInput={(params) => (
        <TextField {...params} label="Name of Expense" fullWidth required />
      )}
    />
    
  );
};

export default IncomeNameAutocomplete;
