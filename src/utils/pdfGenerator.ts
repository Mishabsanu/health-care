import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceItem {
  name: string;
  description?: string;
  note?: string;
  price: number;
  quantity: number;
}

interface InvoiceData {
  id: string;
  patientName: string;
  patientPhone?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  amount: number;
  remarks?: string;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

export const generateInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF() as any;
  
  // 🎨 THEME COLORS | Clinical Teal / Slate
  const brandColor: [number, number, number] = [15, 118, 110]; // #0f766e
  const slateDark: [number, number, number] = [15, 23, 42];    // #0f172a
  const slateMain: [number, number, number] = [30, 41, 59];    // #1e293b
  const slateMuted: [number, number, number] = [100, 116, 139]; // #64748b
  const lightBorder: [number, number, number] = [226, 232, 240]; // #e2e8f0

  const margin = 20;
  const colTwoX = 130;

  // 🏛️ HEADER | Top-Left Branding
  doc.setTextColor(...slateDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text((data.clinicName || 'PHYSIO 4').toUpperCase(), margin, 25);
  
  doc.setTextColor(...slateMuted);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clinicAddress || 'Edavanna Central, Kerala', margin, 30);
  doc.text(`Contact: ${data.clinicPhone || '976441'}`, margin, 34);

  // 🖼️ LOGO | Top-Right Placeholder/Logo
  try {
     doc.addImage('/logo.jpeg', 'JPEG', 155, 18, 35, 35);
  } catch (e) {
     doc.setDrawColor(...lightBorder);
     doc.setLineWidth(0.5);
     doc.roundedRect(155, 18, 35, 18, 2, 2, 'S');
     doc.setTextColor(...slateMuted);
     doc.setFontSize(7);
     doc.text('CLINICAL LOGO', 172.5, 29, { align: 'center' });
  }

  // 📝 TITLE | Right identifier
  doc.setTextColor(...slateDark);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const title = 'MEDICAL INVOICE';
  doc.text(title, 200, 65, { align: 'right', charSpace: 1 });

  // -------------------------------------------------------------------
  // 👥 DIRECTORY | Bill To & Invoice Meta
  // -------------------------------------------------------------------
  const startY = 85;

  // BILL TO
  doc.setTextColor(...slateMuted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, startY);

  doc.setTextColor(...slateDark);
  doc.setFontSize(14);
  doc.text(data.patientName.toUpperCase(), margin, startY + 8);

  doc.setTextColor(...slateMuted);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.patientPhone || 'No Contact Info'}`, margin, startY + 13);
  doc.text(`Patient Reference: #${data.id.split('-').pop() || 'N/A'}`, margin, startY + 18);

  // INVOICE META
  const metaY = startY + 8;
  doc.setTextColor(...slateMain);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  doc.text('Invoice #', colTwoX, metaY);
  doc.setTextColor(...slateMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(data.id.toUpperCase(), 195, metaY, { align: 'right' });

  doc.setTextColor(...slateMain);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date', colTwoX, metaY + 7);
  doc.setTextColor(...slateMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(data.date).toLocaleDateString(), 195, metaY + 7, { align: 'right' });

  const dueDate = new Date(data.date);
  dueDate.setDate(dueDate.getDate() + 14);
  doc.setTextColor(...slateMain);
  doc.setFont('helvetica', 'bold');
  doc.text('Due Date', colTwoX, metaY + 14);
  doc.setTextColor(...slateMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(dueDate.toLocaleDateString(), 195, metaY + 14, { align: 'right' });

  // -------------------------------------------------------------------
  // 📒 LEDGER | Modern Table with S.NO, Description, Note
  // -------------------------------------------------------------------
  const tableRows = data.items.map((item: any, idx: number) => [
    (idx + 1).toString().padStart(2, '0'),
    { 
      content: item.name + 
               (item.description ? `\nSpec: ${item.description}` : '') + 
               (item.note ? `\nNote: ${item.note}` : ''), 
      styles: { fontStyle: 'normal' } 
    },
    (item.quantity || 1).toString(),
    `${(item.price || 0).toFixed(2)}`,
    `${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 120,
    margin: { left: margin, right: 15 },
    head: [['S.NO', 'Description / Clinical Note', 'Qty', 'Unit Price', 'Amount']],
    body: tableRows,
    theme: 'plain',
    headStyles: { 
        fillColor: slateMain,
        textColor: [255, 255, 255], 
        fontSize: 9, 
        fontStyle: 'bold',
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    bodyStyles: { 
        fontSize: 8.5, 
        textColor: slateMain,
        cellPadding: { top: 5, bottom: 5, left: 4, right: 4 }
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
    },
    didDrawPage: (data: any) => {
        doc.setDrawColor(...lightBorder);
        doc.setLineWidth(0.1);
    }
  });

  // -------------------------------------------------------------------
  // 📊 SUMMARY | Totals
  // -------------------------------------------------------------------
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  const summaryX = 130;

  doc.setLineWidth(0.3);
  doc.setDrawColor(...slateDark);
  doc.line(summaryX, finalY + 5, 195, finalY + 5);

  const rowH = 7;
  doc.setFontSize(10);
  doc.setTextColor(...slateMain);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', summaryX, finalY + 12);
  doc.text(`${data.subtotal.toFixed(2)}`, 195, finalY + 12, { align: 'right' });

  if (data.discount > 0) {
    doc.text('Discount', summaryX, finalY + 12 + rowH);
    doc.text(`-${data.discount.toFixed(2)}`, 195, finalY + 12 + rowH, { align: 'right' });
  }

  const totalY = finalY + 12 + (data.discount > 0 ? rowH * 2 : rowH);
  doc.setLineWidth(0.8);
  doc.line(summaryX, totalY - 4, 195, totalY - 4);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Amount (INR)`, summaryX, totalY + 2);
  doc.text(`${data.amount.toLocaleString()}`, 195, totalY + 2, { align: 'right' });
  
  doc.setLineWidth(0.2);
  doc.line(summaryX, totalY + 6, 195, totalY + 6);

  // -------------------------------------------------------------------
  // 📝 FOOTER / NOTES | Overall Case Remarks
  // -------------------------------------------------------------------
  const footerY = 240;
  
  if (data.remarks) {
    doc.setTextColor(...slateDark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Remarks / Notes', margin, footerY - 10);
    doc.setTextColor(...slateMuted);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(data.remarks, 170);
    doc.text(splitNotes, margin, footerY - 5);
  }

  doc.setTextColor(...slateDark);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms and Conditions', margin, footerY + 20);

  doc.setTextColor(...slateMuted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment is due within 14 days of issue.`, margin, footerY + 26);
  doc.text(`This is a computer-generated clinical record. Authorized by ${data.clinicName || 'Physio 4'}.`, margin, footerY + 30);
  doc.text(`Please make all payments payable to: ${data.clinicName || 'Physio 4 CLINIC'}`, margin, footerY + 34);

  // Final Watermark Branding
  doc.setTextColor(230, 230, 230);
  doc.setFontSize(7);
  doc.text('PHYSIO 4 CLINIC MANAGEMENT SYSTEM | SECURE LEDGER ID: ' + data.id, 105, 285, { align: 'center' });

  // 💾 DOWNLOAD
  doc.save(`INVOICE_${data.id.toUpperCase()}_${data.patientName.replace(/\s+/g, '_')}.pdf`);
};
