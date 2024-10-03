const tbl_unitModel = require("../models/mainModel").Tbl_unit;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addunit = async (req, res) => {
  try {
    tbl_unitModel.create({
      unit_code: req.body.unit_code,
      unit_name: req.body.unit_name,

    })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateunit = async (req, res) => {
  try {
    tbl_unitModel.update(
      { unit_name: req.body.unit_name },
      { where: { unit_code: req.body.unit_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteunit = async (req, res) => {
  try {
    tbl_unitModel.destroy(
      { where: { unit_code: req.body.unit_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.unitAll = async (req, res) => {
  try {
    const { offset, limit } = req.body;

    const unitShow = await tbl_unitModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: unitShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.unitcode = async (req, res) => {
  try {
    const unitcode = await tbl_unitModel.findOne({
      order: [['unit_code', 'DESC']],
    });
    res.status(200).send({ result: true, data: unitcode })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.countUnit = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await tbl_unitModel.count({
      where: {
        unit_code: {
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

exports.searchUnitName = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { unit_name } = await req.body;
    // console.log((typeproduct_name));


    const UnitShow = await tbl_unitModel.findAll({
      where: {
        unit_name: {
          [Op.like]: `%${unit_name}%`
        },
      }
    });
    res.status(200).send({ result: true, data: UnitShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};