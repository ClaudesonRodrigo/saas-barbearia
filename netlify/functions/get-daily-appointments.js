// netlify/functions/get-daily-appointments.js

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
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    // Usando o 'shopOwner' que descobrimos ser o correto
    const { role, barbershopId } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    const { date } = event.queryStringParameters;

    if (!date) {
      return { statusCode: 400, body: JSON.stringify({ message: "A data não foi fornecida." }) };
    }

    const selectedDayStart = fromZonedTime(`${date}T00:00:00`, TIME_ZONE);
    const selectedDayEnd = fromZonedTime(`${date}T23:59:59`, TIME_ZONE);
    
    // --- INÍCIO DAS CORREÇÕES ---

    // CORREÇÃO 1: Apontar para a coleção principal 'schedules'.
    const appointmentsRef = db.collection('schedules');
    const appointmentsSnapshot = await appointmentsRef
      // CORREÇÃO 2: Adicionar o filtro pelo ID da barbearia do dono.
      .where('barbershopId', '==', barbershopId)
      // CORREÇÃO 3: Usar o campo de data correto 'startTime'.
      .where('startTime', '>=', selectedDayStart)
      .where('startTime', '<=', selectedDayEnd)
      .orderBy('startTime', 'asc')
      .get();
      
    // --- FIM DAS CORREÇÕES ---

    if (appointmentsSnapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }

    const appointments = [];
    appointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      // CORREÇÃO 4: Usar 'startTime' para converter o fuso horário.
      const zonedDate = toZonedTime(data.startTime.toDate(), TIME_ZONE);
      
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
    console.error("Erro ao buscar agendamentos diários:", error);
    // Checagem de erro de índice do Firestore
    if (error.code === 'FAILED_PRECONDITION') {
        return { statusCode: 500, body: JSON.stringify({ message: "O banco de dados precisa de um índice para esta consulta. Verifique os logs da função no Netlify para obter o link de criação do índice." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar agendamentos.' }) 
    };
  }
};