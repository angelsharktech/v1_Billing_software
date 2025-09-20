import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/products`;

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};
export const getAllProducts = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/` , getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching Product :", error);
    throw error;
  }
};
export const addProducts = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/` ,data, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching Product :", error);
    throw error;
  }
};
export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}` , getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching Product :", error);
    throw error;
  }
};
//barcode api 
export const getProductByBarcode = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/hsn/${id}` , getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching Product :", error);
    throw error;
  }
};
export const updateProductById = async (id , data) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, data , getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching Product :", error);
    throw error;
  }
};
export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}` , getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error fetching Product :", error);
    throw error;
  }
};

export const updateInventory = async (id, data) => {
  try {
    const response = await axios.put(`${BASE_URL}/${id}/inventory`, data, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error updating inventory for Product :", error);
    throw error;
  }
};
