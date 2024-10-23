const wh_posModel = require("../models/mainModel").Wh_pos;
const wh_posdtModel = require("../models/mainModel").Wh_posdt;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Tbl_supplier, sequelize } = require("../models/mainModel");
const { Tbl_branch } = require("../models/mainModel");

exports.addWh_pos = async (req, res) => {
  try {
    // console.log("req",req)
    const headerData = req.body.headerData;
    // console.log("req.body", req.body)
    console.log("headerData", headerData)
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;
    // console.log("footerData", footerData)

    wh_posModel.create({
      refno: headerData.refno,
      rdate: headerData.rdate,
      supplier_code: headerData.supplier_code,
      branch_code: headerData.branch_code,
      trdate: headerData.trdate,
      monthh: headerData.monthh,
      myear: headerData.myear,
      user_code: headerData.user_code,
      total: footerData.total
    })
      .then(() => {
        console.log("THEN")
        console.log(productArrayData)
        wh_posdtModel.bulkCreate(productArrayData)
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
      {
        rdate: req.body.rdate, //19/10/2024
        trdate: req.body.trdate, //20241019
        myear: req.body.myear, // 2024
        monthh: req.body.monthh, //10
        supplier_code: req.body.supplier_code,
        branch_code: req.body.branch_code,
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
    const { offset, limit, rdate1, rdate2, supplier_name, branch_name } = req.body;
    const { Op } = require("sequelize");

    const wheresupplier = { supplier_name: { [Op.like]: '%', } };
    if (supplier_name)
      wheresupplier = { $like: '%' + supplier_name + '%' };

    const wherebranch = { branch_name: { [Op.like]: '%', } };
    if (branch_name)
      wherebranch = { $like: '%' + branch_name + '%' };

    const wh_posShow = await wh_posModel.findAll({
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          // where: { supplier_name: {[Op.like]: '%'+(supplier_name)+'%',}},
          where: wheresupplier,
          required: true,
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          // where: { branch_name: {[Op.like]: '%'+(branch_name)+'%',}},
          where: wherebranch,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
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
    const { refno } = await req.body;
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

exports.refno = async (req, res) => {
  try {
    const refno = await wh_posModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.searchWh_posRunno = async (req, res) => {
  try {
    const { Op } = require("sequelize");

    const Wh_posShow = await wh_posModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_posShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};