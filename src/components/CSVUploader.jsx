import React from "react";
import Papa from "papaparse";
import { Button } from "@mui/material";

export default function CSVUploader({ onCSVUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const grouped = {};

        results.data.forEach((row) => {
          const name = row["Organization Name"]?.trim();
          if (!name) return;

          if (!grouped[name]) grouped[name] = new Set();

          Object.keys(row).forEach((key) => {
            if (key.toLowerCase().startsWith("url") && row[key]?.trim()) {
              grouped[name].add(row[key].trim());
            }
          });
        });

        const final = Object.entries(grouped).map(([name, links]) => ({
          name,
          links: Array.from(links),
        }));

        onCSVUpload(final);
      },
    });
  };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <input
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        id="csv-upload"
        onChange={handleFileChange}
      />
      <label htmlFor="csv-upload">
        <Button variant="outlined" component="span">
          Upload CSV
        </Button>
      </label>
    </div>
  );
}
