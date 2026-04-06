import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { motion } from "framer-motion"
import { AmChartArea, AmChartPie, AmChartBar } from "./components/DashboardCharts"
import Sidebar from "./components/Sidebar"
import Topbar from "./components/Topbar"
import ConfiguracionPanel from "./components/ConfiguracionPanel"
import CapacitacionPanel from "./components/capacitacion/CapacitacionPanel"
import SeleccionEmpresaPanel from "./components/SeleccionEmpresaPanel"
import InspeccionPanel from "./components/inspeccion/InspeccionPanel"
import EditarEmpresaPanel from "./components/herramientas/EditarEmpresaPanel"
import InformesPanel from "./components/informes/InformesPanel"
import CotizacionesPanel from "./components/administracion/CotizacionesPanel"
import OrdenesCompraPanel from "./components/administracion/OrdenesCompraPanel"
import GuiasRemisionPanel from "./components/administracion/GuiasRemisionPanel"
import ActasConformidadPanel from "./components/administracion/ActasConformidadPanel"
import InformesDetalladosPanel from "./components/administracion/InformesDetalladosPanel"
import FacturasPanel from "./components/administracion/FacturasPanel"
import CertificadoOp from "./components/administracion/CertificadoOp"
import GuiasPrestamoPanel from "./components/administracion/GuiasPrestamoPanel"
import MonitoreoUsuariosPanel from "./components/monitoreo/MonitoreoUsuariosPanel"
import MensajesPanel from "./components/mensajes/MensajesPanel"

function Dashboard() {
  const [seccionActiva, setSeccionActiva] = useState("inicio")
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(() => {
    const local = localStorage.getItem("empresaSeleccionadaAdmin")
    return local ? JSON.parse(local) : null
  })
  const [conteoInspecciones, setConteoInspecciones] = useState(0)
  const [conteoInformes, setConteoInformes] = useState(0)
  const [conteoCapacitaciones, setConteoCapacitaciones] = useState(0)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (empresaSeleccionada) {
      localStorage.setItem("empresaSeleccionadaAdmin", JSON.stringify(empresaSeleccionada))
      setCargando(true)
      cargarDatosDashboard().finally(() => setCargando(false))
    } else {
      localStorage.removeItem("empresaSeleccionadaAdmin")
    }
  }, [empresaSeleccionada])

  const cerrarSesionEmpresa = () => {
    setEmpresaSeleccionada(null)
  }

  const dataDashboard = [
    { nombre: "Inspecciones", cantidad: conteoInspecciones, color: "#ef4444" },
    { nombre: "Informes", cantidad: conteoInformes, color: "#10b981" },
    { nombre: "Capacitaciones", cantidad: conteoCapacitaciones, color: "#8b5cf6" },
  ]

  // Datos para el gráfico de tendencia (simulados)
  const dataTendencia = [
    { mes: "Ene", inspecciones: Math.floor(Math.random() * 10) },
    { mes: "Feb", inspecciones: Math.floor(Math.random() * 10) },
    { mes: "Mar", inspecciones: Math.floor(Math.random() * 10) },
    { mes: "Abr", inspecciones: Math.floor(Math.random() * 10) },
    { mes: "May", inspecciones: Math.floor(Math.random() * 10) },
    { mes: "Jun", inspecciones: conteoInspecciones },
  ]

  const cargarDatosDashboard = async () => {
    if (!empresaSeleccionada?.id) return

    try {
      // Conteo de Inspecciones
      const qInspecciones = query(collection(db, "inspecciones"), where("empresaId", "==", empresaSeleccionada.id))
      const snapInspecciones = await getDocs(qInspecciones)
      setConteoInspecciones(snapInspecciones.size)

      // Conteo de Informes
      // Buscar por empresaId primero, si no hay resultados, buscar por empresaCorreo
      const qInformes = query(collection(db, "informes"), where("empresaId", "==", empresaSeleccionada.id))
      const snapInformes = await getDocs(qInformes)
      
      // Si no hay resultados con empresaId, intentar con empresaCorreo
      let conteoInformes = snapInformes.size
      if (conteoInformes === 0 && empresaSeleccionada.correo) {
        const qInformesCorreo = query(collection(db, "informes"), where("empresaCorreo", "==", empresaSeleccionada.correo))
        const snapInformesCorreo = await getDocs(qInformesCorreo)
        conteoInformes = snapInformesCorreo.size
      }
      
      setConteoInformes(conteoInformes)

      // Conteo de Capacitaciones (general)
      const snapCapacitaciones = await getDocs(collection(db, "capacitaciones"))
      setConteoCapacitaciones(snapCapacitaciones.size)
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error)
    }
  }

  // Animación para los elementos del dashboard
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  if (!empresaSeleccionada) {
    return <SeleccionEmpresaPanel setEmpresaSeleccionada={setEmpresaSeleccionada} />
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar setSeccionActiva={setSeccionActiva} seccionActiva={seccionActiva} />
      
      {/* Contenedor Principal (Derecho) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        
        {/* Área de Contenido con Scroll Independiente */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {/* Encabezado con información de la empresa */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold shadow-md">
                {empresaSeleccionada?.correo?.charAt(0).toUpperCase() || "E"}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Gestionando datos de:</h2>
                <p className="text-red-600 font-medium">{empresaSeleccionada?.correo}</p>
              </div>
            </div>
            <button
              onClick={cerrarSesionEmpresa}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-red-500/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 group cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Cerrar sesión de empresa
            </button>
          </div>

          {seccionActiva === "inicio" && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              {cargando ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-600 font-medium">Cargando datos...</p>
                </div>
              ) : (
                <>
                  {/* Tarjetas de estadísticas */}
                  <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {/* Tarjeta 1 - Inspecciones */}
                    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-6 -mt-6 group-hover:bg-red-500/10 transition-colors duration-300"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Inspecciones Subidas</p>
                          <h3 className="text-3xl font-bold text-gray-800">{conteoInspecciones}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center text-sm">
                          <span className="text-green-500 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                            12%
                          </span>
                          <span className="text-gray-500 ml-2">desde el mes pasado</span>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta 2 - Informes */}
                    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -mr-6 -mt-6 group-hover:bg-green-500/10 transition-colors duration-300"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Informes Cargados</p>
                          <h3 className="text-3xl font-bold text-gray-800">{conteoInformes}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center text-sm">
                          <span className="text-green-500 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                            8%
                          </span>
                          <span className="text-gray-500 ml-2">desde el mes pasado</span>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta 3 - Capacitaciones */}
                    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-6 -mt-6 group-hover:bg-purple-500/10 transition-colors duration-300"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-1">Capacitaciones Activas</p>
                          <h3 className="text-3xl font-bold text-gray-800">{conteoCapacitaciones}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center text-sm">
                          <span className="text-green-500 flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                              />
                            </svg>
                            5%
                          </span>
                          <span className="text-gray-500 ml-2">desde el mes pasado</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Gráficos */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Gráfico de Tendencia de Inspecciones */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 lg:col-span-2 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full -mr-32 -mt-32"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-8">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Tendencia de Inspecciones</h3>
                            <p className="text-sm text-gray-500">Evolución mensual de inspecciones</p>
                          </div>
                          <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs font-medium text-gray-700">Últimos 6 meses</span>
                          </div>
                        </div>
                        <div className="h-80">
                           <AmChartArea data={dataTendencia} />
                        </div>
                      </div>
                    </motion.div>

                    {/* Gráfico de Distribución */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full -mr-24 -mt-24"></div>
                      <div className="relative z-10">
                        <div className="mb-8">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">Distribución de Actividades</h3>
                          <p className="text-sm text-gray-500">Proporción de actividades</p>
                        </div>
                        <div className="h-80 flex items-center justify-center">
                           <AmChartPie data={dataDashboard} />
                        </div>
                      </div>
                    </motion.div>

                    {/* Gráfico de Comparación General */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 lg:col-span-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-48 -mt-48"></div>
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-8">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Resumen General</h3>
                            <p className="text-sm text-gray-500">Comparación de todas las actividades</p>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                            <span className="text-xs font-medium text-gray-600">Datos actuales</span>
                          </div>
                        </div>
                        <div className="h-80">
                           <AmChartBar data={dataDashboard} />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {seccionActiva === "capacitacion" && <CapacitacionPanel empresaSeleccionada={empresaSeleccionada} />}
          {seccionActiva === "inspeccion" && <InspeccionPanel empresaSeleccionada={empresaSeleccionada} />}
          {seccionActiva === "herramientas" && <ConfiguracionPanel visible={true} />}
          {seccionActiva === "herramientas-sistema" && <ConfiguracionPanel visible={true} />}
          {seccionActiva === "herramientas-editar-empresa" && (
            <EditarEmpresaPanel empresaId={empresaSeleccionada?.id} />
          )}
          {seccionActiva === "informes" && <InformesPanel empresaSeleccionada={empresaSeleccionada} />}
          {seccionActiva === "administracion-cotizaciones" && (
            <CotizacionesPanel empresaSeleccionada={empresaSeleccionada} />
          )}
          {seccionActiva === "administracion-ordenes" && (
            <OrdenesCompraPanel empresaSeleccionada={empresaSeleccionada} />
          )}
          {seccionActiva === "administracion-guias" && <GuiasRemisionPanel empresaSeleccionada={empresaSeleccionada} />}
          {seccionActiva === "administracion-actas" && (
            <ActasConformidadPanel empresaSeleccionada={empresaSeleccionada} />
          )}
          {seccionActiva === "administracion-informes" && (
            <InformesDetalladosPanel empresaSeleccionada={empresaSeleccionada} />
          )}
          {seccionActiva === "administracion-prestamo" && (
            <GuiasPrestamoPanel empresaSeleccionada={empresaSeleccionada} />
          )}
          {seccionActiva === "mensajes" && <MensajesPanel />}

          {seccionActiva === "administracion-facturas" && (
            <FacturasPanel empresaSeleccionada={empresaSeleccionada} />
          )}

          {seccionActiva === "administracion-certificado" && (
            <CertificadoOp empresaSeleccionada={empresaSeleccionada} />
          )}

          {seccionActiva === "monitoreo" && <MonitoreoUsuariosPanel />}

        </main>
      </div>
    </div>
  )
}

export default Dashboard
