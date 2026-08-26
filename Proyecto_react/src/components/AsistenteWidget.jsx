import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSend, FiMessageSquare, FiX, FiMoreHorizontal,
  FiPaperclip, FiFileText, FiCheckCircle, FiXCircle, FiInfo, FiAlertCircle
} from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import logoSena from '../assets/logo-sena.png';
import { enviarMensajeAsistente, enviarArchivoInforme } from '../services/asistenteService';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const QUICK_RESPONSES = {
  pendientes: {
    question: '¿Cuáles son mis informes pendientes?',
    answer: '📋 **Informes pendientes para Julio 2026:**\n\n• **Informe GC** (Gestión Contractual - GTH-F-062 V10) → No cargado\n• **Informe GF** (Gestión Financiera) → No cargado\n\n⏰ Fecha límite: **31 de julio de 2026** a las 23:59.\n\n💡 *Puedes adjuntar tu informe en formato PDF usando el botón de clip (📎) para que lo analice automáticamente.*',
  },
  cumplimiento: {
    question: '¿Cuál es mi porcentaje de cumplimiento?',
    answer: '📊 **Tu cumplimiento acumulado es del 66.7%** (4 de 6 informes entregados).\n\nSi entregas los informes GC y GF de este mes, alcanzarás el 100%.',
  },
  formatos: {
    question: '¿Dónde descargo los formatos GC y GF?',
    answer: '📄 Formato **GC**: GTH-F-062 Versión 10.\n📄 Formato **GF**: Liquidación mensual.\n\nAmbos están disponibles en el módulo "Mis Informes". Recuerda firmarlos digitalmente antes de subirlos o adjuntarlos aquí para revisión previa.',
  },
};

function ModalConfirmacion({ archivo, onConfirmar, onCancelar, periodoDefault }) {
  const anioActual = new Date().getFullYear();
  // Use the active period from context if provided, otherwise default to current month
  const defaultMes = periodoDefault ? periodoDefault.split(' ')[0] : MESES[new Date().getMonth()];
  const defaultAnio = periodoDefault ? (periodoDefault.split(' ')[1] || String(anioActual)) : String(anioActual);
  const [tipo, setTipo] = useState('GC');
  const [mes, setMes] = useState(defaultMes);
  const [anio, setAnio] = useState(defaultAnio);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xs p-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-green-100 dark:bg-green-950/40 rounded-xl flex items-center justify-center shrink-0">
            <FiFileText className="w-5 h-5 text-green-600 dark:text-emerald-400" />
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 leading-tight">Analizar informe</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{archivo.name}</p>
          </div>
          <button onClick={onCancelar} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de informe</label>
            <div className="flex gap-2">
              {['GC', 'GF'].map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    tipo === t
                      ? 'bg-[#407754] border-[#407754] text-white shadow-xs'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-green-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Período</label>
            <div className="flex gap-2">
              <select
                value={mes}
                onChange={e => setMes(e.target.value)}
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#407754] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {MESES.map(m => <option key={m} value={m} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{m}</option>)}
              </select>
              <select
                value={anio}
                onChange={e => setAnio(e.target.value)}
                className="w-20 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#407754] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {[anioActual - 1, anioActual, anioActual + 1].map(a => <option key={a} value={String(a)} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancelar}
            className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(tipo, `${mes} ${anio}`)}
            className="flex-1 py-2 bg-[#407754] hover:bg-[#346244] text-white rounded-xl text-xs font-bold shadow-xs"
          >
            Analizar
          </button>
        </div>
      </div>
    </div>
  );
}

function BurbujaAnalisis({ estado, texto }) {
  const isValid = estado === 'validado';
  const isPending = estado === 'pendiente';

  const colorConfig = isValid
    ? { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', badge: 'bg-green-100 text-green-700' }
    : isPending
    ? { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' }
    : { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' };

  return (
    <div className={`p-3 rounded-2xl rounded-tl-xs border text-xs ${colorConfig.bg} ${colorConfig.border}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {isValid ? <FiCheckCircle className={`w-4 h-4 ${colorConfig.icon}`} /> : <FiXCircle className={`w-4 h-4 ${colorConfig.icon}`} />}
        <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${colorConfig.badge}`}>
          {isValid ? '✅ Informe Validado' : isPending ? '⏳ En Revisión' : '⚠️ Informe con Observaciones'}
        </span>
      </div>
      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
        {texto}
      </div>
    </div>
  );
}

export default function AsistenteWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '¡Hola! 👋 Soy tu asistente de STIMI.\n\nPuedo responder tus dudas o **revisar tus informes PDF** (GC/GF). Adjúntalos con el botón 📎.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tipo: 'texto',
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const fileInputRef = useRef(null);
  const conversationHistory = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const fab = document.getElementById('stimi-assistant-fab');
        if (fab && fab.contains(e.target)) return;
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSend = useCallback(async (e, sugerencia) => {
    e?.preventDefault();
    const texto = sugerencia ?? inputValue.trim();
    if (!texto || isTyping) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: texto, time, tipo: 'texto' }]);
    setInputValue('');
    setIsTyping(true);

    conversationHistory.current = [...conversationHistory.current, { rol: 'user', contenido: texto }];

    try {
      const { respuesta } = await enviarMensajeAsistente(texto, conversationHistory.current);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: respuesta,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: 'texto',
      }]);
      conversationHistory.current = [...conversationHistory.current, { rol: 'assistant', contenido: respuesta }];
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        sender: 'ai',
        text: '⚠️ No pude conectarme con el servidor. Intenta de nuevo.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        tipo: 'texto',
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping]);

  const handleQuickAction = (key) => {
    const action = QUICK_RESPONSES[key];
    handleSend(null, action.question);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF.');
      return;
    }
    setArchivoSeleccionado(file);
    setModalAbierto(true);
    e.target.value = '';
  };

  const handleConfirmarAnalisis = useCallback(async (tipoInforme, periodo) => {
    setModalAbierto(false);
    if (!archivoSeleccionado || isTyping) return;

    setIsTyping(true);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'user',
      text: `📎 Enviando informe ${tipoInforme} (${periodo}): *${archivoSeleccionado.name}*`,
      time,
      tipo: 'archivo',
    }]);

    try {
      const resultado = await enviarArchivoInforme(archivoSeleccionado, tipoInforme, periodo);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: resultado.respuesta,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tipo: 'analisis',
        estado: resultado.estado,
        idInforme: resultado.id_informe,
      }]);
    } catch (err) {
      // Extraer mensaje de error real del servidor
      const errMsg =
        err?.response?.data?.message ||
        (Array.isArray(err?.response?.data?.message)
          ? err.response.data.message.join(', ')
          : null) ||
        err?.message ||
        'Error desconocido';
      console.error('[AsistenteWidget] Error al subir archivo:', err?.response?.data ?? err);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        sender: 'ai',
        text: `⚠️ Error al analizar el archivo: ${errMsg}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        tipo: 'texto',
      }]);
    } finally {
      setIsTyping(false);
      setArchivoSeleccionado(null);
    }
  }, [archivoSeleccionado, isTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      {modalAbierto && archivoSeleccionado && (
        <ModalConfirmacion
          archivo={archivoSeleccionado}
          onConfirmar={handleConfirmarAnalisis}
          onCancelar={() => { setModalAbierto(false); setArchivoSeleccionado(null); }}
        />
      )}

      {/* Floating Action Button */}
      <button
        id="stimi-assistant-fab"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen ? 'bg-gray-800 rotate-90' : 'bg-[#407754] hover:bg-[#346244]'
        }`}
        title="Asistente STIMI"
      >
        {isOpen ? <FiX className="w-6 h-6 text-white" /> : <RiRobot2Line className="w-6 h-6 text-white" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute bottom-16 right-0 z-50 w-[380px] max-h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-[#407754] px-4 py-3.5 flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center p-1.5 backdrop-blur-xs">
                <img src={logoSena} alt="STIMI Bot" className="w-full h-full object-contain" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-300 border-2 border-[#407754] rounded-full"></span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">Asistente STIMI</h3>
              <p className="text-[10px] text-green-200 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block"></span>
                En línea · Validación IA de PDF
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50 min-h-0">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] ${msg.sender === 'user' ? 'order-1' : ''}`}>
                  {msg.tipo === 'analisis' ? (
                    <BurbujaAnalisis estado={msg.estado} texto={msg.text} />
                  ) : (
                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-[#407754] text-white rounded-br-xs'
                        : msg.isError
                        ? 'bg-red-50 border border-red-100 text-red-700 rounded-bl-xs'
                        : 'bg-white border border-gray-100 text-gray-700 rounded-bl-xs shadow-xs'
                    }`}>
                      {msg.tipo === 'archivo' ? (
                        <span className="flex items-center gap-1.5"><FiFileText className="w-4 h-4" />{msg.text}</span>
                      ) : (
                        msg.text
                      )}
                    </div>
                  )}
                  <p className={`text-[9px] text-gray-400 mt-1 px-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                    {msg.time}
                    {msg.tipo === 'analisis' && msg.idInforme && (
                      <span className="ml-1 text-green-600 font-semibold">• Guardado</span>
                    )}
                  </p>
                </div>
              </div>
            ))}

            {messages.length === 1 && !isTyping && (
              <div className="flex flex-wrap gap-1.5 pl-1 animate-in fade-in">
                {[
                  { key: 'pendientes', label: '📋 Pendientes' },
                  { key: 'cumplimiento', label: '📊 Cumplimiento' },
                  { key: 'formatos', label: '📄 Formatos' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleQuickAction(key)}
                    className="bg-white border border-gray-200 text-gray-700 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl hover:bg-green-50 hover:border-[#407754] hover:text-[#407754] transition-all shadow-xs"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {isTyping && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-white border border-gray-100 px-3 py-2 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-1.5 text-xs text-gray-400">
                  <FiMoreHorizontal className="w-4 h-4 text-green-600 animate-pulse" />
                  <span>Analizando...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-2.5 border-t border-gray-100 bg-white shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping}
                title="Adjuntar informe PDF (GC/GF)"
                className="p-2 border border-gray-200 hover:border-green-500 hover:bg-green-50 disabled:opacity-50 text-gray-500 hover:text-green-600 rounded-xl transition-all shrink-0"
              >
                <FiPaperclip className="w-4.5 h-4.5" />
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensaje o usa 📎 para el PDF..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#407754] focus:ring-1 focus:ring-[#407754]"
                  disabled={isTyping}
                />
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="p-2 bg-[#407754] hover:bg-[#346244] disabled:bg-gray-300 text-white rounded-xl transition-all shrink-0"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
