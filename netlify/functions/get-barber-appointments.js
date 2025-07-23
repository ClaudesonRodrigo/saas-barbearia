// netlify/functions/get-barber-appointments.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { fromZonedTime, toZonedTime } = require('date-fns-tz');

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
    // Verificamos o token do Barbeiro para saber quem ele é
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId, uid } = decodedToken; // uid é o ID do próprio barbeiro

    // Apenas um 'barber' pode ver a sua própria agenda
    if (role !== 'barber' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    const { date } = event.queryStringParameters;

    if (!date) {
      return { statusCode: 400, body: JSON.stringify({ message: "A data não foi fornecida." }) };
    }

    const selectedDayStart = fromZonedTime(`${date}T00:00:00`, TIME_ZONE);
    const selectedDayEnd = fromZonedTime(`${date}T23:59:59`, TIME_ZONE);

    // A busca agora tem um filtro extra: where('barberId', '==', uid)
    const appointmentsRef = db.collection('barbershops').doc(barbershopId).collection('appointments');
    const appointmentsSnapshot = await appointmentsRef
      .where('date', '>=', selectedDayStart)
      .where('date', '<=', selectedDayEnd)
      .where('barberId', '==', uid) // Filtra apenas os agendamentos deste barbeiro
      .orderBy('date', 'asc')
      .get();
      
    if (appointmentsSnapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }

    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      const zonedDate = toZonedTime(data.date.toDate(), TIME_ZONE);
      
      appointments.push({
        id: doc.id,
        ...data,
        time: `${String(zonedDate.getHours()).padStart(2, '0')}:${String(zonedDate.getMinutes()).padStart(2, '0')}`
      });
    });

    return {
      statusCode: 200,
      body: JSON.stringify(appointments)
    };

  } catch (error) {
    console.error("Erro ao buscar agendamentos do barbeiro:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar agendamentos.' }) 
    };
  }
};
