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
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto mt-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <BuildingOffice2Icon className="h-6 w-6 text-blue-600" /> Editar Datos de Empresa
      </h2>

      <div className="space-y-6">
        {/* Campo RUC */}
        <div>
          <label className="text-sm font-medium text-gray-700">RUC</label>
          <div className="flex gap-2 items-center">

            <input
              type="text"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              disabled={empresa?.rucValidado}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ej: 20123456789"
            />

            {/* Si NO ha validado todavía, muestra botón VALIDAR */}
            {!empresa?.rucValidado && (
              <button
                onClick={validarRUC}
                className="h-[42px] bg-blue-600 text-white px-3 rounded-md hover:bg-blue-700 transition"
              >
                Validar
              </button>
            )}

            {/* Si YA está validado, muestra botón EDITAR */}
            {empresa?.rucValidado && (
              <button
                onClick={() => {
                  setMostrarModalPin(true);
                  setPinInput('');
                }}
                className="h-[42px] px-5 bg-yellow-400 text-white font-semibold rounded-md hover:bg-yellow-500 transition"
              >
                Editar
              </button>
            )}

          </div>
        </div>



        {/* Imagen de logo */}
        <div className="flex items-center gap-6">
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Logo de empresa"
              className="h-20 w-20 rounded-full shadow border object-cover"
            />
          )}
          <button
            onClick={() => inputRef.current.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Seleccionar logo
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

        <div className="text-end">
          <button
            onClick={guardarCambios}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <CheckCircleIcon className="h-5 w-5 inline mr-1" /> Guardar cambios
          </button>
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

