const tbl_typeuserpermissionModel = require("../models/mainModel").Tbl_typeuserpermission;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// แก้ไขฟังก์ชัน addtypeuserpermission
exports.addtypeuserpermission = async (req, res) => {
  try {
    // Set default 'N' for all fields that might be null
    const defaultPermissions = {
      menu_setgeneral: 'N',
      menu_setuser: 'N',
      menu_setwarehouse: 'N',
      menu_setkitchen: 'N',
      menu_setbranch: 'N',
      menu_setgen_typeproduct: 'N',
      menu_setgen_unit: 'N',
      menu_setgen_product: 'N',
      menu_setgen_branch: 'N',
      menu_setgen_kitchen: 'N',
      menu_setgen_supplier: 'N',
      menu_setuser_typeuser: 'N',
      menu_setuser_typeuserpermission: 'N',
      menu_setuser_user: 'N',
      menu_setwh_purchase_order_to_supplier: 'N',
      menu_setwh_receipt_from_supplier: 'N',
      menu_setwh_receipt_from_kitchen: 'N',
      menu_setwh_dispatch_to_kitchen: 'N',
      menu_setwh_dispatch_to_branch: 'N',
      menu_setwh_beginninginventory: 'N',
      menu_setwh_daily_closing: 'N',
      menu_setwh_report: 'N',
      menu_setkt_purchase_order_to_wh: 'N',
      menu_setkt_receipt_from_supplier: 'N',
      menu_setkt_receipt_from_wh: 'N',
      menu_setkt_goods_requisition: 'N',
      menu_setkt_product_receipt: 'N',
      menu_setkt_transfer_to_wh: 'N',
      menu_setkt_dispatch_to_branch: 'N',
      menu_setkt_stock_adjustment: 'N',
      menu_setkt_beginninginventory: 'N',
      menu_setkt_dailyclosing: 'N',
      menu_setkt_report: 'N',
      menu_setbr_minmum_stock: 'N',
      menu_setbr_stock_adjustment: 'N',
      menu_setbr_purchase_order_to_wh: 'N',
      menu_setbr_receipt_from_warehouse: 'N',
      menu_setbr_receipt_from_kitchen: 'N',
      menu_setbr_receipt_from_supplier: 'N',
      menu_setbr_goods_requisition: 'N',
      menu_setbr_beginninginventory: 'N',
      menu_setbr_dailyclosing: 'N',
      menu_setbr_report: 'N'
    };

    // Merge default permissions with received permissions
    const permissions = {
      ...defaultPermissions,
      ...req.body
    };

    await tbl_typeuserpermissionModel.create(permissions);
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

// แก้ไขฟังก์ชัน updatetypeuserpermission
exports.updatetypeuserpermission = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      menu_setgeneral: req.body.menu_setgeneral || 'N',
      menu_setuser: req.body.menu_setuser || 'N',
      menu_setwarehouse: req.body.menu_setwarehouse || 'N',
      menu_setkitchen: req.body.menu_setkitchen || 'N',
      menu_setbranch: req.body.menu_setbranch || 'N',
      menu_setgen_typeproduct: req.body.menu_setgen_typeproduct || 'N',
      menu_setgen_unit: req.body.menu_setgen_unit || 'N',
      menu_setgen_product: req.body.menu_setgen_product || 'N',
      menu_setgen_branch: req.body.menu_setgen_branch || 'N',
      menu_setgen_kitchen: req.body.menu_setgen_kitchen || 'N',
      menu_setgen_supplier: req.body.menu_setgen_supplier || 'N',
      menu_setuser_typeuser: req.body.menu_setuser_typeuser || 'N',
      menu_setuser_typeuserpermission: req.body.menu_setuser_typeuserpermission || 'N',
      menu_setuser_user: req.body.menu_setuser_user || 'N',
      menu_setwh_purchase_order_to_supplier: req.body.menu_setwh_purchase_order_to_supplier || 'N',
      menu_setwh_receipt_from_supplier: req.body.menu_setwh_receipt_from_supplier || 'N',
      menu_setwh_receipt_from_kitchen: req.body.menu_setwh_receipt_from_kitchen || 'N',
      menu_setwh_dispatch_to_kitchen: req.body.menu_setwh_dispatch_to_kitchen || 'N',
      menu_setwh_dispatch_to_branch: req.body.menu_setwh_dispatch_to_branch || 'N',
      menu_setwh_beginninginventory: req.body.menu_setwh_beginninginventory || 'N',
      menu_setwh_daily_closing: req.body.menu_setwh_daily_closing || 'N',
      menu_setwh_report: req.body.menu_setwh_report || 'N',
      menu_setkt_purchase_order_to_wh: req.body.menu_setkt_purchase_order_to_wh || 'N',
      menu_setkt_receipt_from_supplier: req.body.menu_setkt_receipt_from_supplier || 'N',
      menu_setkt_receipt_from_wh: req.body.menu_setkt_receipt_from_wh || 'N',
      menu_setkt_goods_requisition: req.body.menu_setkt_goods_requisition || 'N',
      menu_setkt_product_receipt: req.body.menu_setkt_product_receipt || 'N',
      menu_setkt_transfer_to_wh: req.body.menu_setkt_transfer_to_wh || 'N',
      menu_setkt_dispatch_to_branch: req.body.menu_setkt_dispatch_to_branch || 'N',
      menu_setkt_stock_adjustment: req.body.menu_setkt_stock_adjustment || 'N',
      menu_setkt_beginninginventory: req.body.menu_setkt_beginninginventory || 'N',
      menu_setkt_dailyclosing: req.body.menu_setkt_dailyclosing || 'N',
      menu_setkt_report: req.body.menu_setkt_report || 'N',
      menu_setbr_minmum_stock: req.body.menu_setbr_minmum_stock || 'N',
      menu_setbr_stock_adjustment: req.body.menu_setbr_stock_adjustment || 'N',
      menu_setbr_purchase_order_to_wh: req.body.menu_setbr_purchase_order_to_wh || 'N',
      menu_setbr_receipt_from_warehouse: req.body.menu_setbr_receipt_from_warehouse || 'N',
      menu_setbr_receipt_from_kitchen: req.body.menu_setbr_receipt_from_kitchen || 'N',
      menu_setbr_receipt_from_supplier: req.body.menu_setbr_receipt_from_supplier || 'N',
      menu_setbr_goods_requisition: req.body.menu_setbr_goods_requisition || 'N',
      menu_setbr_beginninginventory: req.body.menu_setbr_beginninginventory || 'N',
      menu_setbr_dailyclosing: req.body.menu_setbr_dailyclosing || 'N',
      menu_setbr_report: req.body.menu_setbr_report || 'N'
    };

    await tbl_typeuserpermissionModel.update(
      updateData,
      { where: { typeuser_code: req.body.typeuser_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

// ฟังก์ชันอื่นๆ ยังคงเหมือนเดิม เพราะไม่ได้เกี่ยวข้องกับ fields ที่เพิ่มเข้ามาใหม่
exports.deletetypeuserpermission = async (req, res) => {
  try {
    tbl_typeuserpermissionModel.destroy(
      { where: { typeuser_code: req.body.typeuser_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.typeuserpermissionAll = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const result = await tbl_typeuserpermissionModel.findAll({
      offset: offset,
      limit: limit
    });

    res.status(200).send({
      result: true,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.countTypeuserpermission = async (req, res) => {
  try {
    const { Op, col } = require("sequelize");
    const amount = await tbl_typeuserpermissionModel.count({
      where: {
        typeuser_code: {
          [Op.gt]: '0',
        },
      },
      col: 'typeuser_code'
    });
    res.status(200).send({ result: true, data: amount })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};