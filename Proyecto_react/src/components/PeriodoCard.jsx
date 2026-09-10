import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiUnlock, FiLock, FiFileText, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { usePeriodo } from './PeriodoContext';
import { toast } from 'sonner';

export default function PeriodoCard({ isEditable = false }) {
  const { t } = useTranslation();
  const { periodoInfo, updatePeriodo } = usePeriodo();
  const [isEditing, setIsEditing] = useState(false);

  const getInitialMonthAndYear = (str) => {
    if (!str) return { month: 'Enero', year: new Date().getFullYear().toString() };
    const parts = str.split(' ');
    const month = parts[0] || 'Enero';
    const year = parts[1] || new Date().getFullYear().toString();
    return { month, year };
  };

  const initialParsed = getInitialMonthAndYear(periodoInfo.mesActivo);

  // Local edit states
  const [selectedMonth, setSelectedMonth] = useState(initialParsed.month);
  const [selectedYear, setSelectedYear] = useState(initialParsed.year);
  const [fechaLimite, setFechaLimite] = useState(periodoInfo.fechaLimite.split('T')[0]);
  const [habilitado, setHabilitado] = useState(periodoInfo.habilitado);

  // Sync state if context changes
  useEffect(() => {
    const parsed = getInitialMonthAndYear(periodoInfo.mesActivo);
    setSelectedMonth(parsed.month);
    setSelectedYear(parsed.year);
    setFechaLimite(periodoInfo.fechaLimite.split('T')[0]);
    setHabilitado(periodoInfo.habilitado);
  }, [periodoInfo]);

  const getTodayISO = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleSave = () => {
    const todayStr = getTodayISO();
    if (fechaLimite < todayStr) {
      toast.error(t('periodoCard.errorPastDeadline', 'La fecha límite no puede ser anterior a la fecha de hoy.'));
      return;
    }
    const mesActivoVal = `${selectedMonth} ${selectedYear}`;
    updatePeriodo({
      mesActivo: mesActivoVal,
      fechaLimite: `${fechaLimite}T23:59:00`,
      habilitado
    });
    setIsEditing(false);
    toast.success(t('periodoCard.toastUpdateSuccess', 'Período de carga actualizado correctamente'));
  };

  const handleCancel = () => {
    const parsed = getInitialMonthAndYear(periodoInfo.mesActivo);
    setSelectedMonth(parsed.month);
    setSelectedYear(parsed.year);
    setFechaLimite(periodoInfo.fechaLimite.split('T')[0]);
    setHabilitado(periodoInfo.habilitado);
    setIsEditing(false);
  };

  const getTranslatedPeriod = (mesActivoStr) => {
    if (!mesActivoStr) return '';
    const parts = mesActivoStr.split(' ');
    const monthStr = parts[0];
    const yearStr = parts[1] || '';
    const monthsEs = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const idx = monthsEs.indexOf(monthStr);
    if (idx !== -1) {
      return `${t(`months.${idx}`, monthStr)} ${yearStr}`;
    }
    return mesActivoStr;
  };

  const formatFriendlyDate = (isoString) => {
    if (!isoString) return '';
    const datePart = isoString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length !== 3) return datePart;
    const months = [
      t('months.0', 'Enero'), t('months.1', 'Febrero'), t('months.2', 'Marzo'), t('months.3', 'Abril'),
      t('months.4', 'Mayo'), t('months.5', 'Junio'), t('months.6', 'Julio'), t('months.7', 'Agosto'),
      t('months.8', 'Septiembre'), t('months.9', 'Octubre'), t('months.10', 'Noviembre'), t('months.11', 'Diciembre')
    ];
    const year = parts[0];
    const month = months[parseInt(parts[1], 10) - 1];
    const day = parts[2];
    return t('common.datePattern', '{{day}} de {{month}} de {{year}}', { day, month, year });
  };

  const monthsList = [
    { value: 'Enero', labelKey: 'months.0', labelDefault: 'Enero' },
    { value: 'Febrero', labelKey: 'months.1', labelDefault: 'Febrero' },
    { value: 'Marzo', labelKey: 'months.2', labelDefault: 'Marzo' },
    { value: 'Abril', labelKey: 'months.3', labelDefault: 'Abril' },
    { value: 'Mayo', labelKey: 'months.4', labelDefault: 'Mayo' },
    { value: 'Junio', labelKey: 'months.5', labelDefault: 'Junio' },
    { value: 'Julio', labelKey: 'months.6', labelDefault: 'Julio' },
    { value: 'Agosto', labelKey: 'months.7', labelDefault: 'Agosto' },
    { value: 'Septiembre', labelKey: 'months.8', labelDefault: 'Septiembre' },
    { value: 'Octubre', labelKey: 'months.9', labelDefault: 'Octubre' },
    { value: 'Noviembre', labelKey: 'months.10', labelDefault: 'Noviembre' },
    { value: 'Diciembre', labelKey: 'months.11', labelDefault: 'Diciembre' },
  ];

  const currentSystemYear = new Date().getFullYear();
  const targetMaxYear = Math.max(parseInt(selectedYear, 10) || currentSystemYear, currentSystemYear) + 1;
  const yearsList = [];
  for (let y = currentSystemYear; y <= targetMaxYear; y++) {
    yearsList.push(y);
  }

  const activeBadgeColor = periodoInfo.habilitado ? 'bg-[#407754] text-white' : 'bg-red-600 text-white';
  const activeBadgeLabel = periodoInfo.habilitado ? t('common.active', 'Activo') : t('common.closed', 'Cerrado');
  const ActiveIcon = periodoInfo.habilitado ? FiUnlock : FiLock;

  return (
    <div className="bg-green-50 dark:bg-gray-800/80 border border-green-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-10 -top-10 text-green-100 dark:text-gray-700 opacity-50 dark:opacity-20">
        <ActiveIcon className="w-48 h-48" />
      </div>

      <div className="flex flex-1 items-start sm:items-center gap-5 relative z-10 w-full">
        <div className="bg-white dark:bg-gray-700 p-3 rounded-full shadow-sm shrink-0 relative z-10">
          <ActiveIcon className="w-8 h-8 text-[#407754] dark:text-emerald-400" />
        </div>
        
        <div className="relative z-10 flex-1 w-full">
          {isEditing ? (
            <div className="space-y-3 w-full max-w-xl">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{t('periodoCard.editPeriodTitle', 'Editar Período de Carga')}</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('periodoCard.activeMonthLabel', 'Mes Activo')}</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#407754] transition-all cursor-pointer"
                  >
                    {monthsList.map(m => (
                      <option key={m.value} value={m.value}>
                        {t(m.labelKey, m.labelDefault)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('periodoCard.activeYearLabel', 'Año Activo')}</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#407754] transition-all cursor-pointer"
                  >
                    {yearsList.map(y => (
                      <option key={y} value={y.toString()}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('periodoCard.deadlineLabel', 'Fecha Límite')}</label>
                  <input
                    type="date"
                    value={fechaLimite}
                    min={getTodayISO()}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#407754] transition-all cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1 justify-end">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer h-9">
                    <input
                      type="checkbox"
                      checked={habilitado}
                      onChange={(e) => setHabilitado(e.target.checked)}
                      className="w-4 h-4 text-[#407754] bg-white border-gray-300 rounded focus:ring-[#407754] focus:ring-2"
                    />
                    {t('periodoCard.enabledLabel', 'Habilitado')}
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {isEditable ? t('periodoCard.academicLoadPeriod', 'Período de Carga Académica') : t('periodoCard.systemEnabledLabel', 'Sistema Habilitado para Carga de Informes')}
                </h2>
                <span className={`${activeBadgeColor} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide`}>
                  {activeBadgeLabel}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('periodoCard.loadPeriodPrefix', 'Período de carga:')} <strong className="text-gray-900 dark:text-gray-100">{getTranslatedPeriod(periodoInfo.mesActivo)}</strong> <span className="mx-2 text-gray-300 dark:text-gray-600">|</span> 
                {t('periodoCard.deadlinePrefix', 'Fecha límite:')} <strong className="text-red-600 dark:text-red-400">{formatFriendlyDate(periodoInfo.fechaLimite)}</strong>
              </p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
                  Formato GTH-F-062 V3 (GC)
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
                  Formato GF (Gestión Financiera)
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative z-10 flex gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
        {isEditable && (
          isEditing ? (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleCancel}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FiX className="w-4 h-4" /> {t('common.cancel', 'Cancelar')}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#407754] hover:bg-[#335f43] text-white text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 hover:shadow-md cursor-pointer"
              >
                <FiCheck className="w-4 h-4" /> {t('common.save', 'Guardar')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full md:w-auto px-4 py-2.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 hover:shadow-sm cursor-pointer"
            >
              <FiEdit2 className="w-4 h-4 text-[#407754] dark:text-emerald-400" /> {t('periodoCard.editPeriodButton', 'Editar Período')}
            </button>
          )
        )}
        
        {!isEditable && (
          <div className="hidden lg:flex flex-col gap-2">
            <span className="text-[10px] font-bold text-[#407754]/80 dark:text-emerald-400/80 text-right">{t('periodoCard.validFormats', 'Formatos vigentes')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

