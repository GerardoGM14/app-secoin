"use client"

import Sidebar from "./components/Sidebar"
import Topbar from "./components/Topbar"
import MonitoreoUsuariosPanel from "./components/monitoreo/MonitoreoUsuariosPanel"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Monitoreo() {
  const [seccionActiva, setSeccionActiva] = useState("monitoreo")
  const navigate = useNavigate()

  // Manejar navegación desde el sidebar
  const handleSeccionChange = (seccion) => {
    if (seccion === "inicio") {
      navigate("/admin/dashboard")
    } else if (seccion === "inspeccion") {
      navigate("/admin/inspeccion")
    } else if (seccion === "informes") {
      navigate("/admin/informes")
    } else if (seccion === "capacitacion") {
      navigate("/admin/dashboard")
    } else if (seccion === "mensajes") {
      navigate("/admin/dashboard")
    } else if (seccion === "administracion") {
      navigate("/admin/dashboard")
    } else if (seccion === "herramientas-sistema" || seccion === "herramientas-editar-empresa") {
      navigate("/admin/configuracion")
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar setSeccionActiva={handleSeccionChange} seccionActiva={seccionActiva} />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <MonitoreoUsuariosPanel />
        </main>
      </div>
    </div>
  )
}

export default Monitoreo

