import { useEffect, useRef, useState } from 'react';
import { db, storage } from '../../../../firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { XCircleIcon } from '@heroicons/react/24/solid';

function EditarEmpresaPanel({ empresaId }) {
  const [empresa, setEmpresa] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const inputRef = useRef();
  const [ruc, setRuc] = useState('');
  const [mostrarModalPin, setMostrarModalPin] = useState(false);
  const [mostrarModalErrorPin, setMostrarModalErrorPin] = useState(false);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    const cargarEmpresa = async () => {
      const snap = await getDoc(doc(db, 'usuarios', empresaId));
      if (snap.exists()) {
        const data = snap.data();
        setEmpresa(data);
        setLogoPreview(data.logoURL || null);
        setRuc(data.ruc || '');
      }
    };
    if (empresaId) cargarEmpresa();
  }, [empresaId]);

  const guardarCambios = async () => {
    if (!empresaId) {
      console.warn('⚠️ No hay empresaId definido.');
      return;
    }

    try {
      console.log('✅ Iniciando guardado de cambios...');

      Swal.fire({
        title: 'Guardando cambios...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      let logoURL = empresa?.logoURL || null;

      if (logoFile) {
        console.log('📦 Subiendo nuevo logo...');
        const logoRef = ref(storage, `logos_empresas/${empresaId}`);
        await uploadBytes(logoRef, logoFile);
        logoURL = await getDownloadURL(logoRef);
        console.log('✅ Logo subido y URL obtenida:', logoURL);
      }

      console.log('📄 Datos que se enviarán a Firestore:', {
        ...empresa,
        ruc,
        logoURL,
        rucValidado: empresa?.rucValidado ?? false
      });

      await setDoc(doc(db, 'usuarios', empresaId), {
        ...empresa,
        ruc,
        logoURL,
        rucValidado: empresa?.rucValidado ?? false
      });

      console.log('✅ Cambios guardados exitosamente.');
      Swal.fire('Éxito', 'Datos actualizados correctamente.', 'success');

    } catch (error) {
      console.error('❌ Error al guardar cambios:', error);
      Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
    }
  };



  const validarRUC = async () => {
    if (!ruc || ruc.length !== 11) {
      Swal.fire('Error', 'Debes ingresar un RUC válido de 11 dígitos.', 'warning');
      return;
    }

    try {
      Swal.fire({
        title: 'Consultando...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const respuesta = await fetch(`https://us-central1-extintores-app.cloudfunctions.net/consultarRUC?ruc=${ruc}`);

      if (!respuesta.ok) throw new Error('No se pudo validar el RUC');

      const data = await respuesta.json();

      Swal.fire({
        title: 'RUC Validado ✅',
        html: `
          <p><strong>Nombre:</strong> ${data.razonSocial}</p>
          <p><strong>Dirección:</strong> ${data.direccion}</p>
          <p><strong>Condición:</strong> ${data.condicion}</p>
          <p><strong>Estado:</strong> ${data.estado}</p>
        `,
        icon: 'success',
        confirmButtonText: 'Guardar y bloquear campo'
      }).then((result) => {
        if (result.isConfirmed) {
          setEmpresa(prev => ({
            ...prev,
            rucValidado: true,
            razonSocial: data.razonSocial
          }));
        }
      });

    } catch (error) {
      console.error(error.message);
      Swal.fire('Error', 'No se pudo validar el RUC.', 'error');
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-6"
    >
      {/* Header Profesional */}
      <div className="bg-white rounded-t-2xl p-6 border-x border-t border-gray-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div className="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-100">
            <BuildingOffice2Icon className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Datos de Empresa</h1>
            <p className="text-gray-500 font-medium text-sm mt-0.5">Gestión de RUC, razón social e identidad visual</p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="bg-white rounded-b-2xl shadow-sm border-x border-b border-gray-200 overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Sección RUC */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
              <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm">Información Fiscal</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-3 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Número de RUC</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    disabled={empresa?.rucValidado}
                    className={`w-full pl-11 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm font-medium ${
                      empresa?.rucValidado 
                        ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed" 
                        : "bg-white border-gray-300 hover:border-gray-400"
                    }`}
                    placeholder="20123456789"
                    maxLength="11"
                  />
                  {empresa?.rucValidado && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Acción RUC */}
              <div className="pt-2">
                {!empresa?.rucValidado ? (
                  <button
                    onClick={validarRUC}
                    className="w-full bg-red-600 text-white font-semibold py-2.5 rounded-lg shadow-sm hover:bg-red-700 transition-all active:scale-95 cursor-pointer text-sm"
                  >
                    Validar RUC
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMostrarModalPin(true);
                      setPinInput("");
                    }}
                    className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-all active:scale-95 flex justify-center items-center gap-2 cursor-pointer text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Editar
                  </button>
                )}
              </div>
            </div>
            
            {empresa?.razonSocial && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-3 mt-2 animate-pulse-subtle">
                <div className="bg-red-500 text-white rounded-lg p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-red-800">{empresa.razonSocial}</p>
              </div>
            )}
          </section>

          {/* Sección Logo */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
              <h3 className="font-bold text-gray-800 uppercase tracking-wider text-sm">Identidad Visual</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-8 bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
              <div className="relative group">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo de empresa"
                    className="h-32 w-32 rounded-full shadow-2xl border-4 border-white object-cover relative z-10 transition-transform duration-500 group-hover:rotate-6"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gray-200 border-4 border-white flex items-center justify-center text-gray-400 relative z-10">
                    <BuildingOffice2Icon className="h-12 w-12" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left space-y-4">
                <h4 className="font-bold text-gray-800 text-lg">Logo Corporativo</h4>
                <p className="text-gray-500 text-sm max-w-xs">
                  Se recomienda una imagen en formato PNG o JPG con fondo transparente o blanco. Tamaño máximo sugerido: 500x500px.
                </p>
                <div className="flex gap-3 justify-center sm:start">
                  <button
                    onClick={() => inputRef.current.click()}
                    className="bg-white border border-gray-300 text-gray-700 font-medium px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 active:scale-95 text-sm shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Elegir imagen
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setLogoFile(file);
                        setLogoPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Botón Final */}
          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-400 text-center sm:text-left">
              * Los cambios se aplicarán en todos los documentos generados a partir de ahora.
            </p>
            <button
              onClick={guardarCambios}
              className="w-full sm:w-auto bg-red-600 text-white px-6 py-2.5 rounded-lg shadow-sm hover:bg-red-700 transition-all font-semibold flex items-center justify-center gap-2 active:scale-95 cursor-pointer text-sm"
            >
              <CheckCircleIcon className="h-5 w-5" /> Guardar todos los cambios
            </button>
          </div>
        </div>
      </div>

      {/* Modal de PIN para desbloquear RUC */}
      <AnimatePresence>
        {mostrarModalPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
            onClick={() => {
              setMostrarModalPin(false);
              setPinInput('');
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
                  <h3 className="text-xl font-bold text-gray-800 mb-2">PIN requerido</h3>
                  <p className="text-gray-600 text-sm">Ingresa el PIN para desbloquear el RUC</p>
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
                      setMostrarModalPin(false);
                      setPinInput('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (pinInput === '140603') {
                        setEmpresa(prev => ({ ...prev, rucValidado: false }));
                        setMostrarModalPin(false);
                        setPinInput('');
                        Swal.fire('Desbloqueado', 'Ahora puedes editar el RUC.', 'success');
                      } else if (pinInput) {
                        setMostrarModalErrorPin(true);
                        setPinInput('');
                      }
                    }}
                    disabled={pinInput.length !== 6}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Desbloquear
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Error PIN */}
      <AnimatePresence>
        {mostrarModalErrorPin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setMostrarModalErrorPin(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Error</h3>
                  <p className="text-sm text-gray-500">PIN incorrecto</p>
                </div>
              </div>

              {/* Información */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  El PIN ingresado no es válido. Por favor, intenta nuevamente.
                </p>
              </div>

              {/* Botón */}
              <button
                onClick={() => setMostrarModalErrorPin(false)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Aceptar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default EditarEmpresaPanel;

