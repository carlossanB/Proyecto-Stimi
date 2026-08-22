import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FiArrowLeft, FiLock, FiMail, FiKey } from 'react-icons/fi';
import fondoCampus from '../assets/Fondo.jpg.jpeg';
import logoSena from '../assets/logo-sena.png';
import api from '../services/api';
import axios from 'axios';

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Step 1: send email. Step 2: enter token + new password
  const [step, setStep] = useState(1);

  // Step 1 state
  const [email, setEmail] = useState('');
  const [loadingForgot, setLoadingForgot] = useState(false);
  const [errorForgot, setErrorForgot] = useState('');

  // Step 2 state
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingReset, setLoadingReset] = useState(false);
  const [errorReset, setErrorReset] = useState('');

  const handleForgot = async (e) => {
    e.preventDefault();
    setErrorForgot('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrorForgot('El correo electrónico es obligatorio');
      return;
    } else if (!emailRegex.test(email)) {
      setErrorForgot('Formato de correo electrónico no válido');
      return;
    }

    setLoadingForgot(true);
    const toastId = toast.loading('Procesando solicitud...');

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Solicitud procesada. Ingresa el token de recuperación.', { id: toastId });

      setStep(2);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response
        ? err.response.data?.message || 'Error al procesar la solicitud'
        : 'No se pudo conectar con el servidor';
      setErrorForgot(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoadingForgot(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorReset('');

    if (!token) {
      setErrorReset('El token de recuperación es obligatorio');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorReset('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorReset('Las contraseñas no coinciden');
      return;
    }

    setLoadingReset(true);
    const toastId = toast.loading('Restableciendo contraseña...');

    try {
      await api.post('/auth/reset-password', { token: token.trim(), newPassword });
      toast.success('¡Contraseña restablecida correctamente! Ya puedes iniciar sesión.', { id: toastId });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = axios.isAxiosError(err) && err.response
        ? err.response.data?.message || 'Error al restablecer la contraseña'
        : 'No se pudo conectar con el servidor';
      setErrorReset(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center relative transition-all duration-500"
      style={{ 
        backgroundImage: `url(${fondoCampus})`,
        backgroundColor: '#0a0f0d'
      }}
    >
      <div className="absolute inset-0 bg-black/25 z-0"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center transition-all duration-350">
        
        {/* SENA Logo */}
        <div className="flex justify-center mb-6">
          <img src={logoSena} alt="Logo SENA" className="w-20 h-20 object-contain mx-auto" />
        </div>

        {step === 1 ? (
          <>
            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
              {t('recuperar.title', 'Recuperar Contraseña')}
            </h2>
            <p className="text-gray-200 text-sm mb-6 max-w-xs mx-auto font-medium">
              {t('recuperar.subtitle', 'Ingresa tu correo institucional y te enviaremos las instrucciones para restablecer tu contraseña.')}
            </p>

            <form onSubmit={handleForgot} className="space-y-5 text-left" noValidate>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white block">
                  {t('registro.email', 'Correo Electrónico')}
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    placeholder="ejemplo@sena.edu.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loadingForgot}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border ${
                      errorForgot 
                        ? 'border-red-500 focus:ring-red-500/30' 
                        : 'border-white/20 focus:border-[#407754] focus:ring-[#407754]/30'
                    } focus:outline-none focus:ring-4 transition-all duration-200 text-sm`}
                  />
                </div>
                {errorForgot && (
                  <p className="text-xs font-medium text-red-400 pt-1">{errorForgot}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loadingForgot}
                className="w-full py-3 px-4 bg-[#4CAF50] hover:bg-[#43A047] disabled:bg-gray-700 text-white rounded-2xl font-bold text-sm shadow-lg transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                {loadingForgot ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t('registro.processing', 'Procesando...')}</span>
                  </>
                ) : (
                  <span>{t('recuperar.sendInstructions', 'Enviar Instrucciones')}</span>
                )}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
              {t('recuperar.newPasswordTitle', 'Nueva Contraseña')}
            </h2>
            <p className="text-gray-200 text-sm mb-6 max-w-xs mx-auto font-medium">
              {t('recuperar.newPasswordSubtitle', 'Ingresa el token recibido y tu nueva contraseña.')}
            </p>

            <form onSubmit={handleReset} className="space-y-4 text-left" noValidate>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white block">{t('recuperar.tokenLabel', 'Token de Recuperación')}</label>
                <div className="relative">
                  <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t('recuperar.tokenPlaceholder', 'Pega el token aquí')}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={loadingReset}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-4 focus:ring-[#407754]/30 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white block">{t('recuperar.newPasswordLabel', 'Nueva Contraseña')}</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loadingReset}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-4 focus:ring-[#407754]/30 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white block">{t('recuperar.confirmPasswordLabel', 'Confirmar Contraseña')}</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loadingReset}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-4 focus:ring-[#407754]/30 transition-all text-sm"
                  />
                </div>
              </div>

              {errorReset && (
                <p className="text-xs font-medium text-red-400 pt-1">{errorReset}</p>
              )}

              <button
                type="submit"
                disabled={loadingReset}
                className="w-full py-3 px-4 bg-[#4CAF50] hover:bg-[#43A047] disabled:bg-gray-700 text-white rounded-2xl font-bold text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                {loadingReset ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{t('recuperar.resetting', 'Restableciendo...')}</span>
                  </>
                ) : (
                  <span>{t('recuperar.resetButton', 'Restablecer Contraseña')}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setErrorReset(''); }}
                className="w-full py-2 text-xs text-gray-300 hover:text-white font-semibold transition-colors cursor-pointer"
              >
                {t('recuperar.reenterEmail', '← Volver a ingresar el correo')}
              </button>
            </form>
          </>
        )}

        {/* Back Link */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors duration-200"
          >
            <FiArrowLeft className="w-4 h-4" />
            {t('recuperar.backToLogin', 'Volver al inicio de sesión')}
          </Link>
        </div>

      </div>
    </div>
  );
}

