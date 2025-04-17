const {
    Br_rtk: Br_rtkModel,
    Br_rtkdt: Br_rtkdtModel,
    Tbl_unit: unitModel,
    Tbl_kitchen,
    sequelize,
    Tbl_product,
    Tbl_branch,
    User,
    Br_stockcard,
    Br_product_lotno
} = require("../models/mainModel");
const { Op } = require("sequelize");


exports.addBr_rtk = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { headerData, productArrayData, footerData } = req.body;
        console.log("headerData", headerData);

        if (!headerData.refno || !headerData.branch_code || !headerData.kitchen_code) {
            throw new Error('Missing required fields');
        }

        try {
            await Br_rtkModel.create({
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

            console.log("Create details:", productArrayData);
            await Br_rtkdtModel.bulkCreate(productArrayData, { transaction: t });

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
                    in1: 0,
                    out1: newAmount,  // RTK decreases stock
                    upd1: 0,
                    uprice: newPrice,
                    beg1_amt: 0,
                    in1_amt: 0,
                    out1_amt: newAmountValue,
                    upd1_amt: 0,
                    balance: previousBalance - newAmount,  // Subtract for RTK
                    balance_amount: previousBalanceAmount - newAmountValue
                }, { transaction: t });

                const product = await Tbl_product.findOne({
                    where: { product_code: item.product_code },
                    attributes: ['lotno'],
                    transaction: t
                });

                const newLotno = (product?.lotno || 0) + 1;

                await Tbl_product.update(
                    { lotno: newLotno },
                    {
                        where: { product_code: item.product_code },
                        transaction: t
                    }
                );
            }

            await t.commit();
            res.status(200).send({ result: true });

        } catch (error) {
            await t.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: error.message });
    }
};

exports.updateBr_rtk = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const updateData = req.body;
        console.log("Received update data:", updateData);

        // First update the header record
        const updateResult = await Br_rtkModel.update(
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
        await Br_rtkdtModel.destroy({
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
                Br_rtkdtModel.upsert(product, {
                    transaction: t,
                    // If you want to update existing records
                    conflictFields: ['refno', 'product_code']
                })
            );

            await Promise.all(insertPromises);
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

exports.deleteBr_rtk = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { refno } = req.body;

        await Br_rtkdtModel.destroy({
            where: { refno },
            transaction: t
        });

        await Br_stockcard.destroy({
            where: { refno },
            transaction: t
        });

        const deleteResult = await Br_rtkModel.destroy({
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

exports.Br_rtkAllrdate = async (req, res) => {
    try {
        const { offset, limit, rdate1, rdate2, kitchen_name, branch_name } = req.body;
        const { Op } = require("sequelize");

        let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
        if (kitchen_name) {
            wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
        }

        let wherebranch = { branch_name: { [Op.like]: '%' } };
        if (branch_name) {
            wherebranch = { branch_name: { [Op.like]: `%${branch_name}%` } };
        }

        const br_rtkShow = await Br_rtkModel.findAll({
            include: [
                {
                    model: Tbl_kitchen,
                    attributes: ['kitchen_code', 'kitchen_name'],
                    where: wherekitchen,
                    required: true,
                },
                {
                    model: Tbl_branch,
                    attributes: ['branch_code', 'branch_name'],
                    where: wherebranch,
                    required: true,
                }
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
            data: br_rtkShow
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: error.message });
    }
};

exports.Br_rtkAlljoindt = async (req, res) => {
    try {
        const { offset, limit, rdate, rdate1, rdate2, kitchen_code, branch_code, product_code } = req.body;
        const { refno } = req.body; // Added to handle single refno lookup
        const { Op } = require("sequelize");

        let whereClause = {};

        // If refno is provided, use that as the primary filter
        if (refno) {
            whereClause.refno = refno;
        } else {
            // Otherwise use the date range filters
            if (rdate) whereClause.rdate = rdate;
            if (rdate1 && rdate2) whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
            if (kitchen_code) whereClause.kitchen_code = kitchen_code;
            if (branch_code) whereClause.branch_code = branch_code;
        }

        // Only run the count query if we're doing a date range search (not a specific refno)
        let totalCount = 0;
        if (!refno && rdate1 && rdate2) {
            // Create a proper query with replacements array
            const totalResult = await sequelize.query(
                'SELECT COUNT(refno) as count FROM br_rtk WHERE trdate BETWEEN ? AND ?',
                {
                    replacements: [rdate1, rdate2],
                    type: sequelize.QueryTypes.SELECT
                }
            );

            totalCount = totalResult[0].count;
        }

        // Fetch the header data without joining details
        const br_rtk_headers = await Br_rtkModel.findAll({
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
            where: whereClause,
            order: [['refno', 'ASC']],
            offset: parseInt(offset) || 0,
            limit: refno ? null : (parseInt(limit) || 10) // Don't limit if looking up by refno
        });

        res.status(200).send({
            result: true,
            data: br_rtk_headers,
            total: refno ? br_rtk_headers.length : totalCount
        });

    } catch (error) {
        console.error("Error in Br_rtkAlljoindt:", error);
        res.status(500).send({
            result: false,
            message: error.message
        });
    }
};

exports.Br_rtkByRefno = async (req, res) => {
    try {
        // Step 1: Validate the refno parameter
        let refnoValue = req.body.refno;

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

        if (typeof refnoValue !== 'string' || !refnoValue.trim()) {
            return res.status(400).json({
                result: false,
                message: 'Refno is required and must be a string'
            });
        }

        console.log('Processing refno:', refnoValue, 'Type:', typeof refnoValue);

        // Step 2: Get header data without including detail records
        const Br_rtkHeader = await Br_rtkModel.findOne({
            include: [
                {
                    model: Tbl_kitchen,
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
            where: { refno: refnoValue.toString() }
        });

        if (!Br_rtkHeader) {
            console.log('No data found for refno:', refnoValue);
            return res.status(404).json({
                result: false,
                message: 'Return request not found'
            });
        }

        // Step 3: Get detail records separately (similar to GRF implementation)
        const Br_rtkDetails = await Br_rtkdtModel.findAll({
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

        console.log(`Found ${Br_rtkDetails.length} detail records for refno: ${refnoValue}`);

        // Step 4: Transform data into plain objects (similar to GRF implementation)
        const result = Br_rtkHeader.toJSON();

        // Process details and ensure all required properties exist
        const processedDetails = Br_rtkDetails.map(detail => {
            const detailObj = detail.toJSON();

            // Ensure we have all the properties needed
            if (!detailObj.tbl_product) {
                detailObj.tbl_product = { product_name: 'Product Description' };
            }

            if (!detailObj.tbl_unit) {
                detailObj.tbl_unit = { unit_name: detailObj.unit_code || '' };
            }

            return detailObj;
        });

        // Add the details array to the result object with the same property name (br_rtkdts)
        result.br_rtkdts = processedDetails;

        // Log sample data for debugging
        if (processedDetails.length > 0) {
            console.log('Sample first detail item:', {
                product_code: processedDetails[0].product_code,
                product_name: processedDetails[0].tbl_product?.product_name || 'Not available',
                qty: processedDetails[0].qty,
                unit: processedDetails[0].tbl_unit?.unit_name || processedDetails[0].unit_code || 'Not available'
            });
        }

        res.status(200).json({
            result: true,
            data: result
        });
    } catch (error) {
        console.error('Error in Br_rtkByRefno:', error);
        res.status(500).json({
            result: false,
            message: error.message || 'Failed to fetch return request details',
            stack: error.stack
        });
    }
};

exports.countBr_rtk = async (req, res) => {
    try {
        const { rdate } = req.body;
        let whereClause = {};

        if (rdate) {
            whereClause.rdate = rdate;
        }

        const amount = await Br_rtkModel.count({
            where: whereClause
        });

        res.status(200).send({
            result: true,
            data: amount
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: error.message });
    }
};

exports.searchBr_rtkrefno = async (req, res) => {
    try {
        const { Op } = require("sequelize");
        const { refno } = req.body;

        const br_rtkShow = await Br_rtkModel.findAll({
            where: {
                refno: {
                    [Op.like]: `%${refno}%`
                }
            }
        });

        res.status(200).send({ result: true, data: br_rtkShow });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: error.message });
    }
};

exports.Br_rtkrefno = async (req, res) => {
    try {
        const { branch_code, kitchen_code, date } = req.body;

        if (!branch_code) {
            throw new Error('Branch code is required');
        }

        // Parse the date and format it as YYMM
        const formattedDate = new Date(date);
        const year = formattedDate.getFullYear().toString().slice(-2);
        const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
        const dateStr = `${year}${month}`;

        // Create the pattern for searching
        const pattern = `BRRTK${branch_code}${dateStr}%`;

        // Find the latest reference number for this branch and month
        const refno = await Br_rtkModel.findOne({
            where: {
                refno: {
                    [Op.like]: pattern
                },
                branch_code: branch_code
            },
            order: [['refno', 'DESC']],
        });

        // If no existing refno found, start with 001
        if (!refno) {
            const newRefno = `BRRTK${branch_code}${dateStr}001`;
            res.status(200).send({
                result: true,
                data: { refno: newRefno }
            });
            return;
        }

        // Extract and increment the running number
        const currentRunNo = parseInt(refno.refno.slice(-3));
        const nextRunNo = (currentRunNo + 1).toString().padStart(3, '0');
        const newRefno = `BRRTK${branch_code}${dateStr}${nextRunNo}`;

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

exports.searchBr_rtkRunno = async (req, res) => {
    try {
        const br_rtkShow = await Br_rtkModel.findAll({
            where: {
                myear: req.body.myear,
                monthh: req.body.monthh
            },
            order: [['refno', 'DESC']]
        });

        res.status(200).send({ result: true, data: br_rtkShow });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ message: error.message });
    }
};

// br_rtkController.js
exports.getRtkByRefno = async (req, res) => {
    try {
        const { refno } = req.body;

        if (!refno) {
            return res.status(400).send({
                result: false,
                message: 'Reference number is required'
            });
        }

        // ดึงข้อมูลเฉพาะรายการที่ต้องการ
        const orderData = await Br_rtkModel.findOne({
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
        console.error("Error in getRtkByRefno:", error);
        res.status(500).send({
            result: false,
            message: error.message
        });
    }
};