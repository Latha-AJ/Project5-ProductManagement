const productModel = require("../models/productModel");
const mongoose = require("mongoose")
const validator = require("../validator/validation")
const { uploadFile } = require("../aws/awsConnect")
const jwt = require("jsonwebtoken");

//product creation
const createProduct = async function (req, res) {
    let data = req.body
    let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = data
    
    if (!validator.isValidRequest(data))
        return res.status(400).send({ status: false, msg: "Enter Product Details " }) //it should not be blank
        // isFreeShipping = JSON.parse(data.isFreeShipping)
        console.log(isFreeShipping)
        let productImage = req.files

        // if(!validator.isValidImage(productImage))
        // return res.status(400).send({status:false, msg:"Give valid Image File"})
    
        if (!(productImage && productImage.length)) {
            return res.status(400).send({ status: false, message: " Please Provide The Product Image" });
        }
        const uploadedproductImage = await uploadFile(productImage[0])
        data.productImage = uploadedproductImage

    //Title Validation
    if (!validator.isValidString(title))
        return res.status(400).send({ status: false, msg: "Title Is Required" }) // it should be string
    if (!validator.isValidTitle(title))
        return res.status(400).send({ status: false, msg: "Enter Valid Title" })

    let title1=await productModel.find({title:title})
    if(title1)return res.status(400).send({status:false, message:"Title Is Already Exist"})



    //Description validation
    if (!validator.isValidString(description))
        return res.status(400).send({ status: false, msg: "Description Is Required " }) // it should be string
    if (!validator.isvalidStreet(description))
        return res.status(400).send({ status: false, msg: "Enter Valid Description " })

    //Price Validation
    // if(!validator.isValidNumber(price))
    // return res.status(400).send({status:false, msg:"Price Is Required "}) // it should be string
    if (!validator.isValidPrice(price))
        return res.status(400).send({ status: false, msg: "Enter Valid Price " })

        
    if (!validator.isValidString(currencyId))
        return res.status(400).send({ status: false, msg: "Currency Id is Required " })

    if (currencyId !== "INR") return res.status(400).send({ status: false, msg: "Currency Id Must Be INR" })


    //currencyFormat validation

    if (!validator.isValidString(currencyFormat))
        return res.status(400).send({ status: false, msg: "Currency Format is Required " })

    if (currencyFormat !== "₹") return res.status(400).send({ status: false, msg: "Currency Format Must Be ₹" })


   


    if (!validator.isValidSize(availableSizes))
        return res.status(400).send({ status: false, msg: "Enter Valid Size" })



    // isFreeShipping validation
    // if (isFreeShipping) {
    //     if (!validator.isBoolean(isFreeShipping))
    //         return res.status(400).send({ status: false, msg: "IsFreeShipping Must Be Boolean value" })

    // }

    // if (typeof isFreeShipping !== "boolean") { return res.status(400).send({ status: false, msg: "Free Shipping should contain a boolean value" }) }

    //STYLE VALIDATION
    if (!validator.isValidString(style))
        return res.status(400).send({ status: false, msg: "Style Is Required " }) // it should be string
    if (!validator.isValidTitle(style))
        return res.status(400).send({ status: false, msg: "Enter Valid style " })

    //isDeleted validation
    if (isDeleted) {
        if (!validator.isBoolean(isDeleted))
            return res.status(400).send({ status: false, msg: "isDeleted Must Be A Boolean Value" })
    }
        // console.log(data)
    let saveData = await productModel.create(data)
    return res.status(201).send({ status: true, message: 'Success', data: saveData })
}

// --------------------------------------------------------get products------------------------------------------------------------------------
const getProducts = async function (req, res) {
    let data = req.query
    let { size, name, priceLessThan, priceGreaterThan } = data
    console.log(name)
    let productData = { isDeleted: false }

    // if(size){productData.availableSizes ={availableSizes:{$in: ["x","XL"]}}
    if (name) { productData.title = name }
    if (priceLessThan && priceGreaterThan) { productData.price = { $gt: priceGreaterThan, $lt: priceLessThan } }
    if (priceLessThan && !priceGreaterThan) { productData.price = { $lt: priceLessThan } }
    if (priceGreaterThan && !priceLessThan) { productData.price = { $gt: priceGreaterThan } }
    // if(!priceSort) return res.status(400).send({status:false,message:""})
    console.log(productData)
    // console.log(priceLessThan)
    let productsByFilter = await productModel.find(productData).sort({ price: 1 })
    if (productsByFilter.length == 0) return res.status(404).send({ status: false, message: "No Data Found" })
    res.status(200).send({ status: true, data: productsByFilter })


}

// Get Products BY Id
const getProductsById = async function (req, res) {
    let productId = req.params.productId
    var isValid = mongoose.Types.ObjectId.isValid(productId)
    if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Product Id" })
    let productsDetails = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!productsDetails) {
        return res.status(404).send({ status: false, message: "Product Not Found" })
    } else {
        return res.status(200).send({ status: true, message: "Success", data: productsDetails })
    }
}


//put API
const updateProduct = async function (req, res) {
    let productId = req.params.productId

    var isValid = mongoose.Types.ObjectId.isValid(productId)
    if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Id" })


    let data = req.body
    let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = data


    if (!validator.isValidRequest(data))
        return res.status(400).send({ status: false, msg: "Enter User Details " }) //it should not be blank

    //title validation
    if (title) {
        if (!validator.isValidString(title))
            return res.status(400).send({ status: false, msg: "Title Is Required " }) // it should be string

        if (!validator.isValidTitle(title))
            return res.status(400).send({ status: false, msg: "Enter Valid title " })
    }

    //description validation
    if (description) {
        if (!validator.isValidString(description))
            return res.status(400).send({ status: false, msg: "Description Is Required " }) // it should be string

        if (!validator.isValidStreet(description))
            return res.status(400).send({ status: false, msg: "Enter Valid Description " })
    }

    //price validation
    // if(!validator.isValidNumber(price))
    // return res.status(400).send({status:false, msg:"title Name Is Required "}) 

    if (currencyId) {
        if (!validator.isValidString(currencyId))
            return res.status(400).send({ status: false, msg: "Currency Id is Required " })

        if (currencyId !== "INR") return res.status(400).send({ status: false, msg: "Currency Id Must Be INR" })
    }

    //currencyFormat validation
    if (currencyFormat) {
        if (!validator.isValidString(currencyFormat))
            return res.status(400).send({ status: false, msg: "Currency Id Is Required " })

        if (currencyId !== "₹") return res.status(400).send({ status: false, msg: "Currency Format Must Be ₹" })
    }

    //style validation
    if (style) {
        if (!validator.isValidString(style))
            return res.status(400).send({ status: false, msg: "Style Is Required " }) // it should be string

        if (!validator.isValidName(style))
            return res.status(400).send({ status: false, msg: "Enter Valid style" })
    }


    let productImage = req.files
    if (productImage.length !== 0) {
        // if(!validator.isValidImage(productImage))
        // return res.status(400).send({status:false, msg:"Give valid Image File"})


        if (!(productImage && productImage.length)) {
            return res.status(400).send({ status: false, message: " Please Provide The Product Image" });
        }
        const uploadedProductImage = await uploadFile(productImage[0])
        data.productImage = uploadedProductImage
    }

    //isAvailableSize validation
    if (availableSizes) {
        if (!validator.isValidSize(availableSizes))
            return res.status(400).send({ status: false, msg: "Enter Valid Size" })
    }



    //isFreeShipping validation
    if (isFreeShipping) {
        if (!validator.isBoolean(isFreeShipping))
            return res.status(400).send({ status: false, msg: "IsFreeShipping Must Be Boolean value" })

    }

    //isDeleted validation
    if (isDeleted) {
        if (!validator.isBoolean(isDeleted))
            return res.status(400).send({ status: false, msg: "isDeleted Must Be A Boolean Value" })
    }

    let updateData = await productModel.findByIdAndUpdate({ _id: productId, isDeleted: false }, data, { new: true })
    res.status(200).send({ status: true, message: "Updated  Successfully", data: updateData })

}



//DELETE PRODUCTS BY ID
const delProductsById = async function (req, res) {
    let productId = req.params.productId
    var isValid = mongoose.Types.ObjectId.isValid(productId)
    if (!isValid) return res.status(400).send({ status: false, msg: "Enter Valid Product Id" })
    let productsDetails = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() }, { new: true })
    if (!productsDetails) {
        return res.status(404).send({ status: false, message: "Product Not Found" })
    } else {
        return res.status(200).send({ status: true, message: "Successfully Deleted" })
    }
}

module.exports = { createProduct, getProducts, getProductsById, delProductsById, updateProduct }
