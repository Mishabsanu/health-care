import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceItem {
  description: string;
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
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

export const generateInvoicePDF = (data: InvoiceData) => {
  const doc = new jsPDF() as any;
  const brandColor: [number, number, number] = [15, 118, 110]; // #0f766e
  const textMain: [number, number, number] = [30, 41, 59];     // #1e293b
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748b
  const lightBorder: [number, number, number] = [226, 232, 240]; // #e2e8f0

  // ... (Watermark and Branding logic)
  doc.setTextColor(248, 250, 252);
  doc.setFontSize(55);
  doc.setFont('helvetica', 'bold');
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
  doc.text('OFFICIAL CLINICAL RECORD', 30, 190, { angle: 45 });
  doc.restoreGraphicsState();

  // 🏨 BRANDING | Clinic Logo & Header
  const lx = 25;
  const ly = 25;

  try {
     // Note: In a browser environment, this will fetch from the public folder
     doc.addImage('/logo.jpeg', 'JPEG', 20, 15, 18, 18);
  } catch (e) {
     // Fallback to stylized icon if image fails
     doc.setDrawColor(...brandColor);
     doc.setLineWidth(0.8);
     doc.roundedRect(lx - 8, ly - 8, 16, 16, 2, 2, 'S');
     doc.setLineWidth(1.2);
     doc.line(lx - 4, ly, lx + 4, ly);
     doc.line(lx, ly - 4, lx, ly + 4);
  }

  doc.setTextColor(...brandColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PHYSIO 4', 45, 23);
  
  doc.setTextColor(...textMuted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ADVANCED PHYSIOTHERAPY & REHABILITATION', 45, 29, { charSpace: 0.3 });
  
  doc.setTextColor(...textMain);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL', 195, 23, { align: 'right' });
  
  doc.setTextColor(...brandColor);
  doc.setFontSize(9);
  doc.text(`#${data.id.toUpperCase()}`, 195, 29, { align: 'right' });

  // -------------------------------------------------------------------
  // 🏢 DIRECTORY | Registry Information
  // -------------------------------------------------------------------
  const startY = 55;
  
  // Divider
  doc.setDrawColor(...lightBorder);
  doc.setLineWidth(0.2);
  doc.line(20, startY - 5, 195, startY - 5);

  // Bill From column (CLINIC)
  doc.setTextColor(...textMuted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CLINIC INFORMATION', 20, startY);
  
  doc.setTextColor(...textMain);
  doc.setFontSize(10);
  doc.text((data.clinicName || 'PHYSIO 4').toUpperCase(), 20, startY + 6);
  doc.setTextColor(...textMuted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const splitAddress = doc.splitTextToSize(data.clinicAddress || 'Edavanna Central, Kerala', 65);
  doc.text(splitAddress, 20, startY + 11);
  doc.text(`Contact: ${data.clinicPhone || '976441'}`, 20, startY + 20);

  // Bill To column
  doc.setTextColor(...textMuted);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT RECORD', 110, startY);
  
  doc.setTextColor(...textMain);
  doc.setFontSize(11);
  doc.text(data.patientName.toUpperCase(), 110, startY + 6);
  doc.setTextColor(...textMuted);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`File ID: ${data.id.split('-').pop() || 'N/A'}`, 110, startY + 11);
  doc.text(`Contact: ${data.patientPhone || 'N/A'}`, 110, startY + 16);
  doc.text(`Issue Date: ${new Date(data.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, 110, startY + 21);

  // -------------------------------------------------------------------
  // 📒 LEDGER | Minimalist Table
  // -------------------------------------------------------------------
  const tableRows = data.items.map((item: any, index: number) => [
    (index + 1).toString().padStart(2, '0'),
    item.name || item.description || 'Clinical Item',
    `${(item.price || 0).toLocaleString()}`,
    (item.quantity || 1).toString(),
    `${((item.price || 0) * (item.quantity || 1)).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 85,
    margin: { left: 20, right: 15 },
    head: [['#', 'DESCRIPTION', 'RATE (INR)', 'QTY', 'AMOUNT (INR)']],
    body: tableRows,
    theme: 'plain',
    headStyles: { 
        textColor: brandColor, 
        fontSize: 8, 
        fontStyle: 'bold',
        cellPadding: { top: 5, bottom: 5, left: 2, right: 2 },
        halign: 'left',
    },
    bodyStyles: { 
        fontSize: 8.5, 
        textColor: textMain,
        cellPadding: { top: 6, bottom: 6, left: 2, right: 2 }
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left' },
      2: { halign: 'right' },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    didDrawPage: (data: any) => {
        // Subtle line after each row
        const table = data.table;
        doc.setDrawColor(...lightBorder);
        doc.setLineWidth(0.1);
    }
  });

  // -------------------------------------------------------------------
  // 📊 SUMMARY | Totals
  // -------------------------------------------------------------------
  const finalY = (doc as any).lastAutoTable?.finalY || 100;
  const summaryX = 145;

  doc.setFontSize(8.5);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal', summaryX, finalY);
  doc.setTextColor(...textMain);
  doc.text(`${data.subtotal.toLocaleString()}`, 195, finalY, { align: 'right' });

  doc.setTextColor(...textMuted);
  doc.text('Adjustments', summaryX, finalY + 6);
  doc.text(`- ${data.discount.toLocaleString()}`, 195, finalY + 6, { align: 'right' });

  // Total Divider
  doc.setDrawColor(...textMain);
  doc.setLineWidth(0.5);
  doc.line(summaryX, finalY + 9, 195, finalY + 9);

  doc.setTextColor(...brandColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL PAYABLE', summaryX, finalY + 16);
  doc.text(`INR ${data.amount.toLocaleString()}`, 195, finalY + 16, { align: 'right' });

  // -------------------------------------------------------------------
  // 🖊️ AUTHORIZATION | Registry Footnote
  // -------------------------------------------------------------------
  const authY = 250;
  
  // Divider
  doc.setDrawColor(...lightBorder);
  doc.setLineWidth(0.2);
  doc.line(20, authY - 10, 195, authY - 10);

  if (data.id) {
     doc.setTextColor(...textMuted);
     doc.setFontSize(7);
     doc.setFont('helvetica', 'normal');
     doc.text('Notes / Payment Terms:', 20, authY);
     doc.text('This clinical bill is generated by the PCMS automated billing engine.', 20, authY + 4);
     doc.text('Payment for clinical services is due at the time of session completion.', 20, authY + 7);
  }

  // Authorization Line
  doc.setDrawColor(...lightBorder);
  doc.setLineWidth(0.5);
  doc.line(140, authY + 15, 195, authY + 15);
  doc.setTextColor(...textMain);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('JAMALANGADI | PHYSIO 4 AUTHORIZATION', 167.5, authY + 20, { align: 'center' });

  // Footer
  const footerY = 285;
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Medical Registry Record | Secure Reference: ${data.id} | Page 1 of 1`, 105, footerY, { align: 'center' });

  // 💾 DOWNLOAD
  doc.save(`${data.id}_${data.patientName.replace(/\s+/g, '_')}.pdf`);
};
