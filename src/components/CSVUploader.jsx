import React from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Button } from "@mui/material";

export default function CSVUploader({ onCSVUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    console.log("Uploading file:", file.name);

    if (fileExtension === "csv") {
      handleCSV(file);
    } else if (["xlsx", "xls"].includes(fileExtension)) {
      handleExcel(file);
    } else {
      alert("Unsupported file format. Please upload CSV or Excel (.xlsx/.xls)");
    }
  };

  const handleCSV = (file) => {
    console.log("Parsing CSV...");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("CSV Parsed:", results.data);
        const structured = structureData(results.data);
        console.log("Structured CSV data:", structured);
        onCSVUpload(structured);
      },
      error: (error) => {
        console.error("CSV parse error:", error);
      },
    });
  };

  const handleExcel = (file) => {
    console.log("Parsing Excel...");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        console.log("Excel Parsed:", jsonData);
        const structured = structureData(jsonData);
        console.log("Structured Excel data:", structured);
        onCSVUpload(structured);
      } catch (err) {
        console.error("Excel parse error:", err);
      }
    };
    reader.readAsBinaryString(file);
  };

  const structureData = (rows) => {
    const grouped = {};

    rows.forEach((row, index) => {
      const name = row["Organization Name"]?.trim();
      if (!name) {
        console.warn(`Row ${index + 1} skipped (missing Organization Name):`, row);
        return;
      }

      if (!grouped[name]) grouped[name] = new Set();

      Object.keys(row).forEach((key) => {
        if (key.toLowerCase().startsWith("url") && row[key]?.trim()) {
          grouped[name].add(row[key].trim());
        }
      });
    });

    return Object.entries(grouped).map(([name, links]) => ({
      name,
      links: Array.from(links),
    }));
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: "none" }}
        id="file-upload"
        onChange={handleFileChange}
      />
      <label htmlFor="file-upload">
        <Button variant="outlined" component="span">
          Upload CSV or Excel
        </Button>
      </label>
    </div>
  );
}
