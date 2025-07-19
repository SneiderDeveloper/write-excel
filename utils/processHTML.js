const cheerio = require('cheerio')
const { applyCssToCell } = require('./applyCssToCell')

const processHTML = (buffer, worksheet) => {
  const $ = cheerio.load(buffer.toString('utf8'));
  let hasData = false;
  
  $('table').first().find('tr').each((rowIndex, row) => {
    const rowData = [];
    const cellStyles = [];
    const $row = $(row);
    const rowStyle = $row.attr('style'); // Obtener estilos del <tr>
    
    $row.find('td, th').each((colIndex, cell) => {
      const $cell = $(cell);
      const cellText = $cell.text().trim();
      const cellStyle = $cell.attr('style');
      const isHeader = $cell.is('th');
      
      // Combinar estilos del row y de la celda
      let combinedStyle = '';
      if (rowStyle) combinedStyle += rowStyle;
      if (cellStyle) {
        combinedStyle += (combinedStyle ? '; ' : '') + cellStyle;
      }
      
      rowData.push(cellText);
      cellStyles.push({
        style: combinedStyle || null,
        isHeader
      });
    });
    
    if (rowData.length > 0) {
      hasData = true
      const excelRow = worksheet.addRow(rowData);
      
      cellStyles.forEach(({ style, isHeader }, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1)
        applyCssToCell(cell, style, isHeader)
      })
    }
  });
  
  if (!hasData) {
    throw new Error('No table data found in HTML')
  }
}

module.exports = { processHTML }