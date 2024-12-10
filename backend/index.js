require("dotenv").config();
const express = require("express");
const serverless = require("serverless-http");
const multer = require("multer"); 
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require('body-parser');
// const { Pool } = require('pg');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const app = express();
const PORT = 4000;

app.use(bodyParser.json());

// Middleware
app.use(cors());
app.use(express.json());


// PostgreSQL connection setup
// const pool = new Pool({
//   user: 'postgres',      
//   host: 'localhost',  
//   database: 'invoicer', 
//   password: process.env.DB_Pass,  
//   port: 5432,               
// });




// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Initialize GoogleGenerativeAI with your API_KEY
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Initialize GoogleAIFileManager with your API_KEY
const fileManager = new GoogleAIFileManager(process.env.API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Routes
app.post("/upload", upload.single("file"), async (req, res) => {
    const file = req.file;
  
    if (!file) {
      return res.status(400).send({ error: "No file uploaded" });
    }
  
    try {
      const filePath = path.resolve(file.path); // Absolute path to the file
  
      // Upload the file to GoogleAIFileManager
      const uploadResponse = await fileManager.uploadFile(filePath, {
        mimeType: file.mimetype,
        displayName: file.originalname,
      });
  
      // Generate content using Gemini
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          },
        },
        { text: process.env.prompt },
      ]);
  
      // Extract the summary text
      const response = result.response.text();
      const jsonStartIndex = response.indexOf('{');
      const jsonEndIndex = response.lastIndexOf('}');

      if (jsonStartIndex === -1 || jsonEndIndex === -1) {
          throw new Error("JSON content not found in the response");
      }

      const jsonString = response.substring(jsonStartIndex, jsonEndIndex + 1);

      // Step 3: Parse the extracted JSON
      const jsonData = JSON.parse(jsonString);
  
      // Clean up uploaded file
      fs.unlinkSync(filePath);
      console.log(jsonData);
      // Send response to frontend
      res.json({
        success: true,
        summary: jsonData,
      });
    } catch (err) {
      console.error("Error processing file:", err);
      res.status(502).json({
        success: false,
        error: err.message,
      });
    }
  });

  // Route to store data in the database
// app.post('/store-invoices', async (req, res) => {
//   console.log('Request body:', req.body);
//   const { serialNumber, customerName, totalAmount, date } = req.body;

//   try {
//     const query = `
//       INSERT INTO invoices ("serialNumber", "customerName", "totalAmount", "date")
//       VALUES ($1, $2, $3, $4)
//       RETURNING *;
//     `;
//     const values = [serialNumber, customerName, totalAmount, date];

//     const result = await pool.query(query, values);
//     res.status(201).json({
//       message: 'Data inserted successfully',
//       data: result.rows[0],
//     });
//   } catch (error) {
//     console.error('Error inserting data:', error);
//     res.status(500).json({ error: 'Failed to insert data' });
//   }
// });

// app.post('/store-customers', async (req, res) => {
//   console.log('Request body:', req.body);
//   const { customerName, phoneNumber, address , serialNumber} = req.body;

//   try {
//     const query = `
//       INSERT INTO customers ("customerName", "phoneNumber", "address", "serialNumber")
//       VALUES ($1, $2, $3, $4)
//       RETURNING *;
//     `;
//     const values = [customerName, phoneNumber, address , serialNumber];

//     const result = await pool.query(query, values);
//     res.status(201).json({
//       message: 'Data inserted successfully',
//       data: result.rows[0],
//     });
//   } catch (error) {
//     console.error('Error inserting data:', error);
//     res.status(500).json({ error: 'Failed to insert data' });
//   }
// });

// app.post('/store-products', async (req, res) => {
//   console.log('Request body:', req.body);

//   let { productName, quantity, unitPrice, tax, serialNumber } = req.body;

//   // Check if quantity, unitPrice, and tax are valid numbers
//   if (
//     isNaN(quantity) || 
//     isNaN(unitPrice) || 
//     isNaN(tax) ||
//     quantity === "" || 
//     unitPrice === "" || 
//     tax === ""
//   ) {
//     return res.status(400).json({ error: 'Invalid data: quantity, unitPrice, and tax must be valid numbers' });
//   }

//   // Parse quantity, unitPrice, and tax to ensure they are numbers
//   quantity = parseFloat(quantity);
//   unitPrice = parseFloat(unitPrice);
//   tax = parseFloat(tax);

//   const query = `
//     INSERT INTO products ("productName", "quantity", "unitPrice", "tax", "serialNumber")
//     VALUES ($1, $2, $3, $4, $5)
//     RETURNING *;
//   `;

//   try {
//     // Using the query with proper parameter placeholders ($1, $2, $3, $4, $5)
//     const values = [productName, quantity, unitPrice, tax, serialNumber];
//     const result = await pool.query(query, values);

//     res.status(201).json({
//       message: 'Product inserted successfully',
//       data: result.rows[0],
//     });
//   } catch (error) {
//     console.error('Error inserting product:', error);
//     res.status(500).json({ error: 'Failed to insert product' });
//   }
// });


  

// Start server
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

module.exports = app;
module.exports.handler = serverless(app);
