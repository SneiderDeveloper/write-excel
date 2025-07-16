const path = require('path')

function fileFetch() {
	return async (req, res, next) => {
		try {
			const { url } = req.body
						
			if (!url) {
				return res.status(400).json({ 
					error: 'URL es requerida' 
				})
			}

			const response = await fetch(url)
			
			if (!response.ok) {
				return res.status(400).json({ 
					error: 'No se pudo descargar el archivo desde la URL' 
				})
			}

			const contentType = response.headers.get('content-type')
			const urlPath = new URL(url).pathname
			const ext = path.extname(urlPath).toLowerCase()

			const allowedTypes = ['.csv', '.json']
			if (
				!allowedTypes.includes(ext) && 
				!contentType?.includes('csv') && 
				!contentType?.includes('json')
			) {
				return res.status(400).json({ 
					error: 'Tipo de archivo no soportado. Solo CSV y JSON' 
				})
			}

			const arrayBuffer = await response.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)

			req.file = {
				buffer: buffer,
				originalname: path.basename(urlPath) || `file${ext}`,
				mimetype: contentType || (ext === '.csv' ? 'text/csv' : 'application/json'),
				size: buffer.length
			}

			next()
		} catch (error) {
			console.error('Error al procesar la URL:', error)
			return res.status(500).json({ 
				error: 'Error al procesar la URL' 
			})
		}
	}
}

module.exports = fileFetch