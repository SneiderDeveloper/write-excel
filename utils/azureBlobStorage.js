const { BlobServiceClient } = require('@azure/storage-blob')

const AZURE_STORAGE_CONNECTION_STRING = "";
const CONTAINER = 'excel'
// const CONTAINER = 'agidev'

async function uploadFile(containerClient, filePath, blobName) {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blockBlobClient.uploadFile(filePath);
    console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId);
  } catch (error) {
    console.error('Error uploading file to Azure Blob Storage:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

async function getDownloadUrl(fileName) {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error obteniendo URL de descarga:', error);
    throw error;
  }
}

async function main(filePath, blobName) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER)
  await containerClient.createIfNotExists()

  await uploadFile(containerClient, filePath, blobName);
}

module.exports = {
  main,
  getDownloadUrl
}
   