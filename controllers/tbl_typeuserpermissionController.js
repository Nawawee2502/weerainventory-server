const tbl_typeuserpermissionModel = require("../models/mainModel").Tbl_typeuserpermission;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addtypeuserpermission = async (req, res) => {
    try {
        tbl_typeuserpermissionModel.create({
        typeuser_code: req.body.typeuser_code,
        menu_setgeneral: req.body.menu_setgeneral,
        menu_setuser: req.body.menu_setuser,
        menu_setwarehouse: req.body.menu_setwarehouse,
        menu_setkitchen: req.body.menu_setkitchen,
        menu_setbranch: req.body.menu_setbranch,
        menu_setgen_typeproduct: req.body.menu_setgen_typeproduct,
        menu_setgen_unit: req.body.menu_setgen_unit,
        menu_setgen_product: req.body.menu_setgen_product,
        menu_setgen_branch: req.body.menu_setgen_branch,
        menu_setgen_kitchen: req.body.menu_setgen_kitchen,
        menu_setgen_supplier: req.body.menu_setgen_supplier,
        menu_setuser_typeuser: req.body.menu_setuser_typeuser,
        menu_setuser_typeuserpermission: req.body.menu_setuser_typeuserpermission,
        menu_setuser_user: req.body.menu_setuser_user,
        menu_wh_purchase_order_to_supplier: req.body.menu_wh_purchase_order_to_supplier,
        menu_wh_receipt_from_supplier: req.body.menu_wh_receipt_from_supplier,
        menu_wh_receipt_from_kitchen: req.body.menu_wh_receipt_from_kitchen,
        menu_wh_dispatch_to_kitchen: req.body.menu_wh_dispatch_to_kitchen,
        menu_wh_dispatch_to_branch: req.body.menu_wh_dispatch_to_branch,
        menu_wh_report: req.body.menu_wh_report,
        menu_kt_purchase_order_to_wh: req.body.menu_kt_purchase_order_to_wh,
        menu_kt_receipt_from_supplier: req.body.menu_kt_receipt_from_supplier,
        menu_kt_receipt_from_wh: req.body.menu_kt_receipt_from_wh,
        menu_kt_goods_requisition: req.body.menu_kt_goods_requisition,
        menu_kt_product_receipt: req.body.menu_kt_product_receipt,
        menu_kt_transfer_to_wh: req.body.menu_kt_transfer_to_wh,
        menu_kt_dispatch_to_branch: req.body.menu_kt_dispatch_to_branch,
        menu_kt_stock_adjustment: req.body.menu_kt_stock_adjustment,
        menu_kt_report: req.body.menu_kt_report,
        menu_br_minmum_stock: req.body.menu_br_report,
        menu_br_stock_adjustment: req.body.menu_br_stock_adjustment,
        menu_br_purchase_order_to_wh: req.body.menu_br_purchase_order_to_wh,
        menu_br_receipt_from_warehouse: req.body.menu_br_receipt_from_warehouse,
        menu_br_receipt_from_kitchen: req.body.menu_br_receipt_from_kitchen,
        menu_br_receipt_from_supplier: req.body.menu_br_receipt_from_supplier,
        menu_br_goods_requisition: req.body.menu_br_goods_requisition,
        menu_br_report: req.body.menu_br_report,
      })
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updatetypeuserpermission = async (req, res) => {
    try {
        tbl_typeuserpermissionModel.update(
        { menu_setgeneral: req.body.menu_setgeneral },
        { menu_setuser: req.body.menu_setuser },
        { menu_setwarehouse: req.body.menu_setwarehouse },
        { menu_setkitchen: req.body.menu_setkitchen },
        { menu_setbranch: req.body.menu_setbranch },
        { menu_setgen_typeproduct: req.body.menu_setgen_typeproduct },
        { menu_setgen_unit: req.body.menu_setgen_unit },
        { menu_setgen_product: req.body.menu_setgen_product },
        { menu_setgen_branch: req.body.menu_setgen_branch },
        { menu_setgen_kitchen: req.body.menu_setgen_kitchen },
        { menu_setgen_supplier: req.body.menu_setgen_supplier },
        { menu_setuser_typeuser: req.body.menu_setuser_typeuser },
        { menu_setuser_typeuserpermission: req.body.menu_setuser_typeuserpermission },
        { menu_setuser_user: req.body.menu_setuser_user },
        { menu_wh_purchase_order_to_supplier: req.body.menu_wh_purchase_order_to_supplier },
        { menu_wh_receipt_from_supplier: req.body.menu_wh_receipt_from_supplier },
        { menu_wh_receipt_from_kitchen: req.body.menu_wh_receipt_from_kitchen },
        { menu_wh_dispatch_to_kitchen: req.body.menu_wh_dispatch_to_kitchen },
        { menu_wh_dispatch_to_branch: req.body.menu_wh_dispatch_to_branch },
        { menu_wh_report: req.body.menu_wh_report },
        { menu_kt_purchase_order_to_wh: req.body.menu_kt_purchase_order_to_wh },
        { menu_kt_receipt_from_supplier: req.body.menu_kt_receipt_from_supplier },
        { menu_kt_receipt_from_wh: req.body.menu_kt_receipt_from_wh },
        { menu_kt_goods_requisition: req.body.menu_kt_goods_requisition },
        { menu_kt_product_receipt: req.body.menu_kt_product_receipt },
        { menu_kt_transfer_to_wh: req.body.menu_kt_transfer_to_wh },
        { menu_kt_dispatch_to_branch: req.body.menu_kt_dispatch_to_branch },
        { menu_kt_stock_adjustment: req.body.menu_kt_stock_adjustment },
        { menu_kt_report: req.body.menu_kt_report },
        { menu_br_minmum_stock: req.body.menu_br_minmum_stock },
        { menu_br_stock_adjustment: req.body.menu_br_stock_adjustment },
        { menu_br_purchase_order_to_wh: req.body.menu_br_purchase_order_to_wh },
        { menu_br_receipt_from_warehouse: req.body.menu_br_receipt_from_warehouse },
        { menu_br_receipt_from_kitchen: req.body.menu_br_receipt_from_kitchen },
        { menu_br_receipt_from_supplier: req.body.menu_br_receipt_from_supplier },
        { menu_br_goods_requisition: req.body.menu_br_goods_requisition },
        { menu_br_report: req.body.menu_br_report },
        { where: { typeuser_code: req.body.typeuser_code } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  
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
      const {offset,limit}=req.body;
      const typeuserpermissionShow = await tbl_typeuserpermissionModel.findAll({offset:offset,limit:limit});
      res.status(200).send({ result: true, data: typeuserpermissionShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  
  exports.countTypeuserpermission = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await tbl_typeuserpermissionModel.count({
        where: {
          typeuser_code: {
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