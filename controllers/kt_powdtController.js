const kt_powdtModel = require("../models/mainModel").Kt_powdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addKt_powdt = async (req, res) => {
    try {
        kt_powdtModel.create({
        refno: req.body.refno,
        product_code: req.body.product_code,
        qty: req.body.qty,
        unit_code: req.body.unit_code,
        uprice: req.body.uprice,
        tax1: req.body.tax1,
        amt: req.body.amt,
      })
      // console.log("API SERVER");
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updateKt_powdt = async (req, res) => {
    // console.log("reg.body ===>",req.body);
    try {
        kt_powdtModel.update(
        { qty: req.body.qty ,
         uprice: req.body.uprice ,
         tax1: req.body.tax1 ,
         unit_code: req.body.unit_code ,
         amt: req.body.amt,
         },
        { where: { refno: req.body.refno,
                  product_code: req.body.product_code} }
        );
      // console.log("update=>",wh_posdtModel)
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  
  exports.deleteKt_powdt = async (req, res) => {
    try {
        kt_powdtModel.destroy(
        { where: { refno: req.body.refno,
          product_code: req.body.product_code} }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.Kt_powdtAllinnerjoin = async (req, res) => {
    try {
      const { offset, limit } = req.body;

      const kt_powdtShow = await kt_powdtModel.findAll({ offset:offset,limit:limit });
      res.status(200).send({ result: true, data: kt_powdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countKt_powdt = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await kt_powdtModel.count({
        where: {
          refno: {
            [Op.eq]: req.body.refno
          },
        },
      });
      res.status(200).send({ result: true, data: amount })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };

  exports.Kt_powdtAlljoindt = async (req, res) => {
    try {
      const { refno } = req.body;

      const kt_powdtShow = await kt_powdtModel.findAll({ 
        include: [
          {
            model: unitModel,
            required: true,
          },
          {
            model: productModel,
            required: true,
          },
        ],
        where: {refno:refno},
        // offset:offset,limit:limit 
      });
      
      res.status(200).send({ result: true, data: kt_powdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  