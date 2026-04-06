import { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Swal from "sweetalert2"
import { db, storage } from "../../../../firebase/firebaseConfig"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { XCircleIcon } from "@heroicons/react/24/solid"

const PIN_VALIDO = "140603"

function CrearClase({ visible, onClaseCreada }) {
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [documentos, setDocumentos] = useState([])
  const [video, setVideo] = useState("")
  const [imagenCurso, setImagenCurso] = useState(null)
  const [previewImagen, setPreviewImagen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [paso, setPaso] = useState(1) // Para navegación por pasos
  const [mostrarModalErrorPin, setMostrarModalErrorPin] = useState(false)
  const inputDocsRef = useRef()
  const inputImgRef = useRef()

  const handleArchivoChange = (e) => {
    const files = Array.from(e.target.files)
    setDocumentos(files)
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImagenCurso(file)
      setPreviewImagen(URL.createObjectURL(file))
    }
  }

  const eliminarDocumento = (index) => {
    const nuevosDocumentos = [...documentos]
    nuevosDocumentos.splice(index, 1)
    setDocumentos(nuevosDocumentos)

    // Resetear el input si no quedan documentos
    if (nuevosDocumentos.length === 0 && inputDocsRef.current) {
      inputDocsRef.current.value = ""
    }
  }

  const eliminarImagen = () => {
    setImagenCurso(null)
    setPreviewImagen(null)
    if (inputImgRef.current) {
      inputImgRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    // Validación básica
    if (!titulo.trim()) {
      Swal.fire({
        title: "Error",
        text: "El título es obligatorio",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    const { value: pin } = await Swal.fire({
      title: "Ingrese el PIN para continuar",
      input: "password",
      inputPlaceholder: "••••••",
      inputAttributes: {
        maxlength: 6,
        autocapitalize: "off",
        autocorrect: "off",
      },
      confirmButtonText: "Confirmar",
      confirmButtonColor: "#ef4444",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
    })

    if (!pin) return // Cancelado

    if (pin !== PIN_VALIDO) {
      setMostrarModalErrorPin(true)
      return
    }

    try {
      setCargando(true)
      Swal.fire({
        title: "Subiendo clase...",
        text: "Espere mientras se guardan los datos",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      })

      let imagenURL = ""
      if (imagenCurso) {
        const imgRef = ref(storage, `capacitaciones/imagenes/${Date.now()}_${imagenCurso.name}`)
        await uploadBytes(imgRef, imagenCurso)
        imagenURL = await getDownloadURL(imgRef)
      }

      const urlsDocs = []
      for (const doc of documentos) {
        const docRef = ref(storage, `capacitaciones/${titulo}/${Date.now()}_${doc.name}`)
        await uploadBytes(docRef, doc)
        const url = await getDownloadURL(docRef)
        urlsDocs.push({ nombre: doc.name, url })
      }

      const nuevaClase = {
        titulo,
        descripcion,
        documentos: urlsDocs,
        video,
        imagen: imagenURL,
        fecha: Timestamp.now(),
      }

      await addDoc(collection(db, "capacitaciones"), nuevaClase)

      Swal.fire({
        title: "¡Éxito!",
        text: "La capacitación fue registrada correctamente.",
        icon: "success",
        confirmButtonColor: "#ef4444",
      })

      // Reset campos
      setTitulo("")
      setDescripcion("")
      setDocumentos([])
      setVideo("")
      setImagenCurso(null)
      setPreviewImagen(null)
      setPaso(1)
      if (inputDocsRef.current) inputDocsRef.current.value = null
      if (inputImgRef.current) inputImgRef.current.value = null

      if (onClaseCreada) onClaseCreada() // para refrescar listado si es necesario
    } catch (err) {
      console.error(err)
      Swal.fire({
        title: "Error",
        text: "No se pudo registrar la clase.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    } finally {
      setCargando(false)
    }
  }

  const siguientePaso = () => {
    if (paso === 1 && !titulo.trim()) {
      Swal.fire({
        title: "Error",
        text: "El título es obligatorio para continuar",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
      return
    }
    setPaso(paso + 1)
  }

  const pasoAnterior = () => {
    setPaso(paso - 1)
  }

  if (!visible) return null

  // Obtener el tipo de archivo para mostrar el icono correcto
  const obtenerIconoArchivo = (nombreArchivo) => {
    const extension = nombreArchivo.split(".").pop().toLowerCase()

    if (["pdf"].includes(extension)) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-red-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else if (["doc", "docx"].includes(extension)) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else if (["ppt", "pptx"].includes(extension)) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-orange-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      )
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-500"
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto"
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 text-red-700 p-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Nueva Capacitación</h2>
        </div>
        <div className="text-sm font-medium text-gray-500">Paso {paso} de 3</div>
      </div>

      {/* Indicador de pasos */}
      <div className="mb-8">
        <div className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${paso >= 1 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"}`}
          >
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${paso > 1 ? "bg-red-500" : "bg-gray-200"}`}></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${paso >= 2 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"}`}
          >
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${paso > 2 ? "bg-red-500" : "bg-gray-200"}`}></div>
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${paso >= 3 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"}`}
          >
            3
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Información básica</span>
          <span>Recursos</span>
          <span>Finalizar</span>
        </div>
      </div>

      {/* Contenido del paso actual */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        {paso === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título de la capacitación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ej: Uso correcto del extintor"
                required
              />
              <p className="mt-1 text-xs text-gray-500">El título debe ser descriptivo y claro</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción <span className="text-red-500">*</span>
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Describe el contenido y objetivos de esta capacitación..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Incluye información sobre lo que aprenderán los participantes
              </p>
            </div>
          </motion.div>
        )}

        {paso === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagen destacada</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                {previewImagen ? (
                  <div className="relative">
                    <img
                      src={previewImagen || "/placeholder.svg"}
                      alt="Vista previa"
                      className="h-48 mx-auto rounded-lg object-cover"
                    />
                    <button
                      onClick={eliminarImagen}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Eliminar imagen"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div onClick={() => inputImgRef.current.click()} className="cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Haz clic para seleccionar una imagen</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG o JPEG (recomendado: 1200x600px)</p>
                  </div>
                )}
                <input
                  ref={inputImgRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImagenChange}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Documentos teóricos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                <div onClick={() => inputDocsRef.current.click()} className="cursor-pointer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">Haz clic para seleccionar documentos</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, PPT, PPTX (máx. 10MB por archivo)</p>
                </div>
                <input
                  ref={inputDocsRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  multiple
                  onChange={handleArchivoChange}
                  className="hidden"
                />
              </div>

              {documentos.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Documentos seleccionados:</h4>
                  <ul className="space-y-2">
                    {documentos.map((doc, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-2">
                          {obtenerIconoArchivo(doc.name)}
                          <span className="text-sm text-gray-700 truncate max-w-xs">{doc.name}</span>
                        </div>
                        <button
                          onClick={() => eliminarDocumento(i)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Eliminar documento"
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
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video (opcional)</label>
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
                  type="text"
                  value={video}
                  onChange={(e) => setVideo(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="URL del video (YouTube, Vimeo, etc.)"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Ingresa la URL completa del video</p>
            </div>
          </motion.div>
        )}

        {paso === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen de la capacitación</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Título:</h4>
                  <p className="text-gray-800">{titulo || "No especificado"}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Descripción:</h4>
                  <p className="text-gray-800">{descripcion || "No especificada"}</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="text-sm font-medium text-gray-500">Imagen:</h4>
                    {previewImagen ? (
                      <img
                        src={previewImagen || "/placeholder.svg"}
                        alt="Vista previa"
                        className="h-24 rounded-lg mt-1 object-cover"
                      />
                    ) : (
                      <p className="text-gray-500 italic">Sin imagen</p>
                    )}
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <h4 className="text-sm font-medium text-gray-500">Documentos:</h4>
                    {documentos.length > 0 ? (
                      <p className="text-gray-800">{documentos.length} documento(s) seleccionado(s)</p>
                    ) : (
                      <p className="text-gray-500 italic">Sin documentos</p>
                    )}
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <h4 className="text-sm font-medium text-gray-500">Video:</h4>
                    {video ? (
                      <p className="text-gray-800 truncate">{video}</p>
                    ) : (
                      <p className="text-gray-500 italic">Sin video</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Una vez creada la capacitación, se requerirá validación con PIN para finalizar el proceso.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Botones de navegación */}
      <div className="flex justify-between">
        <button
          onClick={pasoAnterior}
          disabled={paso === 1 || cargando}
          className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-colors ${
            paso === 1 || cargando
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Anterior
        </button>

        {paso < 3 ? (
          <button
            onClick={siguientePaso}
            disabled={cargando}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2.5 rounded-lg hover:shadow-md hover:shadow-red-500/20 transition-all duration-300 flex items-center gap-2"
          >
            Siguiente
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={cargando}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-lg hover:shadow-md hover:shadow-green-500/20 transition-all duration-300 flex items-center gap-2"
          >
            {cargando ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                Procesando...
              </>
            ) : (
              <>
                Crear Capacitación
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>

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

export default CrearClase
