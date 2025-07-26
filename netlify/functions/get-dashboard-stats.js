// netlify/functions/get-dashboard-stats.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { subDays, startOfDay, endOfDay } = require('date-fns'); // Usaremos mais funções de data

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

    // 1. Recebemos o período de análise da URL. Se não for fornecido, usamos os últimos 30 dias como padrão.
    const { startDate: startDateStr, endDate: endDateStr } = event.queryStringParameters;

    let startDate, endDate;

    if (startDateStr && endDateStr) {
      startDate = startOfDay(new Date(startDateStr));
      endDate = endOfDay(new Date(endDateStr));
    } else {
      const today = new Date();
      endDate = endOfDay(today);
      startDate = startOfDay(subDays(today, 29)); // 30 dias incluindo hoje
    }

    // 2. Buscamos todos os agendamentos da barbearia no período definido
    const appointmentsRef = db.collection('barbershops').doc(barbershopId).collection('appointments');
    const appointmentsSnapshot = await appointmentsRef
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();
      
    // 3. Inicializamos as nossas métricas
    let totalAppointments = 0;
    let totalRevenue = 0;
    const serviceCounts = {};

    // 4. Processamos cada agendamento para calcular as estatísticas
    appointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.servicePrice && typeof data.servicePrice === 'number') {
        totalAppointments++;
        totalRevenue += data.servicePrice;

        if (data.serviceName) {
          serviceCounts[data.serviceName] = (serviceCounts[data.serviceName] || 0) + 1;
        }
      }
    });

    // 5. Ordenamos os serviços mais populares
    const popularServices = Object.entries(serviceCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5) // Pegamos o Top 5
      .map(([name, count]) => ({ name, count }));

    // 6. Montamos o objeto de resposta final
    const stats = {
      totalAppointments,
      totalRevenue,
      popularServices,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      }
    };

    return {
      statusCode: 200,
      body: JSON.stringify(stats)
    };

  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao gerar o relatório.' }) 
    };
  }
};
