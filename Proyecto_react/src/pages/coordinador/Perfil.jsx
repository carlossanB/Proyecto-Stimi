import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiCreditCard, FiHash, FiBriefcase, FiMapPin, FiLock, FiEdit2, FiSave, FiX, FiUploadCloud } from 'react-icons/fi';
import { toast } from 'sonner';
import api from '../../services/api';
import PageContainer from '../../components/PageContainer';
import { useTranslation } from 'react-i18next';

/** Placeholder de iniciales para usuarios sin foto */
const AvatarPlaceholder = ({ nombre, size = 'sm' }) => {
  const initials = (nombre || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const sizeClass = size === 'sm' ? 'w-10 h-10 text-sm' : 'w-20 h-20 text-2xl';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-sena-green to-emerald-400 flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
};

/** Modal Lightbox para ampliar la foto de perfil */
const FotoModal = ({ url, nombre, onClose }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (url) {
      console.log('[DEBUG] Ampliando foto de perfil URL:', url);
    }
  }, [url]);

  if (!url) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl max-h-[85vh] bg-gray-900 rounded-3xl p-4 shadow-2xl overflow-hidden flex flex-col items-center border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all cursor-pointer border border-white/20"
          title="Cerrar"
        >
          <FiX className="w-5 h-5" />
        </button>

        {hasError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-300 min-w-[280px]">
            <AvatarPlaceholder nombre={nombre} size="lg" />
            <p className="mt-4 text-sm font-semibold text-gray-300">No se pudo cargar la imagen</p>
            <span className="text-xs text-gray-500 mt-1 break-all max-w-xs">{url}</span>
          </div>
        ) : (
          <img 
            src={url} 
            alt={nombre ? `Foto de ${nombre}` : 'Foto de perfil ampliada'} 
            className="max-w-[85vw] max-h-[75vh] object-contain rounded-2xl shadow-md"
            onError={() => {
              console.error('[DEBUG] Error al cargar la foto de perfil en el modal:', url);
              setHasError(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default function PerfilCoordinador() {
  const { user, updateLocalUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [modalFoto, setModalFoto] = useState(null); // { url, nombre }

  // Form fields state initialized from current authenticated user
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [regional, setRegional] = useState('');
  const [sedeCentro, setSedeCentro] = useState('');

  const getFotoUrl = (path) => {
    if (!path || typeof path !== 'string') return null;
    const trimmed = path.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

    let baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').trim();
    baseUrl = baseUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '');

    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      toast.error('Por favor, cargue una imagen válida (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('El tamaño de la foto excede el límite de 2 MB');
      return;
    }

    const formData = new FormData();
    formData.append('foto', file);

    setUploadingPhoto(true);
    const toastId = toast.loading('Subiendo foto de perfil...');

    try {
      const response = await api.post('/personas/me/foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const photoPath = response.data.foto_perfil_ruta;
      updateLocalUser({ foto_perfil_ruta: photoPath });
      toast.success('¡Foto de perfil actualizada correctamente!', { id: toastId });
    } catch (err) {
      console.error('Error al subir foto:', err);
      const errMsg = err.response?.data?.message || 'Error al conectar con el servidor';
      toast.error(`No se pudo subir la foto: ${errMsg}`, { id: toastId });
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true);
    const toastId = toast.loading('Eliminando foto de perfil...');
    try {
      await api.delete('/personas/me/foto');
      updateLocalUser({ foto_perfil_ruta: null });
      toast.success('Foto de perfil eliminada', { id: toastId });
    } catch (err) {
      console.error('Error al eliminar foto:', err);
      toast.error('No se pudo eliminar la foto de perfil', { id: toastId });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Sync state from authenticated user or state editMode
  useEffect(() => {
    if (user) {
      setNombreCompleto(user.nombreCompleto || '');
      setEmail(user.email || user.correo || '');
      setTipoDocumento(user.tipo_documento || 'CC');
      setNumeroDocumento(user.documento || user.numero_documento || '');
      setRegional(user.regional || '');
      setSedeCentro(user.sede_centro || user.sedeCentro || '');
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.editMode) {
      setIsEditing(true);
    }
  }, [location.state]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nombreCompleto.trim()) {
      toast.error(t('perfil.alerts.nameRequired', 'El nombre completo es requerido'));
      return;
    }
    if (!email.trim()) {
      toast.error(t('perfil.alerts.emailRequired', 'El correo electrónico es requerido'));
      return;
    }

    setSaving(true);
    const toastId = toast.loading(t('perfil.alerts.updatingProfile', 'Actualizando datos de perfil...'));

    try {
      const payload = {
        nombreCompleto: nombreCompleto.trim(),
        email: email.trim(),
        tipoDocumento,
        numeroDocumento: numeroDocumento.trim(),
        regional: regional.trim(),
        sedeCentro: sedeCentro.trim(),
      };

      await api.patch(`/personas/${user.id_usuario}`, payload);

      updateLocalUser({
        nombreCompleto: payload.nombreCompleto,
        email: payload.email,
        correo: payload.email,
        tipo_documento: payload.tipoDocumento,
        documento: payload.numeroDocumento,
        numero_documento: payload.numeroDocumento,
        regional: payload.regional,
        sede_centro: payload.sedeCentro,
        sedeCentro: payload.sedeCentro,
      });

      toast.success(t('perfil.alerts.profileSuccess', '¡Perfil actualizado exitosamente!'), { id: toastId });
      setIsEditing(false);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      const msg = err.response?.data?.message || t('perfil.alerts.profileError', 'No se pudo actualizar el perfil');
      toast.error(msg, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setNombreCompleto(user.nombreCompleto || '');
      setEmail(user.email || user.correo || '');
      setTipoDocumento(user.tipo_documento || 'CC');
      setNumeroDocumento(user.documento || user.numero_documento || '');
      setRegional(user.regional || '');
      setSedeCentro(user.sede_centro || user.sedeCentro || '');
    }
    setIsEditing(false);
  };

  const getTipoDocumentoLargo = (tipo = 'CC') => {
    const map = {
      CC: t('perfil.docTypeCC', 'Cédula de Ciudadanía'),
      CE: t('perfil.docTypeCE', 'Cédula de Extranjería'),
      TI: t('perfil.docTypeTI', 'Tarjeta de Identidad'),
    };
    return map[tipo] || tipo;
  };

  const displayNombre = user?.nombreCompleto || '—';

  return (
    <PageContainer maxWidth="max-w-5xl">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{t('perfil.title', 'Mi Perfil')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('perfil.coordinadorSubtitle', 'Información personal y profesional de la cuenta')}</p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#407754] hover:bg-[#335f43] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <FiEdit2 className="w-4 h-4" />
            {t('perfil.editProfile', 'Editar Perfil')}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
               <FiX className="w-4 h-4" /> {t('common.cancel', 'Cancelar')}
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#407754] hover:bg-[#335f43] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        
        {/* Left Column (Avatar & Quick Info) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 shadow-sm flex flex-col items-center text-center">
            <div 
              onClick={() => user?.foto_perfil_ruta && setModalFoto({ url: getFotoUrl(user.foto_perfil_ruta), nombre: displayNombre })}
              className={`w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-full border-4 border-white dark:border-gray-800 shadow-md flex items-center justify-center mb-4 text-[#407754] dark:text-emerald-400 relative overflow-hidden ${
                user?.foto_perfil_ruta ? 'cursor-pointer hover:opacity-90 hover:scale-105 transition-all' : ''
              }`}
              title={user?.foto_perfil_ruta ? 'Ver foto de perfil' : ''}
            >
              {user?.foto_perfil_ruta ? (
                <img
                  src={getFotoUrl(user.foto_perfil_ruta)}
                  alt="Foto de perfil"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="w-16 h-16" />
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayNombre}</h2>
            <span className="mt-2 bg-green-100 text-green-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
              {user?.rol === 'Coordinador' ? t('common.coordinadorRole', 'Coordinador') : user?.rol === 'Instructor' ? t('common.instructorRole', 'Instructor') : user?.rol || t('common.coordinadorRole', 'Coordinador')}
            </span>

            {/* Foto de Perfil Controls - Solo visibles en Modo Edición */}
            {isEditing && (
              <div className="mt-5 w-full flex flex-col items-center gap-2 animate-fade-in">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  id="foto-upload-input-coord"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                />
                <div className="flex gap-2 w-full">
                  <label
                    htmlFor="foto-upload-input-coord"
                    className={`flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-xs ${
                      uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <FiUploadCloud className="w-4 h-4" />
                    {uploadingPhoto ? 'Subiendo...' : (user?.foto_perfil_ruta ? 'Cambiar Foto' : 'Subir Foto')}
                  </label>

                  {user?.foto_perfil_ruta && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center"
                      title="Eliminar foto de perfil"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FiLock className="text-gray-400 dark:text-gray-500" /> {t('configuracion.security', 'Seguridad')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('perfil.securityDesc', 'Puede cambiar su contraseña de acceso institucional cuando lo requiera.')}</p>
            <button 
              onClick={() => navigate('/coordinador/configuracion', { state: { tab: 'seguridad' } })}
              className="w-full py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-sm rounded-xl border border-gray-200 dark:border-gray-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiLock className="w-4 h-4" />
              {t('perfil.changePassword', 'Cambiar Contraseña')}
            </button>
          </div>
        </div>

        {/* Right Column (Details / Edit Form) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Información Personal */}
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('perfil.personalInfo', 'Información Personal')}</h3>
              {isEditing && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase">
                  {t('perfil.editModeActive', 'Modo Edición Activo')}
                </span>
              )}
            </div>

            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Nombre Completo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('perfil.fullName', 'Nombre Completo')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#407754] focus:bg-white dark:focus:bg-gray-800"
                  />
                ) : (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <FiUser className="text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{displayNombre}</span>
                  </div>
                )}
              </div>

              {/* Correo Electrónico */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('perfil.email', 'Correo Electrónico')}</label>
                {isEditing ? (
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#407754] focus:bg-white dark:focus:bg-gray-800"
                  />
                ) : (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <FiMail className="text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{email || '—'}</span>
                  </div>
                )}
              </div>

              {/* Tipo de Documento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('perfil.docType', 'Tipo de Documento')}</label>
                {isEditing ? (
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#407754] focus:bg-white dark:focus:bg-gray-800 cursor-pointer"
                  >
                    <option value="CC">{t('registro.docTypeCC', 'Cédula de Ciudadanía (CC)')}</option>
                    <option value="CE">{t('registro.docTypeCE', 'Cédula de Extranjería (CE)')}</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <FiCreditCard className="text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{getTipoDocumentoLargo(tipoDocumento)}</span>
                  </div>
                )}
              </div>

              {/* Número de Documento */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('perfil.docNumber', 'Número de Documento')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#407754] focus:bg-white dark:focus:bg-gray-800"
                  />
                ) : (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <FiHash className="text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{numeroDocumento || '—'}</span>
                  </div>
                )}
              </div>
              
            </div>

            {isEditing && (
              <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#407754] hover:bg-[#335f43] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? t('common.saving', 'Guardando...') : t('perfil.saveChanges', 'Guardar Cambios')}
                </button>
              </div>
            )}
          </form>

          {/* Información Profesional */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('perfil.professionalInfo', 'Información Profesional')}</h3>
            </div>
            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('perfil.centerSede', 'Centro / Sede')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={sedeCentro}
                    onChange={(e) => setSedeCentro(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#407754] focus:bg-white dark:focus:bg-gray-800"
                  />
                ) : (
                  <div className="flex flex-col justify-center bg-gray-50 dark:bg-gray-700/30 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 min-h-[46px]">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                      {sedeCentro || t('common.coordinacionCentro', 'Centro de Servicios y Gestión Empresarial')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.regional', 'Regional')}</label>
                {isEditing ? (
                  <div className="relative">
                    <FiMapPin className="text-gray-400 dark:text-gray-500 absolute left-4 top-3.5 shrink-0" />
                    <input
                      type="text"
                      value={regional}
                      onChange={(e) => setRegional(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#407754] focus:bg-white dark:focus:bg-gray-800"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/30 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <FiMapPin className="text-gray-400 dark:text-gray-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {regional || t('common.coordinacionRegional', 'Regional Antioquia')}
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <FotoModal 
        url={modalFoto?.url} 
        nombre={modalFoto?.nombre} 
        onClose={() => setModalFoto(null)} 
      />
    </PageContainer>
  );
}
