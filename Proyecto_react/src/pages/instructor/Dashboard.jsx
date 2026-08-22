import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiClock, FiTrendingUp, FiUnlock, FiAlertCircle, FiFolder, FiFileText, FiChevronRight, FiSettings, FiBell } from 'react-icons/fi';
import logoSena from '../../assets/logo-sena.png';
import PeriodoCard from '../../components/PeriodoCard';
import StatCard from '../../components/StatCard';
import { usePeriodo } from '../../components/PeriodoContext';
import PageContainer from '../../components/PageContainer';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { periodoInfo } = usePeriodo();

  const getTranslatedMonth = (monthStr) => {
    const monthsEs = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const idx = monthsEs.indexOf(monthStr);
    if (idx !== -1) {
      return t(`months.${idx}`, monthStr);
    }
    return monthStr;
  };

  return (
    <PageContainer>
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{t('dashboard.instructorTitle', 'Panel de Control del Instructor')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('dashboard.instructorSubtitle', 'Sistema STIMI - Regional Huila, Centro de Gestión y Desarrollo Sostenible Surcolombiano')}</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Wider) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Period Banner */}
          <PeriodoCard isEditable={false} />

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              icon={FiCheckCircle}
              title={t('dashboard.sentReports', 'Informes Enviados')}
              value="0"
              iconBgClass="bg-blue-50 dark:bg-blue-950/40"
              iconColorClass="text-blue-600 dark:text-blue-400"
            />
            
            <StatCard
              icon={FiClock}
              title={`${t('common.pending', 'Pendientes')} (${getTranslatedMonth(periodoInfo.mesActivo.split(' ')[0])})`}
              value="2"
              iconBgClass="bg-amber-50 dark:bg-amber-950/40"
              iconColorClass="text-amber-500 dark:text-amber-400"
            />

            <StatCard
              icon={FiTrendingUp}
              title={t('dashboard.annualCompliance', 'Cumplimiento Anual')}
              value="100%"
              iconBgClass="bg-indigo-50 dark:bg-indigo-950/40"
              iconColorClass="text-indigo-600 dark:text-indigo-400"
            />
          </div>

          {/* Report Status */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('dashboard.monthlyReportsStatus', 'Estado de Informes del Mes Actual')}</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* GC Card */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950/50 p-2.5 rounded-lg text-blue-600 dark:text-blue-400">
                    <FiFileText className="w-6 h-6" />
                  </div>
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                    {t('common.pending', 'Pendiente')}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100">{t('revisionInformes.gcOption', 'Gestión Contractual (GC)')}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">Formato GTH-F-062 V10</p>
                <button 
                  onClick={() => navigate('/instructor/informes', { state: { openModal: true, reportType: 'GC' } })}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex justify-center items-center gap-2 cursor-pointer"
                >
                  {t('dashboard.loadReport', 'Cargar informe')}
                </button>
              </div>

              {/* GF Card */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <FiFileText className="w-6 h-6" />
                  </div>
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                    {t('common.pending', 'Pendiente')}
                  </span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-gray-100">{t('revisionInformes.gfOption', 'Gestión Financiera (GF)')}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">{t('dashboard.paymentDocument', 'Documento de pago')}</p>
                <button 
                  onClick={() => navigate('/instructor/informes', { state: { openModal: true, reportType: 'GF' } })}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex justify-center items-center gap-2 cursor-pointer"
                >
                  {t('dashboard.loadReport', 'Cargar informe')}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <FiCheckCircle className="text-green-500 w-4 h-4" />
                <span>{t('dashboard.lastValidatedPeriod', 'Último período validado')}: <strong className="text-gray-900 dark:text-gray-100">Junio 2026</strong></span>
              </div>
              <button 
                onClick={() => navigate('/instructor/informes')}
                className="text-sm font-semibold text-[#407754] dark:text-emerald-400 hover:underline flex items-center cursor-pointer"
              >
                {t('dashboard.viewHistory', 'Ver historial')} <FiChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Reminders & Alerts */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FiBell className="w-5 h-5 text-gray-400 dark:text-gray-500" /> {t('dashboard.reminders', 'Recordatorios')}
            </h3>
            
            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 p-4 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <div className="flex gap-3">
                  <FiAlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-red-900 dark:text-red-300">{t('dashboard.periodClosing', 'Cierre de período')}</h4>
                      <span className="bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">{t('common.urgent', 'Urgente')}</span>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                      {t('dashboard.pendingReportsReminder', 'Tienes 2 informes pendientes. Recuerda que la plataforma cierra el 31 de Julio a las 23:59.')}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{t('dashboard.quickAccess', 'Accesos Rápidos')}</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/instructor/periodo-actual', { state: { openModal: true, reportType: 'GC' } })}
                className="w-full flex items-center p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors group cursor-pointer"
              >
                <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <FiFileText className="w-5 h-5" />
                </div>
                <span className="ml-3 font-semibold text-sm">{t('dashboard.loadGC', 'Cargar Informe GC')}</span>
                <FiChevronRight className="ml-auto w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
              
              <button 
                onClick={() => navigate('/instructor/periodo-actual', { state: { openModal: true, reportType: 'GF' } })}
                className="w-full flex items-center p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-[#407754] dark:text-emerald-400 transition-colors group cursor-pointer"
              >
                <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <FiFileText className="w-5 h-5" />
                </div>
                <span className="ml-3 font-semibold text-sm">{t('dashboard.loadGF', 'Cargar Informe GF')}</span>
                <FiChevronRight className="ml-auto w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
 
              <button 
                onClick={() => navigate('/instructor/informes')}
                className="w-full flex items-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors group cursor-pointer"
              >
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <FiFolder className="w-5 h-5" />
                </div>
                <span className="ml-3 font-semibold text-sm">{t('dashboard.myReportsHistory', 'Mis Informes (Historial)')}</span>
                <FiChevronRight className="ml-auto w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Institucional */}
      <footer className="mt-12 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 text-center md:text-left text-gray-900 dark:text-gray-100">
        <img src={logoSena} alt="Logo SENA" className="w-16 h-16 object-contain opacity-80" />
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 dark:text-gray-100">{t('common.senaTitle', 'Servicio Nacional de Aprendizaje - SENA')}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('common.senaSubtitle', 'Regional Huila • Centro de Gestión y Desarrollo Sostenible Surcolombiano • Sede Yamboro')}</p>
        </div>
        <div className="flex flex-col gap-2 items-center md:items-end">
          <span className="bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{t('sidebar.instructor', 'Instructor')}</span>
        </div>
      </footer>

    </PageContainer>
  );
}

