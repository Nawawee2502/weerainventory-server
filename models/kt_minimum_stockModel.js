module.exports = (sequelize, Sequelize) => {
    const Kt_minimum_stock = sequelize.define("kt_minimum_stock", {
        product_code: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        kitchen_code: {
            type: Sequelize.STRING,
            primaryKey: true
        },
        unit_code: {
            type: Sequelize.STRING
        },
        min_qty: {
            type: Sequelize.DECIMAL(12, 2)
        }
    },
        {
            timestamps: false, // Disable createdAt and updatedAt
            freezeTableName: true, // Use the same table name
            tableName: 'kt_minimum_stock' // Specify table name explicitly
        });

    return Kt_minimum_stock;
};