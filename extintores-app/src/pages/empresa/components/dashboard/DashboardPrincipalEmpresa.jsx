// src/pages/empresa/components/dashboard/DashboardPrincipalEmpresa.jsx

import { useEffect, useState } from 'react';
import BienvenidaEmpresa from './BienvenidaEmpresa';
import TarjetasResumenEmpresa from './TarjetasResumenEmpresa';

function DashboardPrincipalEmpresa() {
  const [empresaId, setEmpresaId] = useState(null);

  useEffect(() => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    if (usuario?.id) {
      setEmpresaId(usuario.id);
    }
  }, []);

  return (
    <div className="p-6">
      <BienvenidaEmpresa />
      {empresaId && <TarjetasResumenEmpresa empresaId={empresaId} />}
    </div>
  );
}

export default DashboardPrincipalEmpresa;
