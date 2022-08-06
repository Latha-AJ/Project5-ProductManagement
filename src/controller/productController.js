const productModel = require("../models/productModel");
const mongoose = require("mongoose")
const validator = require("../validator/validation")
const { uploadFile } = require("../aws/awsConnect")
const jwt = require("jsonwebtoken");
mongoose.Schema.Types.Boolean.convertToFalse.add('');

//============================================================Product Creation=====================================================

const createProduct = async function (req, res) {
    try {
        let data = req.body

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = data

        if (!validator.isValidRequest(data))
            return res.status(400).send({ status: false, message: "Enter Product Details " }) //it should not be blank

        //productImage validation
        let productImage = req.files
        if (!validator.isValidImage(productImage[0].originalname))
            return res.status(400).send({ status: false, msg: "Give valid Image File" })

        if (!(productImage && productImage.length)) {
            return res.status(400).send({ status: false, message: " Please Provide The Product Image" });
        }
        const uploadedproductImage = await uploadFile(productImage[0])
        data.productImage = uploadedproductImage

        //Title Validation
        if (!validator.isValidString(title))
            return res.status(400).send({ status: false, message: "Title Is Required" }) // it should be string
        if (!validator.isValidTitle(title))
            return res.status(400).send({ status: false, message: "Enter Valid Title" })

        //checking uniqueness of title
        let title1 = await productModel.find({ title: title })
        if (title1.length > 0) return res.status(400).send({ status: false, message: "Title Is Already Exist" })

        //Description validation
        if (!validator.isValidString(description))
            return res.status(400).send({ status: false, message: "Description Is Required " }) // it should be string
        if (!validator.isvalidStreet(description))
            return res.status(400).send({ status: false, message: "Enter Valid Description " })

        //Price Validation
        if (!validator.isValidNumbers(price))
            return res.status(400).send({ status: false, message: "Price Is Required And Must Be In Numbers" }) // it should be string
        if (!validator.isValidPrice(price))
            return res.status(400).send({ status: false, message: "Enter Valid Price" })

        //currencyId validation
        if (!validator.isValidString(currencyId))
            return res.status(400).send({ status: false, message: "Currency Id is Required " })

        if (currencyId !== "INR") return res.status(400).send({ status: false, message: "Currency Id Must Be INR" })

        //currencyFormat validation
        if (!validator.isValidString(currencyFormat))
            return res.status(400).send({ status: false, message: "Currency Format is Required " })

        if (currencyFormat !== "₹") return res.status(400).send({ status: false, message: "Currency Format Must Be ₹" })

        //isFreeShipping validation
        if (isFreeShipping) {
            if (!validator.isBoolean(isFreeShipping))
                return res.status(400).send({ status: false, message: "IsFreeShipping Must Be Boolean value" })
            console.log(isFreeShipping)
        }

        //STYLE VALIDATION
        if (!validator.isValidString(style))
            return res.status(400).send({ status: false, message: "Style Is Required " }) // it should be string
        if (!validator.isValidTitle(style))
            return res.status(400).send({ status: false, message: "Enter Valid style " })

        //isAvailableSize validation
        if (!availableSizes || availableSizes === undefined) return res.status(400).send({ status: false, message: "Available Size Is Required" })
        if (!validator.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: "Enter Valid Size" })
        data.availableSizes = availableSizes.toUpperCase().split(",").map(x => x.trim())

        //installments Validation
        if (installments) {
            if (!validator.isValidNumbers(installments))
                return res.status(400).send({ status: false, message: "Installment Is Required And Must Be In Numbers" })
            if (!validator.isValidPrice(installments))
                return res.status(400).send({ status: false, message: "Enter installment" })
        }

        //isDeleted validation
        if (isDeleted) {
            if (!validator.isBoolean(isDeleted))
                return res.status(400).send({ status: false, message: "isDeleted Must Be A Boolean Value" })
        }

        let saveData = await productModel.create(data)
        return res.status(201).send({ status: true, message: 'Success', data: saveData })
    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}

// --------------------------------------------------------get products------------------------------------------------------------------------
const getProducts = async function (req, res) {
    try {
        let data = req.query
        let { size, name, priceLessThan, priceGreaterThan } = data
        let productData = { isDeleted: false }

        if (size) { productData.availableSizes = { $in: size.toUpperCase().split(",").map(x => x.trim()) } }
        if (priceLessThan && priceGreaterThan) { productData.price = { $gt: priceGreaterThan, $lt: priceLessThan } }
        if (priceLessThan && !priceGreaterThan) { productData.price = { $lt: priceLessThan } }
        if (priceGreaterThan && !priceLessThan) { productData.price = { $gt: priceGreaterThan } }

        if (name) {
            product = await productModel.find({ productData, title: new RegExp(name, 'i') }).sort({ price: 1 }) //,{price: {$gt: gt}}
            if (product.length == 0) return res.status(404).send({ status: false, message: "Product Not Found." })
            return res.status(200).send({ status: true, message: "Successful", data: product })
        }

        let productsByFilter = await productModel.find(productData).sort({ price: 1 })
        if (productsByFilter.length == 0) return res.status(404).send({ status: false, message: "No Data Found" })
        res.status(200).send({ status: true, message: "Successful", data: productsByFilter })

    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}



// ==========================================================Get Products BY Id=======================================================

const getProductsById = async function (req, res) {
    try {
        let productId = req.params.productId

        //productId validation
        var isValid = mongoose.Types.ObjectId.isValid(productId)

        if (!isValid) return res.status(400).send({ status: false, message: "Enter Valid Product Id" })


        let productsDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productsDetails) {
            return res.status(404).send({ status: false, message: "Product Not Found" })
        } else {
            return res.status(200).send({ status: true, message: "Success", data: productsDetails })
        }
    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}


//------------------------------------------------------------------UPDATE API-----------------------------------------------------------------
const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        var isValid = mongoose.Types.ObjectId.isValid(productId)
        if (!isValid) return res.status(400).send({ status: false, message: "Enter Valid Id" })


        let data = req.body
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = data


        if (!validator.isValidRequest(data))
            return res.status(400).send({ status: false, message: "Enter Product Details " }) //it should not be blank

        //title validation
        if (title) {
            if (!validator.isValidString(title))
                return res.status(400).send({ status: false, message: "Title Is Required " }) // it should be string

            if (!validator.isValidTitle(title))
                return res.status(400).send({ status: false, message: "Enter Valid title " })
        }

        //description validation
        if (description) {
            if (!validator.isValidString(description))
                return res.status(400).send({ status: false, message: "Description Is Required " }) // it should be string

            if (!validator.isValidStreet(description))
                return res.status(400).send({ status: false, message: "Enter Valid Description " })
        }

        //Price Validation
        if (price) {
            if (!validator.isValidNumbers(price))
                return res.status(400).send({ status: false, message: "Price Is Required And Must Be In Numbers" }) // it should be string
            if (!validator.isValidPrice(price))
                return res.status(400).send({ status: false, message: "Enter Valid Price" })
        }

        //currency Id validation
        if (currencyId) {
            if (!validator.isValidString(currencyId))
                return res.status(400).send({ status: false, message: "Currency Id is Required " })

            if (currencyId !== "INR") return res.status(400).send({ status: false, message: "Currency Id Must Be INR" })
        }

        //currencyFormat validation
        if (currencyFormat) {
            if (!validator.isValidString(currencyFormat))
                return res.status(400).send({ status: false, message: "Currency Id Is Required " })

            if (currencyId !== "₹") return res.status(400).send({ status: false, message: "Currency Format Must Be ₹" })
        }

        //isFreeShipping validation
        if (isFreeShipping) {
            if (!validator.isBoolean(isFreeShipping))
                return res.status(400).send({ status: false, message: "IsFreeShipping Must Be Boolean value" })

        }


        //style validation
        if (style) {
            if (!validator.isValidString(style))
                return res.status(400).send({ status: false, message: "Style Is Required " }) // it should be string

            if (!validator.isValidName(style))
                return res.status(400).send({ status: false, message: "Enter Valid style" })
        }

        //productImage validation
        let productImage = req.files
        if (productImage.length) {
            if (!productImage.length) return res.status(400).send({ status: false, message: " Please Provide The Product Image" });
            if (!validator.isValidImage(productImage[0].originalname)) return res.status(400).send({ status: false, message: "Give valid Image File" })

            let uploadedProfileImage = await uploadFile(productImage[0])
            data.productImage = uploadedProfileImage
        }

        //isAvailableSize validation
        if (availableSizes) { 
            console.log(!availableSizes.isEmpty())
            if( availableSizes.isEmpty() ) return res.status(400).send({ status: false, message: "Enter atleast One Size" })
            if (!validator.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: "Enter Valid Size" })
            data.availableSizes = availableSizes.toUpperCase().split(",").map(x => x.trim())
           
        }

        //installments Validation
        if (installments) {
            if (!validator.isValidNumbers(installments))
                return res.status(400).send({ status: false, message: "Installment Is Required And Must Be In Numbers" })
            if (!validator.isValidPrice(installments))
                return res.status(400).send({ status: false, message: "Enter installment" })
        }


        //isDeleted validation
        if (isDeleted) {
            if (!validator.isBoolean(isDeleted))
                return res.status(400).send({ status: false, message: "isDeleted Must Be A Boolean Value" })
        }

        let updateData = await productModel.findByIdAndUpdate({ _id: productId, isDeleted: false }, data, { new: true })
        if (!updateData) return res.status(404).send({ status: true, message: "Product Not Found" })
        return res.status(200).send({ status: true, message: "Updated  Successfully", data: updateData })

    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}




//=========================================================DELETE PRODUCTS BY ID============================================

const delProductsById = async function (req, res) {
    try {
        let productId = req.params.productId
        var isValid = mongoose.Types.ObjectId.isValid(productId)
        if (!isValid) return res.status(400).send({ status: false, message: "Enter Valid Product Id" })
        let productsDetails = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() }, { new: true })
        if (!productsDetails) {
            return res.status(404).send({ status: false, message: "Product Not Found" })
        } else {
            return res.status(200).send({ status: true, message: "Successfully Deleted" })
        }
    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}

module.exports = { createProduct, getProducts, getProductsById, delProductsById, updateProduct }
