// src/components/WhatsAppConsentForm/WhatsAppConsentForm.jsx

import React, { useState } from 'react';
// CORREÇÃO APLICADA AQUI
import { useAuth } from '../../contexts/AuthContext'; 
import { updateClientWhatsappInfo } from '../../services/clientService';
import styles from './WhatsAppConsentForm.module.scss';

const WhatsAppConsentForm = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  
  // Estados para feedback ao usuário
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
      const dataToUpdate = {
        whatsappNumber: whatsappNumber,
        wantsWhatsappReminders: consentChecked
      };

      const response = await updateClientWhatsappInfo(dataToUpdate, token);
      setSuccess(response.message);
      // Desabilita o formulário após o sucesso para não enviar de novo
    } catch (err) {
      setError(err.message || "Ocorreu uma falha ao salvar seu número.");
    } finally {
      setIsLoading(false);
    }
  };

  // Se já tivermos uma mensagem de sucesso, mostramos apenas ela.
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
          <label htmlFor="whatsappNumber">Seu número do WhatsApp</label>
          <input
            id="whatsappNumber"
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+55 (XX) XXXXX-XXXX"
            required
            className={styles.input}
          />
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