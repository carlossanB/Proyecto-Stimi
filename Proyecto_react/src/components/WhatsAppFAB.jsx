import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function WhatsAppFAB({ sizeClass = "w-14 h-14 shadow-xl", iconSizeClass = "w-7 h-7" }) {
  const { t } = useTranslation();
  
  const handleClick = () => {
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '573213779356';
    window.open(`https://wa.me/${whatsappNumber}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className={`rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer text-white bg-[#25D366] dark:bg-[#128C7E] hover:bg-[#20ba5a] dark:hover:bg-[#0e7569] ${sizeClass}`}
      title={t('common.whatsappSupport', 'Soporte WhatsApp')}
    >
      <FaWhatsapp className={iconSizeClass} />
    </button>
  );
}
