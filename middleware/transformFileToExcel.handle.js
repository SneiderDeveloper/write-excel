const ExcelJS = require('exceljs')
const { autoSizeColumns, processHTML, processLargeCSV } = require('../utils')

const getStyleConfigFromQuery = (query = {}) => {
  const defaultConfig = {
    header: {
      font: {},
      fill: {},
      alignment: {},
      border: {}
    },
    row: {
      font: {},
      fill: {},
      alignment: {},
      border: {}
    }
  }

  if (!Object.keys(query).length) return defaultConfig

  return Object.entries(query).reduce((config, [key, value]) => {
    try {
      config[key] = JSON.parse(value)
    } catch {
      config[key] = {}
    }
    return config
  }, { ...defaultConfig })
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
        let jsonData;
        try {
          jsonData = JSON.parse(jsonString);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid JSON file' });
        }

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const headers = Object.keys(jsonData[0]);
          worksheet.addRow(headers).eachCell((cell) => {
            Object.assign(cell, {
              font: { ...styleConfig.header.font },
              fill: { ...styleConfig.header.fill },
              alignment: { ...styleConfig.header.alignment },
              border: { ...styleConfig.header.border }
            });
          });

          jsonData.forEach((rowData, idx) => {
            const row = worksheet.addRow(headers.map(h => rowData[h]));
            row.eachCell((cell) => {
              Object.assign(cell, {
          font: { ...styleConfig.row.font },
          alignment: { ...styleConfig.row.alignment },
          border: { ...styleConfig.row.border },
          fill: (idx % 2 === 1) ? { ...styleConfig.row.fill } : cell.fill
              });
            });
          });
        } else {
          worksheet.addRow(['No data']);
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