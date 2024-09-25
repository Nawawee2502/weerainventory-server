const tbl_kitchenModel = require("../models/mainModel").Tbl_kitchen;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addkitchen = async (req, res) => {
    try {
        tbl_kitchenModel.create({
        kitchen_code: req.body.kitchen_code,
        kitchen_name: req.body.kitchen_name,
        addr1: req.body.addr1,
        addr2: req.body.addr2,
        tel1: req.body.tel1,
        
      })
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updatekitchen = async (req, res) => {
    try {
        tbl_kitchenModel.update(
        { kitchen_name: req.body.kitchen_name },
        { addr1: req.body.addr1 },
        { addr2: req.body.addr2 },
        { tel1: req.body.tel1 },
        { where: { kitchen_code: req.body.kitchen_code } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  
  exports.deletekitchen = async (req, res) => {
    try {
        tbl_kitchenModel.destroy(
        { where: { kitchen_code: req.body.kitchen_code } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.kitchenAll = async (req, res) => {
    try {
      const {offset,limit}=req.body;
      const kitchenShow = await tbl_kitchenModel.findAll({offset:offset,limit:limit});
      res.status(200).send({ result: true, data: kitchenShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countKitchen = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await tbl_kitchenModel.count({
        where: {
          kitchen_code: {
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