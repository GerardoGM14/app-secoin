"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { db } from "../../../../firebase/firebaseConfig"
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore"
import { motion, AnimatePresence } from "framer-motion"
import Swal from "sweetalert2"

function EvaluacionEmpresa() {
  const { id } = useParams() // ID del curso
  const [searchParams] = useSearchParams()
  const pinEmpresa = searchParams.get("pin")

  const [cuestionario, setCuestionario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarFormularioUsuario, setMostrarFormularioUsuario] = useState(true)
  const [mostrarCuestionario, setMostrarCuestionario] = useState(false)
  const [mostrarResultados, setMostrarResultados] = useState(false)

  // Datos del usuario
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [dniUsuario, setDniUsuario] = useState("")
  const [cargoUsuario, setCargoUsuario] = useState("")
  const [empresaUsuario, setEmpresaUsuario] = useState("")

  // Estados de la evaluación
  const [respuestas, setRespuestas] = useState({})
  const [intentosRestantes, setIntentosRestantes] = useState(2)
  const [notaFinal, setNotaFinal] = useState(null)
  const [tiempoRestante, setTiempoRestante] = useState(0)
  const [contadorActivo, setContadorActivo] = useState(false)
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [modoRevision, setModoRevision] = useState(false)
  const [preguntasRespondidas, setPreguntasRespondidas] = useState(0)
  const [evaluacionIniciada, setEvaluacionIniciada] = useState(false)

  console.log("🎯 EvaluacionEmpresa - Iniciando")
  console.log("📚 ID del curso:", id)
  console.log("🔑 PIN empresa:", pinEmpresa)

  useEffect(() => {
    obtenerCuestionario()
  }, [id])

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

  // Manejar ESC para cerrar
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && !evaluacionIniciada) {
        confirmarSalida()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [evaluacionIniciada])

  const obtenerCuestionario = async () => {
    setCargando(true)
    try {
      console.log("🔍 Obteniendo cuestionario...")
      const snap = await getDocs(collection(db, "capacitaciones", id, "cuestionarios"))
      const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      if (lista.length > 0) {
        const cuestionarioData = lista[0]
        setCuestionario(cuestionarioData)
        setTiempoRestante(cuestionarioData.tiempo * 60)
        console.log("📝 Cuestionario encontrado:", cuestionarioData.titulo)
        console.log("⏱️ Tiempo límite:", cuestionarioData.tiempo, "minutos")
        console.log("❓ Preguntas:", cuestionarioData.preguntas?.length || 0)
      } else {
        console.log("❌ No se encontró cuestionario")
        Swal.fire({
          title: "Sin evaluación",
          text: "Este curso no tiene una evaluación disponible",
          icon: "info",
          confirmButtonColor: "#dc2626",
        }).then(() => {
          window.history.back()
        })
      }
    } catch (error) {
      console.error("❌ Error al obtener cuestionario:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo cargar la evaluación",
        icon: "error",
        confirmButtonColor: "#dc2626",
      })
    } finally {
      setCargando(false)
    }
  }

  const validarDNI = (dni) => {
    const dniRegex = /^\d{8}$/
    return dniRegex.test(dni)
  }

  const validarFormulario = () => {
    if (!nombreUsuario.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "Por favor ingresa tu nombre completo",
        icon: "warning",
        confirmButtonColor: "#dc2626",
      })
      return false
    }

    if (!dniUsuario.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "Por favor ingresa tu DNI",
        icon: "warning",
        confirmButtonColor: "#dc2626",
      })
      return false
    }

    if (!validarDNI(dniUsuario)) {
      Swal.fire({
        title: "DNI inválido",
        text: "El DNI debe tener 8 dígitos",
        icon: "warning",
        confirmButtonColor: "#dc2626",
      })
      return false
    }

    if (!cargoUsuario.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "Por favor ingresa tu cargo",
        icon: "warning",
        confirmButtonColor: "#dc2626",
      })
      return false
    }

    if (!empresaUsuario.trim()) {
      Swal.fire({
        title: "Campo requerido",
        text: "Por favor ingresa el nombre de tu empresa",
        icon: "warning",
        confirmButtonColor: "#dc2626",
      })
      return false
    }

    return true
  }

  const iniciarEvaluacion = () => {
    if (!validarFormulario()) return

    console.log("🚀 Iniciando evaluación para:", {
      nombre: nombreUsuario,
      dni: dniUsuario,
      cargo: cargoUsuario,
      empresa: empresaUsuario,
      pin: pinEmpresa,
    })

    setMostrarFormularioUsuario(false)
    setMostrarCuestionario(true)
    setContadorActivo(true)
    setEvaluacionIniciada(true)
  }

  const confirmarSalida = () => {
    if (mostrarResultados) {
      window.history.back()
      return
    }

    if (evaluacionIniciada) {
      Swal.fire({
        title: "⚠️ Evaluación en curso",
        text: "No puedes salir durante la evaluación. Completa todas las preguntas.",
        icon: "warning",
        confirmButtonColor: "#dc2626",
      })
      return
    }

    Swal.fire({
      title: "¿Estás seguro?",
      text: "Si sales ahora, perderás tu progreso",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        window.history.back()
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
    console.log(`✅ Respuesta ${indexPregunta + 1}:`, indexOpcion)
  }

  const calcularNota = () => {
    let correctas = 0
    cuestionario.preguntas.forEach((pregunta, i) => {
      const correctaIndex = pregunta.opciones.findIndex((o) => o.correcta)
      if (respuestas[i] === correctaIndex) correctas++
    })
    const nota = Math.round((correctas / cuestionario.preguntas.length) * 20)
    console.log(`📊 Resultado: ${correctas}/${cuestionario.preguntas.length} correctas = ${nota}/20`)
    return nota
  }

  const guardarResultado = async (nota, aprobado) => {
    try {
      const resultado = {
        nombreUsuario,
        dniUsuario,
        cargoUsuario,
        empresaUsuario,
        pinEmpresa,
        cursoId: id,
        nota,
        aprobado,
        respuestas,
        intentosUsados: 3 - intentosRestantes,
        fechaEvaluacion: Timestamp.now(),
        tiempoUtilizado: cuestionario.tiempo * 60 - tiempoRestante,
      }

      await addDoc(collection(db, "resultados_evaluaciones"), resultado)
      console.log("💾 Resultado guardado:", resultado)
    } catch (error) {
      console.error("❌ Error al guardar resultado:", error)
    }
  }

  const mostrarResumen = async (nota, tiempoAgotado = false) => {
    const aprobado = nota >= 14

    await guardarResultado(nota, aprobado)

    let mensaje = ""
    let icono = ""

    if (tiempoAgotado) {
      mensaje = `
        <div class="space-y-3">
          <p class="text-lg">⏰ Se agotó el tiempo</p>
          <p class="text-lg">Tu nota es: <strong class="text-2xl">${nota}</strong> de 20</p>
          ${
            aprobado
              ? '<p class="text-green-600 font-semibold mt-2">🎉 ¡Has aprobado!</p>'
              : '<p class="text-red-600 font-semibold mt-2">❌ No has aprobado.</p>'
          }
        </div>
      `
      icono = aprobado ? "success" : "error"
    } else if (aprobado) {
      mensaje = `
        <div class="space-y-3">
          <p class="text-lg">🎉 ¡Felicidades, <strong>${nombreUsuario}</strong>!</p>
          <p class="text-lg">Tu nota es: <strong class="text-2xl text-green-600">${nota}</strong> de 20</p>
          <p class="text-green-600 font-semibold mt-2">✅ Has aprobado la evaluación</p>
          <div class="bg-green-50 p-3 rounded-lg mt-4">
            <p class="text-sm text-green-700">🏆 Recibirás tu certificado digital por correo electrónico</p>
          </div>
        </div>
      `
      icono = "success"
    } else {
      mensaje = `
        <div class="space-y-3">
          <p class="text-lg">Tu nota es: <strong class="text-2xl text-red-600">${nota}</strong> de 20</p>
          <p class="text-red-600 font-semibold mt-2">❌ No has alcanzado la nota mínima (14).</p>
          ${
            intentosRestantes > 1
              ? `<p class="text-gray-600">🔄 Tienes <strong>${intentosRestantes - 1}</strong> intento más disponible.</p>`
              : '<p class="text-gray-600">⚠️ Has agotado todos tus intentos.</p>'
          }
        </div>
      `
      icono = "error"
    }

    Swal.fire({
      title: "📋 Resultado Final",
      html: mensaje,
      icon: icono,
      confirmButtonText: intentosRestantes > 1 && nota < 14 ? "🔄 Volver a intentar" : "✅ Aceptar",
      confirmButtonColor: "#dc2626",
      showDenyButton: !tiempoAgotado && nota >= 0,
      denyButtonText: "👁️ Revisar respuestas",
      denyButtonColor: "#3b82f6",
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((result) => {
      if (result.isDenied) {
        setModoRevision(true)
      } else if (nota < 14 && intentosRestantes > 1 && result.isConfirmed) {
        // Reiniciar para nuevo intento
        setIntentosRestantes(intentosRestantes - 1)
        setMostrarResultados(false)
        setRespuestas({})
        setNotaFinal(null)
        setTiempoRestante(cuestionario.tiempo * 60)
        setContadorActivo(true)
        setModoRevision(false)
        setPreguntaActual(0)
        setEvaluacionIniciada(true)
        console.log("🔄 Reiniciando evaluación - Intentos restantes:", intentosRestantes - 1)
      } else {
        window.history.back()
      }
    })
  }

  const handleEnviar = (tiempoAgotado = false) => {
    if (!tiempoAgotado && Object.keys(respuestas).length < cuestionario.preguntas.length) {
      Swal.fire({
        title: "⚠️ Preguntas sin responder",
        text: `Has respondido ${Object.keys(respuestas).length} de ${
          cuestionario.preguntas.length
        } preguntas. ¿Deseas enviar de todas formas?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, enviar",
        cancelButtonText: "Seguir respondiendo",
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
    setEvaluacionIniciada(false)
    mostrarResumen(nota, tiempoAgotado)
  }

  const siguientePregunta = () => {
    if (preguntaActual < cuestionario.preguntas.length - 1) {
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

  const getColorTiempo = () => {
    const porcentaje = (tiempoRestante / (cuestionario.tiempo * 60)) * 100
    if (porcentaje > 50) return "text-green-600"
    if (porcentaje > 25) return "text-yellow-600"
    return "text-red-600"
  }

  const getBgColorTiempo = () => {
    const porcentaje = (tiempoRestante / (cuestionario.tiempo * 60)) * 100
    if (porcentaje > 50) return "bg-green-100"
    if (porcentaje > 25) return "bg-yellow-100"
    return "bg-red-100"
  }

  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Cargando evaluación...</p>
      </div>
    )
  }

  if (!cuestionario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Sin evaluación disponible</h3>
          <p className="text-gray-600 mb-6">Este curso no tiene una evaluación configurada</p>
          <button
            onClick={() => window.history.back()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100">
      {/* Formulario de datos del usuario */}
      <AnimatePresence>
        {mostrarFormularioUsuario && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Evaluación Final</h1>
                <p className="text-gray-600">{cuestionario.titulo}</p>
              </div>

              {/* Información del cuestionario */}
              <div className="bg-red-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{cuestionario.preguntas?.length || 0}</div>
                    <div className="text-xs text-red-700">Preguntas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{cuestionario.tiempo}</div>
                    <div className="text-xs text-red-700">Minutos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <div className="text-xs text-red-700">Intentos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">14</div>
                    <div className="text-xs text-red-700">Nota mínima</div>
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombreUsuario}
                      onChange={(e) => setNombreUsuario(e.target.value)}
                      placeholder="Ej: Juan Pérez García"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dniUsuario}
                      onChange={(e) => setDniUsuario(e.target.value)}
                      placeholder="12345678"
                      maxLength="8"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cargo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cargoUsuario}
                      onChange={(e) => setCargoUsuario(e.target.value)}
                      placeholder="Ej: Operario de Construcción"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={empresaUsuario}
                      onChange={(e) => setEmpresaUsuario(e.target.value)}
                      placeholder="Ej: Constructora ABC S.A.C."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Información de contacto */}
                {cuestionario.telefono && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Soporte técnico:</strong> {cuestionario.telefono}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <button
                    onClick={iniciarEvaluacion}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    Iniciar Evaluación
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cuestionario */}
      <AnimatePresence>
        {mostrarCuestionario && (
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
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Información de progreso */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {modoRevision
                      ? "Modo revisión"
                      : `Pregunta ${preguntaActual + 1} de ${cuestionario.preguntas.length}`}
                  </span>
                  {!modoRevision && !mostrarResultados && (
                    <div className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">
                      {preguntasRespondidas} de {cuestionario.preguntas.length} respondidas
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
                      {cuestionario.preguntas[preguntaActual] && (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-6">
                            {preguntaActual + 1}. {cuestionario.preguntas[preguntaActual].pregunta}
                          </h3>
                          <div className="space-y-3">
                            {cuestionario.preguntas[preguntaActual].opciones.map((opcion, i) => {
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
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  // Modo revisión
                  <div className="space-y-8">
                    {cuestionario.preguntas.map((pregunta, index) => {
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
                                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

              {/* Navegación y botones */}
              <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
                {!modoRevision ? (
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
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Anterior
                    </button>

                    <div className="hidden md:flex items-center gap-1 mx-2">
                      {cuestionario.preguntas.map((_, index) => (
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
                      disabled={preguntaActual === cuestionario.preguntas.length - 1}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                        preguntaActual === cuestionario.preguntas.length - 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Siguiente
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setModoRevision(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    Volver a resultados
                  </button>
                )}

                {!mostrarResultados && !modoRevision && (
                  <button
                    onClick={() => handleEnviar(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md hover:shadow-green-500/20 transition-all duration-300 flex items-center gap-2 font-medium"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Finalizar evaluación
                  </button>
                )}

                {mostrarResultados && modoRevision && (
                  <button
                    onClick={() => window.history.back()}
                    className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Cerrar evaluación
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EvaluacionEmpresa
