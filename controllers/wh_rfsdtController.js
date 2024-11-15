const wh_rfsdtModel = require("../models/mainModel").Wh_rfsdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addWh_rfsdt = async (req, res) => {
    try {
    wh_rfsdtModel.create({
        refno: req.body.refno,
        product_code: req.body.product_code,
        qty: req.body.qty,
        unit_code: req.body.unit_code,
        uprice: req.body.uprice,
        tax1: req.body.tax1,
        expire_date: req.body.expire_date ,
        texpire_date: req.body.texpire_date ,
        instant_saving1: req.body.instant_saving1 ,
        temperature1: req.body.temperature1 ,
        amt: req.body.amt,
      })
      // console.log("API SERVER");
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updateWh_rfsdt = async (req, res) => {
    // console.log("reg.body ===>",req.body);
    try {
    wh_rfsdtModel.update(
        { qty: req.body.qty ,
         uprice: req.body.uprice ,
         tax1: req.body.tax1 ,
         unit_code: req.body.unit_code ,
         expire_date: req.body.expire_date ,
         texpire_date: req.body.texpire_date ,
         instant_saving1: req.body.instant_saving1 ,
         temperature1: req.body.temperature1 ,
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
  
  
  exports.deleteWh_rfsdt = async (req, res) => {
    try {
    wh_rfsdtModel.destroy(
        { where: { refno: req.body.refno,
          product_code: req.body.product_code} }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.Wh_rfsdtAllinnerjoin = async (req, res) => {
    try {
      const { offset, limit } = req.body;

      const wh_rfsShow = await wh_rfsdtModel.findAll({ offset:offset,limit:limit });
      res.status(200).send({ result: true, data: wh_rfsShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countWh_rfsdt = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await wh_rfsdtModel.count({
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

  exports.Wh_rfsdtAlljoindt = async (req, res) => {
    try {
      const { refno } = req.body;

      const wh_rfsdtShow = await wh_rfsdtModel.findAll({ 
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
      
      res.status(200).send({ result: true, data: wh_rfsdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  