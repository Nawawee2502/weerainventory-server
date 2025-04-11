const {
  User,
  Tbl_kitchen,
  sequelize,
  Tbl_product,
  Tbl_unit: unitModel,
  Wh_dpk: wh_dpkModel,
  Wh_dpkdt: wh_dpkdtModel,
  Wh_stockcard,
  Wh_product_lotno,
  Kt_powdt,
  Kt_pow // Added Kt_pow model for updating status
} = require("../models/mainModel");

exports.addWh_dpk = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    console.log('Received Data:', {
      headerData,
      productArrayData,
      footerData
    });

    if (!headerData.refno || !headerData.kitchen_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      // 1. Create WH_DPK record with po_refno field
      await wh_dpkModel.create({
        refno: headerData.refno,
        refno1: headerData.po_refno,    // Store the original PO refno in refno1
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

      // 2. Create detail records
      await wh_dpkdtModel.bulkCreate(productArrayData, { transaction: t });

      const poRefno = headerData.po_refno; // Use the original PO refno for Kt_powdt updates

      // Flag to check if all items have been fully dispatched
      let allItemsFullyDispatched = true;

      // 3. Create stockcard records and update lotno
      for (const item of productArrayData) {
        const stockcardRecords = await Wh_stockcard.findAll({
          where: { product_code: item.product_code },
          order: [['rdate', 'DESC'], ['refno', 'DESC']],
          raw: true,
          transaction: t
        });

        const totals = stockcardRecords.reduce((acc, record) => {
          return {
            beg1: acc.beg1 + Number(record.beg1 || 0),
            in1: acc.in1 + Number(record.in1 || 0),
            out1: acc.out1 + Number(record.out1 || 0),
            upd1: acc.upd1 + Number(record.upd1 || 0),
            beg1_amt: acc.beg1_amt + Number(record.beg1_amt || 0),
            in1_amt: acc.in1_amt + Number(record.in1_amt || 0),
            out1_amt: acc.out1_amt + Number(record.out1_amt || 0),
            upd1_amt: acc.upd1_amt + Number(record.upd1_amt || 0)
          };
        }, {
          beg1: 0, in1: 0, out1: 0, upd1: 0,
          beg1_amt: 0, in1_amt: 0, out1_amt: 0, upd1_amt: 0
        });

        const outAmount = Number(item.qty || 0);
        const outPrice = Number(item.uprice || 0);
        const outAmountValue = outAmount * outPrice;

        const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
        const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

        await Wh_stockcard.create({
          myear: headerData.myear,
          monthh: headerData.monthh,
          product_code: item.product_code,
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

        // Find last lotno from wh_product_lotno
        const lastLotno = await Wh_product_lotno.findOne({
          where: { product_code: item.product_code },
          order: [['lotno', 'DESC']],
          attributes: ['lotno'],
          transaction: t
        });

        const newLotno = (lastLotno?.lotno || 0) + 1;

        // Update lotno in product table
        await Tbl_product.update(
          { lotno: newLotno },
          {
            where: { product_code: item.product_code },
            transaction: t
          }
        );

        // Create new product lotno record
        await Wh_product_lotno.create({
          product_code: item.product_code,
          lotno: newLotno,
          unit_code: item.unit_code,
          qty: previousBalance,
          uprice: outPrice,
          refno: headerData.refno,
          qty_use: outAmount,
          rdate: headerData.rdate,
          ...(item.temperature1 && { temperature1: item.temperature1 })
        }, { transaction: t });

        // Update the qty_send in kt_powdt if po_refno is provided
        if (poRefno) {
          try {
            // First, get the current qty_send value
            const powdtRecord = await Kt_powdt.findOne({
              where: {
                refno: poRefno,
                product_code: item.product_code
              },
              transaction: t
            });

            if (powdtRecord) {
              // Calculate the new qty_send by adding current dispatch quantity
              const currentQtySent = parseFloat(powdtRecord.qty_send || 0);
              const newQtySent = currentQtySent + parseFloat(item.qty || 0);
              const originalQty = parseFloat(powdtRecord.qty || 0);

              console.log(`Updating qty_send for product ${item.product_code} from ${currentQtySent} to ${newQtySent}`);

              // Update the qty_send value
              const updateResult = await Kt_powdt.update(
                { qty_send: newQtySent },
                {
                  where: {
                    refno: poRefno,
                    product_code: item.product_code
                  },
                  transaction: t
                }
              );

              console.log(`Update result for product ${item.product_code}: ${JSON.stringify(updateResult)}`);

              // Check if this item is not fully dispatched
              if (newQtySent < originalQty) {
                allItemsFullyDispatched = false;
                console.log(`Product ${item.product_code} not fully dispatched (${newQtySent}/${originalQty})`);
              }
            } else {
              console.log(`No kt_powdt record found for refno: ${poRefno}, product: ${item.product_code}`);
              // If we can't find a record, we can't determine if all items are dispatched,
              // so conservatively set to false
              allItemsFullyDispatched = false;
            }
          } catch (error) {
            console.error(`Error updating qty_send for product ${item.product_code}:`, error);
            throw error;
          }
        }
      }

      // If all items are fully dispatched and we have a valid PO refno,
      // update the PO status to 'end'
      if (poRefno && allItemsFullyDispatched) {
        console.log(`All products for PO ${poRefno} have been fully dispatched, updating status to 'end'`);
        await Kt_pow.update(
          { status: 'end' },
          {
            where: { refno: poRefno },
            transaction: t
          }
        );
        console.log(`Updated PO ${poRefno} status to 'end'`);
      } else if (poRefno) {
        console.log(`Not all products for PO ${poRefno} have been fully dispatched, status remains unchanged`);
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

exports.Wh_dpkAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (kitchen_code && kitchen_code !== '') {
      whereClause.kitchen_code = kitchen_code;
    }

    let wh_dpk_headers = await wh_dpkModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at', 'refno1'
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
      offset,
      limit
    });

    if (wh_dpk_headers.length > 0) {
      const refnos = wh_dpk_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause['$tbl_product.product_name$'] = {
          [Op.like]: `%${product_code}%`
        };
      }

      const details = await wh_dpkdtModel.findAll({
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

      wh_dpk_headers = wh_dpk_headers.map(header => {
        const headerData = header.toJSON();
        headerData.wh_dpkdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: wh_dpk_headers
    });
  } catch (error) {
    console.error("Error in Wh_dpkAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.countWh_dpk = async (req, res) => {
  try {
    const { rdate } = req.body;
    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await wh_dpkModel.count({
      where: whereClause
    });

    res.status(200).send({
      result: true,
      data: amount
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.updateWh_dpk = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await wh_dpkModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        kitchen_code: updateData.kitchen_code,
        taxable: updateData.taxable || 0,
        nontaxable: updateData.nontaxable || 0,
        total: updateData.total || 0,
        user_code: updateData.user_code,
        refno1: updateData.refno1, // Update the PO reference
      },
      {
        where: { refno: updateData.refno },
        transaction: t
      }
    );

    // Delete existing detail records so we can insert fresh ones
    await wh_dpkdtModel.destroy({
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
        wh_dpkdtModel.upsert(product, {
          transaction: t,
          // If you want to update existing records
          conflictFields: ['refno', 'product_code']
        })
      );

      await Promise.all(insertPromises);
    }

    // Update stockcard if needed
    await Wh_stockcard.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh
      },
      {
        where: { refno: updateData.refno },
        transaction: t
      }
    );

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

exports.deleteWh_dpk = async (req, res) => {
  try {
    wh_dpkModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_dpkAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;
    const { Op } = require("sequelize");

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const Wh_dpkShow = await wh_dpkModel.findAll({
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
    res.status(200).send({ result: true, data: Wh_dpkShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_dpkByRefno = async (req, res) => {
  try {
    // Extract refno from request
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    console.log('Fetching kitchen dispatch with refno:', refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Get header data
    const wh_dpkHeader = await wh_dpkModel.findOne({
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
      where: { refno: refnoValue }
    });

    if (!wh_dpkHeader) {
      console.log('Kitchen dispatch not found:', refnoValue);
      return res.status(404).json({
        result: false,
        message: 'Kitchen dispatch not found'
      });
    }

    // Get detail data
    const wh_dpkDetails = await wh_dpkdtModel.findAll({
      include: [
        {
          model: Tbl_product,
          include: [
            {
              model: unitModel,
              as: 'productUnit1',
              required: false,
            },
            {
              model: unitModel,
              as: 'productUnit2',
              required: false,
            }
          ],
          required: false
        },
        {
          model: unitModel,
          required: false,
        }
      ],
      where: { refno: refnoValue }
    });

    console.log(`Found ${wh_dpkDetails.length} product items in kitchen dispatch ${refnoValue}`);

    // Example data for debugging
    if (wh_dpkDetails.length > 0) {
      console.log('Sample product data:', {
        product_code: wh_dpkDetails[0].product_code,
        product_name: wh_dpkDetails[0].tbl_product?.product_name || 'N/A',
        qty: wh_dpkDetails[0].qty,
        unit: wh_dpkDetails[0].tbl_unit?.unit_name || wh_dpkDetails[0].unit_code || 'N/A'
      });
    }

    // Convert to plain objects
    const result = wh_dpkHeader.toJSON();

    // Process detail data and fill missing information
    const processedDetails = wh_dpkDetails.map(detail => {
      const detailObj = detail.toJSON();

      // Fill in missing data
      if (!detailObj.tbl_product) {
        detailObj.tbl_product = { product_name: 'Product Description' };
      }

      if (!detailObj.tbl_unit) {
        detailObj.tbl_unit = { unit_name: detailObj.unit_code || '' };
      }

      return detailObj;
    });

    // Add details to result
    result.wh_dpkdts = processedDetails;

    // Send response
    res.status(200).json({
      result: true,
      data: result
    });

  } catch (error) {
    console.error('Error in Wh_dpkByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'Could not fetch kitchen dispatch data',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.searchWh_dpkrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const Wh_dpkShow = await wh_dpkModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Wh_dpkShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_dpkrefno = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).send({
        result: false,
        message: "Month and year parameters are required"
      });
    }

    const refno = await wh_dpkModel.findOne({
      where: {
        monthh: month,
        myear: `20${year}`
      },
      order: [['refno', 'DESC']],
    });

    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchWh_dpkRunno = async (req, res) => {
  try {
    const Wh_dpkShow = await wh_dpkModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_dpkShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.getWhDpkByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await wh_dpkModel.findOne({
      attributes: [
        'refno', 'refno1', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
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
    console.error("Error in getDpkByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

// Add a method to find used kitchen PO reference numbers similar to Wh_dpbUsedRefnos
exports.Wh_dpkUsedRefnos = async (req, res) => {
  try {
    // Get all POs that have status 'end'
    const completedPOs = await Kt_pow.findAll({
      attributes: ['refno'],
      where: { status: 'end' },
      raw: true
    });

    const completedRefnos = completedPOs.map(po => po.refno);
    console.log(`Found ${completedRefnos.length} completed kitchen POs with status 'end'`);

    return res.status(200).json({
      result: true,
      data: completedRefnos
    });
  } catch (error) {
    console.error("Error fetching completed kitchen refnos:", error);
    return res.status(500).json({
      result: false,
      message: error.message || "Server error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};