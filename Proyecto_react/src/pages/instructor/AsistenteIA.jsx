import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FiSend, FiInfo, FiMessageSquare, FiCpu, FiMoreHorizontal,
  FiAlertCircle, FiRefreshCw, FiZap, FiPaperclip, FiX,
  FiFileText, FiCheckCircle, FiXCircle,
} from 'react-icons/fi';
import logoSena from '../../assets/logo-sena.png';
import PageContainer from '../../components/PageContainer';
import { enviarMensajeAsistente, enviarArchivoInforme } from '../../services/asistenteService';

// ── Meses disponibles ─────────────────────────────────────────────────────────
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// ── Sugerencias rápidas ───────────────────────────────────────────────────────
const SUGERENCIAS = [
  'Ayúdame a redactar las obligaciones para mi informe GC de este mes',
  'Dame un ejemplo de evidencias para seguimiento de aprendices',
  'Cómo debo estructurar el informe GF de Julio 2026',
  '¿Qué información va en las actividades de aprendizaje?',
];

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ── Modal de confirmación de informe ─────────────────────────────────────────
function ModalConfirmacion({ archivo, onConfirmar, onCancelar }) {
  const anioActual = new Date().getFullYear();
  const [tipo, setTipo] = useState('GC');
  const [mes, setMes] = useState(MESES[new Date().getMonth()]);
  const [anio, setAnio] = useState(String(anioActual));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <FiFileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Confirmar análisis de informe</h3>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">{archivo.name}</p>
          </div>
          <button onClick={onCancelar} className="ml-auto text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tipo de informe */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tipo de informe
            </label>
            <div className="flex gap-2">
              {['GC', 'GF'].map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                    tipo === t
                      ? 'bg-[#407754] border-[#407754] text-white'
                      : 'border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Período */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Período del informe
            </label>
            <div className="flex gap-2">
              <select
                value={mes}
                onChange={e => setMes(e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {MESES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={anio}
                onChange={e => setAnio(e.target.value)}
                className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {[anioActual - 1, anioActual, anioActual + 1].map(a => (
                  <option key={a} value={String(a)}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
            <FiInfo className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              La IA analizará tu informe {tipo} de <strong>{mes} {anio}</strong> y
              te dará un reporte detallado. El proceso puede tardar hasta 60 segundos.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(tipo, `${mes} ${anio}`)}
            className="flex-1 py-2.5 bg-[#407754] hover:bg-[#346244] text-white rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            Analizar informe
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Burbuja de resultado de análisis ─────────────────────────────────────────
function BurbujaAnalisis({ estado, texto }) {
  const isValid = estado === 'validado';
  const isPending = estado === 'pendiente';

  const colorConfig = isValid
    ? { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', badge: 'bg-green-100 text-green-700' }
    : isPending
    ? { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' }
    : { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' };

  return (
    <div className={`p-4 rounded-2xl rounded-tl-none border shadow-sm ${colorConfig.bg} ${colorConfig.border}`}>
      <div className="flex items-center gap-2 mb-2">
        {isValid
          ? <FiCheckCircle className={`w-4 h-4 ${colorConfig.icon}`} />
          : <FiXCircle className={`w-4 h-4 ${colorConfig.icon}`} />
        }
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorConfig.badge}`}>
          {isValid ? '✅ Informe Validado' : isPending ? '⏳ En Revisión' : '⚠️ Informe con Observaciones'}
        </span>
      </div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
        {texto}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AsistenteIA() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '¡Hola! Soy tu **Asistente STIMI**, potenciado por IA. Puedo ayudarte con:\n\n• Redactar borradores para informes **GC y GF**.\n• **Analizar tu informe PDF** y decirte si está completo.\n• Sugerir evidencias basadas en tu plan de formación.\n• Orientarte sobre el seguimiento de aprendices.\n\n📎 Adjunta tu informe PDF con el botón de clip para que lo revise.',
      time: formatTime(),
      isError: false,
      tipo: 'texto',
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const conversationHistory = useRef([]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 128) + 'px';
    }
  }, [inputValue]);

  // ── Envío de mensaje de texto ─────────────────────────────────────────────
  const handleSend = useCallback(async (e, sugerencia) => {
    e?.preventDefault();
    const texto = sugerencia ?? inputValue.trim();
    if (!texto || isTyping) return;

    setError(null);
    const userMsg = { id: Date.now(), sender: 'user', text: texto, time: formatTime(), isError: false, tipo: 'texto' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    conversationHistory.current = [...conversationHistory.current, { rol: 'user', contenido: texto }];

    try {
      const { respuesta } = await enviarMensajeAsistente(texto, conversationHistory.current);
      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: respuesta, time: formatTime(), isError: false, tipo: 'texto' };
      setMessages(prev => [...prev, aiMsg]);
      conversationHistory.current = [...conversationHistory.current, { rol: 'assistant', contenido: respuesta }];
    } catch (err) {
      const errMsg = err?.response?.data?.message || 'Error al conectar con el asistente. Intenta de nuevo.';
      setError(errMsg);
      setMessages(prev => [...prev, { id: Date.now() + 2, sender: 'ai', text: `⚠️ ${errMsg}`, time: formatTime(), isError: true, tipo: 'texto' }]);
      conversationHistory.current = conversationHistory.current.slice(0, -1);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping]);

  // ── Selección de archivo PDF ──────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError('El archivo no puede superar los 100 MB.');
      return;
    }
    setError(null);
    setArchivoSeleccionado(file);
    setModalAbierto(true);
    // Limpiar el input para que se pueda volver a seleccionar el mismo archivo
    e.target.value = '';
  };

  // ── Envío del informe PDF al backend ─────────────────────────────────────
  const handleConfirmarAnalisis = useCallback(async (tipoInforme, periodo) => {
    setModalAbierto(false);
    if (!archivoSeleccionado || isTyping) return;

    setError(null);
    setIsTyping(true);

    // Burbuja del usuario mostrando el archivo adjunto
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: `📎 Enviando informe ${tipoInforme} de ${periodo}: *${archivoSeleccionado.name}*`,
      time: formatTime(),
      isError: false,
      tipo: 'archivo',
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const resultado = await enviarArchivoInforme(archivoSeleccionado, tipoInforme, periodo);

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: resultado.respuesta,
        time: formatTime(),
        isError: false,
        tipo: 'analisis',
        estado: resultado.estado,
        idInforme: resultado.id_informe,
      };
      setMessages(prev => [...prev, aiMsg]);

      // No se agrega al historial de contexto de texto (es una acción separada)
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        'Error al analizar el informe. Verifica tu conexión e intenta de nuevo.';
      setError(errMsg);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 2, sender: 'ai', text: `⚠️ ${errMsg}`, time: formatTime(), isError: true, tipo: 'texto' },
      ]);
    } finally {
      setIsTyping(false);
      setArchivoSeleccionado(null);
    }
  }, [archivoSeleccionado, isTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleLimpiar = () => {
    setMessages([{ id: Date.now(), sender: 'ai', text: 'Conversación reiniciada. ¿En qué puedo ayudarte?', time: formatTime(), isError: false, tipo: 'texto' }]);
    conversationHistory.current = [];
    setError(null);
  };

  // ── Render del texto con **negrita** ─────────────────────────────────────
  const renderText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
  };

  return (
    <PageContainer maxWidth="max-w-4xl" className="h-[calc(100vh-2rem)] flex flex-col">

      {/* Modal de confirmación */}
      {modalAbierto && archivoSeleccionado && (
        <ModalConfirmacion
          archivo={archivoSeleccionado}
          onConfirmar={handleConfirmarAnalisis}
          onCancelar={() => { setModalAbierto(false); setArchivoSeleccionado(null); }}
        />
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-t-3xl p-5 shadow-sm flex items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-green-50 rounded-full border border-green-100 flex items-center justify-center p-2">
              <img src={logoSena} alt="STIMI Bot" className="w-full h-full object-contain" />
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Asistente STIMI</h2>
            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
              <FiCpu className="w-3.5 h-3.5" />
              En línea • Análisis de informes GC/GF habilitado
            </p>
          </div>
        </div>
        <button onClick={handleLimpiar} title="Reiniciar conversación"
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl p-2 transition-all">
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-gray-50 border-x border-gray-200 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <div className="flex justify-center">
          <span className="bg-gray-200/60 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

              {/* Avatar */}
              <div className="shrink-0 mt-1">
                {msg.sender === 'ai' ? (
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center p-1.5 ${msg.isError ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    {msg.isError ? <FiAlertCircle className="w-4 h-4 text-red-400" /> : <img src={logoSena} alt="AI" className="w-full h-full object-contain" />}
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-[#407754] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">TÚ</div>
                )}
              </div>

              {/* Burbuja */}
              <div>
                {msg.tipo === 'analisis' ? (
                  <BurbujaAnalisis estado={msg.estado} texto={msg.text} />
                ) : (
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#407754] text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-red-50 border border-red-100 text-red-700 rounded-tl-none'
                      : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                  }`} style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.tipo === 'archivo'
                      ? <span className="flex items-center gap-2"><FiFileText className="w-4 h-4" />{renderText(msg.text)}</span>
                      : renderText(msg.text)
                    }
                  </div>
                )}
                <div className={`text-[10px] text-gray-400 mt-1.5 font-medium ${msg.sender === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                  {msg.time}
                  {msg.tipo === 'analisis' && msg.idInforme && (
                    <span className="ml-2 text-green-500">• Guardado (ID #{msg.idInforme})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de análisis (typing) */}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="flex max-w-[80%] gap-3">
              <div className="shrink-0 mt-1">
                <div className="w-8 h-8 bg-green-50 rounded-full border border-green-100 flex items-center justify-center p-1.5">
                  <img src={logoSena} alt="AI" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-white border border-gray-100 shadow-sm flex items-center gap-2 text-gray-500 text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-gray-400 ml-1">Analizando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias rápidas (solo al inicio) */}
      {messages.length <= 2 && !isTyping && (
        <div className="bg-gray-50 border-x border-gray-200 px-6 pb-3">
          <p className="text-xs text-gray-400 font-semibold mb-2 flex items-center gap-1">
            <FiZap className="w-3.5 h-3.5 text-yellow-500" />
            Sugerencias rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGERENCIAS.map((s, i) => (
              <button key={i} onClick={e => handleSend(e, s)}
                className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 rounded-xl px-3 py-1.5 transition-all font-medium">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border border-gray-200 rounded-b-3xl p-4 shadow-sm z-10 relative">
        <form onSubmit={handleSend} className="flex items-end gap-3">

          {/* Botón de adjuntar PDF */}
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
            title="Adjuntar informe PDF (GC o GF)"
            className="p-3.5 border border-gray-200 hover:border-green-400 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-500 hover:text-green-600 rounded-2xl transition-all shrink-0"
          >
            <FiPaperclip className="w-5 h-5" />
          </button>

          {/* Textarea de texto */}
          <div className="relative flex-1">
            <FiMessageSquare className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje o usa 📎 para adjuntar tu informe PDF…"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 resize-none max-h-32 min-h-[52px] transition-all"
              rows="1"
              disabled={isTyping}
            />
          </div>

          <button type="submit" disabled={!inputValue.trim() || isTyping}
            className="p-3.5 bg-[#407754] hover:bg-[#346244] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl shadow-sm transition-all active:scale-95 shrink-0">
            {isTyping ? <FiMoreHorizontal className="w-5 h-5 animate-pulse" /> : <FiSend className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-3 px-1">
          <p className="text-xs text-gray-400 font-medium">
            <strong className="text-gray-500">Tip:</strong>{' '}
            Usa el <strong>📎 clip</strong> para adjuntar tu informe PDF y obtener una revisión automática con IA.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3">
        <FiInfo className="w-5 h-5 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-800 font-medium">
          El asistente utiliza Inteligencia Artificial para analizar tus informes y generar contenido.
          Verifica siempre la precisión de los resultados y consulta con coordinación ante dudas institucionales.
        </p>
      </div>

    </PageContainer>
  );
}
