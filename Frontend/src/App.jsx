import React from "react";
import "./App.css";
import { Routes, BrowserRouter as Router, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Authontication from "./pages/Authontication.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import VideoMeet from "./pages/VideoMeet.jsx";
import Home from "./pages/Home.jsx";
import History from "./pages/History.jsx";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Authontication />} />
          <Route path="/home/:url" element={<VideoMeet/>}/>
          <Route path="/home" element={<Home/>}/>
          <Route path="/history" element={<History/>}/>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
