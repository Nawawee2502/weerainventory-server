const {
  Wh_stockcard,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User,
  Wh_rfs,
  Wh_rfsdt,
  Tbl_unit,
  Wh_product_lotno
} = require("../models/mainModel");

exports.addWh_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    console.log('Received Data:', {
      headerData,
      productArrayData,
      footerData
    });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!headerData.refno || !headerData.supplier_code || !headerData.branch_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      // 1. สร้าง WH_RFS record
      const rfsResult = await Wh_rfs.create({
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

      console.log('Created RFS:', rfsResult);

      // 2. สร้าง detail records
      if (Array.isArray(productArrayData)) {
        const detailsResult = await Wh_rfsdt.bulkCreate(
          productArrayData.map(item => ({
            refno: headerData.refno,
            product_code: item.product_code,
            qty: Number(item.qty),
            unit_code: item.unit_code,
            uprice: Number(item.uprice),
            tax1: item.tax1,
            expire_date: item.expire_date,
            texpire_date: item.texpire_date,
            instant_saving1: Number(item.instant_saving1),
            temperature1: item.temperature1,
            amt: Number(item.amt)
          })),
          { transaction: t }
        );

        console.log('Created details:', detailsResult);

        // 3. บันทึกข้อมูลลง stockcard
        for (const item of productArrayData) {
          // ตรวจสอบข้อมูลซ้ำใน stockcard
          const existingStockcard = await Wh_stockcard.findOne({
            where: {
              product_code: item.product_code,
              refno: headerData.refno,
              rdate: headerData.rdate
            },
            transaction: t
          });

          if (existingStockcard) {
            throw new Error(`Duplicate stockcard record for product ${item.product_code}`);
          }

          // บันทึกข้อมูลใน stockcard
          await Wh_stockcard.create({
            myear: headerData.myear,
            monthh: headerData.monthh,
            product_code: item.product_code,
            unit_code: item.unit_code,
            refno: headerData.refno,
            rdate: headerData.rdate,
            trdate: headerData.trdate,
            lotno: 0,
            beg1: Number(item.qty),
            in1: 0,
            out1: 0,
            upd1: 0,
            uprice: Number(item.uprice),
            beg1_amt: Number(item.amt),
            in1_amt: 0,
            out1_amt: 0,
            upd1_amt: 0
          }, { transaction: t });

          // 4. จัดการ lotno
          const product = await Tbl_product.findOne({
            where: { product_code: item.product_code },
            attributes: ['lotno'],
            transaction: t
          });

          const newLotno = (product?.lotno || 0) + 1;

          // บันทึก product lotno
          await Wh_product_lotno.create({
            product_code: item.product_code,
            lotno: newLotno,
            unit_code: item.unit_code,
            qty: Number(item.amt) || 0,
            uprice: Number(item.uprice),
            refno: headerData.refno,
            qty_use: 0.00,
            rdate: headerData.rdate
          }, { transaction: t });

          // อัพเดท lotno ในตาราง product
          await Tbl_product.update(
            { lotno: newLotno },
            {
              where: { product_code: item.product_code },
              transaction: t
            }
          );
        }
      }

      await t.commit();
      res.status(200).json({
        result: true,
        message: 'Created successfully'
      });

    } catch (error) {
      await t.rollback();
      console.error('Transaction Error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'Internal server error',
      errorDetail: error.stack
    });
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
    const { rdate1, rdate2, rdate } = req.body;
    const { supplier_code, branch_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

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
    const { rdate } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {
      refno: {
        [Op.gt]: 0,
      }
    };

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await Wh_rfs.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
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