import React, { useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";

const ExpenseNameAutocomplete = ({ formData, setFormData }) => {
  // Load saved options from localStorage or use default list
  const [expenseNames, setExpenseNames] = useState(() => {
    const saved = localStorage.getItem("expenseNames");
    return saved
      ? JSON.parse(saved)
      : [
          "Salary",
          "Travelling",
          "Rent",
          "Printing And Stationary",
          "Telephone Exp",
          "Internet Exp",
          "Courier Exp",
          "Hotel And Lodging Exp",
          "Electricity Exp",
          "Other Exp",
          "Discount Given",
        ];
  });

  // Save updated options to localStorage
  useEffect(() => {
    localStorage.setItem("expenseNames", JSON.stringify(expenseNames));
  }, [expenseNames]);

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
    if (newName && !expenseNames.includes(newName)) {
      const updated = [...expenseNames, newName];
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
      options={expenseNames}
      renderInput={(params) => (
        <TextField {...params} label="Name of Expense" fullWidth required />
      )}
    />
    
  );
};

export default ExpenseNameAutocomplete;
