const express = require('express')
const jsonToExcel = require('../middleware/jsonToExcel.handle')
const transformFileToExcel = require('../middleware/transformFileToExcel.handle')
const fileFetch = require('../middleware/fileFetch.handle')
const uploadFile = require('../middleware/uploadFile.handle')
const bufferFile = require('../middleware/bufferFile.handler')
const multer = require('multer')
const path = require('path')
const { getDownloadUrl } = require('../utils/azureBlobStorage')

const router = express.Router()

router.post('/json',
	jsonToExcel(),
	async (req, res, next) => {
		try {
			const { body } = req
			const filePath = './output.xlsx'
			const filePathInStorage = 'documents/output.xlsx'

			try {
				res.json({ 
          message: 'Excel file created successfully',
        })
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
    const allowedTypes = ['.csv', '.json', '.html'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado'), false);
    }
  }
})

router.post('/file',
  upload.single('file'),
  bufferFile(),
  transformFileToExcel(),
  uploadFile(),
  async (req, res, next) => {
    try {
      try {
        const urlDownload = await getDownloadUrl(req.file.filename)
        
        res.json({ 
          message: 'File processed and uploaded successfully to Azure Blob Storage',
          url: urlDownload,
          fileName: req.file.filename
        })
        
      } catch (err) {
        console.error('Error uploading file to Azure Blob Storage:', err)
        res.status(500).json({ 
          error: 'Error uploading file to Azure Blob Storage' 
        })
      }
    } catch (error) {
      console.error('Error processing URL:', error)
      res.status(500).json({ 
        error: 'Error processing URL' 
      })
    }
  }
)


router.post('/url', 
  fileFetch(),
  transformFileToExcel(),
  uploadFile(),
  async (req, res, next) => {
    try {
      try {
        const urlDownload = await getDownloadUrl(req.file.path)
        
        res.json({ 
          message: 'File processed and uploaded successfully to Azure Blob Storage',
          url: urlDownload,
          fileName: req.file.filename
        })
        
      } catch (err) {
        console.error('Error uploading file to Azure Blob Storage:', err)
        res.status(500).json({ 
          error: 'Error uploading file to Azure Blob Storage' 
        })
      }
    } catch (error) {
      console.error('Error processing URL:', error)
      res.status(500).json({ 
        error: 'Error processing URL' 
      })
    }
  }
)

module.exports = router