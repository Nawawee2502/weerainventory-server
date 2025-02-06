// require("dotenv").config();
// const express = require("express");
// const app = express();

// const cors = require("cors");
// const bodyParser = require("body-parser");

// const apiRouter = require('./routes/router');

// const PORT = process.env.PORT;
// const DOMAIN = process.env.DOMAIN;
// const path = require('path');
// const fs = require('fs');

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// const corsOption = {
//   origin: ["https://weerainventory.com", "http://35.86.111.240", "http://localhost:3001"],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   OptionSuccessStatus: 200,
// };

// app.use(cors(corsOption));

// // ต้องประกาศก่อนใช้
// const publicImagePath = path.join(process.cwd(), 'public/images');

// // สร้างโฟลเดอร์ถ้ายังไม่มี
// if (!fs.existsSync(publicImagePath)) {
//   fs.mkdirSync(publicImagePath, { recursive: true });
// }

// // Debug middleware
// app.use('/public/images', (req, res, next) => {
//   console.log('Requested image path:', req.path);
//   console.log('Full path:', path.join(publicImagePath, req.path));
//   console.log('File exists:', fs.existsSync(path.join(publicImagePath, req.path)));
//   next();
// });

// // Static middleware
// app.use('/public/images', express.static(publicImagePath));

// // เพิ่ม error handler สำหรับไฟล์ไม่พบ
// app.use('/public/images', (req, res) => {
//   res.status(404).send('Image not found');
// });

// // app.use('/uploads', express.static('uploads'));
// // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// // app.use('/uploads', express.static(path.resolve(__dirname, 'uploads/products')));


// // app.use('/uploads', (req, res, next) => {
// //   console.log('Requested file path:', path.join(__dirname, 'uploads/products', req.url));
// //   console.log('File exists:', fs.existsSync(path.join(__dirname, 'uploads/products', req.url)));
// //   next();
// // }, express.static(path.join(__dirname, 'uploads/products')));

// // app.get('/uploads/*', (req, res) => {
// //   console.log('Full request path:', req.path);
// //   res.sendFile(path.join(__dirname, 'uploads/products', path.basename(req.path)));
// // });

// // เพิ่ม static route สำหรับรูปภาพ
// app.use('/public/images', express.static(path.join(process.cwd(), 'public/images')));

// app.use('/public/images', (req, res, next) => {
//   console.log('Requested image path:', req.path);
//   console.log('Full path:', path.join(publicImagePath, req.path));
//   console.log('File exists:', fs.existsSync(path.join(publicImagePath, req.path)));
//   next();
// });

// console.log('Deploy Version 6');

// app.get('/api/test', (req, res) => {
//   console.log('Root Backend get is running on port 4001');
//   res.send('Root API is working with app');
// });

// // Connect Database 
// const db = require("./models/mainModel");
// db.sequelize
//   .sync()
//   .then(() => console.log("Database connected..."))
//   .catch((err) => console.log("Database Connect Failed :" + err.message));


// // Include Routes 
// app.use("/api", apiRouter)

// app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const apiRouter = require('./routes/router');
const PORT = process.env.PORT;
const DOMAIN = process.env.DOMAIN;
const path = require('path');
const fs = require('fs');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS Configuration
const corsOption = {
  origin: ["https://weerainventory.com", "http://35.86.111.240", "http://localhost:3001"],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  OptionSuccessStatus: 200,
};
app.use(cors(corsOption));

// กำหนด path สำหรับรูปภาพ
const publicImagePath = path.join(__dirname, 'public', 'images');

// สร้างโฟลเดอร์ถ้ายังไม่มี
if (!fs.existsSync(publicImagePath)) {
  fs.mkdirSync(publicImagePath, { recursive: true });
  console.log('Created images directory at:', publicImagePath);
}

// Debug middleware
app.use('/public/images', (req, res, next) => {
  const requestedPath = path.join(publicImagePath, req.path);
  console.log('Requested image path:', req.path);
  console.log('Full path:', requestedPath);
  console.log('File exists:', fs.existsSync(requestedPath));
  next();
});

// Serve static files
app.use('/public/images', express.static(publicImagePath, {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Handle 404 for images
app.use('/public/images', (req, res) => {
  console.log('Image not found:', req.path);
  res.status(404).json({ error: 'Image not found' });
});
// Test route
app.get('/api/test', (req, res) => {
  console.log('Root Backend get is running on port 4001');
  res.send('Root API is working with app');
});

// Database connection
const db = require("./models/mainModel");
db.sequelize
  .sync()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.log("Database Connect Failed:", err.message));

// API Routes
app.use("/api", apiRouter);

// Start server
app.listen(PORT, () => {
  console.log('Deploy Version 6');
  console.log(`Server is running on PORT ${PORT}`);
  console.log('Public image path:', publicImagePath);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});