"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { db } from "../../firebase/firebaseConfig"
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import CuestionarioRender from "../admin/components/capacitacion/CuestionarioRender"
import Swal from "sweetalert2"

function EvaluacionPublica() {
  const { cursoId, cuestionarioId } = useParams()
  const navigate = useNavigate()

  const [cuestionario, setCuestionario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarFormularioAcceso, setMostrarFormularioAcceso] = useState(true)
  const [mostrarFormularioUsuario, setMostrarFormularioUsuario] = useState(false)
  const [mostrarCuestionario, setMostrarCuestionario] = useState(false)
  const [mostrarInfo, setMostrarInfo] = useState(false)
  const [mostrarMensajeFinal, setMostrarMensajeFinal] = useState(false)

  // Estados para formulario de acceso
  const [pinIngresado, setPinIngresado] = useState("")
  const [errorPin, setErrorPin] = useState("")

  // Estados para formulario de usuario
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [dniUsuario, setDniUsuario] = useState("")
  const [empresaUsuario, setEmpresaUsuario] = useState("")
  const [dniYaUsado, setDniYaUsado] = useState(false)

  // Estados para resultados
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    cargarCuestionario()
  }, [cursoId, cuestionarioId])

  const cargarCuestionario = async () => {
    try {
      setCargando(true)
      const cuestionarioDoc = await getDoc(
        doc(db, "capacitaciones", cursoId, "cuestionarios", cuestionarioId)
      )

      if (!cuestionarioDoc.exists()) {
        Swal.fire({
          title: "Error",
          text: "El cuestionario no existe o ha sido eliminado",
          icon: "error",
          confirmButtonColor: "#ef4444",
        }).then(() => {
          navigate("/")
        })
        return
      }

      const data = cuestionarioDoc.data()

      // Verificar si está activo y no ha expirado
      if (!data.activo) {
        Swal.fire({
          title: "Cuestionario inactivo",
          text: "Este cuestionario no está disponible actualmente",
          icon: "warning",
          confirmButtonColor: "#ef4444",
        }).then(() => {
          navigate("/")
        })
        return
      }

      const fechaExpiracion = data.fechaExpiracion?.toDate()
      if (fechaExpiracion && fechaExpiracion < new Date()) {
        Swal.fire({
          title: "Cuestionario expirado",
          text: "El tiempo para realizar este cuestionario ha finalizado",
          icon: "warning",
          confirmButtonColor: "#ef4444",
        }).then(() => {
          navigate("/")
        })
        return
      }

      setCuestionario({ id: cuestionarioDoc.id, ...data })
    } catch (error) {
      console.error("Error al cargar cuestionario:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo cargar el cuestionario",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    } finally {
      setCargando(false)
    }
  }

  const validarPin = () => {
    if (!pinIngresado.trim()) {
      setErrorPin("Por favor ingresa el PIN")
      return
    }

    if (pinIngresado !== cuestionario.pin) {
      setErrorPin("PIN incorrecto. Por favor intenta nuevamente")
      return
    }

    setErrorPin("")
    setMostrarFormularioAcceso(false)
    setMostrarFormularioUsuario(true)
  }

  const verificarDni = async () => {
    if (!dniUsuario.trim()) return

    try {
      // Buscar si el DNI ya fue usado en este cuestionario
      const resultadosQuery = query(
        collection(db, "capacitaciones", cursoId, "cuestionarios", cuestionarioId, "resultados"),
        where("dni", "==", dniUsuario.trim())
      )
      const resultadosSnap = await getDocs(resultadosQuery)

      if (!resultadosSnap.empty) {
        setDniYaUsado(true)
        return true
      }

      setDniYaUsado(false)
      return false
    } catch (error) {
      console.error("Error al verificar DNI:", error)
      return false
    }
  }

  const validarFormularioUsuario = async () => {
    if (!nombreUsuario.trim() || !dniUsuario.trim() || !empresaUsuario.trim()) {
      Swal.fire({
        title: "Campos requeridos",
        text: "Por favor completa todos los campos antes de continuar",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    // Verificar DNI
    const dniExiste = await verificarDni()
    if (dniExiste) {
      Swal.fire({
        title: "DNI ya registrado",
        text: "Este DNI ya ha realizado la evaluación. No se permiten múltiples intentos.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    setMostrarFormularioUsuario(false)
    setMostrarInfo(true)
  }

  const iniciarEvaluacion = () => {
    setMostrarInfo(false)
    setMostrarCuestionario(true)
  }

  const guardarResultado = async (nota, aprobado, respuestas) => {
    try {
      await addDoc(
        collection(db, "capacitaciones", cursoId, "cuestionarios", cuestionarioId, "resultados"),
        {
          nombre: nombreUsuario.trim(),
          dni: dniUsuario.trim(),
          empresa: empresaUsuario.trim(),
          nota,
          aprobado,
          respuestas,
          fechaCompletado: Timestamp.now(),
          tiempoLimite: cuestionario.tiempo,
        }
      )

      setResultado({ nota, aprobado })
      setMostrarCuestionario(false)
      setMostrarMensajeFinal(true)
    } catch (error) {
      console.error("Error al guardar resultado:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo guardar el resultado. Por favor contacta al administrador.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    }
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando evaluación...</p>
        </div>
      </div>
    )
  }

  if (!cuestionario) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Formulario de acceso con PIN */}
          {mostrarFormularioAcceso && (
            <motion.div
              key="acceso"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluación</h1>
                <p className="text-gray-600">{cuestionario.titulo}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingresa el PIN de acceso
                  </label>
                  <input
                    type="text"
                    value={pinIngresado}
                    onChange={(e) => {
                      setPinIngresado(e.target.value)
                      setErrorPin("")
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") validarPin()
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errorPin
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-red-500"
                    }`}
                    placeholder="Ingresa el PIN"
                    maxLength={4}
                  />
                  {errorPin && <p className="mt-1 text-sm text-red-600">{errorPin}</p>}
                </div>

                <button
                  onClick={validarPin}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {/* Formulario de datos del usuario */}
          {mostrarFormularioUsuario && (
            <motion.div
              key="usuario"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Datos del participante</h2>
                <p className="text-gray-600">Por favor completa la siguiente información</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombreUsuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ingresa tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DNI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={dniUsuario}
                    onChange={async (e) => {
                      setDniUsuario(e.target.value)
                      if (e.target.value.trim().length >= 8) {
                        await verificarDni()
                      } else {
                        setDniYaUsado(false)
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      dniYaUsado
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-red-500"
                    }`}
                    placeholder="Ingresa tu DNI"
                    maxLength={8}
                  />
                  {dniYaUsado && (
                    <p className="mt-1 text-sm text-red-600">
                      Este DNI ya ha realizado la evaluación
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={empresaUsuario}
                    onChange={(e) => setEmpresaUsuario(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ingresa el nombre de tu empresa"
                  />
                </div>

                <button
                  onClick={validarFormularioUsuario}
                  disabled={dniYaUsado}
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {/* Información del cuestionario */}
          {mostrarInfo && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Instrucciones</h2>
                <p className="text-gray-600">{cuestionario.titulo}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h3 className="font-semibold text-blue-900 mb-2">Información importante:</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Tienes {cuestionario.tiempo} minutos para completar la evaluación</li>
                    <li>• La evaluación consta de {cuestionario.preguntas?.length || 0} preguntas</li>
                    <li>• Necesitas obtener al menos 14/20 para aprobar</li>
                    <li>• Una vez iniciada, debes completarla en una sola sesión</li>
                    <li>• No podrás cambiar tus respuestas después de enviar</li>
                  </ul>
                </div>

                {cuestionario.telefono && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Teléfono de contacto:</strong> {cuestionario.telefono}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={iniciarEvaluacion}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Iniciar evaluación
              </button>
            </motion.div>
          )}

          {/* Cuestionario */}
          {mostrarCuestionario && cuestionario.preguntas && (
            <CuestionarioRender
              preguntas={cuestionario.preguntas}
              tiempoLimite={cuestionario.tiempo}
              onClose={() => setMostrarCuestionario(false)}
              nombreUsuario={nombreUsuario}
              dniUsuario={dniUsuario}
              onResultado={guardarResultado}
              esPublico={true}
            />
          )}

          {/* Mensaje Final */}
          {mostrarMensajeFinal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Gracias por completar el cuestionario!</h2>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6 text-left">
                  <p className="text-gray-700 mb-2">
                    <strong>Tu evaluación ha sido registrada correctamente.</strong>
                  </p>
                  {resultado && (
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>• Nota obtenida: <strong className="text-gray-900">{resultado.nota}/20</strong></p>
                      <p>
                        • Estado:{" "}
                        <strong className={resultado.aprobado ? "text-green-600" : "text-red-600"}>
                          {resultado.aprobado ? "Aprobado" : "Desaprobado"}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-left">
                  <p className="text-sm text-yellow-800">
                    {resultado?.aprobado ? (
                      <>
                        <strong>¡Felicitaciones!</strong> Has alcanzado la nota mínima requerida. Espera a que finalice
                        el tiempo del cuestionario para que el administrador pueda generar tu certificado.
                      </>
                    ) : (
                      <>
                        Espera a que finalice el tiempo del cuestionario para conocer los resultados finales. Si
                        alcanzaste la nota mínima, el administrador generará tu certificado.
                      </>
                    )}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    El tiempo del cuestionario finaliza en:{" "}
                    {cuestionario.fechaExpiracion
                      ? new Date(cuestionario.fechaExpiracion.toDate()).toLocaleString("es-PE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Próximamente"}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default EvaluacionPublica

