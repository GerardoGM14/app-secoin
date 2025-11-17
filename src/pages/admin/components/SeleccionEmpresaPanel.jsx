"use client"

// src/pages/admin/components/SeleccionEmpresaPanel.jsx
import { useEffect, useState } from "react"
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "../../../firebase/firebaseConfig"
import Swal from "sweetalert2"

function SeleccionEmpresaPanel({ setEmpresaSeleccionada }) {
  const [empresas, setEmpresas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [hoverTimer, setHoverTimer] = useState(null)
  const [hoveredEmpresa, setHoveredEmpresa] = useState(null)
  const [showDeleteButton, setShowDeleteButton] = useState(null)
  const [showEditButton, setShowEditButton] = useState(null)
  const [busqueda, setBusqueda] = useState("")
  const [ordenamiento, setOrdenamiento] = useState("alfabetico") // "alfabetico", "fecha", "id"

  useEffect(() => {
    const obtenerEmpresas = async () => {
      setCargando(true)
      try {
        const snap = await getDocs(collection(db, "usuarios"))
        const lista = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((usuario) => usuario.rol === "empresa")
        setEmpresas(lista)
      } catch (error) {
        console.error("Error al obtener empresas:", error)
        Swal.fire("Error", "No se pudieron cargar las empresas", "error")
      } finally {
        setCargando(false)
      }
    }
    obtenerEmpresas()
  }, [])

  const seleccionarEmpresa = async (empresa) => {
    const { value: pin } = await Swal.fire({
      title: "Validación requerida",
      input: "password",
      inputPlaceholder: "Ingresa el PIN",
      inputAttributes: { maxlength: 6 },
      confirmButtonText: "Confirmar",
      showCancelButton: true,
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
      buttonsStyling: true,
    })

    if (pin !== "140603") {
      Swal.fire("Error", "PIN incorrecto", "error")
      return
    }

    setEmpresaSeleccionada(empresa)
    Swal.fire("Seleccionado", `Ahora estás gestionando a ${empresa.correo}`, "success")
  }

  const cerrarSesion = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Serás redirigido al login",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
      buttonsStyling: true,
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "/"
      }
    })
  }

  const eliminarEmpresa = async (empresa, event) => {
    event.stopPropagation() // Evitar que se ejecute seleccionarEmpresa

    // Solicitar PIN
    const { value: pin } = await Swal.fire({
      title: "⚠️ Eliminar Empresa",
      text: `¿Estás seguro de eliminar a ${empresa.correo}? Esta acción no se puede deshacer.`,
      input: "password",
      inputPlaceholder: "Ingresa el PIN de administrador",
      inputAttributes: { maxlength: 6 },
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
      icon: "warning",
      confirmButtonColor: "#dc2626",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
      buttonsStyling: true,
    })

    if (pin !== "140603") {
      Swal.fire("Error", "PIN incorrecto", "error")
      return
    }

    // Confirmar eliminación
    const confirmacion = await Swal.fire({
      title: "Última confirmación",
      text: `Se eliminará permanentemente a ${empresa.correo} de toda la base de datos`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
      buttonsStyling: true,
    })

    if (!confirmacion.isConfirmed) return

    try {
      // Eliminar de Firebase
      await deleteDoc(doc(db, "usuarios", empresa.id))

      // Actualizar la lista local
      setEmpresas(empresas.filter((emp) => emp.id !== empresa.id))

      Swal.fire({
        title: "Eliminado",
        text: `${empresa.correo} ha sido eliminado exitosamente`,
        icon: "success",
        confirmButtonColor: "#059669",
      })
    } catch (error) {
      console.error("Error al eliminar empresa:", error)
      Swal.fire("Error", "No se pudo eliminar la empresa", "error")
    }
  }

  const editarEmpresa = async (empresa, event) => {
    event.stopPropagation() // Evitar que se ejecute seleccionarEmpresa

    // Solicitar PIN
    const { value: pin } = await Swal.fire({
      title: "🔐 Validación requerida",
      text: `Editar imagen de ${empresa.correo}`,
      input: "password",
      inputPlaceholder: "Ingresa el PIN de administrador",
      inputAttributes: { maxlength: 6 },
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
      icon: "question",
      confirmButtonColor: "#3b82f6",
      customClass: {
        confirmButton: "swal-confirm-button",
        cancelButton: "swal-cancel-button",
      },
      buttonsStyling: true,
    })

    if (pin !== "140603") {
      Swal.fire("Error", "PIN incorrecto", "error")
      return
    }

    // Crear input file
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"

    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire("Error", "La imagen no debe superar los 5MB", "error")
        return
      }

      // Mostrar loading
      Swal.fire({
        title: "Subiendo imagen...",
        text: "Por favor espera mientras se procesa la imagen",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        },
      })

      try {
        // Subir imagen a Storage
        const imageRef = ref(storage, `empresas/${empresa.id}/logo.${file.name.split(".").pop()}`)
        await uploadBytes(imageRef, file)
        const imageUrl = await getDownloadURL(imageRef)

        // Actualizar documento en Firestore
        await updateDoc(doc(db, "usuarios", empresa.id), {
          logoUrl: imageUrl,
        })

        // Actualizar lista local
        setEmpresas(empresas.map((emp) => (emp.id === empresa.id ? { ...emp, logoUrl: imageUrl } : emp)))

        Swal.fire({
          title: "¡Éxito!",
          text: `Imagen de ${empresa.correo} actualizada correctamente`,
          icon: "success",
          confirmButtonColor: "#059669",
        })
      } catch (error) {
        console.error("Error al subir imagen:", error)
        Swal.fire("Error", "No se pudo subir la imagen", "error")
      }
    }

    input.click()
  }

  // Función para generar un color aleatorio pero consistente basado en el correo
  const getColorForEmail = (email) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-green-500 to-green-600",
      "bg-gradient-to-br from-yellow-500 to-yellow-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600",
      "bg-gradient-to-br from-red-500 to-red-600",
      "bg-gradient-to-br from-teal-500 to-teal-600",
    ]

    // Usar la suma de los códigos ASCII de los caracteres del correo como semilla
    const seed = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[seed % colors.length]
  }

  // Función para obtener las iniciales del correo
  const getInitials = (email) => {
    const parts = email.split("@")[0].split(".")
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  const handleMouseEnter = (empresaId) => {
    const timer = setTimeout(() => {
      setShowDeleteButton(empresaId)
      setShowEditButton(empresaId)
    }, 5000) // 5 segundos

    setHoverTimer(timer)
    setHoveredEmpresa(empresaId)
  }

  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      setHoverTimer(null)
    }
    setHoveredEmpresa(null)
    setShowDeleteButton(null)
    setShowEditButton(null)
  }

  // Función para filtrar y ordenar empresas
  const empresasFiltradas = empresas
    .filter(
      (empresa) =>
        empresa.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
        empresa.id.toLowerCase().includes(busqueda.toLowerCase()),
    )
    .sort((a, b) => {
      switch (ordenamiento) {
        case "alfabetico":
          return a.correo.localeCompare(b.correo)
        case "fecha":
          return new Date(b.fechaCreacion?.seconds * 1000 || 0) - new Date(a.fechaCreacion?.seconds * 1000 || 0)
        case "id":
          return a.id.localeCompare(b.id)
        default:
          return 0
      }
    })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .empresa-card {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
          position: relative;
        }
        
        .empresa-card:hover .empresa-icon {
          animation: pulse 1s infinite;
        }
        
        .loading-pulse {
          animation: pulse 1.5s infinite;
        }

        .delete-button, .edit-button {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>

      <div className="flex flex-col gap-6 mb-8">
        {/* Header con título y botón */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 p-2 rounded-lg">👥</span>
              Seleccionar Empresa
            </h2>
            <p className="text-gray-600 mt-2">Gestiona los datos de una empresa desde tu panel de administrador.</p>
          </div>

          <button
            onClick={cerrarSesion}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-red-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar sesión
          </button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Barra de búsqueda */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar empresa por correo o ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50 hover:bg-white"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
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
              )}
            </div>

            {/* Selector de ordenamiento */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Ordenar por:</label>
              <select
                value={ordenamiento}
                onChange={(e) => setOrdenamiento(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white min-w-[140px]"
              >
                <option value="alfabetico">📝 Alfabético</option>
                <option value="fecha">📅 Fecha registro</option>
                <option value="id">🆔 ID</option>
              </select>
            </div>

            {/* Contador de resultados */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z"
                />
              </svg>
              <span className="font-medium">
                {empresasFiltradas.length} de {empresas.length}
              </span>
            </div>
          </div>

          {/* Indicador de búsqueda activa */}
          {busqueda && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
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
              <span>
                Mostrando resultados para: <strong>"{busqueda}"</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando empresas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {empresasFiltradas.length === 0 ? (
            busqueda ? (
              <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-yellow-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-yellow-700">No se encontraron resultados</h3>
                <p className="text-gray-600 mt-2">
                  No hay empresas que coincidan con "{busqueda}". Intenta con otros términos.
                </p>
                <button
                  onClick={() => setBusqueda("")}
                  className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Limpiar búsqueda
                </button>
              </div>
            ) : (
              <div className="col-span-full bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mx-auto text-blue-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="text-xl font-semibold text-blue-700">No hay empresas disponibles</h3>
                <p className="text-gray-600 mt-2">No se encontraron empresas registradas en el sistema.</p>
              </div>
            )
          ) : (
            empresasFiltradas.map((empresa, index) => (
              <div
                key={empresa.id}
                className="empresa-card bg-white border border-gray-200 hover:border-blue-300 rounded-xl overflow-hidden shadow-sm hover:shadow-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col relative"
                style={{ animationDelay: `${index * 0.1}s` }}
                onMouseEnter={() => handleMouseEnter(empresa.id)}
                onMouseLeave={handleMouseLeave}
                onClick={() => seleccionarEmpresa(empresa)}
              >
                {showDeleteButton === empresa.id && (
                  <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-10">
                    <button
                      onClick={(e) => eliminarEmpresa(empresa, e)}
                      className="delete-button bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg hover:shadow-red-500/30 transition-all duration-300 group"
                      title="Eliminar empresa"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 group-hover:scale-110 transition-transform duration-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>

                    {showEditButton === empresa.id && (
                      <button
                        onClick={(e) => editarEmpresa(empresa, e)}
                        className="edit-button bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group"
                        title="Editar imagen de empresa"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 group-hover:scale-110 transition-transform duration-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center p-5 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold mr-4 overflow-hidden">
                    {empresa.logoUrl ? (
                      <img
                        src={empresa.logoUrl || "/placeholder.svg"}
                        alt={`Logo de ${empresa.correo}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = "none"
                          e.target.nextSibling.style.display = "flex"
                        }}
                      />
                    ) : null}
                    <div
                      className={`empresa-icon w-full h-full rounded-lg flex items-center justify-center text-white font-bold ${getColorForEmail(empresa.correo)} ${empresa.logoUrl ? "hidden" : ""}`}
                    >
                      {getInitials(empresa.correo)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">{empresa.correo}</h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2.001 2.001 0 000-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                        />
                      </svg>
                      <span className="font-mono truncate">{empresa.id}</span>
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 mt-auto">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600 font-medium">Gestionar</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-blue-500 transform transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default SeleccionEmpresaPanel

