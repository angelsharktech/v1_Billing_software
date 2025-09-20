// ExportUtils.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Export columns (you can import and reuse these anywhere)
// Export to PDF
export const exportToPDF = (data, columns, title = "Exported Data") => {
  const doc = new jsPDF();
  doc.text(title, 14, 10);

  const tableData = data.map(item =>
    columns.map(col => (typeof item[col.key] === "object" ? JSON.stringify(item[col.key]) : item[col.key] || ""))
  );

  autoTable(doc, {
    head: [columns.map(col => col.label)],
    body: tableData,
    startY: 20,
  });

  doc.save(`${title}.pdf`);
};

// Export to Excel
export const exportToExcel = (data, columns = exportColumns, title = "ExportedData") => {
  const exportData = data.map(item => {
    const row = {};
    columns.forEach(col => {
      row[col.label] = item[col.key];
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  XLSX.writeFile(workbook, `${title}.xlsx`);
};
