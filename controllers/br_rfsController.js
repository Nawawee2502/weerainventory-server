const {
  Br_rfs: br_rfsModel,
  Br_rfsdt: br_rfsdtModel,
  Br_stockcard,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  Tbl_unit,
  User,
  Unit
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addBr_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.supplier_code || !headerData.branch_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      await br_rfsModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        branch_code: headerData.branch_code,
        supplier_code: headerData.supplier_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: footerData.taxable || 0,
        nontaxable: footerData.nontaxable || 0,
        total: footerData.total || 0
      }, { transaction: t });

      await br_rfsdtModel.bulkCreate(
        productArrayData.map(item => ({
          refno: headerData.refno,
          product_code: item.product_code,
          qty: Number(item.qty || 0),
          unit_code: item.unit_code,
          uprice: Number(item.uprice || 0),
          tax1: item.tax1,
          expire_date: item.expire_date || null,
          texpire_date: item.texpire_date || null,
          temperature1: item.temperature1 || null,
          amt: Number(item.amt || 0)
        })),
        { transaction: t }
      );

      // Stockcard update logic remains the same
      for (const item of productArrayData) {
        const stockcardRecords = await Br_stockcard.findAll({
          where: {
            product_code: item.product_code,
            branch_code: headerData.branch_code
          },
          order: [['rdate', 'DESC'], ['refno', 'DESC']],
          raw: true,
          transaction: t
        });

        const totals = stockcardRecords.reduce((acc, record) => ({
          beg1: acc.beg1 + Number(record.beg1 || 0),
          in1: acc.in1 + Number(record.in1 || 0),
          out1: acc.out1 + Number(record.out1 || 0),
          upd1: acc.upd1 + Number(record.upd1 || 0),
          beg1_amt: acc.beg1_amt + Number(record.beg1_amt || 0),
          in1_amt: acc.in1_amt + Number(record.in1_amt || 0),
          out1_amt: acc.out1_amt + Number(record.out1_amt || 0),
          upd1_amt: acc.upd1_amt + Number(record.upd1_amt || 0)
        }), {
          beg1: 0, in1: 0, out1: 0, upd1: 0,
          beg1_amt: 0, in1_amt: 0, out1_amt: 0, upd1_amt: 0
        });

        const newAmount = Number(item.qty || 0);
        const newPrice = Number(item.uprice || 0);
        const newAmountValue = newAmount * newPrice;

        const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
        const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

        await Br_stockcard.create({
          myear: headerData.myear,
          monthh: headerData.monthh,
          product_code: item.product_code,
          unit_code: item.unit_code,
          refno: headerData.refno,
          branch_code: headerData.branch_code,
          rdate: headerData.rdate,
          trdate: headerData.trdate,
          lotno: 0,
          beg1: 0,
          in1: newAmount,
          out1: 0,
          upd1: 0,
          uprice: newPrice,
          beg1_amt: 0,
          in1_amt: newAmountValue,
          out1_amt: 0,
          upd1_amt: 0,
          balance: previousBalance + newAmount,
          balance_amount: previousBalanceAmount + newAmountValue
        }, { transaction: t });
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

exports.updateBr_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // ดึงข้อมูลจาก headerData
    const headerData = updateData.headerData;
    if (!headerData || !headerData.refno) {
      throw new Error('Missing required header data or refno');
    }

    // First update the header record
    const updateResult = await br_rfsModel.update(
      {
        rdate: headerData.rdate,
        trdate: headerData.trdate,
        myear: headerData.myear,
        monthh: headerData.monthh,
        supplier_code: headerData.supplier_code,
        branch_code: headerData.branch_code,
        taxable: headerData.taxable || 0,
        nontaxable: headerData.nontaxable || 0,
        total: headerData.total || 0,
        user_code: headerData.user_code,
      },
      {
        where: { refno: headerData.refno },
        transaction: t
      }
    );

    // Delete existing detail records
    await br_rfsdtModel.destroy({
      where: { refno: headerData.refno },
      transaction: t
    });

    // Insert detail records
    if (updateData.productArrayData && updateData.productArrayData.length > 0) {
      await br_rfsdtModel.bulkCreate(updateData.productArrayData, { transaction: t });
    }

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Updated successfully',
      updatedRows: updateResult[0]
    });

  } catch (error) {
    await t.rollback();
    console.error('Update Error:', error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.deleteBr_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await br_rfsdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Br_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await br_rfsModel.destroy({
      where: { refno },
      transaction: t
    });

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Deleted successfully',
      deletedRows: deleteResult
    });

  } catch (error) {
    await t.rollback();
    console.error('Delete Error:', error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Br_rfsAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, supplier_name, branch_name } = req.body;

    let wheresupplier = { supplier_name: { [Op.like]: '%' } };
    if (supplier_name) {
      wheresupplier = { supplier_name: { [Op.like]: `%${supplier_name}%` } };
    }

    let wherebranch = { branch_name: { [Op.like]: '%' } };
    if (branch_name) {
      wherebranch = { branch_name: { [Op.like]: `%${branch_name}%` } };
    }

    const br_rfsShow = await br_rfsModel.findAll({
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
      where: {
        trdate: { [Op.between]: [rdate1, rdate2] }
      },
      attributes: {
        include: [
          'balance',
          'balance_amount'
        ]
      }
    });

    res.status(200).send({
      result: true,
      data: br_rfsShow
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_rfsAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, rdate, supplier_code, branch_code, product_code, refno } = req.body;

    let whereClause = {};

    if (refno) {
      whereClause.refno = refno;
    } else {
      if (rdate) whereClause.rdate = rdate;
      if (rdate1 && rdate2) whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
      if (supplier_code) whereClause.supplier_code = supplier_code;
      if (branch_code) whereClause.branch_code = branch_code;
    }

    // Fetch the data with proper includes
    const br_rfs_data = await br_rfsModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'supplier_code', 'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
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
      offset: parseInt(offset) || 0,
      limit: refno ? null : (parseInt(limit) || 10)
    });

    // Transform data to include explict properties
    const transformedData = br_rfs_data.map(item => {
      const plainItem = item.toJSON();
      return {
        ...plainItem,
        branch_name: plainItem.tbl_branch?.branch_name || '-',
        supplier_name: plainItem.tbl_supplier?.supplier_name || '-',
        username: plainItem.user?.username || '-'
      };
    });

    console.log("Br_rfsAlljoindt transformed data (excerpt):",
      transformedData.map(item => ({
        refno: item.refno,
        branch_code: item.branch_code,
        branch_name: item.branch_name,
        supplier_name: item.supplier_name
      }))
    );

    res.status(200).send({
      result: true,
      data: transformedData,
      total: transformedData.length
    });

  } catch (error) {
    console.error("Error in Br_rfsAlljoindt:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Br_rfsByRefno = async (req, res) => {
  try {
    // ดึงค่า refno จาก request
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    console.log('กำลังดึงข้อมูลใบรับสินค้าจาก Supplier เลขที่:', refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'ต้องระบุเลขที่อ้างอิง (refno)'
      });
    }

    // ดึงข้อมูลหลักของใบรับสินค้าจาก Supplier (header)
    const br_rfsHeader = await br_rfsModel.findOne({
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name', 'addr1', 'addr2', 'tel1'],
          required: false
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name', 'addr1', 'addr2', 'tel1'],
          required: false
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_code', 'username'],
          required: false
        }
      ],
      where: { refno: refnoValue }
    });

    if (!br_rfsHeader) {
      console.log('ไม่พบข้อมูลใบรับสินค้าจาก Supplier เลขที่:', refnoValue);
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลใบรับสินค้าจาก Supplier'
      });
    }

    // ดึงข้อมูลรายการสินค้า (details) แยกต่างหาก
    const br_rfsDetails = await br_rfsdtModel.findAll({
      include: [
        {
          model: Tbl_product,
          required: false
        },
        {
          model: Tbl_unit,
          required: false,
        }
      ],
      where: { refno: refnoValue }
    });

    console.log(`พบรายการสินค้าทั้งหมด ${br_rfsDetails.length} รายการในใบรับสินค้าจาก Supplier เลขที่ ${refnoValue}`);

    // แสดงข้อมูลตัวอย่างสำหรับการตรวจสอบ
    if (br_rfsDetails.length > 0) {
      console.log('ตัวอย่างข้อมูลสินค้าชิ้นแรก:', {
        product_code: br_rfsDetails[0].product_code,
        product_name: br_rfsDetails[0].tbl_product?.product_name || 'ไม่มี',
        qty: br_rfsDetails[0].qty,
        unit: br_rfsDetails[0].tbl_unit?.unit_name || br_rfsDetails[0].unit_code || 'ไม่มี'
      });
    }

    // แปลงข้อมูลเป็น plain objects เพื่อป้องกันปัญหา
    const result = br_rfsHeader.toJSON();

    // ปรับแต่งข้อมูลรายการสินค้าและเติมข้อมูลที่หายไป
    const processedDetails = br_rfsDetails.map(detail => {
      const detailObj = detail.toJSON();

      // ตรวจสอบและเติมข้อมูลที่หายไป
      if (!detailObj.tbl_product) {
        detailObj.tbl_product = { product_name: 'Product Description' };
      }

      if (!detailObj.tbl_unit) {
        detailObj.tbl_unit = { unit_name: detailObj.unit_code || '' };
      }

      return detailObj;
    });

    // เพิ่มข้อมูลรายการสินค้าเข้าไปในผลลัพธ์
    result.br_rfsdts = processedDetails;

    // ส่งข้อมูลกลับ
    res.status(200).json({
      result: true,
      data: result
    });

  } catch (error) {
    console.error('Error in Br_rfsByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลใบรับสินค้าจาก Supplier ได้',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.countBr_rfs = async (req, res) => {
  try {
    const { rdate } = req.body;

    let whereClause = {
      refno: {
        [Op.gt]: 0,
      }
    };

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await br_rfsModel.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchBr_rfsrefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const br_rfsShow = await br_rfsModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: br_rfsShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.Br_rfsrefno = async (req, res) => {
  try {
    const refno = await br_rfsModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchBr_rfsRunno = async (req, res) => {
  try {
    const br_rfsShow = await br_rfsModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: br_rfsShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.getRfsByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await br_rfsModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'supplier_code', 'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
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
      where: { refno: refno }
    });

    if (!orderData) {
      return res.status(404).send({
        result: false,
        message: 'Order not found'
      });
    }

    res.status(200).send({
      result: true,
      data: orderData
    });

  } catch (error) {
    console.error("Error in getRfsByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};