const Kt_rfsModel = require("../models/mainModel").Kt_rfs;
const Kt_rfsdtModel = require("../models/mainModel").Kt_rfsdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Tbl_supplier, sequelize, Tbl_product, Tbl_kitchen } = require("../models/mainModel");
const { Tbl_branch } = require("../models/mainModel");

exports.addKt_rfs = async (req, res) => {
  try {
    // console.log("req",req)
    const headerData = req.body.headerData;
    // console.log("req.body", req.body)
    // console.log("headerData", headerData)
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;
    // console.log("footerData", footerData)

    Kt_rfsModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        supplier_code: headerData.supplier_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: footerData.taxable,
        nontaxable: footerData.nontaxable,
        total: footerData.total,
        instant_saving: req.body.instant_saving,
        delivery_surcharge: req.body.delivery_surcharge,
        sale_tax: req.body.sale_tax,
        total_due: req.body.total_due,
    })
      .then(() => {
        // console.log("THEN")
        // console.log(productArrayData)
        Kt_rfsdtModel.bulkCreate(productArrayData)
      })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateKt_rfs = async (req, res) => {
  try {
    Kt_rfsModel.update(
      {
        rdate: req.body.rdate, //19/10/2024
        trdate: req.body.trdate, //20241019
        myear: req.body.myear, // 2024
        monthh: req.body.monthh, //10
        kitchen_code: req.body.kitchen_code,
        supplier_code: req.body.supplier_code,
        taxable: req.body.taxable,
        nontaxable: req.body.nontaxable,
        total: req.body.total,
        instant_saving: req.body.instant_saving,
        delivery_surcharge: req.body.delivery_surcharge,
        sale_tax: req.body.sale_tax,
        total_due: req.body.total_due,
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


exports.deleteKt_rfs = async (req, res) => {
  try {
    Kt_rfsModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Kt_rfsAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name, supplier_name } = req.body;
    const { Op } = require("sequelize");

    const wherekitchen = { kitchen_name: { [Op.like]: '%', } };
    if (kitchen_name)
      wherekitchen = { $like: '%' + kitchen_name + '%' };

    const wheresupplier = { supplier_name: { [Op.like]: '%', } };
      if (supplier_name)
        wheresupplier = { $like: '%' + supplier_name + '%' };
    
    const Kt_rfsShow = await Kt_rfsModel.findAll({
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          // where: { supplier_name: {[Op.like]: '%'+(supplier_name)+'%',}},
          where: wheresupplier,
          required: true,
        },
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
    res.status(200).send({ result: true, data: Kt_rfsShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Kt_rfsAlljoindt = async (req, res) => {
  try {
    // const { offset, limit } = req.body;

    const Kt_rfsShow = await Kt_rfsModel.findAll({
      include: [
        {
          model: Kt_rfsdtModel,
          // as: "postoposdt",
          // required: true,
        },
      ],
      // where: { refno: 'WPOS2410013' }
      // offset:offset,limit:limit 
    });
    res.status(200).send({ result: true, data: Kt_rfsShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

// *********************แก้ไขใหม่********************* 
exports.Kt_rfsByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Kt_rfsShow = await Kt_rfsModel.findOne({
      include: [
        {
          model: Kt_rfsdtModel,
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
    res.status(200).send({ result: true, data: Kt_rfsShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countKt_rfs = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Kt_rfsModel.count({
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

exports.searchKt_rfsrefno = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { refno } = await req.body;
    // console.log((typeproduct_name));

    const Kt_rfsShow = await Kt_rfsModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Kt_rfsShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Kt_rfsrefno = async (req, res) => {
  try {
    const refno = await Kt_rfsModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.searchKt_rfsRunno = async (req, res) => {
  try {
    const Kt_rfsShow = await Kt_rfsModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Kt_rfsShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};