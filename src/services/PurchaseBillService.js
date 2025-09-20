import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/purchasebills/`;
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const addPurchaseBill = async (billData) => {
  try {    
    const response = await axios.post(BASE_URL, billData, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error adding purchase bill:", error.response?.data );
    return error.response?.data;
  }
};
export const getAllPurchaseBills = async () => {
  try {
    const response = await axios.get(`${BASE_URL}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error getting purchase bill:", error);
    return response.data;
  }
};
export const getPurchaseBillById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}${id}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error getting purchase bill:", error);
    return error;
  }
};
export const getPurchaseBillByOrganization = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}organization/${id}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error getting purchase bill:", error);
    return error;
  }
};

export const updatePurchaseBill = async (id, data) => {
  try {
    const response = await axios.put(`${BASE_URL}${id}`, data,getAuthHeader());
    return response.data;
  } catch (error) {
    console.error("Error updating purchase bill:", error);
    return error;
  }
};
export const deletePurchaseBill = async(id) =>{
  try {
    
     const response = await axios.delete(`${BASE_URL}${id}`,getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error deleting purchase bill:', error);
    return error;
  }
};
export const cancelPurchaseBill = async(id , status) =>{
  try {
     const response = await axios.put(`${BASE_URL}cancel/${id}`,status,getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error cancel purchase bill:', error);
    return error;
  }
}