import { useState } from 'react';

// ✅ Corrección de imports relativos a la estructura real

import SidebarEmpresa from '../SidebarEmpresa';
import TopbarEmpresa from '../TopbarEmpresa';
import BienvenidaEmpresa from './BienvenidaEmpresa';
import InspeccionPanelEmpresa from '../inspeccion/InspeccionPanelEmpresa';
import InformesPanelEmpresa from '../informes/InformesPanelEmpresa';
import AdministracionPanelEmpresa from '../administracion/AdministracionPanelEmpresa';
import MensajesPanelEmpresa from '../mensajes/MensajesPanelEmpresa';
import CapacitacionPanelEmpresa from '../capacitacion/CapacitacionPanelEmpresa';
// Nota: Eliminamos CapacitacionPanelEmpresa porque aún no lo tenemos creado

function EmpresaDashboard() {
  const [seccionActiva, setSeccionActiva] = useState('inicio');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(JSON.parse(localStorage.getItem('usuario')));

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarEmpresa setSeccionActiva={setSeccionActiva} seccionActiva={seccionActiva} />
      
      <div className="flex-1 flex flex-col">
        <TopbarEmpresa empresaSeleccionada={empresaSeleccionada} />
        <main className="flex-1 p-6">

          {seccionActiva === 'inicio' && <BienvenidaEmpresa empresaSeleccionada={empresaSeleccionada} />}
          {seccionActiva === 'inspeccion' && <InspeccionPanelEmpresa empresaSeleccionada={empresaSeleccionada} />}
          {seccionActiva === 'informes' && <InformesPanelEmpresa empresaSeleccionada={empresaSeleccionada} />}
          {seccionActiva === 'administracion' && <AdministracionPanelEmpresa empresaSeleccionada={empresaSeleccionada} />}
          {seccionActiva === 'capacitacion' && <CapacitacionPanelEmpresa empresaSeleccionada={empresaSeleccionada} />}
          {seccionActiva === 'mensajes' && <MensajesPanelEmpresa empresaSeleccionada={empresaSeleccionada} />}

        </main>
      </div>
    </div>
  );
}

export default EmpresaDashboard;
