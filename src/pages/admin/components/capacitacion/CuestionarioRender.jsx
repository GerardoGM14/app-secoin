import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid"

function CuestionarioRender({ preguntas, tiempoLimite = 20, onClose, nombreUsuario, dniUsuario, onResultado, esPublico = false }) {
  const [respuestas, setRespuestas] = useState({})
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [intentosRestantes, setIntentosRestantes] = useState(2)
  const [notaFinal, setNotaFinal] = useState(null)
  const [tiempoRestante, setTiempoRestante] = useState(tiempoLimite * 60)
  const [contadorActivo, setContadorActivo] = useState(true)
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [modoRevision, setModoRevision] = useState(false)
  const [preguntasRespondidas, setPreguntasRespondidas] = useState(0)
  const [mostrarModalPreguntasSinResponder, setMostrarModalPreguntasSinResponder] = useState(false)
  const [mostrarModalResultado, setMostrarModalResultado] = useState(false)
  const [datosResultado, setDatosResultado] = useState(null)

  // Manejar ESC para cerrar el modal
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        confirmarSalida()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  // Temporizador
  useEffect(() => {
    let intervalo
    if (contadorActivo && tiempoRestante > 0) {
      intervalo = setInterval(() => {
        setTiempoRestante((prev) => prev - 1)
      }, 1000)
    } else if (tiempoRestante === 0 && contadorActivo) {
      handleEnviar(true) // Envío automático por tiempo agotado
    }
    return () => clearInterval(intervalo)
  }, [tiempoRestante, contadorActivo])

  // Actualizar contador de preguntas respondidas
  useEffect(() => {
    const respondidas = Object.keys(respuestas).length
    setPreguntasRespondidas(respondidas)
  }, [respuestas])

  const confirmarSalida = () => {
    if (mostrarResultados) {
      onClose()
      return
    }

    Swal.fire({
      title: "¿Estás seguro?",
      text: "Si sales ahora, perderás tu progreso en la evaluación",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        onClose()
      }
    })
  }

  const formatearTiempo = (segundos) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg < 10 ? "0" : ""}${seg}`
  }

  const handleSeleccion = (indexPregunta, indexOpcion) => {
    setRespuestas((prev) => ({ ...prev, [indexPregunta]: indexOpcion }))
  }

  const calcularNota = () => {
    let correctas = 0
    preguntas.forEach((pregunta, i) => {
      const correctaIndex = pregunta.opciones.findIndex((o) => o.correcta)
      if (respuestas[i] === correctaIndex) correctas++
    })
    return Math.round((correctas / preguntas.length) * 20)
  }

  const mostrarResumen = (nota, tiempoAgotado = false) => {
    const aprobado = nota >= 14
    setDatosResultado({
      nota,
      aprobado,
      tiempoAgotado,
      intentosRestantes,
    })
    setMostrarModalResultado(true)
  }

  const manejarResultadoModal = (accion) => {
    if (accion === "revisar") {
      setModoRevision(true)
      setMostrarModalResultado(false)
    } else if (accion === "reintentar") {
      setIntentosRestantes(intentosRestantes - 1)
      setMostrarResultados(false)
      setRespuestas({})
      setNotaFinal(null)
      setTiempoRestante(tiempoLimite * 60)
      setContadorActivo(true)
      setModoRevision(false)
      setPreguntaActual(0)
      setMostrarModalResultado(false)
    } else {
      onClose()
      setMostrarModalResultado(false)
    }
  }

  const handleEnviar = (tiempoAgotado = false) => {
    // Verificar si respondió todas las preguntas
    if (!tiempoAgotado && Object.keys(respuestas).length < preguntas.length) {
      setMostrarModalPreguntasSinResponder(true)
    } else {
      finalizarEvaluacion(tiempoAgotado)
    }
  }

  const confirmarEnvioSinResponder = () => {
    setMostrarModalPreguntasSinResponder(false)
    finalizarEvaluacion(false)
  }

  const finalizarEvaluacion = (tiempoAgotado) => {
    const nota = calcularNota()
    const aprobado = nota >= 14
    setNotaFinal(nota)
    setMostrarResultados(true)
    setContadorActivo(false)
    
    // Si es público y tiene callback, guardar resultado
    if (esPublico && onResultado) {
      onResultado(nota, aprobado, respuestas)
    }
    
    mostrarResumen(nota, tiempoAgotado)
  }

  const siguientePregunta = () => {
    if (preguntaActual < preguntas.length - 1) {
      setPreguntaActual(preguntaActual + 1)
    }
  }

  const preguntaAnterior = () => {
    if (preguntaActual > 0) {
      setPreguntaActual(preguntaActual - 1)
    }
  }

  const irAPregunta = (index) => {
    setPreguntaActual(index)
  }

  // Determinar el color del indicador de tiempo según el tiempo restante
  const getColorTiempo = () => {
    const porcentaje = (tiempoRestante / (tiempoLimite * 60)) * 100
    if (porcentaje > 50) return "text-green-600"
    if (porcentaje > 25) return "text-yellow-600"
    return "text-red-600"
  }

  // Determinar el color de fondo del indicador de tiempo
  const getBgColorTiempo = () => {
    const porcentaje = (tiempoRestante / (tiempoLimite * 60)) * 100
    if (porcentaje > 50) return "bg-green-100"
    if (porcentaje > 25) return "bg-yellow-100"
    return "bg-red-100"
  }

  // Inyectar CSS para animación spin
  useEffect(() => {
    const spinKeyframes = `
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `
    if (typeof document !== "undefined") {
      const style = document.createElement("style")
      style.textContent = spinKeyframes
      if (!document.head.querySelector("style[data-spin-cuestionario]")) {
        style.setAttribute("data-spin-cuestionario", "true")
        document.head.appendChild(style)
      }
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4 }}
        className="bg-white w-full max-w-5xl rounded-xl shadow-xl overflow-hidden relative"
      >
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
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
              <h2 className="text-xl font-bold">Evaluación Final</h2>
              <p className="text-sm text-white/80">
                {nombreUsuario} - {dniUsuario}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!mostrarResultados && (
              <div
                className={`flex items-center gap-2 ${getBgColorTiempo()} ${getColorTiempo()} px-3 py-1.5 rounded-full font-medium text-sm`}
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formatearTiempo(tiempoRestante)}
              </div>
            )}

            <button
              onClick={confirmarSalida}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors backdrop-blur-sm"
              title="Cerrar evaluación"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Información de progreso */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {modoRevision ? "Modo revisión" : `Pregunta ${preguntaActual + 1} de ${preguntas.length}`}
            </span>
            {!modoRevision && !mostrarResultados && (
              <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {preguntasRespondidas} de {preguntas.length} respondidas
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {!mostrarResultados && <span>Intentos restantes: {intentosRestantes}</span>}
            {mostrarResultados && notaFinal !== null && (
              <span className={notaFinal >= 14 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                Nota final: {notaFinal}/20
              </span>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-250px)]">
          {/* Modo navegación por pregunta */}
          {!modoRevision ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={preguntaActual}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {preguntas[preguntaActual] && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">
                      {preguntaActual + 1}. {preguntas[preguntaActual].pregunta}
                    </h3>
                    <div className="space-y-3">
                      {preguntas[preguntaActual].opciones.map((opcion, i) => {
                        const esSeleccionada = respuestas[preguntaActual] === i
                        const esCorrecta = opcion.correcta
                        const mostrarCorrecion = mostrarResultados || modoRevision

                        let estiloOpcion = "border border-gray-200 hover:border-gray-300"
                        let estiloTexto = "text-gray-700"

                        if (mostrarCorrecion) {
                          if (esCorrecta) {
                            estiloOpcion = "border-green-500 bg-green-50"
                            estiloTexto = "text-green-800"
                          } else if (esSeleccionada && !esCorrecta) {
                            estiloOpcion = "border-red-400 bg-red-50"
                            estiloTexto = "text-red-800"
                          }
                        } else if (esSeleccionada) {
                          estiloOpcion = "border-red-400 bg-red-50"
                          estiloTexto = "text-red-800"
                        }

                        return (
                          <label
                            key={i}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${estiloOpcion} cursor-pointer transition-all duration-200 hover:shadow-sm ${
                              mostrarCorrecion ? "cursor-default" : "cursor-pointer"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                                esSeleccionada
                                  ? "bg-red-500 border-red-500 text-white"
                                  : "border-gray-300 bg-white text-transparent"
                              }`}
                            >
                              {esSeleccionada && (
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <input
                              type="radio"
                              name={`pregunta-${preguntaActual}`}
                              className="sr-only"
                              onChange={() => handleSeleccion(preguntaActual, i)}
                              checked={esSeleccionada}
                              disabled={mostrarCorrecion}
                            />
                            <span className={`${estiloTexto} flex-1`}>{opcion.texto}</span>
                            {mostrarCorrecion && esCorrecta && (
                              <div className="bg-green-100 text-green-700 p-1 rounded-full">
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            // Modo revisión - muestra todas las preguntas
            <div className="space-y-8">
              {preguntas.map((pregunta, index) => {
                const correctaIndex = pregunta.opciones.findIndex((o) => o.correcta)
                return (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">
                      {index + 1}. {pregunta.pregunta}
                    </h3>
                    <div className="space-y-3">
                      {pregunta.opciones.map((opcion, i) => {
                        const esSeleccionada = respuestas[index] === i
                        const esCorrecta = i === correctaIndex

                        let estiloOpcion = "border border-gray-200"
                        let estiloTexto = "text-gray-700"

                        if (esCorrecta) {
                          estiloOpcion = "border-green-500 bg-green-50"
                          estiloTexto = "text-green-800"
                        } else if (esSeleccionada && !esCorrecta) {
                          estiloOpcion = "border-red-400 bg-red-50"
                          estiloTexto = "text-red-800"
                        }

                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${estiloOpcion} transition-all duration-200`}
                          >
                            <div
                              className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                                esSeleccionada
                                  ? "bg-red-500 border-red-500 text-white"
                                  : "border-gray-300 bg-white text-transparent"
                              }`}
                            >
                              {esSeleccionada && (
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className={`${estiloTexto} flex-1`}>{opcion.texto}</span>
                            {esCorrecta && (
                              <div className="bg-green-100 text-green-700 p-1 rounded-full">
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {respuestas[index] === undefined && (
                      <div className="mt-3 text-sm text-red-600">No respondiste esta pregunta</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Navegación y botones de acción */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
          {!modoRevision ? (
            // Navegación entre preguntas
            <div className="flex items-center gap-2">
              <button
                onClick={preguntaAnterior}
                disabled={preguntaActual === 0}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                  preguntaActual === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
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

              {/* Indicadores de preguntas */}
              <div className="hidden md:flex items-center gap-1 mx-2">
                {preguntas.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => irAPregunta(index)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      preguntaActual === index
                        ? "bg-red-500 text-white"
                        : respuestas[index] !== undefined
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={siguientePregunta}
                disabled={preguntaActual === preguntas.length - 1}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                  preguntaActual === preguntas.length - 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
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
            </div>
          ) : (
            // Botón para salir del modo revisión
            <button
              onClick={() => setModoRevision(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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
              Volver a resultados
            </button>
          )}

          {/* Botón de enviar respuestas */}
          {!mostrarResultados && !modoRevision && (
            <button
              onClick={() => handleEnviar(false)}
              className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-green-500/20 transition-all duration-300 flex items-center gap-2 font-medium"
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
              Finalizar evaluación
            </button>
          )}

          {/* Botón para cerrar en modo revisión */}
          {mostrarResultados && modoRevision && (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Cerrar evaluación
            </button>
          )}
        </div>
      </motion.div>

      {/* Modal de preguntas sin responder */}
      <AnimatePresence>
        {mostrarModalPreguntasSinResponder && (
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
            >
              {/* Header del modal */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-amber-100 p-2 rounded-full">
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Preguntas Sin Responder</h3>
                  <p className="text-sm text-gray-500">Faltan preguntas por responder</p>
                </div>
              </div>

              {/* Información */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  Has respondido <strong>{Object.keys(respuestas).length}</strong> de <strong>{preguntas.length}</strong>{" "}
                  preguntas.
                </p>
                <p className="text-xs text-gray-600">¿Deseas enviar la evaluación de todas formas?</p>
              </div>

              {/* Botones */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setMostrarModalPreguntasSinResponder(false)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Seguir respondiendo
                </button>
                <button
                  onClick={confirmarEnvioSinResponder}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Sí, enviar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de resultado final */}
      <AnimatePresence>
        {mostrarModalResultado && datosResultado && (
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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
            >
              {/* Header del modal */}
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-full ${datosResultado.aprobado ? "bg-green-100" : "bg-red-100"}`}>
                  {datosResultado.aprobado ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Resultado Final</h3>
                  <p className="text-sm text-gray-500">Evaluación completada</p>
                </div>
              </div>

              {/* Información del resultado */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-3">
                  {datosResultado.tiempoAgotado && (
                    <p className="text-sm font-medium text-gray-700">Se agotó el tiempo</p>
                  )}
                  {!datosResultado.tiempoAgotado && datosResultado.aprobado && (
                    <p className="text-sm font-medium text-gray-700">
                      ¡Felicidades, <strong>{nombreUsuario}</strong>!
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Tu nota:</span>
                    <span className="text-lg font-bold text-gray-900">{datosResultado.nota}/20</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    {datosResultado.aprobado ? (
                      <p className="text-sm font-semibold text-green-600">Has aprobado la evaluación 🎉</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-red-600 mb-2">
                          No has alcanzado la nota mínima aprobatoria (14).
                        </p>
                        {datosResultado.intentosRestantes > 1 ? (
                          <p className="text-xs text-gray-600">
                            Tienes {datosResultado.intentosRestantes - 1} intento más disponible.
                          </p>
                        ) : (
                          <p className="text-xs text-gray-600">Has agotado todos tus intentos.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col gap-3">
                {!datosResultado.tiempoAgotado && datosResultado.nota >= 0 && (
                  <button
                    onClick={() => manejarResultadoModal("revisar")}
                    className="w-full px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    Revisar respuestas
                  </button>
                )}
                <div className="flex space-x-3">
                  {datosResultado.nota < 14 && datosResultado.intentosRestantes > 1 ? (
                    <button
                      onClick={() => manejarResultadoModal("reintentar")}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Volver a intentar
                    </button>
                  ) : (
                    <button
                      onClick={() => manejarResultadoModal("aceptar")}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Aceptar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default CuestionarioRender
