const express = require('express')
const jsonToExcel = require('../middleware/jsonToExcel.handle')
const csvToExcel = require('../middleware/cvsToExcel.handle')
const csvToExcelWithXlsx = require('../middleware/cvsToExcelWithXLSX.handle')
const fileFetch = require('../middleware/fileFetch.handle')
const uploadFile = require('../middleware/uploadFile.handle')
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

			await uploadFileDirectly(filePath, filePathInStorage)

			try {
				const downloadUrl = await getDownloadUrlForFileDirect(filePathInStorage);
				res.json({ 
          message: 'Excel file created successfully', 
          downloadUrl 
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
    // Acepta archivos CSV, JSON
    const allowedTypes = ['.csv', '.json', '.html'];
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
  uploadFile(),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se recibió ningún archivo con extensión .csv, .json o .html'  
      })
    }

    try {
      const blobName = `${path.basename(req.file.originalname, path.extname(req.file.originalname))}.xlsx`

      try {
        
        const urlDownload = await getDownloadUrl(blobName)
        
        res.json({ 
          message: 'File processed and uploaded successfully to Azure Blob Storage',
          url: urlDownload,
          fileName: blobName
        })
        
      } catch (err) {
        console.error('Error al subir el archivo:', err)
        res.status(500).json({ 
          error: 'Error al subir el archivo a Azure Blob Storage' 
        })
      }
    } catch (error) {
      console.error('Error al procesar URL:', error)
      res.status(500).json({ 
        error: 'Error interno del servidor al procesar la URL' 
      })
    }
  }
)

router.post('/html', 
  upload.single('csvFile'),
  csvToExcelWithXlsx(),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se recibió ningún archivo CSV' 
      })
    }
    res.json({ 
      message: 'Archivo CSV recibido correctamente', 
      filePath: req.file.path 
    })
  }
)


router.post('/url', 
  fileFetch(),
  csvToExcel(),
  uploadFile(),
  async (req, res, next) => {
    try {
      const blobName = `${path.basename(req.file.originalname, path.extname(req.file.originalname))}.xlsx`

      try {
        
        const urlDownload = await getDownloadUrl(blobName)
        
        res.json({ 
          message: 'File processed and uploaded successfully to Azure Blob Storage',
          url: urlDownload,
          fileName: blobName
        })
        
      } catch (err) {
        console.error('Error al subir el archivo:', err)
        res.status(500).json({ 
          error: 'Error al subir el archivo a Azure Blob Storage' 
        })
      }
    } catch (error) {
      console.error('Error al procesar URL:', error)
      res.status(500).json({ 
        error: 'Error interno del servidor al procesar la URL' 
      })
    }
  }
)

module.exports = router