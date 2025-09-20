import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL }/paymentMode/`;

export const addPayment = async (data) => {
  try {    
    const response = await axios.post(API_URL ,data);
    return response.data;
  } catch (error) {
    console.error("Error adding Payment :", error.response.data);
    return error.response.data;
  }
};
export const updatePayment = async (id, data) => {
  try {
    const response = await axios.patch(`${API_URL}${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating payment bill:", error);
    return error;
  }
};
export const getPaymentByOrganization = async (id) => {
  try {
    const response = await axios.get(`${API_URL}organization/${id}`);
    
    return response.data;
  } catch (error) {
    console.error("Error getting purchase bill:", error);
    return error;
  }
};