const tbl_typeuserModel = require("../models/mainModel").Tbl_typeuser;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addtypeuser = async (req, res) => {
  try {
    tbl_typeuserModel.create({
      typeuser_code: req.body.typeuser_code,
      typeuser_name: req.body.typeuser_name,

    })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updatetypeuser = async (req, res) => {
  try {
    tbl_typeuserModel.update(
      { typeuser_name: req.body.typeuser_name },
      { where: { typeuser_code: req.body.typeuser_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deletetypeuser = async (req, res) => {
  try {
    tbl_typeuserModel.destroy(
      { where: { typeuser_code: req.body.typeuser_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.typeuserAll = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const typeuserShow = await tbl_typeuserModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: typeuserShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.counttypeUser = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await tbl_typeuserModel.count({
      where: {
        typeuser_code: {
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

exports.typeUsercode = async (req, res) => {
  try {
    const usercode = await tbl_typeuserModel.findOne({
      order: [['typeuser_code', 'DESC']],
    });
    res.status(200).send({ result: true, data: usercode })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchUserTypeName = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { typeuser_name } = await req.body;
    // console.log((typeproduct_name));


    const typeuserShow = await tbl_typeuserModel.findAll({
      where: {
        typeuser_name: {
          [Op.like]: `%${typeuser_name}%`
        },
      }
    });
    res.status(200).send({ result: true, data: typeuserShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};