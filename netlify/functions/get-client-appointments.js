// netlify/functions/get-client-appointments.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { toZonedTime } = require('date-fns-tz');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();
const authAdmin = getAuth();

const TIME_ZONE = 'America/Sao_Paulo';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // --- LÓGICA DE SEGURANÇA ---
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { email } = decodedToken;

    // Apenas um 'client' (ou qualquer utilizador autenticado) pode ver os seus próprios agendamentos
    if (!email) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    // 1. Usamos uma 'collectionGroup' query para procurar em todas as subcoleções 'appointments'
    const appointmentsRef = db.collectionGroup('appointments');
    
    // 2. Filtramos os agendamentos pelo e-mail do cliente que está autenticado
    const appointmentsSnapshot = await appointmentsRef
      .where('clientEmail', '==', email)
      .orderBy('date', 'desc') // Ordena os agendamentos do mais recente para o mais antigo
      .get();
      
    if (appointmentsSnapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]), // Retorna uma lista vazia se não houver agendamentos
      };
    }

    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      const zonedDate = toZonedTime(data.date.toDate(), TIME_ZONE);
      
      appointments.push({
        id: doc.id,
        barbershopId: doc.ref.parent.parent.id, // Adicionamos o ID da barbearia
        clientName: data.clientName,
        serviceName: data.serviceName,
        // Adicionamos campos formatados para facilitar a vida do front-end
        formattedDate: `${String(zonedDate.getDate()).padStart(2, '0')}/${String(zonedDate.getMonth() + 1).padStart(2, '0')}/${zonedDate.getFullYear()}`,
        time: `${String(zonedDate.getHours()).padStart(2, '0')}:${String(zonedDate.getMinutes()).padStart(2, '0')}`
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(appointments)
    };

  } catch (error) {
    console.error("Erro ao buscar agendamentos do cliente:", error);
    // Se o erro for sobre um índice em falta, o Firestore irá informar-nos
    if (error.code === 9) { // FAILED_PRECONDITION
        return { statusCode: 500, body: JSON.stringify({ message: "O banco de dados precisa de um índice para esta consulta. Verifique os logs do back-end." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar os seus agendamentos.' }) 
    };
  }
};
