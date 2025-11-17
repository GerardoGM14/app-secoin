import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import { motion, AnimatePresence } from "framer-motion"

function CuestionarioRender({ preguntas, tiempoLimite = 20, onClose, nombreUsuario, dniUsuario }) {
  const [respuestas, setRespuestas] = useState({})
  const [mostrarResultados, setMostrarResultados] = useState(false)
  const [intentosRestantes, setIntentosRestantes] = useState(2)
  const [notaFinal, setNotaFinal] = useState(null)
  const [tiempoRestante, setTiempoRestante] = useState(tiempoLimite * 60)
  const [contadorActivo, setContadorActivo] = useState(true)
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [modoRevision, setModoRevision] = useState(false)
  const [preguntasRespondidas, setPreguntasRespondidas] = useState(0)

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

    // Personalizar el mensaje según si aprobó o no
    let mensaje = ""
    let icono = ""

    if (tiempoAgotado) {
      mensaje = `
        <div class="space-y-3">
          <p class="text-lg">Se agotó el tiempo</p>
          <p class="text-lg">Tu nota es: <strong>${nota}</strong> de 20</p>
          ${
            aprobado
              ? '<p class="text-green-600 font-semibold mt-2">¡Has aprobado! 🎉</p>'
              : '<p class="text-red-600 font-semibold mt-2">No has aprobado.</p>'
          }
        </div>
      `
      icono = aprobado ? "success" : "error"
    } else if (aprobado) {
      mensaje = `
        <div class="space-y-3">
          <p class="text-lg">¡Felicidades, <strong>${nombreUsuario}</strong>!</p>
          <p class="text-lg">Tu nota es: <strong>${nota}</strong> de 20</p>
          <p class="text-green-600 font-semibold mt-2">Has aprobado la evaluación 🎉</p>
        </div>
      `
      icono = "success"
    } else {
      mensaje = `
        <div class="space-y-3">
          <p class="text-lg">Tu nota es: <strong>${nota}</strong> de 20</p>
          <p class="text-red-600 font-semibold mt-2">No has alcanzado la nota mínima aprobatoria (14).</p>
          ${
            intentosRestantes > 1
              ? `<p class="text-gray-600">Tienes ${intentosRestantes - 1} intento más disponible.</p>`
              : '<p class="text-gray-600">Has agotado todos tus intentos.</p>'
          }
        </div>
      `
      icono = "error"
    }

    Swal.fire({
      title: "Resultado Final",
      html: mensaje,
      icon: icono,
      confirmButtonText: intentosRestantes > 1 && nota < 14 ? "Volver a intentar" : "Aceptar",
      confirmButtonColor: "#ef4444",
      showDenyButton: !tiempoAgotado && nota >= 0,
      denyButtonText: "Revisar respuestas",
      denyButtonColor: "#3b82f6",
      customClass: {
        confirmButton: "swal-confirm-button",
      },
    }).then((result) => {
      if (result.isDenied) {
        setModoRevision(true)
      } else if (nota < 14 && intentosRestantes > 1 && result.isConfirmed) {
        setIntentosRestantes(intentosRestantes - 1)
        setMostrarResultados(false)
        setRespuestas({})
        setNotaFinal(null)
        setTiempoRestante(tiempoLimite * 60)
        setContadorActivo(true)
        setModoRevision(false)
        setPreguntaActual(0)
      } else {
        onClose() // Cierra el modal manual o si se acabaron intentos
      }
    })
  }

  const handleEnviar = (tiempoAgotado = false) => {
    // Verificar si respondió todas las preguntas
    if (!tiempoAgotado && Object.keys(respuestas).length < preguntas.length) {
      Swal.fire({
        title: "Preguntas sin responder",
        text: `Has respondido ${Object.keys(respuestas).length} de ${
          preguntas.length
        } preguntas. ¿Deseas enviar de todas formas?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, enviar",
        cancelButtonText: "Seguir respondiendo",
        customClass: {
          confirmButton: "swal-confirm-button",
          cancelButton: "swal-cancel-button",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          finalizarEvaluacion(tiempoAgotado)
        }
      })
    } else {
      finalizarEvaluacion(tiempoAgotado)
    }
  }

  const finalizarEvaluacion = (tiempoAgotado) => {
    const nota = calcularNota()
    setNotaFinal(nota)
    setMostrarResultados(true)
    setContadorActivo(false)
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
    </motion.div>
  )
}

export default CuestionarioRender
