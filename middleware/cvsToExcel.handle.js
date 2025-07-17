const ExcelJS = require('exceljs')
const cheerio = require('cheerio')

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

// Función para convertir colores CSS a formato ARGB
const convertColorToArgb = (color) => {
  if (!color) return 'FF000000'
  
  color = color.trim().toLowerCase()
  
  if (color.startsWith('#')) {
    const hex = color.substring(1)
    if (hex.length === 3) {
      return 'FF' + hex.split('').map(char => char + char).join('').toUpperCase()
    }
    if (hex.length === 6) {
      return 'FF' + hex.toUpperCase()
    }
  }
  
  const colorMap = {
    'red': 'FFFF0000', 'green': 'FF008000', 'blue': 'FF0000FF',
    'black': 'FF000000', 'white': 'FFFFFFFF', 'yellow': 'FFFFFF00',
    'gray': 'FF808080', 'grey': 'FF808080', 'orange': 'FFFFA500',
    'purple': 'FF800080', 'pink': 'FFFFC0CB', 'brown': 'FFA52A2A'
  }
  
  return colorMap[color] || 'FF000000'
}

// Función para parsear bordes CSS
const parseBorderStyle = (borderValue) => {
  if (!borderValue) return null
  
  const parts = borderValue.trim().split(/\s+/)
  const width = parts.find(part => /^\d+px$/.test(part)) || '1px'
  const style = parts.find(part => ['solid', 'dashed', 'dotted', 'double'].includes(part)) || 'solid'
  const color = parts.find(part => part.startsWith('#') || /^[a-z]+$/.test(part)) || 'black'
  
  const excelStyle = {
    thin: 'thin',
    medium: 'medium',
    thick: 'thick',
    solid: 'thin',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double'
  }
  
  return {
    style: excelStyle[style] || 'thin',
    color: { argb: convertColorToArgb(color) }
  }
}

// Función mejorada para aplicar estilos CSS a celdas
const applyCssToCell = (cell, cssStyle, isHeader = false) => {
  if (!cssStyle) return;
  
  const styles = {};
  
  // Limpiar y parsear el CSS
  const cssRules = cssStyle
    .split(';')
    .map(rule => rule.trim())
    .filter(rule => rule.includes(':'))
    .map(rule => {
      const colonIndex = rule.indexOf(':')
      const property = rule.substring(0, colonIndex).trim().toLowerCase();
      const value = rule.substring(colonIndex + 1).trim();
      return { property, value };
    });
  
  cssRules.forEach(({ property, value }) => {
    switch (property) {
      case 'font-weight':
        if (!styles.font) styles.font = {};
        styles.font.bold = value === 'bold' || parseInt(value) >= 600;
        break;
        
      case 'font-style':
        if (!styles.font) styles.font = {};
        styles.font.italic = value === 'italic';
        break;
        
      case 'text-decoration':
        if (!styles.font) styles.font = {};
        styles.font.underline = value.includes('underline');
        break;
        
      case 'font-size':
        if (!styles.font) styles.font = {};
        const fontSize = parseFloat(value);
        if (!isNaN(fontSize)) {
          styles.font.size = fontSize;
        }
        break;
        
      case 'font-family':
        if (!styles.font) styles.font = {};
        styles.font.name = value.replace(/['"]/g, '').split(',')[0].trim();
        break;
        
      case 'color':
        if (!styles.font) styles.font = {};
        styles.font.color = { argb: convertColorToArgb(value) };
        break;
        
      case 'background-color':
        styles.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: convertColorToArgb(value) }
        };
        break;
        
      case 'text-align':
        if (!styles.alignment) styles.alignment = {};
        const alignmentMap = {
          'left': 'left',
          'center': 'center',
          'right': 'right',
          'justify': 'justify'
        };
        styles.alignment.horizontal = alignmentMap[value] || value;
        break;
        
      case 'vertical-align':
        if (!styles.alignment) styles.alignment = {};
        const verticalMap = {
          'top': 'top',
          'middle': 'middle',
          'bottom': 'bottom'
        };
        styles.alignment.vertical = verticalMap[value] || 'middle';
        break;
        
      case 'border':
        const borderStyle = parseBorderStyle(value);
        if (borderStyle) {
          styles.border = {
            top: borderStyle,
            left: borderStyle,
            bottom: borderStyle,
            right: borderStyle
          };
        }
        break;
      case 'border-left':
        const side = property.split('-')[1];
        const sideStyle = parseBorderStyle(value);
        if (sideStyle) {
          if (!styles.border) styles.border = {};
          styles.border[side] = sideStyle;
        }
        break;
        
      case 'padding':
        if (!styles.alignment) styles.alignment = {};
        styles.alignment.indent = parseInt(value) || 0;
        break;
    }
  });
  
  Object.keys(styles).forEach(styleType => {
    if (styles[styleType] && Object.keys(styles[styleType]).length > 0) {
      cell[styleType] = { ...cell[styleType], ...styles[styleType] };
    }
  })
}

const processHTML = (buffer, worksheet) => {
  const $ = cheerio.load(buffer.toString('utf8'));
  let hasData = false;
  
  $('table').first().find('tr').each((rowIndex, row) => {
    const rowData = []
    const cellStyles = []
    const $row = $(row)
    const rowStyle = $row.attr('style')
    
    $row.find('td, th').each((colIndex, cell) => {
      const $cell = $(cell)
      const cellText = $cell.text().trim()
      const cellStyle = $cell.attr('style')
      const isHeader = $cell.is('th')
      
      let combinedStyle = ''
      if (rowStyle) combinedStyle += rowStyle
      if (cellStyle) {
        combinedStyle += (combinedStyle ? '; ' : '') + cellStyle
      }
      
      rowData.push(cellText);
      cellStyles.push({
        style: combinedStyle || null,
        isHeader
      });
    });
    
    if (rowData.length > 0) {
      hasData = true;
      const excelRow = worksheet.addRow(rowData);
      
      cellStyles.forEach(({ style, isHeader }, colIndex) => {
        const cell = excelRow.getCell(colIndex + 1);
        applyCssToCell(cell, style, isHeader);
      });
    }
  });
  
  if (!hasData) {
    throw new Error('No table data found in HTML');
  }
}

const autoSizeColumns = (worksheet) => {
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    })
    column.width = maxLength < 10 ? 10 : maxLength > 50 ? 50 : maxLength + 2;
  })
}

const applyStyleToCell = (row, style, index) => {

  if (index === 0) {
    row.eachCell((cell) => {
      if (style?.header?.font) {
        cell.font = { 
          ...style.header.font
        }
      }

      if (style?.header?.fill) {
        cell.fill = {
          ...style.header.fill
        }
      }

      if (style?.header?.alignment) {
        cell.alignment = { 
          ...style.header.alignment
        }
      }

      if (style?.header?.border) {
        cell.border = {
          ...style.header.border
        }
      }
    })
  } else {
    // Estilos para filas de datos
    row.eachCell((cell) => {
      if (style?.row?.font) {
        cell.font = { 
          ...style.row.font,
        }
      }

      if (style?.row?.alignment) {
        cell.alignment = { 
          ...style.row.alignment
        }
      }

      if (style?.row?.border) {
        cell.border = {
          ...style.row.border
        }
      }
    });
    
    // Alternar colores de fila
    if (index % 2 === 0) {
      row.eachCell((cell) => {
        if (style?.row?.fill) {
          cell.fill = {
            ...style.row.fill
          }
        }
      });
    }
  }
}

function csvToExcel() {
  return async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Sheet1')
      const fileExtension = req.file.originalname.toLowerCase()
      const isQuery = req.query && (Object.keys(req.query).length > 0)

      const styleConfig = getStyleConfigFromQuery(req.query)

      if (fileExtension.endsWith('.csv')) {

        const csvContent = req.file.buffer.toString('utf8')
        const lines = csvContent.split('\n').filter(line => line.trim())
        
        lines.forEach((line, index) => {
          const cells = line.split('\t')
          const row = worksheet.addRow(cells)

          if (isQuery) applyStyleToCell(row, styleConfig, index)
        });
          
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
        return res.status(400).json({ error: 'Unsupported file type' });
      }

      autoSizeColumns(worksheet)

      const buffer = await workbook.xlsx.writeBuffer();
      req.excelBuffer = buffer
      req.excelFileName = `${req.file.originalname.split('.')[0]}.xlsx`

      next()
    } catch (error) {
      return res.status(500).json({ error: `Error processing file: ${error}` });
    }
  }
}

module.exports = csvToExcel;