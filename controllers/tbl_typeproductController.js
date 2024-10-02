const tbl_typeproductModel = require("../models/mainModel").Tbl_typeproduct;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addtypeproduct = async (req, res) => {
    try {
        tbl_typeproductModel.create({
        typeproduct_code: req.body.typeproduct_code,
        typeproduct_name: req.body.typeproduct_name,

      })
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.updatetypeproduct = async (req, res) => {
    try {
        tbl_typeproductModel.update(
        { typeproduct_name: req.body.typeproduct_name },
        { where: { typeproduct_code: req.body.typeproduct_code } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  
  exports.deletetypeproduct = async (req, res) => {
    try {
        tbl_typeproductModel.destroy(
        { where: { typeproduct_code: req.body.typeproduct_code } }
      );
      res.status(200).send({ result: true })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  
  };
  
  exports.typeproductAll = async (req, res) => {
    try {
      const { offset,limit } = req.body;
      const typeproductShow = await tbl_typeproductModel.findAll({ offset:offset,limit:limit });
      res.status(200).send({ result: true, data: typeproductShow })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };

  exports.typeproductcode = async (req, res) => {
    try {
      const typeproductcode = await tbl_typeproductModel.findOne({
        order: [ [ 'typeproduct_code', 'DESC' ]],
    });
      res.status(200).send({ result: true, data: typeproductcode })
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  }
  
  exports.counttypeProduct = async (req, res) => {
    try {
      const { Op } = require("sequelize");
      const amount = await tbl_typeproductModel.count({
        where: {
          typeproduct_code: {
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

  exports.searchtypeProductName = async (req, res) => {
    try {
      // console.log( req.body.type_productname);
      const { typeproduct_name } = req.body;
      console.log((typeproduct_name));
      const { Op } = require("sequelize");
      // const amount = await tbl_typeproductModel.findAll({
      //   where: {
      //     typeproduct_name: {
      //       [Op.like]: `% {type_productname} %`,
      //     },
      //   },
      // });
      const typeproductShow = await tbl_typeproductModel.findAll({ 
        where: {
          typeproduct_name: {
            [Op.like]: `%${typeproduct_name}%`,
          },
        },
       });
      res.status(200).send({ result: true, data: typeproductShow })
      
    } catch (error) {
      console.log(error)
      res.status(500).send({ message: error })
    }
  };
  

//   exports.searchtypeProductName = async (req, res) => {
//     try {
//       const { typeproduct_name } = req.body;  // ดึง typeproduct_name จาก req.body
//       console.log(typeproduct_name);  // ตรวจสอบค่าที่ได้จาก req.body
      
//       const { Op } = require("sequelize");

//       const typeproductShow = await tbl_typeproductModel.findAll({ 
//         where: {
//           typeproduct_name: {
//             [Op.like]: `%${typeproduct_name}%`,  // ใช้ string interpolation
//           },
//         },
//       });

//       res.status(200).send({ result: true, data: typeproductShow });
      
//     } catch (error) {
//       console.log(error);
//       res.status(500).send({ message: error });
//     }
// };
