import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { motion } from "framer-motion"
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
import MensajesPanel from "./components/mensajes/MensajesPanel"

function Dashboard() {
  const [seccionActiva, setSeccionActiva] = useState("inicio")
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null)
  const [conteoInspecciones, setConteoInspecciones] = useState(0)
  const [conteoInformes, setConteoInformes] = useState(0)
  const [conteoCapacitaciones, setConteoCapacitaciones] = useState(0)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (empresaSeleccionada) {
      setCargando(true)
      cargarDatosDashboard().finally(() => setCargando(false))
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
      const qInformes = query(collection(db, "informes"), where("empresaId", "==", empresaSeleccionada.id))
      const snapInformes = await getDocs(qInformes)
      setConteoInformes(snapInformes.size)

      // Conteo de Capacitaciones (general)
      const snapCapacitaciones = await getDocs(collection(db, "capacitaciones"))
      setConteoCapacitaciones(snapCapacitaciones.size)
    } catch (error) {
      console.error("Error al cargar datos del dashboard:", error)
    }
  }

  // Configuración personalizada para los tooltips de los gráficos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-800">
          <p className="text-gray-300 text-sm font-medium">{`${label}`}</p>
          <p className="text-white font-bold">{`${payload[0].value} ${payload[0].name === "inspecciones" ? "Inspecciones" : payload[0].name
            }`}</p>
        </div>
      )
    }
    return null
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

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, nombre
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12}>
        {`${nombre} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!empresaSeleccionada) {
    return <SeleccionEmpresaPanel setEmpresaSeleccionada={setEmpresaSeleccionada} />
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar setSeccionActiva={setSeccionActiva} seccionActiva={seccionActiva} />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          {/* Encabezado con información de la empresa */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
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
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-red-500/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 group"
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
                      className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-2"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Tendencia de Inspecciones</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Últimos 6 meses</span>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dataTendencia} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorInspecciones" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                              dataKey="mes"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#6b7280", fontSize: 12 }}
                            />
                            <YAxis
                              allowDecimals={false}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#6b7280", fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                              type="monotone"
                              dataKey="inspecciones"
                              stroke="#ef4444"
                              strokeWidth={3}
                              dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                              activeDot={{ r: 6, strokeWidth: 0, fill: "#ef4444" }}
                            />
                            <CartesianGrid stroke="#f5f5f5" />
                            <area
                              type="monotone"
                              dataKey="inspecciones"
                              stroke="none"
                              fillOpacity={1}
                              fill="url(#colorInspecciones)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    {/* Gráfico de Distribución */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Distribución de Actividades</h3>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="h-72 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dataDashboard}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="cantidad"
                              nameKey="nombre"
                              label={renderCustomizedLabel}
                              labelLine={false}
                            >
                              {dataDashboard.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend
                              layout="vertical"
                              verticalAlign="middle"
                              align="right"
                              iconType="circle"
                              iconSize={10}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>

                    {/* Gráfico de Comparación General */}
                    <motion.div
                      variants={itemVariants}
                      className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-3"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Resumen General</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Datos actuales</span>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dataDashboard} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis
                              dataKey="nombre"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#6b7280", fontSize: 12 }}
                            />
                            <YAxis
                              allowDecimals={false}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: "#6b7280", fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="cantidad" barSize={60} radius={[10, 10, 0, 0]} animationDuration={1500}>
                              {dataDashboard.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
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

        </main>
      </div>
    </div>
  )
}

export default Dashboard

