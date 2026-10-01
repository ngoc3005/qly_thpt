import './App.css';
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Alert } from './components/Alert';
import { Signup } from './components/SignUp';
import { Home } from './components/Home';
import { LopHoc } from './components/LopHoc';
import { HocSinhLop } from './components/HocSinhLop';
import { HocSinhDangHoc } from './components/HocSinhDangHoc';
import Footer from './components/Footer';
import KetQuaCuaToi from './components/KetQuaCuaToi';
import { About } from './components/About';
import { TaoLop } from './components/TaoLop';
import { MonHocPage } from './components/MonHocPage';

function App() {
  const [alert, setAlert] = useState(null);
  const showAlert = (type, message) => {
    setAlert({
      type: type,
      msg: message
    })
    setTimeout(() => {
      setAlert(null);
    }, 2000);
  }
  return (
    <>
      <BrowserRouter>

        <Navbar />
        <Alert alert={alert} />
        <Routes>
          <Route path="/" element={<Home showAlert={showAlert} />} />
          <Route exact path="/gioithieu" element={<About />} />
          <Route exact path="/lop" element={<LopHoc />} />
          <Route exact path="/taolop" element={<TaoLop showAlert={showAlert} />} />
          <Route exact path="/hocsinh" element={<HocSinhDangHoc showAlert={showAlert} />} />
          <Route exact path="/lop/:lopId" element={<HocSinhLop showAlert={showAlert} />} />
          <Route exact path="/ketqua" element={<KetQuaCuaToi showAlert={showAlert} />} />
          <Route exact path="/monhoc" element={<MonHocPage showAlert={showAlert} />} />

          <Route exact path="/login" element={<Login showAlert={showAlert} />} />
          <Route exact path="/signup" element={<Signup showAlert={showAlert} />} />
        </Routes>
        <Footer />

      </BrowserRouter>
    </>
  );
}

export default App;
