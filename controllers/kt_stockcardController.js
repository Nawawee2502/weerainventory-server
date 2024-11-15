const Kt_stockcardModel = require("../models/mainModel").Kt_stockcard;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addKt_stockcard = async (req, res) => {
    try {
        Kt_stockcardModel.create({
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code,
        unit_code: req.body.unit_code,
        refno: req.body.refno,
        rdate: req.body.rdate,
        trdate: req.body.trdate,
        beg1: req.body.beg1,
        in1: req.body.in1,
        out1: req.body.out1,
        upd1: req.body.upd1,
        uprice: req.body.uprice,
        beg1_amt: req.body.beg1_amt,
        in1_amt: req.body.in1_amt,
        out1_amt: req.body.out1_amt,
        upd1_amt: req.body.upd1_amt,
      })
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updateKt_stockcard = async (req, res) => {
    try {
        Kt_stockcardModel.update(
        { rdate: req.body.rdate ,
          trdate: req.body.trdate ,
          unit_code: req.body.unit_code ,
          beg1: req.body.beg1 ,
          in1: req.body.in1 ,
          out1: req.body.out1 ,
          upd1: req.body.upd1 ,
          uprice: req.body.uprice ,
          beg1_amt: req.body.beg1_amt ,
          in1_amt: req.body.in1_amt ,
          out1_amt: req.body.out1_amt ,
          upd1_amt: req.body.upd1_amt },
        { where: { refno: req.body.refno,
                    myear: req.body.myear,
                    monthh: req.body.monthh,
                    product_code: req.body.product_code } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  
  exports.deleteKt_stockcard = async (req, res) => {
    try {
        Kt_stockcardModel.destroy(
        { where: { refno: req.body.refno,
          myear: req.body.myear,
          monthh: req.body.monthh } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.Kt_stockcardAll = async (req, res) => {
    try {
      const {offset,limit} = req.body;
       const Kt_stockcardShow = await Kt_stockcardModel.findAll({offset:offset,limit:limit});
      // const Kt_stockcardShow = await wh_dpkModel.findAll({
      //   include: [
      //     {
      //       model: Tbl_kitchen,
      //       attributes: ['kitchen_code', 'kitchen_name'],
      //       // where: { supplier_name: {[Op.like]: '%'+(supplier_name)+'%',}},
      //       where: wherekitchen,
      //       required: true,
      //     },
      //    ],
      //   where: { trdate: { [Op.between]: [rdate1, rdate2] } },
      // });
      res.status(200).send({ result: true, data: Kt_stockcardShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countKt_stockcard = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await Kt_stockcardModel.count({
        where: {
          Kt_stockcard_code: {
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
  

