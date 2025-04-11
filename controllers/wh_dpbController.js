// Import all required models at the top of the file
const {
  User,
  Tbl_branch,
  sequelize,
  Tbl_product,
  Tbl_unit: unitModel,
  Wh_dpb: wh_dpbModel,
  Wh_dpbdt: wh_dpbdtModel,
  Wh_stockcard,
  Wh_product_lotno,
  Br_powdt,
  Br_pow // Add Br_pow model for updating status
} = require("../models/mainModel");

exports.addWh_dpb = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.branch_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      // Create the wh_dpb header record with the new refno1 field
      await wh_dpbModel.create({
        refno: headerData.refno,        // This is the newly generated refno
        refno1: headerData.po_refno,    // Store the original PO refno in refno1
        rdate: headerData.rdate,
        branch_code: headerData.branch_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: headerData.taxable,
        nontaxable: headerData.nontaxable,
        total: footerData.total,
      }, { transaction: t });

      // Create the wh_dpbdt detail records
      await wh_dpbdtModel.bulkCreate(productArrayData, { transaction: t });

      const poRefno = headerData.po_refno;  // Use the original PO refno for BR_powdt updates

      // Flag to check if all items have been fully dispatched (qty = qty_send for all items)
      let allItemsFullyDispatched = true;

      // For each product, update the stock card and lot info
      for (const item of productArrayData) {
        // Handle stock card updates
        const stockcardRecords = await Wh_stockcard.findAll({
          where: { product_code: item.product_code },
          order: [['rdate', 'DESC'], ['refno', 'DESC']],
          raw: true,
          transaction: t
        });

        // ... [existing stock card and lotno code remains the same] ...

        // Update the qty_send in br_powdt if po_refno is provided
        if (poRefno) {
          try {
            // First, get the current qty_send value
            const powdtRecord = await Br_powdt.findOne({
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
              const updateResult = await Br_powdt.update(
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
              console.log(`No br_powdt record found for refno: ${poRefno}, product: ${item.product_code}`);
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
        await Br_pow.update(
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

exports.updateWh_dpb = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;
    console.log("Received update data:", { headerData, productArrayData, footerData });

    // Validate that refno exists before proceeding
    if (!headerData || !headerData.refno) {
      await t.rollback();
      return res.status(400).send({
        result: false,
        message: 'Reference number (refno) is required for update'
      });
    }

    // First update the header record
    const updateResult = await wh_dpbModel.update(
      {
        rdate: headerData.rdate,
        trdate: headerData.trdate,
        myear: headerData.myear,
        monthh: headerData.monthh,
        branch_code: headerData.branch_code,
        taxable: headerData.taxable || 0,
        nontaxable: headerData.nontaxable || 0,
        total: headerData.total || 0,
        user_code: headerData.user_code,
        refno1: headerData.refno1,
      },
      {
        where: { refno: headerData.refno },
        transaction: t
      }
    );

    // Delete existing detail records so we can insert fresh ones
    await wh_dpbdtModel.destroy({
      where: { refno: headerData.refno },
      transaction: t
    });

    console.log("Deleted existing details, now inserting new products:",
      productArrayData ? productArrayData.length : "No products array");

    // Insert new detail records
    if (productArrayData && productArrayData.length > 0) {
      // Make sure all products have the correct refno
      const productsToInsert = productArrayData.map(item => ({
        ...item,
        refno: headerData.refno  // Ensure the refno is set correctly
      }));

      // Use bulkCreate for better performance
      await wh_dpbdtModel.bulkCreate(productsToInsert, {
        transaction: t
      });
    }

    // Update stockcard if needed
    await Wh_stockcard.update(
      {
        rdate: headerData.rdate,
        trdate: headerData.trdate,
        myear: headerData.myear,
        monthh: headerData.monthh
      },
      {
        where: { refno: headerData.refno },
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

exports.deleteWh_dpb = async (req, res) => {
  try {
    wh_dpbModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_dpbAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, branch_name } = req.body;
    const { Op } = require("sequelize");

    const wherebranch = { branch_name: { [Op.like]: '%', } };
    if (branch_name)
      wherebranch = { $like: '%' + branch_name + '%' };

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
    const { offset, limit, rdate1, rdate2, branch_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (branch_code && branch_code !== '') {
      whereClause.branch_code = branch_code;
    }

    let wh_dpb_headers = await wh_dpbModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at', 'refno1'
      ],
      include: [
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
      offset,
      limit
    });

    if (wh_dpb_headers.length > 0) {
      const refnos = wh_dpb_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause['$tbl_product.product_name$'] = {
          [Op.like]: `%${product_code}%`
        };
      }

      const details = await wh_dpbdtModel.findAll({
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
    console.error("Error in Wh_dpbAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Wh_dpbByRefno = async (req, res) => {
  try {
    // ดึงค่า refno จาก request
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    console.log('กำลังดึงข้อมูลใบเบิกสินค้าเลขที่:', refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'ต้องระบุเลขที่อ้างอิง (refno)'
      });
    }

    // ดึงข้อมูลหลักของใบเบิกสินค้า (header)
    const wh_dpbHeader = await wh_dpbModel.findOne({
      include: [
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

    if (!wh_dpbHeader) {
      console.log('ไม่พบข้อมูลใบเบิกสินค้าเลขที่:', refnoValue);
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลใบเบิกสินค้า'
      });
    }

    // ดึงข้อมูลรายการสินค้า (details) แยกต่างหาก
    const wh_dpbDetails = await wh_dpbdtModel.findAll({
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

    console.log(`พบรายการสินค้าทั้งหมด ${wh_dpbDetails.length} รายการในใบเบิกสินค้าเลขที่ ${refnoValue}`);

    // แสดงข้อมูลตัวอย่างสำหรับการตรวจสอบ
    if (wh_dpbDetails.length > 0) {
      console.log('ตัวอย่างข้อมูลสินค้าชิ้นแรก:', {
        product_code: wh_dpbDetails[0].product_code,
        product_name: wh_dpbDetails[0].tbl_product?.product_name || 'ไม่มี',
        qty: wh_dpbDetails[0].qty,
        unit: wh_dpbDetails[0].tbl_unit?.unit_name || wh_dpbDetails[0].unit_code || 'ไม่มี'
      });
    }

    // แปลงข้อมูลเป็น plain objects เพื่อป้องกันปัญหา
    const result = wh_dpbHeader.toJSON();

    // ปรับแต่งข้อมูลรายการสินค้าและเติมข้อมูลที่หายไป
    const processedDetails = wh_dpbDetails.map(detail => {
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
    result.wh_dpbdts = processedDetails;

    // ส่งข้อมูลกลับ
    res.status(200).json({
      result: true,
      data: result
    });

  } catch (error) {
    console.error('Error in Wh_dpbByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลใบเบิกสินค้าได้',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

    const wh_dpbShow = await wh_dpbModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });

    res.status(200).send({ result: true, data: wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

// Fix for controller exports.Wh_dpbrefno
exports.Wh_dpbrefno = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).send({
        result: false,
        message: "Month and year parameters are required"
      });
    }

    const refno = await wh_dpbModel.findOne({
      where: {
        monthh: month,
        myear: `20${year}`
      },
      order: [['refno', 'DESC']],
    });

    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.searchWh_dpbRunno = async (req, res) => {
  try {
    const wh_dpbShow = await wh_dpbModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.getWhDpbByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await wh_dpbModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
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
    console.error("Error in getDpbByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Wh_dpbUsedRefnos = async (req, res) => {
  try {
    // Get all POs that have status 'end'
    const completedPOs = await Br_pow.findAll({
      attributes: ['refno'],
      where: { status: 'end' },
      raw: true
    });

    const completedRefnos = completedPOs.map(po => po.refno);
    console.log(`Found ${completedRefnos.length} completed POs with status 'end'`);

    return res.status(200).json({
      result: true,
      data: completedRefnos
    });
  } catch (error) {
    console.error("Error fetching completed refnos:", error);
    return res.status(500).json({
      result: false,
      message: error.message || "Server error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};