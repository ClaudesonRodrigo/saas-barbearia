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
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { uid } = decodedToken;

    if (!uid) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }

    // CORRIGIDO: Buscando na coleção 'schedules' pelo 'clientId'
    const appointmentsRef = db.collection('schedules');
    const appointmentsSnapshot = await appointmentsRef
      .where('clientId', '==', uid)
      .orderBy('startTime', 'desc')
      .get();
      
    if (appointmentsSnapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }

    const appointments = [];
    for (const doc of appointmentsSnapshot.docs) {
      const data = doc.data();
      const shopDoc = await db.collection('barbershops').doc(data.barbershopId).get();
      const shopName = shopDoc.exists ? shopDoc.data().name : 'Barbearia Desconhecida';
      
      const zonedDate = toZonedTime(data.startTime.toDate(), TIME_ZONE);
      
      appointments.push({
        id: doc.id,
        barbershopId: data.barbershopId,
        barbershopName: shopName,
        clientName: data.clientName,
        serviceName: data.serviceName,
        formattedDate: `${String(zonedDate.getDate()).padStart(2, '0')}/${String(zonedDate.getMonth() + 1).padStart(2, '0')}/${zonedDate.getFullYear()}`,
        time: `${String(zonedDate.getHours()).padStart(2, '0')}:${String(zonedDate.getMinutes()).padStart(2, '0')}`
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(appointments)
    };

  } catch (error) {
    console.error("Erro ao buscar agendamentos do cliente:", error);
    if (error.code === 9) {
        return { statusCode: 500, body: JSON.stringify({ message: "O banco de dados precisa de um índice para esta consulta. Verifique os logs do back-end." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar os seus agendamentos.' }) 
    };
  }
};
