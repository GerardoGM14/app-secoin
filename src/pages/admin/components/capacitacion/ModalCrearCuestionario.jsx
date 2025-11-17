import { useState } from "react"
import { db, storage } from "../../../../firebase/firebaseConfig"
import { collection, addDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import Swal from "sweetalert2"
import { motion, AnimatePresence } from "framer-motion"
import * as mammoth from "mammoth"

function ModalCrearCuestionario({ cursoId, onClose, onGuardado }) {
  const [titulo, setTitulo] = useState("")
  const [tiempo, setTiempo] = useState("")
  const [telefono, setTelefono] = useState("")
  const [archivo, setArchivo] = useState(null)
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)

  const pinGenerado = Math.floor(1000 + Math.random() * 9000).toString()

  const handleGuardar = async () => {
    // Validación básica
    if (!titulo.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "El título del cuestionario es obligatorio",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    if (!tiempo || Number.parseInt(tiempo) <= 0) {
      Swal.fire({
        title: "Campo requerido",
        text: "Debes establecer un tiempo límite válido",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    if (!telefono.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "El teléfono de contacto es obligatorio",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    if (!archivo) {
      Swal.fire({
        title: "Archivo requerido",
        text: "Debes seleccionar un archivo .docx con las preguntas",
        icon: "warning",
        confirmButtonColor: "#ef4444",
      })
      return
    }

    try {
      setCargando(true)
      Swal.fire({
        title: "Procesando archivo...",
        html: `
          <div class="space-y-3">
            <div class="flex justify-center">
              <div class="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent"></div>
            </div>
            <p class="text-gray-600">Analizando preguntas y opciones</p>
            <p class="text-xs text-gray-500">Esto puede tomar unos momentos</p>
          </div>
        `,
        showConfirmButton: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      // Leer contenido del .docx
      const arrayBuffer = await archivo.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const textoPlano = result.value

      // Parsear preguntas
      const preguntas = parsearPreguntas(textoPlano)

      if (preguntas.length === 0) {
        setCargando(false)
        Swal.fire({
          title: "Error en el formato",
          text: "No se pudieron detectar preguntas en el formato esperado. Revisa el archivo.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        })
        return
      }

      // Seleccionar 10 aleatorias o todas si hay menos de 10
      const cantidadSeleccion = Math.min(preguntas.length, 10)
      const seleccionadas = preguntas.sort(() => 0.5 - Math.random()).slice(0, cantidadSeleccion)

      // Subir archivo original
      const nombreArchivo = `${Date.now()}_${archivo.name}`
      const archivoRef = ref(storage, `cuestionarios/${cursoId}/${nombreArchivo}`)
      await uploadBytes(archivoRef, archivo)
      const archivoURL = await getDownloadURL(archivoRef)

      // Guardar en Firestore
      await addDoc(collection(db, "capacitaciones", cursoId, "cuestionarios"), {
        titulo,
        tiempo: Number.parseInt(tiempo),
        telefono,
        pin: pinGenerado,
        archivoURL,
        creadoEn: new Date(),
        preguntas: seleccionadas,
      })

      setCargando(false)
      Swal.fire({
        title: "¡Cuestionario creado!",
        text: `Se han configurado ${seleccionadas.length} preguntas correctamente.`,
        icon: "success",
        confirmButtonColor: "#ef4444",
      })
      onGuardado()
      onClose()
    } catch (err) {
      console.error(err)
      setCargando(false)
      Swal.fire({
        title: "Error",
        text: "No se pudo procesar el archivo. Verifica el formato e intenta nuevamente.",
        icon: "error",
        confirmButtonColor: "#ef4444",
      })
    }
  }

  function parsearPreguntas(texto) {
    const bloques = texto.split(/\n(?=\d+\.)/) // separa por líneas que empiezan con "1.", "2.", etc.
    const preguntas = []

    bloques.forEach((bloque) => {
      const lineas = bloque.trim().split("\n")
      if (lineas.length < 2) return

      const enunciado = lineas[0].replace(/^\d+\.\s*/, "").trim()
      const opciones = []

      for (let i = 1; i < lineas.length; i++) {
        const opcionRaw = lineas[i].trim()
        const match = opcionRaw.match(/^([a-d]\))\s*(.*)$/i)
        if (!match) continue

        const texto = match[2].replace(/\*$/, "").trim()
        const correcta = opcionRaw.endsWith("*")
        opciones.push({ texto, correcta })
      }

      if (enunciado && opciones.length > 0) {
        preguntas.push({ pregunta: enunciado, opciones })
      }
    })

    return preguntas
  }

  const siguientePaso = () => {
    if (paso === 1) {
      if (!titulo.trim() || !tiempo || !telefono.trim()) {
        Swal.fire({
          title: "Campos incompletos",
          text: "Por favor completa todos los campos antes de continuar",
          icon: "warning",
          confirmButtonColor: "#ef4444",
        })
        return
      }
    }
    setPaso(paso + 1)
  }

  const pasoAnterior = () => {
    setPaso(paso - 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
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
            Crear Cuestionario
          </h3>
          <button onClick={onClose} className="text-white hover:text-red-100 transition-colors">
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

        {/* Indicador de pasos */}
        <div className="px-6 pt-6">
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                paso >= 1 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <div className={`flex-1 h-1 mx-2 ${paso > 1 ? "bg-red-500" : "bg-gray-200"}`}></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                paso >= 2 ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Información básica</span>
            <span>Archivo de preguntas</span>
          </div>
        </div>

        {/* Contenido del formulario */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {paso === 1 && (
              <motion.div
                key="paso1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
                    Título del cuestionario <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="titulo"
                    type="text"
                    placeholder="Ej: Evaluación final - Seguridad contra incendios"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="tiempo" className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo límite (minutos) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="tiempo"
                    type="number"
                    min="1"
                    placeholder="Ej: 30"
                    value={tiempo}
                    onChange={(e) => setTiempo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Tiempo máximo que tendrá el participante para completar la evaluación
                  </p>
                </div>

                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono de contacto <span className="text-red-500">*</span>
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
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <input
                      id="telefono"
                      type="tel"
                      placeholder="+51 999 999 999"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Número de contacto para soporte durante la evaluación</p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mt-6">
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
                        El PIN de acceso se generará automáticamente: <strong>{pinGenerado}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {paso === 2 && (
              <motion.div
                key="paso2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo de preguntas <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => document.getElementById("archivoDocx").click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors cursor-pointer"
                  >
                    {archivo ? (
                      <div className="flex flex-col items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-blue-600"
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
                        <p className="mt-2 text-sm font-medium text-gray-700">{archivo.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(archivo.size / 1024).toFixed(2)} KB • Haz clic para cambiar
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-gray-400"
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
                        <p className="mt-2 text-sm text-gray-600">Haz clic para seleccionar un archivo .docx</p>
                        <p className="text-xs text-gray-500 mt-1">Solo se admiten archivos .docx</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="archivoDocx"
                    type="file"
                    accept=".docx"
                    onChange={(e) => setArchivo(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Formato esperado del archivo
                  </h4>
                  <p className="text-xs text-blue-700 mb-2">
                    El archivo debe contener preguntas numeradas y opciones con el siguiente formato:
                  </p>
                  <div className="bg-white p-3 rounded border border-blue-200 text-xs font-mono text-gray-700">
                    <p>1. ¿Cuál es la pregunta?</p>
                    <p>a) Primera opción</p>
                    <p>b) Segunda opción</p>
                    <p>c) Tercera opción correcta*</p>
                    <p>d) Cuarta opción</p>
                    <br />
                    <p>2. ¿Otra pregunta?</p>
                    <p>a) Opción A*</p>
                    <p>b) Opción B</p>
                    <p>...</p>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>Nota:</strong> Marca la respuesta correcta con un asterisco (*) al final.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botones de acción */}
        <div className="bg-gray-50 p-4 flex justify-between border-t border-gray-200">
          {paso === 1 ? (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          ) : (
            <button
              onClick={pasoAnterior}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1"
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
          )}

          {paso === 1 ? (
            <button
              onClick={siguientePaso}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md hover:shadow-red-500/20 transition-all duration-300 flex items-center gap-1"
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
              onClick={handleGuardar}
              disabled={cargando}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-green-500/20 transition-all duration-300 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? (
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
                  Procesando...
                </>
              ) : (
                <>
                  Crear cuestionario
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
      </motion.div>
    </motion.div>
  )
}

export default ModalCrearCuestionario
