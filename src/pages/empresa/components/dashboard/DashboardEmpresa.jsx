// src/pages/empresa/components/dashboard/DashboardEmpresa.jsx

import { useState } from 'react';
import SidebarEmpresa from '../SidebarEmpresa';
import TopbarEmpresa from '../TopbarEmpresa';
import BienvenidaEmpresa from './BienvenidaEmpresa';

function DashboardEmpresa() {
  const [seccionActiva, setSeccionActiva] = useState('inicio');

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarEmpresa setSeccionActiva={setSeccionActiva} seccionActiva={seccionActiva} />
      
      <div className="flex-1 flex flex-col">
        <TopbarEmpresa />

        <main className="flex-1 p-6">
          {seccionActiva === 'inicio' && <BienvenidaEmpresa />}

          {/* Aquí luego vendrán los demás módulos */}
        </main>
      </div>
    </div>
  );
}

export default DashboardEmpresa;
