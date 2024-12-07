const wh_dpbModel = require("../models/mainModel").Wh_dpb;
const wh_dpbdtModel = require("../models/mainModel").Wh_dpbdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sequelize, Tbl_product } = require("../models/mainModel");
const { Tbl_branch } = require("../models/mainModel");

exports.addWh_dpb = async (req, res) => {
  try {
    const headerData = req.body.headerData;
    console.log("headerData", headerData)
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;

    wh_dpbModel.create({
      refno: headerData.refno,
      rdate: headerData.rdate,
      branch_code: headerData.branch_code,
      trdate: headerData.trdate,
      monthh: headerData.monthh,
      myear: headerData.myear,
      user_code: headerData.user_code,
      taxable: headerData.taxable,
      nontaxable: headerData.nontaxable,
      total: footerData.total
    })
      .then(() => {
        console.log("THEN")
        console.log(productArrayData)
        wh_dpbdtModel.bulkCreate(productArrayData)
      })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.updateWh_dpb = async (req, res) => {
  try {
    await wh_dpbModel.update(
      {
        rdate: req.body.rdate,
        trdate: req.body.trdate,
        myear: req.body.myear,
        monthh: req.body.monthh,
        branch_code: req.body.branch_code,
        taxable: req.body.taxable,
        nontaxable: req.body.nontaxable,
        total: req.body.total,
        user_code: req.body.user_code,
      },
      { where: { refno: req.body.refno } }
    );

    res.status(200).send({ result: true });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.deleteWh_dpb = async (req, res) => {
  try {
    await wh_dpbModel.destroy({ where: { refno: req.body.refno } });
    res.status(200).send({ result: true });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.Wh_dpbAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, branch_name } = req.body;
    const { Op } = require("sequelize");

    const wherebranch = { branch_name: { [Op.like]: '%', } };
    if (branch_name) wherebranch = { $like: '%' + branch_name + '%' };

    const wh_dpbShow = await wh_dpbModel.findAll({
      include: [
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          where: wherebranch,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
      offset,
      limit,
    });

    res.status(200).send({ result: true, data: wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.Wh_dpbAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, branch_name } = req.body;
    const { Op } = require("sequelize");

    // Create the where clause for the header
    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (branch_name && branch_name !== '') {
      whereClause.branch_name = { [Op.like]: `%${branch_name}%` };
    }

    // Fetch the header data first
    let wh_dpb_headers = await wh_dpbModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'branch_code', 'branch_name', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          required: true
        }
      ],
      where: whereClause,
      order: [['refno', 'ASC']],
      offset,
      limit
    });

    // Fetch the detail data
    if (wh_dpb_headers.length > 0) {
      const refnos = wh_dpb_headers.map(header => header.refno);

      // Create the where clause for the details
      let whereDetailClause = {
        refno: refnos
      };

      const details = await wh_dpbdtModel.findAll({
        where: whereDetailClause,
        include: [
          {
            model: Tbl_product,
            attributes: ['product_code', 'product_name'],
            required: true
          },
          {
            model: Tbl_unit,
            as: 'productUnit1',
            required: true
          },
          {
            model: Tbl_unit,
            as: 'productUnit2',
            required: true
          }
        ]
      });

      // Group the detail data by refno
      const detailsByRefno = {};
      details.forEach(detail => {
        if (!detailsByRefno[detail.refno]) {
          detailsByRefno[detail.refno] = [];
        }
        detailsByRefno[detail.refno].push(detail);
      });

      // Combine the header and detail data
      wh_dpb_headers = wh_dpb_headers.map(header => {
        const headerData = header.toJSON();
        headerData.wh_dpbdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: wh_dpb_headers
    });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.Wh_dpbByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const wh_dpbShow = await wh_dpbModel.findOne({
      include: [
        {
          model: wh_dpbdtModel,
          include: [{
            model: Tbl_product,
            include: [
              { model: Tbl_unit, as: 'productUnit1', required: true },
              { model: Tbl_unit, as: 'productUnit2', required: true },
            ],
          }],
        },
      ],
      where: { refno },
    });

    res.status(200).send({ result: true, data: wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.countWh_dpb = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await wh_dpbModel.count({
      where: {
        refno: {
          [Op.gt]: 0,
        },
      },
    });
    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.searchWh_dpbrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const Wh_dpbShow = await wh_dpbModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });

    res.status(200).send({ result: true, data: Wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.Wh_dpbrefno = async (req, res) => {
  try {
    const refno = await wh_dpbModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    res.status(500).send({ message: error });
  }
}

exports.searchWh_dpbRunno = async (req, res) => {
  try {
    const Wh_dpbShow = await wh_dpbModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
}