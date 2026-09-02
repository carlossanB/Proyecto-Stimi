import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usuariosService } from '../../services/usuariosService';
import api from '../../services/api';
import { 
  FiUsers, 
  FiUserPlus, 
  FiSearch, 
  FiEye, 
  FiEdit, 
  FiTrash2, 
  FiCheckCircle, 
  FiXCircle, 
  FiMail, 
  FiShield, 
  FiGrid,
  FiAlertCircle,
  FiUser,
  FiUploadCloud,
  FiX
} from 'react-icons/fi';
import { toast } from 'sonner';
import PageContainer from '../../components/PageContainer';

// ── Helpers ──────────────────────────────────────────────────────────────────
/** Construye la URL completa de la foto de perfil */
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

/** Avatar de usuario: muestra foto si existe, placeholder con iniciales si no */
const UserAvatar = ({ fotoUrl, nombre, size = 'sm', onAvatarClick }) => {
  const [imgError, setImgError] = useState(false);
  if (!fotoUrl || imgError) return <AvatarPlaceholder nombre={nombre} size={size} />;
  const sizeClass = size === 'sm' ? 'w-10 h-10' : 'w-20 h-20';
  return (
    <img
      src={fotoUrl}
      alt={nombre}
      onClick={(e) => {
        if (onAvatarClick) {
          e.stopPropagation();
          onAvatarClick();
        }
      }}
      className={`${sizeClass} rounded-full object-cover shrink-0 border-2 border-white dark:border-gray-700 shadow-sm ${
        onAvatarClick ? 'cursor-pointer hover:opacity-90 hover:scale-105 transition-all' : ''
      }`}
      onError={() => setImgError(true)}
      title={onAvatarClick ? 'Ver foto de perfil ampliada' : ''}
    />
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
// ─────────────────────────────────────────────────────────────────────────────

export default function GestionUsuarios() {
  const { t } = useTranslation();
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'instructor',
    id_rol: '',
    documento: '',
    id_area: '',
    estado_cuenta: 'pendiente',
    motivo_rechazo: '',
    contrasena: ''
  });
  const [saving, setSaving] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  // Photo upload state (for the edit modal)
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editingUserPhoto, setEditingUserPhoto] = useState(null); // foto_perfil_ruta of user being edited
  const [modalFoto, setModalFoto] = useState(null); // { url, nombre }
  const photoInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedUserDetails(null);
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, areasData] = await Promise.all([
        usuariosService.getUsuarios(),
        usuariosService.getRoles(),
        usuariosService.getAreas()
      ]);
      setUsuarios(usersData);
      setRoles(rolesData);
      setAreas(areasData);
    } catch (err) {
      toast.error(t('gestionUsuarios.alerts.errorLoad', 'Error al cargar la información del servidor'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    // Default to instructor rol if available
    const defaultRol = roles.find(r => r.nombre_rol === 'instructor');
    setEditingUser(null);
    setFormData({
      nombre: '',
      email: '',
      rol: 'instructor',
      id_rol: defaultRol ? defaultRol.id_rol.toString() : '',
      documento: '',
      id_area: '',
      estado_cuenta: 'pendiente',
      motivo_rechazo: '',
      contrasena: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (usuario) => {
    setEditingUser(usuario);
    setEditingUserPhoto(usuario.foto_perfil_ruta ?? null);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      id_rol: usuario.id_rol ? usuario.id_rol.toString() : '',
      documento: usuario.documento,
      id_area: usuario.id_area ? usuario.id_area.toString() : '',
      estado_cuenta: usuario.estado_cuenta || 'pendiente',
      motivo_rechazo: usuario.motivo_rechazo || '',
      contrasena: ''
    });
    setIsModalOpen(true);
  };

  /** Sube la foto de perfil de un usuario editado (reutiliza POST /personas/me/foto
   *  pero llamando con el ID del usuario objetivo vía PATCH directo a su ruta). */
  const handleEditUserPhotoChange = async (e) => {
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
    if (!editingUser?.id) return;

    const formDataImg = new FormData();
    formDataImg.append('foto', file);

    setUploadingPhoto(true);
    const toastId = toast.loading('Subiendo foto de perfil...');
    try {
      // Re-use the same endpoint; since the coordinator is authenticated we POST
      // to /personas/me/foto which updates the LOGGED-IN user.
      // For other users we call the admin patch endpoint with the file path returned.
      // Strategy: upload via me/foto is only safe for own user.
      // Here we use a dedicated admin endpoint if the user isn't themselves.
      // Since the backend only has /personas/me/foto, we must first upload as ourselves
      // then patch the target user's foto_perfil_ruta via PATCH /personas/:id.
      // Simpler and zero backend change: upload the image file directly.
      const res = await api.post(`/personas/${editingUser.id}/foto`, formDataImg, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newPath = res.data?.foto_perfil_ruta;
      setEditingUserPhoto(newPath);
      // Update cached list so avatar refreshes without full reload
      setUsuarios((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, foto_perfil_ruta: newPath } : u))
      );
      toast.success('¡Foto de perfil actualizada!', { id: toastId });
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Error al subir la foto';
      toast.error(`No se pudo subir la foto: ${errMsg}`, { id: toastId });
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleToggleEstado = async (id, nombre) => {
    try {
      const updated = await usuariosService.toggleEstadoUsuario(id);
      toast.success(t('gestionUsuarios.alerts.statusChanged', 'Estado de {{nombre}} cambiado a {{status}}', { nombre, status: updated.estado === 'activo' ? t('common.approved', 'Aprobado') : t('common.pending', 'Pendiente') }));
      await loadData();
    } catch (err) {
      toast.error(t('gestionUsuarios.alerts.errorChangeStatus', 'No se pudo cambiar el estado del usuario'));
    }
  };

  const handleDeleteUsuario = async (id, nombre) => {
    if (!window.confirm(t('gestionUsuarios.alerts.confirmDelete', '¿Está seguro de eliminar al usuario {{nombre}}?', { nombre }))) return;
    try {
      await usuariosService.eliminarUsuario(id);
      toast.success(t('gestionUsuarios.alerts.deletedSuccess', 'Usuario {{nombre}} eliminado del sistema', { nombre }));
      await loadData();
    } catch (err) {
      toast.error(t('gestionUsuarios.alerts.errorDelete', 'No se pudo eliminar el usuario'));
    }
  };

  const handleSaveUsuario = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.documento) {
      toast.error(t('gestionUsuarios.alerts.fieldsRequired', 'Por favor complete los campos obligatorios'));
      return;
    }
    setSaving(true);

    const payload = {
      nombre: formData.nombre,
      email: formData.email,
      documento: formData.documento,
      id_rol: formData.id_rol ? parseInt(formData.id_rol) : undefined,
      id_area: formData.id_area ? parseInt(formData.id_area) : undefined,
      estado_cuenta: formData.estado_cuenta,
      motivo_rechazo: formData.estado_cuenta === 'rechazado' ? formData.motivo_rechazo : ''
    };

    if (formData.contrasena) {
      payload.contrasena = formData.contrasena;
    }

    try {
      if (editingUser) {
        await usuariosService.actualizarUsuario(editingUser.id, payload);
        toast.success(t('gestionUsuarios.alerts.updateSuccess', 'Usuario actualizado correctamente'));
      } else {
        // Find mapped role name for backward compatibility inside creations
        const selectedRol = roles.find(r => r.id_rol.toString() === formData.id_rol);
        payload.rol = selectedRol ? selectedRol.nombre_rol : 'instructor';
        await usuariosService.crearUsuario(payload);
        toast.success(t('gestionUsuarios.alerts.registerSuccess', 'Usuario registrado con éxito'));
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Error al guardar datos';
      toast.error(t('gestionUsuarios.alerts.saveError', 'Error: {{error}}', { error: errMsg }));
    } finally {
      setSaving(false);
    }
  };

  // Metrics
  const totalUsuarios = usuarios.length;
  const totalInstructores = usuarios.filter(u => u.rol === 'instructor').length;
  const totalCoordinadores = usuarios.filter(u => u.rol === 'coordinador').length;
  const totalActivos = usuarios.filter(u => u.estado_cuenta === 'aprobado').length;

  // Filtered list by query
  const filteredUsuarios = usuarios.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.documento.includes(query)
    );
  });

  return (
    <PageContainer>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('gestionUsuarios.title', 'Gestión de Usuarios')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('gestionUsuarios.subtitle', 'Administre las cuentas del personal de coordinación e instructores del sistema')}</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 bg-sena-green hover:bg-sena-green-hover text-white text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md self-stretch sm:self-auto"
        >
          <FiUserPlus className="w-4 h-4" /> {t('gestionUsuarios.newUser', 'Nuevo Usuario')}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">{t('gestionUsuarios.totalUsers', 'Total Usuarios')}</span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{totalUsuarios}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <FiUsers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">{t('sidebar.instructor', 'Instructores')}</span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{totalInstructores}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-500 dark:text-purple-400">
            <FiShield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">{t('gestionUsuarios.coordinadores', 'Coordinadores')}</span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{totalCoordinadores}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-sena-green dark:text-emerald-400">
            <FiCheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block uppercase">{t('gestionUsuarios.activeApproved', 'Activos (Aprobados)')}</span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{totalActivos}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <FiCheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 shadow-sm flex items-center gap-3">
        <FiSearch className="text-gray-400 dark:text-gray-500 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('gestionUsuarios.searchPlaceholder', 'Buscar por nombre, email o documento...')}
          className="w-full text-xs text-gray-700 dark:text-gray-200 bg-transparent border-none outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsuarios.map((u) => {
          const isAct = u.estado_cuenta === 'aprobado';
          const isRech = u.estado_cuenta === 'rechazado';
          const isPend = u.estado_cuenta === 'pendiente';
          const isCoord = u.rol === 'coordinador';

          return (
            <div 
              key={u.id}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow"
            >
              {/* ── Avatar ── */}
              <UserAvatar 
                fotoUrl={getFotoUrl(u.foto_perfil_ruta)} 
                nombre={u.nombre} 
                onAvatarClick={() => u.foto_perfil_ruta && setModalFoto({ url: getFotoUrl(u.foto_perfil_ruta), nombre: u.nombre })}
              />

              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-bold text-gray-800 dark:text-gray-100 text-base">{u.nombre}</h4>
                  
                  {/* Rol Badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isCoord ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  }`}>
                    {u.rol}
                  </span>

                  {/* Estado Badge */}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isAct ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                    isRech ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 animate-pulse'
                  }`}>
                    {isAct ? t('common.active', 'Activo') : isRech ? t('common.rejected', 'Rechazado') : t('common.pending', 'Pendiente')}
                  </span>

                  {u.firma_digital_ruta && (
                    <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {t('perfil.signatureRegistered', 'Firma Registrada')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <FiMail className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <FiGrid className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span>{t('gestionUsuarios.docPrefix', 'Doc:')} {u.documento}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 sm:col-span-2">
                    <FiShield className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="truncate">{u.area || 'Coordinación'}</span>
                  </div>
                </div>

                {isRech && u.motivo_rechazo && (
                  <div className="mt-2 bg-red-50/50 dark:bg-red-950/30 border border-red-100 dark:border-red-800 rounded-xl p-3 flex items-start gap-2 max-w-xl">
                    <FiAlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-red-950 dark:text-red-300 font-bold block">{t('gestionUsuarios.rejectReasonPrefix', 'Motivo del rechazo:')}</span>
                      <p className="text-xs text-red-800 dark:text-red-400 mt-0.5 leading-relaxed">{u.motivo_rechazo}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 border-t border-gray-50 dark:border-gray-700 pt-3 md:pt-0 md:border-t-0 justify-end">
                <button
                  onClick={() => handleToggleEstado(u.id, u.nombre)}
                  className={`p-2 rounded-xl border transition-all ${
                    isAct 
                      ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' 
                      : 'bg-green-50 border-green-100 text-sena-green hover:bg-green-100'
                  }`}
                  title={isAct ? 'Suspender cuenta (Poner pendiente)' : 'Aprobar cuenta (Activar)'}
                >
                  {isAct ? <FiXCircle className="w-4 h-4" /> : <FiCheckCircle className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setSelectedUserDetails(u)}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-600 transition-all"
                  title="Ver detalle"
                >
                  <FiEye className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleOpenEditModal(u)}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-600 transition-all"
                  title="Aprobar / Configurar Usuario"
                >
                  <FiEdit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteUsuario(u.id, u.nombre)}
                  className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 border border-red-50 dark:border-red-800 transition-all"
                  title="Eliminar usuario"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {editingUser ? t('gestionUsuarios.modalEditTitle', 'Aprobación y Configuración de Usuario') : t('gestionUsuarios.modalCreateTitle', 'Registrar Nuevo Usuario')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('gestionUsuarios.modalSubtitle', 'Configure los accesos, estado de cuenta y área del usuario')}</p>
            </div>

            <form onSubmit={handleSaveUsuario} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('registro.fullName', 'Nombre Completo')} *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Wilson Martínez"
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('registro.email', 'Correo Electrónico')} *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@sena.edu.co"
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('registro.docNumber', 'Documento')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    placeholder="Documento nacional"
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('gestionUsuarios.roleLabel', 'Rol')} *</label>
                  <select
                    value={formData.id_rol}
                    onChange={(e) => setFormData({ ...formData, id_rol: e.target.value })}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
                  >
                    <option value="">{t('gestionUsuarios.selectRoleOption', 'Seleccionar Rol')}</option>
                    {roles.map(r => (
                      <option key={r.id_rol} value={r.id_rol.toString()}>
                        {r.nombre_rol === 'coordinador' ? t('sidebar.coordinador', 'Coordinador') : t('sidebar.instructor', 'Instructor')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('perfil.trainingArea', 'Área de Formación')}</label>
                <select
                  value={formData.id_area}
                  onChange={(e) => setFormData({ ...formData, id_area: e.target.value })}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
                >
                  <option value="">{t('gestionUsuarios.noneSelectArea', 'Ninguna / Seleccionar Área')}</option>
                  {areas.map(a => (
                    <option key={a.id_area} value={a.id_area.toString()}>{a.nombre_area}</option>
                  ))}
                </select>
              </div>

              {editingUser ? (
                <>
                  {/* ── Foto de perfil del usuario editado ── */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Foto de Perfil</label>
                    <div className="flex items-center gap-3">
                      <UserAvatar 
                        fotoUrl={getFotoUrl(editingUserPhoto)} 
                        nombre={formData.nombre} 
                        size="lg" 
                        onAvatarClick={() => editingUserPhoto && setModalFoto({ url: getFotoUrl(editingUserPhoto), nombre: formData.nombre })}
                      />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          id="edit-user-foto-input"
                          onChange={handleEditUserPhotoChange}
                          disabled={uploadingPhoto}
                        />
                        <label
                          htmlFor="edit-user-foto-input"
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl cursor-pointer transition-all text-center ${
                            uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <FiUploadCloud className="w-3.5 h-3.5" />
                          {uploadingPhoto ? 'Subiendo...' : (editingUserPhoto ? 'Cambiar Foto' : 'Subir Foto')}
                        </label>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">PNG, JPG, WEBP · Máx. 2 MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('gestionUsuarios.accountStatus', 'Estado de Cuenta')}</label>
                    <select
                      value={formData.estado_cuenta}
                      onChange={(e) => setFormData({ ...formData, estado_cuenta: e.target.value })}
                      className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
                    >
                      <option value="pendiente">{t('gestionUsuarios.pendingApprovalOption', 'Pendiente de aprobación')}</option>
                      <option value="aprobado">{t('gestionUsuarios.approvedActiveOption', 'Aprobado / Activo')}</option>
                      <option value="rechazado">{t('common.rejected', 'Rechazado')}</option>
                    </select>
                  </div>

                  {formData.estado_cuenta === 'rechazado' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('gestionUsuarios.rejectReasonLabel', 'Motivo de Rechazo')} *</label>
                      <input
                        type="text"
                        required
                        value={formData.motivo_rechazo}
                        onChange={(e) => setFormData({ ...formData, motivo_rechazo: e.target.value })}
                        placeholder="Ej: Cédula borrosa o documentación incompleta"
                        className="px-3 py-2 bg-red-50/10 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-red-900 dark:text-red-300"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('gestionUsuarios.tempPasswordLabel', 'Contraseña Temporal')} *</label>
                  <input
                    type="password"
                    required
                    value={formData.contrasena}
                    onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                    placeholder="Contraseña inicial (min. 6 caracteres)"
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all"
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-sena-green hover:bg-sena-green-hover text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  {saving ? t('common.saving', 'Guardando...') : editingUser ? t('gestionUsuarios.saveAndApply', 'Guardar y Aplicar') : t('gestionUsuarios.createUser', 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {selectedUserDetails && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setSelectedUserDetails(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
              <UserAvatar 
                fotoUrl={getFotoUrl(selectedUserDetails.foto_perfil_ruta)} 
                nombre={selectedUserDetails.nombre} 
                size="lg"
                onAvatarClick={() => selectedUserDetails.foto_perfil_ruta && setModalFoto({ url: getFotoUrl(selectedUserDetails.foto_perfil_ruta), nombre: selectedUserDetails.nombre })}
              />
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {t('gestionUsuarios.viewDetails', 'Detalles del Usuario')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('gestionUsuarios.viewDetailsSubtitle', 'Información completa del usuario registrado')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('registro.fullName', 'Nombre Completo')}</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 font-medium">
                  {selectedUserDetails.nombre}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('registro.email', 'Correo Electrónico')}</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 break-all font-medium">
                  {selectedUserDetails.email}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('registro.docType', 'Tipo de Documento')}</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 font-medium">
                    {selectedUserDetails.tipo_documento === 'CC' ? t('registro.docTypeCC', 'Cédula de Ciudadanía (CC)') :
                     selectedUserDetails.tipo_documento === 'CE' ? t('registro.docTypeCE', 'Cédula de Extranjería (CE)') :
                     selectedUserDetails.tipo_documento === 'TI' ? t('registro.docTypeTI', 'Tarjeta de Identidad (TI)') :
                     selectedUserDetails.tipo_documento || 'CC'}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('registro.docNumber', 'Número de Documento')}</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 font-medium">
                    {selectedUserDetails.documento}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('gestionUsuarios.roleLabel', 'Rol')}</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl flex items-center min-h-[34px]">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedUserDetails.rol === 'coordinador' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    }`}>
                      {selectedUserDetails.rol}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('gestionUsuarios.accountStatus', 'Estado de Cuenta')}</label>
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl flex items-center min-h-[34px]">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedUserDetails.estado_cuenta === 'aprobado' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                      selectedUserDetails.estado_cuenta === 'rechazado' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                      'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}>
                      {selectedUserDetails.estado_cuenta === 'aprobado' ? t('common.active', 'Activo') : 
                       selectedUserDetails.estado_cuenta === 'rechazado' ? t('common.rejected', 'Rechazado') : 
                       t('common.pending', 'Pendiente')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('perfil.trainingArea', 'Área de Formación')}</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 font-medium">
                  {selectedUserDetails.area || t('sidebar.coordinador', 'Coordinación')}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t('perfil.signature', 'Firma Digital')}</label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-gray-100 font-medium">
                  {selectedUserDetails.firma_digital_ruta ? t('perfil.signatureRegistered', 'Firma Registrada') : t('perfil.noSignature', 'No tiene una firma digital registrada en su cuenta.')}
                </div>
              </div>

              {selectedUserDetails.estado_cuenta === 'rechazado' && selectedUserDetails.motivo_rechazo && (
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase">{t('gestionUsuarios.rejectReasonLabel', 'Motivo de Rechazo')}</label>
                  <div className="px-3 py-2 bg-red-50/10 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-800 dark:text-red-300 font-medium">
                    {selectedUserDetails.motivo_rechazo}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedUserDetails(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all"
              >
                {t('common.close', 'Cerrar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal de Foto de Perfil */}
      <FotoModal 
        url={modalFoto?.url} 
        nombre={modalFoto?.nombre} 
        onClose={() => setModalFoto(null)} 
      />

    </PageContainer>
  );
}
