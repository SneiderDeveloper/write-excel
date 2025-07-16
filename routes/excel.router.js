const express = require('express')
const jsonToExcel = require('../middleware/jsonToExcel.handle')
const csvToExcel = require('../middleware/cvsToExcel.handle')
const fetchFile = require('../middleware/fetchFile.handle')
const { uploadFileDirectly } = require('../utils/uploadFileDirectly')
const { getDownloadUrlForFileDirect } = require('../utils/getDownloadUrlForFileDirect')
const multer = require('multer')
const path = require('path')
const { main, getDownloadUrl } = require('../utils/azureBlobStorage')

const router = express.Router()

router.post('/json',
	jsonToExcel(),
	async (req, res, next) => {
		try {
			const { body } = req
			const filePath = './output.xlsx'
			const filePathInStorage = 'documents/output.xlsx'

			await uploadFileDirectly(filePath, filePathInStorage)

			try {
				const downloadUrl = await getDownloadUrlForFileDirect(filePathInStorage);
				res.json({ message: 'Excel file created successfully', downloadUrl })
			} catch (error) {
				console.error('No se pudo generar la URL.');
			}
			
		} catch (err) {
			next(err)
		}
	}
)

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Acepta archivos CSV, JSON
    const allowedTypes = ['.csv', '.json'];
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado'), false)
    }
  }
})

router.post('/csv', 
  upload.single('csvFile'),
  csvToExcel(),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo CSV' })
    }
    res.json({ message: 'Archivo CSV recibido correctamente', filePath: req.file.path })
  }
)


router.post('/url', 
  fetchFile(),
  csvToExcel(),
  async (req, res, next) => {
    try {
      console.log('Archivo recibido desde URL:', req.file)

      const filePath = "../output.xlsx";
      const blobName = `${path.basename(req.file.originalname, path.extname(req.file.originalname))}.xlsx`

      try {
        await main(filePath, blobName);
        
        const urlDownload = await getDownloadUrl(blobName);
        
        res.json({ 
          message: 'Archivo procesado y subido exitosamente a Azure Blob Storage',
          url: urlDownload,
          fileName: blobName
        });
        
      } catch (err) {
        console.error('Error al subir el archivo:', err);
        res.status(500).json({ error: 'Error al subir el archivo a Azure Blob Storage' });
      }
    } catch (error) {
      console.error('Error al procesar URL:', error);
      res.status(500).json({ error: 'Error interno del servidor al procesar la URL' });
    }
  }
)

module.exports = router