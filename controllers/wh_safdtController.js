const Wh_safdtModel = require("../models/mainModel").Wh_safdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addWh_safdt = async (req, res) => {
    try {
      Wh_safdtModel.create({
        refno: req.body.refno,
        product_code: req.body.product_code,
        qty: req.body.qty,
        unit_code: req.body.unit_code,
        uprice: req.body.uprice,
        amt: req.body.amt,
      })
      console.log("API SERVER");
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updateWh_safdt = async (req, res) => {
    // console.log("reg.body ===>",req.body);
    try {
      Wh_safdtModel.update(
        { qty: req.body.qty ,
         uprice: req.body.uprice ,
         expire_date: req.body.expire_date ,
         texpire_date: req.body.texpire_date ,
         unit_code: req.body.unit_code ,
         amt: req.body.amt,
         },
        { where: { refno: req.body.refno,
                  product_code: req.body.product_code} }
        );
      // console.log("update=>",Wh_safdtModel)
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  
  exports.deleteWh_safdt = async (req, res) => {
    try {
      Wh_safdtModel.destroy(
        { where: { refno: req.body.refno,
          product_code: req.body.product_code} }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.Wh_safdtAllinnerjoin = async (req, res) => {
    try {
      const { offset, limit } = req.body;

      const wh_posShow = await Wh_safdtModel.findAll({ offset:offset,limit:limit });
      res.status(200).send({ result: true, data: wh_posShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countWh_safdt = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await Wh_safdtModel.count({
        where: {
          refno: {
            [Op.gt]: 0,
          },
        },
      });
      res.status(200).send({ result: true, data: amount })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };

  exports.Wh_safdtAlljoindt = async (req, res) => {
    try {
      const { refno } = req.body;

      const Wh_safdtShow = await Wh_safdtModel.findAll({ 
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
      
      res.status(200).send({ result: true, data: Wh_safdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  