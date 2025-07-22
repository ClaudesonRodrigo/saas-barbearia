// netlify/functions/get-daily-appointments.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth'); // 👈 1. Importação adicionada
const { fromZonedTime, toZonedTime } = require('date-fns-tz');

// Inicialização do Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();
const authAdmin = getAuth(); // 👈 2. Variável criada

const TIME_ZONE = 'America/Sao_Paulo';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // --- LÓGICA DE SEGURANÇA ---
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    // Pegamos a data da URL (query parameter), ex: ?date=2025-07-22
    const { date } = event.queryStringParameters;

    if (!date) {
      return { statusCode: 400, body: JSON.stringify({ message: "A data não foi fornecida." }) };
    }

    // Definimos o início e o fim do dia para a busca no Firestore
    const selectedDayStart = fromZonedTime(`${date}T00:00:00`, TIME_ZONE);
    const selectedDayEnd = fromZonedTime(`${date}T23:59:59`, TIME_ZONE);

    // Buscamos os agendamentos na subcoleção correta, filtrando pelo intervalo de data
    const appointmentsRef = db.collection('barbershops').doc(barbershopId).collection('appointments');
    const appointmentsSnapshot = await appointmentsRef
      .where('date', '>=', selectedDayStart)
      .where('date', '<=', selectedDayEnd)
      .orderBy('date', 'asc') // Ordena os agendamentos do mais cedo para o mais tarde
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
      // Convertemos a data UTC do banco para o fuso horário de São Paulo para exibição
      const zonedDate = toZonedTime(data.date.toDate(), TIME_ZONE);
      
      appointments.push({
        id: doc.id,
        ...data,
        // Adicionamos um campo formatado para facilitar a vida do front-end
        time: `${String(zonedDate.getHours()).padStart(2, '0')}:${String(zonedDate.getMinutes()).padStart(2, '0')}`
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(appointments)
    };

  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar agendamentos.' }) 
    };
  }
};
