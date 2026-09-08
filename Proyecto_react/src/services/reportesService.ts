import api from './api';

export const reportesService = {
  getEstadisticasGenerales: async (params?: { instructorId?: string, mes?: string, area?: string }): Promise<any> => {
    const response = await api.get<any[]>('/informes');
    let reports = response.data;

    if (params) {
      if (params.instructorId && params.instructorId !== 'todos') {
        reports = reports.filter(r => r.usuario?.id_usuario?.toString() === params.instructorId);
      }
      if (params.area && params.area !== 'todos') {
        reports = reports.filter(r => {
          const areaNombre = typeof r.usuario?.area === 'object' ? r.usuario.area.nombre_area : r.usuario?.area;
          return areaNombre === params.area;
        });
      }
      if (params.mes && params.mes !== 'todos') {
        const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        reports = reports.filter(r => {
           if (!r.periodo) return false;
           const reportMesStr = `${mesesNombres[r.periodo.mes - 1]} ${r.periodo.anio}`;
           return reportMesStr.trim().toLowerCase() === params.mes.trim().toLowerCase();
        });
      }
    }

    const totalInformes = reports.length;
    const aprobados = reports.filter(r => {
      const st = (r.estado || '').toLowerCase();
      return st === 'validado' || st === 'aprobado';
    }).length;
    const rechazados = reports.filter(r => {
      const st = (r.estado || '').toLowerCase();
      return st === 'devuelto' || st === 'rechazado';
    }).length;
    const pendientes = reports.filter(r => {
      const st = (r.estado || '').toLowerCase();
      return st === 'pendiente';
    }).length;

    const tasaCumplimiento = totalInformes > 0 ? Math.round((aprobados / totalInformes) * 100) : 0;

    const distribucionEstados = {
      aprobadosPorcentaje: totalInformes > 0 ? parseFloat(((aprobados / totalInformes) * 100).toFixed(1)) : 0,
      rechazadosPorcentaje: totalInformes > 0 ? parseFloat(((rechazados / totalInformes) * 100).toFixed(1)) : 0,
      pendientesPorcentaje: totalInformes > 0 ? parseFloat(((pendientes / totalInformes) * 100).toFixed(1)) : 0,
    };

    // Calculate instructor-specific counts
    const instructorsMap: Record<number, { id: string; nombre: string; aprobados: number; rechazados: number; pendientes: number }> = {};

    reports.forEach((r) => {
      if (!r.usuario) return;
      const instId = r.usuario.id_usuario;
      if (!instructorsMap[instId]) {
        instructorsMap[instId] = {
          id: instId.toString(),
          nombre: r.usuario.nombre_completo,
          aprobados: 0,
          rechazados: 0,
          pendientes: 0
        };
      }

      if (r.estado === 'validado' || r.estado === 'aprobado') {
        instructorsMap[instId].aprobados++;
      } else if (r.estado === 'devuelto' || r.estado === 'rechazado') {
        instructorsMap[instId].rechazados++;
      } else {
        instructorsMap[instId].pendientes++;
      }
    });

    const cumplimientoPorInstructor = Object.values(instructorsMap);

    return {
      totalInformes,
      aprobados,
      rechazados,
      pendientes,
      tasaCumplimiento,
      distribucionEstados,
      cumplimientoPorInstructor
    };
  }
};
