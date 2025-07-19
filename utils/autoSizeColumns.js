const autoSizeColumns = (worksheet) => {
  const maxRows = 100 // Solo muestrear las primeras 100 filas para calcular ancho
  
  worksheet.columns.forEach((column, colIndex) => {
    let maxLength = 10
    
    // Muestrear solo algunas filas para calcular el ancho
    for (let rowIndex = 1; rowIndex <= Math.min(maxRows, worksheet.rowCount); rowIndex++) {
      const cell = worksheet.getCell(rowIndex, colIndex + 1)
      if (cell.value) {
        const length = cell.value.toString().length
        maxLength = Math.max(maxLength, length)
      }
    }
    
    column.width = Math.min(maxLength + 2, 50)
  })
}

module.exports = { autoSizeColumns }