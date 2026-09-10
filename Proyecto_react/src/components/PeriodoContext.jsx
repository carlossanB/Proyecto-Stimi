import React, { createContext, useState, useEffect, useContext } from 'react';

const PeriodoContext = createContext();

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Calcula dinámicamente el período actual según el calendario del sistema.
 */
export const calculateCurrentPeriod = () => {
  const now = new Date();
  const mesIndex = now.getMonth(); // 0 a 11
  const anio = now.getFullYear();
  const mesNombre = MESES[mesIndex];
  const mesActivo = `${mesNombre} ${anio}`;

  // Último día del mes actual como fecha límite por defecto
  const lastDay = new Date(anio, mesIndex + 1, 0).getDate();
  const mm = String(mesIndex + 1).padStart(2, '0');
  const dd = String(lastDay).padStart(2, '0');
  const fechaLimite = `${anio}-${mm}-${dd}T23:59:00`;

  return {
    mesActivo,
    fechaLimite,
    habilitado: true,
    formatos: [
      { nombre: 'Formato GTH-F-062 V3 (GC)', tipo: 'GC' },
      { nombre: 'Formato GF (Gestión Financiera)', tipo: 'GF' }
    ]
  };
};

export function PeriodoProvider({ children }) {
  const [periodoInfo, setPeriodoInfo] = useState(() => {
    const current = calculateCurrentPeriod();
    const saved = localStorage.getItem('stimi_periodo');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Si el periodo guardado coincide con el mes actual del sistema, conservamos preferencias
        if (parsed && parsed.mesActivo === current.mesActivo) {
          return { ...current, ...parsed };
        }
      } catch (e) {
        // Ignorar error de parsing
      }
    }
    // Si es un nuevo mes o no hay datos guardados válidos, actualiza automáticamente
    localStorage.setItem('stimi_periodo', JSON.stringify(current));
    return current;
  });

  // Listener para actualizar automáticamente si cambia el mes mientras la app está abierta
  useEffect(() => {
    const syncMonth = () => {
      const current = calculateCurrentPeriod();
      setPeriodoInfo(prev => {
        if (prev.mesActivo !== current.mesActivo) {
          localStorage.setItem('stimi_periodo', JSON.stringify(current));
          return current;
        }
        return prev;
      });
    };

    const interval = setInterval(syncMonth, 60000); // Chequea cada minuto
    return () => clearInterval(interval);
  }, []);

  const updatePeriodo = (newInfo) => {
    const updated = { ...periodoInfo, ...newInfo };
    setPeriodoInfo(updated);
    localStorage.setItem('stimi_periodo', JSON.stringify(updated));
  };

  return (
    <PeriodoContext.Provider value={{ periodoInfo, updatePeriodo }}>
      {children}
    </PeriodoContext.Provider>
  );
}

export function usePeriodo() {
  const context = useContext(PeriodoContext);
  if (!context) {
    throw new Error('usePeriodo debe usarse dentro de un PeriodoProvider');
  }
  return context;
}

