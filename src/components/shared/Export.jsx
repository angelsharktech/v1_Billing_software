// ExportUtils.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ===============================
// 📘 Export to PDF
// ===============================
export const exportToPDF = (data, columns, title = "Exported Data") => {
  if (!data || data.length === 0) {
    alert("No data to export!");
    return;
  }

  // 👉 Use Landscape orientation (wider)
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt", // use points for better scaling
    format: "a4",
  });

  // Title
  doc.setFontSize(14);
  doc.text(title, 40, 30);

  // Convert data → array of rows
  const tableHead = [columns.map((col) => col.header || col.label)];
  const tableBody = data.map((item) =>
    columns.map((col) => {
      const val = item[col.key];
      if (val == null) return "";
      return typeof val === "object" ? JSON.stringify(val) : String(val);
    })
  );

  // AutoTable
  autoTable(doc, {
    startY: 50,
    head: tableHead,
    body: tableBody,
    styles: {
      fontSize: 9,
      cellPadding: 8,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [173, 216, 230],
      textColor: 20,
      halign: "center",
      valign: "middle",
    },
    bodyStyles: {
      halign: "center",
      valign: "middle",
    },
    theme: "grid",
    tableWidth: "wrap", // ✅ prevents overflow error
  });

  doc.save(`${title}.pdf`);
};

// ===============================
// 📗 Export to Excel
// ===============================
export const exportToExcel = (data, columns, title = "ExportedData") => {
  if (!data || data.length === 0) {
    alert("No data to export!");
    return;
  }

  const exportData = data.map((item) => {
    const row = {};
    columns.forEach((col) => {
      row[col.header || col.label] =
        typeof item[col.key] === "object"
          ? JSON.stringify(item[col.key])
          : item[col.key] ?? "";
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  XLSX.writeFile(workbook, `${title}.xlsx`);
};
