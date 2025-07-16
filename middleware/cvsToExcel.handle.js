const ExcelJS = require('exceljs');
const { Readable } = require('stream');

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

function csvToExcel() {
  return async (req, res, next) => {
    try {
      const filePath = './output.xlsx'

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');
      const fileExtension = req.file.originalname.toLowerCase();

      const styleConfig = getStyleConfigFromQuery(req.query);

      if (fileExtension.endsWith('.csv')) {
          // const stream = Readable.from(req.file.buffer);
          // await workbook.csv.read(stream, {
          //     delimiter: '\t',     // Usa tabulación como delimitador
          //     quote: '"',          // Comillas para valores que contienen delimitadores
          //     escape: '"',         // Carácter de escape
          //     headers: true        // Primera fila como headers
          // });

          const csvContent = req.file.buffer.toString('utf8');
          // console.log('CSV content:', csvContent);
          const lines = csvContent.split('\n').filter(line => line.trim());

          // console.log('CSV lines:', styleConfig.header.font)
          
          lines.forEach((line, index) => {
            const cells = line.split('\t');
            const row = worksheet.addRow(cells);

            // Estilos para la primera fila (headers)
            if (index === 0) {
              row.eachCell((cell) => {
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
            } else {
              // Estilos para filas de datos
              row.eachCell((cell) => {
                cell.font = { 
                  ...styleConfig.row.font,
                };
                cell.alignment = { 
                  ...styleConfig.row.alignment
                };
                cell.border = {
                  ...styleConfig.row.border
                };
              });
              
              // Alternar colores de fila
              if (index % 2 === 0) {
                row.eachCell((cell) => {
                  cell.fill = {
                    ...styleConfig.row.fill
                  };
                });
              }
            }
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
      } else {
        return res.status(400).json({ error: 'Unsupported file type' });
      }

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

      await workbook.xlsx.writeFile(filePath);

      next()
    } catch (error) {
      return res.status(500).json({ error: `Error processing file: ${error}` });
    }
  }
}

module.exports = csvToExcel;