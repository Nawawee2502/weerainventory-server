const {
  Kt_pow: kt_powModel,
  Kt_powdt: kt_powdtModel,
  Tbl_unit: unitModel,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User,
  Kt_stockcard,
  Kt_product_lotno,
  Tbl_kitchen
} = require("../models/mainModel");

exports.addKt_pow = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;
    console.log("headerData", headerData);

    if (!headerData.refno || !headerData.kitchen_code) {
      throw new Error('Missing required fields');
    }

    try {
      await kt_powModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: headerData.taxable,
        nontaxable: headerData.nontaxable,
        total: footerData.total
      }, { transaction: t });

      console.log("Create details:", productArrayData);
      await kt_powdtModel.bulkCreate(productArrayData, { transaction: t });

      await t.commit();
      res.status(200).send({ result: true });

    } catch (error) {
      await t.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.updateKt_pow = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    await kt_powModel.update(
      {
        rdate: req.body.rdate,
        trdate: req.body.trdate,
        myear: req.body.myear,
        monthh: req.body.monthh,
        kitchen_code: req.body.kitchen_code,
        taxable: req.body.taxable,
        nontaxable: req.body.nontaxable,
        total: req.body.total,
        user_code: req.body.user_code
      },
      {
        where: { refno: req.body.refno },
        transaction: t
      }
    );

    await t.commit();
    res.status(200).send({ result: true });

  } catch (error) {
    await t.rollback();
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.deleteKt_pow = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    await kt_powModel.destroy({
      where: { refno: req.body.refno },
      transaction: t
    });

    await t.commit();
    res.status(200).send({ result: true });

  } catch (error) {
    await t.rollback();
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_powAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;
    const { Op } = require("sequelize");

    let whereKitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      whereKitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const kt_powShow = await kt_powModel.findAll({
      include: [
        {
          model: Tbl_branch,
          attributes: ['kitchen_code', 'kitchen_name'],
          where: whereKitchen,
          required: true,
        }
      ],
      where: {
        trdate: { [Op.between]: [rdate1, rdate2] }
      }
    });

    res.status(200).send({ result: true, data: kt_powShow });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_powAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate, kitchen_code, product_code } = req.body;
    const { Op } = require("sequelize");
 
    let whereClause = {};
    let includeClause = [
      {
        model: Tbl_kitchen,
        attributes: ['kitchen_code', 'kitchen_name'],
        required: false
      },
      {
        model: User,
        as: 'user',
        attributes: ['user_code', 'username'],
        required: false
      }
    ];
 
    // Build where clause
    if (rdate) {
      whereClause.rdate = rdate;
    }
 
    if (kitchen_code && kitchen_code !== '') {
      whereClause.kitchen_code = kitchen_code;
    }
 
    // Add product search if needed
    if (product_code && product_code !== '') {
      includeClause.push({
        model: kt_powdtModel,
        required: true,
        include: [{
          model: Tbl_product,
          required: true,
          where: {
            product_name: {
              [Op.like]: `%${product_code}%`
            }
          }
        }]
      });
    } else {
      // If no product search, still include kt_powdt but without product filter
      includeClause.push({
        model: kt_powdtModel,
        include: [{
          model: Tbl_product
        }]
      });
    }
 
    // Query for data with pagination
    const kt_pow_headers = await kt_powModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      where: whereClause,
      include: includeClause,
      order: [['refno', 'ASC']],
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 10
    });
 
    // Get total count for pagination
    const total = await kt_powModel.count({
      where: whereClause,
      include: includeClause,
      distinct: true,
      col: 'refno'
    });
 
    // Send response
    if (kt_pow_headers.length > 0) {
      res.status(200).send({
        result: true,
        data: kt_pow_headers,
        count: total
      });
    } else {
      res.status(200).send({
        result: true,
        data: [],
        count: 0
      });
    }
 
  } catch (error) {
    console.error("Error in Kt_powAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
 };

exports.Kt_powByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const kt_powShow = await kt_powModel.findOne({
      include: [
        {
          model: kt_powdtModel,
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
        },
      ],
      where: { refno }
    });

    res.status(200).send({ result: true, data: kt_powShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.countKt_pow = async (req, res) => {
  try {
    const { rdate } = req.body;
    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await kt_powModel.count({
      where: whereClause
    });

    res.status(200).send({
      result: true,
      data: amount
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.searchKt_powrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const kt_powShow = await kt_powModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        }
      }
    });

    res.status(200).send({ result: true, data: kt_powShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_powrefno = async (req, res) => {
  try {
    const refno = await kt_powModel.findOne({
      order: [['refno', 'DESC']]
    });
    console.log("lastrefno", refno);
    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.searchKt_powRunno = async (req, res) => {
  try {
    const kt_powShow = await kt_powModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']]
    });

    res.status(200).send({ result: true, data: kt_powShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};