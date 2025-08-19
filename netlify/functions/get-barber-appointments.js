// netlify/functions/get-barber-appointments.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { fromZonedTime, toZonedTime } = require('date-fns-tz');

// 1. Inicialização do Firebase Admin (padrão)
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
    return { statusCode: 405, body: JSON.stringify({ message: 'Método não permitido' }) };
  }

  try {
    // 2. Segurança: Verificamos o token para saber quem é o barbeiro.
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    // Pegamos o 'role' e o 'uid' do barbeiro logado.
    const { role, uid: barberId } = decodedToken; 

    // Apenas um usuário com o papel 'barber' pode ver sua própria agenda.
    if (role !== 'barber') {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado. Apenas para barbeiros." }) };
    }
    
    // 3. Pegamos a data da URL (ex: ?date=2025-08-20)
    const { date } = event.queryStringParameters;
    if (!date) {
      return { statusCode: 400, body: JSON.stringify({ message: "A data não foi fornecida." }) };
    }

    // Definimos o início e o fim do dia para a consulta.
    const selectedDayStart = fromZonedTime(`${date}T00:00:00`, TIME_ZONE);
    const selectedDayEnd = fromZonedTime(`${date}T23:59:59`, TIME_ZONE);

    // 4. A Consulta Corrigida
    const appointmentsRef = db.collection('schedules'); // Buscando na coleção correta!
    const appointmentsSnapshot = await appointmentsRef
      // O filtro principal: apenas agendamentos deste barbeiro.
      .where('barberId', '==', barberId) 
      .where('startTime', '>=', selectedDayStart)
      .where('startTime', '<=', selectedDayEnd)
      .orderBy('startTime', 'asc') // Ordena por horário
      .get();
      
    if (appointmentsSnapshot.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify([]),
      };
    }

    // 5. Formatamos os dados para enviar ao frontend.
    const appointments = appointmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        const zonedDate = toZonedTime(data.startTime.toDate(), TIME_ZONE);
        
        return {
            id: doc.id,
            clientName: data.clientName,
            serviceName: data.serviceName,
            serviceDuration: data.serviceDuration,
            time: `${String(zonedDate.getHours()).padStart(2, '0')}:${String(zonedDate.getMinutes()).padStart(2, '0')}`
        };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(appointments)
    };

  } catch (error) {
    console.error("Erro ao buscar agendamentos do barbeiro:", error);
    if (error.code === 'FAILED_PRECONDITION') {
        return { statusCode: 500, body: JSON.stringify({ message: "O banco de dados precisa de um índice para esta consulta." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao buscar seus agendamentos.' }) 
    };
  }
};