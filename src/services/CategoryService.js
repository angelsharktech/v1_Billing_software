// src/services/CategoryService.js
import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/categories`;

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// export const getCategoryTree = async () => {
//   try {
//     const response = await axios.get(`${BASE_URL}/tree`, getAuthHeader());
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching category tree:", error);
//     throw error;
//   }
// };

export const getAllCategories = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/` , getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching category :", error);
    throw error;
  }
};

export const addCategories = async (categoryData) => {
  try {
    const response = await axios.post(`${BASE_URL}/`, categoryData, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error adding category :", error);
    throw error;
  }
};

export const updateCategory = async (id, payload) => {
 try {
     const response = await axios.put(`${BASE_URL}/${id}`, payload, getAuthHeader());     
     return response.data;
 } catch (error) {
    throw error;
 }
};
export const deleteCategory = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}` , getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error deleting category :", error);
    throw error;
  }
};