const wh_posModel = require("../models/mainModel").Wh_pos;
const wh_posdtModel = require("../models/mainModel").Wh_posdt;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Tbl_supplier, sequelize } = require("../models/mainModel");
const { Tbl_branch } = require("../models/mainModel");

exports.addWh_pos = async (req, res) => {
    try {
        wh_posModel.create({
        refno: req.body.refno,
        rdate: req.body.rdate,
        trdate: req.body.trdate,
        myear: req.body.myear,
        monthh: req.body.monthh,
        supplier_code: req.body.supplier_code,
        branch_code: req.body.branch_code,
        total: req.body.total,
        user_code: req.body.user_code,
      })
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updateWh_pos = async (req, res) => {
    try {
        wh_posModel.update(
        { rdate: req.body.rdate ,
         trdate: req.body.trdate ,
         myear: req.body.myear ,
         monthh: req.body.monthh ,
         supplier_code: req.body.supplier_code ,
         branch_code: req.body.branch_code ,
         total: req.body.total ,
         user_code: req.body.user_code ,
         where: { refno: req.body.refno } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  
  exports.deleteWh_pos = async (req, res) => {
    try {
        wh_posModel.destroy(
        { where: { refno: req.body.refno } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.Wh_posAllrdate = async (req, res) => {
    try {
      const { offset, limit,rdate1,rdate2,supplier_name,branch_name } = req.body;
      const { Op } = require("sequelize");

      const wheresupplier = {supplier_name: {[Op.like]: '%',}};
      if(supplier_name)
        wheresupplier = {$like: '%' + supplier_name + '%'};

      const wherebranch = {branch_name: {[Op.like]: '%',}};
      if(branch_name)
      wherebranch = {$like: '%' + branch_name + '%'};

      const wh_posShow = await wh_posModel.findAll({ 
        include: [
          {
            model: Tbl_supplier, 
            attributes:['supplier_code','supplier_name'],
            // where: { supplier_name: {[Op.like]: '%'+(supplier_name)+'%',}},
            where: wheresupplier,
            required: true,
          },
          {
            model: Tbl_branch,
            attributes:['branch_code','branch_name'],
            // where: { branch_name: {[Op.like]: '%'+(branch_name)+'%',}},
            where: wherebranch,
            required: true,
          },
        ],
        where: { trdate: {[Op.between]: [rdate1,rdate2]}},
      });
      res.status(200).send({ result: true, data: wh_posShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };

  exports.Wh_posAlljoindt = async (req, res) => {
    try {
      // const { offset, limit } = req.body;

      const wh_posShow = await wh_posModel.findAll({ 
        include: [
          {
            model: wh_posdtModel,
            required: true,
          },
        ],
        // offset:offset,limit:limit 
      });
      res.status(200).send({ result: true, data: wh_posShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countWh_pos = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await wh_posModel.count({
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

  exports.searchWh_posrefno = async (req, res) => {
    try {
      // console.log( req.body.type_productname);
      const { Op } = require("sequelize");
      const  {refno}  = await req.body;
      // console.log((typeproduct_name));

      
      const Wh_posShow = await wh_posModel.findAll({ 
        where: {
          refno: {
            [Op.like]: `%${refno}%`
          },
        } 
        });
      res.status(200).send({ result: true, data: Wh_posShow });
      
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };