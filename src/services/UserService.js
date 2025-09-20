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
// Register user
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error.response?.data.error || { message: "Registration error" };
  }
};

// User Create
export const createUser = async (userData) => {
  try {
    const response = await axios.post(`${BASE_URL}/user`, userData);
    return response;
  } catch (error) {
    console.error("user creation error:", error);   
    throw error.response?.data.error || { message: "user creation error" };
  }
};
// Login user
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error.response?.data || { message: "Server error" };
  }
};

//All User
export const getAllUser = async() =>{
  try {
    const response = await axios.get(`${BASE_URL}/user`);
    return response.data;
  } catch (error) {
     throw error.response?.data || { message: "error geting all users" };
  }
}

export const getUserById = async(id) =>{
  try{
    const response = await axios.get(`${BASE_URL}/user/${id}`)
    return response.data;
  }catch(error) {
    throw error.response?.data || { message: "error geting all users" };
  }
}
export const getUserByOrganizastionId = async(id) =>{
  try{
    const response = await axios.get(`${BASE_URL}/user/organization/${id}`)
    return response.data;
  }catch(error) {
    throw error.response?.data || { message: "error geting all users sorted by organizations" };
  }
}

export const updateUser = async (id, userData) => {
  try {
    const response = await axios.patch(`${BASE_URL}/user/${id}`, userData ,getAuthHeader()); // adjust path as needed
     return response.data;
  } catch (err) {
    console.error("Error updating user", err);
    return err.response?.status;
  }
};
export const deleteUser = async (id, userData) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}` ,getAuthHeader()); // adjust path as needed
     return response.data;
  } catch (err) {
    console.error("Error deleting user", err);
    return err.response?.status;
  }
};


