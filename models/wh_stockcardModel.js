module.exports = (sequelize, DataTypes) => {
    const wh_stockcardModel = sequelize.define(
      "wh_stockcard",
      {
        refno: {
          type: DataTypes.STRING(20),
        },
        rdate: {
          type: DataTypes.STRING(10),
        },
        trdate: {
            type: DataTypes.STRING(10),
        },
        myear: {
            type: DataTypes.STRING(10),
        },
        monthh: {
            type: DataTypes.INTEGER,
        },
        product_code: {
            type: DataTypes.STRING(10),
        },
        // หน่วยเล็กของสินค้าแต่ละตัว แปลงจากหน่วยใหญ่เป็นหน่วยเล็ก ( ถ้าเป็นหน่วยใหญ่ จำนวน * conversion)
        unit_code: {
          type: DataTypes.STRING(10),
        },
        // ยอดยกมา ( qty )
        beg1: {
            type: DataTypes.DOUBLE(12,2),
        },
        // ใบสำคัญรับ (จำนวนสินค้า qty ของเอกสารแต่ละตัว)
        in1: {
            type: DataTypes.DOUBLE(12,2),
        },
        // ใบสำคัญจ่าย ( จำนวนสินค้า qty เช็คหน่วยนับ ถ้าเป็นหน่วยใหญ่ แปลเป็นหน่วยเล็ก )
        out1: {
            type: DataTypes.DOUBLE(12,2),
        },
        // ใบเช็ค stock ( qty ของหน่วยเล็ก กำหนดเป็นหน่วยเล็กเท่านั้น )
        upd1: {
            type: DataTypes.DOUBLE(12,2),
        },
        // ราคาต่อหน่วย ของหน่วยเล็ก
        uprice: {
            type: DataTypes.DOUBLE(12,2),
        },
        // จำนวนเงินของยอดยกมา (หน่วยเล็ก)
        beg1_amt: {
            type: DataTypes.DOUBLE(12,2),
        },
        // จำนวนเงินของใบสำคัญรับ (หน่วยเล็ก)
        in1_amt: {
            type: DataTypes.DOUBLE(12,2),
        },
        // ใบสำคัญจ่าย (หน่วยเล็ก)
        out1_amt: {
            type: DataTypes.DOUBLE(12,2),
        },
        // ใบเช็ค stock (หน่วยเล็ก)
        upd1_amt: {
            type: DataTypes.DOUBLE(12,2),
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
    wh_stockcardModel.removeAttribute('id');
    return wh_stockcardModel;
  };