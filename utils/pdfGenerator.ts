import jsPDF from 'jspdf';
import { EpiRecord, Collaborator } from '../types';

// Adicionado parâmetro 'download' (padrão false) para controlar se baixa no PC ou só gera string
export const generateEpiPdf = (record: EpiRecord, download: boolean = false): string => {
  const doc = new jsPDF('p', 'mm', 'a4'); // Portrait, Millimeters, A4
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  
  let cursorY = 10;

  // --- CONFIGURAÇÕES DE LAYOUT POR EMPRESA ---
  if (record.company === 'Randstad') {
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
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 110, 200); // Randstad Blueish
    doc.text("Randstad", margin + 12, cursorY + 14);

    // Small graphic lines for logo feeling
    doc.setLineWidth(1.5);
    doc.setDrawColor(0, 110, 200);
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

    // -- Right Side: Legal Text --
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE RESPONSABILIDADE", dividerX + ((pageWidth - margin - dividerX) / 2), cursorY + 5, { align: 'center' });
    
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
    doc.text(splitLegal, dividerX + 1, cursorY + 8);

    cursorY += headerHeight;

  } else if (record.company === 'Shopee') {
    // --- LAYOUT SHOPEE ---
    
    // Draw Outline for Header
    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    const headerHeight = 35;
    doc.rect(margin, cursorY, pageWidth - (margin * 2), headerHeight);
    
    const dividerX = margin + 80;
    doc.line(dividerX, cursorY, dividerX, cursorY + headerHeight);

    // -- Left Side: Logo & Title --
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(238, 77, 45); // Shopee Orange (#ee4d2d)
    doc.text("Shopee Xpress", margin + 12, cursorY + 14);

    // Shopee shopping bag icon simulation
    doc.setLineWidth(1.5);
    doc.setDrawColor(238, 77, 45);
    doc.rect(margin + 5, cursorY + 8, 5, 6); 
    doc.line(margin + 6, cursorY + 8, margin + 6, cursorY + 6);
    doc.line(margin + 9, cursorY + 8, margin + 9, cursorY + 6);

    // Divider Line
    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    doc.setTextColor(0);
    doc.line(margin, cursorY + 20, dividerX, cursorY + 20);

    // Title
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("FICHA DE CONTROLE DE EPI", margin + 35, cursorY + 25, { align: 'center' });
    doc.text("LOGÍSTICA & OPERAÇÕES", margin + 35, cursorY + 30, { align: 'center' });

    // -- Right Side: Legal Text (Shared) --
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE RESPONSABILIDADE", dividerX + ((pageWidth - margin - dividerX) / 2), cursorY + 5, { align: 'center' });
    
    doc.setFontSize(5); 
    doc.setFont("helvetica", "normal");
    
    const legalText = `Declaro que recebi orientação sobre o uso correto do EPI fornecido pela empresa e que estou ciente da Legislação abaixo discriminada.
Portaria 3214, 08/06/78 do M T E, NR-01 e NR-06. Cabe ao trabalhador:
a) cumprir as disposições legais e regulamentares sobre segurança e saúde no trabalho; b) usar o equipamento de proteção individual fornecido pelo empregador.
Constitui ato faltoso a recusa injustificada do empregado ao cumprimento do disposto.
Cabe ao empregado quanto ao EPI:
a) usar apenas para a finalidade a que se destina; b) responsabilizar-se pela guarda e conservação; c) comunicar qualquer alteração.
CLT - Art. 462 § 1º - Em caso de dano causado pelo empregado o desconto será lícito.`;

    const splitLegal = doc.splitTextToSize(legalText, (pageWidth - margin) - dividerX - 2);
    doc.text(splitLegal, dividerX + 1, cursorY + 8);

    cursorY += headerHeight;

  } else {
    // --- LAYOUT LUANDRE (Default) ---
    
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
  }

  // --- INFO FIELDS (Shared Layout) ---
  const rowHeight = 7;
  
  // Row 1: Nome
  doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Nome:", margin + 2, cursorY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.text(record.employeeName || "", margin + 15, cursorY + 4.5);
  cursorY += rowHeight;

  // Row 2: CPF & Data Admissão
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

  // Row 3: Unidade & Turno
  doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight);
  doc.line(pageWidth / 2, cursorY, pageWidth / 2, cursorY + rowHeight);
  doc.setFont("helvetica", "bold");
  doc.text("Unidade:", margin + 2, cursorY + 4.5);
  doc.setFont("helvetica", "normal");
  
  // LOGIC PARA UNIDADE SHOPEE
  if (record.company === 'Shopee') {
    doc.text("FUL-SP1", margin + 17, cursorY + 4.5);
  } else {
    doc.text("", margin + 17, cursorY + 4.5);
  }
  
  doc.setFont("helvetica", "bold");
  doc.text("Turno:", (pageWidth / 2) + 2, cursorY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.text(record.shift || "", (pageWidth / 2) + 15, cursorY + 4.5);
  cursorY += rowHeight;

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
    
    // LÓGICA DE ASSINATURA PARA SHOPEE
    if (record.company === 'Shopee') {
        doc.text("ASSINADO DIGITALMENTE", currentX + (colWidths[5]/2), cursorY + 3.5, { align: 'center' });
        doc.text("SHOPEE XPRESS", currentX + (colWidths[5]/2), cursorY + 6.5, { align: 'center' });
    } else {
        doc.text("VALIDADO VIA", currentX + (colWidths[5]/2), cursorY + 3.5, { align: 'center' });
        doc.text("BIOMETRIA FACIAL", currentX + (colWidths[5]/2), cursorY + 6.5, { align: 'center' });
    }

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
  
  // Se o download estiver habilitado, baixa o arquivo
  if (download) {
      const filenameTime = dateObj.toLocaleTimeString('pt-BR').replace(/:/g, '-');
      const fileName = `${record.company}_EPI_${record.employeeName.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}_${filenameTime}.pdf`;
      doc.save(fileName);
  }

  // Retorna a string Base64 para ser enviada para a API
  return doc.output('datauristring');
};

// --- NOVO: GERADOR DE HISTÓRICO CONSOLIDADO POR COLABORADOR ---
export const generateCollaboratorHistoryPdf = (collab: Collaborator, records: EpiRecord[]) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let cursorY = 15;

    // Header Simples
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("HISTÓRICO CONSOLIDADO DE EPI", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Colaborador: ${collab.name}`, margin, cursorY);
    cursorY += 5;
    doc.text(`CPF: ${collab.cpf || 'N/A'}`, margin, cursorY);
    cursorY += 5;
    doc.text(`Turno: ${collab.shift || 'N/A'}`, margin, cursorY);
    doc.text(`Empresa: ${collab.company || 'N/A'}`, margin + 80, cursorY);
    cursorY += 10;

    // Table Header
    const colWidths = [30, 80, 20, 30, 30]; // Data, Item, Quant, CA, Status
    const headers = ["DATA", "ITEM / EPI", "QTD", "C.A.", "VALIDAÇÃO"];
    
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, cursorY, pageWidth - (margin * 2), 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    let currentX = margin;
    headers.forEach((h, i) => {
        doc.text(h, currentX + 2, cursorY + 5);
        currentX += colWidths[i];
    });

    cursorY += 8;
    doc.setFont("helvetica", "normal");

    // Loop Records
    records.forEach(rec => {
        const dateStr = new Date(rec.date).toLocaleDateString('pt-BR');
        
        rec.items.forEach(item => {
            if (cursorY > 280) {
                doc.addPage();
                cursorY = 15;
            }

            currentX = margin;
            
            // Date
            doc.text(dateStr, currentX + 2, cursorY + 5);
            currentX += colWidths[0];

            // Item Name (Truncate)
            let itemName = item.name;
            if (itemName.length > 40) itemName = itemName.substring(0, 37) + "...";
            doc.text(itemName, currentX + 2, cursorY + 5);
            currentX += colWidths[1];

            // Qtd
            doc.text("1", currentX + 2, cursorY + 5);
            currentX += colWidths[2];

            // CA
            doc.text(item.ca || "-", currentX + 2, cursorY + 5);
            currentX += colWidths[3];

            // Validation (Biometria)
            doc.text(rec.facePhoto ? "Biometria OK" : "Manual", currentX + 2, cursorY + 5);

            // Line
            doc.setDrawColor(200);
            doc.line(margin, cursorY + 8, pageWidth - margin, cursorY + 8);

            cursorY += 8;
        });
    });

    doc.save(`Historico_${collab.name.replace(/\s+/g, '_')}.pdf`);
};