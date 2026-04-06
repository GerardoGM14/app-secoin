"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { User, Building, BadgeIcon as IdCard, Briefcase, Mail, Phone, CheckCircle, AlertCircle } from "lucide-react"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import Swal from "sweetalert2"

const RegistroTrabajadorPublico = () => {
  const { pin } = useParams()
  const navigate = useNavigate()
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registrando, setRegistrando] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    cargo: "",
    email: "",
    telefono: "",
  })

  useEffect(() => {
    verificarPin()
  }, [pin])

  const verificarPin = async () => {
    try {
      setLoading(true)

      // Buscar empresa por PIN
      const empresasQuery = query(collection(db, "usuarios"), where("pin", "==", pin), where("rol", "==", "empresa"))

      const empresasSnapshot = await getDocs(empresasQuery)

      if (!empresasSnapshot.empty) {
        const empresaData = empresasSnapshot.docs[0].data()
        setEmpresa(empresaData)
      } else {
        Swal.fire({
          icon: "error",
          title: "PIN inválido",
          text: "El PIN proporcionado no corresponde a ninguna empresa registrada.",
          confirmButtonColor: "#dc2626",
        })
      }
    } catch (error) {
      console.error("Error verificando PIN:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al verificar el PIN. Inténtalo de nuevo.",
        confirmButtonColor: "#dc2626",
      })
    } finally {
      setLoading(false)
    }
  }

  const manejarCambio = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validarFormulario = () => {
    const { nombre, dni, cargo, email } = formData

    if (!nombre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El nombre es obligatorio.",
        confirmButtonColor: "#dc2626",
      })
      return false
    }

    if (!dni.trim() || dni.length !== 8) {
      Swal.fire({
        icon: "warning",
        title: "DNI inválido",
        text: "El DNI debe tener exactamente 8 dígitos.",
        confirmButtonColor: "#dc2626",
      })
      return false
    }

    if (!cargo.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El cargo es obligatorio.",
        confirmButtonColor: "#dc2626",
      })
      return false
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      Swal.fire({
        icon: "warning",
        title: "Email inválido",
        text: "Por favor ingresa un email válido.",
        confirmButtonColor: "#dc2626",
      })
      return false
    }

    return true
  }

  const registrarTrabajador = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) return

    try {
      setRegistrando(true)

      // Verificar si el DNI ya está registrado
      const trabajadoresQuery = query(
        collection(db, "usuarios"),
        where("dni", "==", formData.dni),
        where("rol", "==", "trabajador"),
      )

      const trabajadoresSnapshot = await getDocs(trabajadoresQuery)

      if (!trabajadoresSnapshot.empty) {
        Swal.fire({
          icon: "error",
          title: "DNI ya registrado",
          text: "Ya existe un trabajador registrado con este DNI.",
          confirmButtonColor: "#dc2626",
        })
        return
      }

      // Registrar trabajador
      const trabajadorData = {
        ...formData,
        rol: "trabajador",
        empresa: empresa.empresa,
        empresaPin: pin,
        fechaRegistro: serverTimestamp(),
        estado: "activo",
      }

      await addDoc(collection(db, "usuarios"), trabajadorData)

      Swal.fire({
        icon: "success",
        title: "¡Registro exitoso!",
        text: `Bienvenido ${formData.nombre}. Tu registro ha sido completado.`,
        confirmButtonColor: "#16a34a",
      }).then(() => {
        // Guardar datos en localStorage para login automático
        localStorage.setItem(
          "usuario",
          JSON.stringify({
            ...trabajadorData,
            id: "temp-id", // Se actualizará en el login real
          }),
        )

        // Redirigir al dashboard del trabajador
        navigate("/trabajador/dashboard")
      })
    } catch (error) {
      console.error("Error registrando trabajador:", error)
      Swal.fire({
        icon: "error",
        title: "Error en el registro",
        text: "Hubo un problema al registrar el trabajador. Inténtalo de nuevo.",
        confirmButtonColor: "#dc2626",
      })
    } finally {
      setRegistrando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando PIN...</p>
        </div>
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">PIN no válido</h2>
          <p className="text-gray-600 mb-6">El PIN proporcionado no corresponde a ninguna empresa registrada.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registro de Trabajador</h1>
            <p className="text-gray-600">Regístrate para acceder a los cursos de capacitación</p>
          </div>

          {/* Información de la empresa */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <Building className="text-blue-600" size={20} />
              <div>
                <p className="font-semibold text-blue-900">{empresa.empresa}</p>
                <p className="text-sm text-blue-700">PIN: {pin}</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={registrarTrabajador} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={manejarCambio}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ingresa tu nombre completo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">DNI *</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={manejarCambio}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="12345678"
                  maxLength="8"
                  pattern="[0-9]{8}"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cargo *</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  name="cargo"
                  value={formData.cargo}
                  onChange={manejarCambio}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Ej: Operario, Supervisor, etc."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email (opcional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={manejarCambio}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono (opcional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={manejarCambio}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="999 999 999"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registrando}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {registrando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Registrarme
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta?{" "}
              <button onClick={() => navigate("/")} className="text-red-600 hover:text-red-700 font-medium">
                Iniciar sesión
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default RegistroTrabajadorPublico
