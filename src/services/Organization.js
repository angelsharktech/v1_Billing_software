import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL }/organization/`;

// Fetch all Organization
export const getAllOrganization = async () => {
  try {    
    const response = await axios.get(API_URL);    
    return response.data;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    throw error;
  }
};
export const getOrganizationById = async (id) => {
  try {    
    const response = await axios.get(`${API_URL}${id}`);    
    return response.data;
  } catch (error) {
    console.error("Error fetching single organization:", error);
    throw error;
  }
};
export const UpdateOrganization = async (id,data) => {
  try {    
    const response = await axios.put(`${API_URL}${id}`,data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });    
    return response.data;
  } catch (error) {
    console.error("Error updating organization:", error);
    throw error;
  }
};
