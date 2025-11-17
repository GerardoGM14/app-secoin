"use client"

import "./index.css"
import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"

// Páginas principales
import Login from "./pages/Login"
import Registro from "./pages/Registro"

// Admin Dashboard y componentes
import AdminDashboard from "./pages/admin/Dashboard"
import Configuracion from "./pages/admin/Configuracion"
import CursoDetalle from "./pages/admin/components/capacitacion/CursoDetalle"
import Evaluacion from "./pages/admin/components/capacitacion/Evaluacion"
import InspeccionPanel from "./pages/admin/components/inspeccion/InspeccionPanel"
import InformesPanel from "./pages/admin/components/informes/InformesPanel"
import GenerarCertificadoPrueba from "./pages/admin/components/certificados/GenerarCertificadoPrueba"

// Empresa Dashboard y componentes
import EmpresaDashboard from "./pages/empresa/components/dashboard/EmpresaDashboard"
import CursoDetalleEmpresa from "./pages/empresa/components/capacitacion/CursoDetalleEmpresa"
import EvaluacionEmpresa from "./pages/empresa/components/capacitacion/EvaluacionEmpresa"
import RegistroTrabajador from "./pages/empresa/components/capacitacion/RegistroTrabajador"
import ValidadorCertificado from "./pages/empresa/components/capacitacion/ValidadorCertificado"

// Trabajador Dashboard y componentes
import TrabajadorDashboard from "./pages/trabajador/TrabajadorDashboard"
import CursoTrabajador from "./pages/trabajador/CursoTrabajador"
import EvaluacionTrabajador from "./pages/trabajador/EvaluacionTrabajador"

// Páginas públicas
import RegistroTrabajadorPublico from "./pages/publico/RegistroTrabajadorPublico"
import CertificadoPorId from "./pages/publico/CertificadoPorId"

// Validación y certificados
import ValidarCertificado from "./pages/validacion/ValidarCertificado"
import ValidarCertificadoPrueba from "./pages/validacion/ValidarCertificadoPrueba"

// Certificados Demo - NUEVA IMPORTACIÓN
import CertificadosDemo from "./pages/components/certificados/CertificadosDemo"
import CertificadoVista from "./pages/components/certificados/CertificadoEditor"

function App() {
  const [usuario, setUsuario] = useState(() => {
    const local = localStorage.getItem("usuario")
    return local ? JSON.parse(local) : null
  })

  console.log("Usuario detectado:", usuario)

  return (
    <Router>
      <Routes>
        {/* ================================ */}
        {/* RUTAS PÚBLICAS */}
        {/* ================================ */}

        {/* Ruta raíz - Pantalla de login */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Registro público de trabajadores */}
        <Route path="/registro-trabajador/:pin" element={<RegistroTrabajadorPublico />} />

        {/* Validación de certificados - PÚBLICAS */}
        <Route path="/validar-certificado" element={<ValidarCertificado />} />
        <Route path="/validar-certificado/:id" element={<ValidadorCertificado />} />
        <Route path="/validar/:id" element={<CertificadoPorId />} />
        <Route path="/certificado/:id" element={<CertificadoPorId />} />

        {/* Rutas de prueba */}
        <Route path="/prueba-certificado" element={<ValidarCertificadoPrueba />} />

        {/* NUEVA RUTA - Demo de certificados */}
        <Route path="/certificados-demo" element={<CertificadosDemo />} />
        {/* Vista Previa de Certificado */}
        <Route path="/certificado" element={<CertificadoVista />} />

        {/* ================================ */}
        {/* RUTAS PROTEGIDAS - ADMINISTRADOR */}
        {/* ================================ */}

        <Route
          path="/admin/*"
          element={
            usuario?.rol === "administrador" ? (
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="herramientas" element={<Configuracion />} />
                <Route path="configuracion" element={<Configuracion />} />

                {/* Capacitación Admin */}
                <Route path="capacitacion/curso/:id" element={<CursoDetalle />} />
                <Route path="capacitacion/:id/evaluacion" element={<Evaluacion />} />

                {/* Otros módulos Admin */}
                <Route path="inspeccion" element={<InspeccionPanel />} />
                <Route path="informes" element={<InformesPanel />} />

                {/* Certificados Admin */}
                <Route path="generar-certificado" element={<GenerarCertificadoPrueba />} />

                {/* NUEVA RUTA - Demo de certificados para admin */}
                <Route path="certificados-demo" element={<CertificadosDemo />} />

                {/* Ruta por defecto */}
                <Route path="*" element={<Navigate to="/admin/dashboard" />} />
              </Routes>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* ================================ */}
        {/* RUTAS PROTEGIDAS - EMPRESA */}
        {/* ================================ */}

        <Route
          path="/empresa/*"
          element={
            usuario?.rol === "empresa" ? (
              <Routes>
                <Route index element={<EmpresaDashboard />} />
                <Route path="dashboard" element={<EmpresaDashboard />} />

                {/* Capacitación Empresa */}
                <Route path="capacitacion/curso/:id" element={<CursoDetalleEmpresa />} />
                <Route path="capacitacion/:id/evaluacion" element={<EvaluacionEmpresa />} />
                <Route path="capacitacion/registro-trabajador" element={<RegistroTrabajador />} />

                {/* Otros módulos Empresa - Placeholder por ahora */}
                <Route
                  path="inspeccion"
                  element={<div className="p-8 text-center text-gray-500">Módulo de Inspección - En desarrollo</div>}
                />
                <Route
                  path="informes"
                  element={<div className="p-8 text-center text-gray-500">Módulo de Informes - En desarrollo</div>}
                />
                <Route
                  path="administracion"
                  element={
                    <div className="p-8 text-center text-gray-500">Módulo de Administración - En desarrollo</div>
                  }
                />
                <Route
                  path="mensajes"
                  element={<div className="p-8 text-center text-gray-500">Módulo de Mensajes - En desarrollo</div>}
                />
                <Route
                  path="configuracion"
                  element={<div className="p-8 text-center text-gray-500">Módulo de Configuración - En desarrollo</div>}
                />

                {/* Ruta por defecto */}
                <Route path="*" element={<Navigate to="/empresa/dashboard" />} />
              </Routes>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* ================================ */}
        {/* RUTAS PROTEGIDAS - TRABAJADOR */}
        {/* ================================ */}

        <Route
          path="/trabajador/*"
          element={
            usuario?.rol === "trabajador" ? (
              <Routes>
                <Route index element={<TrabajadorDashboard />} />
                <Route path="dashboard" element={<TrabajadorDashboard />} />

                {/* Capacitación Trabajador */}
                <Route path="curso/:id" element={<CursoTrabajador />} />
                <Route path="evaluacion/:id" element={<EvaluacionTrabajador />} />

                {/* Certificados Trabajador - Placeholder por ahora */}
                <Route
                  path="certificados"
                  element={<div className="p-8 text-center text-gray-500">Mis Certificados - En desarrollo</div>}
                />
                <Route
                  path="perfil"
                  element={<div className="p-8 text-center text-gray-500">Mi Perfil - En desarrollo</div>}
                />

                {/* Ruta por defecto */}
                <Route path="*" element={<Navigate to="/trabajador/dashboard" />} />
              </Routes>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* ================================ */}
        {/* RUTAS DE REDIRECCIÓN POR ROL */}
        {/* ================================ */}

        {/* Redirección automática según rol */}
        <Route
          path="/dashboard"
          element={
            usuario?.rol === "administrador" ? (
              <Navigate to="/admin/dashboard" />
            ) : usuario?.rol === "empresa" ? (
              <Navigate to="/empresa/dashboard" />
            ) : usuario?.rol === "trabajador" ? (
              <Navigate to="/trabajador/dashboard" />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* ================================ */}
        {/* RUTAS LEGACY (mantener compatibilidad) */}
        {/* ================================ */}

        {/* Rutas legacy para compatibilidad - usando las rutas exactas que ya tienes */}
        <Route
          path="/admin/capacitacion/curso/:id"
          element={usuario?.rol === "administrador" ? <CursoDetalle /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/capacitacion/:id/evaluacion"
          element={usuario?.rol === "administrador" ? <Evaluacion /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/inspeccion"
          element={usuario?.rol === "administrador" ? <InspeccionPanel /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/informes"
          element={usuario?.rol === "administrador" ? <InformesPanel /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/generar-certificado"
          element={usuario?.rol === "administrador" ? <GenerarCertificadoPrueba /> : <Navigate to="/" />}
        />

        {/* Rutas legacy de validación */}
        <Route path="/validar" element={<ValidarCertificado />} />

        {/* ================================ */}
        {/* RUTA 404 - NO ENCONTRADA */}
        {/* ================================ */}

        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
                <div className="space-y-4">
                  <p className="text-gray-500">La ruta que buscas no existe.</p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => window.history.back()}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Volver atrás
                    </button>
                    <button
                      onClick={() => (window.location.href = "/")}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Ir al inicio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  )
}

export default App

