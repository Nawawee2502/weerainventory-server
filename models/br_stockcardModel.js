module.exports = (sequelize, DataTypes) => {
    const br_stockcardModel = sequelize.define(
        "br_stockcard",
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
            branch_code: {
                type: DataTypes.STRING(10),
            },
            lotno: {
                type: DataTypes.INTEGER,
            },
            unit_code: {
                type: DataTypes.STRING(10),
            },
            beg1: {
                type: DataTypes.DOUBLE(12, 2),
            },
            in1: {
                type: DataTypes.DOUBLE(12, 2),
            },
            out1: {
                type: DataTypes.DOUBLE(12, 2),
            },
            upd1: {
                type: DataTypes.DOUBLE(12, 2),
            },
            uprice: {
                type: DataTypes.DOUBLE(12, 2),
            },
            beg1_amt: {
                type: DataTypes.DOUBLE(12, 2),
            },
            in1_amt: {
                type: DataTypes.DOUBLE(12, 2),
            },
            out1_amt: {
                type: DataTypes.DOUBLE(12, 2),
            },
            upd1_amt: {
                type: DataTypes.DOUBLE(12, 2),
            },
            balance: {
                type: DataTypes.DOUBLE(12, 2),
                defaultValue: 0.00
            },
            balance_amount: {
                type: DataTypes.DOUBLE(12, 2),
                defaultValue: 0.00
            }

        },
        {
            freezeTableName: true,
            // timestamp:false,
            id: false,
            createdAt: false,
            updatedAt: false,
        }
    );
    br_stockcardModel.removeAttribute('id');
    return br_stockcardModel;
};