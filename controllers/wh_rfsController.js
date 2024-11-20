const {
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User,
  Wh_rfs,
  Wh_rfsdt,
  Tbl_unit
} = require("../models/mainModel");

exports.addWh_rfs = async (req, res) => {
  try {
    const headerData = req.body.headerData;
    console.log("headerData", headerData)
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;

    Wh_rfs.create({
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
    })
      .then(() => {
        console.log("THEN")
        console.log(productArrayData)
        Wh_rfsdt.bulkCreate(productArrayData)
      })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.updateWh_rfs = async (req, res) => {
  try {
    Wh_rfs.update(
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

exports.deleteWh_rfs = async (req, res) => {
  try {
    Wh_rfs.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfsAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, supplier_name, branch_name } = req.body;
    const { Op } = require("sequelize");

    const wheresupplier = { supplier_name: { [Op.like]: '%', } };
    if (supplier_name)
      wheresupplier = { $like: '%' + supplier_name + '%' };

    const wherebranch = { branch_name: { [Op.like]: '%', } };
    if (branch_name)
      wherebranch = { $like: '%' + branch_name + '%' };

    const wh_rfsShow = await Wh_rfs.findAll({
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
    res.status(200).send({ result: true, data: wh_rfsShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfsAlljoindt = async (req, res) => {
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

    let wh_rfs_headers = await Wh_rfs.findAll({
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

    if (wh_rfs_headers.length > 0) {
      const refnos = wh_rfs_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause = {
          refno: refnos,
          '$tbl_product.product_name$': { [Op.like]: `%${product_code}%` }
        };
      }

      const details = await Wh_rfsdt.findAll({
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

      wh_rfs_headers = wh_rfs_headers.map(header => {
        const headerData = header.toJSON();
        headerData.wh_rfsdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: wh_rfs_headers
    });

  } catch (error) {
    console.log("Error in Wh_rfsAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Wh_rfsByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const wh_rfsShow = await Wh_rfs.findOne({
      include: [
        {
          model: Wh_rfsdt,
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
    res.status(200).send({ result: true, data: wh_rfsShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countWh_rfs = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Wh_rfs.count({
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

exports.searchWh_rfsrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const Wh_rfsShow = await Wh_rfs.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Wh_rfsShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfsrefno = async (req, res) => {
  try {
    const refno = await Wh_rfs.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchWh_rfsRunno = async (req, res) => {
  try {
    const Wh_rfsShow = await Wh_rfs.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_rfsShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};