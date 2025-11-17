"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Play, CheckCircle, Clock, BookOpen, Award, FileText } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"

const CursoTrabajador = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [usuario] = useState(() => JSON.parse(localStorage.getItem("usuario")))
  const [curso, setCurso] = useState(null)
  const [sesiones, setSesiones] = useState([])
  const [certificado, setCertificado] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarCurso()
  }, [id])

  const cargarCurso = async () => {
    try {
      setLoading(true)

      // Cargar curso
      const cursoDoc = await getDoc(doc(db, "cursos", id))
      if (cursoDoc.exists()) {
        const cursoData = { id: cursoDoc.id, ...cursoDoc.data() }
        setCurso(cursoData)

        // Cargar sesiones
        const sesionesQuery = query(collection(db, "sesiones"), where("cursoId", "==", id))
        const sesionesSnapshot = await getDocs(sesionesQuery)
        const sesionesData = sesionesSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => a.orden - b.orden)
        setSesiones(sesionesData)

        // Verificar si ya tiene certificado
        const certificadosQuery = query(
          collection(db, "certificados"),
          where("cursoId", "==", id),
          where("trabajadorDni", "==", usuario.dni),
        )
        const certificadosSnapshot = await getDocs(certificadosQuery)
        if (!certificadosSnapshot.empty) {
          setCertificado(certificadosSnapshot.docs[0].data())
        }
      }
    } catch (error) {
      console.error("Error cargando curso:", error)
    } finally {
      setLoading(false)
    }
  }

  const iniciarEvaluacion = () => {
    navigate(`/trabajador/evaluacion/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando curso...</p>
        </div>
      </div>
    )
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Curso no encontrado</h2>
          <button
            onClick={() => navigate("/trabajador/dashboard")}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate("/trabajador/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{curso.titulo}</h1>
              <p className="text-gray-600 mt-1">{curso.descripcion}</p>
            </div>
            {certificado && (
              <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <Award size={16} />
                <span className="font-medium">Completado</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{curso.duracion || "Duración no especificada"}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen size={16} />
              <span>
                {sesiones.length} sesión{sesiones.length !== 1 ? "es" : ""}
              </span>
            </div>
            {certificado && (
              <div className="flex items-center gap-1">
                <CheckCircle size={16} />
                <span>Nota: {certificado.nota}/20</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del curso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Información del curso</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 leading-relaxed">
              {curso.descripcion ||
                "Este curso te proporcionará los conocimientos necesarios para desarrollar tus habilidades profesionales."}
            </p>
          </div>

          {curso.objetivos && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Objetivos del curso:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                {curso.objetivos.split("\n").map((objetivo, index) => (
                  <li key={index}>{objetivo}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Sesiones del curso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Contenido del curso</h2>

          {sesiones.length > 0 ? (
            <div className="space-y-4">
              {sesiones.map((sesion, index) => (
                <div
                  key={sesion.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{sesion.titulo}</h3>
                      <p className="text-gray-600 text-sm mb-3">{sesion.descripcion}</p>

                      {sesion.duracion && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{sesion.duracion}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No hay sesiones disponibles para este curso.</p>
            </div>
          )}
        </motion.div>

        {/* Evaluación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Evaluación final</h2>

          {certificado ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Award className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">¡Evaluación completada!</h3>
                  <p className="text-green-700">Has obtenido una nota de {certificado.nota}/20</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => window.open(`/certificado/${certificado.id}`, "_blank")}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Ver certificado
                </button>
                <button
                  onClick={iniciarEvaluacion}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Ver evaluación
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Play className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Evaluación disponible</h3>
                  <p className="text-blue-700">Completa la evaluación para obtener tu certificado</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-2">Instrucciones:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• La evaluación consta de preguntas sobre el contenido del curso</li>
                    <li>• Necesitas obtener al menos 14/20 para aprobar</li>
                    <li>• Una vez iniciada, debes completarla en una sola sesión</li>
                    <li>• Al aprobar, recibirás tu certificado automáticamente</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={iniciarEvaluacion}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Play size={20} />
                Iniciar evaluación
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default CursoTrabajador
