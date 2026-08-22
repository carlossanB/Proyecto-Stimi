import React, { useState, useRef, useEffect } from 'react';
import { FiKey, FiInfo, FiUploadCloud, FiEdit2, FiTrash2, FiSave, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function FirmaDigitalManager({ defaultName = '', defaultRole = '', onFirmaSave }) {
  const { updateLocalUser } = useAuth();
  const { t } = useTranslation();
  const [nombre, setNombre] = useState(defaultName);
  const [cargo, setCargo] = useState(defaultRole);
  const [modo, setModo] = useState('dibujar'); // 'dibujar' | 'subir'
  const [savingFirma, setSavingFirma] = useState(false);
  
  // Drawing state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Upload state
  const fileInputRef = useRef(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  // Final saved state (local to component, passed up via onFirmaSave)
  const [isSaved, setIsSaved] = useState(false);

  // --- Canvas Logic ---
  useEffect(() => {
    if (modo === 'dibujar' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [modo]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
    setIsSaved(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setIsSaved(false);
  };

  // --- Image Upload Logic ---
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error(t('firma.invalidImageFile', 'Por favor, selecciona un archivo de imagen válido'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target.result);
        setIsSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast.error(t('firma.nameRequired', 'El nombre es obligatorio'));
      return;
    }

    let signatureDataUrl = null;

    if (modo === 'dibujar') {
      if (!hasDrawn) {
        toast.error(t('firma.drawFirst', 'Por favor, dibuja tu firma antes de guardar'));
        return;
      }
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    } else {
      if (!uploadedImage) {
        toast.error(t('firma.uploadFirst', 'Por favor, sube una imagen de tu firma antes de guardar'));
        return;
      }
      signatureDataUrl = uploadedImage;
    }

    setSavingFirma(true);
    try {
      const res = await api.post('/personas/me/firma-base64', {
        base64: signatureDataUrl,
      });

      const signaturePath = res.data.firma_digital_ruta;
      updateLocalUser({ firma_digital_ruta: signaturePath });
      toast.success(t('firma.savedSuccess', 'Firma digital guardada y vinculada exitosamente'));
      setIsSaved(true);
      if (onFirmaSave) {
        onFirmaSave({
          nombre,
          cargo,
          signatureUrl: signaturePath
        });
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      toast.error(t('firma.saveError', 'Error al guardar la firma'));
    } finally {
      setSavingFirma(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-6 shadow-sm space-y-6 text-gray-900 dark:text-gray-100">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-[#407754] dark:text-emerald-400 rounded-xl">
            <FiKey className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t('firma.managerTitle', 'Gestor de Firma Digital')}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('firma.managerDesc', 'Configura el aval institucional para la validación de informes')}</p>
          </div>
        </div>
        {isSaved && (
          <span className="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase flex items-center gap-1">
            <FiCheckCircle className="w-3.5 h-3.5" /> {t('firma.currentSignature', 'Firma Vigente')}
          </span>
        )}
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('firma.endorsementName', 'Nombre para el Aval')}</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setIsSaved(false); }}
            placeholder={t('firma.namePlaceholder', 'Ej. Alexander Garzón Morales')}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#407754]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{t('firma.officialRole', 'Cargo / Rol Oficial')}</label>
          <input
            type="text"
            value={cargo}
            onChange={(e) => { setCargo(e.target.value); setIsSaved(false); }}
            placeholder={t('firma.rolePlaceholder', 'Ej. Coordinador Académico')}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#407754]"
          />
        </div>
      </div>

      {/* Method Switcher */}
      <div className="flex justify-center border-b border-gray-100 dark:border-gray-700 pb-2">
        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex gap-1">
          <button
            type="button"
            onClick={() => setModo('dibujar')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modo === 'dibujar' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            ✍️ {t('firma.drawSignature', 'Dibujar Firma')}
          </button>
          <button
            type="button"
            onClick={() => setModo('subir')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modo === 'subir' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-xs' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            📤 {t('firma.uploadImage', 'Cargar Imagen (PNG/JPG)')}
          </button>
        </div>
      </div>

      {/* Signature Content Area */}
      {modo === 'dibujar' ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl bg-white p-2 shadow-inner">
            <canvas
              ref={canvasRef}
              width={400}
              height={160}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair touch-none bg-white rounded-xl"
            />
            <span className="absolute bottom-2 right-3 text-[9px] text-gray-300 pointer-events-none select-none font-bold uppercase">
              {t('firma.drawOnCanvas', 'Traza sobre el recuadro')}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearCanvas}
              className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <FiTrash2 className="w-3.5 h-3.5" /> {t('firma.clearStroke', 'Limpiar trazo')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageUpload}
            className="hidden"
          />

          {uploadedImage ? (
            <div className="relative border border-gray-200 dark:border-gray-600 rounded-2xl p-4 bg-white max-w-sm flex flex-col items-center">
              <img src={uploadedImage} alt={t('firma.uploadedAlt', 'Firma subida')} className="max-h-32 object-contain" />
              <button
                type="button"
                onClick={() => setUploadedImage(null)}
                className="mt-2 text-xs text-red-500 font-bold hover:underline cursor-pointer"
              >
                {t('firma.changeImage', 'Cambiar imagen')}
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-md h-36 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50/50 dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col items-center justify-center cursor-pointer p-4 text-center"
            >
              <FiUploadCloud className="w-8 h-8 text-[#407754] dark:text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{t('firma.dragOrClick', 'Haz clic para explorar o arrastra tu firma transparente')}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{t('firma.supportedFormats', 'Formatos soportados: PNG o JPG (Fondo blanco o transparente)')}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <FiInfo className="w-3.5 h-3.5" /> {t('firma.stampNotice', 'Esta firma se estampará en los certificados de aprobación de informes')}
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={savingFirma}
          className="px-5 py-2.5 bg-[#407754] hover:bg-[#335f43] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          <FiSave className="w-4 h-4" />
          {savingFirma ? t('common.saving', 'Guardando...') : t('firma.saveAndRegister', 'Guardar y Registrar Firma')}
        </button>
      </div>

    </div>
  );
}

