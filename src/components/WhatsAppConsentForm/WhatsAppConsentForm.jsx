// src/components/WhatsAppConsentForm/WhatsAppConsentForm.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext'; 
import { updateClientWhatsappInfo } from '../../services/clientService';
import styles from './WhatsAppConsentForm.module.scss';

const WhatsAppConsentForm = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!consentChecked) {
      setError("Você precisa aceitar os termos para receber lembretes.");
      return;
    }

    setIsLoading(true);
    try {
      const token = await currentUser.getIdToken();

      // --- LÓGICA DE FORMATAÇÃO DO NÚMERO ---
      // 1. Limpa tudo que não for número do input do usuário.
      const cleanedNumber = whatsappNumber.replace(/\D/g, '');
      // 2. Garante que o número final sempre comece com +55.
      const finalNumber = `+55${cleanedNumber}`;
      // --- FIM DA LÓGICA ---

      const dataToUpdate = {
        whatsappNumber: finalNumber, // Salva o número já formatado
        wantsWhatsappReminders: consentChecked
      };

      const response = await updateClientWhatsappInfo(dataToUpdate, token);
      setSuccess(response.message);
    } catch (err) {
      setError(err.message || "Ocorreu uma falha ao salvar seu número.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <p className={styles.successMessage}>✅ {success}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3>Lembretes no WhatsApp</h3>
      <p className={styles.subtitle}>Gostaria de receber um lembrete grátis um dia antes do seu agendamento?</p>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="whatsappNumber">Seu número do WhatsApp (com DDD)</label>
          <div className={styles.whatsappInputContainer}>
            <span className={styles.countryCode}>+55</span>
            <input
              id="whatsappNumber"
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder=" (XX) XXXXX-XXXX"
              required
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.checkboxGroup}>
          <input
            id="consent"
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            required
            className={styles.checkbox}
          />
          <label htmlFor="consent">Sim, aceito receber lembretes sobre meus agendamentos via WhatsApp.</label>
        </div>
        
        {error && <p className={styles.errorMessage}>{error}</p>}

        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar e Receber Lembretes'}
        </button>
      </form>
    </div>
  );
};

export default WhatsAppConsentForm;