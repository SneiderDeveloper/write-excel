const XLSX = require('xlsx')
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