const express = require('express')
const jsonToExcel = require('../middleware/jsonToExcel.handle')
const { uploadFileDirectly } = require('../utils/uploadFileDirectly')
const { getDownloadUrlForFileDirect } = require('../utils/getDownloadUrlForFileDirect')

const router = express.Router()

router.post('/',
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

module.exports = router