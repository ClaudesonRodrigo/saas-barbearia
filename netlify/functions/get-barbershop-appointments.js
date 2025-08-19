// netlify/functions/get-barbershop-appointments.js

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
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const ownerUid = decodedToken.uid;

    // 1. Encontrar a barbearia que pertence ao dono logado
    const shopQuery = await db.collection('barbershops').where('ownerId', '==', ownerUid).limit(1).get();

    if (shopQuery.empty) {
      return { statusCode: 404, body: JSON.stringify({ message: "Nenhuma barbearia associada a este usuário." }) };
    }
    const barbershopId = shopQuery.docs[0].id;

    // 2. Buscar todos os agendamentos para ESSA barbearia
    const appointmentsRef = db.collection('schedules');
    const appointmentsSnapshot = await appointmentsRef
      .where('barbershopId', '==', barbershopId)
      .orderBy('startTime', 'asc') // Ordenar do mais antigo para o mais novo
      .get();
      
    if (appointmentsSnapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }

    // 3. Formatar e retornar os dados
    const appointments = appointmentsSnapshot.docs.map(doc => {
      const data = doc.data();
      const zonedDate = toZonedTime(data.startTime.toDate(), TIME_ZONE);
      
      return {
        id: doc.id,
        clientName: data.clientName, // Informação crucial para o dono
        serviceName: data.serviceName,
        formattedDate: `${String(zonedDate.getDate()).padStart(2, '0')}/${String(zonedDate.getMonth() + 1).padStart(2, '0')}/${zonedDate.getFullYear()}`,
        time: `${String(zonedDate.getHours()).padStart(2, '0')}:${String(zonedDate.getMinutes()).padStart(2, '0')}`
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(appointments)
    };

  } catch (error) {
    console.error("Erro ao buscar agendamentos da barbearia:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar os agendamentos da barbearia.' }) 
    };
  }
};