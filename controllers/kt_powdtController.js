const { Kt_powdt: Kt_powdtModel,
  Kt_pow: Kt_powModel,
  Tbl_unit: unitModel,
  Tbl_product: productModel,
  sequelize } = require("../models/mainModel");

exports.addKt_powdt = async (req, res) => {
  try {
    Kt_powdtModel.create({
      refno: req.body.refno,
      product_code: req.body.product_code,
      qty: req.body.qty,
      unit_code: req.body.unit_code,
      uprice: req.body.uprice,
      tax1: req.body.tax1,
      amt: req.body.amt,
    })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.updateKt_powdt = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    console.log("Updating Kt_powdt with data:", req.body);

    // Build the update object only with fields that are provided
    const updateFields = {};
    if (req.body.qty !== undefined) updateFields.qty = parseFloat(req.body.qty);
    if (req.body.uprice !== undefined) updateFields.uprice = parseFloat(req.body.uprice);
    if (req.body.tax1 !== undefined) updateFields.tax1 = req.body.tax1;
    if (req.body.unit_code !== undefined) updateFields.unit_code = req.body.unit_code;
    if (req.body.amt !== undefined) updateFields.amt = parseFloat(req.body.amt);

    // Add qty_send field to the update, make sure it's a number
    if (req.body.qty_send !== undefined) {
      updateFields.qty_send = parseFloat(req.body.qty_send);
      console.log(`Updating qty_send to ${updateFields.qty_send} for product ${req.body.product_code}`);
    }

    // Check if we have fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).send({
        result: false,
        message: "No fields to update provided"
      });
    }

    // Get the current record to compare qty vs qty_send after update
    const currentRecord = await Kt_powdtModel.findOne({
      where: {
        refno: req.body.refno,
        product_code: req.body.product_code
      },
      transaction: t
    });

    if (!currentRecord) {
      await t.rollback();
      return res.status(404).send({
        result: false,
        message: "Record not found"
      });
    }

    // Store original qty for comparison
    const originalQty = parseFloat(currentRecord.qty || 0);

    // Calculate what the new qty_send will be
    let newQtySend = parseFloat(currentRecord.qty_send || 0);
    if (updateFields.qty_send !== undefined) {
      newQtySend = updateFields.qty_send;
    }

    // Update the record
    const result = await Kt_powdtModel.update(
      updateFields,
      {
        where: {
          refno: req.body.refno,
          product_code: req.body.product_code
        },
        transaction: t
      }
    );

    console.log("Update result:", result);

    // Check if after the update, qty_send equals or exceeds qty
    if (newQtySend >= originalQty) {
      console.log(`Product ${req.body.product_code} has been fully dispatched (${newQtySend}/${originalQty}), removing from kt_powdt`);

      // Delete this product record since qty_send = qty
      await Kt_powdtModel.destroy({
        where: {
          refno: req.body.refno,
          product_code: req.body.product_code
        },
        transaction: t
      });

      // Check if there are any remaining products for this refno
      const remainingProducts = await Kt_powdtModel.count({
        where: { refno: req.body.refno },
        transaction: t
      });

      console.log(`Remaining products for ${req.body.refno}: ${remainingProducts}`);

      // If no products remain, update the PO status to 'end'
      if (remainingProducts === 0) {
        console.log(`No products remain for PO ${req.body.refno}, updating status to 'end'`);
        await Kt_powModel.update(
          { status: 'end' },
          {
            where: { refno: req.body.refno },
            transaction: t
          }
        );
        console.log(`Updated PO ${req.body.refno} status to 'end'`);
      }
    }

    await t.commit();

    res.status(200).send({
      result: true,
      message: "Updated successfully",
      updatedRows: result[0]
    });

  } catch (error) {
    await t.rollback();
    console.error("Error updating kt_powdt:", error);
    res.status(500).send({
      result: false,
      message: error.message || "An error occurred while updating"
    });
  }
};

exports.deleteKt_powdt = async (req, res) => {
  try {
    Kt_powdtModel.destroy(
      {
        where: {
          refno: req.body.refno,
          product_code: req.body.product_code
        }
      }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Kt_powdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const kt_powShow = await Kt_powdtModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: kt_powShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countKt_powdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Kt_powdtModel.count({
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

exports.Kt_powdtAlljoindt = async (req, res) => {
  try {
    // Extract refno from request body, ensuring it's a string
    let refnoValue = req.body.refno;

    // Check if refno is an object and extract the string value if needed
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
      console.log('Extracted refno from object:', refnoValue);
    }

    console.log('Processing refno for detail query:', refnoValue, 'Type:', typeof refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'Refno is required (not found or empty)'
      });
    }

    const kt_powdtShow = await Kt_powdtModel.findAll({
      include: [
        {
          model: productModel,
          required: true,
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
        },
        {
          model: unitModel,
          required: false
        }
      ],
      where: { refno: refnoValue },
      order: [['product_code', 'ASC']]
    });

    // Transform the data to include all necessary product information
    const transformedData = kt_powdtShow.map(item => {
      const plainItem = item.get({ plain: true });
      return {
        ...plainItem,
        product_name: plainItem.tbl_product?.product_name || '',
        product_code: plainItem.tbl_product?.product_code || '',
        bulk_unit_price: plainItem.tbl_product?.bulk_unit_price || 0,
        retail_unit_price: plainItem.tbl_product?.retail_unit_price || 0,
        unit_name: plainItem.tbl_unit?.unit_name || '',
        productUnit1: plainItem.tbl_product?.productUnit1 || null,
        productUnit2: plainItem.tbl_product?.productUnit2 || null
      };
    });

    res.status(200).send({
      result: true,
      data: transformedData
    });

  } catch (error) {
    console.error('Error in Kt_powdtAlljoindt:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      error: error
    });
  }
};