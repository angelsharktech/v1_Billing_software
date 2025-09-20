import React, { useEffect } from 'react'
import { useNavigate } from "react-router-dom";

const LogOut = () => {
    const navigate = useNavigate();
    useEffect(()=>{
        const handleLogout = () => {
          localStorage.removeItem("token");
          navigate("/login");
        };
        handleLogout();
    })
  return (
   <>
   </>
  )
}

export default LogOut