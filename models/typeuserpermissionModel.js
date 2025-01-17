module.exports = (sequelize, DataTypes) => {
    const Tbl_TypeuserpermissionModel = sequelize.define(
      "tbl_typeuserpermission",
      {
        typeuser_code: {
          type: DataTypes.STRING(10),
        },
        menu_setgeneral: {
          type: DataTypes.STRING(10),
        },
        menu_setuser: {
            type: DataTypes.STRING(10),
        },
        menu_setwarehouse: {
        type: DataTypes.STRING(10),
        },
        menu_setkitchen: {
        type: DataTypes.STRING(10),
        },
        menu_setbranch: {
        type: DataTypes.STRING(10),
        },
        menu_setgen_typeproduct: {
            type: DataTypes.STRING(10),
        },
        menu_setgen_unit: {
            type: DataTypes.STRING(10),
        },
        menu_setgen_product: {
            type: DataTypes.STRING(10),
        },
        menu_setgen_branch: {
            type: DataTypes.STRING(10),
        },
        menu_setgen_kitchen: {
            type: DataTypes.STRING(10),
        },
        menu_setgen_supplier: {
            type: DataTypes.STRING(10),
        },
        menu_setuser_typeuser: {
            type: DataTypes.STRING(10),
        },
        menu_setuser_typeuserpermission: {
            type: DataTypes.STRING(10),
        },
        menu_setuser_user: {
            type: DataTypes.STRING(10),
        },
        menu_setwh_purchase_order_to_supplier: {
            type: DataTypes.STRING(10),
        },
        menu_setwh_receipt_from_supplier: {
            type: DataTypes.STRING(10),
        },
        menu_setwh_receipt_from_kitchen: {
            type: DataTypes.STRING(10),
        },
        menu_setwh_dispatch_to_kitchen: {
            type: DataTypes.STRING(10),
        },
        menu_setwh_dispatch_to_branch: {
            type: DataTypes.STRING(10),
        },
        menu_setwh_daily_closing: {
            type: DataTypes.STRING(10),
        },
        menu_setwh_report: {
            type: DataTypes.STRING(10),
        },
        menu_setkt_purchase_order_to_wh: {
            type: DataTypes.STRING(10),
        },
        menu_setkt_receipt_from_supplier: {
            type: DataTypes.STRING(10),
        },
        menu_setkt_receipt_from_wh: {
            type: DataTypes.STRING(10),
        },
        menu_setkt_goods_requisition: {
            type: DataTypes.STRING(10),
        },
        menu_setkt_product_receipt: {
            type: DataTypes.STRING(10),
        },
        menu_setkt_transfer_to_wh: {
            type: DataTypes.STRING(10),
        },
        menu_setkt_dispatch_to_branch: {
            type: DataTypes.STRING(10),
        },
        menu_setkt_stock_adjustment: {
            type: DataTypes.STRING(10),
        },
        menu_setkt_report: {
            type: DataTypes.STRING(10),
        },
        menu_setbr_minmum_stock: {
            type: DataTypes.STRING(10),
        },
        menu_setbr_stock_adjustment: {
            type: DataTypes.STRING(10),
        },
        menu_setbr_purchase_order_to_wh: {
            type: DataTypes.STRING(10),
        },
        menu_setbr_receipt_from_warehouse: {
            type: DataTypes.STRING(10),
        },
        menu_setbr_receipt_from_kitchen: {
            type: DataTypes.STRING(10),
        },
        menu_setbr_receipt_from_supplier: {
            type: DataTypes.STRING(10),
        },
        menu_setbr_goods_requisition: {
            type: DataTypes.STRING(10),
        },
        menu_setbr_report: {
            type: DataTypes.STRING(10),
        },
      },
      {
        freezeTableName: true,
        // timestamp:false,
        id: false,
        createdAt: false,
        updatedAt: false,
      }
    );
    Tbl_TypeuserpermissionModel.removeAttribute('id');
    return Tbl_TypeuserpermissionModel;
  };