const {
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User,  // Add this
  Br_rfs: br_rfsModel,
  Br_rfsdt: br_rfsdtModel
} = require("../models/mainModel");

exports.addBr_rfs = async (req, res) => {
  try {
    const headerData = req.body.headerData;
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;

    const t = await sequelize.transaction();

    try {
      // Create BR_RFS record
      await Br_rfs.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        supplier_code: headerData.supplier_code,
        branch_code: headerData.branch_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: footerData.taxable,
        nontaxable: footerData.nontaxable,
        total: footerData.total,
        instant_saving: footerData.instant_saving,
        delivery_surcharge: footerData.delivery_surcharge,
        sale_tax: footerData.sale_tax,
        total_due: footerData.total_due,
      }, { transaction: t });

      // Create BR_RFSDT records
      await Br_rfsdt.bulkCreate(productArrayData, { transaction: t });

      // Get all products with conversion factors
      const productCodes = productArrayData.map(p => p.product_code);
      const products = await Tbl_product.findAll({
        where: { product_code: productCodes },
        attributes: ['product_code', 'unit_conversion_factor', 'bulk_unit_code', 'retail_unit_code'],
        transaction: t
      });

      // Create stock card records
      const stockcardRecords = productArrayData.map(product => {
        const productDetails = products.find(p => p.product_code === product.product_code);

        let amount = parseFloat(product.amt) || 0;
        let quantity = amount;  // Default for retail unit
        let retailPrice = Number(product.uprice) || 0;

        // Convert quantity to retail units if input is in bulk units
        if (product.unit_code === productDetails?.bulk_unit_code) {
          const conversion = parseInt(productDetails.unit_conversion_factor) || 1;
          quantity = amount * conversion;
          retailPrice = retailPrice / conversion;  // Convert price to retail unit price
        }

        return {
          refno: headerData.refno,
          rdate: headerData.rdate,
          trdate: headerData.trdate,
          myear: headerData.myear,
          monthh: headerData.monthh,
          product_code: product.product_code,
          unit_code: productDetails?.retail_unit_code || product.unit_code,
          beg1: 0,
          in1: quantity,  // Use converted quantity for bulk units
          out1: 0,
          upd1: 0,
          uprice: retailPrice,  // Always store retail unit price
          beg1_amt: 0,
          in1_amt: amount * product.uprice,  // Use original amount and price
          out1_amt: 0,
          upd1_amt: 0
        };
      });

      await Br_stockcard.bulkCreate(stockcardRecords, { transaction: t });

      await t.commit();
      res.status(200).send({ result: true });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
};

exports.updateBr_rfs = async (req, res) => {
  try {
    Br_rfs.update(
      {
        rdate: req.body.rdate,
        trdate: req.body.trdate,
        myear: req.body.myear,
        monthh: req.body.monthh,
        supplier_code: req.body.supplier_code,
        branch_code: req.body.branch_code,
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

exports.deleteBr_rfs = async (req, res) => {
  try {
    Br_rfs.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Br_rfsAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, supplier_name, branch_name } = req.body;
    const { Op } = require("sequelize");

    let wheresupplier = { supplier_name: { [Op.like]: '%' } };
    if (supplier_name) {
      wheresupplier = { supplier_name: { [Op.like]: `%${supplier_name}%` } };
    }

    let wherebranch = { branch_name: { [Op.like]: '%' } };
    if (branch_name) {
      wherebranch = { branch_name: { [Op.like]: `%${branch_name}%` } };
    }

    const br_rfsShow = await Br_rfs.findAll({
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          where: wheresupplier,
          required: true,
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          where: wherebranch,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });
    res.status(200).send({ result: true, data: br_rfsShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Br_rfsAlljoindt = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const { rdate1, rdate2 } = req.body;
    const { supplier_code, branch_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (supplier_code && supplier_code !== '') {
      whereClause.supplier_code = supplier_code;
    }

    if (branch_code && branch_code !== '') {
      whereClause.branch_code = branch_code;
    }

    let br_rfs_headers = await Br_rfs.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'supplier_code', 'branch_code', 'taxable', 'nontaxable',
        'total', 'instant_saving', 'delivery_surcharge',
        'sale_tax', 'total_due', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          required: false
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          required: false
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_code', 'username'],
          required: false
        }
      ],
      where: whereClause,
      order: [['refno', 'ASC']],
      offset: offset,
      limit: limit
    });

    if (br_rfs_headers.length > 0) {
      const refnos = br_rfs_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause = {
          refno: refnos,
          '$tbl_product.product_name$': { [Op.like]: `%${product_code}%` }
        };
      }

      const details = await Br_rfsdt.findAll({
        where: whereDetailClause,
        include: [
          {
            model: Tbl_product,
            attributes: ['product_code', 'product_name'],
            required: true
          },
          {
            model: Tbl_unit,
            attributes: ['unit_code', 'unit_name'],
            required: false
          }
        ]
      });

      const detailsByRefno = {};
      details.forEach(detail => {
        if (!detailsByRefno[detail.refno]) {
          detailsByRefno[detail.refno] = [];
        }
        detailsByRefno[detail.refno].push(detail);
      });

      br_rfs_headers = br_rfs_headers.map(header => {
        const headerData = header.toJSON();
        headerData.br_rfsdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: br_rfs_headers
    });

  } catch (error) {
    console.log("Error in Br_rfsAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_rfsByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const br_rfsShow = await Br_rfs.findOne({
      include: [
        {
          model: Br_rfsdt,
          include: [{
            model: Tbl_product,
            include: [
              {
                model: Tbl_unit,
                as: 'productUnit1',
                required: true,
              },
              {
                model: Tbl_unit,
                as: 'productUnit2',
                required: true,
              },
            ],
          }],
        },
      ],
      where: { refno: refno }
    });
    res.status(200).send({ result: true, data: br_rfsShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countBr_rfs = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Br_rfs.count({
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

exports.searchBr_rfsrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const br_rfsShow = await Br_rfs.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: br_rfsShow });
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Br_rfsrefno = async (req, res) => {
  try {
    const refno = await Br_rfs.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchBr_rfsRunno = async (req, res) => {
  try {
    const br_rfsShow = await Br_rfs.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: br_rfsShow });
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};