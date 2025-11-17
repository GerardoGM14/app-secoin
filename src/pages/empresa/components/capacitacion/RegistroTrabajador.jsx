"use client"

import { useState } from "react"
import {
  Search,
  Building2,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react"
import Swal from "sweetalert2"

const RegistroTrabajador = () => {
  const [formData, setFormData] = useState({
    dni: "",
    pin: "",
    nombres: "",
    apellidos: "",
    email: "",
    telefono: "",
    cargo: "",
    area: "",
    password: "",
    confirmPassword: "",
  })

  const [empresaInfo, setEmpresaInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [validatingPin, setValidatingPin] = useState(false)
  const [validatingDni, setValidatingDni] = useState(false)
  const [dniValidated, setDniValidated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})

  // Validar DNI peruano (8 dígitos)
  const validarDNI = (dni) => {
    const dniRegex = /^\d{8}$/
    return dniRegex.test(dni)
  }

  // Validar DNI con RENIEC
  const validarDniConReniec = async (dni) => {
    if (!validarDNI(dni)) return

    setValidatingDni(true)
    setDniValidated(false)
    try {
      const response = await fetch(`https://us-central1-autoclean360-3e0f7.cloudfunctions.net/reniecLookup?dni=${dni}`)

      if (!response.ok) {
        throw new Error("DNI no válido o no encontrado")
      }

      const data = await response.json()
      console.log("Datos RENIEC:", data)

      // Autocompletar nombres si están disponibles
      if (data.nombres && data.apellidos) {
        setFormData((prev) => ({
          ...prev,
          nombres: data.nombres || "",
          apellidos: `${data.apellidoPaterno || ""} ${data.apellidoMaterno || ""}`.trim(),
        }))

        setDniValidated(true)
        setErrors((prev) => ({ ...prev, dni: "" }))

        Swal.fire({
          title: "DNI Validado",
          html: `
            <div class="text-left">
              <p><strong>Nombres:</strong> ${data.nombres}</p>
              <p><strong>Apellidos:</strong> ${data.apellidoPaterno} ${data.apellidoMaterno}</p>
            </div>
          `,
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        })
      }
    } catch (error) {
      console.error("Error al validar DNI:", error)
      setErrors((prev) => ({ ...prev, dni: "DNI no válido o no encontrado en RENIEC" }))
      setDniValidated(false)
    } finally {
      setValidatingDni(false)
    }
  }

  // Validar email
  const validarEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validar teléfono peruano
  const validarTelefono = (telefono) => {
    const telefonoRegex = /^9\d{8}$/
    return telefonoRegex.test(telefono)
  }

  // Buscar empresa por PIN
  const buscarEmpresaPorPin = async (pin) => {
    if (pin.length !== 6) return

    setValidatingPin(true)
    try {
      // Simulación de API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Datos simulados de empresa
      const empresasSimuladas = {
        ABC123: {
          id: 1,
          nombre: "Constructora San Martín S.A.C.",
          ruc: "20123456789",
          direccion: "Av. Industrial 123, Lima",
          contacto: "Juan Pérez",
          email: "contacto@sanmartin.com",
          telefono: "01-234-5678",
          fechaRegistro: "2024-01-15",
          cursosActivos: 3,
          trabajadoresRegistrados: 45,
        },
        XYZ789: {
          id: 2,
          nombre: "Minera Los Andes S.A.",
          ruc: "20987654321",
          direccion: "Jr. Minería 456, Arequipa",
          contacto: "María García",
          email: "info@mineraandes.com",
          telefono: "054-123-456",
          fechaRegistro: "2024-02-20",
          cursosActivos: 5,
          trabajadoresRegistrados: 120,
        },
      }

      const empresa = empresasSimuladas[pin]
      if (empresa) {
        setEmpresaInfo(empresa)
        setErrors((prev) => ({ ...prev, pin: "" }))
      } else {
        setEmpresaInfo(null)
        setErrors((prev) => ({ ...prev, pin: "PIN no válido o empresa no encontrada" }))
      }
    } catch (error) {
      console.error("Error al buscar empresa:", error)
      setErrors((prev) => ({ ...prev, pin: "Error al validar PIN" }))
    } finally {
      setValidatingPin(false)
    }
  }

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Limpiar errores al escribir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    // Validar DNI con RENIEC cuando tenga 8 dígitos
    if (name === "dni" && value.length === 8 && validarDNI(value)) {
      validarDniConReniec(value)
    } else if (name === "dni" && value.length < 8) {
      setDniValidated(false)
    }

    // Validar PIN en tiempo real
    if (name === "pin" && value.length === 6) {
      buscarEmpresaPorPin(value)
    } else if (name === "pin" && value.length < 6) {
      setEmpresaInfo(null)
    }
  }

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!formData.dni) {
      nuevosErrores.dni = "DNI es requerido"
    } else if (!validarDNI(formData.dni)) {
      nuevosErrores.dni = "DNI debe tener 8 dígitos"
    } else if (!dniValidated) {
      nuevosErrores.dni = "DNI debe ser validado con RENIEC"
    }

    if (!formData.pin) {
      nuevosErrores.pin = "PIN es requerido"
    } else if (formData.pin.length !== 6) {
      nuevosErrores.pin = "PIN debe tener 6 caracteres"
    } else if (!empresaInfo) {
      nuevosErrores.pin = "PIN no válido"
    }

    if (!formData.nombres.trim()) {
      nuevosErrores.nombres = "Nombres son requeridos"
    }

    if (!formData.apellidos.trim()) {
      nuevosErrores.apellidos = "Apellidos son requeridos"
    }

    if (!formData.email) {
      nuevosErrores.email = "Email es requerido"
    } else if (!validarEmail(formData.email)) {
      nuevosErrores.email = "Email no válido"
    }

    if (!formData.telefono) {
      nuevosErrores.telefono = "Teléfono es requerido"
    } else if (!validarTelefono(formData.telefono)) {
      nuevosErrores.telefono = "Teléfono debe empezar con 9 y tener 9 dígitos"
    }

    if (!formData.cargo.trim()) {
      nuevosErrores.cargo = "Cargo es requerido"
    }

    if (!formData.area.trim()) {
      nuevosErrores.area = "Área es requerida"
    }

    if (!formData.password) {
      nuevosErrores.password = "Contraseña es requerida"
    } else if (formData.password.length < 6) {
      nuevosErrores.password = "Contraseña debe tener al menos 6 caracteres"
    }

    if (!formData.confirmPassword) {
      nuevosErrores.confirmPassword = "Confirmar contraseña es requerido"
    } else if (formData.password !== formData.confirmPassword) {
      nuevosErrores.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) {
      return
    }

    setLoading(true)
    try {
      // Simulación de registro
      await new Promise((resolve) => setTimeout(resolve, 2000))

      console.log("Datos de registro:", {
        ...formData,
        empresa: empresaInfo,
        dniValidado: dniValidated,
        fechaRegistro: new Date().toISOString(),
      })

      await Swal.fire({
        title: "¡Registro Exitoso!",
        html: `
          <div class="text-left">
            <p><strong>Bienvenido:</strong> ${formData.nombres} ${formData.apellidos}</p>
            <p><strong>Empresa:</strong> ${empresaInfo.nombre}</p>
            <p><strong>DNI:</strong> ${formData.dni} ✓</p>
            <hr>
            <p class="text-sm text-gray-600">Ya puedes acceder a las capacitaciones disponibles</p>
          </div>
        `,
        icon: "success",
        confirmButtonText: "Ir al Dashboard",
        confirmButtonColor: "#dc2626",
      })

      // Aquí redireccionar al dashboard del trabajador
      // window.location.href = '/trabajador/dashboard';
    } catch (error) {
      console.error("Error en registro:", error)
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al registrar. Intenta nuevamente.",
        icon: "error",
        confirmButtonColor: "#dc2626",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Registro de Trabajador</h1>
          <p className="text-gray-600">Regístrate para acceder a las capacitaciones de tu empresa</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sección: Datos de Acceso */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Search className="w-5 h-5 mr-2 text-red-600" />
                    Datos de Acceso
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* DNI */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">DNI *</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="dni"
                          value={formData.dni}
                          onChange={handleInputChange}
                          maxLength="8"
                          placeholder="12345678"
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                            errors.dni ? "border-red-500" : dniValidated ? "border-green-500" : "border-gray-300"
                          }`}
                        />
                        <div className="absolute right-3 top-3">
                          {validatingDni ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                          ) : dniValidated ? (
                            <UserCheck className="w-5 h-5 text-green-600" />
                          ) : null}
                        </div>
                      </div>
                      {errors.dni && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.dni}
                        </p>
                      )}
                      {dniValidated && (
                        <p className="mt-1 text-sm text-green-600 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          DNI validado con RENIEC
                        </p>
                      )}
                    </div>

                    {/* PIN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">PIN de Empresa *</label>
                      <div className="relative">
                        <input
                          type="text"
                          name="pin"
                          value={formData.pin}
                          onChange={handleInputChange}
                          maxLength="6"
                          placeholder="ABC123"
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                            errors.pin ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {validatingPin && (
                          <div className="absolute right-3 top-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                          </div>
                        )}
                      </div>
                      {errors.pin && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.pin}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección: Datos Personales */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-red-600" />
                    Datos Personales
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombres */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombres *</label>
                      <input
                        type="text"
                        name="nombres"
                        value={formData.nombres}
                        onChange={handleInputChange}
                        placeholder="Juan Carlos"
                        readOnly={dniValidated}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                          errors.nombres ? "border-red-500" : "border-gray-300"
                        } ${dniValidated ? "bg-gray-50" : ""}`}
                      />
                      {errors.nombres && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.nombres}
                        </p>
                      )}
                    </div>

                    {/* Apellidos */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
                      <input
                        type="text"
                        name="apellidos"
                        value={formData.apellidos}
                        onChange={handleInputChange}
                        placeholder="Pérez García"
                        readOnly={dniValidated}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                          errors.apellidos ? "border-red-500" : "border-gray-300"
                        } ${dniValidated ? "bg-gray-50" : ""}`}
                      />
                      {errors.apellidos && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.apellidos}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="juan.perez@email.com"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Teléfono */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                      <input
                        type="text"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        maxLength="9"
                        placeholder="987654321"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                          errors.telefono ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.telefono && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.telefono}
                        </p>
                      )}
                    </div>

                    {/* Cargo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cargo *</label>
                      <input
                        type="text"
                        name="cargo"
                        value={formData.cargo}
                        onChange={handleInputChange}
                        placeholder="Operario de Construcción"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                          errors.cargo ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.cargo && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.cargo}
                        </p>
                      )}
                    </div>

                    {/* Área */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Área *</label>
                      <input
                        type="text"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="Seguridad y Salud"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                          errors.area ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.area && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.area}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sección: Contraseña */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-red-600" />
                    Contraseña de Acceso
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contraseña */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Mínimo 6 caracteres"
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                            errors.password ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirmar Contraseña */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Contraseña *</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Repetir contraseña"
                          className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${
                            errors.confirmPassword ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón de Registro */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading || !empresaInfo || !dniValidated}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Registrando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Registrar Trabajador
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Panel de Información de Empresa */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-red-600" />
                Información de Empresa
              </h3>

              {!empresaInfo ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Ingresa el PIN de tu empresa para ver la información</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Nombre de Empresa */}
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">{empresaInfo.nombre}</h4>
                    <p className="text-sm text-red-700">RUC: {empresaInfo.ruc}</p>
                  </div>

                  {/* Información de Contacto */}
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{empresaInfo.direccion}</p>
                    </div>

                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-600">{empresaInfo.email}</p>
                    </div>

                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-600">{empresaInfo.telefono}</p>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{empresaInfo.cursosActivos}</div>
                      <div className="text-xs text-gray-500">Cursos Activos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{empresaInfo.trabajadoresRegistrados}</div>
                      <div className="text-xs text-gray-500">Trabajadores</div>
                    </div>
                  </div>

                  {/* Contacto */}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      <strong>Contacto:</strong> {empresaInfo.contacto}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Registrado: {new Date(empresaInfo.fechaRegistro).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistroTrabajador
