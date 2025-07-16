const express = require('express')
const routerApi = require('./routes/')
const cors = require('cors')
const { initializeStorage } = require('./utils/storageService')

const app = express()

const PORT = process.env.PORT || 3001

const whitelist = [
  'http://localhost:3000',
  'https://excel-creator-adcma9dghyecbnc6.eastus2-01.azurewebsites.net',
  'https://h9d717s1-3001.use.devtunnels.ms'
]

const options = {
  origin: (origin, callback) => {
    if (whitelist.includes(origin) || !origin) callback(null, true)
      else callback(new Error('Origin not valid'))
  }
}

initializeStorage()
 
app.use(cors(options))
app.use(express.json())
app.get('/', (req, res) => {
  res.send('Excel API')
})
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
routerApi(app)
