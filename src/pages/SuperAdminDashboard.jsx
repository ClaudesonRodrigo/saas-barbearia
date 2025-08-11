// src/pages/SuperAdminDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createBarbershop, getBarbershops, updateBarbershop, deleteBarbershop } from '../services/barbershopService';
import styles from './SuperAdminDashboard.module.scss';

// Componente do Modal de Edição (Correto, com Status)
const EditModal = ({ shop, onClose, onSave }) => {
  const [name, setName] = useState(shop.name);
  const [status, setStatus] = useState(shop.status);

  const handleSave = (e) => {
    e.preventDefault();
    onSave(shop.id, { name, status });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Editar Barbearia</h2>
        <form onSubmit={handleSave}>
          <div className={styles.formGroup}>
            <label htmlFor="editShopName" className={styles.label}>Nome da Barbearia:</label>
            <input id="editShopName" type="text" value={name} onChange={(e) => setName(e.target.value)} className={styles.input}/>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="editStatus" className={styles.label}>Status:</label>
            <select id="editStatus" value={status} onChange={(e) => setStatus(e.target.value)} className={styles.input}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={`${styles.button} ${styles.buttonSecondary}`}>Cancelar</button>
            <button type="submit" className={styles.button}>Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const SuperAdminDashboard = () => {
  // Estados do formulário de criação - REMOVIDO OS ESTADOS DE ENDEREÇO
  const [shopName, setShopName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  
  // O resto dos estados permanece igual
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  // ... etc ...
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [shops, setShops] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const { currentUser } = useAuth();

  const fetchShops = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingShops(true);
    try {
      const token = await currentUser.getIdToken();
      const data = await getBarbershops(token);
      setShops(data);
    } catch (err) {
      setError("Falha ao carregar as barbearias: " + err.message);
    } finally {
      setIsLoadingShops(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchShops();
    }
  }, [fetchShops, currentUser]);
  
  const clearMessages = () => {
      setMessage('');
      setError('');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
    try {
      const token = await currentUser.getIdToken();
      
      // CORRIGIDO: Enviando apenas os dados essenciais que o Super Admin deve criar.
      // O campo 'location' agora será nulo ou indefinido por padrão.
      await createBarbershop({ shopName, ownerEmail, ownerPassword, location: { address: '', cep: '', referencePoint: ''} }, token);
      
      setMessage(`Barbearia "${shopName}" registrada com sucesso! O dono agora pode configurar os detalhes.`);
      
      // Limpando os campos do formulário
      setShopName('');
      setOwnerEmail('');
      setOwnerPassword('');
      fetchShops();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // As funções handleDelete, handleEdit e handleUpdate continuam iguais

  const handleDelete = async (shopId, shopName) => {
    if (window.confirm(`Tem certeza que deseja excluir a barbearia "${shopName}"? Esta ação é irreversível.`)) {
      clearMessages();
      try {
        const token = await currentUser.getIdToken();
        await deleteBarbershop(shopId, token);
        setMessage(`Barbearia "${shopName}" excluída com sucesso.`);
        fetchShops();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setIsModalOpen(true);
  };
  
  const handleUpdate = async (shopId, updates) => {
    clearMessages();
    try {
      const token = await currentUser.getIdToken();
      await updateBarbershop(shopId, updates, token);
      setMessage(`Barbearia "${updates.name}" atualizada com sucesso.`);
      setIsModalOpen(false);
      setEditingShop(null);
      fetchShops();
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className={styles.pageContainer}>
      {isModalOpen && editingShop && (
        <EditModal 
          shop={editingShop} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleUpdate} 
        />
      )}

      <header className={styles.header}>
        <h1>Painel Super Admin</h1>
      </header>

      {message && <div className={`${styles.messageArea} ${styles.success}`}>{message}</div>}
      {error && <div className={`${styles.messageArea} ${styles.error}`}>{error}</div>}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Registrar Nova Barbearia</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="shopName" className={styles.label}>Nome da Barbearia:</label>
            <input id="shopName" type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} required className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ownerEmail" className={styles.label}>E-mail do Dono:</label>
            <input id="ownerEmail" type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required className={styles.input} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ownerPassword" className={styles.label}>Senha Provisória do Dono:</label>
            <input id="ownerPassword" type="password" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} required className={styles.input} />
          </div>
          
          {/* CORRIGIDO: Campos de endereço removidos do formulário do Super Admin */}

          <button type="submit" disabled={isLoading} className={styles.button}>
            {isLoading ? 'A registrar...' : 'Registrar Barbearia'}
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Barbearias Registradas</h2>
        {isLoadingShops ? (
          <p>A carregar barbearias...</p>
        ) : (
          <ul className={styles.list}>
            {shops.length > 0 ? shops.map(shop => (
              <li key={shop.id} className={styles.listItem}>
                <div className={styles.itemInfo}>
                  <div className={styles.mainInfo}>
                    <span className={styles.itemName}>{shop.name}</span>
                    <span className={styles.itemStatus} data-status={shop.status}>{shop.status || 'active'}</span>
                  </div>
                  {/* A exibição dos detalhes continua aqui, pois o Super Admin precisa ver */}
                  <div className={styles.details}>
                    <span><strong>Email:</strong> {shop.ownerEmail}</span>
                    <span><strong>URL:</strong> /{shop.publicUrlSlug}</span>
                    {typeof shop.location === 'object' && shop.location && shop.location.address ? (
                      <>
                        <span><strong>Endereço:</strong> {shop.location.address}</span>
                        <span><strong>CEP:</strong> {shop.location.cep}</span>
                        {shop.location.referencePoint && <span><strong>Ponto de Ref.:</strong> {shop.location.referencePoint}</span>}
                      </>
                    ) : (
                      <span><strong>Local:</strong> (Não configurado pelo dono)</span>
                    )}
                    <span className={styles.itemId}>(ID: {shop.id})</span>
                  </div>
                </div>
                
                <div className={styles.itemActions}>
                  <button onClick={() => handleEdit(shop)} className={`${styles.button} ${styles.buttonIcon} ${styles.buttonEdit}`}>Editar</button>
                  <button onClick={() => handleDelete(shop.id, shop.name)} className={`${styles.button} ${styles.buttonIcon} ${styles.buttonDelete}`}>Excluir</button>
                </div>
              </li>
            )) : <p>Nenhuma barbearia registrada.</p>}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SuperAdminDashboard;