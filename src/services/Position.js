import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL }/position/`;

// Fetch all positions
export const getAllPositions = async () => {
  try {
    const response = await axios.get(API_URL);    
    return response.data;
  } catch (error) {
    console.error("Error fetching positions:", error);
    throw error;
  }
};
