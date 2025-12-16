import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Settings, Download, Upload, Database, RefreshCw, HardDrive, Sheet, Link, HelpCircle, Copy, Check, ExternalLink, Send, Loader2, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { AutoDeleteConfig, EpiRecord, EpiCatalogItem, Collaborator } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoDeleteConfig;
  onSaveConfig: (config: AutoDeleteConfig) => void;
  onRunCleanup: () => void;
  fullData: {
    records: EpiRecord[];
    catalog: EpiCatalogItem[];
    collaborators: Collaborator[];
    config: AutoDeleteConfig;
  };
  onImportData: (data: any) => void;
}

// SCRIPT ATUALIZADO: Com função de Design (formatarPlanilha)
const GOOGLE_SCRIPT_CODE = `function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(45000); 

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();
    
    // Tratamento de Dados
    var rawData = e.postData.contents;
    var data;
    try {
      data = JSON.parse(rawData);
    } catch(err) {
      var clean = rawData.toString().replace(/\\r\\n/g, "").replace(/\\n/g, "").replace(/\\r/g, "");
      data = JSON.parse(clean);
    }

    // 1. CRIAR CABEÇALHO (Se vazio)
    if (sheet.getLastRow() === 0) {
      var header = [
        "Data", "Hora", "Empresa", "Colaborador", "CPF", 
        "Função", "Turno", "Setor", "Team Leader / Supervisor", "Coordenador", "HSE", "Motivo da Troca",
        "Descrição do EPI", "Quantidade", 
        "Status", "Link Foto", "Link PDF", "FOTO (Visual)"
      ];
      sheet.appendRow(header);
      sheet.setFrozenRows(1);
    }

    // --- CONFIGURAÇÃO DE PASTAS ---
    function getOrCreateFolder(folderName) {
      var folders = DriveApp.getFoldersByName(folderName);
      var folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
      try {
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch(e) {}
      return folder;
    }

    var folderFotos = getOrCreateFolder("EPI_FOTOS");
    var folderPdfs = getOrCreateFolder("EPI_PDFS");

    // Variaveis padrao
    var linkFoto = "-";
    var visualizacaoFoto = "-";
    var statusAssinatura = "Pendente";

    // --- PROCESSAR FOTO ---
    if (data.facePhoto && data.facePhoto.length > 50) {
      try {
        var base64Image = data.facePhoto;
        if (base64Image.indexOf("base64,") > -1) {
            base64Image = base64Image.split("base64,")[1];
        }
        var decodedImage = Utilities.base64Decode(base64Image);
        var safeName = (data.employeeName || "Func").replace(/[^a-zA-Z0-9]/g, "_");
        var fileName = "FOTO_" + safeName + "_" + Utilities.formatDate(new Date(), "GMT-3", "yyyyMMdd_HHmmss") + ".jpg";
        var blob = Utilities.newBlob(decodedImage, "image/jpeg", fileName);
        var file = folderFotos.createFile(blob);
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
        
        linkFoto = file.getUrl();
        var imgUrl = "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
        visualizacaoFoto = '=IMAGE("' + imgUrl + '"; 1)';
        statusAssinatura = "Assinado Digitalmente";
      } catch (err) {
        linkFoto = "Erro: " + err.toString();
      }
    }

    // --- PROCESSAR PDF ---
    var linkPdf = "-";
    if (data.pdfFile && data.pdfFile.length > 50) {
      try {
         var base64Pdf = data.pdfFile;
         if (base64Pdf.indexOf("base64,") > -1) {
            base64Pdf = base64Pdf.split("base64,")[1];
         }
         var decodedPdf = Utilities.base64Decode(base64Pdf);
         var safeNamePdf = (data.employeeName || "Func").replace(/[^a-zA-Z0-9]/g, "_");
         var fileNamePdf = "FICHA_" + safeNamePdf + "_" + Utilities.formatDate(new Date(), "GMT-3", "yyyyMMdd_HHmmss") + ".pdf";
         var blobPdf = Utilities.newBlob(decodedPdf, "application/pdf", fileNamePdf);
         var filePdf = folderPdfs.createFile(blobPdf);
         try { filePdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
         linkPdf = filePdf.getUrl();
      } catch (err) {
         linkPdf = "Erro PDF: " + err.toString();
      }
    }

    // --- FORMATAR DADOS ---
    var dataHora = new Date(data.date);
    var itemsMap = {};
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(function(item) {
        var name = item.name;
        itemsMap[name] = (itemsMap[name] || 0) + 1;
      });
    }
    var descList = [];
    var qtdList = [];
    for (var key in itemsMap) {
      descList.push(key);
      qtdList.push(itemsMap[key]);
    }
    var descTexto = descList.join("\\n"); 
    var qtdTexto = qtdList.join("\\n");

    // --- INSERIR LINHA ---
    sheet.appendRow([
      Utilities.formatDate(dataHora, Session.getScriptTimeZone(), "dd/MM/yyyy"),
      Utilities.formatDate(dataHora, Session.getScriptTimeZone(), "HH:mm:ss"),
      data.company || "-",
      data.employeeName,
      "'" + (data.cpf || ""),
      data.role || "-",
      data.shift || "-",
      data.sector || "-",
      data.teamLeader || "-",
      data.coordinator || "-",
      data.hse || "-",
      data.exchangeReason || "-",
      descTexto,
      qtdTexto,
      statusAssinatura,
      linkFoto, 
      linkPdf,  
      visualizacaoFoto
    ]);
    
    // --- APLICAR DESIGN (DEIXAR BONITO) ---
    formatarPlanilha(sheet);

    return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({"result":"error", "error": e.toString()})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- FUNÇÃO PARA DEIXAR A PLANILHA BONITA ---
function formatarPlanilha(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn(); // Deve ser 18
  
  if (lastRow < 1) return;

  // 1. Estilo do Cabeçalho (Linha 1)
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange
    .setBackground("#202124") // Fundo Escuro (Google Dark Grey)
    .setFontColor("#ffffff")  // Texto Branco
    .setFontWeight("bold")
    .setFontFamily("Roboto")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  // 2. Estilo do Corpo (Linhas de Dados)
  if (lastRow > 1) {
    var dataRange = sheet.getRange(lastRow, 1, 1, lastCol);
    
    // Alinhamento Vertical
    dataRange.setVerticalAlignment("middle").setFontFamily("Roboto").setFontSize(10);
    
    // Alinhamento Horizontal Específico
    // Centro: Data(1), Hora(2), Empresa(3), CPF(5), Turno(7), Qtd(14), Status(15)
    sheet.getRange(lastRow, 1, 1, 3).setHorizontalAlignment("center");
    sheet.getRange(lastRow, 5, 1, 1).setHorizontalAlignment("center");
    sheet.getRange(lastRow, 7, 1, 1).setHorizontalAlignment("center");
    sheet.getRange(lastRow, 14, 1, 2).setHorizontalAlignment("center");
    sheet.getRange(lastRow, 18, 1, 1).setHorizontalAlignment("center"); // Foto
    
    // Esquerda: Nome(4), Descrição(13)
    sheet.getRange(lastRow, 4, 1, 1).setHorizontalAlignment("left");
    sheet.getRange(lastRow, 13, 1, 1).setHorizontalAlignment("left").setWrap(true);

    // Cor Alternada (Zebra Striping)
    if (lastRow % 2 == 0) {
      dataRange.setBackground("#f1f3f4"); // Cinza bem claro
    } else {
      dataRange.setBackground("#ffffff"); // Branco
    }

    // Bordas (Cinza sutil)
    dataRange.setBorder(true, true, true, true, true, true, "#e0e0e0", SpreadsheetApp.BorderStyle.SOLID);
    
    // Altura da Linha (para caber a foto)
    sheet.setRowHeight(lastRow, 90);
  }

  // 3. Largura das Colunas (Ajuste Fino)
  // Apenas define se for a primeira execução ou esporadicamente para não travar
  if (lastRow <= 2) {
      sheet.setColumnWidth(1, 85);  // Data
      sheet.setColumnWidth(2, 70);  // Hora
      sheet.setColumnWidth(3, 80);  // Empresa
      sheet.setColumnWidth(4, 200); // Nome
      sheet.setColumnWidth(13, 300);// Descrição (Bem largo)
      sheet.setColumnWidth(14, 60); // Qtd
      sheet.setColumnWidth(15, 120);// Status
      sheet.setColumnWidth(16, 50); // Link Foto (Estreito)
      sheet.setColumnWidth(17, 50); // Link PDF (Estreito)
      sheet.setColumnWidth(18, 100);// Foto Visual
  }
}`;

// URL Fixa
const FIXED_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxK6LFZpxcq0AhopiWk8_BEMgyiEvduYSlkd9b3tlxDKCQkt0Taz4uV7goK4RNKTEBF/exec";

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  config, 
  onSaveConfig,
  onRunCleanup,
  fullData,
  onImportData
}) => {
  const [localConfig, setLocalConfig] = useState<AutoDeleteConfig>(config);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, percent: 0 });
  
  // Estado para o tutorial
  const [showScriptHelp, setShowScriptHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Estado para o teste de conexão
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setLocalConfig(config);
    setTestResult('idle');
    
    if (isOpen) {
        try {
            const dataString = JSON.stringify(fullData);
            const bytes = new Blob([dataString]).size;
            const usedKB = bytes / 1024;
            const softLimitKB = 10240; 
            
            setStorageUsage({
                used: usedKB,
                percent: Math.min((usedKB / softLimitKB) * 100, 100)
            });
        } catch (e) {
            console.error("Erro ao calcular armazenamento", e);
        }
    }
  }, [config, isOpen, fullData]);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    if (!localConfig.googleSheetsUrl) return;
    
    if (!localConfig.googleSheetsUrl.includes('script.google.com')) {
        alert("A URL parece incorreta. Ela deve começar com 'https://script.google.com...'");
        return;
    }

    setIsTesting(true);
    setTestResult('idle');

    try {
        // Base64 de uma imagem branca 10x10 pixels (jpg)
        const dummyImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAEAAAAAAAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAKAAoDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKAP/2Q==";
        
        // Base64 de um PDF mínimo
        const dummyPdf = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqICAlIHBhZ2UKPDwKICAvVHlwZSAvUGFnZQogIC9QYXJlbnQgMiAwIFIKICAvUmVzb3VyY2VzIDw8CiAgICAvRm9udCA8PAogICAgICAvRjEgNCAwIFIKICAgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqICAlIGZvbnQKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqICAlIGZvbnQKPDwKICAvTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAo3MCA1MCBUZAovRjEgMTIgVGYKKFRlc3RlIEVSSSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDTE1NyAwMDAwMCBuIAowMDAwMDAwMzA3IDAwMDAwIG4gCjAwMDAwMDAzODcgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDgyCiUlRU9GCg==";

        const testPayload = {
            date: new Date().toISOString(),
            company: 'SISTEMA',
            employeeName: 'TESTE DE DESIGN',
            cpf: '000000',
            shift: 'Turno Teste',
            role: 'Função Teste',
            sector: 'Setor Teste',
            items: [{ name: 'Luva', ca: '123' }, { name: 'Luva', ca: '123' }, { name: 'Oculos', ca: '456' }],
            facePhoto: dummyImage, 
            pdfFile: dummyPdf
        };

        // CORREÇÃO CRÍTICA NO TESTE: Usar text/plain
        await fetch(localConfig.googleSheetsUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(testPayload)
        });

        setTestResult('success');
    } catch (error) {
        console.error("Erro no teste:", error);
        setTestResult('error');
    } finally {
        setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveConfig = async () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(fullData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('pt-BR').replace(/:/g, '-');
    
    link.href = url;
    link.download = `backup_gestao_epi_${dateStr}_${timeStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            const parsedData = JSON.parse(content);
            onImportData(parsedData);
            onClose();
        } catch (error) {
            alert("Erro ao ler arquivo. Certifique-se de que é um backup válido.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-dark-800 animate-in fade-in zoom-in duration-200 flex flex-col my-auto max-h-[90vh]">
        <div className="bg-dark-900 px-4 py-3 sm:px-6 sm:py-4 border-b border-dark-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-dark-800 p-2 rounded-lg text-zinc-400">
                <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
                Configurações
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 -mr-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 flex-1 custom-scrollbar">
            
            {/* Storage Usage Section */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-dark-800 pb-2">
                    <HardDrive className="w-5 h-5 text-purple-500" />
                    <h4>Dados do Sistema (Offline)</h4>
                </div>
                
                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-sm text-zinc-400">Tamanho da Base de Dados</span>
                        <div className="text-right">
                            <span className="text-lg font-bold text-white">{storageUsage.used.toFixed(2)} KB</span>
                            <span className="text-xs text-zinc-600 block">Dados salvos no navegador</span>
                        </div>
                    </div>
                    <div className="w-full bg-dark-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${storageUsage.percent > 90 ? 'bg-red-500' : 'bg-purple-500'}`}
                            style={{ width: `${Math.max(storageUsage.percent, 2)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">
                        O sistema usa IndexedDB. A barra acima é apenas uma referência de volume de dados (Meta: 10MB).
                    </p>
                </div>
            </div>

            {/* Integração Google Sheets */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-dark-800 pb-2 gap-2">
                    <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                        <Sheet className="w-5 h-5 text-green-500 shrink-0" />
                        <h4>Integração Google Planilhas</h4>
                    </div>
                    <button 
                        onClick={() => setShowScriptHelp(!showScriptHelp)}
                        className="text-xs text-brand-400 hover:text-brand-300 flex items-center justify-center gap-1 font-medium bg-brand-500/10 px-3 py-2 sm:py-1.5 rounded-full border border-brand-500/20 transition-colors w-full sm:w-auto"
                    >
                        <HelpCircle className="w-3 h-3" />
                        {showScriptHelp ? 'Ocultar Tutorial' : 'Ver Tutorial e Script'}
                    </button>
                </div>

                {/* Tutorial Box ATUALIZADO */}
                {showScriptHelp && (
                    <div className="bg-dark-950 border border-dark-700 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2">
                        <div className="space-y-3 text-sm text-zinc-300">
                            <p className="bg-emerald-500/20 text-emerald-200 p-2 rounded border border-emerald-500/30 font-bold">
                                ✨ SCRIPT ATUALIZADO (DESIGN): Copie e substitua para ter a planilha bonita!
                            </p>
                            <ol className="list-decimal pl-4 space-y-2">
                                <li>Vá na sua planilha: <strong>Extensões</strong> {'>'} <strong>Apps Script</strong>.</li>
                                <li>Apague TUDO e cole o código novo abaixo.</li>
                                <li>Clique no botão <strong>Implantar (Deploy)</strong> no topo direito.</li>
                                <li>Selecione <strong>Gerenciar Implantações (Manage Deployments)</strong>.</li>
                                <li>Clique no <strong>Lápis (Editar)</strong>.</li>
                                <li>No campo "Versão", selecione <strong>NOVA VERSÃO (New Version)</strong>.</li>
                                <li>Clique em <strong>Implantar</strong>.</li>
                            </ol>
                        </div>
                        
                        <div className="relative group">
                            <pre className="bg-dark-900 border border-dark-800 p-3 rounded-lg text-xs text-zinc-400 font-mono overflow-x-auto custom-scrollbar max-h-60">
                                {GOOGLE_SCRIPT_CODE}
                            </pre>
                            <button 
                                onClick={handleCopyScript}
                                className="absolute top-2 right-2 p-2 bg-dark-800 hover:bg-dark-700 text-white rounded-md border border-dark-600 transition-colors shadow-lg"
                                title="Copiar código"
                            >
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3">
                     <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-zinc-400">
                            URL do App da Web (Google Apps Script)
                        </label>
                        
                        {localConfig.googleSheetsUrl !== FIXED_SHEETS_URL && (
                            <button 
                                onClick={() => setLocalConfig({...localConfig, googleSheetsUrl: FIXED_SHEETS_URL})}
                                className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 bg-brand-500/10 px-2 py-1 rounded transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Usar URL Padrão
                            </button>
                        )}
                     </div>
                     <div className="relative">
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600">
                             <Link className="w-4 h-4" />
                         </div>
                         <input 
                            type="text"
                            placeholder="https://script.google.com/macros/s/..."
                            value={localConfig.googleSheetsUrl || ''}
                            onChange={(e) => {
                                setLocalConfig({...localConfig, googleSheetsUrl: e.target.value});
                                setTestResult('idle');
                            }}
                            className="w-full pl-10 pr-3 py-3 sm:py-2 bg-dark-900 border border-dark-700 rounded-lg text-base sm:text-sm text-white focus:ring-1 focus:ring-green-500 outline-none placeholder:text-zinc-700"
                         />
                     </div>
                     
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <button
                            onClick={handleTestConnection}
                            disabled={!localConfig.googleSheetsUrl || isTesting}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all w-full sm:w-auto justify-center ${
                                !localConfig.googleSheetsUrl 
                                ? 'bg-dark-800 text-zinc-600 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                            }`}
                        >
                            {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                            Testar Design e Envio
                        </button>

                        {/* Status Message */}
                        {testResult === 'success' && (
                            <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 w-full sm:w-auto animate-in fade-in slide-in-from-left">
                                <CheckCircle className="w-3 h-3 shrink-0" />
                                <span>Enviado! Confira a planilha.</span>
                            </div>
                        )}
                        {testResult === 'error' && (
                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 w-full sm:w-auto animate-in fade-in slide-in-from-left">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Falha. Verifique a URL.</span>
                            </div>
                        )}
                     </div>
                     
                     <p className="text-[10px] text-zinc-500 leading-tight pt-2 border-t border-dark-800/50">
                         <strong>Nota:</strong> O novo script vai aplicar cores alternadas, bordas e alinhar o texto automaticamente.
                     </p>
                </div>
            </div>

            {/* Backup Section */}
            <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-dark-800 pb-2">
                    <Database className="w-5 h-5 text-emerald-500" />
                    <h4>Backup e Restauração</h4>
                </div>

                {/* Toggle Auto Backup */}
                <div className="flex items-center justify-between p-4 bg-dark-950 rounded-lg border border-dark-800">
                    <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${localConfig.autoBackup ? 'bg-emerald-500/10 text-emerald-500' : 'bg-dark-800 text-zinc-600'}`}>
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-zinc-300">Backup Automático</span>
                        <span className="text-[10px] text-zinc-500">Baixa arquivo JSON ao salvar</span>
                    </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={localConfig.autoBackup || false}
                        onChange={(e) => setLocalConfig({...localConfig, autoBackup: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-dark-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleExport}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-dark-950 border border-dark-800 rounded-xl hover:border-brand-500/50 hover:bg-dark-800 transition-all group"
                    >
                        <div className="p-2 bg-brand-500/10 rounded-full text-brand-400 group-hover:scale-110 transition-transform">
                            <Download className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-zinc-300 text-center">Baixar Manualmente</span>
                    </button>
                    
                    <button 
                        onClick={handleImportClick}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-dark-950 border border-dark-800 rounded-xl hover:border-amber-500/50 hover:bg-dark-800 transition-all group"
                    >
                        <div className="p-2 bg-amber-500/10 rounded-full text-amber-400 group-hover:scale-110 transition-transform">
                            <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-zinc-300 text-center">Restaurar Backup</span>
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".json"
                    />
                </div>
            </div>
              
            <button 
                onClick={handleSaveConfig}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
                <Save className="w-5 h-5" />
                Salvar Configurações
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;