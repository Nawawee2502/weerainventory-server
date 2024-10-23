module.exports = (sequelize, DataTypes) => {
    const wh_stockcardModel = sequelize.define(
      "wh_stockcard",
      {
        refno: {
          type: DataTypes.STRING(20),
        },
        rdate: {
          type: DataTypes.STRING(25),
        },
        trdate: {
            type: DataTypes.STRING(25),
        },
        myear: {
            type: DataTypes.STRING(25),
        },
        monthh: {
            type: DataTypes.INTEGER,
        },
        product_code: {
            type: DataTypes.STRING(10),
          },
        retail_unit_code: {
        type: DataTypes.STRING(10),
        },
        beg1: {
            type: DataTypes.DOUBLE(12,2),
        },
        in1: {
            type: DataTypes.DOUBLE(12,2),
        },
        out1: {
            type: DataTypes.DOUBLE(12,2),
        },
        upd1: {
            type: DataTypes.DOUBLE(12,2),
        },
        uprice: {
            type: DataTypes.DOUBLE(12,2),
        },
        beg1_amt: {
            type: DataTypes.DOUBLE(12,2),
        },
        in1_amt: {
            type: DataTypes.DOUBLE(12,2),
        },
        out1_amt: {
            type: DataTypes.DOUBLE(12,2),
        },
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