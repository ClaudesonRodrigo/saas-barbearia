// netlify/functions/handle-social-login.js

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (getApps().length === 0) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();
const authAdmin = getAuth();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const token = event.headers.authorization.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(token);
    const { uid, name, email } = decodedToken;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    // Se o usuário NÃO existir no nosso banco, é o primeiro login social dele.
    if (!userDoc.exists()) {
      console.log(`Novo usuário social detectado: ${email}. Criando perfil...`);
      
      // a. Define o papel 'client' de forma segura no backend
      await authAdmin.setCustomUserClaims(uid, { role: 'client' });

      // b. Cria o documento do perfil dele no Firestore
      await userRef.set({
        uid: uid,
        name: name || 'Usuário',
        email: email,
        role: 'client',
        createdAt: new Date(),
      });
      console.log(`Perfil para ${email} criado com o papel 'client'.`);
    } else {
      console.log(`Usuário social já existente: ${email}. Login normal.`);
    }

    const updatedUserRecord = await authAdmin.getUser(uid);
    const userRole = updatedUserRecord.customClaims.role || null;
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Login social bem-sucedido", role: userRole })
    };

  } catch (error) {
    console.error("Erro no login social:", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ message: 'Falha ao processar o login social.' }) 
    };
  }
};
