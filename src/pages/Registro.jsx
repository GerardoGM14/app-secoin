"use client"

import { useState, useEffect } from "react"
import { auth, db } from "../firebase/firebaseConfig"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { tsParticles } from "tsparticles-engine"
import Swal from "sweetalert2"
import { PhoneIcon, MapPinIcon } from "@heroicons/react/24/solid"

function Registro() {
  const [formData, setFormData] = useState({
    correo: "",
    contrasena: "",
    confirmarContrasena: "",
    rol: "empresa",
  })
  const [mostrarModal, setMostrarModal] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mostrarContrasena, setMostrarContrasena] = useState(false)
  const [mostrarConfirmarContrasena, setMostrarConfirmarContrasena] = useState(false)
  const [validacion, setValidacion] = useState({
    correo: true,
    contrasena: true,
    confirmarContrasena: true,
  })
  const navigate = useNavigate()

  const PIN_VALIDO = "140603"

  useEffect(() => {
    const iniciarParticulas = async () => {
      await tsParticles.load("tsparticles", {
        background: {
          color: { value: "#f8fafc" },
        },
        particles: {
          number: { value: 60 },
          color: { value: "#ef4444" },
          size: {
            value: { min: 1, max: 3 },
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 0.1,
              sync: false,
            },
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: true,
            straight: false,
            outModes: "out",
          },
          opacity: {
            value: 0.4,
            random: true,
            animation: {
              enable: true,
              speed: 0.5,
              minimumValue: 0.1,
              sync: false,
            },
          },
          links: {
            enable: true,
            color: "#ef4444",
            opacity: 0.15,
            distance: 120,
            width: 1,
          },
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
            onClick: {
              enable: true,
              mode: "push",
            },
          },
          modes: {
            grab: {
              distance: 120,
              links: {
                opacity: 0.4,
              },
            },
            push: {
              quantity: 3,
            },
          },
        },
      })
    }
    iniciarParticulas()
  }, [])

  // Validación de contraseña
  const validarContrasena = (contrasena) => {
    return {
      longitud: contrasena.length >= 6,
      numero: /\d/.test(contrasena),
      especial: /[!@#$%^&*(),.?":{}|<>]/.test(contrasena),
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    // Validación en tiempo real
    if (name === "correo") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      setValidacion({ ...validacion, correo: emailRegex.test(value) })
    }

    if (name === "contrasena") {
      const esValida = validarContrasena(value)
      setValidacion({ ...validacion, contrasena: esValida.longitud && esValida.numero })
    }

    if (name === "confirmarContrasena") {
      setValidacion({ ...validacion, confirmarContrasena: value === formData.contrasena })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")

    // Validaciones finales
    if (!validacion.correo) {
      setError("Por favor, ingresa un correo electrónico válido.")
      return
    }

    if (!validacion.contrasena) {
      setError("La contraseña debe tener al menos 6 caracteres y un número.")
      return
    }

    if (formData.contrasena !== formData.confirmarContrasena) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setMostrarModal(true)
  }

  const confirmarRegistro = async () => {
    if (pinInput !== PIN_VALIDO) {
      setError("PIN incorrecto.")
      return
    }

    setLoading(true)
    setError("")

    try {
      Swal.fire({
        title: "Creando usuario...",
        text: "Espere mientras se procesa el registro",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
      })

      const userCredential = await createUserWithEmailAndPassword(auth, formData.correo, formData.contrasena)
      const uid = userCredential.user.uid

      await setDoc(doc(db, "usuarios", uid), {
        correo: formData.correo,
        rol: formData.rol,
        fechaCreacion: new Date(),
        activo: true,
      })

      setMostrarModal(false)

      Swal.fire({
        title: "¡Registro exitoso!",
        text: "El usuario fue creado correctamente.",
        icon: "success",
        confirmButtonColor: "#ef4444",
      }).then(() => {
        navigate("/")
      })
    } catch (err) {
      console.error(err)

      let mensajeError = "No se pudo registrar el usuario."

      if (err.code === "auth/email-already-in-use") {
        mensajeError = "Este correo ya está registrado."
      } else if (err.code === "auth/weak-password") {
        mensajeError = "La contraseña debe tener al menos 6 caracteres."
      }

      Swal.fire({
        title: "Error",
        text: mensajeError,
        icon: "error",
        confirmButtonColor: "#ef4444",
      })

      setError(mensajeError)
    } finally {
      setLoading(false)
    }
  }

  const fortalezaContrasena = validarContrasena(formData.contrasena)

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden">
      {/* Fondo animado */}
      <div id="tsparticles" className="absolute inset-0 -z-10" />

      {/* Header mejorado con información de contacto */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-3 lg:space-y-0">
            {/* Información de oficina */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center space-x-3"
            >
              <div className="bg-white/20 p-2 rounded-full">
                <MapPinIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">Oficina Principal Chimbote</p>
                <p className="text-xs text-red-100">Av. Enrique Meiggs 555 / Av. Meiggs 1252. Chimbote</p>
              </div>
            </motion.div>

            {/* Información de contacto */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col lg:flex-row items-center space-y-2 lg:space-y-0 lg:space-x-6"
            >
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 p-1.5 rounded-full">
                  <PhoneIcon className="h-4 w-4 text-white" />
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-xs font-medium">Línea Secoin Informes</p>
                  <p className="text-xs text-red-100">(043) 32 4526 • (043) 61 6441</p>
                </div>
              </div>

              <div className="hidden lg:block w-px h-8 bg-white/30"></div>

              <div className="flex items-center space-x-2">
                <div className="bg-yellow-400 p-1.5 rounded-full">
                  <PhoneIcon className="h-4 w-4 text-red-700" />
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-xs font-medium">Secoin Emergencia</p>
                  <p className="text-xs text-red-100">998 398 981 • 998 398 982 • 944 974 808</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decoración inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500"></div>
      </motion.div>

      {/* Contenido principal */}
      <div className="flex items-center justify-center min-h-screen pt-8 pb-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-md mx-4"
        >
          <div className="bg-white shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] rounded-3xl overflow-hidden border border-gray-100 backdrop-blur-sm bg-white/90">
            {/* Cabecera */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>

              <div className="text-center relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                </motion.div>
                <h2 className="text-2xl font-bold mb-2">Registro de Usuario</h2>
                <p className="text-red-100 text-sm">Crea una nueva cuenta en el sistema</p>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo de correo */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      name="correo"
                      value={formData.correo}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 bg-gray-50/50 ${
                        formData.correo && !validacion.correo
                          ? "border-red-500 focus:ring-red-500 focus:border-transparent"
                          : "border-gray-200 focus:ring-red-500 focus:border-transparent"
                      }`}
                      placeholder="tu@correo.com"
                      required
                    />
                    {formData.correo && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {validacion.correo ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  {formData.correo && !validacion.correo && (
                    <p className="mt-1 text-sm text-red-600">Por favor, ingresa un correo electrónico válido</p>
                  )}
                </motion.div>

                {/* Campo de contraseña */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
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
                      type={mostrarContrasena ? "text" : "password"}
                      name="contrasena"
                      value={formData.contrasena}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 bg-gray-50/50 ${
                        formData.contrasena && !validacion.contrasena
                          ? "border-red-500 focus:ring-red-500 focus:border-transparent"
                          : "border-gray-200 focus:ring-red-500 focus:border-transparent"
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarContrasena(!mostrarContrasena)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {mostrarContrasena ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Indicador de fortaleza de contraseña */}
                  {formData.contrasena && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-xs gap-4">
                        <div
                          className={`flex items-center ${
                            fortalezaContrasena.longitud ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {fortalezaContrasena.longitud ? "✓" : "○"} Al menos 6 caracteres
                        </div>
                        <div
                          className={`flex items-center ${
                            fortalezaContrasena.numero ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {fortalezaContrasena.numero ? "✓" : "○"} Al menos un número
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Campo de confirmar contraseña */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar contraseña</label>
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
                      type={mostrarConfirmarContrasena ? "text" : "password"}
                      name="confirmarContrasena"
                      value={formData.confirmarContrasena}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 bg-gray-50/50 ${
                        formData.confirmarContrasena && !validacion.confirmarContrasena
                          ? "border-red-500 focus:ring-red-500 focus:border-transparent"
                          : "border-gray-200 focus:ring-red-500 focus:border-transparent"
                      }`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarConfirmarContrasena(!mostrarConfirmarContrasena)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {mostrarConfirmarContrasena ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formData.confirmarContrasena && !validacion.confirmarContrasena && (
                    <p className="mt-1 text-sm text-red-600">Las contraseñas no coinciden</p>
                  )}
                </motion.div>

                {/* Campo de rol */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rol del usuario</label>
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
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <select
                      name="rol"
                      value={formData.rol}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none bg-gray-50/50 transition-all duration-200"
                    >
                      <option value="administrador">👑 Administrador</option>
                      <option value="empresa">🏢 Empresa</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* Mensaje de error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg"
                    >
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón de envío */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
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
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      Registrar Usuario
                    </span>
                  )}
                </motion.button>
              </form>

              {/* Enlace para volver */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate("/")}
                  className="text-sm text-gray-600 hover:text-red-600 transition-colors font-medium flex items-center justify-center gap-1"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Volver al inicio de sesión
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modal de PIN */}
      <AnimatePresence>
        {mostrarModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
            onClick={() => {
              setMostrarModal(false)
              setPinInput("")
              setError("")
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
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Verificación de Seguridad</h3>
                  <p className="text-gray-600 text-sm">
                    Ingresa el PIN de autorización para crear el nuevo usuario en el sistema.
                  </p>
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
                      setMostrarModal(false)
                      setPinInput("")
                      setError("")
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarRegistro}
                    disabled={loading || pinInput.length !== 6}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        Verificando...
                      </span>
                    ) : (
                      "Confirmar"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="absolute bottom-4 text-center w-full text-sm text-gray-500">© 2025 Gerardo Gonzalez</footer>
    </div>
  )
}

export default Registro
