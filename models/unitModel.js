module.exports = (sequelize, DataTypes) => {
    const UnitModel = sequelize.define(
      "tbl_unit",
      {
        unit_code: {
          type: DataTypes.STRING(10),
        },
        unit_name: {
          type: DataTypes.STRING(255),
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
    UnitModel.removeAttribute('id');
    return UnitModel;
  };