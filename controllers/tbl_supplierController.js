const tbl_supplierModel = require("../models/mainModel").Tbl_supplier;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addsupplier = async (req, res) => {
    try {
        tbl_supplierModel.create({
        supplier_code: req.body.supplier_code,
        supplier_name: req.body.supplier_name,
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
  
  exports.updatesupplier = async (req, res) => {
    try {
        tbl_supplierModel.update(
        { supplier_name: req.body.supplier_name },
        { addr1: req.body.addr1 },
        { addr2: req.body.addr2 },
        { tel1: req.body.tel1 },
        { where: { supplier_code: req.body.supplier_code } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  
  exports.deletesupplier = async (req, res) => {
    try {
        tbl_supplierModel.destroy(
        { where: { supplier_code: req.body.supplier_code } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.supplierAll = async (req, res) => {
    try {
      const {offset,limit} = req.body;
      const supplierShow = await tbl_supplierModel.findAll({offset:offset,limit:limit});
      res.status(200).send({ result: true, data: supplierShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countSupplier = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await tbl_supplierModel.count({
        where: {
          supplier_code: {
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
  