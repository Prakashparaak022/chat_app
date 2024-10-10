import "./App.css";
import "./particles.css";
import { Chat } from "./pages/Chat";
import SignIn from "./pages/SignIn";
import React from "react";
import SignUp from "./pages/SignUp";
import PrivateRoutes from "./PrivateRoutes";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<PrivateRoutes />}>
            <Route path="/chat" element={<Chat />} />
          </Route>
          <Route path="/" element={<SignIn />} />
          <Route path="/signUp" element={<SignUp />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
