import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL }/role/`;
// Fetch all role
export const getAllRoles = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};
