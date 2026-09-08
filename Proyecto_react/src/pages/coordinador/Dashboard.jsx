import React, { useEffect, useState } from 'react';
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
  FiFolder, 
  FiSend 
} from 'react-icons/fi';
import { toast } from 'sonner';
import PeriodoCard from '../../components/PeriodoCard';
import StatCard from '../../components/StatCard';
import PageContainer from '../../components/PageContainer';
import { usePeriodo } from '../../components/PeriodoContext';

export default function Dashboard() {
  const { t } = useTranslation();
  const { periodoInfo } = usePeriodo();
  const [instructores, setInstructores] = useState([]);
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(null);

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
      informesPendientes: Math.max(0, 2 - validadosInst)
    };
  }).filter(inst => inst.informesPendientes > 0);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-red-700 dark:text-red-300">
            <FiAlertTriangle className="w-5 h-5" />
            <h4 className="font-bold text-base">{t('coordinatorDashboard.complianceAlert', 'Alerta de Cumplimiento: Instructores sin Informe')}</h4>
          </div>
          <span className="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 text-xs font-extrabold px-3 py-1 rounded-full">
            {t('coordinatorDashboard.criticalPending', '{{count}} Pendiente(s) Crítico(s)', { count: instructoresSinInforme.length })}
          </span>
        </div>

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
                    <span>{t('coordinatorDashboard.fichasApprentices', '{{fichas}} Ficha(s) | {{aprendices}} Aprendices', { fichas: inst.fichas.length, aprendices: inst.totalAprendices })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <FiFolder className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    <span className="truncate max-w-[200px]" title={inst.carpetaRuta}>{inst.carpetaRuta}</span>
                  </div>
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
                  onClick={() => toast.info(t('coordinatorDashboard.alerts.showingDetails', 'Mostrando detalles de: {{nombre}}', { nombre: inst.nombre }))}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {t('coordinatorDashboard.viewDetails', 'Ver detalles')} <FiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </PageContainer>
  );
}

