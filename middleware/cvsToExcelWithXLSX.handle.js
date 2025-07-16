const XLSX = require('xlsx')
const cheerio = require('cheerio')
// const XLSX = require('xlsx-style')

function csvToExcel() {
    return (req, res, next) => {
        try {
            const filePath = './output.xlsx';

            // Verifica que se haya subido un archivo
            if (!req.file || !req.file.buffer) {
                return res.status(400).json({ error: 'No CSV file uploaded' });
            }

            let workbook
            let worksheet
            const fileExtension = req.file.originalname.toLowerCase();

            if (fileExtension.endsWith('.csv')) {
                // Para CSV: lee directamente
                workbook = XLSX.read(req.file.buffer, { type: 'buffer' })

                // Toma la primera hoja del CSV
                const sheetName = workbook.SheetNames[0]
                worksheet = workbook.Sheets[sheetName]
            } else if (fileExtension.endsWith('.json')) {
                // Para JSON: convierte primero
                const jsonString = req.file.buffer.toString('utf8');
                const jsonData = JSON.parse(jsonString);
                
                // Crea worksheet desde JSON
                worksheet = XLSX.utils.json_to_sheet(jsonData);
            } else if (fileExtension.endsWith('.html')) {
                // Para HTML: parsea tablas
                const htmlString = req.file.buffer.toString('utf8');
                const $ = cheerio.load(htmlString);
                
                // Extrae datos de la primera tabla
                const tableData = [];
                $('table').first().find('tr').each((i, row) => {
                    const rowData = [];
                    $(row).find('td, th').each((j, cell) => {
                        rowData.push($(cell).text().trim());
                    });
                    if (rowData.length > 0) {
                        tableData.push(rowData);
                    }
                });
                
                if (tableData.length === 0) {
                    return res.status(400).json({ error: 'No table found in HTML' });
                }
                
                worksheet = XLSX.utils.aoa_to_sheet(tableData);
            } else {
                return res.status(400).json({ error: 'Unsupported file type' });
            }

            // Crea un nuevo libro de trabajo
            workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

            // Escribe el archivo Excel
            XLSX.writeFile(workbook, filePath);

            next();
        } catch (error) {
            return res.status(500).json({ error: 'Error processing file' });
        }
    }
}

module.exports = csvToExcel;