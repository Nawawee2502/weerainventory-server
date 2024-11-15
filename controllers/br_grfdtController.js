const Br_grfdtModel = require("../models/mainModel").Br_grfdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addBr_grfdt = async (req, res) => {
    try {
        Br_grfdtModel.create({
        refno: req.body.refno,
        product_code: req.body.product_code,
        qty: req.body.qty,
        unit_code: req.body.unit_code,
        uprice: req.body.uprice,
        amt: req.body.amt,
        expire_date: req.body.expire_date ,
        texpire_date: req.body.texpire_date ,
      })
      // console.log("API SERVER");
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updateBr_grfdt = async (req, res) => {
    // console.log("reg.body ===>",req.body);
    try {
        Br_grfdtModel.update(
        { qty: req.body.qty ,
         uprice: req.body.uprice ,
         unit_code: req.body.unit_code ,
         amt: req.body.amt,
         expire_date: req.body.expire_date ,
         texpire_date: req.body.texpire_date ,
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
  
  
  exports.deleteBr_grfdt = async (req, res) => {
    try {
        Br_grfdtModel.destroy(
        { where: { refno: req.body.refno,
          product_code: req.body.product_code} }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.Br_grfdtAllinnerjoin = async (req, res) => {
    try {
      const { offset, limit } = req.body;

      const Br_grfdtShow = await Br_grfdtModel.findAll({ offset:offset,limit:limit });
      res.status(200).send({ result: true, data: Br_grfdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countBr_grfdt = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await Br_grfdtModel.count({
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

  exports.Br_grfdtAlljoindt = async (req, res) => {
    try {
      const { refno } = req.body;

      const Br_grfdtShow = await Br_grfdtModel.findAll({ 
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
      
      res.status(200).send({ result: true, data: Br_grfdtShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  