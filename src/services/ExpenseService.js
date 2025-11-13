import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL }/expense`;

// Fetch all Expenses
export const getAllExpensesByOrganization = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);    
    return response.data;
  } catch (error) {
    console.error("Error fetching expense:", error);
    throw error;
  }
};
// Add Expenses
export const createExpenses = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/`,data);    
    return response.data;
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
};
//update
export const updateExpense = async (id, payload) => {
 try {
     const response = await axios.put(`${BASE_URL}/${id}`, payload);     
     return response.data;
 } catch (error) {
    throw error;
 }
};
//delete
export const deleteExpense = async (id, userData) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`); // adjust path as needed
     return response.data;
  } catch (err) {
    console.error("Error deleting expense", err);
    return err.response?.status;
  }
};
