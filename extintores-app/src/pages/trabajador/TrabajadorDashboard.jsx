"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookOpen, Award, User, Calendar, Clock, CheckCircle, AlertCircle, TrendingUp } from "lucide-react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"

const TrabajadorDashboard = () => {
  const [usuario] = useState(() => JSON.parse(localStorage.getItem("usuario")))
  const [cursos, setCursos] = useState([])
  const [certificados, setCertificados] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    cursosDisponibles: 0,
    cursosCompletados: 0,
    certificadosObtenidos: 0,
    promedioNotas: 0,
  })

  useEffect(() => {
    if (usuario) {
      cargarDatosTrabajador()
    }
  }, [usuario])

  const cargarDatosTrabajador = async () => {
    try {
      setLoading(true)

      // Cargar cursos disponibles para la empresa del trabajador
      const cursosQuery = query(collection(db, "cursos"), where("empresaPin", "==", usuario.empresaPin || usuario.pin))
      const cursosSnapshot = await getDocs(cursosQuery)
      const cursosData = cursosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      // Cargar certificados del trabajador
      const certificadosQuery = query(
        collection(db, "certificados"),
        where("trabajadorDni", "==", usuario.dni),
        orderBy("fechaEmision", "desc"),
      )
      const certificadosSnapshot = await getDocs(certificadosQuery)
      const certificadosData = certificadosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setCursos(cursosData)
      setCertificados(certificadosData)

      // Calcular estadísticas
      const cursosCompletados = certificadosData.length
      const promedioNotas =
        certificadosData.length > 0
          ? certificadosData.reduce((sum, cert) => sum + cert.nota, 0) / certificadosData.length
          : 0

      setStats({
        cursosDisponibles: cursosData.length,
        cursosCompletados,
        certificadosObtenidos: certificadosData.length,
        promedioNotas: Math.round(promedioNotas * 10) / 10,
      })
    } catch (error) {
      console.error("Error cargando datos del trabajador:", error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, color, description }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg p-6 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </motion.div>
  )

  const CursoCard = ({ curso }) => {
    const certificado = certificados.find((cert) => cert.cursoId === curso.id)
    const completado = !!certificado

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{curso.titulo}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{curso.descripcion}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{curso.duracion || "No especificada"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{new Date(curso.fechaCreacion?.toDate()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="ml-4">
            {completado ? (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <CheckCircle size={16} />
                <span>Completado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <AlertCircle size={16} />
                <span>Disponible</span>
              </div>
            )}
          </div>
        </div>

        {completado && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">Nota obtenida: {certificado.nota}/20</span>
              <span className="text-sm text-green-600">
                {new Date(certificado.fechaEmision?.toDate()).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => (window.location.href = `/trabajador/curso/${curso.id}`)}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            {completado ? "Ver curso" : "Iniciar curso"}
          </button>

          {completado && (
            <button
              onClick={() => window.open(`/certificado/${certificado.id}`, "_blank")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Ver certificado
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">¡Hola, {usuario?.nombre}! 👋</h1>
              <p className="text-gray-600 mt-1">
                {usuario?.cargo} en {usuario?.empresa}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">DNI</p>
                <p className="font-medium text-gray-900">{usuario?.dni}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <User className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={BookOpen}
            title="Cursos Disponibles"
            value={stats.cursosDisponibles}
            color="#dc2626"
            description="Para completar"
          />
          <StatCard
            icon={CheckCircle}
            title="Cursos Completados"
            value={stats.cursosCompletados}
            color="#16a34a"
            description="Finalizados exitosamente"
          />
          <StatCard
            icon={Award}
            title="Certificados"
            value={stats.certificadosObtenidos}
            color="#ca8a04"
            description="Obtenidos"
          />
          <StatCard
            icon={TrendingUp}
            title="Promedio"
            value={stats.promedioNotas}
            color="#2563eb"
            description="Nota promedio"
          />
        </div>

        {/* Cursos */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Mis Cursos</h2>
            <div className="text-sm text-gray-500">
              {cursos.length} curso{cursos.length !== 1 ? "s" : ""} disponible{cursos.length !== 1 ? "s" : ""}
            </div>
          </div>

          {cursos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cursos.map((curso) => (
                <CursoCard key={curso.id} curso={curso} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cursos disponibles</h3>
              <p className="text-gray-500">Contacta con tu empresa para obtener acceso a cursos de capacitación.</p>
            </div>
          )}
        </div>

        {/* Certificados recientes */}
        {certificados.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Certificados Recientes</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Curso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nota
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {certificados.slice(0, 5).map((certificado) => (
                      <tr key={certificado.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{certificado.cursoTitulo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              certificado.nota >= 16
                                ? "bg-green-100 text-green-800"
                                : certificado.nota >= 14
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {certificado.nota}/20
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(certificado.fechaEmision?.toDate()).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => window.open(`/certificado/${certificado.id}`, "_blank")}
                            className="text-red-600 hover:text-red-900"
                          >
                            Ver certificado
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrabajadorDashboard

