import { useEffect, useRef, useState } from 'react';
import { db, storage } from '../../../../firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Swal from 'sweetalert2';
import { motion } from 'framer-motion';
import { CheckCircleIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

function EditarEmpresaPanel({ empresaId }) {
  const [empresa, setEmpresa] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const inputRef = useRef();
  const [ruc, setRuc] = useState('');

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
                onClick={async () => {
                  const { value: pin } = await Swal.fire({
                    title: 'PIN requerido',
                    input: 'password',
                    inputPlaceholder: '••••',
                    showCancelButton: true,
                    confirmButtonText: 'Desbloquear',
                    inputAttributes: {
                      maxlength: 6,
                      autocapitalize: 'off',
                      autocorrect: 'off'
                    }
                  });

                  if (pin === '140603') {
                    setEmpresa(prev => ({ ...prev, rucValidado: false }));
                    Swal.fire('Desbloqueado', 'Ahora puedes editar el RUC.', 'success');
                  } else if (pin) {
                    Swal.fire('Error', 'PIN incorrecto.', 'error');
                  }
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
    </motion.div>
  );
}

export default EditarEmpresaPanel;

