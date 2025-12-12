import jsPDF from 'jspdf';
import { EpiRecord } from '../types';

export const generateEpiPdf = (record: EpiRecord) => {
  const doc = new jsPDF('p', 'mm', 'a4'); // Portrait, Millimeters, A4
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  
  let cursorY = 10;

  // VERIFICAÇÃO DA EMPRESA (LAYOUT SWITCH)
  const isRandstad = record.company === 'Randstad';

  if (isRandstad) {
    // --- LAYOUT RANDSTAD ---
    
    // Draw Outline for Header
    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    
    // Header height approx 40mm
    const headerHeight = 35;
    // Main Box
    doc.rect(margin, cursorY, pageWidth - (margin * 2), headerHeight);
    
    // Divider vertical for logo vs legal
    const dividerX = margin + 80;
    doc.line(dividerX, cursorY, dividerX, cursorY + headerHeight);

    // -- Left Side: Logo & Title --
    // Randstad Logo (Text simulation)
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 110, 200); // Randstad Blueish
    doc.text("Randstad", margin + 12, cursorY + 14); // Capitalized as requested

    // Small graphic lines for logo feeling
    doc.setLineWidth(1.5);
    doc.setDrawColor(0, 110, 200);
    // Simulating the logo shape roughly
    doc.line(margin + 5, cursorY + 5, margin + 10, cursorY + 5); 
    doc.line(margin + 5, cursorY + 5, margin + 5, cursorY + 12);

    // Divider Line inside Left Box (Title separator)
    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    doc.setTextColor(0);
    doc.line(margin, cursorY + 20, dividerX, cursorY + 20);

    // Title inside Left Box
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("FICHA DE CONTROLE DE EPI - EQUIPAMENTO", margin + 35, cursorY + 25, { align: 'center' });
    doc.text("DE PROTEÇÃO INDIVIDUAL", margin + 35, cursorY + 30, { align: 'center' });

    // -- Right Side: Legal Text (Termo de Responsabilidade) --
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE RESPONSABILIDADE", dividerX + ((pageWidth - margin - dividerX) / 2), cursorY + 5, { align: 'center' });
    
    doc.setFontSize(5); // Tiny font for legal text to fit
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
    doc.text(splitLegal, dividerX + 1, cursorY + 8);

    cursorY += headerHeight;

    // --- INFO FIELDS (Randstad Style) ---
    // Row 1: Nome (Full)
    const rowH = 7;
    doc.rect(margin, cursorY, pageWidth - (margin * 2), rowH);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Nome:", margin + 2, cursorY + 4.5);
    doc.setFont("helvetica", "normal");
    doc.text(record.employeeName || "", margin + 15, cursorY + 4.5);
    cursorY += rowH;

    // Row 2: Matrícula & Admissão
    doc.rect(margin, cursorY, pageWidth - (margin * 2), rowH);
    // Vertical split
    doc.line(margin + 80, cursorY, margin + 80, cursorY + rowH);
    
    doc.setFont("helvetica", "bold");
    doc.text("Matrícula/CPF:", margin + 2, cursorY + 4.5);
    doc.setFont("helvetica", "normal");
    doc.text(record.cpf || "", margin + 25, cursorY + 4.5);

    doc.setFont("helvetica", "bold");
    doc.text("Data de Admissão:", margin + 82, cursorY + 4.5);
    if (record.admissionDate) {
        const [y, m, d] = record.admissionDate.split('-');
        doc.setFont("helvetica", "normal");
        doc.text(`${d}/${m}/${y}`, margin + 110, cursorY + 4.5);
    }
    cursorY += rowH;

    // Row 3: Unidade & Turno
    doc.rect(margin, cursorY, pageWidth - (margin * 2), rowH);
    doc.line(margin + 80, cursorY, margin + 80, cursorY + rowH);

    doc.setFont("helvetica", "bold");
    doc.text("Unidade:", margin + 2, cursorY + 4.5);
    // Blank Unidade

    doc.setFont("helvetica", "bold");
    doc.text("Turno:", margin + 82, cursorY + 4.5);
    doc.setFont("helvetica", "normal");
    doc.text(record.shift || "", margin + 95, cursorY + 4.5);
    cursorY += rowH;

    // REMOVIDO: Row 4 (Função)

  } else {
    // --- LAYOUT LUANDRE (Original) ---
    
    // Draw Outline for Header
    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    const headerHeight = 40;
    doc.rect(margin, cursorY, pageWidth - (margin * 2), headerHeight);
    
    const dividerX = margin + 80;
    doc.line(dividerX, cursorY, dividerX, cursorY + headerHeight);

    // Left Side: Logo & Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 102);
    doc.text("Luandre", margin + 10, cursorY + 12);
    
    doc.setFontSize(8);
    doc.setTextColor(50);
    doc.setFont("helvetica", "normal");
    doc.text("Soluções em recursos humanos", margin + 10, cursorY + 17);

    doc.line(margin, cursorY + 22, dividerX, cursorY + 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("FICHA DE CONTROLE DE EPI - EQUIPAMENTO", margin + 2, cursorY + 30);
    doc.text("DE PROTEÇÃO INDIVIDUAL", margin + 12, cursorY + 35);

    // Right Side: Legal Text
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE RESPONSABILIDADE", dividerX + 35, cursorY + 5, { align: 'center' });
    
    doc.setFontSize(5); 
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

    // --- EMPLOYEE INFO SECTION (Luandre) ---
    const rowHeight = 7;
    doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Nome:", margin + 2, cursorY + 4.5);
    doc.setFont("helvetica", "normal");
    doc.text(record.employeeName || "", margin + 15, cursorY + 4.5);
    cursorY += rowHeight;

    doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight);
    doc.line(pageWidth / 2, cursorY, pageWidth / 2, cursorY + rowHeight);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CPF:", margin + 2, cursorY + 4.5);
    doc.setFont("helvetica", "normal");
    doc.text(record.cpf || "", margin + 12, cursorY + 4.5);
    doc.setFont("helvetica", "bold");
    doc.text("Data de Admissão:", (pageWidth / 2) + 2, cursorY + 4.5);
    if (record.admissionDate) {
      const [year, month, day] = record.admissionDate.split('-');
      doc.setFont("helvetica", "normal");
      doc.text(`${day}/${month}/${year}`, (pageWidth / 2) + 28, cursorY + 4.5);
    }
    cursorY += rowHeight;

    doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight);
    doc.line(pageWidth / 2, cursorY, pageWidth / 2, cursorY + rowHeight);
    doc.setFont("helvetica", "bold");
    doc.text("Unidade:", margin + 2, cursorY + 4.5);
    doc.setFont("helvetica", "bold");
    doc.text("Turno:", (pageWidth / 2) + 2, cursorY + 4.5);
    doc.setFont("helvetica", "normal");
    doc.text(record.shift || "", (pageWidth / 2) + 15, cursorY + 4.5);
    cursorY += rowHeight;

    // REMOVIDO: Row 4 (Função)
  }

  // Add a small spacing before table
  cursorY += 5;

  // --- TABLE SECTION (Shared) ---
  const colWidths = [12, 12, 60, 20, 22, 22, 22, 20];
  const headers = ["QUANT.", "UNID.", "DISCRIMINAÇÃO", "Nº C. A", "DATA DA\nENTREGA", "ASSINATURA", "DATA DA\nDEVOLUÇÃO", "ASSINATURA"];
  
  const tableHeaderHeight = 10;
  let currentX = margin;
  
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, pageWidth - margin, cursorY); // Top line
  
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");

  colWidths.forEach((w, i) => {
    const textX = currentX + (w / 2);
    doc.text(headers[i], textX, cursorY + 4, { align: "center", baseline: "middle" });
    currentX += w;
  });

  doc.line(margin, cursorY + tableHeaderHeight, pageWidth - margin, cursorY + tableHeaderHeight); 
  
  currentX = margin;
  colWidths.forEach((w) => {
    doc.line(currentX, cursorY, currentX, cursorY + tableHeaderHeight);
    currentX += w;
  });
  doc.line(pageWidth - margin, cursorY, pageWidth - margin, cursorY + tableHeaderHeight);

  cursorY += tableHeaderHeight;

  // --- TABLE CONTENT ---
  const rowH = 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  const dateObj = new Date(record.date);
  const dateStr = dateObj.toLocaleDateString('pt-BR');
  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  record.items.forEach((item) => {
    if (cursorY + rowH > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
    }

    currentX = margin;

    // Col 1: QUANT
    doc.text("1", currentX + (colWidths[0]/2), cursorY + 5, { align: 'center' });
    currentX += colWidths[0];

    // Col 2: UNID
    doc.text("UN", currentX + (colWidths[1]/2), cursorY + 5, { align: 'center' });
    currentX += colWidths[1];

    // Col 3: DISCRIMINAÇÃO
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

    // Col 6: ASSINATURA (ENTREGA) - BIOMETRIA FACIAL
    doc.setFontSize(5);
    doc.setTextColor(0, 100, 0); // Verde Escuro
    doc.text("VALIDADO VIA", currentX + (colWidths[5]/2), cursorY + 3.5, { align: 'center' });
    doc.text("BIOMETRIA FACIAL", currentX + (colWidths[5]/2), cursorY + 6.5, { align: 'center' });
    doc.setTextColor(0); // Reset
    doc.setFontSize(7);
    currentX += colWidths[5]; 

    currentX += colWidths[6]; // Data Devolução
    // Assinatura Final
    
    doc.line(margin, cursorY + rowH, pageWidth - margin, cursorY + rowH);
    
    let vertX = margin;
    colWidths.forEach(w => {
        doc.line(vertX, cursorY, vertX, cursorY + rowH);
        vertX += w;
    });
    doc.line(pageWidth - margin, cursorY, pageWidth - margin, cursorY + rowH);

    cursorY += rowH;
  });

  // Empty rows for filler
  const minEmptyRows = 15 - record.items.length;
  for (let i = 0; i < Math.max(0, minEmptyRows); i++) {
     if (cursorY + rowH > pageHeight - margin) break;
     
     doc.line(margin, cursorY + rowH, pageWidth - margin, cursorY + rowH);
     let vertX = margin;
     colWidths.forEach(w => {
        doc.line(vertX, cursorY, vertX, cursorY + rowH);
        vertX += w;
     });
     doc.line(pageWidth - margin, cursorY, pageWidth - margin, cursorY + rowH);
     
     cursorY += rowH;
  }
  
  // Footer Signature Line if needed, or rely on table
  
  doc.save(`${record.company}_EPI_${record.employeeName.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`);
};