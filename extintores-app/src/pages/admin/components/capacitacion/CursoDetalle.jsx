import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { db, storage } from "../../../../firebase/firebaseConfig"
import { collection, getDoc, doc, addDoc, getDocs, Timestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { motion, AnimatePresence } from "framer-motion"
import Swal from "sweetalert2"
import { deleteDoc } from "firebase/firestore"
import { deleteObject } from "firebase/storage"
import { updateDoc } from "firebase/firestore"
import { XCircleIcon } from "@heroicons/react/24/solid"

function CursoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [curso, setCurso] = useState(null)
  const [sesiones, setSesiones] = useState([])
  const [sesionEditando, setSesionEditando] = useState(null)
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false)
  const [archivosEditados, setArchivosEditados] = useState([])
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [tituloSesion, setTituloSesion] = useState("")
  const [descripcionSesion, setDescripcionSesion] = useState("")
  const [videoURL, setVideoURL] = useState("")
  const [documentos, setDocumentos] = useState([])
  const [archivoPreview, setArchivoPreview] = useState([])
  const [cargando, setCargando] = useState(true)
  
  // Estados para modales de PIN
  const [mostrarModalPinEliminar, setMostrarModalPinEliminar] = useState(false)
  const [mostrarModalPinGuardar, setMostrarModalPinGuardar] = useState(false)
  const [mostrarModalErrorPin, setMostrarModalErrorPin] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [sesionEliminarTemp, setSesionEliminarTemp] = useState(null)
  const [archivosEliminarTemp, setArchivosEliminarTemp] = useState([])

  useEffect(() => {
    const obtenerCurso = async () => {
      try {
        const snap = await getDoc(doc(db, "capacitaciones", id))
        if (snap.exists()) {
          setCurso({ id, ...snap.data() })
        } else {
          navigate("/admin/capacitacion")
          Swal.fire("Error", "El curso no existe", "error")
        }
      } catch (error) {
        console.error("Error al obtener el curso:", error)
      } finally {
        setCargando(false)
      }
    }

    const obtenerSesiones = async () => {
      try {
        const snap = await getDocs(collection(db, "capacitaciones", id, "sesiones"))
        const lista = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setSesiones(lista)
      } catch (error) {
        console.error("Error al obtener sesiones:", error)
      }
    }

    obtenerCurso()
    obtenerSesiones()
  }, [id, navigate])

  const eliminarArchivoEditado = (nombre) => {
    setArchivosEditados((prev) => prev.filter((a) => a.nombre !== nombre))
  }

  const abrirEdicionSesion = (sesion) => {
    setSesionEditando(sesion)
    setTituloSesion(sesion.titulo)
    setDescripcionSesion(sesion.descripcion)
    setVideoURL(sesion.video || "")
    setArchivosEditados(sesion.archivos || [])
    setMostrarModalEdicion(true)
  }

  const eliminarSesion = (sesionId, archivos = []) => {
    setSesionEliminarTemp(sesionId)
    setArchivosEliminarTemp(archivos)
    setMostrarModalPinEliminar(true)
    setPinInput("")
  }

  const confirmarEliminarSesion = async () => {
    if (pinInput !== "140603") {
      setMostrarModalErrorPin(true)
      setPinInput("")
      return
    }

    setMostrarModalPinEliminar(false)
    setPinInput("")

    try {
      Swal.fire({
        title: "Eliminando...",
        text: "Espere un momento",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      })

      // Eliminar archivos de storage
      for (const archivo of archivosEliminarTemp) {
        const archivoRef = ref(storage, `capacitaciones/${id}/${archivo.nombre}`)
        await deleteObject(archivoRef).catch((err) => {
          console.warn(`No se pudo eliminar ${archivo.nombre}:`, err)
        })
      }

      // Eliminar documento de Firestore
      await deleteDoc(doc(db, "capacitaciones", id, "sesiones", sesionEliminarTemp))

      setSesiones((prev) => prev.filter((s) => s.id !== sesionEliminarTemp))

      Swal.fire({
        title: "¡Eliminado!",
        text: "La sesión ha sido eliminada correctamente.",
        icon: "success",
        confirmButtonColor: "#ef4444",
      })
    } catch (err) {
      console.error(err)
      Swal.fire("Error", "No se pudo eliminar la sesión.", "error")
    }
  }

  const guardarEdicionSesion = () => {
    if (!tituloSesion.trim()) {
      Swal.fire({
        title: "Error",
        text: "El título de la sesión es obligatorio",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    setMostrarModalPinGuardar(true)
    setPinInput("")
  }

  const confirmarGuardarEdicionSesion = async () => {
    if (pinInput !== "140603") {
      setMostrarModalErrorPin(true)
      setPinInput("")
      return
    }

    setMostrarModalPinGuardar(false)
    setPinInput("")

    try {
      Swal.fire({
        title: "Guardando...",
        text: "Espere un momento",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
        allowEscapeKey: false,
      })

      const nuevosArchivos = []

      for (const archivo of documentos) {
        const archivoRef = ref(storage, `capacitaciones/${id}/${Date.now()}_${archivo.name}`)
        await uploadBytes(archivoRef, archivo)
        const url = await getDownloadURL(archivoRef)
        nuevosArchivos.push({ nombre: archivo.name, url })
      }

      const nuevosDatos = {
        titulo: tituloSesion,
        descripcion: descripcionSesion,
        video: videoURL,
        archivos: [...archivosEditados, ...nuevosArchivos],
        actualizado: Timestamp.now(),
      }

      await updateDoc(doc(db, "capacitaciones", id, "sesiones", sesionEditando.id), nuevosDatos)

      const snap = await getDocs(collection(db, "capacitaciones", id, "sesiones"))
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setSesiones(lista)

      setMostrarModalEdicion(false)
      setSesionEditando(null)
      setDocumentos([])
      setArchivoPreview([])

      Swal.fire({
        title: "¡Éxito!",
        text: "Sesión actualizada correctamente.",
        icon: "success",
        confirmButtonColor: "#ef4444",
      })
    } catch (err) {
      console.error(err)
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar la sesión.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    }
  }

  const agregarSesion = async () => {
    if (!tituloSesion.trim()) {
      Swal.fire({
        title: "Error",
        text: "El título de la sesión es obligatorio.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    try {
      Swal.fire({
        title: "Guardando...",
        text: "Espere un momento",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
        allowEscapeKey: false,
      })

      const archivoURLs = []

      for (const archivo of documentos) {
        const archivoRef = ref(storage, `capacitaciones/${id}/${Date.now()}_${archivo.name}`)
        await uploadBytes(archivoRef, archivo)
        const url = await getDownloadURL(archivoRef)
        archivoURLs.push({ nombre: archivo.name, url })
      }

      await addDoc(collection(db, "capacitaciones", id, "sesiones"), {
        titulo: tituloSesion,
        descripcion: descripcionSesion,
        video: videoURL,
        archivos: archivoURLs,
        fecha: Timestamp.now(),
      })

      setTituloSesion("")
      setDescripcionSesion("")
      setVideoURL("")
      setDocumentos([])
      setArchivoPreview([])
      setMostrarFormulario(false)

      const snap = await getDocs(collection(db, "capacitaciones", id, "sesiones"))
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setSesiones(lista)

      Swal.fire({
        title: "¡Guardado!",
        text: "Sesión registrada correctamente.",
        icon: "success",
        confirmButtonColor: "#ef4444",
      })
    } catch (err) {
      console.error(err)
      Swal.fire({
        title: "Error",
        text: "No se pudo guardar la sesión.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    }
  }

  const handleArchivos = (e) => {
    const files = Array.from(e.target.files)
    setDocumentos(files)
    setArchivoPreview(files.map((f) => f.name))
  }

  // Función para obtener el tipo de archivo y devolver el icono correspondiente
  const obtenerIconoArchivo = (nombreArchivo) => {
    const extension = nombreArchivo.split(".").pop().toLowerCase()

    if (extension === "pdf") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-red-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else if (["doc", "docx"].includes(extension)) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else if (["ppt", "pptx"].includes(extension)) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-orange-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-green-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
            clipRule="evenodd"
          />
        </svg>
      )
    }
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Cargando curso...</p>
      </div>
    )
  }

  if (!curso) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-5xl mx-auto"
    >
      {/* Encabezado del curso */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{curso.titulo}</h2>
            <p className="text-sm text-gray-500">
              {curso.fecha?.toDate
                ? curso.fecha.toDate().toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Fecha no disponible"}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/capacitacion")}
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
          Volver
        </button>
      </div>

      {/* Contenido principal del curso */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Imagen y descripción */}
        <div className="lg:col-span-2 space-y-4">
          {curso.imagen && (
            <div className="relative rounded-xl overflow-hidden shadow-md h-64">
              <img src={curso.imagen || "/placeholder.svg"} alt={curso.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Descripción del curso</h3>
            <p className="text-gray-600 whitespace-pre-line">{curso.descripcion}</p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Información del curso</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="bg-red-100 text-red-600 p-1.5 rounded-md">
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
                  <p className="text-sm font-medium text-gray-700">Duración</p>
                  <p className="text-sm text-gray-500">{sesiones.length} sesiones</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-red-100 text-red-600 p-1.5 rounded-md">
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Certificación</p>
                  <p className="text-sm text-gray-500">Incluye evaluación final</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-red-100 text-red-600 p-1.5 rounded-md">
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
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Recursos</p>
                  <p className="text-sm text-gray-500">{curso.documentos?.length || 0} documentos principales</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Evaluación final */}
          <div
            onClick={() => navigate(`/admin/capacitacion/${id}/evaluacion`)}
            className="bg-gradient-to-br from-red-600 to-red-700 text-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-all duration-500 group-hover:scale-125"></div>
            <h4 className="text-xl font-bold mb-2 relative z-10">Evaluación Final</h4>
            <p className="text-sm text-white/90 mb-4 relative z-10">
              Administra o revisa el cuestionario asociado a este curso.
            </p>
            <div className="flex items-center justify-between relative z-10">
              <div className="text-xs text-white/80">
                <span className="block mb-1">🔒 Acceso protegido</span>
                <span className="block">📄 Genera certificados</span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white/70 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Sesiones del curso */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-800">Sesiones del Curso</h3>
          <div className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
            {sesiones.length} {sesiones.length === 1 ? "sesión" : "sesiones"}
          </div>
        </div>
        <motion.button
          animate={{ rotate: mostrarFormulario ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md hover:shadow-red-500/20 transition-all duration-300"
          aria-label={mostrarFormulario ? "Cerrar formulario" : "Agregar sesión"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>
      </div>

      {/* Formulario para agregar sesión */}
      <AnimatePresence>
        {mostrarFormulario && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white p-6 rounded-xl shadow-md border border-red-100">
              <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Nueva sesión
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <label htmlFor="titulo-sesion" className="block text-sm font-medium text-gray-700 mb-1">
                      Título de la sesión <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="titulo-sesion"
                      type="text"
                      placeholder="Ej: Introducción a la seguridad contra incendios"
                      value={tituloSesion}
                      onChange={(e) => setTituloSesion(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="descripcion-sesion" className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción de la sesión
                    </label>
                    <textarea
                      id="descripcion-sesion"
                      placeholder="Describe el contenido de esta sesión..."
                      value={descripcionSesion}
                      onChange={(e) => setDescripcionSesion(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="video-url" className="block text-sm font-medium text-gray-700 mb-1">
                    URL del video (YouTube)
                  </label>
                  <div className="flex">
                    <div className="bg-gray-100 flex items-center justify-center px-3 rounded-l-lg border border-r-0 border-gray-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      id="video-url"
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoURL}
                      onChange={(e) => setVideoURL(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Ingresa la URL completa del video de YouTube (se convertirá automáticamente a formato embebido)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Documentos</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                    <button
                      type="button"
                      onClick={() => document.getElementById("archivoInput").click()}
                      className="w-full flex flex-col items-center justify-center cursor-pointer"
                    >
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
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">Haz clic para seleccionar archivos</p>
                      <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, PPT, PPTX</p>
                    </button>
                    <input
                      id="archivoInput"
                      type="file"
                      multiple
                      onChange={handleArchivos}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                    />
                  </div>

                  {archivoPreview.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        {archivoPreview.length} {archivoPreview.length === 1 ? "archivo" : "archivos"} seleccionado
                        {archivoPreview.length !== 1 ? "s" : ""}:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto pr-2">
                        {archivoPreview.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs">
                            {obtenerIconoArchivo(f)}
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={agregarSesion}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-red-500/20 transition-all duration-300 flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar sesión
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de sesiones */}
      <div className="space-y-6">
        {sesiones.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No hay sesiones disponibles</h3>
            <p className="text-gray-500 mb-6">Este curso aún no tiene sesiones registradas</p>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
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
              Crear primera sesión
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sesiones.map((sesion, index) => {
              const videoEmbed = sesion.video?.includes("watch?v=")
                ? sesion.video.replace("watch?v=", "embed/")
                : sesion.video

              return (
                <motion.div
                  key={sesion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <h4 className="font-bold text-lg text-gray-800">{sesion.titulo}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => abrirEdicionSesion(sesion)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                          title="Editar sesión"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => eliminarSesion(sesion.id, sesion.archivos)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                          title="Eliminar sesión"
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
                        </button>
                      </div>
                    </div>

                    {sesion.descripcion && (
                      <p className="text-gray-600 mb-4 text-sm whitespace-pre-line">{sesion.descripcion}</p>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {videoEmbed && (
                        <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                          <div className="aspect-video">
                            <iframe
                              src={videoEmbed}
                              title={`Video: ${sesion.titulo}`}
                              allowFullScreen
                              className="w-full h-full"
                              loading="lazy"
                            ></iframe>
                          </div>
                        </div>
                      )}

                      {sesion.archivos && sesion.archivos.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-red-500"
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
                            Documentos ({sesion.archivos.length})
                          </h5>
                          <ul className="space-y-2">
                            {sesion.archivos.map((archivo, i) => (
                              <li key={i}>
                                <a
                                  href={archivo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-white rounded-md hover:bg-gray-100 transition-colors border border-gray-200 group"
                                >
                                  {obtenerIconoArchivo(archivo.nombre)}
                                  <span className="text-sm text-gray-700 truncate flex-1">{archivo.nombre}</span>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        {sesion.fecha?.toDate
                          ? sesion.fecha.toDate().toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Fecha no disponible"}
                      </p>
                      {sesion.actualizado && (
                        <p className="text-xs text-gray-400">
                          Actualizado: {sesion.actualizado.toDate().toLocaleDateString("es-ES")}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      <AnimatePresence>
        {mostrarModalEdicion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setMostrarModalEdicion(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-500 text-white p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold">Editar sesión</h3>
                <button
                  onClick={() => setMostrarModalEdicion(false)}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-titulo" className="block text-sm font-medium text-gray-700 mb-1">
                      Título <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-titulo"
                      type="text"
                      value={tituloSesion}
                      onChange={(e) => setTituloSesion(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      id="edit-descripcion"
                      value={descripcionSesion}
                      onChange={(e) => setDescripcionSesion(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-video" className="block text-sm font-medium text-gray-700 mb-1">
                      URL del video
                    </label>
                    <input
                      id="edit-video"
                      type="text"
                      value={videoURL}
                      onChange={(e) => setVideoURL(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Archivos actuales</label>
                    {archivosEditados.length > 0 ? (
                      <ul className="space-y-2 mb-4">
                        {archivosEditados.map((archivo, i) => (
                          <li
                            key={i}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {obtenerIconoArchivo(archivo.nombre)}
                              <span className="text-sm text-gray-700 truncate">{archivo.nombre}</span>
                            </div>
                            <button
                              onClick={() => eliminarArchivoEditado(archivo.nombre)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Eliminar archivo"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic mb-4">No hay archivos adjuntos</p>
                    )}

                    <label className="block text-sm font-medium text-gray-700 mb-2">Agregar nuevos archivos</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-red-400 transition-colors">
                      <button
                        type="button"
                        onClick={() => document.getElementById("archivoEditInput").click()}
                        className="w-full flex flex-col items-center justify-center cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">Haz clic para seleccionar archivos</p>
                      </button>
                      <input
                        id="archivoEditInput"
                        type="file"
                        multiple
                        onChange={handleArchivos}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                      />
                    </div>

                    {archivoPreview.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          {archivoPreview.length} {archivoPreview.length === 1 ? "archivo" : "archivos"} seleccionado
                          {archivoPreview.length !== 1 ? "s" : ""}:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1 max-h-32 overflow-y-auto pr-2">
                          {archivoPreview.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs">
                              {obtenerIconoArchivo(f)}
                              <span className="truncate">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  onClick={() => setMostrarModalEdicion(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarEdicionSesion}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md hover:shadow-red-500/20 transition-all duration-300"
                >
                  Guardar cambios
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de PIN para eliminar sesión */}
      <AnimatePresence>
        {mostrarModalPinEliminar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
            onClick={() => {
              setMostrarModalPinEliminar(false)
              setPinInput("")
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="bg-red-100 text-red-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Confirmar Eliminación</h3>
                  <p className="text-gray-600 text-sm">Ingresa el PIN para eliminar esta sesión</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">PIN de autorización</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg tracking-widest bg-gray-50/50"
                      maxLength="6"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setMostrarModalPinEliminar(false)
                      setPinInput("")
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarEliminarSesion}
                    disabled={pinInput.length !== 6}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de PIN para guardar cambios */}
      <AnimatePresence>
        {mostrarModalPinGuardar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
            onClick={() => {
              setMostrarModalPinGuardar(false)
              setPinInput("")
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="bg-red-100 text-red-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">PIN requerido</h3>
                  <p className="text-gray-600 text-sm">Ingresa el PIN para guardar los cambios</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">PIN de autorización</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="••••••"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg tracking-widest bg-gray-50/50"
                      maxLength="6"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setMostrarModalPinGuardar(false)
                      setPinInput("")
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarGuardarEdicionSesion}
                    disabled={pinInput.length !== 6}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Error PIN */}
      <AnimatePresence>
        {mostrarModalErrorPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMostrarModalErrorPin(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Error</h3>
                  <p className="text-sm text-gray-500">PIN incorrecto</p>
                </div>
              </div>

              {/* Información */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  El PIN ingresado no es válido. Por favor, intenta nuevamente.
                </p>
              </div>

              {/* Botón */}
              <button
                onClick={() => setMostrarModalErrorPin(false)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Aceptar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default CursoDetalle