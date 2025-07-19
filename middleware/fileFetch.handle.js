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
					error: 'The file could not be downloaded from the URL' 
				})
			}

			const contentType = response.headers.get('content-type')
			const urlPath = new URL(url).pathname
			const ext = path.extname(urlPath).toLowerCase()

			const allowedTypes = ['.csv', '.json', '.html']
			if (!allowedTypes.includes(ext)) {
				return res.status(400).json({ 
					error: 'Unsupported file type' 
				})
			}

			const arrayBuffer = await response.arrayBuffer()
			const buffer = Buffer.from(arrayBuffer)

			const originalname = path.basename(urlPath) || `file${ext}`
			const decodedName = decodeURIComponent(originalname)
			const blobName = `${path.basename(decodedName, path.extname(decodedName))}.xlsx`

			let userId = null
           if (req.body.url) {
				const urlObj = new URL(req.body.url)
				const pathSegments = urlObj.pathname.split('/').filter(segment => segment !== '')
				
				if (pathSegments.length >= 2) {
					userId = pathSegments[1]
				}
			}
            if (!userId) {
                return res.status(400).json({ 
                    error: 'User ID is required in the URL' 
                })
            }

            const blobPath = `${userId}/${blobName}`

			req.file = {
				buffer: buffer,
				originalname,
				filename: blobName,
				path: blobPath,
				mimetype: contentType,
				size: buffer.length
			}

			next()
		} catch (error) {
			console.error('Error processing URL:', error)
			return res.status(500).json({ 
				error: 'Error processing URL' 
			})
		}
	}
}

module.exports = fileFetch