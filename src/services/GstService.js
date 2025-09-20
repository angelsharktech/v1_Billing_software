import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ;
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const createGstDetails = async (id,data)=>{
    try {
    const response = await axios.post(`${BASE_URL}/gst/${id}/register`,data, getAuthHeader());
    return response.data; 
    } catch (error) {        
       return error.response.data.error; 
    }
}
export const getGstDetails = async (id)=>{
    try {
    const response = await axios.get(`${BASE_URL}/gst/user/${id}`, getAuthHeader());
    return response.data; 
    } catch (error) {
       return error; 
    }
}