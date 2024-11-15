const Kt_prfdtModel = require("../models/mainModel").Kt_prfdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addKt_prfdt = async (req, res) => {
    try {
        Kt_prfdtModel.create({
        refno: req.body.refno,
        product_code: req.body.product_code,
        qty: req.body.qty,
        unit_code: req.body.unit_code,
        uprice: req.body.uprice,
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
  
  exports.updateKt_prfdt = async (req, res) => {
    // console.log("reg.body ===>",req.body);
    try {
        Kt_prfdtModel.update(
        { qty: req.body.qty ,
         uprice: req.body.uprice ,
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
  
  
  exports.deleteKt_prfdt = async (req, res) => {
    try {
        Kt_prfdtModel.destroy(
        { where: { refno: req.body.refno,
          product_code: req.body.product_code} }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.Kt_prfdtAllinnerjoin = async (req, res) => {
    try {
      const { offset, limit } = req.body;

      const Kt_prfdtShow = await Kt_prfdtModel.findAll({ offset:offset,limit:limit });
      res.status(200).send({ result: true, data: Kt_prfdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countKt_prfdt = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await Kt_prfdtModel.count({
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

  exports.Kt_prfdtAlljoindt = async (req, res) => {
    try {
      const { refno } = req.body;

      const Kt_prfdtShow = await Kt_prfdtModel.findAll({ 
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
      
      res.status(200).send({ result: true, data: Kt_prfdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  