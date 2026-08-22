import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FiEye, FiEyeOff, FiMoon, FiSun } from 'react-icons/fi';
import fondoCampus from '../assets/Fondo.jpg.jpeg';
import logoSena from '../assets/logo-sena.png';

export default function Login() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form field errors
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      tempErrors.email = 'El correo o documento es obligatorio';
    } else if (email.includes('@') && !emailRegex.test(email)) {
      tempErrors.email = 'Formato de correo electrónico no válido';
    } else if (!email.includes('@') && email.trim().length < 3) {
      tempErrors.email = 'El documento debe tener al menos 3 caracteres';
    }

    if (!password) {
      tempErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 4) {
      tempErrors.password = 'La contraseña debe tener al menos 4 caracteres';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrige los errores del formulario');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(t('login.authenticating', 'Autenticando...'));

    try {
      const loggedUser = await login(email, password);
      toast.success(`¡Sesión iniciada! Bienvenido, ${loggedUser.nombreCompleto}`, { id: toastId });
      
      // Redirect based on rol
      if (loggedUser.rol === 'coordinador') {
        navigate('/coordinador');
      } else {
        navigate('/instructor');
      }
    } catch (err) {
      toast.error(err.message || 'Correo, documento o contraseña incorrectos', { id: toastId });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center bg-cover bg-center relative transition-colors duration-300 p-6"
      style={{ 
        backgroundImage: `url(${fondoCampus})`,
        backgroundColor: '#0a0f0d' 
      }}
    >
      {/* Light overlay — lets the campus photo show through */}
      <div className="absolute inset-0 bg-black/25 z-0"></div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 text-white hover:bg-white/10 rounded-full transition-all duration-200 shadow-sm border border-white/10 bg-black/20 backdrop-blur-md z-10 cursor-pointer"
        title={t('login.toggleTheme', 'Cambiar tema')}
      >
        {theme === 'light' ? <FiMoon className="w-5 h-5" /> : <FiSun className="w-5 h-5" />}
      </button>

      {/* Glassmorphism card — translucent so campus greenery shows through */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 p-8 rounded-3xl shadow-2xl max-w-md w-full transition-all duration-300">
        
        {/* SENA Official Logo */}
        <div className="flex justify-center mb-4">
          <img src={logoSena} alt="Logo SENA" className="w-20 h-20 object-contain" />
        </div>

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-2xl font-extrabold text-white text-center leading-tight">
            {t('login.title', 'Sistema STIMI')}
          </h1>
          <p className="text-gray-200 text-xs mt-1 text-center font-medium max-w-xs">
            {t('common.systemDescription', 'Sistema de Trazabilidad de Informes Mensuales de Instructores')}
          </p>
          
          {/* Institutional Fixed Information — consistent weight, no uppercase */}
          <div className="mt-4 text-center border-t border-white/10 pt-3 w-full space-y-0.5">
            <span className="text-[11px] text-gray-200 block font-medium">
              {t('common.regional', 'Regional Huila')}
            </span>
            <span className="text-[10px] text-gray-300 block font-medium leading-tight">
              {t('common.centro', 'Centro de Gestión y Desarrollo Sostenible Surcolombiano')}
            </span>
            <span className="text-[10px] text-gray-200 block font-medium">
              {t('common.sede', 'Sede Yamboro')}
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          
          {/* Email input field — no icon, clean */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-white block">
              {t('login.user', 'Usuario')}
            </label>
            <input
              type="email"
              placeholder={t('login.userPlaceholder', 'Ingrese su usuario')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border ${
                errors.email 
                  ? 'border-red-500 focus:ring-red-500/30' 
                  : 'border-white/20 focus:border-[#407754] focus:ring-[#407754]/30'
              } focus:outline-none focus:ring-4 transition-all duration-200 text-sm`}
            />
            {errors.email && (
              <p className="text-xs font-medium text-red-400 pt-1">{errors.email}</p>
            )}
          </div>

          {/* Password input field — no lock icon, show/hide toggle remains */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-white block">
              {t('login.password', 'Contraseña')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('login.passwordPlaceholder', 'Ingrese su contraseña')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={`w-full px-4 pr-11 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-500/30' 
                    : 'border-white/20 focus:border-[#407754] focus:ring-[#407754]/30'
                } focus:outline-none focus:ring-4 transition-all duration-200 text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-200 cursor-pointer"
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-400 pt-1">{errors.password}</p>
            )}
          </div>

          {/* Forgot password link */}
          <div className="flex justify-center">
            <Link
              to="/recuperar-contrasena"
              className="text-xs font-semibold text-white underline hover:text-gray-200"
            >
              {t('login.forgotPassword', '¿Olvidaste tu contraseña?')}
            </Link>
          </div>

          {/* Submit Button — vivid green #4CAF50 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#4CAF50] hover:bg-[#43A047] disabled:bg-gray-700 text-white rounded-2xl font-bold text-sm shadow-lg transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t('login.authenticating', 'Autenticando...')}</span>
              </>
            ) : (
              <span>{t('login.loginButton', 'Iniciar Sesión')}</span>
            )}
          </button>
        </form>

        {/* Footer — Create Account link */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-gray-300">
            {t('login.noAccount', '¿No tienes cuenta?')}{' '}
            <Link
              to="/registro"
              className="font-bold text-white underline hover:text-gray-200"
            >
              {t('login.registerHere', 'Regístrate aquí')}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
