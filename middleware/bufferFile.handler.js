const path = require('path')

const bufferFileHandler = () => {
  return (req, res, next) => {
    console.log('Buffer file handler middleware called', req.file)
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No files with the extension .csv, .json, or .html were received.'  
      })
    }
  
    const { originalname, buffer, mimetype } = req.file
    const decodedName = decodeURIComponent(originalname)
    const blobName = `${path.basename(decodedName, path.extname(decodedName))}.xlsx`
    const blobPath = blobName
    const contentType = mimetype
  
    req.file = {
      buffer: buffer,
      originalname,
      filename: blobName,
      path: blobPath,
      mimetype: contentType,
      size: buffer.length
    }

    console.log('req', req.file)
  
    next()
  }
}

module.exports = bufferFileHandler