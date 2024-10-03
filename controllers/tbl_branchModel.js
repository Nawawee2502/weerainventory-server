const tbl_branchModel = require("../models/mainModel").Tbl_branch;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addbranch = async (req, res) => {
  try {
    tbl_branchModel.create({
      branch_code: req.body.branch_code,
      branch_name: req.body.branch_name,
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

exports.updatebranch = async (req, res) => {
  try {
    await tbl_branchModel.update(
      {
        branch_name: req.body.branch_name,
        addr1: req.body.addr1,
        addr2: req.body.addr2,
        tel1: req.body.tel1,
      },
      {
        where: { branch_code: req.body.branch_code }
      }
    );
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};



exports.deletebranch = async (req, res) => {
  try {
    tbl_branchModel.destroy(
      {
        where: { branch_code: req.body.branch_code }
      }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.branchAll = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const branchShow = await tbl_branchModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: branchShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.branchcode = async (req, res) => {
  try {
    const branchcode = await tbl_branchModel.findOne({
      order: [['branch_code', 'DESC']],
    });
    res.status(200).send({ result: true, data: branchcode })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.countBranch = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await tbl_branchModel.count({
      where: {
        branch_code: {
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

exports.searchBranchName = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { branch_name } = await req.body;
    // console.log((typeproduct_name));


    const branchShow = await tbl_branchModel.findAll({
      where: {
        branch_name: {
          [Op.like]: `%${branch_name}%`
        },
      }
    });
    res.status(200).send({ result: true, data: branchShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};