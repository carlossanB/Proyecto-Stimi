import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FiInfo, FiX } from 'react-icons/fi';
import api from '../services/api';
import axios from 'axios';
import fondoCampus from '../assets/Fondo.jpg.jpeg';
import logoSena from '../assets/logo-sena.png';

export default function Registro() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    password: '',
    confirmPassword: '',
    regional: '',
    sedeCentro: '',
    aceptaTerminos: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  const validate = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.nombreCompleto.trim()) {
      tempErrors.nombreCompleto = 'El nombre completo es obligatorio';
    }

    if (!formData.email) {
      tempErrors.email = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = 'Formato de correo electrónico no válido';
    }

    if (!formData.numeroDocumento.trim()) {
      tempErrors.numeroDocumento = 'El número de documento es obligatorio';
    }

    if (!formData.password) {
      tempErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      tempErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!formData.aceptaTerminos) {
      tempErrors.aceptaTerminos = 'Debe aceptar la política de tratamiento de datos';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor, corrige los errores del formulario o acepta los términos');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(t('registro.processing', 'Procesando registro...'));

    try {
      const payload = {
        nombreCompleto: formData.nombreCompleto,
        email: formData.email,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        contrasena: formData.password,
        confirmarContrasena: formData.confirmPassword,
        regional: formData.regional || undefined,
        sedeCentro: formData.sedeCentro || undefined,
        aceptaTerminos: formData.aceptaTerminos
      };

      const response = await api.post('/personas', payload);
      
      toast.success(response.data.message || 'Cuenta registrada. Un coordinador debe activarla antes de que puedas iniciar sesión.', {
        id: toastId,
        duration: 5000
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Error during registration:', error);
      let errMsg = 'Ocurrió un error al procesar el registro.';
      if (axios.isAxiosError(error) && error.response) {
        errMsg = error.response.data.message || errMsg;
      }
      toast.error(errMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center relative transition-all duration-500"
      style={{ 
        backgroundImage: `url(${fondoCampus})`,
        backgroundColor: '#0a0f0d' // Fallback
      }}
    >
      {/* Light overlay */}
      <div className="absolute inset-0 bg-black/25 z-0"></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center transition-all duration-350 my-8">
        
        {/* SENA Logo */}
        <div className="flex justify-center mb-4">
          <img src={logoSena} alt="Logo SENA" className="w-20 h-20 object-contain mx-auto" />
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">
          {t('registro.title', 'Crear Cuenta')}
        </h2>
        <p className="text-gray-200 text-sm mb-6 font-medium">
          {t('registro.subtitle', 'Regístrate para solicitar acceso al Sistema STIMI.')}
        </p>

        {/* Warning notification banner in yellow */}
        <div className="flex gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 text-left">
          <FiInfo className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-200">
            {t('registro.warning', 'El área de formación y rol serán asignados por el coordinador una vez aprobada tu cuenta.')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
          
          {/* Nombre Completo */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-white block">
              {t('registro.fullName', 'Nombre Completo')}
            </label>
            <input
              type="text"
              name="nombreCompleto"
              placeholder="Juan Pérez"
              value={formData.nombreCompleto}
              onChange={handleChange}
              disabled={loading}
              className={`w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border ${
                errors.nombreCompleto 
                  ? 'border-red-500' 
                  : 'border-white/20 focus:border-[#407754]'
              } focus:outline-none focus:ring-4 focus:ring-[#407754]/30 text-sm`}
            />
            {errors.nombreCompleto && (
              <p className="text-xs font-medium text-red-400 pt-1">{errors.nombreCompleto}</p>
            )}
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-white block">
              {t('registro.email', 'Correo Electrónico')}
            </label>
            <input
              type="email"
              name="email"
              placeholder="juan.perez@sena.edu.co"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className={`w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border ${
                errors.email 
                  ? 'border-red-500' 
                  : 'border-white/20 focus:border-[#407754]'
              } focus:outline-none focus:ring-4 focus:ring-[#407754]/30 text-sm`}
            />
            {errors.email && (
              <p className="text-xs font-medium text-red-400 pt-1">{errors.email}</p>
            )}
          </div>

          {/* Tipo y Número de Documento (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-white block">
                {t('registro.docType', 'Tipo de Documento')}
              </label>
              <select
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-white/10 text-white border border-white/20 focus:border-[#407754] focus:outline-none focus:ring-4 focus:ring-[#407754]/30 text-sm appearance-none cursor-pointer"
              >
                <option value="CC" className="bg-slate-900 text-white">Cédula de Ciudadanía</option>
                <option value="CE" className="bg-slate-900 text-white">Cédula de Extranjería</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-white block">
                {t('registro.docNumber', 'Número de Documento')}
              </label>
              <input
                type="text"
                name="numeroDocumento"
                placeholder="1029384756"
                value={formData.numeroDocumento}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border ${
                  errors.numeroDocumento 
                    ? 'border-red-500' 
                    : 'border-white/20 focus:border-[#407754]'
                } focus:outline-none focus:ring-4 focus:ring-[#407754]/30 text-sm`}
              />
              {errors.numeroDocumento && (
                <p className="text-xs font-medium text-red-400 pt-1">{errors.numeroDocumento}</p>
              )}
            </div>
          </div>

          {/* Contraseñas (Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-white block">
                {t('registro.password', 'Contraseña')}
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border ${
                  errors.password 
                    ? 'border-red-500' 
                    : 'border-white/20 focus:border-[#407754]'
                } focus:outline-none focus:ring-4 focus:ring-[#407754]/30 text-sm`}
              />
              {errors.password && (
                <p className="text-xs font-medium text-red-400 pt-1">{errors.password}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-white block">
                {t('registro.confirmPassword', 'Confirmar Contraseña')}
              </label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                className={`w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border ${
                  errors.confirmPassword 
                    ? 'border-red-500' 
                    : 'border-white/20 focus:border-[#407754]'
                } focus:outline-none focus:ring-4 focus:ring-[#407754]/30 text-sm`}
              />
              {errors.confirmPassword && (
                <p className="text-xs font-medium text-red-400 pt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Regional & Sede/Centro (editables) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-white block">
                {t('registro.regional', 'Regional')}
              </label>
              <input
                type="text"
                name="regional"
                placeholder="Ej: Huila"
                value={formData.regional}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-[#407754] focus:outline-none focus:ring-4 focus:ring-[#407754]/30 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-white block">
                {t('registro.sedeCentro', 'Sede / Centro')}
              </label>
              <input
                type="text"
                name="sedeCentro"
                placeholder="Ej: Centro de Gestión y Desarrollo..."
                value={formData.sedeCentro}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-[#407754] focus:outline-none focus:ring-4 focus:ring-[#407754]/30 text-sm"
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="space-y-1">
            <label className="flex items-start gap-2.5 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                name="aceptaTerminos"
                checked={formData.aceptaTerminos}
                onChange={handleChange}
                disabled={loading}
                className="mt-1 w-4 h-4 rounded-md border-white/20 bg-white/10 text-sena-green focus:ring-sena-green focus:ring-offset-0 focus:outline-none cursor-pointer"
              />
              <span className="text-xs text-gray-200 leading-normal">
                Autorizo el uso y tratamiento de mis datos personales conforme a la{' '}
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(true)}
                  className="text-sena-green hover:text-sena-green-hover font-bold underline align-baseline inline p-0 bg-transparent border-none cursor-pointer"
                >
                  política de tratamiento de datos
                </button>.
              </span>
            </label>
            {errors.aceptaTerminos && (
              <p className="text-xs font-medium text-red-400 pt-0.5 pl-6">{errors.aceptaTerminos}</p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading || !formData.aceptaTerminos}
            className="w-full py-3 px-4 bg-[#4CAF50] hover:bg-[#43A047] disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-lg transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t('registro.processing', 'Procesando...')}</span>
              </>
            ) : (
              <span>{t('registro.registerButton', 'Registrarse')}</span>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center">
          <p className="text-xs text-gray-300">
            {t('registro.hasAccount', '¿Ya tienes cuenta?')}{' '}
            <Link
              to="/login"
              className="font-bold text-[#4CAF50] hover:underline ml-1"
            >
              {t('registro.loginLink', 'Iniciar sesión')}
            </Link>
          </p>
        </div>

      </div>

      {/* Policy Modal Overlay */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPolicyModalOpen(false)}></div>
          
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 duration-200 relative flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Política de Tratamiento de Datos Personales</h3>
              <button 
                onClick={() => setIsPolicyModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-gray-300 leading-relaxed max-w-none text-left">
              {/* Disclaimer */}
              <div className="flex gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 text-amber-200 font-medium">
                <FiInfo className="w-5 h-5 text-amber-400 shrink-0" />
                <p>
                  <strong>⚠️ NOTA PROVISIONAL IMPORTANTE:</strong> Este documento es una versión preliminar de carácter técnico y académico diseñada para el entorno de pruebas del Sistema STIMI. Se encuentra sujeto a revisión y aprobación definitiva por parte de la oficina jurídica y de control interno de la institución.
                </p>
              </div>

              <h4 className="font-bold text-white text-sm pt-2">1. Identificación del Responsable</h4>
              <p>
                El Sistema de Control de Informes STIMI, correspondiente al Centro de Gestión y Desarrollo Sostenible Surcolombiano (SENA Regional Huila), actuará como encargado del almacenamiento de la información personal suministrada en el presente formulario.
              </p>

              <h4 className="font-bold text-white text-sm pt-2">2. Finalidad del Tratamiento</h4>
              <p>La recolección, almacenamiento y uso de sus datos personales tendrán como únicas finalidades:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Registrar su perfil dentro de la plataforma STIMI para el envío de informes de supervisión de contratos (Gestión de Compromiso - GC y Gestión de Formación - GF).</li>
                <li>Realizar la verificación de su identidad por parte de los coordinadores académicos autorizados para la aprobación de su cuenta.</li>
                <li>Permitir el contacto por canales institucionales únicamente para asuntos directamente relacionados con sus entregas y actividades contractuales en el SENA.</li>
              </ul>

              <h4 className="font-bold text-white text-sm pt-2">3. Tratamiento y Seguridad de los Datos</h4>
              <p>
                Los datos recolectados se almacenan de forma segura en las bases de datos cifradas del sistema y no serán transferidos ni compartidos con terceros, con excepción de los requerimientos y solicitudes expresas por mandatos legales u organismos judiciales competentes. La información se conservará únicamente mientras su cuenta permanezca activa en la institución o durante el tiempo establecido por la tabla de retención documental institucional.
              </p>

              <h4 className="font-bold text-white text-sm pt-2">4. Derechos del Titular</h4>
              <p>De conformidad con lo dispuesto en la <strong>Ley 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong>, usted como titular de los datos personales tiene derecho a:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Conocer, actualizar y rectificar sus datos personales ante los responsables del sistema.</li>
                <li>Solicitar prueba de la autorización otorgada, salvo cuando la ley la exceptúe.</li>
                <li>Ser informado acerca del uso que se le ha dado a sus datos.</li>
                <li>Revocar la autorización y/o solicitar la supresión del dato cuando en el tratamiento no se respeten los principios, derechos y garantías constitucionales y legales.</li>
              </ul>

              <h4 className="font-bold text-white text-sm pt-2">5. Canales de Ejercicio de Derechos</h4>
              <p>
                Para presentar consultas, reclamos o ejercer sus derechos constitucionales de Habeas Data, podrá comunicarse a través del canal de atención virtual oficial de soporte que será formalmente definido y notificado por la institución educativa responsable.
              </p>
            </div>

            {/* Footer button */}
            <div className="p-4 border-t border-white/10 bg-slate-950 flex justify-end">
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="px-5 py-2 bg-sena-green hover:bg-sena-green-hover text-white text-xs font-bold rounded-xl transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
