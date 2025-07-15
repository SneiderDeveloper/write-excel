const express = require('express')
const jsonToExcel = require('../middleware/jsonToExcel.handle')
const csvToExcel = require('../middleware/cvsToExcel.handle')
const { uploadFileDirectly } = require('../utils/uploadFileDirectly')
const { getDownloadUrlForFileDirect } = require('../utils/getDownloadUrlForFileDirect')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

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

// Configuración de almacenamiento para archivos CSV
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
// 	const uploadsDir = './uploads/'
// 	if (!fs.existsSync(uploadsDir)) {
// 		fs.mkdirSync(uploadsDir, { recursive: true })
// 	}
//     cb(null, uploadsDir)
//   },
//   filename: (req, file, cb) => {
//     cb(null, `uploaded${path.extname(file.originalname)}`)
//     // cb(null, `uploaded-${Date.now()}${path.extname(file.originalname)}`)
//   }
// })

// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
//       cb(null, true)
//     } else {
//       cb(new Error('Solo se permiten archivos CSV'))
//     }
//   }
// })

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Acepta archivos CSV, JSON
    const allowedTypes = ['.csv', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado'), false);
    }
  }
});

// Ruta para recibir archivo CSV
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

module.exports = router