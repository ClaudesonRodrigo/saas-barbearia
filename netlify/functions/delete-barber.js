// netlify/functions/delete-barber.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();
const authAdmin = getAuth();

exports.handler = async function(event, context) {
  // Esta função só aceita requisições DELETE
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // --- LÓGICA DE SEGURANÇA ---
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    // Apenas um 'shopOwner' pode apagar um barbeiro da sua própria loja
    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    // Pegamos o ID do barbeiro que queremos apagar (que é o UID do utilizador)
    const barberIdToDelete = event.path.split("/").pop();

    if (!barberIdToDelete) {
      return { statusCode: 400, body: JSON.stringify({ message: "ID do barbeiro não fornecido." }) };
    }

    // 1. Apagamos o registo do barbeiro na subcoleção 'barbers'
    const barberRef = db.collection('barbershops').doc(barbershopId).collection('barbers').doc(barberIdToDelete);
    await barberRef.delete();

    // 2. Apagamos o utilizador do Firebase Authentication para revogar o seu acesso
    await authAdmin.deleteUser(barberIdToDelete);
    
    // 3. (Opcional, mas recomendado) Apagamos o registo da coleção geral 'users'
    const userRef = db.collection('users').doc(barberIdToDelete);
    await userRef.delete();

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: 'Barbeiro excluído com sucesso!' }) 
    };

  } catch (error) {
    console.error("Erro ao excluir barbeiro:", error);
    if (error.code === 'auth/user-not-found') {
        return { statusCode: 404, body: JSON.stringify({ message: "Utilizador do barbeiro não encontrado para exclusão." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao excluir o barbeiro.' }) 
    };
  }
};
