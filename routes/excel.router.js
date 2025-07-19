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
    // Acepta archivos CSV, JSON, HTML
    const allowedTypes = ['.csv', '.json', '.html'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado'), false);
    }
  }
});

// Middleware para guardar el archivo en buffer y agregar propiedades personalizadas a req.file
const bufferFileHandler = () => {
  return (req, res, next) => {
    if (!req.file) return next();
  
    const { originalname, buffer, mimetype } = req.file;
    const ext = path.extname(originalname).toLowerCase();
    const blobName = Date.now() + '-' + originalname;
    const blobPath = 'uploads/' + blobName;
    const contentType = mimetype;
  
    req.file = {
      buffer: buffer,
      originalname,
      filename: blobName,
      path: blobPath,
      mimetype: contentType || (ext === '.csv' ? 'text/csv' : 'application/json'),
      size: buffer.length
    };
  
    next();
  }
};

router.post('/file', 
  bufferFileHandler(),
  csvToExcel(),
  uploadFile(),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No se recibió ningún archivo con extensión .csv, .json o .html'  
      })
    }

    try {
      try {
        const urlDownload = await getDownloadUrl(req.file.filename)
        
        res.json({ 
          message: 'File processed and uploaded successfully to Azure Blob Storage',
          url: urlDownload,
          fileName: req.file.filename
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
      try {
        const urlDownload = await getDownloadUrl(req.file.path)
        
        res.json({ 
          message: 'File processed and uploaded successfully to Azure Blob Storage',
          url: urlDownload,
          fileName: req.file.filename
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