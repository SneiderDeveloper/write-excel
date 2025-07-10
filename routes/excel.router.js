const express = require('express')
const validatorHandler = require('../middleware/validator.handler')

const router = express.Router()
const address = new AddressService

router.post('/',
    validatorHandler(createAddressSchema, 'body'),
    async (req, res, next) => {
        try {
            const { body } = req
            const data = await address.create(body)
            res.json(data)
        } catch (err) {
            next(err)
        }
    }
)

module.exports = router