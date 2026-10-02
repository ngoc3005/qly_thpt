import "./App.css";
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Alert } from "./components/Alert";
import { Home } from "./components/Home";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { LopPage } from "./components/LopPage";
import { HocSinhPage } from "./components/HocSinhPage";
import { MonHocPage } from "./components/MonHocPage";
import { GiaoVienPage } from "./components/GiaoVienPage";
import { DiemPage } from "./components/DiemPage";
import { About } from "./components/About";
import Footer from "./components/Footer";
import { isLoggedIn } from "./api";

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function App() {
  const [alert, setAlert] = useState(null);
  const showAlert = (type, message) => {
    setAlert({ type, msg: message });
    setTimeout(() => setAlert(null), 2500);
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <Alert alert={alert} />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home showAlert={showAlert} />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login showAlert={showAlert} />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/quanly/lop"
              element={
                <PrivateRoute>
                  <LopPage showAlert={showAlert} />
                </PrivateRoute>
              }
            />
            <Route
              path="/quanly/hocsinh"
              element={
                <PrivateRoute>
                  <HocSinhPage showAlert={showAlert} />
                </PrivateRoute>
              }
            />
            <Route
              path="/quanly/monhoc"
              element={
                <PrivateRoute>
                  <MonHocPage showAlert={showAlert} />
                </PrivateRoute>
              }
            />
            <Route
              path="/quanly/giaovien"
              element={
                <PrivateRoute>
                  <GiaoVienPage showAlert={showAlert} />
                </PrivateRoute>
              }
            />
            <Route
              path="/quanly/diem"
              element={
                <PrivateRoute>
                  <DiemPage showAlert={showAlert} />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
