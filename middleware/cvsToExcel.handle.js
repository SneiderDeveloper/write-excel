const ExcelJS = require('exceljs');
const { Readable } = require('stream');

const getStyleConfigFromQuery = (query) => {
    const styles = {}
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
            const filePath = './output.xlsx';

            console.log('Processing CSV to Excel...', req.query);

            if (!req.file || !req.file.buffer) {
                return res.status(400).json({ error: 'No CSV file uploaded' });
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sheet1');
            const fileExtension = req.file.originalname.toLowerCase();

            const styleConfig = getStyleConfigFromQuery(req.query);

            if (fileExtension.endsWith('.csv')) {
                // Para CSV: lee directamente con workbook.csv.read
                // const stream = Readable.from(req.file.buffer);
                // await workbook.csv.read(stream, {
                //     delimiter: '\t',     // Usa tabulación como delimitador
                //     quote: '"',          // Comillas para valores que contienen delimitadores
                //     escape: '"',         // Carácter de escape
                //     headers: true        // Primera fila como headers
                // });

                const csvContent = req.file.buffer.toString('utf8');
                const lines = csvContent.split('\n').filter(line => line.trim());
                
                lines.forEach((line, index) => {
                    const cells = line.split('\t');
                    const row = worksheet.addRow(cells);

                    // Estilos para la primera fila (headers)
                    if (index === 0) {
                        row.eachCell((cell) => {
                            cell.font = { 
                                ...styleConfig.font
                            };
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: '4472C4' }
                            };
                            cell.alignment = { 
                                vertical: 'middle', 
                                horizontal: 'center' 
                            };
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                        });
                    } else {
                        // Estilos para filas de datos
                        row.eachCell((cell) => {
                            cell.font = { size: 10 };
                            cell.alignment = { 
                                vertical: 'middle',
                                wrapText: true
                            };
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                        });
                        
                        // Alternar colores de fila
                        if (index % 2 === 0) {
                            row.eachCell((cell) => {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: { argb: 'F2F2F2' }
                                };
                            });
                        }
                    }
                });
                
            } else if (fileExtension.endsWith('.json')) {
                const jsonString = req.file.buffer.toString('utf8');
                const jsonData = JSON.parse(jsonString);
                
                if (Array.isArray(jsonData) && jsonData.length > 0) {
                    // Añade headers
                    const headers = Object.keys(jsonData[0]);
                    worksheet.addRow(headers);
                    
                    // Añade data rows
                    jsonData.forEach(row => {
                        const values = headers.map(header => row[header]);
                        worksheet.addRow(values);
                    });
                }
            } else {
                return res.status(400).json({ error: 'Unsupported file type' });
            }

            // Escribe el archivo Excel
            await workbook.xlsx.writeFile(filePath);

            next();
        } catch (error) {
            return res.status(500).json({ error: 'Error processing file' });
        }
    }
}

module.exports = csvToExcel;