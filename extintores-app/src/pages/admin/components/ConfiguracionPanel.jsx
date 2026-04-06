"use client"

import { useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { db, storage } from "../../../firebase/firebaseConfig"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import Swal from "sweetalert2"
import { motion, AnimatePresence } from "framer-motion"
import { XCircleIcon } from "@heroicons/react/24/solid"

const PIN_VALIDO = "140603"

function ConfiguracionPanel({ visible, empresaId }) {
  // Estados para configuración del sistema
  const [nombreSistema, setNombreSistema] = useState("")
  const [logoSistemaFile, setLogoSistemaFile] = useState(null)
  const [logoSistemaPreview, setLogoSistemaPreview] = useState(null)
  const inputSistemaRef = useRef(null)

  // No tabActiva needed anymore since we only show System settings
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

  // Company fetch logic removed, now handled exclusively by EditarEmpresaPanel

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

  // Company validation and save logic removed, handled by EditarEmpresaPanel

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto p-6"
    >
      {/* Header Profesional y Limpio */}
      <div className="bg-white rounded-t-3xl p-8 border-x border-t border-gray-100 shadow-sm relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panel de Configuración</h1>
            <p className="text-gray-500 font-medium text-sm mt-0.5">Control centralizado del sistema</p>
          </div>
        </div>
      </div>

      {/* Contenedor de Contenido Principal */}
      <div className="bg-white rounded-b-2xl shadow-sm border-x border-b border-gray-200 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            <div className="space-y-6">
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
                      <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={nombreSistema}
                    onChange={(e) => setNombreSistema(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm"
                    placeholder="Ej: Sistema de Extintores Perú"
                  />
                </div>
              </div>

              {/* Logo del sistema */}
              <section className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Logo del Sistema</label>
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
                  <div className="relative group bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex items-center justify-center min-h-[120px] min-w-[120px]">
                    {logoSistemaPreview ? (
                      <img
                        src={logoSistemaPreview}
                        alt="Logo del sistema"
                        className="max-h-24 max-w-[200px] object-contain transition-transform duration-300 group-hover:scale-105 mix-blend-multiply"
                      />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs mt-1">Sin logo</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <p className="text-gray-500 text-sm">
                      Se recomienda una imagen PNG con fondo transparente.
                    </p>
                    <div className="flex justify-center sm:justify-start">
                      <button
                        onClick={() => inputSistemaRef.current.click()}
                        className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all active:scale-95 flex items-center gap-2 text-sm shadow-sm cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        Elegir imagen
                      </button>
                    </div>
                  </div>

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
              </section>

              <div className="flex justify-end pt-5 border-t border-gray-200">
                <button
                  onClick={handleGuardarSistema}
                  className="bg-red-600 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-red-700 transition-all active:scale-95 font-semibold flex items-center gap-2 text-sm cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  Guardar Configuración
                </button>
              </div>
            </div>
          </motion.div>
      </div>
    </motion.div>
  )
}

export default ConfiguracionPanel
