import React, { useState, useRef, useEffect } from 'react';
import { 
  FiCpu, 
  FiSend, 
  FiHelpCircle, 
  FiBookOpen, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiTrendingUp 
} from 'react-icons/fi';
import { toast } from 'sonner';
import PageContainer from '../../components/PageContainer';
import { enviarMensajeCoordinador } from '../../services/coordinadorService';

export default function AsistenteIA() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: '¡Hola! Soy el Asistente de Coordinación STIMI. Estoy listo para ayudarte a analizar la trazabilidad mensual y el cumplimiento de informes de los instructores.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCapabilities: true
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isThinking) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputVal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    const mensajeEnviado = inputVal;
    setInputVal('');
    setIsThinking(true);

    try {
      const data = await enviarMensajeCoordinador(mensajeEnviado);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: data.respuesta,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      toast.error('No se pudo obtener respuesta del asistente. Intenta de nuevo.');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: 'Lo siento, no pude conectarme con el asistente en este momento. Por favor, intenta de nuevo.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputVal(question);
  };

  const assistantCapabilities = [
    { icon: FiBookOpen, title: 'Análisis de informes', desc: 'Identifica la validez y correspondencia en formatos GC/GF.' },
    { icon: FiAlertCircle, title: 'Instructores pendientes', desc: 'Filtra y lista instructores con envíos faltantes.' },
    { icon: FiTrendingUp, title: 'Generación de reportes', desc: 'Calcula porcentajes de cumplimiento académico de forma instantánea.' },
    { icon: FiCheckCircle, title: 'Validación de documentos', desc: 'Verifica firmas digitales y estructura de archivos PDF.' }
  ];

  return (
    <PageContainer>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Asistente de Coordinación STIMI</h2>
          <p className="text-sm text-gray-500">Inteligencia Artificial para la revisión y seguimiento de informes mensuales</p>
        </div>
        <div className="flex items-center gap-2 bg-sena-green-light px-3.5 py-1.5 rounded-full border border-green-100">
          <span className="w-2.5 h-2.5 bg-sena-green rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold text-sena-green uppercase">En Línea</span>
        </div>
      </div>

      {/* Chat area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Main Conversation Box */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-[550px] lg:col-span-3 overflow-hidden">
          
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => {
              const isAss = msg.sender === 'assistant';
              return (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${isAss ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
                >
                  {isAss && (
                    <div className="w-8 h-8 rounded-lg bg-sena-green-light text-sena-green flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FiCpu className="w-4.5 h-4.5" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isAss 
                        ? 'bg-gray-50 text-gray-700 rounded-tl-none border border-gray-100' 
                        : 'bg-sena-green text-white rounded-tr-none'
                    }`}>
                      <p>{msg.text}</p>
                      
                      {msg.isCapabilities && (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                          {assistantCapabilities.map((cap, i) => {
                            const CapIcon = cap.icon;
                            return (
                              <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 space-y-1">
                                <span className="text-sena-green font-bold flex items-center gap-1.5 text-[10px]">
                                  <CapIcon className="w-3.5 h-3.5" /> {cap.title}
                                </span>
                                <p className="text-[9px] text-gray-400 font-medium">{cap.desc}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <span className={`text-[9px] font-medium text-gray-400 block ${isAss ? 'text-left' : 'text-right'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex gap-3 max-w-[80%] self-start">
                <div className="w-8 h-8 rounded-lg bg-sena-green-light text-sena-green flex items-center justify-center flex-shrink-0">
                  <FiCpu className="w-4.5 h-4.5 animate-spin" />
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none p-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Input */}
          <div className="border-t border-gray-100 p-4 bg-gray-50/50">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Escribe tu consulta... (Enter para enviar)"
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-sena-green transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-sena-green hover:bg-sena-green-hover text-white rounded-xl transition-all flex items-center justify-center hover:-translate-y-0.5 shadow-sm"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
              <FiHelpCircle className="text-gray-400 flex-shrink-0" />
              <span>Sugerencia: Pregúntame "¿Cuáles informes están pendientes hoy?" o "¿Cuál es la tasa de cumplimiento?"</span>
            </p>
          </div>

        </div>

        {/* Prompt Assistant Panel */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Preguntas Frecuentes</h3>
            <p className="text-[10px] text-gray-400">Seleccione una consulta rápida para el asistente</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => handleQuickQuestion('¿Qué instructores tienen informes pendientes hoy?')}
              className="text-left p-3 bg-gray-50 hover:bg-sena-green-light border border-gray-100 hover:border-green-100 text-xs font-medium text-gray-600 hover:text-sena-green rounded-xl transition-all"
            >
              ¿Cuáles informes están pendientes de revisión?
            </button>
            <button
              onClick={() => handleQuickQuestion('¿Cuál es la tasa de cumplimiento general en Julio?')}
              className="text-left p-3 bg-gray-50 hover:bg-sena-green-light border border-gray-100 hover:border-green-100 text-xs font-medium text-gray-600 hover:text-sena-green rounded-xl transition-all"
            >
              ¿Cuál es la tasa de cumplimiento en Julio?
            </button>
            <button
              onClick={() => handleQuickQuestion('¿Cómo descargo los formatos de informes?')}
              className="text-left p-3 bg-gray-50 hover:bg-sena-green-light border border-gray-100 hover:border-green-100 text-xs font-medium text-gray-600 hover:text-sena-green rounded-xl transition-all"
            >
              ¿Dónde descargo los formatos vigentes?
            </button>
          </div>

          <div className="bg-sena-green-light rounded-xl p-3 border border-green-100 text-[10px] text-sena-green font-medium">
            💡 Consejo: Puedes escribirle de forma natural para filtrar tus revisiones.
          </div>
        </div>

      </div>

    </PageContainer>
  );
}
