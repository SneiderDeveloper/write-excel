const XLSX = require('xlsx')
// const { ats, agione } = require('../model.js')

function jsonToExcel() {
    return (req, res, next) => {
      const filePath = './output.xlsx';

      // const agioneTurned = agione.map(item => item.calendar.title.slice(2).replace(/\D/g, ''))

      // const data = ats.filter(item => !agioneTurned.includes(String(item.flight_number)))

      // const filter_data = data.map(item => { 
      // return {
      //   flight_number: item.flight_number,
      //   carrier_code: item.carrier_code,
      //   carrier_name: item.carrier_name,
      //   flight_type: item.flight_type,
      //   eqp_type: item.eqp_type,
      //   flight_status: item.flight_status,
      //   sch_dep_time: item.sch_dep_time,
      //   sch_arr_time: item.sch_arr_time,
      //   dep_port_code: item.dep_port_code,
      //   dep_city_code: item.dep_city_code,
      //   dep_country_code: item.dep_country_code,
      //   arr_port_code: item.arr_port_code,
      //   arr_country_code: item.arr_country_code,
      //   aircraft_type: item.aircraft_type,
      //   creation_date: item.creation_date,
      //   last_update_date: item.last_update_date,
      //   run_date: item.run_date
      // }
      // })

      const { body } = req

      const leaves = body?.leaves || []

      if (leaves.length === 0) {
        return res.status(400).json({ error: 'No data provided' })
      }

      if (!Array.isArray(leaves)) {
        return res.status(400).json({ error: 'Data should be an array' })
      }

      // Crea un nuevo libro de trabajo
      const workbook = XLSX.utils.book_new()

      leaves.forEach((leaves, index) => {
        // Convierte los datos a hoja de trabajo
        const worksheet = XLSX.utils.json_to_sheet(leaves?.data)
        XLSX.utils.book_append_sheet(workbook, worksheet, leaves?.name || `Sheet${index}`)
      })

      // Escribe el libro de trabajo a un archivo
      XLSX.writeFile(workbook, filePath)

      next()
    }
}

module.exports = jsonToExcel