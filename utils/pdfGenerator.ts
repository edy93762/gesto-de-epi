
import jsPDF from 'jspdf';
import { EpiRecord } from '../types';

export const generateEpiPdf = (record: EpiRecord) => {
  const doc = new jsPDF('p', 'mm', 'a4'); // Portrait, Millimeters, A4
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  
  let cursorY = 10;

  // --- HEADER SECTION ---
  // Draw Outline for Header
  doc.setLineWidth(0.3);
  doc.setDrawColor(0);
  
  // Header is a large box divided into two
  const headerHeight = 40;
  doc.rect(margin, cursorY, pageWidth - (margin * 2), headerHeight);
  
  // Vertical divider in header (approx 40% for Logo, 60% for Legal)
  const dividerX = margin + 80;
  doc.line(dividerX, cursorY, dividerX, cursorY + headerHeight);

  // Left Side: Logo & Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 51, 102); // Dark Blue for Logo
  doc.text("Luandre", margin + 10, cursorY + 12);
  
  doc.setFontSize(8);
  doc.setTextColor(50);
  doc.setFont("helvetica", "normal");
  doc.text("Soluções em recursos humanos", margin + 10, cursorY + 17);

  // Divider Line inside Left Box
  doc.line(margin, cursorY + 22, dividerX, cursorY + 22);

  // Title inside Left Box (Bottom half)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  // Break title into lines
  doc.text("FICHA DE CONTROLE DE EPI - EQUIPAMENTO", margin + 2, cursorY + 30);
  doc.text("DE PROTEÇÃO INDIVIDUAL", margin + 12, cursorY + 35);

  // Right Side: Legal Text
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TERMO DE RESPONSABILIDADE", dividerX + 35, cursorY + 5, { align: 'center' });
  
  doc.setFontSize(5); // Tiny font for legal text
  doc.setFont("helvetica", "normal");
  
  const legalText = `Declaro que recebi orientação sobre o uso correto do EPI fornecido pela empresa e que estou ciente da Legislação abaixo discriminada.
Portaria 3214, 08/06/78 do M T E, NR-01 e NR-06
1.4.2 Cabe ao trabalhador:
a) cumprir as disposições legais e regulamentares sobre segurança e saúde no trabalho, inclusive as ordens de serviço expedidas pelo empregador; b) submeter-se aos exames médicos previstos nas NR; c) colaborar com a organização na aplicação das NR; e d) usar o equipamento de proteção individual fornecido pelo empregador.
1.4.2.1 Constitui ato faltoso a recusa injustificada do empregado ao cumprimento do disposto nas alíneas do subitem anterior.
6.7.1 Cabe ao empregado quanto ao EPI:
a) usar, utilizando-o apenas para a finalidade a que se destina; b) responsabilizar-se pela guarda e conservação; c) comunicar ao empregador qualquer alteração que o torne impróprio para uso; e, d) cumprir as determinações do empregador sobre o uso adequado
CLT - Art. 462 § 1º - Em caso de dano causado pelo empregado o desconto será lícito desde que esta possibilidade tenha sido acordada ou na ocorrência de dolo do empregado.`;

  const splitLegal = doc.splitTextToSize(legalText, (pageWidth - margin) - dividerX - 2);
  doc.text(splitLegal, dividerX + 1, cursorY + 9);

  cursorY += headerHeight;

  // --- EMPLOYEE INFO SECTION ---
  // A grid of boxes. 
  // Row 1: Name (Full width)
  // Row 2: CPF | Data de Admissão
  // Row 3: Unidade | Turno
  // Row 4: Função (Full width)

  const rowHeight = 7;
  const photoWidth = 23;
  // If we have a photo, we'll reserve space on the right side
  
  // Row 1: Nome
  doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Nome:", margin + 2, cursorY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.text(record.employeeName || "", margin + 15, cursorY + 4.5);
  
  cursorY += rowHeight;

  // Row 2: CPF & Admissão
  doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight);
  // Vertical line for split (50%)
  doc.line(pageWidth / 2, cursorY, pageWidth / 2, cursorY + rowHeight);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CPF:", margin + 2, cursorY + 4.5); // Changed from Matrícula to CPF
  doc.setFont("helvetica", "normal");
  doc.text(record.cpf || "", margin + 12, cursorY + 4.5);

  doc.setFont("helvetica", "bold");
  doc.text("Data de Admissão:", (pageWidth / 2) + 2, cursorY + 4.5);
  
  // Print Admission Date
  if (record.admissionDate) {
    const [year, month, day] = record.admissionDate.split('-');
    const formattedAdm = `${day}/${month}/${year}`;
    doc.setFont("helvetica", "normal");
    doc.text(formattedAdm, (pageWidth / 2) + 28, cursorY + 4.5);
  }
  
  cursorY += rowHeight;

  // Row 3: Unidade & Turno
  doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight);
  doc.line(pageWidth / 2, cursorY, pageWidth / 2, cursorY + rowHeight);

  doc.setFont("helvetica", "bold");
  doc.text("Unidade:", margin + 2, cursorY + 4.5);
  // Blank for Unidade

  doc.setFont("helvetica", "bold");
  doc.text("Turno:", (pageWidth / 2) + 2, cursorY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.text(record.shift || "", (pageWidth / 2) + 15, cursorY + 4.5);

  cursorY += rowHeight;

  // Row 4: Função
  doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Função:", margin + 2, cursorY + 4.5);
  // Blank for Função

  cursorY += rowHeight;

  // --- PHOTO OVERLAY ---
  if (record.facePhoto) {
      // Coordinates for photo (Top right of the employee section)
      const sectionTopY = cursorY - (rowHeight * 4);
      const photoX = pageWidth - margin - photoWidth - 1;
      const photoY = sectionTopY + 1;
      const photoH = (rowHeight * 4) - 2;

      // Draw white background to hide lines behind photo
      doc.setFillColor(255, 255, 255);
      doc.rect(photoX, photoY, photoWidth, photoH, 'F');

      // Draw Image
      try {
        doc.addImage(record.facePhoto, 'JPEG', photoX, photoY, photoWidth, photoH);
      } catch (e) {
        console.error("Error adding image to PDF", e);
        doc.setFontSize(6);
        doc.text("Erro na Foto", photoX + 2, photoY + 10);
      }

      // Draw border around photo
      doc.setDrawColor(0);
      doc.rect(photoX, photoY, photoWidth, photoH);

      // Add watermark text
      doc.setFontSize(5);
      doc.setTextColor(0, 100, 0);
      doc.setFont("helvetica", "bold");
      doc.text("VALIDADO", photoX + 1, photoY + photoH + 2);
      doc.setTextColor(0);
  }

  // Add a small spacing before table
  cursorY += 5;

  // --- TABLE SECTION ---
  // Columns:
  // 1. QUANT. (10mm)
  // 2. UNID. (10mm)
  // 3. DISCRIMINAÇÃO (60mm)
  // 4. Nº C. A (25mm)
  // 5. DATA DA ENTREGA (25mm)
  // 6. ASSINATURA (25mm)
  // 7. DATA DA DEVOLUÇÃO (Remaining ~20mm) - Actually let's balance it better
  // 8. ASSINATURA (Remaining)

  // Total width available = 190mm
  const colWidths = [12, 12, 60, 20, 22, 22, 22, 20];
  const headers = ["QUANT.", "UNID.", "DISCRIMINAÇÃO", "Nº C. A", "DATA DA\nENTREGA", "ASSINATURA", "DATA DA\nDEVOLUÇÃO", "ASSINATURA"];
  
  // Draw Header Row
  const tableHeaderHeight = 10;
  let currentX = margin;
  
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, pageWidth - margin, cursorY); // Top line
  
  // Header text & vertical lines
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");

  colWidths.forEach((w, i) => {
    // Vertical line before column (except first which is margin, handled by rect logic or explicit lines)
    if (i > 0) {
        // We draw vertical lines at the end of loop or calculate X
    }
    
    // Draw text centered in column
    const textX = currentX + (w / 2);
    doc.text(headers[i], textX, cursorY + 4, { align: "center", baseline: "middle" });
    
    currentX += w;
  });

  doc.line(margin, cursorY + tableHeaderHeight, pageWidth - margin, cursorY + tableHeaderHeight); // Bottom of header
  
  // Vertical lines for header
  currentX = margin;
  colWidths.forEach((w) => {
    doc.line(currentX, cursorY, currentX, cursorY + tableHeaderHeight);
    currentX += w;
  });
  doc.line(pageWidth - margin, cursorY, pageWidth - margin, cursorY + tableHeaderHeight); // Final vertical line

  cursorY += tableHeaderHeight;

  // --- TABLE CONTENT ---
  const rowH = 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  const dateObj = new Date(record.date);
  const dateStr = dateObj.toLocaleDateString('pt-BR');
  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Loop through items
  record.items.forEach((item) => {
    // Check page break
    if (cursorY + rowH > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
        // Redraw header if needed, but for now simplistic
    }

    currentX = margin;

    // Col 1: QUANT
    doc.text("1", currentX + (colWidths[0]/2), cursorY + 5, { align: 'center' });
    currentX += colWidths[0];

    // Col 2: UNID
    doc.text("UN", currentX + (colWidths[1]/2), cursorY + 5, { align: 'center' });
    currentX += colWidths[1];

    // Col 3: DISCRIMINAÇÃO
    // Truncate if too long
    let name = item.name;
    if (item.code) name = `[${item.code}] ${name}`;
    if (name.length > 35) name = name.substring(0, 32) + "...";
    doc.text(name, currentX + 2, cursorY + 5);
    currentX += colWidths[2];

    // Col 4: C.A.
    const caText = item.ca || "";
    doc.text(caText, currentX + (colWidths[3]/2), cursorY + 5, { align: 'center' });
    currentX += colWidths[3];

    // Col 5: DATA ENTREGA
    doc.text(dateStr, currentX + (colWidths[4]/2), cursorY + 3.5, { align: 'center' });
    doc.setFontSize(5);
    doc.text(timeStr, currentX + (colWidths[4]/2), cursorY + 6.5, { align: 'center' });
    doc.setFontSize(7);
    currentX += colWidths[4];

    // Col 6: ASSINATURA (Empty)
    currentX += colWidths[5];

    // Col 7: DATA DEVOLUÇÃO (Empty)
    currentX += colWidths[6];

    // Col 8: ASSINATURA (Empty)
    
    // Draw row lines
    doc.line(margin, cursorY + rowH, pageWidth - margin, cursorY + rowH); // Bottom horizontal
    
    // Vertical lines for this row
    let vertX = margin;
    colWidths.forEach(w => {
        doc.line(vertX, cursorY, vertX, cursorY + rowH);
        vertX += w;
    });
    doc.line(pageWidth - margin, cursorY, pageWidth - margin, cursorY + rowH); // Final vertical

    cursorY += rowH;
  });

  // Fill remaining page with empty rows if space permits (optional, but looks "form-like")
  // Let's add at least 5 empty rows or fill until footer
  const minEmptyRows = 15 - record.items.length;
  for (let i = 0; i < Math.max(0, minEmptyRows); i++) {
     if (cursorY + rowH > pageHeight - margin) break;
     
     // Draw empty row lines
     doc.line(margin, cursorY + rowH, pageWidth - margin, cursorY + rowH);
     let vertX = margin;
     colWidths.forEach(w => {
        doc.line(vertX, cursorY, vertX, cursorY + rowH);
        vertX += w;
     });
     doc.line(pageWidth - margin, cursorY, pageWidth - margin, cursorY + rowH);
     
     cursorY += rowH;
  }
  
  // Footer with Photo if present (Evidence Copy)
  if (record.facePhoto) {
      if (cursorY + 45 > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
      }
      cursorY += 10;
      doc.setDrawColor(200);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 5;
      
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.setFont("helvetica", "bold");
      doc.text("EVIDÊNCIA DE AUDITORIA (BIOMETRIA FACIAL)", margin, cursorY);
      cursorY += 5;
      
      // Draw image larger for audit
      doc.addImage(record.facePhoto, 'JPEG', margin, cursorY, 30, 40);
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      doc.text(`Colaborador: ${record.employeeName}`, margin + 35, cursorY + 5);
      doc.text(`CPF: ${record.cpf || 'N/A'}`, margin + 35, cursorY + 10);
      doc.text(`Data do Registro: ${dateStr} às ${timeStr}`, margin + 35, cursorY + 15);
      doc.text(`ID Único: ${record.id}`, margin + 35, cursorY + 20);
      
      doc.setDrawColor(0, 150, 0);
      doc.setLineWidth(0.5);
      doc.line(margin + 35, cursorY + 25, margin + 85, cursorY + 25);
      doc.setTextColor(0, 100, 0);
      doc.setFontSize(6);
      doc.text("ASSINATURA DIGITAL VÁLIDA", margin + 35, cursorY + 28);
  }

  // Save
  doc.save(`Luandre_EPI_${record.employeeName.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`);
};
