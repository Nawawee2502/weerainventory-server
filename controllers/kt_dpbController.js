const {
  Kt_dpb: Kt_dpbModel,
  Kt_dpbdt: Kt_dpbdtModel,
  Tbl_unit: unitModel,
  sequelize,
  Tbl_product,
  Tbl_kitchen,
  Tbl_branch,
  User,
  Kt_stockcard
} = require("../models/mainModel");
const { Op } = require("sequelize");


exports.addKt_dpb = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.kitchen_code || !headerData.branch_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      await Kt_dpbModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        branch_code: headerData.branch_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: headerData.taxable,
        nontaxable: headerData.nontaxable,
        total: footerData.total
      }, { transaction: t });

      await Kt_dpbdtModel.bulkCreate(productArrayData, { transaction: t });

      for (const item of productArrayData) {
        const stockcardRecords = await Kt_stockcard.findAll({
          where: { product_code: item.product_code },
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

        const outAmount = Number(item.qty || 0);
        const outPrice = Number(item.uprice || 0);
        const outAmountValue = outAmount * outPrice;

        const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
        const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

        await Kt_stockcard.create({
          myear: headerData.myear,
          monthh: headerData.monthh,
          product_code: item.product_code,
          kitchen_code: headerData.kitchen_code,
          unit_code: item.unit_code,
          refno: headerData.refno,
          rdate: headerData.rdate,
          trdate: headerData.trdate,
          lotno: 0,
          beg1: 0,
          in1: 0,
          out1: outAmount,
          upd1: 0,
          uprice: outPrice,
          beg1_amt: 0,
          in1_amt: 0,
          out1_amt: outAmountValue,
          upd1_amt: 0,
          balance: previousBalance - outAmount,
          balance_amount: previousBalanceAmount - outAmountValue
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


exports.updateKt_dpb = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // Check if we have the new structure with headerData
    if (updateData.headerData) {
      // We're receiving the new nested structure
      const { headerData, productArrayData, footerData } = updateData;

      // Make sure we have a valid refno in headerData
      if (!headerData.refno) {
        throw new Error('Missing required refno in header data');
      }

      // Update the header record
      const updateResult = await Kt_dpbModel.update(
        {
          rdate: headerData.rdate,
          trdate: headerData.trdate,
          myear: headerData.myear,
          monthh: headerData.monthh,
          kitchen_code: headerData.kitchen_code,
          branch_code: headerData.branch_code,
          taxable: footerData.taxable || 0,
          nontaxable: footerData.nontaxable || 0,
          total: footerData.total || 0,
          user_code: headerData.user_code,
        },
        {
          where: { refno: headerData.refno },
          transaction: t
        }
      );

      // Delete existing detail records
      await Kt_dpbdtModel.destroy({
        where: { refno: headerData.refno },
        transaction: t
      });

      console.log("Deleted existing details, now inserting new products:",
        productArrayData ? productArrayData.length : "No products array");

      // Insert new detail records
      if (productArrayData && productArrayData.length > 0) {
        // Add a unique constraint check and potentially modify the data
        const productsToInsert = productArrayData.map((item, index) => ({
          ...item,
          // Explicitly set the refno to ensure consistency
          refno: headerData.refno,
          // Optional: Add a unique index to prevent conflicts
          uniqueIndex: `${headerData.refno}_${index}`
        }));

        // Use upsert instead of bulkCreate to handle potential conflicts
        const insertPromises = productsToInsert.map(product =>
          Kt_dpbdtModel.upsert(product, {
            transaction: t,
            // If you want to update existing records
            conflictFields: ['refno', 'product_code']
          })
        );

        await Promise.all(insertPromises);
      }
    } else {
      // Legacy structure with direct properties - this should still work for backward compatibility
      // First update the header record
      const updateResult = await Kt_dpbModel.update(
        {
          rdate: updateData.rdate,
          trdate: updateData.trdate,
          myear: updateData.myear,
          monthh: updateData.monthh,
          kitchen_code: updateData.kitchen_code,
          branch_code: updateData.branch_code,
          taxable: updateData.taxable || 0,
          nontaxable: updateData.nontaxable || 0,
          total: updateData.total || 0,
          user_code: updateData.user_code,
        },
        {
          where: { refno: updateData.refno },
          transaction: t
        }
      );

      // Delete existing detail records so we can insert fresh ones
      await Kt_dpbdtModel.destroy({
        where: { refno: updateData.refno },
        transaction: t
      });

      console.log("Deleted existing details, now inserting new products:",
        updateData.productArrayData ? updateData.productArrayData.length : "No products array");

      // Insert new detail records
      if (updateData.productArrayData && updateData.productArrayData.length > 0) {
        // Add a unique constraint check and potentially modify the data
        const productsToInsert = updateData.productArrayData.map((item, index) => ({
          ...item,
          // Explicitly set the refno to ensure consistency
          refno: updateData.refno,
          // Optional: Add a unique index to prevent conflicts
          uniqueIndex: `${updateData.refno}_${index}`
        }));

        // Use upsert instead of bulkCreate to handle potential conflicts
        const insertPromises = productsToInsert.map(product =>
          Kt_dpbdtModel.upsert(product, {
            transaction: t,
            // If you want to update existing records
            conflictFields: ['refno', 'product_code']
          })
        );

        await Promise.all(insertPromises);
      }
    }

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Updated successfully'
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


exports.deleteKt_dpb = async (req, res) => {
  try {
    Kt_dpbModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Kt_dpbAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name, branch_name } = req.body;
    const { Op } = require("sequelize");

    const wherekitchen = { kitchen_name: { [Op.like]: '%', } };
    if (kitchen_name)
      wherekitchen = { $like: '%' + kitchen_name + '%' };

    const wherebranch = { branch_name: { [Op.like]: '%', } };
    if (branch_name)
      wherebranch = { $like: '%' + branch_name + '%' };

    const Kt_dpbShow = await Kt_dpbModel.findAll({
      include: [
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          // where: { supplier_name: {[Op.like]: '%'+(supplier_name)+'%',}},
          where: wherebranch,
          required: true,
        },
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          // where: { branch_name: {[Op.like]: '%'+(branch_name)+'%',}},
          where: wherekitchen,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });
    res.status(200).send({ result: true, data: Kt_dpbShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Kt_dpbAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, branch_code, product_code, kitchen_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (kitchen_code && kitchen_code !== '') {
      whereClause.kitchen_code = kitchen_code;
    }

    if (branch_code && branch_code !== '') {
      whereClause.branch_code = branch_code;
    }

    let kt_dpb_headers = await Kt_dpbModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'branch_code', 'kitchen_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          required: false
        },
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
      ],
      where: whereClause,
      order: [['refno', 'ASC']],
      offset,
      limit
    });

    if (kt_dpb_headers.length > 0) {
      const refnos = kt_dpb_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause['$tbl_product.product_name$'] = {
          [Op.like]: `%${product_code}%`
        };
      }

      const details = await Kt_dpbdtModel.findAll({
        where: whereDetailClause,
        include: [
          {
            model: Tbl_product,
            attributes: ['product_code', 'product_name'],
            required: true
          },
          {
            model: unitModel,
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

      kt_dpb_headers = kt_dpb_headers.map(header => {
        const headerData = header.toJSON();
        headerData.kt_dpbdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: kt_dpb_headers
    });
  } catch (error) {
    console.error("Error in Kt_dpbAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_dpbByRefno = async (req, res) => {
  try {
    // ปรับวิธีการเข้าถึง refno
    let refnoValue = req.body.refno;

    // ตรวจสอบว่า refno เป็น object หรือไม่
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
      console.log('Extracted refno from object:', refnoValue);
    }

    console.log('Processing refno:', refnoValue, 'Type:', typeof refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'Refno is required (not found or empty)'
      });
    }

    const Kt_dpbShow = await Kt_dpbModel.findOne({
      include: [
        {
          model: Kt_dpbdtModel,
          include: [{
            model: Tbl_product,
            include: [
              {
                model: unitModel,
                as: 'productUnit1',
                required: false
              },
              {
                model: unitModel,
                as: 'productUnit2',
                required: false
              }
            ]
          }]
        },
        {
          model: Tbl_kitchen,
          required: false
        },
        {
          model: Tbl_branch,
          required: false
        }
      ],
      where: { refno: refnoValue }
    });

    if (!Kt_dpbShow) {
      console.log('No data found for refno:', refnoValue);
      return res.status(404).json({
        result: false,
        message: 'Dispatch not found'
      });
    }

    res.status(200).json({ result: true, data: Kt_dpbShow });
  } catch (error) {
    console.error('Error in Kt_dpbByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'Failed to fetch dispatch details',
      stack: error.stack
    });
  }
};

exports.countKt_dpb = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Kt_dpbModel.count({
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

exports.searchKt_dpbrefno = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { refno } = await req.body;
    // console.log((typeproduct_name));

    const Kt_dpbShow = await Kt_dpbModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Kt_dpbShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};


exports.Kt_dpbrefno = async (req, res) => {
  try {
    const { kitchen_code, date } = req.body;

    if (!kitchen_code) {
      throw new Error('Kitchen code is required');
    }

    // Parse the date and format it as YYMM
    const formattedDate = date ? new Date(date) : new Date();
    const year = formattedDate.getFullYear().toString().slice(-2);
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}${month}`;

    // Create the pattern for searching
    const pattern = `KTDPB${kitchen_code}${dateStr}%`;

    // Find the latest reference number for this kitchen and month
    const refno = await Kt_dpbModel.findOne({
      where: {
        refno: {
          [Op.like]: pattern
        }
      },
      order: [['refno', 'DESC']],
    });

    // If no existing refno found, start with 001
    if (!refno) {
      const newRefno = `KTDPB${kitchen_code}${dateStr}001`;
      res.status(200).send({
        result: true,
        data: { refno: newRefno }
      });
      return;
    }

    // Extract and increment the running number
    const currentRunNo = parseInt(refno.refno.slice(-3));
    const nextRunNo = (currentRunNo + 1).toString().padStart(3, '0');
    const newRefno = `KTDPB${kitchen_code}${dateStr}${nextRunNo}`;

    res.status(200).send({
      result: true,
      data: { refno: newRefno }
    });

  } catch (error) {
    console.error('Generate refno error:', error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.searchKt_dpbRunno = async (req, res) => {
  try {
    const Kt_dpbShow = await Kt_dpbModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Kt_dpbShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.getKtDpbByRefno = async (req, res) => {
  try {
    // Extract refno properly
    let refnoValue = req.body.refno;

    // Handle if refno is an object (like in the error message)
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
      console.log('Extracted refno from object:', refnoValue);
    }

    if (!refnoValue) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Now use the extracted string value in your query
    const orderData = await Kt_dpbModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
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
      where: { refno: refnoValue } // Use the extracted value
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
    console.error("Error in getKtDpbByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};
