const ExcelJS = require('exceljs')
const { autoSizeColumns, processHTML, processLargeCSV } = require('../utils')

const getStyleConfigFromQuery = (query) => {
  const styles = {}

  if (!query || Object.keys(query).length === 0) {
    return {
      header: {
        font: {},
        fill: {},
        alignment: {},
      },
      row: {
        font: {},
        fill: {},
        alignment: {},
        border: {}
      }
    }
  }
  Object.keys(query).forEach(key => {
    if (query[key]) {
      styles[key] = JSON.parse(query[key])
    }
  })

  return styles
}

function transformFileToExcel() {
  return async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      // Verificar tamaño del archivo
      const fileSizeMB = req.file.buffer.length / (1024 * 1024)
      const isLargeFile = fileSizeMB > 10 // Considerar grande si es > 10MB

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Sheet1')
      const fileExtension = req.file.originalname.toLowerCase()
      const isQuery = req.query && (Object.keys(req.query).length > 0)

      const styleConfig = getStyleConfigFromQuery(req.query)

      if (fileExtension.endsWith('.csv')) {
        await processLargeCSV(
          req.file.buffer, 
          worksheet, 
          styleConfig, 
          isQuery
        )  
      } else if (fileExtension.endsWith('.json')) {
        const jsonString = req.file.buffer.toString('utf8');
        const jsonData = JSON.parse(jsonString);
        
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const headers = Object.keys(jsonData[0]);
          const headerRow = worksheet.addRow(headers);
          
          // Añade data rows
          headerRow.eachCell((cell) => {
            cell.font = { 
              ...styleConfig.header.font
            }
            cell.fill = {
              ...styleConfig.header.fill
            }
            cell.alignment = { 
              ...styleConfig.header.alignment 
            }
            cell.border = {
              ...styleConfig.header.border
            }
          })

          jsonData.forEach((rowData, index) => {
            const values = headers.map(header => rowData[header]);
            const row = worksheet.addRow(values);
            
            row.eachCell((cell) => {
              cell.font = {
                ...styleConfig.row.font,
              }
              cell.alignment = { 
                ...styleConfig.row.alignment
              }
              cell.border = {
                ...styleConfig.row.border
              }
            })
            
            // Alternar colores de fila
            if (index % 2 === 1) {
              row.eachCell((cell) => {
                cell.fill = {
                  ...styleConfig.row.fill
                }
              })
            }
          })
        }
      } else if (fileExtension.endsWith('.html')) {
        processHTML(req.file.buffer, worksheet)
      } else {
        return res.status(400).json({ error: 'Unsupported file type' })
      }

      autoSizeColumns(worksheet)

      const buffer = await workbook.xlsx.writeBuffer()

      req.excelBuffer = buffer

      next()
    } catch (error) {
      return res.status(500).json({ error: `Error processing file: ${error}` });
    }
  }
}

module.exports = transformFileToExcel