import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { instructoresService } from '../../services/instructoresService';
import { informesService } from '../../services/informesService';
import { 
  FiUsers, 
  FiFileText, 
  FiCheckCircle, 
  FiActivity, 
  FiAlertTriangle, 
  FiArrowRight, 
  FiArrowLeft,
  FiFolder, 
  FiSend,
  FiClock,
  FiXCircle,
  FiExternalLink,
  FiEye,
  FiMail,
  FiUser
} from 'react-icons/fi';
import { toast } from 'sonner';
import PeriodoCard from '../../components/PeriodoCard';
import StatCard from '../../components/StatCard';
import PageContainer from '../../components/PageContainer';
import { usePeriodo } from '../../components/PeriodoContext';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { periodoInfo } = usePeriodo();
  const [instructores, setInstructores] = useState([]);
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [selectedInstructorDetail, setSelectedInstructorDetail] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [instList, infList] = await Promise.all([
          instructoresService.getInstructores(),
          informesService.getInformes()
        ]);
        setInstructores(instList);
        setInformes(infList);
      } catch (err) {
        toast.error(t('coordinatorDashboard.alerts.loadError', 'Error al cargar datos del panel'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSendReminder = async (id, nombre) => {
    setSendingReminder(id);
    try {
      await instructoresService.enviarRecordatorio(id);
      toast.success(t('coordinatorDashboard.alerts.reminderSent', 'Recordatorio enviado con éxito a {{nombre}}', { nombre }));
    } catch (err) {
      toast.error(t('coordinatorDashboard.alerts.reminderError', 'No se pudo enviar el recordatorio'));
    } finally {
      setSendingReminder(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 border-4 border-[#407754] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('coordinatorDashboard.loading', 'Cargando Panel de Coordinación...')}</p>
      </div>
    );
  }

  // Helper for status normalization (synonyms: validado/aprobado, devuelto/rechazado)
  const getNormalizedState = (statusStr) => {
    if (!statusStr) return '';
    const s = statusStr.toString().trim().toLowerCase();
    if (s === 'validado' || s === 'aprobado') return 'validado';
    if (s === 'devuelto' || s === 'rechazado') return 'devuelto';
    if (s === 'pendiente') return 'pendiente';
    if (s === 'borrador') return 'borrador';
    return s;
  };

  // Calculate metrics strictly for active period
  const totalInstructores = instructores.length;
  const instructoresActivos = instructores.filter(i => i.estado === 'activo' || i.estado_cuenta === 'aprobado').length;

  const activePeriodStr = (periodoInfo?.mesActivo || '').trim().toLowerCase();

  // Strictly filter reports by active period string (trim & case-insensitive)
  const informesPeriodoActivo = informes.filter(i => {
    if (!activePeriodStr || activePeriodStr === 'todos') return true;
    const reportPeriod = (i.periodo || '').trim().toLowerCase();
    return reportPeriod === activePeriodStr;
  });

  const pendientesRevision = informesPeriodoActivo.filter(i => getNormalizedState(i.estado) === 'pendiente').length;
  const informesValidados = informesPeriodoActivo.filter(i => getNormalizedState(i.estado) === 'validado').length;
  
  const totalInformesPeriodo = informesPeriodoActivo.length;
  const cumplimientoPorcentaje = totalInformesPeriodo > 0 
    ? Math.round((informesValidados / totalInformesPeriodo) * 100)
    : 0;

  // Instructors missing GC or GF (2 reports per period) in the active period
  const instructoresSinInforme = instructores.map(inst => {
    const instId = inst.id?.toString();
    const instName = (inst.nombre || '').trim().toLowerCase();

    const informesInst = informesPeriodoActivo.filter(i => {
      const rId = i.instructorId?.toString();
      const rName = (i.instructorNombre || '').trim().toLowerCase();
      return (rId && rId === instId) || (rName && rName === instName);
    });

    const validadosInst = informesInst.filter(i => getNormalizedState(i.estado) === 'validado').length;
    return {
      ...inst,
      informesPendientes: Math.max(0, 2 - validadosInst),
      informesPeriodo: informesInst
    };
  }).filter(inst => inst.informesPendientes > 0);

  // Helper para obtener desglose de informes GC y GF del instructor seleccionado
  const getInstructorPeriodReports = (instructor) => {
    if (!instructor) return { gc: null, gf: null };
    const instId = instructor.id?.toString();
    const instName = (instructor.nombre || '').trim().toLowerCase();

    const instReports = informesPeriodoActivo.filter(i => {
      const rId = i.instructorId?.toString();
      const rName = (i.instructorNombre || '').trim().toLowerCase();
      return (rId && rId === instId) || (rName && rName === instName);
    });

    const gc = instReports.find(i => (i.tipo || '').toUpperCase() === 'GC') || null;
    const gf = instReports.find(i => (i.tipo || '').toUpperCase() === 'GF') || null;

    return { gc, gf };
  };

  const selectedReports = selectedInstructorDetail ? getInstructorPeriodReports(selectedInstructorDetail) : null;

  const renderStatusBadge = (report) => {
    if (!report) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/50">
          <FiXCircle className="w-3.5 h-3.5" /> No cargado
        </span>
      );
    }
    const state = getNormalizedState(report.estado);
    if (state === 'validado') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
          <FiCheckCircle className="w-3.5 h-3.5" /> Validado
        </span>
      );
    }
    if (state === 'pendiente') {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900/50">
          <FiClock className="w-3.5 h-3.5" /> Pendiente de Revisión
        </span>
      );
    }
    if (state === 'devuelto') {
      return (
        <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900/50">
          <FiXCircle className="w-3.5 h-3.5" /> Devuelto / Corregir
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">
        {report.estado || 'Borrador'}
      </span>
    );
  };

  return (
    <PageContainer>
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('coordinatorDashboard.title', 'Panel de Coordinación Académica')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('coordinatorDashboard.subtitle', 'Centro de Servicios y Gestión Empresarial | Período de control activo')}</p>
      </div>

      {/* Active Period / Periodo de Carga */}
      <PeriodoCard isEditable={true} />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <StatCard
          icon={FiUsers}
          title={t('coordinatorDashboard.totalInstructors', 'Total Instructores')}
          value={totalInstructores}
          subtext={t('coordinatorDashboard.activeInstructors', '{{count}} instructores activos', { count: instructoresActivos })}
          iconBgClass="bg-blue-50 dark:bg-blue-950/40"
          iconColorClass="text-blue-500 dark:text-blue-400"
        />

        {/* Metric 2 */}
        <StatCard
          icon={FiFileText}
          title={t('coordinatorDashboard.pendingReview', 'Pendientes Revisión')}
          value={pendientesRevision}
          subtext={t('coordinatorDashboard.reportsReceived', 'Informes recibidos')}
          subtextClass="text-amber-500 dark:text-amber-400 font-semibold"
          iconBgClass="bg-amber-50 dark:bg-amber-950/40"
          iconColorClass="text-amber-500 dark:text-amber-400"
        />

        {/* Metric 3 */}
        <StatCard
          icon={FiCheckCircle}
          title={t('coordinatorDashboard.validatedReports', 'Informes Validados')}
          value={informesValidados}
          subtext={t('coordinatorDashboard.endorsedSignature', 'Firma avalada')}
          subtextClass="text-green-600 dark:text-emerald-400 font-semibold"
          iconBgClass="bg-green-50 dark:bg-green-950/40"
          iconColorClass="text-[#407754] dark:text-emerald-400"
        />

        {/* Metric 4 */}
        <StatCard
          icon={FiActivity}
          title={t('coordinatorDashboard.compliancePercent', '% Cumplimiento')}
          value={`${cumplimientoPorcentaje}%`}
          subtext={t('coordinatorDashboard.approvedReportsOf', 'De informes aprobados')}
          iconBgClass="bg-purple-50 dark:bg-purple-950/40"
          iconColorClass="text-purple-500 dark:text-purple-400"
        />

      </div>

      {/* Alert Section: Instructores sin Informe */}
      <div className="bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-2xl p-6 space-y-4">
        
        {/* Header de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-red-700 dark:text-red-300">
            <FiAlertTriangle className="w-5 h-5 shrink-0" />
            <h4 className="font-bold text-base">
              {selectedInstructorDetail 
                ? `Detalle de Cumplimiento — ${selectedInstructorDetail.nombre}` 
                : t('coordinatorDashboard.complianceAlert', 'Alerta de Cumplimiento: Instructores sin Informe')}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            {selectedInstructorDetail ? (
              <button
                onClick={() => setSelectedInstructorDetail(null)}
                className="px-3.5 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FiArrowLeft className="w-3.5 h-3.5" /> Volver al listado completo
              </button>
            ) : (
              <span className="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 text-xs font-extrabold px-3 py-1 rounded-full">
                {t('coordinatorDashboard.criticalPending', '{{count}} Pendiente(s) Crítico(s)', { count: instructoresSinInforme.length })}
              </span>
            )}
          </div>
        </div>

        {/* Vista Detallada de un Instructor Específico */}
        {selectedInstructorDetail && selectedReports ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-red-100 dark:border-red-900/30 shadow-sm space-y-6">
            
            {/* Contexto del Instructor */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100 dark:border-gray-700">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedInstructorDetail.nombre}</h3>
                  <span className="bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {selectedInstructorDetail.informesPendientes} Pendiente(s) en {periodoInfo?.mesActivo}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FiUser className="w-3.5 h-3.5 text-gray-400" /> {selectedInstructorDetail.area}
                  </span>
                  {selectedInstructorDetail.correo && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <FiMail className="w-3.5 h-3.5 text-gray-400" /> {selectedInstructorDetail.correo}
                    </span>
                  )}
                  {selectedInstructorDetail.fichas && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <FiActivity className="w-3.5 h-3.5 text-gray-400" /> {selectedInstructorDetail.fichas.length} Ficha(s) | {selectedInstructorDetail.totalAprendices} Aprendices
                    </span>
                  )}
                </div>
              </div>

              {/* Acciones principales para el instructor */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={sendingReminder === selectedInstructorDetail.id}
                  onClick={() => handleSendReminder(selectedInstructorDetail.id, selectedInstructorDetail.nombre)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  {sendingReminder === selectedInstructorDetail.id ? t('coordinatorDashboard.sending', 'Enviando...') : t('coordinatorDashboard.sendReminder', 'Enviar recordatorio')}
                </button>
                <button
                  onClick={() => navigate('/coordinador/revision')}
                  className="px-4 py-2 bg-[#407754] hover:bg-[#335f43] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <FiEye className="w-3.5 h-3.5" /> Ir a Revisión de Informes
                </button>
              </div>
            </div>

            {/* Desglose de Formatos GC y GF para el período activo */}
            <div>
              <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Estado de Formatos — Período: {periodoInfo?.mesActivo}
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Formato GC */}
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Gestión Contractual</span>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5">Formato GTH-F-062 V3 (GC)</h4>
                    </div>
                    {renderStatusBadge(selectedReports.gc)}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>
                      <strong>Última fecha:</strong> {selectedReports.gc?.fechaEnvio || selectedReports.gc?.fecha || 'Sin fecha de envío'}
                    </p>
                    {selectedReports.gc?.observaciones && (
                      <p className="italic text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 mt-1">
                        "{selectedReports.gc.observaciones}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Formato GF */}
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Gestión Financiera</span>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5">Formato GF (Liquidación)</h4>
                    </div>
                    {renderStatusBadge(selectedReports.gf)}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <p>
                      <strong>Última fecha:</strong> {selectedReports.gf?.fechaEnvio || selectedReports.gf?.fecha || 'Sin fecha de envío'}
                    </p>
                    {selectedReports.gf?.valorTotal && (
                      <p>
                        <strong>Valor liquidado:</strong> ${Number(selectedReports.gf.valorTotal).toLocaleString()} COP
                      </p>
                    )}
                    {selectedReports.gf?.observaciones && (
                      <p className="italic text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 mt-1">
                        "{selectedReports.gf.observaciones}"
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Carpeta Drive */}
            {(selectedInstructorDetail.carpeta_drive_url || selectedInstructorDetail.carpetaRuta) && (
              <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 truncate">
                  <FiFolder className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-semibold truncate">
                    Carpeta de evidencias: {selectedInstructorDetail.carpeta_drive_url || selectedInstructorDetail.carpetaRuta}
                  </span>
                </div>
                {selectedInstructorDetail.carpeta_drive_url && (
                  <a
                    href={selectedInstructorDetail.carpeta_drive_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                  >
                    Abrir Drive <FiExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

          </div>
        ) : (
          /* Listado en cuadrícula de todos los instructores pendientes */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instructoresSinInforme.map((inst) => (
              <div 
                key={inst.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-red-50 dark:border-red-900/30 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-md text-gray-900 dark:text-gray-100"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-gray-800 dark:text-gray-100">{inst.nombre}</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{inst.area}</p>
                    </div>
                    <span className="bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {t('coordinatorDashboard.pendingCount', '{{count}} Pendiente(s)', { count: inst.informesPendientes })}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <FiActivity className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      <span>{t('coordinatorDashboard.fichasApprentices', '{{fichas}} Ficha(s) | {{aprendices}} Aprendices', { fichas: inst.fichas?.length || 0, aprendices: inst.totalAprendices || 0 })}</span>
                    </div>
                    {(inst.carpetaRuta || inst.carpeta_drive_url) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <FiFolder className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                        <span className="truncate max-w-[200px]" title={inst.carpeta_drive_url || inst.carpetaRuta}>{inst.carpeta_drive_url || inst.carpetaRuta}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 border-t border-gray-50 dark:border-gray-700 pt-3">
                  <button
                    disabled={sendingReminder === inst.id}
                    onClick={() => handleSendReminder(inst.id, inst.nombre)}
                    className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <FiSend className="w-3.5 h-3.5" />
                    {sendingReminder === inst.id ? t('coordinatorDashboard.sending', 'Enviando...') : t('coordinatorDashboard.sendReminder', 'Enviar recordatorio')}
                  </button>
                  <button 
                    onClick={() => setSelectedInstructorDetail(inst)}
                    className="px-3.5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-[#407754] hover:text-white dark:hover:bg-[#407754] text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    {t('coordinatorDashboard.viewDetails', 'Ver detalles')} <FiArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </PageContainer>
  );
}


