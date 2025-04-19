const Tbl_product = require("../models/mainModel").Tbl_product;
const Kt_minimum_stockModel = require("../models/mainModel").Kt_minimum_stock;
const tbl_unit = require("../models/mainModel").Tbl_unit;
const Tbl_kitchen = require("../models/mainModel").Tbl_kitchen;
const { Op } = require("sequelize");

exports.addKt_minimum_stock = async (req, res) => {
    try {
        // Check if the record already exists
        const existingRecord = await Kt_minimum_stockModel.findOne({
            where: {
                product_code: req.body.product_code,
                kitchen_code: req.body.kitchen_code
            }
        });

        if (existingRecord) {
            return res.status(400).send({
                result: false,
                message: "This product is already set for this kitchen"
            });
        }

        // Create record
        await Kt_minimum_stockModel.create({
            product_code: req.body.product_code,
            kitchen_code: req.body.kitchen_code,
            unit_code: req.body.unit_code,
            min_qty: req.body.min_qty,
            max_qty: req.body.max_qty // Add max_qty field
        });

        res.status(200).send({ result: true });
    } catch (error) {
        console.log(error);
        res.status(500).send({ result: false, message: error.message });
    }
};

exports.updateKt_minimum_stock = async (req, res) => {
    try {
        console.log("Update request:", req.body);
        const [updatedRows] = await Kt_minimum_stockModel.update(
            {
                unit_code: req.body.unit_code,
                min_qty: req.body.min_qty,
                max_qty: req.body.max_qty // Add max_qty field
            },
            {
                where: {
                    product_code: req.body.product_code,
                    kitchen_code: req.body.kitchen_code
                }
            }
        );
        console.log("Updated rows:", updatedRows);
        res.status(200).send({ result: true, updatedRows });
    } catch (error) {
        console.log(error);
        res.status(500).send({ result: false, message: error.message });
    }
};

exports.deleteKt_minimum_stock = async (req, res) => {
    try {
        await Kt_minimum_stockModel.destroy(
            {
                where: {
                    product_code: req.body.product_code,
                    kitchen_code: req.body.kitchen_code
                }
            }
        );
        res.status(200).send({ result: true });
    } catch (error) {
        console.log(error);
        res.status(500).send({ result: false, message: error.message });
    }
};

exports.Query_Kt_minimum_stock = async (req, res) => {
    try {
        const { offset = 0, limit = 10, kitchen_code, product_name } = req.body;

        console.log("Query params:", req.body);

        // สร้าง where clause สำหรับกรอง kitchen_code
        const whereClause = {};
        if (kitchen_code) {
            whereClause.kitchen_code = kitchen_code;
        }

        // กำหนด include สำหรับ join กับตารางอื่น
        const includes = [];

        // Include product
        includes.push({
            model: Tbl_product,
            as: 'tbl_product',
            attributes: ['product_code', 'product_name'],
            required: !!product_name, // บังคับให้มี join เฉพาะเมื่อมีการค้นหาชื่อสินค้า
            where: product_name ? {
                product_name: {
                    [Op.like]: `%${product_name}%`
                }
            } : undefined
        });

        // Include unit
        includes.push({
            model: tbl_unit,
            as: 'tbl_unit',
            attributes: ['unit_code', 'unit_name'],
            required: false
        });

        // Include kitchen
        includes.push({
            model: Tbl_kitchen,
            as: 'tbl_kitchen',
            attributes: ['kitchen_code', 'kitchen_name'],
            required: false
        });

        // ดึงข้อมูล
        const Kt_minimum_stockModelShow = await Kt_minimum_stockModel.findAll({
            where: whereClause,
            include: includes,
            order: [['product_code', 'ASC']],
            offset: parseInt(offset) || 0,
            limit: parseInt(limit) || 10
        });

        console.log(`Found ${Kt_minimum_stockModelShow.length} records`);

        res.status(200).send({ result: true, data: Kt_minimum_stockModelShow });
    } catch (error) {
        console.error("Error in Query_Kt_minimum_stock:", error);
        res.status(500).send({ result: false, message: error.message });
    }
};

exports.countKt_minimum_stock = async (req, res) => {
    try {
        const { kitchen_code, product_name } = req.body;

        console.log("Count params:", req.body);

        // สร้าง where clause
        const whereClause = {};
        if (kitchen_code) {
            whereClause.kitchen_code = kitchen_code;
        }

        let countOptions = {
            where: whereClause,
            distinct: true,
            col: 'product_code'
        };

        // ถ้ามีการค้นหาตามชื่อสินค้า ต้องใช้ include
        if (product_name) {
            countOptions = {
                where: whereClause,
                include: [{
                    model: Tbl_product,
                    as: 'tbl_product',
                    attributes: [],
                    where: {
                        product_name: {
                            [Op.like]: `%${product_name}%`
                        }
                    },
                    required: true
                }],
                distinct: true,
                col: 'product_code'
            };
        }

        const amount = await Kt_minimum_stockModel.count(countOptions);

        console.log(`Count result: ${amount}`);

        res.status(200).send({ result: true, data: amount });
    } catch (error) {
        console.error("Error in countKt_minimum_stock:", error);
        res.status(500).send({ result: false, message: error.message });
    }
};

exports.SearchKt_minimum_stock = async (req, res) => {
    try {
        const { product_code, product_name, kitchen_code } = req.body;

        const whereClause = {};
        const productWhereClause = {};

        if (product_code) {
            whereClause.product_code = { [Op.eq]: product_code };
        }

        if (product_name && Kt_minimum_stockModel.associations.tbl_product) {
            productWhereClause.product_name = { [Op.like]: `%${product_name}%` };
        }

        if (kitchen_code) {
            whereClause.kitchen_code = { [Op.eq]: kitchen_code };
        }

        const includes = [];

        // Check if associations exist before including them
        if (Kt_minimum_stockModel.associations.tbl_product) {
            includes.push({
                model: Tbl_product,
                as: 'tbl_product',
                attributes: ['product_code', 'product_name'],
                required: product_name ? true : false,
                where: Object.keys(productWhereClause).length > 0 ? productWhereClause : undefined
            });
        }

        if (Kt_minimum_stockModel.associations.tbl_kitchen) {
            includes.push({
                model: Tbl_kitchen,
                as: 'tbl_kitchen',
                attributes: ['kitchen_code', 'kitchen_name'],
                required: false
            });
        }

        if (Kt_minimum_stockModel.associations.tbl_unit) {
            includes.push({
                model: tbl_unit,
                as: 'tbl_unit',
                attributes: ['unit_code', 'unit_name'],
                required: false
            });
        }

        const Kt_minimum_stockShow = await Kt_minimum_stockModel.findAll({
            include: includes,
            where: whereClause
        });

        res.status(200).send({ result: true, data: Kt_minimum_stockShow });
    } catch (error) {
        console.log(error);
        res.status(500).send({ result: false, message: error.message });
    }
};