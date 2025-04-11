const Br_rtkdtModel = require("../models/mainModel").Br_rtkdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addBr_rtkdt = async (req, res) => {
    try {
        Br_rtkdtModel.create({
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

exports.updateBr_rtkdt = async (req, res) => {
    try {
        Br_rtkdtModel.update(
            {
                qty: req.body.qty,
                uprice: req.body.uprice,
                tax1: req.body.tax1,
                unit_code: req.body.unit_code,
                amt: req.body.amt,
            },
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

exports.deleteBr_rtkdt = async (req, res) => {
    try {
        Br_rtkdtModel.destroy(
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

exports.Br_rtkdtAllinnerjoin = async (req, res) => {
    try {
        const { offset, limit } = req.body;
        const br_rtkShow = await Br_rtkdtModel.findAll({ offset: offset, limit: limit });
        res.status(200).send({ result: true, data: br_rtkShow })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: error })
    }
};

exports.countBr_rtkdt = async (req, res) => {
    try {
        const { Op } = require("sequelize");
        const amount = await Br_rtkdtModel.count({
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

exports.Br_rtkdtAlljoindt = async (req, res) => {
    try {
        // ตรวจสอบและแปลงค่า refno ให้เป็น string
        let refnoValue = req.body.refno;

        // เช็คว่า refno เป็น object หรือไม่
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

        console.log('Processing refno for detail query:', refnoValue, 'Type:', typeof refnoValue);

        const br_rtkdtShow = await Br_rtkdtModel.findAll({
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
            where: { refno: refnoValue.toString() },
            order: [['product_code', 'ASC']]
        });

        // Transform the data to include all necessary product information
        const transformedData = br_rtkdtShow.map(item => {
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
        console.error('Error in Br_rtkdtAlljoindt:', error);
        res.status(500).send({
            result: false,
            message: error.message,
            error: error
        });
    }
};