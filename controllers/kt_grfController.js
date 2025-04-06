const {
  Kt_grf: Kt_grfModel,
  Kt_grfdt: Kt_grfdtModel,
  Tbl_unit: unitModel,
  sequelize,
  Tbl_product,
  Tbl_kitchen,
  Kt_stockcard,
  User
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addKt_grf = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.kitchen_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      await Kt_grfModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        total: footerData.total,
      }, { transaction: t });

      await Kt_grfdtModel.bulkCreate(productArrayData, { transaction: t });

      for (const item of productArrayData) {
        const stockcardRecords = await Kt_stockcard.findAll({
          where: {
            product_code: item.product_code,
            kitchen_code: headerData.kitchen_code
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

exports.updateKt_grf = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // Check if we have the required headerData structure
    if (updateData.headerData) {
      // We're receiving the new structure with headerData
      const { headerData, productArrayData, footerData } = updateData;

      // Make sure we have a valid refno
      if (!headerData.refno) {
        throw new Error('Missing required refno in header data');
      }

      // Update the header record
      const updateResult = await Kt_grfModel.update(
        {
          rdate: headerData.rdate,
          trdate: headerData.trdate,
          myear: headerData.myear,
          monthh: headerData.monthh,
          kitchen_code: headerData.kitchen_code,
          total: footerData ? footerData.total : 0,
          user_code: headerData.user_code,
        },
        {
          where: { refno: headerData.refno },
          transaction: t
        }
      );

      // Delete existing detail records so we can insert fresh ones
      await Kt_grfdtModel.destroy({
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
          Kt_grfdtModel.upsert(product, {
            transaction: t,
            // If you want to update existing records
            conflictFields: ['refno', 'product_code']
          })
        );

        await Promise.all(insertPromises);
      }
    } else {
      // Legacy structure (direct fields)
      // First update the header record
      const updateResult = await Kt_grfModel.update(
        {
          rdate: updateData.rdate,
          trdate: updateData.trdate,
          myear: updateData.myear,
          monthh: updateData.monthh,
          kitchen_code: updateData.kitchen_code,
          total: updateData.total || 0,
          user_code: updateData.user_code,
        },
        {
          where: { refno: updateData.refno },
          transaction: t
        }
      );

      // Delete existing detail records so we can insert fresh ones
      await Kt_grfdtModel.destroy({
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
          Kt_grfdtModel.upsert(product, {
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
      message: 'Updated successfully',
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

exports.deleteKt_grf = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await Kt_grfdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Kt_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await Kt_grfModel.destroy({
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

exports.Kt_grfAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const Kt_grfShow = await Kt_grfModel.findAll({
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          where: wherekitchen,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });

    res.status(200).send({ result: true, data: Kt_grfShow });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_grfAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_code, product_code } = req.body;
    const { refno } = req.body; // Added to handle single refno lookup

    let whereClause = {};

    // If refno is provided, use that as the primary filter
    if (refno) {
      whereClause.refno = refno;
    } else {
      // Otherwise use the date range filters
      if (rdate1 && rdate2) {
        whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
      }

      if (kitchen_code && kitchen_code !== '') {
        whereClause.kitchen_code = kitchen_code;
      }
    }

    // Only run the count query if we're doing a date range search (not a specific refno)
    let totalCount = 0;
    if (!refno && rdate1 && rdate2) {
      // Create a proper query with replacements array
      const totalResult = await sequelize.query(
        'SELECT COUNT(refno) as count FROM kt_grf WHERE trdate BETWEEN ? AND ?',
        {
          replacements: [rdate1, rdate2],
          type: sequelize.QueryTypes.SELECT
        }
      );

      totalCount = totalResult[0].count;
    }

    // Fetch the header data
    const kt_grf_headers = await Kt_grfModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'total', 'user_code', 'created_at'
      ],
      include: [
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
      offset: parseInt(offset) || 0,
      limit: refno ? null : (parseInt(limit) || 10) // Don't limit if looking up by refno
    });

    res.status(200).send({
      result: true,
      data: kt_grf_headers,
      total: refno ? kt_grf_headers.length : totalCount
    });

  } catch (error) {
    console.error("Error in Kt_grfAlljoindt:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Kt_grfByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Kt_grfShow = await Kt_grfModel.findOne({
      include: [
        {
          model: Kt_grfdtModel,
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
      where: { refno: refno }
    });
    res.status(200).send({ result: true, data: Kt_grfShow });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.countKt_grf = async (req, res) => {
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

    const amount = await Kt_grfModel.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchKt_grfrefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Kt_grfShow = await Kt_grfModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Kt_grfShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.Kt_grfrefno = async (req, res) => {
  try {
    const { kitchen_code, date } = req.body;

    if (!kitchen_code) {
      throw new Error('Kitchen code is required');
    }

    // Parse the date and format it as YYMM
    const formattedDate = new Date(date);
    const year = formattedDate.getFullYear().toString().slice(-2);
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');

    // ใช้ prefix 3 ตัวแรกของ kitchen_code
    const kitchenPrefix = kitchen_code.substring(0, 3).toUpperCase();

    // Create the pattern for searching
    const pattern = `KTGRF${kitchenPrefix}${year}${month}%`;

    // Check if this refno already exists to prevent duplication
    const checkExisting = await Kt_grfModel.findOne({
      where: {
        kitchen_code: kitchen_code,
        trdate: {
          [Op.like]: `${formattedDate.getFullYear()}${month}%`
        },
        refno: {
          [Op.like]: pattern
        }
      },
      order: [['refno', 'DESC']],
    });

    // Generate a new number if found
    if (checkExisting) {
      const currentNumber = parseInt(checkExisting.refno.slice(-3));
      const nextNumber = (currentNumber + 1).toString().padStart(3, '0');
      const newRefno = `KTGRF${kitchenPrefix}${year}${month}${nextNumber}`;

      res.status(200).send({
        result: true,
        data: { refno: newRefno }
      });
      return;
    }

    // If no refno found, start with 001
    const newRefno = `KTGRF${kitchenPrefix}${year}${month}001`;
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

exports.searchKt_grfRunno = async (req, res) => {
  try {
    const Kt_grfShow = await Kt_grfModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Kt_grfShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.getKtGrfByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await Kt_grfModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'total', 'user_code', 'created_at'
      ],
      include: [
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
    console.error("Error in getGrfByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};