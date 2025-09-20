import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL }/quotation/`;

// Fetch all Quotation
export const getQuotationsByOrganization = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}organization/${id}`);    
    return response.data;
  } catch (error) {
    console.error("Error fetching quotation:", error);
    throw error;
  }
};
export const addQuotation = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}` ,data);
    return response.data;
  } catch (error) {
    console.error("Error adding quotation :", error);
    throw error;
  }
};
export const getQuotationById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}${id}`);    
    return response.data;
  } catch (error) {
    console.error("Error fetching quotation:", error);
    throw error;
  }
};
export const updateQuotation = async (id, payload) => {
 try {
     const response = await axios.put(`${BASE_URL}${id}`, payload);     
     return response.data;
 } catch (error) {
    throw error;
 }
};
export const generateQuotationNoByOrganization = async (id) => {
  try {
    
    const response = await axios.get(`${BASE_URL}quote/${id}`);    
    return response.data;
  } catch (error) {
    console.error("Error fetching quotation number:", error);
    throw error;
  }
};