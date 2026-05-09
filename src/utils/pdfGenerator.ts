import jsPDF from "jspdf";

export const generateCodePDF = (
  code: string,
  output: string,
  error: string | null,
  language: string
) => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 15;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Title
  pdf.setFontSize(18);
  pdf.setFont(undefined, "bold");
  pdf.text("CompileX Code Export", margin, yPosition);
  yPosition += 12;

  // Metadata
  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Language: ${language}`, margin, yPosition);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition + 5);
  pdf.setTextColor(0, 0, 0);
  yPosition += 15;

  // Divider
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Code Section
  pdf.setFontSize(11);
  pdf.setFont(undefined, "bold");
  pdf.text("CODE", margin, yPosition);
  yPosition += 7;

  pdf.setFontSize(9);
  pdf.setFont("courier", "normal");
  const codeLines = code.split("\n");
  for (const line of codeLines) {
    if (yPosition > pageHeight - 20) {
      pdf.addPage();
      yPosition = 15;
    }
    // Truncate long lines
    const truncatedLine =
      line.length > 80 ? line.substring(0, 80) + "..." : line;
    pdf.text(truncatedLine, margin, yPosition);
    yPosition += 4;
  }

  yPosition += 5;

  // Divider
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  // Output Section
  pdf.setFontSize(11);
  pdf.setFont(undefined, "bold");
  pdf.text("EXECUTION RESULT", margin, yPosition);
  yPosition += 7;

  pdf.setFontSize(9);
  pdf.setFont("courier", "normal");
  pdf.setTextColor(error ? 255 : 0, error ? 0 : 0, 0); // Red if error

  const outputText = error || output || "No output";
  const outputLines = outputText.split("\n");
  for (const line of outputLines) {
    if (yPosition > pageHeight - 15) {
      pdf.addPage();
      yPosition = 15;
    }
    const truncatedLine =
      line.length > 80 ? line.substring(0, 80) + "..." : line;
    pdf.text(truncatedLine, margin, yPosition);
    yPosition += 4;
  }

  // Download
  pdf.save("code_export.pdf");
};
