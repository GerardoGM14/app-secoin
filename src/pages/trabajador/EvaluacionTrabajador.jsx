"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Award, RefreshCw } from "lucide-react"
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import CertificadoGenerator from "../empresa/components/capacitacion/CertificadoGenerator.jsx"

const EvaluacionTrabajador = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [usuario] = useState(() => JSON.parse(localStorage.getItem("usuario")))
  const [curso, setCurso] = useState(null)
  const [evaluacion, setEvaluacion] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [respuestas, setRespuestas] = useState({})
  const [certificadoExistente, setCertificadoExistente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [evaluando, setEvaluando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [tiempoRestante, setTiempoRestante] = useState(null)
  const [evaluacionIniciada, setEvaluacionIniciada] = useState(false)

  useEffect(() => {
    cargarEvaluacion()
  }, [id])

  useEffect(() => {
    let interval
    if (evaluacionIniciada && tiempoRestante > 0) {
      interval = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            finalizarEvaluacion()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [evaluacionIniciada, tiempoRestante])

  const cargarEvaluacion = async () => {
    try {
      setLoading(true)

      // Cargar curso
      const cursoDoc = await getDoc(doc(db, "cursos", id))
      if (cursoDoc.exists()) {
        const cursoData = { id: cursoDoc.id, ...cursoDoc.data() }
        setCurso(cursoData)

        // Cargar evaluación
        const evaluacionesQuery = query(collection(db, "evaluaciones"), where("cursoId", "==", id))
        const evaluacionesSnapshot = await getDocs(evaluacionesQuery)

        if (!evaluacionesSnapshot.empty) {
          const evaluacionData = evaluacionesSnapshot.docs[0].data()
          setEvaluacion(evaluacionData)
          setPreguntas(evaluacionData.preguntas || [])
          setTiempoRestante(evaluacionData.tiempoLimite * 60) // Convertir a segundos
        }

        // Verificar certificado existente
        const certificadosQuery = query(
          collection(db, "certificados"),
          where("cursoId", "==", id),
          where("trabajadorDni", "==", usuario.dni),
        )
        const certificadosSnapshot = await getDocs(certificadosQuery)
        if (!certificadosSnapshot.empty) {
          setCertificadoExistente({
            id: certificadosSnapshot.docs[0].id,
            ...certificadosSnapshot.docs[0].data(),
          })
        }
      }
    } catch (error) {
      console.error("Error cargando evaluación:", error)
    } finally {
      setLoading(false)
    }
  }

  const iniciarEvaluacion = () => {
    setEvaluacionIniciada(true)
    setRespuestas({})
  }

  const manejarRespuesta = (preguntaIndex, opcionIndex) => {
    setRespuestas((prev) => ({
      ...prev,
      [preguntaIndex]: opcionIndex,
    }))
  }

  const finalizarEvaluacion = async () => {
    setEvaluando(true)

    try {
      // Calcular puntaje
      let correctas = 0
      preguntas.forEach((pregunta, index) => {
        if (respuestas[index] === pregunta.respuestaCorrecta) {
          correctas++
        }
      })

      const nota = Math.round((correctas / preguntas.length) * 20 * 100) / 100
      const aprobado = nota >= 14

      const resultadoData = {
        nota,
        correctas,
        total: preguntas.length,
        aprobado,
        porcentaje: Math.round((correctas / preguntas.length) * 100),
      }

      setResultado(resultadoData)

      // Si aprobó, generar certificado
      if (aprobado) {
        const certificadoData = {
          cursoId: id,
          cursoTitulo: curso.titulo,
          trabajadorNombre: usuario.nombre,
          trabajadorDni: usuario.dni,
          trabajadorCargo: usuario.cargo,
          empresaNombre: usuario.empresa,
          empresaPin: usuario.empresaPin || usuario.pin,
          nota: nota,
          fechaEmision: serverTimestamp(),
          estado: "activo",
        }

        const certificadoRef = await addDoc(collection(db, "certificados"), certificadoData)
        setCertificadoExistente({
          id: certificadoRef.id,
          ...certificadoData,
        })
      }
    } catch (error) {
      console.error("Error finalizando evaluación:", error)
    } finally {
      setEvaluando(false)
    }
  }

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60)
    const segs = segundos % 60
    return `${minutos.toString().padStart(2, "0")}:${segs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (!curso || !evaluacion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Evaluación no disponible</h2>
          <button
            onClick={() => navigate(`/trabajador/curso/${id}`)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver al curso
          </button>
        </div>
      </div>
    )
  }

  // Si ya tiene certificado, mostrar resultado
  if (certificadoExistente && !resultado) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="text-green-600" size={32} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Evaluación ya completada!</h1>
            <p className="text-gray-600 mb-6">
              Ya has completado esta evaluación con una nota de {certificadoExistente.nota}/20
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(`/trabajador/curso/${id}`)}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Volver al curso
              </button>
              <button
                onClick={() => window.open(`/certificado/${certificadoExistente.id}`, "_blank")}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Ver certificado
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar resultado final
  if (resultado) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                resultado.aprobado ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {resultado.aprobado ? (
                <CheckCircle className="text-green-600" size={32} />
              ) : (
                <AlertCircle className="text-red-600" size={32} />
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {resultado.aprobado ? "¡Felicitaciones!" : "No aprobaste"}
            </h1>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{resultado.nota}/20</p>
                  <p className="text-sm text-gray-600">Nota final</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {resultado.correctas}/{resultado.total}
                  </p>
                  <p className="text-sm text-gray-600">Respuestas correctas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{resultado.porcentaje}%</p>
                  <p className="text-sm text-gray-600">Porcentaje</p>
                </div>
              </div>
            </div>

            {resultado.aprobado ? (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Has aprobado la evaluación. Tu certificado se ha generado automáticamente.
                </p>
                {certificadoExistente && (
                  <CertificadoGenerator certificadoData={certificadoExistente} mostrarBoton={true} />
                )}
              </div>
            ) : (
              <p className="text-gray-600 mb-6">Necesitas al menos 14/20 para aprobar. Puedes intentarlo nuevamente.</p>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(`/trabajador/curso/${id}`)}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Volver al curso
              </button>
              {!resultado.aprobado && (
                <button
                  onClick={() => {
                    setResultado(null)
                    setEvaluacionIniciada(false)
                    setRespuestas({})
                    setTiempoRestante(evaluacion.tiempoLimite * 60)
                  }}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={20} />
                  Intentar de nuevo
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/trabajador/curso/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={evaluacionIniciada}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Evaluación: {curso.titulo}</h1>
                <p className="text-gray-600">
                  {preguntas.length} pregunta{preguntas.length !== 1 ? "s" : ""} • Nota mínima: 14/20
                </p>
              </div>
            </div>

            {evaluacionIniciada && (
              <div className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
                <Clock size={16} />
                <span className="font-mono font-bold">{formatearTiempo(tiempoRestante)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!evaluacionIniciada ? (
          // Pantalla de inicio
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Estás listo para la evaluación?</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-4">Instrucciones importantes:</h3>
              <ul className="text-left text-blue-800 space-y-2">
                <li>Tienes {evaluacion.tiempoLimite} minutos para completar la evaluación</li>
                <li>La evaluación consta de {preguntas.length} preguntas</li>
                <li>Necesitas obtener al menos 14/20 para aprobar</li>
                <li>Una vez iniciada, no podrás pausar la evaluación</li>
                <li>Al aprobar, recibirás tu certificado automáticamente</li>
              </ul>
            </div>

            <button
              onClick={iniciarEvaluacion}
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg"
            >
              Iniciar evaluación
            </button>
          </motion.div>
        ) : (
          // Evaluación en progreso
          <div className="space-y-6">
            {preguntas.map((pregunta, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">{pregunta.pregunta}</h3>
                </div>

                <div className="ml-12 space-y-3">
                  {pregunta.opciones.map((opcion, opcionIndex) => (
                    <label
                      key={opcionIndex}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        respuestas[index] === opcionIndex
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`pregunta-${index}`}
                        value={opcionIndex}
                        checked={respuestas[index] === opcionIndex}
                        onChange={() => manejarRespuesta(index, opcionIndex)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                          respuestas[index] === opcionIndex ? "border-red-500 bg-red-500" : "border-gray-300"
                        }`}
                      >
                        {respuestas[index] === opcionIndex && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-gray-700">{opcion}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            ))}

            {/* Botón finalizar */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-600 mb-4">
                Respuestas completadas: {Object.keys(respuestas).length}/{preguntas.length}
              </p>

              <button
                onClick={finalizarEvaluacion}
                disabled={Object.keys(respuestas).length !== preguntas.length || evaluando}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {evaluando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Evaluando...
                  </>
                ) : (
                  "Finalizar evaluación"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EvaluacionTrabajador

