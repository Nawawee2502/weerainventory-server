const Kt_dpbdtModel = require("../models/mainModel").Kt_dpbdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addKt_dpbdt = async (req, res) => {
    try {
        Kt_dpbdtModel.create({
        refno: req.body.refno,
        product_code: req.body.product_code,
        qty: req.body.qty,
        unit_code: req.body.unit_code,
        uprice: req.body.uprice,
        tax1: req.body.tax1,
        amt: req.body.amt,
        expire_date: req.body.expire_date ,
        texpire_date: req.body.texpire_date ,
        temperature1: req.body.temperature1 ,
      })
      // console.log("API SERVER");
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updateKt_dpbdt = async (req, res) => {
    // console.log("reg.body ===>",req.body);
    try {
        Kt_dpbdtModel.update(
        { qty: req.body.qty ,
         uprice: req.body.uprice ,
         tax1: req.body.tax1 ,
         unit_code: req.body.unit_code ,
         amt: req.body.amt,
         expire_date: req.body.expire_date ,
         texpire_date: req.body.texpire_date ,
         temperature1: req.body.temperature1 ,
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
  
  
  exports.deleteKt_dpbdt = async (req, res) => {
    try {
        Kt_dpbdtModel.destroy(
        { where: { refno: req.body.refno,
          product_code: req.body.product_code} }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.Kt_dpbdtAllinnerjoin = async (req, res) => {
    try {
      const { offset, limit } = req.body;

      const Kt_dpbdtShow = await Kt_dpbdtModel.findAll({ offset:offset,limit:limit });
      res.status(200).send({ result: true, data: Kt_dpbdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countKt_dpbdt = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await Kt_dpbdtModel.count({
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

  exports.Kt_dpbdtAlljoindt = async (req, res) => {
    try {
      const { refno } = req.body;

      const Kt_dpbdtShow = await Kt_dpbdtModel.findAll({ 
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
      
      res.status(200).send({ result: true, data: Kt_dpbdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  