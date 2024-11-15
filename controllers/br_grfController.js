const Br_grfModel = require("../models/mainModel").Br_grf;
const Br_grfdtModel = require("../models/mainModel").Br_grfdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Tbl_supplier, sequelize, Tbl_product, Tbl_kitchen } = require("../models/mainModel");
const { Tbl_branch } = require("../models/mainModel");

exports.addBr_grf = async (req, res) => {
  try {
    // console.log("req",req)
    const headerData = req.body.headerData;
    // console.log("req.body", req.body)
    // console.log("headerData", headerData)
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;
    // console.log("footerData", footerData)

    Br_grfModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        branch_code: headerData.branch_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        total: footerData.total,
    })
      .then(() => {
        // console.log("THEN")
        // console.log(productArrayData)
        Br_grfdtModel.bulkCreate(productArrayData)
      })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateBr_grf = async (req, res) => {
  try {
    Br_grfModel.update(
      {
        rdate: req.body.rdate, //19/10/2024
        trdate: req.body.trdate, //20241019
        myear: req.body.myear, // 2024
        monthh: req.body.monthh, //10
        branch_code: req.body.branch_code,
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


exports.deleteBr_grf = async (req, res) => {
  try {
    Br_grfModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Br_grfAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, branch_name} = req.body;
    const { Op } = require("sequelize");

    const wherebranch = { branch_name: { [Op.like]: '%', } };
    if (branch_name)
      wherebranch = { $like: '%' + branch_name + '%' };

    
    const Br_grfShow = await Br_grfModel.findAll({
      include: [
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
    res.status(200).send({ result: true, data: Br_grfShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Br_grfAlljoindt = async (req, res) => {
  try {
    // const { offset, limit } = req.body;

    const Br_grfShow = await Br_grfModel.findAll({
      include: [
        {
          model: Br_grfdtModel,
          // as: "postoposdt",
          // required: true,
        },
      ],
      // where: { refno: 'WPOS2410013' }
      // offset:offset,limit:limit 
    });
    res.status(200).send({ result: true, data: Br_grfShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

// *********************แก้ไขใหม่********************* 
exports.Br_grfByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Br_grfShow = await Br_grfModel.findOne({
      include: [
        {
          model: Br_grfdtModel,
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
    res.status(200).send({ result: true, data: Br_grfShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countBr_grf = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Br_grfModel.count({
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

exports.searchBr_grfrefno = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { refno } = await req.body;
    // console.log((typeproduct_name));

    const Br_grfShow = await Br_grfModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Br_grfShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Br_grfrefno = async (req, res) => {
  try {
    const refno = await Br_grfModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.searchBr_grfRunno = async (req, res) => {
  try {
    const Br_grfShow = await Br_grfModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Br_grfShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};