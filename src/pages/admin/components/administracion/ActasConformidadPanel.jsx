"use client"

import { useEffect, useRef, useState } from "react"
import { db, storage } from "../../../../firebase/firebaseConfig"
import { collection, addDoc, getDocs, Timestamp, query, where, deleteDoc, doc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import Swal from "sweetalert2"
import { motion, AnimatePresence } from "framer-motion"

function ActasConformidadPanel({ empresaSeleccionada }) {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null)
  const [comentario, setComentario] = useState("")
  const [archivos, setArchivos] = useState([])
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [ordenamiento, setOrdenamiento] = useState("fecha-desc")
  const [cargando, setCargando] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    const obtenerArchivos = async () => {
      if (!empresaSeleccionada?.id) return

      const q = query(collection(db, "actas_conformidad"), where("empresaId", "==", empresaSeleccionada.id))

      const snap = await getDocs(q)
      const archivosFiltrados = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setArchivos(archivosFiltrados)
    }

    obtenerArchivos()
  }, [empresaSeleccionada])

  const subirArchivo = async () => {
    if (!archivoSeleccionado) {
      Swal.fire("Error", "Debe seleccionar un archivo.", "warning")
      return
    }

    if (!empresaSeleccionada) {
      Swal.fire("Error", "No se ha seleccionado una empresa.", "error")
      return
    }

    try {
      setCargando(true)
      Swal.fire({
        title: "Subiendo...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      const archivoRef = ref(storage, `actas_conformidad/${empresaSeleccionada.id}/${archivoSeleccionado.name}`)
      await uploadBytes(archivoRef, archivoSeleccionado)
      const url = await getDownloadURL(archivoRef)

      await addDoc(collection(db, "actas_conformidad"), {
        nombre: archivoSeleccionado.name,
        url,
        comentario,
        fecha: Timestamp.now(),
        empresaId: empresaSeleccionada.id,
        empresaCorreo: empresaSeleccionada.correo,
      })

      setArchivoSeleccionado(null)
      setComentario("")
      inputRef.current.value = ""

      Swal.fire("Éxito", "Archivo subido correctamente.", "success")

      const q = query(collection(db, "actas_conformidad"), where("empresaId", "==", empresaSeleccionada.id))
      const snap = await getDocs(q)
      const archivosFiltrados = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setArchivos(archivosFiltrados)
    } catch (error) {
      console.error(error)
      Swal.fire("Error", "No se pudo subir el archivo.", "error")
    } finally {
      setCargando(false)
    }
  }

  const eliminarArchivo = async (id, nombre) => {
    const result = await Swal.fire({
      title: "¿Eliminar acta de conformidad?",
      text: `Se eliminará "${nombre}"`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "actas_conformidad", id))
        setArchivos(archivos.filter((archivo) => archivo.id !== id))
        Swal.fire("Eliminado", "El acta de conformidad ha sido eliminada.", "success")
      } catch (error) {
        console.error(error)
        Swal.fire("Error", "No se pudo eliminar el acta de conformidad.", "error")
      }
    }
  }

  const obtenerTipoArchivo = (nombre) => {
    const nombreLower = nombre.toLowerCase()
    if (nombreLower.includes("acta") || nombreLower.includes("conformidad")) return "acta"
    if (nombreLower.includes("certificado")) return "certificado"
    if (nombreLower.includes("validacion") || nombreLower.includes("aprobacion")) return "validacion"
    return "documento"
  }

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case "acta":
        return (
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        )
      case "validacion":
        return (
          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const obtenerBadgeTipo = (tipo) => {
    switch (tipo) {
      case "acta":
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Acta</span>
      case "certificado":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Certificado</span>
        )
      case "validacion":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Validación</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Documento</span>
    }
  }

  const archivosFiltrados = archivos.filter((archivo) => {
    if (filtroEstado === "todos") return true
    return obtenerTipoArchivo(archivo.nombre) === filtroEstado
  })

  const archivosOrdenados = [...archivosFiltrados].sort((a, b) => {
    switch (ordenamiento) {
      case "fecha-desc":
        return b.fecha?.toDate() - a.fecha?.toDate()
      case "fecha-asc":
        return a.fecha?.toDate() - b.fecha?.toDate()
      case "nombre-asc":
        return a.nombre.localeCompare(b.nombre)
      case "nombre-desc":
        return b.nombre.localeCompare(a.nombre)
      default:
        return 0
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel de Actas de Conformidad</h1>
            <p className="text-red-100">Gestiona las actas de conformidad y certificados de la empresa</p>
          </div>
        </div>
      </div>

      {/* Zona de subida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Subir Nueva Acta de Conformidad
        </h2>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            archivoSeleccionado ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-red-400 hover:bg-red-50"
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-100 rounded-full">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>

            {archivoSeleccionado ? (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{archivoSeleccionado.name}</p>
                <p className="text-xs text-gray-500">Archivo seleccionado</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">Selecciona un archivo PDF</p>
                <p className="text-xs text-gray-500">Arrastra y suelta o haz clic para seleccionar</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => inputRef.current.click()}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 font-medium"
            >
              Seleccionar Archivo
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
          className="hidden"
        />

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Comentario opcional</label>
          <div className="relative">
            <textarea
              placeholder="Agrega un comentario sobre esta acta de conformidad..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all duration-200"
              rows={3}
              maxLength={500}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">{comentario.length}/500</div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={subirArchivo}
            disabled={cargando || !archivoSeleccionado}
            className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 font-medium flex items-center gap-2"
          >
            {cargando ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Subir Acta de Conformidad
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Filtros y ordenamiento */}
      {archivos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Filtrar por tipo:</span>
              {["todos", "acta", "certificado", "validacion", "documento"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setFiltroEstado(tipo)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    filtroEstado === tipo ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tipo === "todos"
                    ? "Todos"
                    : tipo === "validacion"
                      ? "Validación"
                      : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>

            <select
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="fecha-desc">Más reciente</option>
              <option value="fecha-asc">Más antiguo</option>
              <option value="nombre-asc">Nombre A-Z</option>
              <option value="nombre-desc">Nombre Z-A</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Lista de actas de conformidad */}
      {archivosOrdenados.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-100 rounded-full">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay actas de conformidad</h3>
              <p className="text-gray-500">Esta empresa aún no tiene actas de conformidad subidas.</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {archivosOrdenados.map((archivo, index) => {
              const tipo = obtenerTipoArchivo(archivo.nombre)
              return (
                <motion.div
                  key={archivo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {obtenerIconoTipo(tipo)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight group-hover:text-red-600 transition-colors duration-200">
                          {archivo.nombre}
                        </h3>
                        {obtenerBadgeTipo(tipo)}
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => eliminarArchivo(archivo.id, archivo.nombre)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Eliminar acta de conformidad"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                  {archivo.comentario && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{archivo.comentario}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {archivo.fecha?.toDate().toLocaleDateString("es-PE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>

                    <a
                      href={archivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      Ver
                    </a>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Estadísticas */}
      {archivos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{archivos.length}</div>
              <div className="text-sm text-red-700">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "acta").length}
              </div>
              <div className="text-sm text-red-700">Actas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "certificado").length}
              </div>
              <div className="text-sm text-red-700">Certificados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {archivos.filter((a) => obtenerTipoArchivo(a.nombre) === "validacion").length}
              </div>
              <div className="text-sm text-red-700">Validaciones</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default ActasConformidadPanel


