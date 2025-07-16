const { BlobServiceClient } = require('@azure/storage-blob')

const AZURE_STORAGE_CONNECTION_STRING = "";
const CONTAINER = 'excel'
// const AZURE_STORAGE_CONNECTION_STRING = ""
// const CONTAINER = 'agione'

const initializeConnection = async () => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER)
  await containerClient.createIfNotExists()

  return { 
    blobServiceClient,
    containerClient
  }
}

async function uploadFile(buffer, blobName) {
  try {
    const { containerClient } = await initializeConnection()
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    await blockBlobClient.uploadFile(buffer)
  } catch (error) {
    console.error('Error uploading file to Azure Blob Storage:', error)
    throw error; // Re-throw the error to be handled by the caller
  }
}

async function getDownloadUrl(fileName) {
  try {
    const { containerClient } = await initializeConnection()
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error obteniendo URL de descarga:', error);
    throw error;
  }
}

module.exports = {
  initializeConnection,
  uploadFile,
  getDownloadUrl
}
   