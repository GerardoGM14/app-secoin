"use client"

import "./index.css"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import ValidarCertificado from "./pages/ValidarCertificado"
import CertificadoVista from "./pages/CertificadoVista"

function App() {
  return (
    <Router>
      <Routes>
        {/* Ruta principal - Búsqueda de certificado */}
        <Route path="/" element={<ValidarCertificado />} />
        
        {/* Ruta para ver certificado por ID */}
        <Route path="/certificado/:id" element={<CertificadoVista />} />
      </Routes>
    </Router>
  )
}

export default App

