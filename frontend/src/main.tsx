import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AdminSignup from "./admin/AdminSignup";
import "./index.css";
import Messages from "./admin/Messages";


function MotionPreference() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => document.documentElement.classList.toggle("reduced-motion", mq.matches);
    set(); mq.addEventListener("change", set); return () => mq.removeEventListener("change", set);
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionPreference/>
      <Routes>
        <Route path="*" element={<App/>}/>
        <Route path="/admin/login" element={<AdminLogin/>}/>
        <Route path="/admin" element={<AdminDashboard/>}/>
        <Route path="/admin/signup" element={<AdminSignup/>}/>
        <Route path="/admin/messages" element={<Messages />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
