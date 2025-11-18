import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { db } from "../../../../firebase/firebaseConfig"
import { collection, getDocs, deleteDoc, doc, query, orderBy, getDoc } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import ModalCrearCuestionario from "./ModalCrearCuestionario"
import CuestionarioRender from "./CuestionarioRender"
import Swal from "sweetalert2"
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid"
import CertificadoGenerator from "../../../empresa/components/capacitacion/CertificadoGenerator"

function Evaluacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cuestionario, setCuestionario] = useState(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mostrarFormularioUsuario, setMostrarFormularioUsuario] = useState(true)
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [dniUsuario, setDniUsuario] = useState("")
  const [mostrarCuestionario, setMostrarCuestionario] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [mostrarPanelResultados, setMostrarPanelResultados] = useState(false)
  const [resultados, setResultados] = useState([])
  const [cargandoResultados, setCargandoResultados] = useState(false)
  const [mostrarGeneradorCertificado, setMostrarGeneradorCertificado] = useState(false)
  const [datosCertificado, setDatosCertificado] = useState(null)
  const [curso, setCurso] = useState(null)
  const [mostrarModalCamposRequeridos, setMostrarModalCamposRequeridos] = useState(false)

  const obtenerCuestionario = async () => {
    setCargando(true)
    try {
      const snap = await getDocs(collection(db, "capacitaciones", id, "cuestionarios"))
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      if (lista.length > 0) {
        setCuestionario({ ...lista[0], _docId: snap.docs[0].id })
      }
    } catch (error) {
      console.error("Error al obtener cuestionario:", error)
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

  const eliminarCuestionario = async () => {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar Cuestionario?",
      text: "Esta acción eliminará el cuestionario de forma permanente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#ef4444",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
    })

    if (confirmacion.isConfirmed && cuestionario?._docId) {
      try {
        Swal.fire({
          title: "Eliminando...",
          text: "Espere un momento",
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => Swal.showLoading(),
        })

        await deleteDoc(doc(db, "capacitaciones", id, "cuestionarios", cuestionario._docId))
        setCuestionario(null)

        Swal.fire({
          title: "¡Eliminado!",
          text: "El cuestionario ha sido eliminado correctamente.",
          icon: "success",
          confirmButtonColor: "#ef4444",
        })
      } catch (err) {
        console.error(err)
        Swal.fire({
          title: "Error",
          text: "No se pudo eliminar el cuestionario.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        })
      }
    }
  }

  useEffect(() => {
    obtenerCuestionario()
    obtenerCurso()

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setMostrarCuestionario(false)
      }
    }

    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [id])

  const obtenerCurso = async () => {
    try {
      const cursoDoc = await getDoc(doc(db, "capacitaciones", id))
      if (cursoDoc.exists()) {
        setCurso({ id, ...cursoDoc.data() })
      }
    } catch (error) {
      console.error("Error al obtener curso:", error)
    }
  }

  const validarFormulario = () => {
    if (!nombreUsuario.trim() || !dniUsuario.trim()) {
      setMostrarModalCamposRequeridos(true)
      return
    }
    setMostrarFormularioUsuario(false)
    setMostrarCuestionario(true)
  }

  const cargarResultados = async () => {
    if (!cuestionario?._docId) return

    setCargandoResultados(true)
    try {
      const resultadosQuery = query(
        collection(db, "capacitaciones", id, "cuestionarios", cuestionario._docId, "resultados"),
        orderBy("fechaCompletado", "desc")
      )
      const resultadosSnap = await getDocs(resultadosQuery)
      const listaResultados = resultadosSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setResultados(listaResultados)
      setMostrarPanelResultados(true)
    } catch (error) {
      console.error("Error al cargar resultados:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los resultados",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    } finally {
      setCargandoResultados(false)
    }
  }

  const cuestionarioExpirado = () => {
    if (!cuestionario?.fechaExpiracion) return false
    const fechaExpiracion = cuestionario.fechaExpiracion.toDate()
    return fechaExpiracion < new Date()
  }

  const generarCertificado = async (resultado) => {
    if (!curso) {
      Swal.fire({
        title: "Error",
        text: "No se pudo obtener la información del curso",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    // Preparar datos para el certificado
    const datosUsuario = {
      nombreUsuario: resultado.nombre,
      dniUsuario: resultado.dni,
      cargoUsuario: "", // No tenemos cargo en los resultados públicos
      empresaUsuario: resultado.empresa,
    }

    const datosCurso = {
      id: curso.id,
      titulo: curso.titulo || cuestionario.titulo,
    }

    setDatosCertificado({
      datosUsuario,
      datosCurso,
      notaObtenida: resultado.nota,
      fechaEvaluacion: resultado.fechaCompletado
        ? new Date(resultado.fechaCompletado.toDate()).toLocaleDateString("es-PE")
        : new Date().toLocaleDateString("es-PE"),
      pinEmpresa: "", // No aplica para evaluaciones públicas
    })

    setMostrarGeneradorCertificado(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-5xl mx-auto"
    >
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 text-red-700 p-2 rounded-lg">
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
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Evaluación Final</h2>
            <p className="text-sm text-gray-500">Gestiona el cuestionario de evaluación para este curso</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/capacitacion/${id}`)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 self-start"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al curso
        </button>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando cuestionario...</p>
        </div>
      ) : cuestionario ? (
        <>
          {/* Información del cuestionario */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-8">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
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
                {cuestionario.titulo}
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 text-red-600 p-2 rounded-md">
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
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">PIN de acceso</p>
                      <p className="text-lg font-mono font-bold text-gray-800">{cuestionario.pin}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 text-red-600 p-2 rounded-md">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tiempo límite</p>
                      <p className="text-lg font-bold text-gray-800">{cuestionario.tiempo} minutos</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 text-red-600 p-2 rounded-md">
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
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Teléfono de contacto</p>
                      <p className="text-lg font-bold text-gray-800">{cuestionario.telefono}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 text-red-600 p-2 rounded-md">
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
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Archivo de referencia</p>
                      <a
                        href={cuestionario.archivoURL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 mt-1 group"
                      >
                        Ver documento
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 text-green-600 p-1 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">
                    {cuestionario.preguntas?.length || 0} preguntas configuradas
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={cargarResultados}
                    disabled={cargandoResultados}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                  >
                    {cargandoResultados ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Cargando...
                      </>
                    ) : (
                      <>
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Ver Resultados
                      </>
                    )}
                  </button>

                  <button
                    onClick={eliminarCuestionario}
                    className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium transition-colors"
                  >
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Eliminar cuestionario
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de datos del usuario */}
          <AnimatePresence>
            {mostrarFormularioUsuario && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-red-100 text-red-600 p-2 rounded-md">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">Identificación del participante</h4>
                    <p className="text-sm text-gray-500">Completa tus datos antes de iniciar la evaluación</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nombre-usuario" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="nombre-usuario"
                      type="text"
                      placeholder="Ej: Juan Pérez García"
                      value={nombreUsuario}
                      onChange={(e) => setNombreUsuario(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="dni-usuario" className="block text-sm font-medium text-gray-700 mb-1">
                      DNI o número de identificación <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="dni-usuario"
                      type="text"
                      placeholder="Ej: 12345678"
                      value={dniUsuario}
                      onChange={(e) => setDniUsuario(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={validarFormulario}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-red-500/20 transition-all duration-300 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Iniciar Evaluación
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Renderizar cuestionario */}
          <AnimatePresence>
            {mostrarCuestionario && cuestionario.preguntas && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <CuestionarioRender
                  preguntas={cuestionario.preguntas}
                  tiempoLimite={cuestionario.tiempo}
                  onClose={() => setMostrarCuestionario(false)}
                  nombreUsuario={nombreUsuario}
                  dniUsuario={dniUsuario}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white p-8 rounded-xl shadow-md border border-gray-100 text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-600"
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
          <h3 className="text-xl font-bold text-gray-800 mb-2">No hay cuestionario disponible</h3>
          <p className="text-gray-600 mb-6">
            Aún no se ha creado un cuestionario de evaluación para este curso. Puedes crear uno ahora.
          </p>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2.5 rounded-lg shadow-md hover:shadow-red-500/20 transition-all duration-300 inline-flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Crear Cuestionario
          </button>
        </motion.div>
      )}

      {/* Modal para crear cuestionario */}
      <AnimatePresence>
        {mostrarModal && (
          <ModalCrearCuestionario
            cursoId={id}
            onClose={() => setMostrarModal(false)}
            onGuardado={() => {
              setMostrarModal(false)
              setCuestionario(null)
              setTimeout(() => obtenerCuestionario(), 300)
            }}
          />
        )}
      </AnimatePresence>

      {/* Panel de Resultados */}
      <AnimatePresence>
        {mostrarPanelResultados && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMostrarPanelResultados(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del panel */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Resultados de la Evaluación</h3>
                  <p className="text-sm text-red-100 mt-1">
                    {resultados.length} {resultados.length === 1 ? "participante" : "participantes"}
                  </p>
                </div>
                <button
                  onClick={() => setMostrarPanelResultados(false)}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido del panel */}
              <div className="flex-1 overflow-y-auto p-6">
                {resultados.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-gray-400"
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
                    <p className="text-gray-500 text-lg">No hay resultados disponibles aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {resultados.map((resultado, index) => (
                      <motion.div
                        key={resultado.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className={`p-2 rounded-full ${
                                  resultado.aprobado ? "bg-green-100" : "bg-red-100"
                                }`}
                              >
                                {resultado.aprobado ? (
                                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                                ) : (
                                  <XCircleIcon className="h-6 w-6 text-red-600" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900">{resultado.nombre}</h4>
                                <p className="text-sm text-gray-500">
                                  DNI: {resultado.dni} • Empresa: {resultado.empresa}
                                </p>
                              </div>
                            </div>

                            <div className="ml-11 space-y-2">
                              <div className="flex items-center gap-4">
                                <div>
                                  <span className="text-sm text-gray-500">Nota: </span>
                                  <span
                                    className={`text-lg font-bold ${
                                      resultado.aprobado ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    {resultado.nota}/20
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500">Estado: </span>
                                  <span
                                    className={`font-semibold ${
                                      resultado.aprobado ? "text-green-600" : "text-red-600"
                                    }`}
                                  >
                                    {resultado.aprobado ? "Aprobado" : "Desaprobado"}
                                  </span>
                                </div>
                                {resultado.fechaCompletado && (
                                  <div>
                                    <span className="text-sm text-gray-500">Fecha: </span>
                                    <span className="text-sm text-gray-700">
                                      {new Date(resultado.fechaCompletado.toDate()).toLocaleString("es-PE", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {resultado.aprobado && (
                            <button
                              onClick={() => generarCertificado(resultado)}
                              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
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
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Generar Certificado
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generador de Certificado */}
      {mostrarGeneradorCertificado && datosCertificado && (
        <CertificadoGenerator
          mostrar={mostrarGeneradorCertificado}
          onClose={() => {
            setMostrarGeneradorCertificado(false)
            setDatosCertificado(null)
          }}
          datosUsuario={datosCertificado.datosUsuario}
          datosCurso={datosCertificado.datosCurso}
          notaObtenida={datosCertificado.notaObtenida}
          fechaEvaluacion={datosCertificado.fechaEvaluacion}
          pinEmpresa={datosCertificado.pinEmpresa}
        />
      )}

      {/* Modal de Campos Requeridos */}
      <AnimatePresence>
        {mostrarModalCamposRequeridos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-2xl shadow-2xl max-w-md w-full p-6 border"
              style={{ backgroundColor: "hsl(0, 0%, 100%)", borderColor: "hsl(210, 16%, 93%)" }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full mb-4" style={{ backgroundColor: "hsl(43, 96%, 94%)" }}>
                  <ExclamationTriangleIcon className="h-8 w-8" style={{ color: "hsl(43, 96%, 56%)" }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "hsl(210, 11%, 15%)" }}>
                  Campos requeridos
                </h3>
                <p className="text-sm mb-6" style={{ color: "hsl(210, 9%, 31%)" }}>
                  Por favor completa tus datos antes de continuar.
                </p>
                <button
                  onClick={() => setMostrarModalCamposRequeridos(false)}
                  className="w-full px-4 py-2 text-white rounded-lg transition-colors font-medium"
                  style={{ backgroundColor: "hsl(0, 72%, 51%)" }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "hsl(0, 74%, 42%)")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "hsl(0, 72%, 51%)")}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Evaluacion
