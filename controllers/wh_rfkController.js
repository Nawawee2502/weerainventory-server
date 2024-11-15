const wh_rfkModel = require("../models/mainModel").Wh_rfk;
const wh_rfkdtModel = require("../models/mainModel").Wh_rfkdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {  sequelize, Tbl_product } = require("../models/mainModel");
const { Tbl_kitchen } = require("../models/mainModel");

exports.addWh_rfk = async (req, res) => {
  try {
    // console.log("req",req)
    const headerData = req.body.headerData;
    // console.log("req.body", req.body)
    // console.log("headerData", headerData)
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;
    // console.log("footerData", footerData)

    wh_rfkModel.create({
      refno: headerData.refno,
      rdate: headerData.rdate,
      kitchen_code: headerData.kitchen_code,
      trdate: headerData.trdate,
      monthh: headerData.monthh,
      myear: headerData.myear,
      user_code: headerData.user_code,
      taxable: footerData.taxable,
      nontaxable: footerData.nontaxable,
      total: footerData.total
      })
      .then(() => {
        console.log("THEN")
        console.log(productArrayData)
        wh_rfkdtModel.bulkCreate(productArrayData)
      })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateWh_rfk = async (req, res) => {
  try {
    wh_rfkModel.update(
      {
        rdate: req.body.rdate, //19/10/2024
        trdate: req.body.trdate, //20241019
        myear: req.body.myear, // 2024
        monthh: req.body.monthh, //10
        kitchen_code: req.body.kitchen_code_code,
        taxable: req.body.taxable,
        nontaxable: req.body.nontaxable,
        total: req.body.total,
        user_code: req.body.user_code
      },
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteWh_rfk = async (req, res) => {
  try {
    wh_rfkModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Wh_rfkAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;
    const { Op } = require("sequelize");

    const wherekitchen = { kitchen_name: { [Op.like]: '%', } };
    if (kitchen_name)
    wherekitchen = { $like: '%' + kitchen_name + '%' };

    const Wh_rfkShow = await wh_rfkModel.findAll({
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          // where: { supplier_name: {[Op.like]: '%'+(supplier_name)+'%',}},
          where: wherekitchen,
          required: true,
        },
       ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });
    res.status(200).send({ result: true, data: Wh_rfkShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfkAlljoindt = async (req, res) => {
  try {
    // const { offset, limit } = req.body;

    const Wh_rfkShow = await wh_rfkModel.findAll({
      include: [
        {
          model: wh_rfkdtModel,
          // as: "postoposdt",
          // required: true,
        },
      ],
      // where: { refno: 'WPOS2410013' }
      // offset:offset,limit:limit 
    });
    res.status(200).send({ result: true, data: Wh_rfkShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

// *********************แก้ไขใหม่********************* 
exports.Wh_rfkByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Wh_rfkShow = await wh_rfkModel.findOne({
      include: [
        {
          model: wh_rfkdtModel,
          include: [{
            model: Tbl_product,
            include: [
              {
                model: unitModel,
                as: 'productUnit1',
                required: true,
              },
              {
                model: unitModel,
                as: 'productUnit2',
                required: true,
              },
            ],
          }],
          // as: "postoposdt",
          // required: true,
        },
      ],
      where: { refno: refno }
      // offset:offset,limit:limit 
    });
    res.status(200).send({ result: true, data: Wh_rfkShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countWh_rfk = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await wh_rfkModel.count({
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

exports.searchWh_rfkrefno = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { refno } = await req.body;
    // console.log((typeproduct_name));

    const Wh_rfkShow = await wh_rfkModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Wh_rfkShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfkrefno = async (req, res) => {
  try {
    const refno = await wh_rfkModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.searchWh_rfkRunno = async (req, res) => {
  try {
    const Wh_rfkShow = await wh_rfkModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_rfkShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};