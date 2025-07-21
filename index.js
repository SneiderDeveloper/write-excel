require('dotenv').config()
const express = require('express')
const routerApi = require('./routes/')
const validateIp = require('./middleware/validateIp.handle')
const cors = require('cors')


const app = express()

const PORT = process.env.PORT || 3001

const HOST_WHITELIST = process.env.HOST_WHITELIST 
  ? process.env.HOST_WHITELIST.split(',').map(host => host.trim())
  : []

const options = {
  origin: (origin, callback) => {
    if (HOST_WHITELIST.includes(origin) || !origin) callback(null, true)
      else callback(new Error('Origin not valid'))
  }
}

app.use(cors(options))
app.use(validateIp())
app.use(express.json())
app.get('/', (req, res) => {
  res.send('Excel API')
})
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
routerApi(app)
