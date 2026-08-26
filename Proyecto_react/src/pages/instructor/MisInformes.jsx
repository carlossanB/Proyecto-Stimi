import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FiFolder, 
  FiChevronRight, 
  FiChevronDown, 
  FiUploadCloud, 
  FiX, 
  FiCheckCircle, 
  FiFileText, 
  FiInfo, 
  FiArrowLeft, 
  FiEye, 
  FiAlertCircle,
  FiDownload,
  FiCornerDownRight
} from 'react-icons/fi';
import { getInformes, getHistorial, addVersion, descargarPdf, verPdf, verPdfVersion, updateEstadoInforme, descartarUltimaVersion } from '../../services/informesService';
import { toast } from 'sonner';
import PageContainer from '../../components/PageContainer';

// Month names defined at module scope so they are accessible everywhere
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MisInformes() {
  const { t } = useTranslation();
  
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef(null);
  
  // Modal state
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [obsModalData, setObsModalData] = useState(null);
  const [expandedReportVersions, setExpandedReportVersions] = useState({});

  const location = useLocation();
  const [expandedFolderId, setExpandedFolderId] = useState(null);

  // Current period name computed once and stored at component level
  const now = new Date();
  const currentPeriodName = `${MESES[now.getMonth()]} ${now.getFullYear()}`;

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active and history reports separately so one failure doesn't block both
      let activeReports = [];
      let historyReports = [];

      try {
        activeReports = await getInformes();
      } catch (e) {
        console.warn('Error al cargar informes activos:', e);
      }

      try {
        historyReports = await getHistorial();
      } catch (e) {
        console.warn('Error al cargar historial:', e);
      }

      // Merge and filter duplicates by ID
      const allReports = [
        ...(Array.isArray(activeReports) ? activeReports : []),
        ...(Array.isArray(historyReports) ? historyReports : [])
      ];
      const uniqueReports = [];
      const seenIds = new Set();
      for (const r of allReports) {
        if (r?.id != null && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          uniqueReports.push(r);
        }
      }

      // Group reports by period string (e.g. "Julio 2026")
      const groups = {};

      // Seed the current month period so the folder is always visible for upload
      groups[currentPeriodName] = {
        id: currentPeriodName,
        month: MESES[now.getMonth()],
        year: now.getFullYear().toString(),
        periodName: currentPeriodName,
        files: [],
        pending: 0,
        validated: 0
      };

      uniqueReports.forEach(rep => {
        const periodKey = rep?.periodo || currentPeriodName;
        if (!groups[periodKey]) {
          const parts = periodKey.split(' ');
          groups[periodKey] = {
            id: periodKey,
            month: parts[0] || 'Desconocido',
            year: parts[1] || '',
            periodName: periodKey,
            files: [],
            pending: 0,
            validated: 0
          };
        }

        const versions = Array.isArray(rep?.versiones) ? rep.versiones : [];
        const lastVersion = versions.length > 0 ? versions[0] : null;

        if (lastVersion) {
          groups[periodKey].files.push({
            id_informe: rep.id,
            type: rep.tipo || '',
            name: lastVersion.archivo || 'Sin nombre',
            size: lastVersion.size || '0 MB',
            date: lastVersion.fecha || '',
            status: lastVersion.estado || 'Pendiente',
            observacion: rep.observacion || rep.comentario || lastVersion.observacion || lastVersion.comentario || null,
            versiones: versions
          });

          if (lastVersion.estado === 'Validado') {
            groups[periodKey].validated++;
          } else {
            groups[periodKey].pending++;
          }
        }
      });

      // Sort periods by year & month index desc
      const getPeriodScore = (name) => {
        const parts = (name || '').split(' ');
        if (parts.length < 2) return 0;
        const mesIdx = MESES.map(m => m.toLowerCase()).indexOf(parts[0].toLowerCase());
        const anio = parseInt(parts[1]) || 0;
        return anio * 12 + mesIdx;
      };

      const sortedPeriods = Object.values(groups).sort((a, b) => {
        return getPeriodScore(b.periodName) - getPeriodScore(a.periodName);
      });

      setPeriods(sortedPeriods);

      // Auto-expand the first folder if present
      if (sortedPeriods.length > 0 && expandedFolderId === null) {
        setExpandedFolderId(sortedPeriods[0].id);
      }
    } catch (err) {
      console.error('Error inesperado al cargar informes:', err);
      setError(t('misInformes.alerts.errorHistory', 'No se pudo cargar el historial. Intente de nuevo.'));
      toast.error(t('misInformes.alerts.errorInfo', 'Error al cargar la información de informes.'));
    } finally {
      setLoading(false);
    }
  };

  // Load initial reports state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (location.state?.openModal && location.state?.reportType) {
      setSelectedType(location.state.reportType);
      setSelectedPeriod(currentPeriodName); 
      setStep(3); // Jump to upload step
      setIsModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const resetModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setStep(1);
      setSelectedPeriod('');
      setSelectedType('');
      setSelectedFile(null);
      setIsUploading(false);
    }, 300);
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error(t('periodoActual.alerts.onlyPdf', 'Solo se permiten archivos PDF.'));
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(t('periodoActual.alerts.sizeLimit', 'El archivo excede el límite de 100 MB.'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error(t('periodoActual.alerts.onlyPdf', 'Solo se permiten archivos PDF.'));
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error(t('periodoActual.alerts.sizeLimit', 'El archivo excede el límite de 100 MB.'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const toastId = toast.loading(t('misInformes.alerts.uploadingFile', 'Subiendo archivo al servidor...'));
    try {
      await addVersion(selectedPeriod, selectedType, 'inst-1', selectedFile);
      toast.success(t('misInformes.alerts.uploadSuccess', '¡Archivo cargado con éxito!'), { id: toastId });
      await loadReports();
      setStep(4); // Success step
    } catch (err) {
      console.error('Error al subir informe:', err);
      const errMsg = err.response?.data?.message || 'Error al conectar con el servidor';
      toast.error(t('misInformes.alerts.errorUploadReport', 'No se pudo subir el informe: {{error}}', { error: errMsg }), { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadFile = async (id, filename) => {
    const toastId = toast.loading(t('misInformes.alerts.downloadingPdf', 'Descargando archivo PDF...'));
    try {
      await descargarPdf(id, filename);
      toast.success(t('misInformes.alerts.downloadCompleted', '¡Descarga completada!'), { id: toastId });
    } catch (err) {
      console.error('Error al descargar archivo:', err);
      toast.error(t('misInformes.alerts.errorDownload', 'No se pudo descargar el archivo del servidor.'), { id: toastId });
    }
  };

  const handleViewFile = async (id) => {
    const toastId = toast.loading(t('misInformes.alerts.openingPdf', 'Abriendo archivo PDF...'));
    try {
      console.log(`>>> [DEBUG-FRONTEND] handleViewFile llamado con id: ${id} (tipo: ${typeof id})`);
      await verPdf(id);
      toast.dismiss(toastId);
    } catch (err) {
      const status = err?.response?.status || 'sin status';
      const serverMsg = err?.response?.data?.message || err?.message || 'Error desconocido';
      console.error(`>>> [DEBUG-FRONTEND] Error al ver archivo | Status: ${status} | Mensaje:`, serverMsg, '| Error completo:', err);
      toast.error(t('misInformes.alerts.errorOpenPdf', 'No se pudo abrir el archivo. (HTTP {{status}}: {{message}})', { status, message: serverMsg }), { id: toastId });
    }
  };

  const handleViewClick = (file) => {
    console.log(">>> [DEBUG] Click en Ver. Datos del archivo:", file);
    if (file.observacion && String(file.observacion).trim() !== '') {
      console.log(">>> [DEBUG] Observación detectada, abriendo modal...");
      setObsModalData({
        id: file.id_informe,
        filename: file.name,
        observation: file.observacion,
        status: file.status,
        action: 'view'
      });
    } else {
      console.log(">>> [DEBUG] Sin observación, abriendo directamente...");
      handleViewFile(file.id_informe);
    }
  };

  const handleDownloadClick = (file) => {
  console.log(">>> [DEBUG] Click en Descargar (Directo).");
  handleDownloadFile(file.id_informe, file.name);
};

// Subir borrador: change status from Borrador to Pendiente
const handleSubirBorrador = async (reportId) => {
  try {
    const toastId = toast.loading(t('periodoActual.alerts.subiendoBorrador', 'Subiendo borrador...'));
    await updateEstadoInforme(reportId, 'Pendiente');
    await loadReports();
    toast.success(t('periodoActual.alerts.borradorSubido', 'Borrador subido correctamente.'), { id: toastId });
  } catch (err) {
    console.error('Error al subir borrador:', err);
    toast.error(t('periodoActual.alerts.errorSubirBorrador', 'No se pudo subir el borrador.'));
  }
};

// Descartar borrador: remove last version
const handleDescartarBorrador = async (reportId) => {
  try {
    const toastId = toast.loading(t('periodoActual.alerts.descartandoBorrador', 'Descartando borrador...'));
    await descartarUltimaVersion(reportId);
    await loadReports();
    toast.success(t('periodoActual.alerts.borradorDescartado', 'Borrador descartado correctamente.'), { id: toastId });
  } catch (err) {
    console.error('Error al descartar borrador:', err);
    toast.error(t('periodoActual.alerts.errorDescartarBorrador', 'No se pudo descartar el borrador.'));
  }
};

  const openModal = () => {
    setSelectedType('');
    setSelectedPeriod('');
    setStep(1);
    setIsModalOpen(true);
  };

  const toggleFolder = (id) => {
    setExpandedFolderId(prev => prev === id ? null : id);
  };

  const toggleReportVersions = (reportId) => {
    setExpandedReportVersions(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  if (loading && periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 border-4 border-[#407754] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('misInformes.loadingHistory', 'Cargando historial de informes...')}</p>
      </div>
    );
  }

  if (error && periods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <FiAlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-700 font-semibold text-center">{error}</p>
        <button
          onClick={loadReports}
          className="px-5 py-2 bg-[#407754] text-white text-sm font-bold rounded-xl hover:bg-[#346244] transition-colors"
        >
          {t('misInformes.retry', 'Reintentar')}
        </button>
      </div>
    );
  }

  return (
    <PageContainer>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{t('misInformes.title', 'Historial de Informes')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('misInformes.subtitle', 'Historial y Archivo de Períodos pasados y vigentes')}</p>
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

      {/* Folders List */}
      <div className="space-y-4">
        {periods.map(folder => {
          const hasGC = folder.files.some(f => f.type === 'GC');
          const hasGF = folder.files.some(f => f.type === 'GF');

          return (
            <div key={folder.id} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
              {/* Folder Header (Clickable) */}
              <div 
                onClick={() => toggleFolder(folder.id)}
                className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${expandedFolderId === folder.id ? 'bg-[#407754] text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-300 group-hover:text-[#407754] dark:group-hover:text-white group-hover:bg-green-50 dark:group-hover:bg-gray-700'}`}>
                    <FiFolder className={`w-8 h-8 ${expandedFolderId === folder.id ? 'fill-current opacity-40' : 'fill-current opacity-20'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{getTranslatedPeriodName(folder.periodName)}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{folder.files.length} {t('misInformes.attachedFilesCount', 'archivo(s) adjunto(s) en este período')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 ml-14 sm:ml-0">
                  <div className="flex gap-2 flex-wrap">
                    {folder.pending > 0 && (
                      <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900">
                        {folder.pending} {t('misInformes.pendingCount', 'pendiente(s)')}
                      </span>
                    )}
                    {folder.validated > 0 && (
                      <span className="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
                        {folder.validated} {t('misInformes.validatedCount', 'validado(s)')}
                      </span>
                    )}
                    {folder.files.length === 0 && (
                      <span className="bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600">
                        {t('misInformes.noLoads', 'Sin cargas')}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {expandedFolderId === folder.id ? (
                      <FiChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <FiChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-all" />
                    )}
                  </div>
                </div>
              </div>

              {/* Folder Details (Expanded) */}
              {expandedFolderId === folder.id && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="mt-2 space-y-3">
                    {['GC', 'GF'].map(type => {
                      const file = folder.files.find(f => f.type === type);
                                    if (file) {
                        const isVersionsExpanded = !!expandedReportVersions[file.id_informe];
                        const versionsList = file.versiones || [];

                        return (
                          <div key={type} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${type === 'GC' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
                                  <FiFileText className="w-6 h-6" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('periodoActual.reportTypePrefix', 'Informe')} {type}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      file.status === 'Validado' ? 'bg-emerald-100 text-emerald-800' :
                                      file.status === 'Devuelto' ? 'bg-red-100 text-red-800' :
                                      file.status === 'Borrador' ? 'bg-blue-100 text-blue-800' :
                                      'bg-amber-100 text-amber-800'
                                    }`}>
                                      {file.status === 'Validado' ? t('periodoActual.status.validated', 'Validado') :
                                       file.status === 'Devuelto' ? t('periodoActual.status.returned', 'Devuelto') :
                                       file.status === 'Borrador' ? t('periodoActual.status.draft', 'Borrador') :
                                       t('common.pending', 'Pendiente')}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between sm:justify-end gap-2 ml-14 sm:ml-0">
                                <div className="text-right mr-4">
                                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{file.date}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">{file.size}</p>
                                </div>
                                <button 
                                  onClick={() => handleViewClick(file)}
                                  className="text-gray-400 hover:text-[#407754] hover:bg-green-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer" 
                                  title="Ver archivo PDF"
                                >
                                  <FiEye className="w-5 h-5" />
                                  <span className="hidden sm:inline">{t('misInformes.view', 'Ver')}</span>
                                </button>
                                <button 
                                  onClick={() => handleDownloadClick(file)}
                                  className="text-gray-400 hover:text-[#407754] hover:bg-green-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer" 
                                  title="Descargar archivo PDF"
                                >
                                  <FiDownload className="w-5 h-5" />
                                  <span className="hidden sm:inline">{t('misInformes.download', 'Descargar')}</span>
                                </button>
                                {file.status === 'Borrador' && (
                                  <>
                                    <button 
                                      onClick={() => handleDescartarBorrador(file.id_informe)}
                                      className="text-red-600 hover:text-red-800 hover:bg-red-100 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer"
                                      title="Descartar borrador"
                                    >
                                      <FiAlertCircle className="w-5 h-5" />
                                      <span className="hidden sm:inline">{t('misInformes.discard', 'Descartar')}</span>
                                    </button>
                                    <button 
                                      onClick={() => handleSubirBorrador(file.id_informe)}
                                      className="text-[#407754] hover:text-[#346244] hover:bg-green-50 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer"
                                      title="Subir borrador"
                                    >
                                      <FiUploadCloud className="w-5 h-5" />
                                      <span className="hidden sm:inline">{t('misInformes.upload', 'Subir')}</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Versions History Collapsible */}
                            <div className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-lg p-2.5">
                              <button 
                                onClick={() => toggleReportVersions(file.id_informe)}
                                className="w-full flex items-center justify-between text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                              >
                                <span>{t('periodoActual.versionHistory', 'Historial de Versiones')} ({versionsList.length})</span>
                                {isVersionsExpanded ? <FiChevronDown /> : <FiChevronRight />}
                              </button>

                              {isVersionsExpanded && (
                                <div className="mt-2.5 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-2.5">
                                  {versionsList.length > 0 ? (
                                    versionsList.map((ver, idx) => (
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
                                                    await verPdfVersion(ver.id_version);
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
                                          <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                                            <span>{ver.fecha}</span>
                                            {ver.observacion && <span className="text-red-500 font-medium">Motivo: {ver.observacion}</span>}
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-1 text-gray-400 text-xs font-medium">{t('periodoActual.noVersionsUploaded', 'Sin versiones cargadas')}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      } else {
                        // Placeholders to upload missing files in the current folder period
                        // currentPeriodName is now defined at component level — no ReferenceError
                        const isCurrentMonth = folder.id === currentPeriodName;
                        return (
                          <div key={type} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 opacity-75">
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
                                <FiAlertCircle className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('periodoActual.reportTypePrefix', 'Informe')} {type}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('periodoActual.status.notUploaded', 'No cargado')}</p>
                              </div>
                            </div>
                            {isCurrentMonth ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPeriod(folder.periodName);
                                  setSelectedType(type);
                                  setStep(3);
                                  setIsModalOpen(true);
                                }}
                                className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <FiUploadCloud className="w-4 h-4" /> {t('misInformes.uploadNow', 'Subir ahora')}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-semibold italic">{t('misInformes.archivedPeriod', 'Período Archivado')}</span>
                            )}
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 flex gap-4">
        <FiInfo className="w-6 h-6 text-blue-500 dark:text-blue-400 shrink-0" />
        <div>
          <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-1">{t('misInformes.infoTitle', 'Historial de Períodos')}</h4>
          <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed max-w-3xl">
            {t('misInformes.infoText', 'En esta sección puedes consultar el archivo histórico de todos tus informes entregados y validados. Para ver o actualizar las entregas del mes vigente, dirígete a la sección **Período Actual** en el menú.')}
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

              {/* Step 1: Period Selection */}
              {step === 1 && (
                <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">{t('periodoActual.step1Title', 'Paso 1 de 3 — Selección de período')}</label>
                    <select 
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#407754] focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm appearance-none"
                    >
                      <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{t('misInformes.choosePeriodOption', 'Elige un período...')}</option>
                      {Array.from(new Set([
                        ...(() => {
                          const list = [];
                          const now = new Date();
                          for (let i = 0; i < 6; i++) {
                            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                            list.push(`${MESES[d.getMonth()]} ${d.getFullYear()}`);
                          }
                          return list;
                        })(),
                        ...periods.map(p => p.periodName)
                      ])).map(pName => (
                        <option key={pName} value={pName} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{getTranslatedPeriodName(pName)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button onClick={resetModal} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">{t('common.cancel', 'Cancelar')}</button>
                    <button 
                      onClick={() => setStep(2)}
                      disabled={!selectedPeriod}
                      className="px-6 py-2 bg-[#407754] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-[#346244] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                      <span className="text-gray-500 dark:text-gray-400">{t('periodoActual.period', 'Período:')}</span> <strong className="text-gray-900 dark:text-gray-100">{selectedPeriod}</strong>
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
                    {t('periodoActual.uploadSuccessDescPrefix', 'El informe')} <strong>{selectedType}</strong> {t('periodoActual.uploadSuccessDescMiddle', 'se ha guardado como')} <span className="font-semibold text-amber-600 dark:text-amber-400">{t('periodoActual.status.draft', 'Borrador')}</span> {t('periodoActual.uploadSuccessDescSuffix', 'en el período de')} <strong>{selectedPeriod}</strong>.
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

      {/* Observation Modal */}
      {obsModalData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setObsModalData(null)}></div>
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className={`p-2 rounded-lg ${
                obsModalData.status === 'Rechazado' || obsModalData.status === 'Devuelto' ? 'bg-red-100 text-red-600' :
                obsModalData.status === 'Validado' || obsModalData.status === 'Aprobado' ? 'bg-emerald-100 text-emerald-600' :
                'bg-amber-100 text-amber-600'
              }`}>
                {obsModalData.status === 'Rechazado' || obsModalData.status === 'Devuelto' ? <FiAlertCircle className="w-5 h-5" /> : <FiInfo className="w-5 h-5" />}
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {t('misInformes.validadorObservation', 'Observación del Validador')}
              </h2>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 max-h-60 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {obsModalData.observation}
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setObsModalData(null)} 
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  {t('common.close', 'Cerrar')}
                </button>
                <button 
                  onClick={() => {
                    if (obsModalData.action === 'view') {
                      handleViewFile(obsModalData.id);
                    } else {
                      handleDownloadFile(obsModalData.id, obsModalData.filename);
                    }
                    setObsModalData(null);
                  }}
                  className="px-5 py-2 bg-[#407754] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-[#346244] transition-all"
                >
                  {t('misInformes.continueAndOpen', 'Continuar y ver informe')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
