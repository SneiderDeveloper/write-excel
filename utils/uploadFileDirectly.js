const { getBucket } = require('../utils/storageService')

const uploadFileDirectly = async (filePath, destination) => {
	try {
		const bucket = getBucket()
		await bucket.upload(filePath, {
			destination,
			metadata: {
				contentType: 'application/xlsx',
			}
		});
		console.log(`Archivo ${filePath} subido directamente a ${destination} en Cloud Storage.`)
	} catch (error) {
		console.error('Error al subir el archivo directamente:', error)
	}
}

module.exports = { uploadFileDirectly }