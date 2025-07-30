// src/services/cloudinaryService.js

const SIGNATURE_ENDPOINT = '/.netlify/functions/generate-upload-signature';

/**
 * Pede ao nosso back-end uma assinatura segura para o upload.
 * @param {string} token O token de autenticação do utilizador.
 * @returns {Promise<object>} Os dados da assinatura (signature, timestamp, etc.).
 */
export const getUploadSignature = async (token) => {
  try {
    const response = await fetch(SIGNATURE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Falha ao obter assinatura de upload.');
    }
    return data;
  } catch (error) {
    console.error("Erro no serviço getUploadSignature:", error);
    throw error;
  }
};

/**
 * Envia a imagem diretamente para o Cloudinary usando a assinatura segura.
 * @param {File} file O ficheiro da imagem a ser enviado.
 * @param {object} signatureData Os dados da assinatura obtidos do nosso back-end.
 * @param {function} onProgress Callback para acompanhar o progresso do upload.
 * @returns {Promise<string>} A URL segura da imagem no Cloudinary.
 */
export const uploadToCloudinary = (file, signatureData, onProgress) => {
  return new Promise((resolve, reject) => {
    const { signature, timestamp, apiKey, cloudName } = signatureData;
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    // Acompanha o progresso do upload
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          console.error("Erro no upload para o Cloudinary:", xhr.responseText);
          reject('Falha ao enviar a imagem para o Cloudinary.');
        }
      }
    };
    
    xhr.send(formData);
  });
};
