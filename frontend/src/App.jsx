import './App.css'
import {Dashboard} from "./pages/Dashboard.jsx";
import {SendMoney} from "./pages/SendMoney.jsx";
import {Signin} from "./pages/Signin.jsx";
import {Signup} from "./pages/Signup.jsx";
import {BrowserRouter, Route, Routes, Navigate} from "react-router-dom";

function App() {
  return <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/send" element={<SendMoney />} />
        <Route path="/signin" element={<Signin/>} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  </>
}

export default App
