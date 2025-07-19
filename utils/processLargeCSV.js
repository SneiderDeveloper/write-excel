// Aplicar estilos de forma optimizada
const applyStylesOptimized = (worksheet, styleConfig, startRow, rowCount) => {
  // Aplicar estilos por rangos en lugar de celda por celda
  if (startRow === 1 && styleConfig.header) {
    // Estilo para header
    const headerRow = worksheet.getRow(1)
    headerRow.eachCell((cell) => {
      Object.assign(cell, {
        font: styleConfig.header.font || {},
        fill: styleConfig.header.fill || {},
        alignment: styleConfig.header.alignment || {},
        border: styleConfig.header.border || {}
      })
    })
  }
  
  // Estilos para filas de datos (aplicar en lotes)
  for (let i = Math.max(2, startRow); i < startRow + rowCount; i++) {
    const row = worksheet.getRow(i)
    if (styleConfig.row) {
      row.eachCell((cell) => {
        Object.assign(cell, {
          font: styleConfig.row.font || {},
          alignment: styleConfig.row.alignment || {},
          border: styleConfig.row.border || {}
        })
        
        // Alternar colores solo cuando sea necesario
        if (styleConfig.row.fill && (i - 2) % 2 === 1) {
          cell.fill = styleConfig.row.fill
        }
      })
    }
  }
}

const processLargeCSV = async (buffer, worksheet, styleConfig, isQuery) => {
  const csvContent = buffer.toString('utf8')
  const lines = csvContent.split('\n').filter(line => line.trim())
  
  const CHUNK_SIZE = 500 // Procesar 1000 filas a la vez
  const firstLine = lines[0] || ''
  const delimiter = firstLine.includes('\t') ? '\t' : ','
  
  for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
    const chunk = lines.slice(i, i + CHUNK_SIZE)
    
    // Procesar chunk
    const rows = chunk.map(line => {
      const cells = line.split(delimiter)
      return cells.map(cell => cell.replace(/^"|"$/g, '').trim())
    })
    
    // Añadir filas al worksheet
    worksheet.addRows(rows)
    
    // Aplicar estilos solo si es necesario y de forma optimizada
    if (isQuery && styleConfig) {
      const startRow = i + 1
      applyStylesOptimized(worksheet, styleConfig, startRow, rows.length)
    }

    // Log de progreso
    if (i % 1000 === 0) {
      console.log(`Processed ${i + CHUNK_SIZE} of ${lines.length} lines`)
    }
    
    // Liberar memoria periódicamente
    if (global.gc) {
      global.gc()
    }
  }
}

module.exports = { processLargeCSV }