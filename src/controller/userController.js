const bcrypt = require('bcrypt');
const userModel = require("../models/userModel");
const mongoose = require("mongoose")
const validator = require("../validator/validation")
const { uploadFile } = require("../aws/awsConnect")
const jwt = require("jsonwebtoken");


// API to create User 
const createUser = async function (req, res) {
  const data = req.body
  let { fname, lname, email, phone, address, password } = data;

 // to check blank request 
  if (!validator.isValidRequest(data))
    return res.status(400).send({ status: false, msg: "Enter User Details " }) //it should not be blank

  // to update first name         
  if (!validator.isValidString(fname))
    return res.status(400).send({ status: false, msg: "First Name Is Required " }) // it should be string
  if (!validator.isValidName(fname))
    return res.status(400).send({ status: false, msg: "Enter Valid First Name " })

    //to update last name 
  if (!validator.isValidString(lname))
    return res.status(400).send({ status: false, msg: "Last Name Is Required " }) // it should be string

  if (!validator.isValidName(lname))
    return res.status(400).send({ status: false, msg: "Enter Valid Last Name " })
 // to update email
  if (!validator.isValidString(email))
    return res.status(400).send({ status: false, msg: "Email Is Required " }) // it should be string

  if (!validator.isValidEmail(email))
    return res.status(400).send({ status: false, msg: "Email Is Not Valid " })
  // to update phone
  if (!validator.isValidString(phone))
    return res.status(400).send({ status: false, msg: " Phone Number is Required " })

  if (!validator.isValidMobile(phone))
    return res.status(400).send({ status: false, msg: " Enter The Valid Number " })
 
     // duplicacy check for email and phone
  const isDuplicate = await userModel.findOne({ $or: [{ email: email }, { phone: phone }] })
  if (isDuplicate) return res.status(400).send({ status: false, msg: ` Email or Phone Number Already Exist` })
 
  // to update password
  if (!validator.isValidString(password))
    return res.status(400).send({ status: false, msg: "Password Is Required " })

  if (!validator.isValidPassword(password))
    return res.status(400).send({ status: false, msg: " Password Must be Include One special_char,Uppercase,Lowercase and Number ,Min 8 & Max 15 Char Are Allowed" })

 // to encrpt incoming password
  const encryptPassword = await bcrypt.hash(password, 10)
  data.password = encryptPassword;
  console.log(encryptPassword)

  //to update profile Image
  let profileImage = req.files

  // if(!validator.isValidImage(profileImage))
  // return res.status(400).send({status:false, msg:"Give valid Image File"})

  if (!(profileImage && profileImage.length)) {
    return res.status(400).send({ status: false, message: " Please Provide The Profile Image" });
  }
  const uploadedProfileImage = await uploadFile(profileImage[0])
  data.profileImage = uploadedProfileImage

  // address
  if (data.address) {
    var parsedAddress = JSON.parse(data.address)
    console.log(parsedAddress)
    let { shipping, billing } = parsedAddress
    if (shipping) {
      // street validation
      if (!validator.isValidString(shipping.street))
        return res.status(400).send({ status: false, msg: "Street Is Required,should be in string value " })

      if (!validator.isvalidStreet(shipping.street))
        return res.status(400).send({ status: false, msg: "Enter Valid Street" })
 
         // city validation
      if (!validator.isValidString(shipping.city))
        return res.status(400).send({ status: false, msg: "city Is Required,should be in string value " })

      if (!validator.isValidName(shipping.city))
        return res.status(400).send({ status: false, msg: "Enter Valid city" })
        //pincode validation
      if (!validator.isValidNumber(shipping.pincode))
        return res.status(400).send({ status: false, msg: "Pincode should be numerical" })

      if (!validator.isvalidPincode(shipping.pincode))
        return res.status(400).send({ status: false, msg: "Enter Valid Pincode " })
    }

    if (billing) { 
       //validate street in billing 
      if (!validator.isValidString(billing.street))
        return res.status(400).send({ status: false, msg: "Street Is Required,should be in string value " })

      if (!validator.isvalidStreet(billing.street))
        return res.status(400).send({ status: false, msg: "Enter Valid Street" })

        //validate city in billing 
      if (!validator.isValidString(billing.city))
        return res.status(400).send({ status: false, msg: "City Is Required,should Be In String Value " })

      if (!validator.isValidName(billing.city))
        return res.status(400).send({ status: false, msg: "Enter Valid city" })
       //validate pincode in billing  
      if (!validator.isValidNumber(billing.pincode))
        return res.status(400).send({ status: false, msg: "Pincode should be Numerical" })

      if (!validator.isvalidPincode(billing.pincode))
        return res.status(400).send({ status: false, msg: "Enter Valid Pincode " })
    }

  }
   data.address = parsedAddress
   
  const userData = await userModel.create(data) //form
  res.status(201).send({ status: true, message: "User Successfully Created", data: userData })
}

// Login User
const loginUser = async function (req, res) {
  let data = req.body
  let { email, password } = data
    // to check blank request
  if (!validator.isValidRequest(data))
    return res.status(400).send({ status: false, msg: "Enter Your Email And Password " })
     // to validate email
  if (!validator.isValidString(email))
    return res.status(400).send({ status: false, msg: "Email Is Required" })
  if (!validator.isValidEmail(email))
    return res.status(400).send({ status: false, msg: "Email or Password is Incorrect" })
    // to validate Password
  if (!validator.isValidString(password))
    return res.status(400).send({ status: false, msg: "Password Is Required" })
    if (!validator.isValidPassword(password))
    return res.status(400).send({ status: false, msg: "Email or Password is Incorrect" })


  const isUser = await userModel.findOne({ email: email })
  if (!isUser) { return res.status(404).send({ status: false, message: "User not found" }) }

  let encryptPwd = isUser.password
//decrypting password 
  let decryptPwd = await bcrypt.compare(password, encryptPwd, function (err, result) {
    if (result) {
      let token = jwt.sign({ userId: isUser._id.toString(), iat: Math.floor(Date.now() / 1000) }, "Group10-Product-Management", { expiresIn: '24h' });

      let obj = {
        userId: isUser._id.toString(),
        token: token
      }
      return res.status(200).send({ status: true, message: "User login successfull", data: obj })
    }
    else {
      return res.status(401).send({ status: false, message: "Invalid password!" });
    }
  });
}

const getUser = async function (req, res) {
  try {
    let userId = req.params.userId;
   
    let saveData = await userModel.findById({ _id: userId }).select({ __v: 0 })
    if (!saveData) { return res.status(404).send({ status: false, message: "user not found" }) }
     res.status(200).send({ status: true, message: "Success", data: saveData })
  } catch (err) {
    res.status(500).send({ message: 'Error', error: err.message });
  }
};

const updateUser = async function (req, res) {
  let userId = req.params.userId
  let data = req.body

  const { fname, lname, email, phone, password } = data;

  if (!validator.isValidRequest(data))
    return res.status(400).send({ status: false, msg: "Enter User Details To Update " }) //it should not be blank

  if (fname) {
    if (!validator.isValidString(fname))
      return res.status(400).send({ status: false, msg: "First Name Is Required " }) // it should be string

    if (!validator.isValidName(fname))
      return res.status(400).send({ status: false, msg: "Enter Valid First Name " })
  }

  if (lname) {
    if (!validator.isValidString(lname))
      return res.status(400).send({ status: false, msg: "Last Name Is Required " }) // it should be string

    if (!validator.isValidName(lname))
      return res.status(400).send({ status: false, msg: "Enter Valid Last Name " })
  }

  if (email) {
    if (!validator.isValidString(email))
      return res.status(400).send({ status: false, msg: "Email Is Required " }) // it should be string

    if (!validator.isValidEmail(email))
      return res.status(400).send({ status: false, msg: "Email Is Not Valid " })

    const isDuplicate = await userModel.findOne({ email: email })
    if (isDuplicate) return res.status(400).send({ status: false, msg: ` ${email} Already Exist` })
  }


  if (phone) {
    if (!validator.isValidString(phone))
      return res.status(400).send({ status: false, msg: " Phone Number is Required " })

    if (!validator.isValidMobile(phone))
      return res.status(400).send({ status: false, msg: " Enter The Valid Number " })

    const isDuplicate = await userModel.findOne({ phone: phone })
    if (isDuplicate) return res.status(400).send({ status: false, msg: ` ${phone} Already Exist` })
  }

  if (password) {
    if (!validator.isValidString(password))
      return res.status(400).send({ status: false, msg: "Password Is Required " })

    if (!validator.isValidPassword(password))
      return res.status(400).send({ status: false, msg: " Password Must be Include One special_char,Uppercase,Lowercase and Number ,Min 8 & Max 15 Char Are Allowed" })

    const encryptPassword = await bcrypt.hash(password, 10)
    data.password = encryptPassword;

  }


  let profileImage = req.files
  if (profileImage.length !== 0) {
    // if(!validator.isValidImage(profileImage))
    // return res.status(400).send({status:false, msg:"Give valid Image File"})

    if (!(profileImage && profileImage.length)) {
      return res.status(400).send({ status: false, message: " Please Provide The Profile Image" });
    }
    const uploadedProfileImage = await uploadFile(profileImage[0])
    data.profileImage = uploadedProfileImage
  }

  if (data.address) {
    var parsedAddress = JSON.parse(data.address)
    console.log(parsedAddress)
    let { shipping, billing } = parsedAddress
    if (shipping) {


      if (shipping.street) {
        if (!validator.isValidString(shipping.street))
          return res.status(400).send({ status: false, msg: "Street Is Required,Should Be In String Value " })

        if (!validator.isvalidStreet(shipping.street))
          return res.status(400).send({ status: false, msg: "Enter Valid Street Of Shipping" })
      }

      if (shipping.city) {
        if (!validator.isValidString(shipping.city))
          return res.status(400).send({ status: false, msg: "City Is Required,Should Be In String Value " })

        if (!validator.isValidName(shipping.city))
          return res.status(400).send({ status: false, msg: "Enter Valid City Of Shipping" })
      }

      if (shipping.pincode) {
        if (!validator.isValidNumber(shipping.pincode))
          return res.status(400).send({ status: false, msg: "Pincode Should Be Numerical" })

        if (!validator.isvalidPincode(shipping.pincode))
          return res.status(400).send({ status: false, msg: "Enter Valid Pincode " })
      }
    }

    if (billing) {

      if (billing.street) {
        if (!validator.isValidString(billing.street))
          return res.status(400).send({ status: false, msg: "Street Is Required,should be in string value " })

        if (!validator.isvalidStreet(billing.street))
          return res.status(400).send({ status: false, msg: "Enter Valid Street Of Billing" })
      }

      if (billing.city) {
        if (!validator.isValidString(billing.city))
          return res.status(400).send({ status: false, msg: "city Is Required,should be in string value " })

        if (!validator.isValidName(billing.city))
          return res.status(400).send({ status: false, msg: "Enter Valid city Of Billing" })
      }

      if (billing.pincode) {
        if (!validator.isValidNumber(billing.pincode))
          return res.status(400).send({ status: false, msg: "Pincode Should Be Numerical" })

        if (!validator.isvalidPincode(billing.pincode))
          return res.status(400).send({ status: false, msg: "Enter Valid Pincode " })
      }

    }
  }
  data.address = parsedAddress
  let updateData = await userModel.findByIdAndUpdate({ _id: userId }, data, { new: true })
  res.status(200).send({ status: true, message: "Updated  Successfully", data: updateData })
}

module.exports = { createUser, loginUser, getUser, updateUser }

