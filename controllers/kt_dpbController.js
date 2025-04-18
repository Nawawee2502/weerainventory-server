const {
  Kt_dpb: Kt_dpbModel,
  Kt_dpbdt: Kt_dpbdtModel,
  Tbl_unit: unitModel,
  sequelize,
  Tbl_product,
  Tbl_kitchen,
  Tbl_branch,
  User,
  Kt_stockcard,
  Br_rtk,
  Br_rtkdt
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
        refno1: headerData.refno1 || null,
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

      if (headerData.refno1) {
        const rtkRefno = headerData.refno1;
        for (const item of productArrayData) {
          const rtkdtItem = await Br_rtkdt.findOne({
            where: {
              refno: rtkRefno,
              product_code: item.product_code
            },
            transaction: t
          });

          if (rtkdtItem) {
            const currentQtySend = parseFloat(rtkdtItem.qty_send || 0);
            const newQtySend = currentQtySend + parseFloat(item.qty || 0);
            const totalQty = parseFloat(rtkdtItem.qty || 0);

            await Br_rtkdt.update(
              { qty_send: newQtySend },
              {
                where: {
                  refno: rtkRefno,
                  product_code: item.product_code
                },
                transaction: t
              }
            );

            console.log(`Updated product ${item.product_code} qty_send from ${currentQtySend} to ${newQtySend} (total: ${totalQty})`);
          }
        }

        const remainingItems = await Br_rtkdt.findAll({
          attributes: ['product_code', 'qty', 'qty_send'],
          where: { refno: rtkRefno },
          transaction: t
        });

        const allItemsDispatched = remainingItems.every(item => {
          const qty = parseFloat(item.qty || 0);
          const qtySend = parseFloat(item.qty_send || 0);
          return qtySend >= qty;
        });

        if (allItemsDispatched) {
          await Br_rtk.update(
            { status: 'end' },
            {
              where: { refno: rtkRefno },
              transaction: t
            }
          );
          console.log(`Updated RTK ${rtkRefno} status to 'end'`);
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

exports.updateKt_dpb = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    if (updateData.headerData) {
      const { headerData, productArrayData, footerData } = updateData;
      if (!headerData.refno) {
        throw new Error('Missing required refno in header data');
      }

      const updateResult = await Kt_dpbModel.update(
        {
          rdate: headerData.rdate,
          trdate: headerData.trdate,
          myear: headerData.myear,
          monthh: headerData.monthh,
          kitchen_code: headerData.kitchen_code,
          branch_code: headerData.branch_code,
          refno1: headerData.refno1 || null,
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

      await Kt_dpbdtModel.destroy({
        where: { refno: headerData.refno },
        transaction: t
      });

      console.log("Deleted existing details, now inserting new products:",
        productArrayData ? productArrayData.length : "No products array");

      if (productArrayData && productArrayData.length > 0) {
        const productsToInsert = productArrayData.map((item, index) => ({
          ...item,
          refno: headerData.refno,
          uniqueIndex: `${headerData.refno}_${index}`
        }));

        const insertPromises = productsToInsert.map(product =>
          Kt_dpbdtModel.upsert(product, {
            transaction: t,
            conflictFields: ['refno', 'product_code']
          })
        );

        await Promise.all(insertPromises);
      }

      if (headerData.refno1) {
        const rtkRefno = headerData.refno1;
        const remainingItems = await Br_rtkdt.findAll({
          attributes: ['product_code', 'qty', 'qty_send'],
          where: { refno: rtkRefno },
          transaction: t
        });

        const allItemsDispatched = remainingItems.every(item => {
          const qty = parseFloat(item.qty || 0);
          const qtySend = parseFloat(item.qty_send || 0);
          return qtySend >= qty;
        });

        if (allItemsDispatched) {
          await Br_rtk.update(
            { status: 'end' },
            {
              where: { refno: rtkRefno },
              transaction: t
            }
          );
          console.log(`Updated RTK ${rtkRefno} status to 'end'`);
        }
      }
    } else {
      const updateResult = await Kt_dpbModel.update(
        {
          rdate: updateData.rdate,
          trdate: updateData.trdate,
          myear: updateData.myear,
          monthh: updateData.monthh,
          kitchen_code: updateData.kitchen_code,
          branch_code: updateData.branch_code,
          refno1: updateData.refno1 || null,
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

      await Kt_dpbdtModel.destroy({
        where: { refno: updateData.refno },
        transaction: t
      });

      console.log("Deleted existing details, now inserting new products:",
        updateData.productArrayData ? updateData.productArrayData.length : "No products array");

      if (updateData.productArrayData && updateData.productArrayData.length > 0) {
        const productsToInsert = updateData.productArrayData.map((item, index) => ({
          ...item,
          refno: updateData.refno,
          uniqueIndex: `${updateData.refno}_${index}`
        }));

        const insertPromises = productsToInsert.map(product =>
          Kt_dpbdtModel.upsert(product, {
            transaction: t,
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
          where: wherebranch,
          required: true,
        },
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
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
        'total', 'user_code', 'created_at', 'refno1'
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
    // ตรวจสอบและแปลงค่า refno ให้เป็น string
    let refnoValue = req.body.refno;

    // เช็คว่า refno เป็น object หรือไม่ (กรณีที่ frontend ส่งค่าในรูปแบบ { refno: "BRRTK012504001" })
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      if (refnoValue.refno && typeof refnoValue.refno === 'string') {
        refnoValue = refnoValue.refno.trim();
      } else {
        return res.status(400).json({
          result: false,
          message: 'Invalid refno format'
        });
      }
    }

    // เช็คว่าเป็น string และไม่ใช่ค่าว่าง
    if (typeof refnoValue !== 'string' || !refnoValue.trim()) {
      return res.status(400).json({
        result: false,
        message: 'Refno is required and must be a string'
      });
    }

    console.log('Processing refno:', refnoValue, 'Type:', typeof refnoValue);

    // แยกการดึงข้อมูล header และ details เพื่อให้ง่ายต่อการดีบัก
    // 1. ดึงข้อมูล header ก่อน
    const header = await Kt_dpbModel.findOne({
      include: [
        {
          model: Tbl_kitchen,
          required: false
        },
        {
          model: Tbl_branch,
          required: false
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_code', 'username'],
          required: false
        }
      ],
      where: { refno: refnoValue.toString() }
    });

    if (!header) {
      console.log('No header data found for refno:', refnoValue);
      return res.status(404).json({
        result: false,
        message: 'Dispatch not found'
      });
    }

    // 2. ดึงข้อมูล details
    const details = await Kt_dpbdtModel.findAll({
      include: [
        {
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
          ],
          required: false
        },
        {
          model: unitModel,
          required: false
        }
      ],
      where: { refno: refnoValue.toString() },
      order: [['product_code', 'ASC']]
    });

    console.log(`Found ${details.length} detail records for refno: ${refnoValue}`);

    // 3. รวมข้อมูลทั้งหมดเข้าด้วยกัน
    const result = header.toJSON();

    // ตรวจสอบและจัดการข้อมูล details
    const processedDetails = details.map(detail => {
      const detailObj = detail.toJSON();

      // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วน
      if (!detailObj.tbl_product) {
        detailObj.tbl_product = { product_name: 'Product Description' };
      }

      if (!detailObj.tbl_unit) {
        detailObj.tbl_unit = { unit_name: detailObj.unit_code || '' };
      }

      return detailObj;
    });

    // เพิ่ม details เข้าไปใน result
    result.kt_dpbdts = processedDetails;

    // Debug: แสดงข้อมูลตัวอย่าง
    if (processedDetails.length > 0) {
      console.log('Sample first detail item:', {
        product_code: processedDetails[0].product_code,
        product_name: processedDetails[0].tbl_product?.product_name || 'Not available',
        qty: processedDetails[0].qty,
        unit: processedDetails[0].tbl_unit?.unit_name || processedDetails[0].unit_code || 'Not available'
      });
    }

    res.status(200).json({ result: true, data: result });
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
    const { Op } = require("sequelize");
    const { refno } = await req.body;

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

    const formattedDate = date ? new Date(date) : new Date();
    const year = formattedDate.getFullYear().toString().slice(-2);
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}${month}`;

    const pattern = `KTDPB${kitchen_code}${dateStr}%`;

    const refno = await Kt_dpbModel.findOne({
      where: {
        refno: {
          [Op.like]: pattern
        }
      },
      order: [['refno', 'DESC']],
    });

    if (!refno) {
      const newRefno = `KTDPB${kitchen_code}${dateStr}001`;
      res.status(200).send({
        result: true,
        data: { refno: newRefno }
      });
      return;
    }

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
    let refnoValue = req.body.refno;
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

    const orderData = await Kt_dpbModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh', 'refno1',
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
      where: { refno: refnoValue }
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