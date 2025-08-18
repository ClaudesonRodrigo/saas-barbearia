// netlify/functions/get-dashboard-stats.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { subDays, startOfDay, endOfDay } = require('date-fns');

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
    // --- LÓGICA DE SEGURANÇA (Mantida igual) ---
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { role, barbershopId } = decodedToken;

    if (role !== 'shopOwner' || !barbershopId) {
      return { statusCode: 403, body: JSON.stringify({ message: "Acesso negado." }) };
    }
    // --- FIM DA LÓGICA DE SEGURANÇA ---

    // 1. Recebemos o período de análise da URL (Lógica mantida igual)
    const { startDate: startDateStr, endDate: endDateStr } = event.queryStringParameters;

    let startDate, endDate;

    if (startDateStr && endDateStr) {
      startDate = startOfDay(new Date(startDateStr));
      endDate = endOfDay(new Date(endDateStr));
    } else {
      const today = new Date();
      endDate = endOfDay(today);
      startDate = startOfDay(subDays(today, 29));
    }

    // --- INÍCIO DAS CORREÇÕES ---

    // 2. Buscamos todos os agendamentos na coleção correta ('schedules')
    // CORREÇÃO 1: Apontar para a coleção principal 'schedules'.
    const appointmentsRef = db.collection('schedules');
    const appointmentsSnapshot = await appointmentsRef
      // CORREÇÃO 2: Adicionar o filtro pelo ID da barbearia do dono.
      .where('barbershopId', '==', barbershopId)
      // CORREÇÃO 3: Usar o campo de data correto 'startTime'.
      .where('startTime', '>=', startDate)
      .where('startTime', '<=', endDate)
      .get();
      
    // --- FIM DAS CORREÇÕES ---
      
    // 3. Inicializamos as nossas métricas (Lógica mantida igual)
    let totalAppointments = 0;
    let totalRevenue = 0;
    const serviceCounts = {};

    // 4. Processamos cada agendamento para calcular as estatísticas (Lógica mantida igual)
    appointmentsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Adicionamos uma verificação para garantir que o agendamento tem um preço
      if (data.servicePrice && typeof data.servicePrice === 'number') {
        totalAppointments++;
        totalRevenue += data.servicePrice;

        // Usamos o array de serviços para uma contagem mais precisa
        if (data.services && Array.isArray(data.services)) {
            data.services.forEach(service => {
                serviceCounts[service.name] = (serviceCounts[service.name] || 0) + 1;
            });
        }
      }
    });

    // 5. Ordenamos os serviços mais populares (Lógica mantida igual)
    const popularServices = Object.entries(serviceCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5) // Pegamos o Top 5
      .map(([name, count]) => ({ name, count }));

    // 6. Montamos o objeto de resposta final (Lógica mantida igual)
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
    // Verificação de erro de índice do Firestore
    if (error.code === 'FAILED_PRECONDITION') {
        return { statusCode: 500, body: JSON.stringify({ message: "O banco de dados precisa de um índice para esta consulta. Verifique os logs da função no Netlify para obter o link de criação do índice." }) };
    }
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao gerar o relatório.' }) 
    };
  }
};