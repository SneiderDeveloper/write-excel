const XLSX = require('xlsx');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const { ats, agione } = require('./model.js')

const filePath = './output.xlsx';
const filePathInStorage = 'documents/output.xlsx';

const agioneTurned = agione.map(item => item.calendar.title.slice(2).replace(/\D/g, ''))

const data = ats.filter(item => !agioneTurned.includes(String(item.flight_number)))

const filter_data = data.map(item => { 
    return {
        flight_number: item.flight_number,
        carrier_code: item.carrier_code,
        carrier_name: item.carrier_name,
        flight_type: item.flight_type,
        eqp_type: item.eqp_type,
        flight_status: item.flight_status,
        sch_dep_time: item.sch_dep_time,
        sch_arr_time: item.sch_arr_time,
        dep_port_code: item.dep_port_code,
        dep_city_code: item.dep_city_code,
        dep_country_code: item.dep_country_code,
        arr_port_code: item.arr_port_code,
        arr_country_code: item.arr_country_code,
        aircraft_type: item.aircraft_type,
        creation_date: item.creation_date,
        last_update_date: item.last_update_date,
        run_date: item.run_date
    }
})

// Convierte los datos a hoja de trabajo
let worksheet = XLSX.utils.json_to_sheet(filter_data);

// Crea un nuevo libro de trabajo
let workbook = XLSX.utils.book_new();

// Agrega la hoja de trabajo al libro de trabajo
XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

// Escribe el libro de trabajo a un archivo
XLSX.writeFile(workbook, filePath);

// Asegúrate de que esta ruta apunte a tu archivo de clave de servicio
const storage = new Storage({
  projectId: 'briefcase-a80cf', // Tu Project ID de Firebase/Google Cloud
  keyFilename: './keyfile.json' // Ruta a tu archivo de clave de servicio
});

// Referencia a tu bucket
const myBucket = storage.bucket('briefcase-a80cf.appspot.com');

console.log({ myBucket })

async function uploadFileDirectly() {

  try {
    await myBucket.upload(filePath, {
      destination: filePathInStorage,
      metadata: {
        contentType: 'application/xlsx',
      }
    });
    console.log(`Archivo ${filePath} subido directamente a ${filePathInStorage} en Cloud Storage.`);
  } catch (error) {
    console.error('Error al subir el archivo directamente:', error);
  }
}

// Llama a la función
uploadFileDirectly();


async function getDownloadUrlForFileDirect(filePathInStorage) {
  try {
    const file = myBucket.file(filePathInStorage);

    const signedUrlOptions = {
      action: 'read',
      expires: '03-09-2491', 
    };

    const [url] = await file.getSignedUrl(signedUrlOptions);

    console.log(`URL de descarga para ${filePathInStorage}: ${url}`);
    return url;

  } catch (error) {
    console.error('Error al obtener la URL de descarga directamente:', error);
    throw error;
  }
}

// --- Ejemplo de uso ---
(async () => {
  try {
    const downloadUrl = await getDownloadUrlForFileDirect(filePathInStorage);
    console.log('¡Aquí tienes la URL para compartir tu archivo!', downloadUrl);
  } catch (error) {
    console.error('No se pudo generar la URL.');
  }
})();


