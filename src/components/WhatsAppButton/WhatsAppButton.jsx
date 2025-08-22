import React from 'react';
import styles from './WhatsAppButton.module.scss';

const WhatsAppIcon = () => (
  <svg height="24" width="24" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.75 13.96c.25.13.42.3.52.49.13.23.14.49.12.74-.03.32-.19.61-.43.85-.23.23-.52.38-.85.42-.33.04-.66-.02-1-.15-.42-.16-1.32-.56-2.47-1.42a8.88 8.88 0 01-2.9-2.43c-.47-.63-.8-1.33-1-2.04-.15-.43-.19-.8-.13-1.18.06-.38.25-.72.52-1 .27-.27.6-.42.95-.42.15 0 .3.02.43.06.26.08.5.24.67.45l.48.64c.15.21.23.46.23.71 0 .24-.07.48-.21.7l-.42.49c-.11.13-.17.3-.17.48 0 .17.06.34.17.49l.42.49c.5.58 1.13 1.12 1.82 1.55l.49.31c.16.1.34.16.53.16.19 0 .38-.05.54-.15l.49-.28.12-.07c.21-.13.46-.17.7-.13.24.03.48.15.65.33l.28.28zM12 2a10 10 0 100 20 10 10 0 000-20z" />
  </svg>
);

const WhatsAppButton = ({ phoneNumber, message }) => {
  if (!phoneNumber) {
    return null;
  }

  // --- LÓGICA MELHORADA AQUI ---
  let finalPhoneNumber = phoneNumber.replace(/\D/g, ''); // Limpa o número de tudo que não for dígito

  // Se o número limpo não começar com 55 (código do Brasil), nós o adicionamos.
  if (!finalPhoneNumber.startsWith('55')) {
    finalPhoneNumber = `55${finalPhoneNumber}`;
  }
  // --- FIM DA LÓGICA MELHORADA ---

  const whatsappUrl = `https://wa.me/${finalPhoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a 
      href={whatsappUrl} 
      className={styles.whatsappButton} 
      target="_blank" 
      rel="noopener noreferrer"
      aria-label="Contatar no WhatsApp"
    >
      <WhatsAppIcon />
    </a>
  );
};

export default WhatsAppButton;