const Tbl_product = require("../models/mainModel").Tbl_product;
const Br_minnum_stockModel = require("../models/mainModel").Br_minnum_stock;
const tbl_unit = require("../models/mainModel").Tbl_unit;
const Tbl_branch = require("../models/mainModel").Tbl_branch;
const { Op } = require("sequelize");

exports.addBr_minnum_stock = async (req, res) => {
  try {
    // Check if the record already exists
    const existingRecord = await Br_minnum_stockModel.findOne({
      where: {
        product_code: req.body.product_code,
        branch_code: req.body.branch_code
      }
    });

    if (existingRecord) {
      return res.status(400).send({
        result: false,
        message: "This product is already set for this restaurant"
      });
    }

    // Create record without restaurant field if it doesn't exist in the database
    await Br_minnum_stockModel.create({
      product_code: req.body.product_code,
      branch_code: req.body.branch_code,
      unit_code: req.body.unit_code,
      min_qty: req.body.min_qty
    });

    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ result: false, message: error.message });
  }
};

exports.updateBr_minnum_stock = async (req, res) => {
  try {
    console.log("Update request:", req.body);
    const [updatedRows] = await Br_minnum_stockModel.update(
      {
        unit_code: req.body.unit_code,
        min_qty: req.body.min_qty
      },
      {
        where: {
          product_code: req.body.product_code,
          branch_code: req.body.branch_code
        }
      }
    );
    console.log("Updated rows:", updatedRows);
    res.status(200).send({ result: true, updatedRows });
  } catch (error) {
    console.log(error);
    res.status(500).send({ result: false, message: error.message });
  }
};

exports.deleteBr_minnum_stock = async (req, res) => {
  try {
    await Br_minnum_stockModel.destroy(
      {
        where: {
          product_code: req.body.product_code,
          branch_code: req.body.branch_code
        }
      }
    );
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ result: false, message: error.message });
  }
};

exports.Query_Br_minnum_stock = async (req, res) => {
  try {
    const { offset = 0, limit = 10, branch_code } = req.body;

    const whereClause = {};
    if (branch_code) {
      whereClause.branch_code = branch_code;
    }

    const Br_minnum_stockModelShow = await Br_minnum_stockModel.findAll({
      where: whereClause,
      include: [
        {
          model: Tbl_product,
          as: 'tbl_product',
          attributes: ['product_code', 'product_name'],
          required: false
        },
        {
          model: tbl_unit,
          as: 'tbl_unit',
          attributes: ['unit_code', 'unit_name'],
          required: false
        },
        {
          model: Tbl_branch,
          as: 'tbl_branch',
          attributes: ['branch_code', 'branch_name'],
          required: false
        }
      ],
      order: [['product_code', 'ASC']],
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 10
    });

    res.status(200).send({ result: true, data: Br_minnum_stockModelShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ result: false, message: error.message });
  }
};

exports.SearchBr_minnum_stock = async (req, res) => {
  try {
    const { product_code, product_name, branch_code } = req.body;

    const whereClause = {};
    const productWhereClause = {};

    if (product_code) {
      whereClause.product_code = { [Op.eq]: product_code };
    }

    if (product_name && Br_minnum_stockModel.associations.tbl_product) {
      productWhereClause.product_name = { [Op.like]: `%${product_name}%` };
    }

    if (branch_code) {
      whereClause.branch_code = { [Op.eq]: branch_code };
    }

    const includes = [];

    // Check if associations exist before including them
    if (Br_minnum_stockModel.associations.tbl_product) {
      includes.push({
        model: Tbl_product,
        as: 'tbl_product',
        attributes: ['product_code', 'product_name'],
        required: product_name ? true : false,
        where: Object.keys(productWhereClause).length > 0 ? productWhereClause : undefined
      });
    }

    if (Br_minnum_stockModel.associations.tbl_branch) {
      includes.push({
        model: Tbl_branch,
        as: 'tbl_branch',
        attributes: ['branch_code', 'branch_name'],
        required: false
      });
    }

    if (Br_minnum_stockModel.associations.tbl_unit) {
      includes.push({
        model: tbl_unit,
        as: 'tbl_unit',
        attributes: ['unit_code', 'unit_name'],
        required: false
      });
    }

    const Br_minnum_stockShow = await Br_minnum_stockModel.findAll({
      include: includes,
      where: whereClause
    });

    res.status(200).send({ result: true, data: Br_minnum_stockShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ result: false, message: error.message });
  }
};

exports.countBr_minnum_stock = async (req, res) => {
  try {
    const { branch_code } = req.body;

    const whereClause = {};
    if (branch_code) {
      whereClause.branch_code = branch_code;
    }

    const amount = await Br_minnum_stockModel.count({
      where: whereClause,
      distinct: true,
      col: 'product_code'
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.log(error);
    res.status(500).send({ result: false, message: error.message });
  }
};