import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FiUploadCloud, 
  FiFileText, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiChevronDown, 
  FiChevronRight, 
  FiCornerDownRight,
  FiInfo,
  FiX,
  FiArrowLeft,
  FiEye
} from 'react-icons/fi';
import { getInformes, addVersion, updateEstadoInforme, verPdf, uploadNuevaVersion, descartarUltimaVersion } from '../../services/informesService';
import { toast } from 'sonner';
import { usePeriodo } from '../../components/PeriodoContext';
import PageContainer from '../../components/PageContainer';

export default function PeriodoActual() {
  const { t } = useTranslation();
  const { periodoInfo } = usePeriodo();
  const currentPeriodName = periodoInfo?.mesActivo || '';

  const getTranslatedPeriodName = (periodStr) => {
    if (!periodStr) return '';
    const parts = periodStr.split(' ');
    if (parts.length < 2) return periodStr;
    const monthStr = parts[0];
    const yearStr = parts[1];
    
    const monthsEs = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const idx = monthsEs.indexOf(monthStr);
    if (idx !== -1) {
      return `${t(`months.${idx}`, monthStr)} ${yearStr}`;
    }
    return periodStr;
  };

  const [informesState, setInformesState] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const fileInputRef = React.useRef(null);
  
  // Modal state
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const location = useLocation();

  // Set selected period once periodInfo resolves
  useEffect(() => {
    if (currentPeriodName) {
      setSelectedPeriod(currentPeriodName);
    }
  }, [currentPeriodName]);
  
  // Load initial reports state
  useEffect(() => {
    getInformes().then(data => {
      console.log('>>> [DEBUG] getInformes() completo, informesState:', JSON.stringify(data, null, 2));
      console.log('>>> [DEBUG] Períodos disponibles:', data.map(d => d.periodo));
      console.log('>>> [DEBUG] Tipos disponibles:', data.map(d => d.tipo));
      setInformesState(data);
    });
  }, []);

  useEffect(() => {
    if (location.state?.openModal && location.state?.reportType && currentPeriodName) {
      setSelectedType(location.state.reportType);
      setSelectedPeriod(currentPeriodName); 
      setStep(3); // Jump to upload step since period and type are predefined
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location, currentPeriodName]);

  const [expandedVersions, setExpandedVersions] = useState({ GC: true, GF: true });

  const resetModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setStep(1);
      setSelectedType('');
      setSelectedFile(null);
      setIsUploading(false);
    }, 300);
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert(t('periodoActual.alerts.onlyPdf', 'Solo se permiten archivos PDF.'));
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        alert(t('periodoActual.alerts.sizeLimit', 'El archivo excede el límite de 100 MB.'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert(t('periodoActual.alerts.onlyPdf', 'Solo se permiten archivos PDF.'));
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        alert(t('periodoActual.alerts.sizeLimit', 'El archivo excede el límite de 100 MB.'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentPeriodName) return;

    setIsUploading(true);
    try {
      const existingReport = getPeriodoActualReport(selectedType);
      if (existingReport && existingReport.id) {
        // Report exists, upload a new version incrementing the version counter
        await uploadNuevaVersion(currentPeriodName, selectedType, selectedFile);
      } else {
        // First version, upload new report
        await addVersion(currentPeriodName, selectedType, 'inst-1', selectedFile);
      }

      // Refresh local state from the service (single source of truth)
      const updated = await getInformes();
      setInformesState(updated);
      setStep(4); // Success step
    } catch (err) {
      console.error('Error al subir informe:', err);
      toast.error(t('periodoActual.alerts.uploadError', 'Ocurrió un error al subir el informe. Intenta de nuevo.'));
    } finally {
      setIsUploading(false);
    }
  };

  const openModal = () => {
    setSelectedType('');
    if (currentPeriodName) {
      setSelectedPeriod(currentPeriodName);
    }
    setSelectedFile(null);
    setStep(2); // Jump to choosing type
    setIsModalOpen(true);
  };

  const toggleVersions = (type) => {
    setExpandedVersions(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const getPeriodoActualReport = (type) => {
    if (!currentPeriodName) return null;
    return informesState.find(inf => inf.periodo === currentPeriodName && inf.tipo === type);
  };

  const handleSubirBorrador = async (type) => {
    try {
      if (!currentPeriodName) return;
      // Find the informe id to pass to updateEstadoInforme
      const informe = informesState.find(
        inf => inf.periodo === currentPeriodName && inf.tipo === type
      );
      if (!informe || !informe.id) return;

      const toastId = toast.loading(t('periodoActual.alerts.subiendoBorrador', 'Subiendo borrador...'));
      await updateEstadoInforme(informe.id, 'Pendiente');

      // Refresh local state from the service
      const updated = await getInformes();
      setInformesState(updated);
      toast.success(t('periodoActual.alerts.borradorSubido', 'Borrador subido correctamente.'), { id: toastId });
    } catch (err) {
      console.error('Error al subir borrador:', err);
      toast.error(t('periodoActual.alerts.errorSubirBorrador', 'No se pudo subir el borrador.'));
    }
  };

  const handleDescartarBorrador = async (type) => {
    try {
      if (!currentPeriodName) return;
      const informe = informesState.find(
        inf => inf.periodo === currentPeriodName && inf.tipo === type
      );
      if (!informe || !informe.id) return;

      const toastId = toast.loading(t('periodoActual.alerts.descartandoBorrador', 'Descartando borrador...'));
      await descartarUltimaVersion(informe.id);
      
      const updated = await getInformes();
      setInformesState(updated);
      toast.success(t('periodoActual.alerts.borradorDescartado', 'Borrador descartado correctamente.'), { id: toastId });
    } catch (err) {
      console.error('Error al descartar borrador:', err);
      toast.error(t('periodoActual.alerts.errorDescartarBorrador', 'No se pudo descartar el borrador.'));
    }
  };

  if (!currentPeriodName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 border-4 border-sena-green border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('periodoActual.loadingPeriod', 'Cargando período activo...')}</p>
      </div>
    );
  }

  return (
    <PageContainer>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{t('periodoActual.title', 'Período Actual')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('periodoActual.subtitle', 'Carga y control de versiones para el período vigente')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#407754] hover:bg-[#346244] text-white text-sm font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
          >
            <FiUploadCloud className="w-5 h-5" /> {t('periodoActual.uploadReport', 'Cargar Informe')}
          </button>
        </div>
      </div>
 
      {/* Main Period section card */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
          <div>
            <span className="bg-green-100 text-[#407754] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{t('periodoActual.activePeriod', 'Período Activo')}</span>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mt-1.5 font-sans">{t('periodoActual.periodReport', 'Informe del Período —')} {getTranslatedPeriodName(currentPeriodName)}</h2>
          </div>
          <div className="text-xs text-gray-400 font-mono">STIMI Versioning Engine</div>
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['GC', 'GF'].map(type => {
            const report = getPeriodoActualReport(type);
            const versions = report ? report.versiones : [];
            const hasVersions = versions.length > 0;
            const lastVersion = hasVersions ? versions[0] : null;
            const currentStatus = lastVersion ? lastVersion.estado : 'No cargado';

            console.log(`>>> [DEBUG-RENDER] type=${type} | report=`, report);
            console.log(`>>> [DEBUG-RENDER] type=${type} | report?.periodo='${report?.periodo}' | report?.versiones?.length=${report?.versiones?.length}`);
            console.log(`>>> [DEBUG-RENDER] type=${type} | versions.length=${versions.length} | hasVersions=${hasVersions}`);
            console.log(`>>> [DEBUG-RENDER] type=${type} | lastVersion=`, lastVersion);
            console.log(`>>> [DEBUG-RENDER] type=${type} | currentStatus='${currentStatus}'`);
 
            return (
              <div key={type} className="border border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/30 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${type === 'GC' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                        <FiFileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-base">
                          {type === 'GC' ? t('periodoActual.reportGc', 'Informe GC') : t('periodoActual.reportGf', 'Informe GF')}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{type === 'GC' ? t('periodoActual.gcDesc', 'Gestión Contractual') : t('periodoActual.gfDesc', 'Gestión Financiera')}</p>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                      currentStatus === 'Validado' ? 'bg-emerald-100 text-emerald-800' :
                      currentStatus === 'Devuelto' ? 'bg-red-100 text-red-800 animate-pulse' :
                      currentStatus === 'Pendiente' ? 'bg-amber-100 text-amber-800' :
                      currentStatus === 'Borrador' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-300'
                    }`}>
                      {currentStatus === 'Validado' ? t('periodoActual.status.validated', 'Validado') :
                       currentStatus === 'Devuelto' ? t('periodoActual.status.returned', 'Devuelto') :
                       currentStatus === 'Pendiente' ? t('common.pending', 'Pendiente') :
                       currentStatus === 'Borrador' ? t('periodoActual.status.draft', 'Borrador') :
                       t('periodoActual.status.notUploaded', 'No cargado')}
                    </span>
                  </div>
 
                  {/* Devuelto Reason (if rejected) */}
                  {currentStatus === 'Devuelto' && lastVersion?.observacion && (
                    <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-2.5">
                      <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-red-950">{t('periodoActual.returnObservation', 'Observación de Devolución:')}</h4>
                        <p className="text-xs text-red-800 mt-0.5 leading-relaxed font-medium">{lastVersion.observacion}</p>
                      </div>
                    </div>
                  )}
 
                  {/* Versions History */}
                  <div className="mt-2 mb-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-xs">
                    <button 
                      onClick={() => toggleVersions(type)}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      <span>{t('periodoActual.versionHistory', 'Historial de Versiones')} ({versions.length})</span>
                      {expandedVersions[type] ? <FiChevronDown /> : <FiChevronRight />}
                    </button>
 
                    {expandedVersions[type] && (
                      <div className="mt-3.5 space-y-3 border-t border-gray-50 dark:border-gray-700 pt-3">
                        {hasVersions ? (
                          versions.map((ver, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <FiCornerDownRight className="w-3.5 h-3.5 text-gray-300 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-gray-700 dark:text-gray-300 truncate pr-2">V{ver.version} — {ver.archivo}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={async () => {
                                        const toastId = toast.loading('Abriendo versión del PDF...');
                                        try {
                                          await verPdf(report.id);
                                          toast.dismiss(toastId);
                                        } catch (err) {
                                          const status = err?.response?.status || 'sin status';
                                          const serverMsg = err?.response?.data?.message || err?.message || 'Error desconocido';
                                          toast.error(`No se pudo abrir el archivo. (HTTP ${status}: ${serverMsg})`, { id: toastId });
                                        }
                                      }}
                                      className="text-gray-400 hover:text-[#407754] hover:bg-green-50 px-1.5 py-0.5 rounded transition-all flex items-center gap-1 text-[10px] font-bold"
                                      title="Ver versión en navegador"
                                    >
                                      <FiEye className="w-3 h-3" />
                                      <span>{t('periodoActual.viewPdf', 'Ver PDF')}</span>
                                    </button>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      ver.estado === 'Validado' ? 'bg-emerald-50 text-emerald-700' :
                                      ver.estado === 'Devuelto' ? 'bg-red-50 text-red-700' :
                                      ver.estado === 'Borrador' ? 'bg-blue-50 text-blue-700' :
                                      'bg-amber-50 text-amber-700'
                                    }`}>{ver.estado === 'Validado' ? t('periodoActual.status.validated', 'Validado') :
                                         ver.estado === 'Devuelto' ? t('periodoActual.status.returned', 'Devuelto') :
                                         ver.estado === 'Borrador' ? t('periodoActual.status.draft', 'Borrador') :
                                         t('common.pending', 'Pendiente')}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                                  <span>{ver.fecha}</span>
                                  {ver.observacion && <span className="text-red-500 font-medium">Motivo: {ver.observacion}</span>}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-2 text-gray-400 dark:text-gray-500 text-xs font-medium">{t('periodoActual.noVersionsUploaded', 'Sin versiones cargadas')}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
 
                {/* Actions */}
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    {/* Main action button depending on status */}
                    {currentStatus === 'No cargado' && (
                      <button 
                        onClick={() => {
                          setSelectedType(type);
                          setSelectedFile(null);
                          setStep(3);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-[#407754] hover:bg-[#346244] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FiUploadCloud className="w-4 h-4" /> {t('periodoActual.uploadReportShort', 'Cargar informe')}
                      </button>
                    )}
                    {currentStatus === 'Borrador' && (
                      <>
                        <button 
                          onClick={() => handleDescartarBorrador(type)}
                          className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {t('periodoActual.discardDraft', 'Descartar borrador')}
                        </button>
                        <button 
                          onClick={() => handleSubirBorrador(type)}
                          className="flex-1 py-2 bg-[#407754] hover:bg-[#346244] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {t('periodoActual.submitDraft', 'Subir borrador')}
                        </button>
                      </>
                    )}
                    {currentStatus === 'Devuelto' && (
                      <button 
                        onClick={() => {
                          setSelectedType(type);
                          setSelectedFile(null);
                          setStep(3);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FiUploadCloud className="w-4 h-4" /> {t('periodoActual.uploadCorrection', 'Subir corrección (Nueva Versión)')}
                      </button>
                    )}
                    {currentStatus === 'Pendiente' && (
                      <div className="flex-1 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl text-center">
                        {t('periodoActual.underReview', 'En revisión por coordinación')}
                      </div>
                    )}
                    {currentStatus === 'Validado' && (
                      <div className="flex-1 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5">
                        <FiCheckCircle className="w-4 h-4 text-emerald-600" /> {t('periodoActual.approvedValidated', 'Aprobado / Validado')}
                      </div>
                    )}
                  </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
 
      {/* Info Card */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 flex gap-4">
        <FiInfo className="w-6 h-6 text-blue-500 dark:text-blue-400 shrink-0" />
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1">{t('periodoActual.infoTitle', 'Carga de Versiones del Mes')}</h4>
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed max-w-3xl">
            {t('periodoActual.infoText', 'Solo puedes subir informes correspondientes al período vigente. Si el informe ha sido validado con éxito, la carga para ese módulo quedará bloqueada. Visita el historial para ver entregas de meses anteriores.')}
          </p>
        </div>
      </div>
 
      {/* Upload Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetModal}></div>
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {step === 4 ? t('periodoActual.uploadSuccess', 'Carga Exitosa') : t('periodoActual.uploadNewReport', 'Cargar Nuevo Informe')}
              </h2>
              {step !== 4 && (
                <button onClick={resetModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
 
            {/* Modal Body */}
            <div className="p-6">
              
              {/* Progress dots */}
              {step < 4 && (
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#407754]' : i < step ? 'w-4 bg-green-200' : 'w-4 bg-gray-200'}`} />
                  ))}
                </div>
              )}
 
              {/* Step 1: Period Selection (Static for PeriodoActual) */}
              {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">{t('periodoActual.step1Title', 'Paso 1 de 3 — Selección de período')}</label>
                    <select 
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#407754] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm appearance-none"
                    >
                      <option value={currentPeriodName} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{getTranslatedPeriodName(currentPeriodName)} ({t('periodoActual.currentMonthLabel', 'Mes Actual')})</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button onClick={resetModal} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">{t('common.cancel', 'Cancelar')}</button>
                    <button 
                      onClick={() => setStep(2)}
                      className="px-6 py-2 bg-[#407754] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-[#346244] transition-all"
                    >
                      {t('periodoActual.next', 'Siguiente')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Type Selection */}
              {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">{t('periodoActual.step2Title', 'Paso 2 de 3 — Tipo de informe')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedType('GC')}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selectedType === 'GC' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <FiFileText className={`w-6 h-6 mb-2 ${selectedType === 'GC' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                      <h4 className={`text-sm font-bold ${selectedType === 'GC' ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'}`}>{t('periodoActual.reportGc', 'Informe GC')}</h4>
                      <p className={`text-xs mt-1 ${selectedType === 'GC' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>{t('periodoActual.gcDesc', 'Gestión Contractual')}</p>
                    </button>
                    
                    <button
                      onClick={() => setSelectedType('GF')}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selectedType === 'GF' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <FiFileText className={`w-6 h-6 mb-2 ${selectedType === 'GF' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                      <h4 className={`text-sm font-bold ${selectedType === 'GF' ? 'text-emerald-900 dark:text-emerald-200' : 'text-gray-900 dark:text-gray-100'}`}>{t('periodoActual.reportGf', 'Informe GF')}</h4>
                      <p className={`text-xs mt-1 ${selectedType === 'GF' ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'}`}>{t('periodoActual.gfDesc', 'Gestión Financiera')}</p>
                    </button>
                  </div>
                  <div className="flex justify-between mt-8">
                    <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-1">
                      <FiArrowLeft className="w-4 h-4" /> {t('periodoActual.back', 'Atrás')}
                    </button>
                    <button 
                      onClick={() => setStep(3)}
                      disabled={!selectedType}
                      className="px-6 py-2 bg-[#407754] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-[#346244] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {t('periodoActual.next', 'Siguiente')}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: File Upload */}
              {step === 3 && (
                <div className="space-y-5 animate-in slide-in-from-right-4 fade-in">
                  <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                    <div className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{t('periodoActual.period', 'Período:')}</span> <strong className="text-gray-900 dark:text-gray-100">{currentPeriodName}</strong>
                      <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                      <span className="text-gray-500 dark:text-gray-400">{t('periodoActual.type', 'Tipo:')}</span> <strong className="text-gray-900 dark:text-gray-100">{t('periodoActual.reportTypePrefix', 'Informe')} {selectedType}</strong>
                    </div>
                  </div>
 
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">{t('periodoActual.step3Title', 'Paso 3 de 3 — Adjuntar archivo')}</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {selectedType === 'GC' ? t('periodoActual.formatGc', 'Formato GTH-F-062 V10 — Gestión Contractual') : t('periodoActual.formatGf', 'Gestión Financiera (Soporte)')}
                    </p>
                    
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                    />
 
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer group ${
                        selectedFile ? 'border-[#407754] bg-green-50/30 dark:bg-green-950/20' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {selectedFile ? (
                        <div className="flex flex-col items-center justify-center animate-in zoom-in-95">
                          <div className="bg-[#407754] w-12 h-12 rounded-full flex items-center justify-center mb-3">
                            <FiCheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-full px-4">{selectedFile.name}</p>
                          <p className="text-xs text-[#407754] dark:text-emerald-400 mt-1 font-semibold">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                            className="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors font-medium hover:underline"
                          >
                            {t('periodoActual.removeAndSelectOther', 'Quitar y seleccionar otro')}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="bg-blue-50 dark:bg-blue-950/40 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <FiUploadCloud className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('periodoActual.dragDropText', 'Arrastra tu archivo aquí o haz clic para seleccionarlo')}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('periodoActual.pdfLimitText', 'Solo archivos PDF · Máximo 10 MB')}</p>
                        </div>
                      )}
                    </div>
                  </div>
 
                  <div className="flex justify-between mt-8">
                    <button onClick={() => setStep(2)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center gap-1" disabled={isUploading}>
                      <FiArrowLeft className="w-4 h-4" /> {t('periodoActual.back', 'Atrás')}
                    </button>
                    <button 
                      onClick={handleUpload}
                      disabled={isUploading || !selectedFile}
                      className="px-6 py-2 bg-[#407754] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-[#346244] disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {t('periodoActual.uploading', 'Subiendo...')}
                        </>
                      ) : (
                        t('periodoActual.uploadButton', 'Subir archivo')
                      )}
                    </button>
                  </div>
                </div>
              )}
 
              {/* Step 4: Success */}
              {step === 4 && (
                <div className="text-center py-6 animate-in zoom-in-95 fade-in">
                  <div className="bg-green-100 dark:bg-green-950/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle className="w-8 h-8 text-green-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">{t('periodoActual.uploadSuccessTitle', '¡Archivo cargado exitosamente!')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                    {t('periodoActual.uploadSuccessDescPrefix', 'El informe')} <strong>{selectedType}</strong> {t('periodoActual.uploadSuccessDescMiddle', 'se ha guardado como')} <span className="font-semibold text-amber-600 dark:text-amber-400">{t('periodoActual.status.draft', 'Borrador')}</span> {t('periodoActual.uploadSuccessDescSuffix', 'en el período de')} <strong>{currentPeriodName}</strong>.
                  </p>
                  
                  <button 
                    onClick={resetModal}
                    className="mt-8 w-full py-3 bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
                  >
                    {t('periodoActual.done', 'Listo')}
                  </button>
                </div>
              )}
 
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
