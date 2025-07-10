const express = require('express')
const excel = require('./excel.router')

function routerApi(app) {
    const router = express.Router()

    app.use('/api/v1', router)
    router.use('/excel', excel)
}

module.exports = routerApi