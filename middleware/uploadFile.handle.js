const { initializeConnection } = require('../utils/azureBlobStorage')

function uploadFile() {
  return async (req, res, next) => {
    try {
      const { containerClient } = await initializeConnection()

      const blockBlobClient = containerClient.getBlockBlobClient(req.file.path)
      await blockBlobClient.uploadData(req.excelBuffer, {
          blobHTTPHeaders: {
              blobContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
      })
      next()
    } catch (error) {
      console.error('Error uploading file to Azure Blob Storage:', error)
      throw error; // Re-throw the error to be handled by the caller
    }
  }
}

module.exports = uploadFile