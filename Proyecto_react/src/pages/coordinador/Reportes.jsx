import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { reportesService } from '../../services/reportesService';
import { instructoresService } from '../../services/instructoresService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  FiFileText, 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiActivity, 
  FiDownload, 
  FiFilter, 
  FiBarChart2,
  FiChevronDown,
  FiFile
} from 'react-icons/fi';
import { toast } from 'sonner';
import PageContainer from '../../components/PageContainer';

export default function Reportes() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [instructores, setInstructores] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Filter states
  const [selectedInst, setSelectedInst] = useState('todos');
  const [selectedMes, setSelectedMes] = useState('todos');
  const [selectedArea, setSelectedArea] = useState('todos');

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        instructorId: selectedInst,
        mes: selectedMes,
        area: selectedArea
      };
      const [statsData, instList] = await Promise.all([
        reportesService.getEstadisticasGenerales(params),
        instructoresService.getInstructores()
      ]);
      setStats(statsData);
      setInstructores(instList);
    } catch (err) {
      console.error(err);
      toast.error(t('reportes.alerts.errorLoad', 'Error al cargar datos estadísticos'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Close export menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleApplyFilters = () => {
    loadData();
    toast.success(t('reportes.alerts.filtersApplied', 'Filtros aplicados con éxito'));
  };

  // ── Exportación a Excel / CSV ────────────────────────────────────────────────
  const exportToCSV = () => {
    if (!stats) return;
    setShowExportMenu(false);

    const headers = ['ID Instructor', 'Nombre Instructor', 'Informes Validados', 'Informes Rechazados', 'Informes Pendientes', '% Cumplimiento'];
    
    const rows = (stats.cumplimientoPorInstructor || []).map(inst => {
      const total = inst.aprobados + inst.rechazados + inst.pendientes;
      const pct = total > 0 ? Math.round((inst.aprobados / total) * 100) : 0;
      return [
        `"${inst.id}"`,
        `"${inst.nombre.replace(/"/g, '""')}"`,
        inst.aprobados,
        inst.rechazados,
        inst.pendientes,
        `"${pct}%"`
      ];
    });

    const metadata = [
      ['SENA - SISTEMA DE TRAZABILIDAD MENSUAL DE INFORMES (STIMI)'],
      ['REPORTE Y ESTADÍSTICAS GENERALES DE CUMPLIMIENTO'],
      [`Fecha de Generación: ${new Date().toLocaleString('es-CO')}`],
      [`Filtros Aplicados: Instructor=${selectedInst}, Mes=${selectedMes}, Área=${selectedArea}`],
      [''],
      ['RESUMEN GENERAL'],
      ['Total Informes', stats.totalInformes],
      ['Validados / Aprobados', stats.aprobados],
      ['Rechazados / Devueltos', stats.rechazados],
      ['Pendientes', stats.pendientes],
      ['Tasa de Cumplimiento General', `${stats.tasaCumplimiento}%`],
      [''],
      ['DESGLOSE POR INSTRUCTOR'],
      headers,
      ...rows
    ];

    const csvContent = '\uFEFF' + metadata.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_STIMI_SENA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('reportes.alerts.csvExported', '📊 Reporte exportado a Excel / CSV correctamente'));
  };

  // ── Exportación a PDF Oficial ────────────────────────────────────────────────
  const exportToPDF = () => {
    if (!stats) return;
    setShowExportMenu(false);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t('reportes.alerts.allowPopups', 'Por favor permite las ventanas emergentes para descargar el PDF'));
      return;
    }

    const rowsHtml = (stats.cumplimientoPorInstructor || []).map(inst => {
      const total = inst.aprobados + inst.rechazados + inst.pendientes;
      const pct = total > 0 ? Math.round((inst.aprobados / total) * 100) : 0;
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${inst.nombre}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #407754; font-weight: bold;">${inst.aprobados}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #ef4444; font-weight: bold;">${inst.rechazados}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #f59e0b; font-weight: bold;">${inst.pendientes}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${pct}%</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Cumplimiento - STIMI SENA</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #111827; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #39A900; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #39A900; }
          .subtitle { font-size: 12px; color: #4b5563; margin-top: 4px; }
          .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px; font-size: 11px; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 25px; }
          .stat-card { background: #f3f4f6; border-radius: 10px; padding: 12px; text-align: center; }
          .stat-title { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; }
          .stat-value { font-size: 22px; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { background: #39A900; color: white; padding: 10px; text-align: left; }
          .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 15px; text-align: center; font-size: 10px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">SENA · STIMI</div>
            <div class="subtitle">Sistema de Trazabilidad Mensual de Informes — Reporte Oficial</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #4b5563;">
            <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</div>
            <div><strong>Sede:</strong> Regional Antioquia / Huila</div>
          </div>
        </div>

        <div class="meta-box">
          <strong>Filtros aplicados:</strong> Instructor: ${selectedInst} | Mes: ${selectedMes} | Área: ${selectedArea}
        </div>

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-title">Total Informes</div><div class="stat-value" style="color: #2563eb;">${stats.totalInformes}</div></div>
          <div class="stat-card"><div class="stat-title">Validados</div><div class="stat-value" style="color: #407754;">${stats.aprobados}</div></div>
          <div class="stat-card"><div class="stat-title">Rechazados</div><div class="stat-value" style="color: #ef4444;">${stats.rechazados}</div></div>
          <div class="stat-card"><div class="stat-title">% Cumplimiento</div><div class="stat-value" style="color: #7c3aed;">${stats.tasaCumplimiento}%</div></div>
        </div>

        <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">Desglose de Cumplimiento por Instructor</h3>
        <table>
          <thead>
            <tr>
              <th>Instructor</th>
              <th style="text-align: center;">Validados</th>
              <th style="text-align: center;">Rechazados</th>
              <th style="text-align: center;">Pendientes</th>
              <th style="text-align: center;">% Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Documento generado automáticamente por STIMI · Servicio Nacional de Aprendizaje SENA
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success(t('reportes.alerts.pdfGenerated', '📄 Vista previa de PDF generada. Elija Guardar como PDF'));
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 border-4 border-sena-green border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('reportes.loadingStats', 'Procesando estadísticas...')}</p>
      </div>
    );
  }

  // Areas list extracted from instructors — normalize area to string
  const areas = Array.from(new Set(instructores.map((i) => {
    if (!i.area) return null;
    return typeof i.area === 'object' ? i.area.nombre_area : i.area;
  }).filter(Boolean)));

  // Prepare PieChart data
  const pieData = [
    { name: 'Aprobados', value: stats.aprobados, color: '#407754' },
    { name: 'Rechazados', value: stats.rechazados, color: '#ef4444' },
    { name: 'Pendientes', value: stats.pendientes, color: '#f59e0b' }
  ];

  return (
    <PageContainer>
      
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('reportes.title', 'Reportes y Estadísticas')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('reportes.subtitle', 'Métricas de cumplimiento y trazabilidad mensual de instructores')}</p>
        </div>

        {/* Dropdown de Exportación */}
        <div className="relative self-stretch sm:self-auto" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#407754] hover:bg-[#335f43] text-white text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer"
          >
            <FiDownload className="w-4 h-4" /> {t('reportes.exportReport', 'Exportar Reporte')} <FiChevronDown className="w-3.5 h-3.5" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={exportToCSV}
                className="w-full text-left px-3 py-2.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FiFileText className="w-4 h-4 text-[#407754]" /> {t('reportes.exportCSV', 'Exportar a Excel / CSV (.csv)')}
              </button>
              <button
                onClick={exportToPDF}
                className="w-full text-left px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FiFile className="w-4 h-4 text-red-500" /> {t('reportes.exportPDF', 'Exportar a PDF Imprimible')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Query Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
          <FiFilter className="w-4 h-4 text-sena-green" />
          <h3 className="text-sm font-bold">{t('reportes.queryFilters', 'Filtros de Consulta')}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">{t('sidebar.instructor', 'Instructor')}</label>
            <select
              value={selectedInst}
              onChange={(e) => setSelectedInst(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
            >
              <option value="todos">{t('reportes.allInstructors', 'Todos los Instructores')}</option>
              {instructores.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">{t('reportes.traceabilityMonth', 'Mes de Trazabilidad')}</label>
            <select
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
            >
              <option value="todos">{t('reportes.allMonths', 'Todos los Meses')}</option>
              {[
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
              ].map((m) => {
                const year = new Date().getFullYear();
                const val = `${m} ${year}`;
                return (
                  <option key={val} value={val}>{val}</option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">{t('perfil.trainingArea', 'Área de Formación')}</label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
            >
              <option value="todos">{t('reportes.allAreas', 'Todas las Áreas')}</option>
              {areas.map((area, idx) => (
                <option key={idx} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleApplyFilters}
            className="w-full px-4 py-2.5 bg-sena-green hover:bg-sena-green-hover text-white text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
          >
            {t('reportes.applyFilters', 'Aplicar Filtros')}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 dark:text-blue-400 flex-shrink-0">
            <FiFileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-medium text-gray-400 block uppercase">{t('reportes.totalReports', 'Total Informes')}</span>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.totalInformes}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-sena-green dark:text-emerald-400 flex-shrink-0">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-medium text-gray-400 block uppercase">{t('common.approved', 'Aprobados')}</span>
            <span className="text-xl font-bold text-sena-green">{stats.aprobados}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500 dark:text-red-400 flex-shrink-0">
            <FiXCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-medium text-gray-400 block uppercase">{t('revisionInformes.rejected', 'Rechazados')}</span>
            <span className="text-xl font-bold text-red-500">{stats.rechazados}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500 dark:text-amber-400 flex-shrink-0">
            <FiClock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-medium text-gray-400 block uppercase">{t('common.pending', 'Pendientes')}</span>
            <span className="text-xl font-bold text-amber-500">{stats.pendientes}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-500 dark:text-purple-400 flex-shrink-0">
            <FiActivity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-medium text-gray-400 block uppercase">{t('reportes.complianceRate', '% Cumplimiento')}</span>
            <span className="text-xl font-bold text-purple-600">{stats.tasaCumplimiento}%</span>
          </div>
        </div>
      </div>

      {/* Two panels side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cumplimiento por Instructor */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm border-b border-gray-100 dark:border-gray-700 pb-3 flex items-center gap-2">
            <FiBarChart2 className="w-4 h-4 text-sena-green" /> {t('reportes.complianceByInstructor', 'Cumplimiento por Instructor (GC / GF)')}
          </h3>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={stats.cumplimientoPorInstructor}
                margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                <YAxis dataKey="nombre" type="category" stroke="#9ca3af" fontSize={9} width={100} />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '11px' }} 
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="aprobados" name="Validados" stackId="a" fill="#407754" radius={[0, 4, 4, 0]} />
                <Bar dataKey="rechazados" name="Rechazados" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                <Bar dataKey="pendientes" name="Pendientes" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Estados & Tasa General */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm border-b border-gray-100 dark:border-gray-700 pb-3">
              {t('reportes.stateDistribution', 'Distribución de Estados')}
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
              {/* Pie Chart */}
              <div className="w-44 h-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '11px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends with percentages */}
              <div className="space-y-3 flex-1 w-full">
                {pieData.map((item, idx) => {
                  const pct = Math.round((item.value / stats.totalInformes) * 100) || 0;
                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-xs font-extrabold text-gray-800 dark:text-gray-100">{pct}% ({item.value})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Compliance rate summary */}
          <div className="bg-sena-green-light dark:bg-green-950/30 rounded-xl p-5 border border-green-100 dark:border-green-800 flex items-center justify-between">
            <div>
              <h4 className="text-sena-green font-bold text-sm">{t('reportes.generalComplianceRate', 'Tasa de cumplimiento general')}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('reportes.complianceDesc', 'Porcentaje total de firmas avaladas del mes en curso.')}</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border-4 border-sena-green text-center">
              <span className="text-base font-extrabold text-sena-green">{stats.tasaCumplimiento}%</span>
            </div>
          </div>

        </div>

      </div>

    </PageContainer>
  );
}
