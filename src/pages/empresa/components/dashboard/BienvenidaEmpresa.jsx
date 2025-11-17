"use client"

import { motion } from "framer-motion"
import { Building2, FileText, ClipboardCheck, GraduationCap, Users, Phone, Mail, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "../../../../firebase/firebaseConfig"

function BienvenidaEmpresa() {
  const [contadores, setContadores] = useState({
    documentos: 0,
    inspecciones: 0,
    capacitaciones: 0,
    ultimaActividad: null,
  })
  const [loading, setLoading] = useState(true)
  const [horaActual, setHoraActual] = useState(new Date())

  // Obtener usuario actual
  const usuario = JSON.parse(localStorage.getItem("usuario") || "{}")

  // Actualizar hora actual cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setHoraActual(new Date())
    }, 60000) // Actualizar cada minuto

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const obtenerContadores = async () => {
      try {
        setLoading(true)

        // Colecciones de documentos a contar
        const coleccionesDocumentos = [
          "cotizaciones",
          "ordenes_compra",
          "guias_remision",
          "actas_conformidad",
          "facturas",
          "informes_detallados",
          "guias_prestamo",
          "certificados",
        ]

        let totalDocumentos = 0

        // Contar documentos de todas las colecciones
        for (const coleccion of coleccionesDocumentos) {
          try {
            const documentosQuery = query(collection(db, coleccion), where("empresaId", "==", usuario.id))
            const documentosSnapshot = await getDocs(documentosQuery)
            totalDocumentos += documentosSnapshot.size
            console.log(`${coleccion}: ${documentosSnapshot.size} documentos`)
          } catch (error) {
            console.warn(`Error al obtener ${coleccion}:`, error)
            // Continuar con las demás colecciones aunque una falle
          }
        }

        // Obtener inspecciones de la empresa
        let totalInspecciones = 0
        try {
          const inspeccionesQuery = query(collection(db, "inspecciones"), where("empresaId", "==", usuario.id))
          const inspeccionesSnapshot = await getDocs(inspeccionesQuery)
          totalInspecciones = inspeccionesSnapshot.size
          console.log(`Inspecciones: ${totalInspecciones}`)
        } catch (error) {
          console.warn("Error al obtener inspecciones:", error)
        }

        // Obtener capacitaciones/trabajadores de la empresa
        let totalCapacitaciones = 0
        try {
          const capacitacionesQuery = query(collection(db, "trabajadores"), where("empresaId", "==", usuario.id))
          const capacitacionesSnapshot = await getDocs(capacitacionesQuery)
          totalCapacitaciones = capacitacionesSnapshot.size
          console.log(`Trabajadores: ${totalCapacitaciones}`)
        } catch (error) {
          console.warn("Error al obtener trabajadores:", error)
        }

        // Obtener última actividad (sin orderBy para evitar errores de índice)
        let ultimaActividad = null
        try {
          const actividadQuery = query(
            collection(db, "actividades"),
            where("empresaId", "==", usuario.id),
            limit(10), // Obtener las últimas 10 y ordenar en cliente
          )
          const actividadSnapshot = await getDocs(actividadQuery)

          if (!actividadSnapshot.empty) {
            // Ordenar en el cliente para evitar errores de índice
            const actividades = actividadSnapshot.docs
              .map((doc) => ({ ...doc.data(), id: doc.id }))
              .filter((act) => act.fecha) // Filtrar solo las que tienen fecha
              .sort((a, b) => {
                const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha)
                const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha)
                return fechaB - fechaA // Orden descendente
              })

            if (actividades.length > 0) {
              const fechaActividad = actividades[0].fecha
              ultimaActividad = fechaActividad?.toDate ? fechaActividad.toDate() : new Date(fechaActividad)
            }
          }
        } catch (error) {
          console.warn("Error al obtener última actividad:", error)
        }

        console.log("Contadores finales:", {
          documentos: totalDocumentos,
          inspecciones: totalInspecciones,
          capacitaciones: totalCapacitaciones,
          ultimaActividad,
        })

        setContadores({
          documentos: totalDocumentos,
          inspecciones: totalInspecciones,
          capacitaciones: totalCapacitaciones,
          ultimaActividad,
        })
      } catch (error) {
        console.error("Error al obtener contadores:", error)
        // Valores por defecto en caso de error
        setContadores({
          documentos: 0,
          inspecciones: 0,
          capacitaciones: 0,
          ultimaActividad: null,
        })
      } finally {
        setLoading(false)
      }
    }

    if (usuario.id) {
      obtenerContadores()
    } else {
      setLoading(false)
    }
  }, [usuario.id])

  // Función para calcular tiempo transcurrido
  const calcularTiempoTranscurrido = (fecha) => {
    if (!fecha) return "Sin actividad reciente"

    const ahora = new Date()
    const diferencia = ahora - fecha
    const minutos = Math.floor(diferencia / (1000 * 60))
    const horas = Math.floor(diferencia / (1000 * 60 * 60))
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

    if (minutos < 60) {
      return `Hace ${minutos} minuto${minutos !== 1 ? "s" : ""}`
    } else if (horas < 24) {
      return `Hace ${horas} hora${horas !== 1 ? "s" : ""}`
    } else {
      return `Hace ${dias} día${dias !== 1 ? "s" : ""}`
    }
  }

  // Función para formatear la hora actual
  const formatearHoraActual = () => {
    return horaActual.toLocaleString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const tarjetas = [
    {
      icon: FileText,
      titulo: "Documentos",
      descripcion: "Cotizaciones, órdenes, guías, actas, facturas, informes y certificados",
      color: "bg-blue-50 text-blue-600",
      cantidad: contadores.documentos,
      label: "registrados",
    },
    {
      icon: ClipboardCheck,
      titulo: "Inspecciones",
      descripcion: "Revisa el estado de tus inspecciones programadas",
      color: "bg-green-50 text-green-600",
      cantidad: contadores.inspecciones,
      label: "realizadas",
    },
    {
      icon: GraduationCap,
      titulo: "Capacitaciones",
      descripcion: "Administra cursos y certificaciones de trabajadores",
      color: "bg-red-50 text-red-600",
      cantidad: contadores.capacitaciones,
      label: "trabajadores",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-red-600 to-red-700 p-8 rounded-xl shadow-lg text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">¡Bienvenido al Portal Empresarial! </h1>
              <p className="text-red-100 text-lg">Panel de Control - Red Secoin</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-red-100">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {loading && !contadores.ultimaActividad
                  ? formatearHoraActual()
                  : calcularTiempoTranscurrido(contadores.ultimaActividad)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Descripción y Tarjetas */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel de Información */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Centro de Control Empresarial</h2>
          <p className="text-gray-600 text-base leading-relaxed mb-6">
            Desde este panel podrá visualizar y gestionar todos los documentos, inspecciones, informes y capacitaciones
            que han sido procesados por <span className="font-semibold text-red-600">Red Secoin</span> para su empresa.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {tarjetas.map((tarjeta, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex p-2 rounded-lg ${tarjeta.color} mb-3`}>
                  <tarjeta.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{tarjeta.titulo}</h3>
                <p className="text-sm text-gray-600 mb-2">{tarjeta.descripcion}</p>
                <div className="flex items-center space-x-2">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-gray-800">{tarjeta.cantidad}</span>
                      <span className="text-sm text-gray-500">{tarjeta.label}</span>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Panel de Contacto */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-md"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-red-600" />
            Soporte y Contacto
          </h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Teléfono</p>
                <p className="text-sm text-gray-600">+51 944 974 808</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">Correo Departamento Técnico</p>
                <p className="text-sm text-gray-600">taller@secoinperu.com</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
            <p className="text-sm text-red-700">
              <span className="font-semibold">💡 Tip</span> Para cualquier duda o consulta, no dude en contactarse con
              su administrador asignado.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default BienvenidaEmpresa
