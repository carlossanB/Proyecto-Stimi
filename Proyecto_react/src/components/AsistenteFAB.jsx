import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiHelpCircle, FiClock, FiX, FiCpu } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { toast } from 'sonner';
import api from '../services/api';

export default function AsistenteFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: '¡Hola! Soy tu asistente de coordinación. ¿Deseas consultar sobre los informes pendientes de este mes, la tasa de cumplimiento o descargar los formatos?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  const popoverRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isThinking, isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || isThinking) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputVal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const currentInput = inputVal;
    setMessages((prev) => [...prev, userMessage]);
    setInputVal('');
    setIsThinking(true);

    // Build historial for context (last 10 messages)
    const historial = messages.slice(-10).map((m) => ({
      rol: m.sender === 'user' ? 'user' : 'assistant',
      contenido: m.text,
    }));

    try {
      const response = await api.post('/coordinador/chat', {
        mensaje: currentInput,
      });
      const replyText = response.data?.respuesta || 'No pude generar una respuesta. Por favor, intenta de nuevo.';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 'Error al conectar con el asistente. Verifica la conexión.';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `⚠️ ${errorMsg}`,
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

  return (
    <div className="relative" ref={popoverRef}>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-sena-green text-white shadow-lg flex items-center justify-center hover:bg-sena-green-hover hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        title="Asistente de Coordinación"
      >
        <RiRobot2Line className="w-5 h-5" />
      </button>

      {/* Popover Chat */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-96 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl flex flex-col h-[480px] overflow-hidden animate-fade-in origin-bottom-right z-50 transition-all duration-200 transform scale-100 text-gray-900 dark:text-gray-100">
          
          {/* Header */}
          <div className="bg-[#407754] text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                <FiCpu className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider">Asistente STIMI</h4>
                <span className="text-[9px] text-green-200 font-bold uppercase tracking-wider block -mt-0.5">En línea</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
            {messages.map((msg) => {
              const isAss = msg.sender === 'assistant';
              return (
                <div 
                  key={msg.id}
                  className={`flex gap-2 max-w-[85%] ${isAss ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
                >
                  <div className="space-y-0.5">
                    <div className={`p-3 rounded-xl text-[11px] leading-relaxed ${
                      isAss 
                        ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-600 shadow-xs' 
                        : 'bg-[#407754] text-white rounded-tr-none'
                    }`}>
                      <p>{msg.text}</p>
                    </div>
                    <span className={`text-[8px] font-medium text-gray-400 dark:text-gray-500 block ${isAss ? 'text-left' : 'text-right'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex gap-2 max-w-[80%] self-start">
                <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl rounded-tl-none p-2.5 flex items-center gap-1 shadow-xs">
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            <button 
              onClick={() => handleQuickQuestion('¿Cuáles informes están pendientes?')}
              className="text-[9px] font-semibold bg-gray-50 dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-[#407754] dark:hover:text-emerald-400 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Pendientes
            </button>
            <button 
              onClick={() => handleQuickQuestion('¿Cuál es la tasa de cumplimiento?')}
              className="text-[9px] font-semibold bg-gray-50 dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-[#407754] dark:hover:text-emerald-400 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Cumplimiento
            </button>
            <button 
              onClick={() => handleQuickQuestion('¿Cómo descargo los formatos?')}
              className="text-[9px] font-semibold bg-gray-50 dark:bg-gray-700 hover:bg-green-50 dark:hover:bg-green-900/30 border border-gray-100 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-[#407754] dark:hover:text-emerald-400 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Formatos
            </button>
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Escribe tu consulta... (Enter)"
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#407754] transition-all"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-[#407754] hover:bg-[#335f43] text-white rounded-xl transition-all flex items-center justify-center shadow-xs cursor-pointer"
              >
                <FiSend className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
