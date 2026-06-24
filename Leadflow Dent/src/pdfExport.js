import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function downloadElementAsPdf(elementId, filename) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Nothing to export");

  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth - 40; // 20pt margin each side
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 20;

  pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
  heightLeft -= (pageHeight - 40);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 20;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 20, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 40);
  }

  pdf.save(filename);
}
