const XLSX = require('xlsx')

function jsonToExcel() {
    return (req, res, next) => {
      const filePath = './output.xlsx';

      const { body } = req

      const leaves = body?.leaves || []

      if (leaves.length === 0) {
        return res.status(400).json({ error: 'No data provided' })
      }

      if (!Array.isArray(leaves)) {
        return res.status(400).json({ error: 'Data should be an array' })
      }

      // Crea un nuevo libro de trabajo
      const workbook = XLSX.utils.book_new()

      leaves.forEach((leaves, index) => {
        // Convierte los datos a hoja de trabajo
        const worksheet = XLSX.utils.json_to_sheet(leaves?.data)
        XLSX.utils.book_append_sheet(workbook, worksheet, leaves?.name || `Sheet${index}`)
      })

      // Escribe el libro de trabajo a un archivo
      XLSX.writeFile(workbook, filePath)

      next()
    }
}

module.exports = jsonToExcel