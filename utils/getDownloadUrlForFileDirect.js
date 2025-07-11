const { getBucket } = require('../utils/storageService')

const getDownloadUrlForFileDirect = async (filePathInStorage) => {
  try {
    const bucket = getBucket()
    const file = bucket.file(filePathInStorage);

    const signedUrlOptions = {
      action: 'read',
      expires: '03-09-2491', 
    }

    const [url] = await file.getSignedUrl(signedUrlOptions)

    return url
  } catch (error) {
    console.error('Error al obtener la URL de descarga directamente:', error);
    throw error;
  }
}

module.exports = { getDownloadUrlForFileDirect }