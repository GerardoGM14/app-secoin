"use client"

import { useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { db, storage } from "../../../firebase/firebaseConfig"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import Swal from "sweetalert2"
import { motion } from "framer-motion"

const PIN_VALIDO = "140603"

function ConfiguracionPanel({ visible, empresaId }) {
  // Estados para configuración del sistema
  const [nombreSistema, setNombreSistema] = useState("")
  const [logoSistemaFile, setLogoSistemaFile] = useState(null)
  const [logoSistemaPreview, setLogoSistemaPreview] = useState(null)
  const inputSistemaRef = useRef(null)

  // Estados para empresa (usando la lógica original)
  const [empresa, setEmpresa] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const inputRef = useRef()
  const [ruc, setRuc] = useState("")

  const [tabActiva, setTabActiva] = useState("sistema")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      // Cargar configuración del sistema
      const snapSistema = await getDoc(doc(db, "configuracion", "sistema"))
      if (snapSistema.exists()) {
        const data = snapSistema.data()
        setNombreSistema(data.nombre || "")
        setLogoSistemaPreview(data.logoURL || null)
      }
    }
    if (visible) {
      fetchData()
      console.log("ConfiguracionPanel - empresaId:", empresaId)
    }
  }, [visible])

  // Lógica original para cargar empresa
  useEffect(() => {
    const cargarEmpresa = async () => {
      const snap = await getDoc(doc(db, "usuarios", empresaId))
      if (snap.exists()) {
        const data = snap.data()
        setEmpresa(data)
        setLogoPreview(data.logoURL || null)
        setRuc(data.ruc || "")
      }
    }
    if (empresaId) cargarEmpresa()
  }, [empresaId])

  const handleGuardarSistema = async () => {
    const { value: pin } = await Swal.fire({
      title: "Verificación de Seguridad",
      html: `
                <div class="text-center mb-4">
                    <div class="bg-red-100 text-red-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p class="text-gray-600">Ingresa el PIN de autorización para guardar los cambios del sistema</p>
                </div>
            `,
      input: "password",
      inputPlaceholder: "••••••",
      inputAttributes: {
        maxlength: 6,
        autocapitalize: "off",
        autocorrect: "off",
        class: "text-center text-lg tracking-widest",
      },
      confirmButtonText: "Confirmar",
      confirmButtonColor: "#dc2626",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
    })

    if (pin !== PIN_VALIDO) {
      if (pin) {
        Swal.fire({
          icon: "error",
          title: "PIN Incorrecto",
          text: "El PIN ingresado no es válido.",
          confirmButtonColor: "#dc2626",
        })
      }
      return
    }

    try {
      Swal.fire({
        title: "Guardando configuración...",
        html: `
                    <div class="flex items-center justify-center">
                        <svg class="animate-spin h-8 w-8 text-red-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Por favor espere...</span>
                    </div>
                `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      })

      let logoURL = logoSistemaPreview

      if (logoSistemaFile) {
        const storageRef = ref(storage, `logos/logo.png`)
        await uploadBytes(storageRef, logoSistemaFile)
        logoURL = await getDownloadURL(storageRef)
      }

      await setDoc(doc(db, "configuracion", "sistema"), {
        nombre: nombreSistema,
        logoURL,
      })

      Swal.fire({
        icon: "success",
        title: "Configuración Guardada",
        text: "La configuración del sistema se actualizó correctamente.",
        confirmButtonColor: "#dc2626",
      })
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar la configuración del sistema.",
        confirmButtonColor: "#dc2626",
      })
    }
  }

  // Lógica original para validar RUC
  const validarRUC = async () => {
    if (!ruc || ruc.length !== 11) {
      Swal.fire("Error", "Debes ingresar un RUC válido de 11 dígitos.", "warning")
      return
    }

    try {
      Swal.fire({
        title: "Consultando...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      const respuesta = await fetch(`https://us-central1-extintores-app.cloudfunctions.net/consultarRUC?ruc=${ruc}`)

      if (!respuesta.ok) throw new Error("No se pudo validar el RUC")

      const data = await respuesta.json()

      Swal.fire({
        title: "RUC Validado ✅",
        html: `
          <p><strong>Nombre:</strong> ${data.razonSocial}</p>
          <p><strong>Dirección:</strong> ${data.direccion}</p>
          <p><strong>Condición:</strong> ${data.condicion}</p>
          <p><strong>Estado:</strong> ${data.estado}</p>
        `,
        icon: "success",
        confirmButtonText: "Guardar y bloquear campo",
      }).then((result) => {
        if (result.isConfirmed) {
          setEmpresa((prev) => ({
            ...prev,
            rucValidado: true,
            razonSocial: data.razonSocial,
          }))
        }
      })
    } catch (error) {
      console.error(error.message)
      Swal.fire("Error", "No se pudo validar el RUC.", "error")
    }
  }

  // Lógica original para guardar cambios de empresa
  const guardarCambios = async () => {
    if (!empresaId) {
      console.warn("⚠️ No hay empresaId definido.")
      return
    }

    try {
      console.log("✅ Iniciando guardado de cambios...")

      Swal.fire({
        title: "Guardando cambios...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      })

      let logoURL = empresa?.logoURL || null

      if (logoFile) {
        console.log("📦 Subiendo nuevo logo...")
        const logoRef = ref(storage, `logos_empresas/${empresaId}`)
        await uploadBytes(logoRef, logoFile)
        logoURL = await getDownloadURL(logoRef)
        console.log("✅ Logo subido y URL obtenida:", logoURL)
      }

      console.log("📄 Datos que se enviarán a Firestore:", {
        ...empresa,
        ruc,
        logoURL,
        rucValidado: empresa?.rucValidado ?? false,
      })

      await setDoc(doc(db, "usuarios", empresaId), {
        ...empresa,
        ruc,
        logoURL,
        rucValidado: empresa?.rucValidado ?? false,
      })

      console.log("✅ Cambios guardados exitosamente.")
      Swal.fire("Éxito", "Datos actualizados correctamente.", "success")
    } catch (error) {
      console.error("❌ Error al guardar cambios:", error)
      Swal.fire("Error", "No se pudieron guardar los cambios.", "error")
    }
  }

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto p-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-full p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Panel de Configuración</h1>
            <p className="text-red-100 mt-1">Gestiona la configuración del sistema y datos de empresa</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setTabActiva("sistema")}
            className={`px-6 py-4 font-medium transition-colors ${
              tabActiva === "sistema"
                ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z"
                  clipRule="evenodd"
                />
                <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-1v-1z" />
              </svg>
              Configuración del Sistema
            </div>
          </button>
          <button
            onClick={() => setTabActiva("empresa")}
            className={`px-6 py-4 font-medium transition-colors ${
              tabActiva === "empresa"
                ? "text-red-600 border-b-2 border-red-600 bg-red-50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
                  clipRule="evenodd"
                />
              </svg>
              Datos de Empresa
            </div>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-b-2xl shadow-xl">
        {tabActiva === "sistema" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="p-8"
          >
            <div className="space-y-8">
              {/* Nombre del sistema */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Nombre del Sistema</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={nombreSistema}
                    onChange={(e) => setNombreSistema(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Ej: Sistema de Extintores Perú"
                  />
                </div>
              </div>

              {/* Logo del sistema */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Logo del Sistema</label>
                <div className="flex items-center gap-6">
                  {logoSistemaPreview && (
                    <div className="relative group">
                      <img
                        src={logoSistemaPreview || "/placeholder.svg"}
                        alt="Logo del sistema"
                        className="h-24 w-24 rounded-2xl shadow-lg border-4 border-white object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-2xl transition-all"></div>
                    </div>
                  )}
                  <button
                    onClick={() => inputSistemaRef.current.click()}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Seleccionar Logo
                    </div>
                  </button>
                  <input
                    ref={inputSistemaRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        setLogoSistemaFile(file)
                        setLogoSistemaPreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                </div>
              </div>

              {/* Botón guardar sistema */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={handleGuardarSistema}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Guardar Configuración
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {tabActiva === "empresa" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="p-8"
          >
            <div className="space-y-8">
              {/* Campo RUC */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">RUC de la Empresa</label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={ruc}
                      onChange={(e) => setRuc(e.target.value)}
                      disabled={empresa?.rucValidado}
                      className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                        empresa?.rucValidado ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "border-gray-300"
                      }`}
                      placeholder="Ej: 20123456789"
                      maxLength="11"
                    />
                    {empresa?.rucValidado && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
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
                      </div>
                    )}
                  </div>

                  {/* Si NO ha validado todavía, muestra botón VALIDAR */}
                  {!empresa?.rucValidado && (
                    <button
                      onClick={validarRUC}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Validar
                      </div>
                    </button>
                  )}

                  {/* Si YA está validado, muestra botón EDITAR */}
                  {empresa?.rucValidado && (
                    <button
                      onClick={async () => {
                        const { value: pin } = await Swal.fire({
                          title: "PIN requerido",
                          input: "password",
                          inputPlaceholder: "••••",
                          showCancelButton: true,
                          confirmButtonText: "Desbloquear",
                          inputAttributes: {
                            maxlength: 6,
                            autocapitalize: "off",
                            autocorrect: "off",
                          },
                        })

                        if (pin === "140603") {
                          setEmpresa((prev) => ({ ...prev, rucValidado: false }))
                          Swal.fire("Desbloqueado", "Ahora puedes editar el RUC.", "success")
                        } else if (pin) {
                          Swal.fire("Error", "PIN incorrecto.", "error")
                        }
                      }}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-4 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Editar
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {/* Logo de empresa */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Logo de la Empresa</label>
                <div className="flex items-center gap-6">
                  {logoPreview && (
                    <div className="relative group">
                      <img
                        src={logoPreview || "/placeholder.svg"}
                        alt="Logo de empresa"
                        className="h-24 w-24 rounded-2xl shadow-lg border-4 border-white object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-2xl transition-all"></div>
                    </div>
                  )}
                  <button
                    onClick={() => inputRef.current.click()}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Seleccionar Logo
                    </div>
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        setLogoFile(file)
                        setLogoPreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                </div>
              </div>

              {/* Botón guardar empresa */}
              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={guardarCambios}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Guardar Cambios
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default ConfiguracionPanel
