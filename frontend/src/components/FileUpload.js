import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from 'react-redux';
import { addFile } from "../features/user/userSlice";
import { updateInvoices } from "../features/user/invoicesSlice";
import { updateCustomer } from "../features/user/customersSlice";
import { addProduct } from "../features/user/productsSlice";

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();


  // Handle file selection
  const handleFileChange = (e) => {
    const inputFile = e.target.files[0];
    document.getElementById("fileUploadButton").style.backgroundColor = '#007bff';
    document.getElementById("showFileName").innerHTML = inputFile && inputFile.name;
    setFile(inputFile);
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setError(null);
    setLoading(true);
    // setExtractedData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Send file to backend
      const response = await axios.post("https://invoice-manager-mocha.vercel.app/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });


      const extractedValues = response.data.summary;
      dispatch(addFile());

      dispatch(updateInvoices({
        serialNumber: extractedValues.InvoicesTab.serialNumber,
        customerName: extractedValues.InvoicesTab.customerName,
        totalAmount: extractedValues.InvoicesTab.totalAmount,
        date: extractedValues.InvoicesTab.date,
      }));

      dispatch(updateCustomer({
        customerName: extractedValues.CustomersTab.customerName,
        phoneNumber: extractedValues.CustomersTab.phoneNumber,
        address: extractedValues.CustomersTab.address,
      }));

      const products = extractedValues.ProductsTab;
      products.map(product => {
        dispatch(addProduct({
          productName: product.productName,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          tax: product.tax
        }
        ))
      })

      setExtractedData(extractedValues);
      // console.log(response.data.summary);
      console.log(localStorage.getItem('user'));

      // Insert into PostgreSQL immediately using extractedValues
    // try {
    //   const dbResponse = await fetch('http://localhost:4000/store-invoices', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(extractedValues.InvoicesTab), // Use extractedValues directly
    //   });

    //   if (!dbResponse.ok) {
    //     throw new Error('Failed to save invoice in the database');
    //   }

    //   const dbData = await dbResponse.json();
    //   console.log('Invoice saved to database:', dbData);
    // } catch (error) {
    //   console.error('Database Error:', error);
    // }
    
    // try {
    //   const customers = extractedValues.CustomersTab; // Extract customer data
    //   const serialNumber = extractedValues.InvoicesTab.serialNumber; // Extract serial number
    
    //   const customerWithSerial = {
    //     ...customers,
    //     serialNumber, // Add serialNumber to customer data
    //   };
    
    //   const dbResponse = await fetch('http://localhost:4000/store-customers', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(customerWithSerial), // Send customer data with serialNumber
    //   });
    
    //   if (!dbResponse.ok) {
    //     throw new Error('Failed to save customers in the database');
    //   }
    
    //   const dbData = await dbResponse.json();
    //   console.log('Customers saved to database:', dbData);
    // } catch (error) {
    //   console.error('Database Error:', error);
    // }

    // try {
    //   const products = extractedValues.ProductsTab; // Extract the products array
    //   const serialNumber = extractedValues.InvoicesTab.serialNumber; // Extract serial number
    
    //   for (const product of products) {
    //     const productWithSerial = {
    //       ...product,
    //       serialNumber, // Add serialNumber to each product
    //     };

    //     const dbResponse = await fetch('http://localhost:4000/store-products', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify(productWithSerial), // Send each product as a JSON object
    //     });
    
    //     if (!dbResponse.ok) {
    //       throw new Error('Failed to save product in the database');
    //     }
    
    //     const dbData = await dbResponse.json();
    //     console.log('Product saved to database:', dbData);
    //   }
    // } catch (error) {
    //   console.error('Database Error:', error);
    // }

    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }

    
  };

  return (
    <div className="fileUploadContainer">
      <h2>Invoice File Upload</h2>
      <form onSubmit={handleFileUpload}>
        <div className="uploadFormContainer">
          <div className="inputFile">
            <i className="fas fa-upload custom-upload-icon custom-upload-button"></i>
            <input type="file" name="invoiceFile" value="" className="file-input" onChange={handleFileChange} />
          </div>
          <button id="fileUploadButton" type="submit" className="fileUploadButton"> Upload </button>
          <div id="showFileName"></div>
        </div>
      </form>

      {loading && <p>Processing file... Please wait.</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* {extractedData && (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <h2>Extracted Data</h2>
          <pre style={{ background: "#f4f4f4", padding: "10px" }}>
            {JSON.stringify(extractedData, null, 2)}
          </pre>
        </div>
      )} */}
    </div>
  );
};

export default FileUpload;
