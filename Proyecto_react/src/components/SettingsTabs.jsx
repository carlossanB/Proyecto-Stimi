import React, { useState } from 'react';
import { FiX, FiSave, FiLock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function SettingsTabs({ 
  title, 
  subtitle, 
  onSave, 
  onCancel, 
  saving = false,
  activeTab,
  setActiveTab,
  renderGeneralTab,
  renderFirmaTab,
  renderSistemaTab
}) {
  const { changePassword } = useAuth();
  const { t } = useTranslation();
  
  // Security change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const tabs = [
    { id: 'general', label: t('sidebar.general', 'General') },
    ...(renderFirmaTab ? [{ id: 'firma', label: t('sidebar.digitalSignature', 'Firma Digital') }] : []),
    { id: 'seguridad', label: t('configuracion.security', 'Seguridad') },
    { id: 'sistema', label: t('sidebar.system', 'Sistema') }
  ];

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('configuracion.alerts.passwordsMismatch', 'Las contraseñas nuevas no coinciden'));
      return;
    }
    
    setUpdatingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success(t('configuracion.alerts.passwordUpdated', 'Contraseña actualizada con éxito'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      toast.error(err.message || t('configuracion.alerts.passwordUpdateError', 'Error al actualizar la contraseña'));
    } finally {
      setUpdatingPassword(false);
    }
  };

  const renderSeguridadTabContent = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-[#407754] dark:text-emerald-400 rounded-xl">
              <FiLock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('configuracion.accountSecurity', 'Seguridad de la Cuenta')}</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('configuracion.accountSecurityDesc', 'Actualiza tu contraseña periódicamente')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-600 transition-all cursor-pointer"
          >
            {showPasswordForm ? (
              <>{t('configuracion.hide', 'Ocultar')} <FiChevronUp className="w-4.5 h-4.5 text-[#407754] dark:text-emerald-400" /></>
            ) : (
              <>{t('configuracion.changePassword', 'Cambiar contraseña')} <FiChevronDown className="w-4.5 h-4.5 text-[#407754] dark:text-emerald-400" /></>
            )}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md transition-all duration-300 animate-in slide-in-from-top-3">
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-200 font-medium">
              🔑 {t('configuracion.passwordHint', 'La contraseña debe tener al menos 8 caracteres e incluir letras y números.')}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('configuracion.currentPassword', 'Contraseña actual')}</label>
              <input
                required
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#407754] focus:bg-white dark:focus:bg-gray-700 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('configuracion.newPassword', 'Nueva contraseña')}</label>
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#407754] focus:bg-white dark:focus:bg-gray-700 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('configuracion.confirmPassword', 'Confirmar contraseña')}</label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#407754] focus:bg-white dark:focus:bg-gray-700 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="w-full mt-2 py-2.5 bg-[#407754] hover:bg-[#335f43] text-white text-xs font-bold rounded-xl transition-all hover:shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <FiLock className="w-4 h-4" /> 
              {updatingPassword ? t('configuracion.updating', 'Actualizando...') : t('configuracion.updatePassword', 'Actualizar contraseña')}
            </button>
          </form>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-[#407754] dark:text-emerald-400">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>
      </div>

      {/* Segmented Control Selector Tabs */}
      <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl flex flex-wrap md:inline-flex gap-1 shadow-inner border border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 md:flex-initial text-center px-6 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer ${
                isActive 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {activeTab === 'general' && renderGeneralTab && renderGeneralTab()}
        {activeTab === 'firma' && renderFirmaTab && renderFirmaTab()}
        {activeTab === 'seguridad' && renderSeguridadTabContent()}
        {activeTab === 'sistema' && renderSistemaTab && renderSistemaTab()}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <FiX className="w-4.5 h-4.5" /> {t('common.cancel', 'Cancelar')}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[#407754] hover:bg-[#335f43] text-white text-xs font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
        >
          <FiSave className="w-4.5 h-4.5" /> 
          {saving ? t('common.saving', 'Guardando...') : t('configuracion.saveSettings', 'Guardar configuración')}
        </button>
      </div>
    </div>
  );
}

