const wh_posModel = require("../models/mainModel").Wh_pos;
const wh_posdtModel = require("../models/mainModel").Wh_posdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models/mainModel");
const {
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User
} = require("../models/mainModel");

exports.addWh_pos = async (req, res) => {
  try {
    // console.log("req",req)
    const headerData = req.body.headerData;
    // console.log("req.body", req.body)
    console.log("headerData", headerData)
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;
    // console.log("footerData", footerData)

    wh_posModel.create({
      refno: headerData.refno,
      rdate: headerData.rdate,
      supplier_code: headerData.supplier_code,
      branch_code: headerData.branch_code,
      trdate: headerData.trdate,
      monthh: headerData.monthh,
      myear: headerData.myear,
      user_code: headerData.user_code,
      taxable: headerData.taxable,
      nontaxable: headerData.nontaxable,
      total: footerData.total
    })
      .then(() => {
        console.log("THEN")
        console.log(productArrayData)
        wh_posdtModel.bulkCreate(productArrayData)
      })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateWh_pos = async (req, res) => {
  try {
    wh_posModel.update(
      {
        rdate: req.body.rdate, //19/10/2024
        trdate: req.body.trdate, //20241019
        myear: req.body.myear, // 2024
        monthh: req.body.monthh, //10
        supplier_code: req.body.supplier_code,
        branch_code: req.body.branch_code,
        taxable: headerData.taxable,
        nontaxable: headerData.nontaxable,
        total: req.body.total,
        user_code: req.body.user_code
      },
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteWh_pos = async (req, res) => {
  try {
    wh_posModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Wh_posAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, supplier_name, branch_name } = req.body;
    const { Op, where } = require("sequelize");

    const wheresupplier = { supplier_name: { [Op.like]: '%', } };
    if (supplier_name)
      wheresupplier = { $like: '%' + supplier_name + '%' };

    const wherebranch = { branch_name: { [Op.like]: '%', } };
    if (branch_name)
      wherebranch = { $like: '%' + branch_name + '%' };

    const wh_posShow = await wh_posModel.findAll({
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          // where: { supplier_name: {[Op.like]: '%'+(supplier_name)+'%',}},
          where: wheresupplier,
          required: true,
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          // where: { branch_name: {[Op.like]: '%'+(branch_name)+'%',}},
          where: wherebranch,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });
    res.status(200).send({ result: true, data: wh_posShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_posAlljoindt = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const { rdate1, rdate2 } = req.body;
    const { supplier_code, branch_code, product_code } = req.body;
    const { Op } = require("sequelize");

    // สร้าง where clause สำหรับ header
    let whereClause = {};

    // ถ้ามี rdate1 และ rdate2 ถึงจะเพิ่มเงื่อนไข between
    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    // ถ้ามีการเลือก supplier_code ถึงจะเพิ่มเงื่อนไข
    if (supplier_code && supplier_code !== '') {
      whereClause.supplier_code = supplier_code;
    }

    // ถ้ามีการเลือก branch_code ถึงจะเพิ่มเงื่อนไข
    if (branch_code && branch_code !== '') {
      whereClause.branch_code = branch_code;
    }

    // ดึงข้อมูลหลักก่อน
    let wh_pos_headers = await wh_posModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'supplier_code', 'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          required: false
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          required: false
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['user_code', 'username'],
          required: false
        }
      ],
      where: whereClause,
      order: [['refno', 'ASC']],
      offset: offset,
      limit: limit
    });

    // ดึงข้อมูลรายละเอียดแยก
    if (wh_pos_headers.length > 0) {
      const refnos = wh_pos_headers.map(header => header.refno);

      // สร้าง where clause สำหรับ details
      let whereDetailClause = {
        refno: refnos
      };

      // ถ้ามีการเลือก product_code ถึงจะเพิ่มเงื่อนไข
      if (product_code && product_code !== '') {
        whereDetailClause = {
          refno: refnos,
          '$tbl_product.product_name$': { [Op.like]: `%${product_code}%` }  // เปลี่ยนเป็นค้นหาจาก product_name แทน
        };
      } else {
        whereDetailClause = {
          refno: refnos
        };
      }

      const details = await wh_posdtModel.findAll({
        where: whereDetailClause,
        include: [
          {
            model: Tbl_product,
            attributes: ['product_code', 'product_name'],
            required: true  // เปลี่ยนเป็น true เพื่อให้ join แบบ inner
          },
          {
            model: unitModel,
            attributes: ['unit_code', 'unit_name'],
            required: false
          }
        ]
      });

      // จัดกลุ่มข้อมูลรายละเอียดตาม refno
      const detailsByRefno = {};
      details.forEach(detail => {
        if (!detailsByRefno[detail.refno]) {
          detailsByRefno[detail.refno] = [];
        }
        detailsByRefno[detail.refno].push(detail);
      });

      // รวมข้อมูลเข้าด้วยกัน
      wh_pos_headers = wh_pos_headers.map(header => {
        const headerData = header.toJSON();
        headerData.wh_posdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    console.log('Query Result:', JSON.stringify(wh_pos_headers, null, 2));

    res.status(200).send({
      result: true,
      data: wh_pos_headers
    });

  } catch (error) {
    console.log("Error in Wh_posAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

// *********************แก้ไขใหม่********************* 
exports.Wh_posByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const wh_posShow = await wh_posModel.findOne({
      include: [
        {
          model: wh_posdtModel,
          include: [{
            model: Tbl_product,
            include: [
              {
                model: unitModel,
                as: 'productUnit1',
                required: true,
              },
              {
                model: unitModel,
                as: 'productUnit2',
                required: true,
              },
            ],
          }],
          // as: "postoposdt",
          // required: true,
        },
      ],
      where: { refno: refno }
      // offset:offset,limit:limit 
    });
    res.status(200).send({ result: true, data: wh_posShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countWh_pos = async (req, res) => {
  try {
    // นับจำนวนรายการทั้งหมด
    const amount = await wh_posModel.count();

    res.status(200).send({
      result: true,
      data: amount
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.searchWh_posrefno = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { refno } = await req.body;
    // console.log((typeproduct_name));

    const Wh_posShow = await wh_posModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Wh_posShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.refno = async (req, res) => {
  try {
    const refno = await wh_posModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.searchWh_posRunno = async (req, res) => {
  try {
    const { Op } = require("sequelize");

    const Wh_posShow = await wh_posModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_posShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};