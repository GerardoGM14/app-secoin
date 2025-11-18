import { useEffect, useRef, useState } from "react"
import { db, storage } from "../../../../firebase/firebaseConfig"
import { collection, addDoc, getDocs, Timestamp, query, where, deleteDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import Swal from "sweetalert2"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid"

function InspeccionPanel({ empresaSeleccionada }) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [comentario, setComentario] = useState("")
  const [archivos, setArchivos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [mostrarModalCarga, setMostrarModalCarga] = useState(false)
  const [mostrarModalExito, setMostrarModalExito] = useState(false)
  const [nombreArchivoProcesando, setNombreArchivoProcesando] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [ordenarPor, setOrdenarPor] = useState("fecha-desc")
  const [arrastrandoArchivo, setArrastrandoArchivo] = useState(false)
  const inputRef = useRef()
  const dropZoneRef = useRef()

  useEffect(() => {
    const obtenerArchivos = async () => {
      if (!empresaSeleccionada?.id) return

      setCargando(true)
      try {
        const q = query(collection(db, "inspecciones"), where("empresaId", "==", empresaSeleccionada.id))
        const snap = await getDocs(q)
        const archivosFiltrados = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setArchivos(archivosFiltrados)
      } catch (error) {
        console.error("Error al obtener archivos:", error)
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar los archivos de inspección",
          icon: "error",
          confirmButtonColor: "#ef4444",
        })
      } finally {
        setCargando(false)
      }
    }

    obtenerArchivos()
  }, [empresaSeleccionada])

  // Configurar eventos de arrastrar y soltar
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragOver = (e) => {
      e.preventDefault()
      setArrastrandoArchivo(true)
    }

    const handleDragLeave = () => {
      setArrastrandoArchivo(false)
    }

    const handleDrop = (e) => {
      e.preventDefault()
      setArrastrandoArchivo(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        // Verificar si es un archivo Excel
        if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          setArchivoSeleccionado(file)
        } else {
          Swal.fire({
            title: "Formato no válido",
            text: "Solo se permiten archivos Excel (.xlsx, .xls)",
            icon: "warning",
            confirmButtonColor: "#ef4444",
          })
        }
      }
    }

    dropZone.addEventListener("dragover", handleDragOver)
    dropZone.addEventListener("dragleave", handleDragLeave)
    dropZone.addEventListener("drop", handleDrop)

    return () => {
      if (dropZone) {
        dropZone.removeEventListener("dragover", handleDragOver)
        dropZone.removeEventListener("dragleave", handleDragLeave)
        dropZone.removeEventListener("drop", handleDrop)
      }
    }
  }, [])

  const subirArchivo = async () => {
    if (!archivoSeleccionado) {
      Swal.fire({
        title: "Error",
        text: "Debe seleccionar un archivo Excel",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    if (!empresaSeleccionada) {
      Swal.fire({
        title: "Error",
        text: "No se ha seleccionado una empresa",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    try {
      setSubiendo(true)
      setNombreArchivoProcesando(archivoSeleccionado.name)
      setMostrarModalCarga(true)

      // Generar un nombre único para el archivo
      const fechaActual = new Date().getTime()
      const nombreArchivo = `${fechaActual}_${archivoSeleccionado.name}`
      const archivoRef = ref(storage, `inspecciones/${empresaSeleccionada.id}/${nombreArchivo}`)

      await uploadBytes(archivoRef, archivoSeleccionado)
      const url = await getDownloadURL(archivoRef)

      await addDoc(collection(db, "inspecciones"), {
        nombre: archivoSeleccionado.name,
        url: url,
        comentario,
        fecha: Timestamp.now(),
        empresaId: empresaSeleccionada.id,
        empresaCorreo: empresaSeleccionada.correo,
        tipo: obtenerTipoArchivo(archivoSeleccionado.name),
      })

      setArchivoSeleccionado(null)
      setComentario("")
      if (inputRef.current) inputRef.current.value = ""

      setMostrarModalCarga(false)
      setMostrarModalExito(true)

      // Recargar lista
      const q = query(collection(db, "inspecciones"), where("empresaId", "==", empresaSeleccionada.id))
      const snap = await getDocs(q)
      const archivosFiltrados = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setArchivos(archivosFiltrados)
    } catch (error) {
      console.error("Error al subir archivo:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo subir el archivo. Inténtelo nuevamente.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    } finally {
      setSubiendo(false)
      setMostrarModalCarga(false)
    }
  }

  const eliminarArchivo = async (archivo) => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Eliminar archivo?",
      text: `¿Está seguro que desea eliminar "${archivo.nombre}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
    })

    if (!isConfirmed) return

    try {
      Swal.fire({
        title: "Eliminando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      // Eliminar de Storage
      const archivoRef = ref(storage, archivo.url)
      await deleteObject(archivoRef).catch((err) => console.warn("Error al eliminar archivo de storage:", err))

      // Eliminar de Firestore
      await deleteDoc(doc(db, "inspecciones", archivo.id))

      // Actualizar lista
      setArchivos((prev) => prev.filter((a) => a.id !== archivo.id))

      Swal.fire({
        title: "Eliminado",
        text: "El archivo ha sido eliminado correctamente",
        icon: "success",
        confirmButtonColor: "#ef4444",
      })
    } catch (error) {
      console.error("Error al eliminar archivo:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el archivo",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    }
  }

  const obtenerTipoArchivo = (nombreArchivo) => {
    const nombreLower = nombreArchivo.toLowerCase()
    if (nombreLower.includes("inspeccion") || nombreLower.includes("inspección")) return "inspeccion"
    if (nombreLower.includes("reporte")) return "reporte"
    if (nombreLower.includes("inventario")) return "inventario"
    return "otro"
  }

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case "inspeccion":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-red-600"
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
        )
      case "reporte":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-600"
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
        )
      case "inventario":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        )
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600"
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
        )
    }
  }

  // Filtrar archivos
  const archivosFiltrados = archivos.filter((archivo) => {
    if (filtro === "todos") return true
    return archivo.tipo === filtro
  })

  // Ordenar archivos
  const archivosOrdenados = [...archivosFiltrados].sort((a, b) => {
    const fechaA = a.fecha?.toDate?.() || new Date()
    const fechaB = b.fecha?.toDate?.() || new Date()

    if (ordenarPor === "fecha-desc") {
      return fechaB - fechaA
    } else if (ordenarPor === "fecha-asc") {
      return fechaA - fechaB
    } else if (ordenarPor === "nombre-asc") {
      return a.nombre.localeCompare(b.nombre)
    } else if (ordenarPor === "nombre-desc") {
      return b.nombre.localeCompare(a.nombre)
    }
    return 0
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-6xl mx-auto"
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
            <h2 className="text-2xl font-bold text-gray-800">Inspección</h2>
            <p className="text-gray-600">Gestión de archivos Excel de inspección</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {archivos.length} {archivos.length === 1 ? "archivo" : "archivos"} disponibles
          </div>
        </div>
      </div>

      {/* Formulario de subida */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Subir nuevo archivo
          </h3>
        </div>

        <div className="p-6">
          <div
            ref={dropZoneRef}
            className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors ${
              arrastrandoArchivo
                ? "border-red-400 bg-red-50"
                : archivoSeleccionado
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-red-300"
            }`}
          >
            {archivoSeleccionado ? (
              <div className="flex flex-col items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-green-500 mb-2"
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
                <p className="text-lg font-medium text-gray-700">{archivoSeleccionado.name}</p>
                <p className="text-sm text-gray-500 mt-1">{(archivoSeleccionado.size / 1024).toFixed(2)} KB</p>
                <button
                  onClick={() => {
                    setArchivoSeleccionado(null)
                    if (inputRef.current) inputRef.current.value = ""
                  }}
                  className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
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
                  Eliminar archivo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400 mb-3"
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
                <p className="text-lg font-medium text-gray-700 mb-1">Arrastra y suelta tu archivo Excel aquí</p>
                <p className="text-sm text-gray-500 mb-4">o haz clic para seleccionar</p>
                <button
                  type="button"
                  onClick={() => inputRef.current.click()}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
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
                      d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z"
                    />
                  </svg>
                  Seleccionar archivo
                </button>
                <p className="text-xs text-gray-500 mt-3">Formatos permitidos: .xlsx, .xls</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
            className="hidden"
          />

          <div className="mb-4">
            <label htmlFor="comentario" className="block text-sm font-medium text-gray-700 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              id="comentario"
              placeholder="Añade un comentario sobre este archivo..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              onClick={subirArchivo}
              disabled={subiendo || !archivoSeleccionado}
              className={`px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all duration-300 ${
                subiendo || !archivoSeleccionado
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-md hover:shadow-green-500/20"
              }`}
            >
              {subiendo ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Subiendo...
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Subir archivo
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y ordenación */}
      {archivos.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltro("todos")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === "todos"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltro("inspeccion")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === "inspeccion"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              Inspecciones
            </button>
            <button
              onClick={() => setFiltro("reporte")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === "reporte"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              Reportes
            </button>
            <button
              onClick={() => setFiltro("inventario")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === "inventario"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              Inventarios
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="ordenar" className="text-sm text-gray-600">
              Ordenar por:
            </label>
            <select
              id="ordenar"
              value={ordenarPor}
              onChange={(e) => setOrdenarPor(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="fecha-desc">Más recientes primero</option>
              <option value="fecha-asc">Más antiguos primero</option>
              <option value="nombre-asc">Nombre (A-Z)</option>
              <option value="nombre-desc">Nombre (Z-A)</option>
            </select>
          </div>
        </div>
      )}

      {/* Lista de archivos */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando archivos...</p>
        </div>
      ) : archivosOrdenados.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-10 text-center"
        >
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
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No hay archivos disponibles</h3>
          <p className="text-gray-500 mb-6">
            {filtro !== "todos"
              ? `No se encontraron archivos con el filtro "${filtro}"`
              : "Esta empresa aún no tiene archivos de inspección subidos"}
          </p>
          <button
            onClick={() => inputRef.current.click()}
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
            Subir primer archivo
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {archivosOrdenados.map((archivo) => (
              <motion.div
                key={archivo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          archivo.tipo === "inspeccion"
                            ? "bg-red-100"
                            : archivo.tipo === "reporte"
                              ? "bg-blue-100"
                              : archivo.tipo === "inventario"
                                ? "bg-green-100"
                                : "bg-gray-100"
                        }`}
                      >
                        {obtenerIconoTipo(archivo.tipo)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 line-clamp-1" title={archivo.nombre}>
                          {archivo.nombre}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {archivo.fecha?.toDate().toLocaleDateString("es-PE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="relative group">
                      <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
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
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 hidden group-hover:block">
                        <a
                          href={archivo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                          Ver archivo
                        </a>
                        <button
                          onClick={() => eliminarArchivo(archivo)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
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
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>

                  {archivo.comentario && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600 line-clamp-3">{archivo.comentario}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        archivo.tipo === "inspeccion"
                          ? "bg-red-100 text-red-700"
                          : archivo.tipo === "reporte"
                            ? "bg-blue-100 text-blue-700"
                            : archivo.tipo === "inventario"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {archivo.tipo === "inspeccion"
                        ? "Inspección"
                        : archivo.tipo === "reporte"
                          ? "Reporte"
                          : archivo.tipo === "inventario"
                            ? "Inventario"
                            : "Documento"}
                    </span>

                    <a
                      href={archivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 transition-colors"
                    >
                      Descargar
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
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
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de Carga */}
      <AnimatePresence>
        {mostrarModalCarga && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
            >
              {/* Header del modal */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <ArrowPathIcon className="h-6 w-6 text-red-600 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Subiendo archivo...</h3>
                  <p className="text-sm text-gray-500">Procesando {nombreArchivoProcesando}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Éxito */}
      <AnimatePresence>
        {mostrarModalExito && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMostrarModalExito(false)}
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
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">¡Éxito!</h3>
                  <p className="text-sm text-gray-500">Archivo subido correctamente</p>
                </div>
              </div>

              {/* Botón */}
              <button
                onClick={() => setMostrarModalExito(false)}
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

export default InspeccionPanel
