import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL }/states/`;

// Fetch all Organization
export const getAllStates = async () => {
  try {    
    const response = await axios.get(API_URL);    
    return response.data;
  } catch (error) {
    console.error("Error fetching states:", error);
    throw error;
  }
};
