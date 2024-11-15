const Kt_trwModel = require("../models/mainModel").Kt_trw;
const Kt_trwdtModel = require("../models/mainModel").Kt_trwdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Tbl_supplier, sequelize, Tbl_product, Tbl_kitchen } = require("../models/mainModel");
const { Tbl_branch } = require("../models/mainModel");

exports.addKt_trw = async (req, res) => {
  try {
    // console.log("req",req)
    const headerData = req.body.headerData;
    // console.log("req.body", req.body)
    // console.log("headerData", headerData)
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;
    // console.log("footerData", footerData)

    Kt_trwModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        total: footerData.total,
    })
      .then(() => {
        // console.log("THEN")
        // console.log(productArrayData)
        Kt_trwdtModel.bulkCreate(productArrayData)
      })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateKt_trw = async (req, res) => {
  try {
    Kt_trwModel.update(
      {
        rdate: req.body.rdate, //19/10/2024
        trdate: req.body.trdate, //20241019
        myear: req.body.myear, // 2024
        monthh: req.body.monthh, //10
        kitchen_code: req.body.kitchen_code,
        total: req.body.total,
        user_code: req.body.user_code,
      },
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteKt_trw = async (req, res) => {
  try {
    Kt_trwModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Kt_trwAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;
    const { Op } = require("sequelize");

    const wherekitchen = { kitchen_name: { [Op.like]: '%', } };
    if (kitchen_name)
      wherekitchen = { $like: '%' + kitchen_name + '%' };

   
    const Kt_trwShow = await Kt_trwModel.findAll({
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          // where: { branch_name: {[Op.like]: '%'+(branch_name)+'%',}},
          where: wherekitchen,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });
    res.status(200).send({ result: true, data: Kt_trwShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Kt_trwAlljoindt = async (req, res) => {
  try {
    // const { offset, limit } = req.body;

    const Kt_trwShow = await Kt_trwModel.findAll({
      include: [
        {
          model: Kt_trwdtModel,
          // as: "postoposdt",
          // required: true,
        },
      ],
      // where: { refno: 'WPOS2410013' }
      // offset:offset,limit:limit 
    });
    res.status(200).send({ result: true, data: Kt_trwShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

// *********************แก้ไขใหม่********************* 
exports.Kt_trwByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Kt_trwShow = await Kt_trwModel.findOne({
      include: [
        {
          model: Kt_trwdtModel,
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
    res.status(200).send({ result: true, data: Kt_trwShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countKt_trw = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Kt_trwModel.count({
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

exports.searchKt_trwrefno = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { refno } = await req.body;
    // console.log((typeproduct_name));

    const Kt_trwShow = await Kt_trwModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Kt_trwShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Kt_trwrefno = async (req, res) => {
  try {
    const refno = await Kt_trwModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.searchKt_trwRunno = async (req, res) => {
  try {
    const Kt_trwShow = await Kt_trwModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Kt_trwShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};