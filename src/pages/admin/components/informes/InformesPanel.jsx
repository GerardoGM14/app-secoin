// src/pages/admin/components/informes/InformesPanel.jsx
"use client"

import { useEffect, useRef, useState } from "react"
import { db, storage } from "../../../../firebase/firebaseConfig"
import { collection, addDoc, getDocs, Timestamp, query, where, deleteDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import Swal from "sweetalert2"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid"

function InformesPanel({ empresaSeleccionada }) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [comentario, setComentario] = useState("")
  const [informes, setInformes] = useState([])
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
    const obtenerInformes = async () => {
      if (!empresaSeleccionada?.id) return

      setCargando(true)
      try {
        const q = query(collection(db, "informes"), where("empresaId", "==", empresaSeleccionada.id))

        const snap = await getDocs(q)
        const informesFiltrados = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setInformes(informesFiltrados)
      } catch (error) {
        console.error("Error al obtener informes:", error)
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar los informes",
          icon: "error",
          confirmButtonColor: "#ef4444",
        })
      } finally {
        setCargando(false)
      }
    }

    obtenerInformes()
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
        if (file.type === "application/pdf") {
          setArchivoSeleccionado(file)
        } else {
          Swal.fire({
            title: "Formato no válido",
            text: "Solo se permiten archivos PDF",
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

  const subirArchivoInforme = async () => {
    if (!archivoSeleccionado) {
      Swal.fire({
        title: "Error",
        text: "Debe seleccionar un archivo PDF",
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

      const fechaActual = new Date().getTime()
      const nombreArchivo = `${fechaActual}_${archivoSeleccionado.name}`
      const archivoRef = ref(storage, `informes/${empresaSeleccionada.id}/${nombreArchivo}`)

      await uploadBytes(archivoRef, archivoSeleccionado)
      const url = await getDownloadURL(archivoRef)

      await addDoc(collection(db, "informes"), {
        nombre: archivoSeleccionado.name,
        url,
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
      const q = query(collection(db, "informes"), where("empresaId", "==", empresaSeleccionada.id))
      const snap = await getDocs(q)
      const informesActualizados = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setInformes(informesActualizados)
    } catch (error) {
      console.error(error)
      Swal.fire({
        title: "Error",
        text: "No se pudo subir el informe. Inténtelo nuevamente.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    } finally {
      setSubiendo(false)
      setMostrarModalCarga(false)
    }
  }

  const eliminarInforme = async (informe) => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Eliminar informe?",
      text: `¿Está seguro que desea eliminar "${informe.nombre}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (!isConfirmed) return

    try {
      Swal.fire({
        title: "Eliminando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      // Eliminar de Storage
      const archivoRef = ref(storage, informe.url)
      await deleteObject(archivoRef).catch((err) => console.warn("Error al eliminar archivo de storage:", err))

      // Eliminar de Firestore
      await deleteDoc(doc(db, "informes", informe.id))

      // Actualizar lista
      setInformes((prev) => prev.filter((i) => i.id !== informe.id))

      Swal.fire({
        title: "Eliminado",
        text: "El informe ha sido eliminado correctamente",
        icon: "success",
        confirmButtonColor: "#ef4444",
      })
    } catch (error) {
      console.error("Error al eliminar informe:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el informe",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    }
  }

  const obtenerTipoArchivo = (nombreArchivo) => {
    const nombreLower = nombreArchivo.toLowerCase()
    if (nombreLower.includes("informe") || nombreLower.includes("reporte")) return "informe"
    if (nombreLower.includes("certificado")) return "certificado"
    if (nombreLower.includes("manual")) return "manual"
    return "documento"
  }

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case "informe":
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
      case "certificado":
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
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        )
      case "manual":
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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

  // Filtrar informes
  const informesFiltrados = informes.filter((informe) => {
    if (filtro === "todos") return true
    return informe.tipo === filtro
  })

  // Ordenar informes
  const informesOrdenados = [...informesFiltrados].sort((a, b) => {
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
            <h2 className="text-2xl font-bold text-gray-800">Informes</h2>
            <p className="text-gray-600">Gestión de archivos PDF de informes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {informes.length} {informes.length === 1 ? "informe" : "informes"} disponibles
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
            Subir nuevo informe
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
                <p className="text-lg font-medium text-gray-700 mb-1">Arrastra y suelta tu archivo PDF aquí</p>
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
                <p className="text-xs text-gray-500 mt-3">Solo archivos PDF</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
            className="hidden"
          />

          <div className="mb-4">
            <label htmlFor="comentario" className="block text-sm font-medium text-gray-700 mb-1">
              Comentario (opcional)
            </label>
            <textarea
              id="comentario"
              placeholder="Añade un comentario sobre este informe..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              maxLength={500}
            ></textarea>
            <div className="text-right text-xs text-gray-500 mt-1">{comentario.length}/500 caracteres</div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={subirArchivoInforme}
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Subir informe
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y ordenación */}
      {informes.length > 0 && (
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
              onClick={() => setFiltro("informe")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === "informe"
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              Informes
            </button>
            <button
              onClick={() => setFiltro("certificado")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === "certificado"
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              Certificados
            </button>
            <button
              onClick={() => setFiltro("manual")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === "manual"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              Manuales
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

      {/* Lista de informes */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando informes...</p>
        </div>
      ) : informesOrdenados.length === 0 ? (
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
          <h3 className="text-xl font-bold text-gray-700 mb-2">No hay informes disponibles</h3>
          <p className="text-gray-500 mb-6">
            {filtro !== "todos"
              ? `No se encontraron informes con el filtro "${filtro}"`
              : "Esta empresa aún no tiene informes subidos"}
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
            Subir primer informe
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {informesOrdenados.map((informe) => (
              <motion.div
                key={informe.id}
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
                          informe.tipo === "informe"
                            ? "bg-red-100"
                            : informe.tipo === "certificado"
                              ? "bg-green-100"
                              : informe.tipo === "manual"
                                ? "bg-blue-100"
                                : "bg-gray-100"
                        }`}
                      >
                        {obtenerIconoTipo(informe.tipo)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm" title={informe.nombre}>
                          {informe.nombre.length > 25 ? `${informe.nombre.substring(0, 25)}...` : informe.nombre}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {informe.fecha?.toDate().toLocaleDateString("es-PE", {
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
                          href={informe.url}
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
                          Ver informe
                        </a>
                        <button
                          onClick={() => eliminarInforme(informe)}
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

                  {informe.comentario && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600">
                        {informe.comentario.length > 100
                          ? `${informe.comentario.substring(0, 100)}...`
                          : informe.comentario}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        informe.tipo === "informe"
                          ? "bg-red-100 text-red-700"
                          : informe.tipo === "certificado"
                            ? "bg-green-100 text-green-700"
                            : informe.tipo === "manual"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {informe.tipo === "informe"
                        ? "Informe"
                        : informe.tipo === "certificado"
                          ? "Certificado"
                          : informe.tipo === "manual"
                            ? "Manual"
                            : "Documento"}
                    </span>

                    <a
                      href={informe.url}
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
                  <h3 className="text-lg font-semibold text-gray-900">Subiendo informe...</h3>
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
                  <p className="text-sm text-gray-500">Informe subido correctamente</p>
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

export default InformesPanel
