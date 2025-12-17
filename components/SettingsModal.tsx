import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Settings, Download, Upload, Database, RefreshCw, HardDrive, Sheet, Link, HelpCircle, Copy, Check, ExternalLink, Send, Loader2, AlertTriangle, CheckCircle, RotateCcw, DownloadCloud } from 'lucide-react';
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

// SCRIPT TURBO: Suporta Receber (doGet) e Salvar (doPost) Fichas, EPIs e Colaboradores
const GOOGLE_SCRIPT_CODE = `function doGet(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var results = { collaborators: [], catalog: [] };

  try {
    var sheetCollab = doc.getSheetByName("COLABORADORES");
    if (sheetCollab) {
      var data = sheetCollab.getDataRange().getValues();
      var headers = data[0];
      for (var i = 1; i < data.length; i++) {
        var obj = { id: "sheet_" + i };
        for (var j = 0; j < headers.length; j++) {
          var key = headers[j].toString().toLowerCase();
          if (key === "nome") obj.name = data[i][j];
          if (key === "cpf") obj.cpf = data[i][j].toString();
          if (key === "função") obj.role = data[i][j];
          if (key === "setor") obj.sector = data[i][j];
          if (key === "turno") obj.shift = data[i][j];
          if (key === "agência") obj.company = data[i][j];
          if (key === "biometria") obj.faceReference = data[i][j];
        }
        if (obj.name) results.collaborators.push(obj);
      }
    }

    var sheetCatalog = doc.getSheetByName("CATALOGO");
    if (sheetCatalog) {
      var dataCat = sheetCatalog.getDataRange().getValues();
      var headersCat = dataCat[0];
      for (var i = 1; i < dataCat.length; i++) {
        var objCat = { id: "cat_" + i };
        for (var j = 0; j < headersCat.length; j++) {
          var keyCat = headersCat[j].toString().toLowerCase();
          if (keyCat === "id" || keyCat === "código") objCat.code = dataCat[i][j].toString();
          if (keyCat === "nome") objCat.name = dataCat[i][j];
          if (keyCat === "ca") objCat.ca = dataCat[i][j].toString();
          if (keyCat === "estoque") objCat.stock = parseInt(dataCat[i][j]) || 0;
        }
        if (objCat.name) results.catalog.push(objCat);
      }
    }
    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(45000); 

  try {
    var data = JSON.parse(e.postData.contents);
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    
    // --- LÓGICA DE CADASTRO DE EPI ---
    if (data.type === "CATALOG_ITEM") {
       var sheet = doc.getSheetByName("CATALOGO") || doc.insertSheet("CATALOGO");
       if (sheet.getLastRow() === 0) sheet.appendRow(["Código", "Nome", "CA", "Estoque"]);
       
       var rows = sheet.getDataRange().getValues();
       var foundIdx = -1;
       for(var i=1; i<rows.length; i++) {
         if (rows[i][0].toString() === data.code.toString()) { foundIdx = i + 1; break; }
       }
       
       var rowData = [data.code, data.name, data.ca || "", data.stock || 0];
       if (foundIdx > -1) sheet.getRange(foundIdx, 1, 1, 4).setValues([rowData]);
       else sheet.appendRow(rowData);
       
       return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // --- LÓGICA DE CADASTRO DE COLABORADOR ---
    if (data.type === "COLLABORATOR_ITEM") {
       var sheet = doc.getSheetByName("COLABORADORES") || doc.insertSheet("COLABORADORES");
       if (sheet.getLastRow() === 0) sheet.appendRow(["Nome", "CPF", "Função", "Setor", "Turno", "Agência", "Biometria"]);
       
       var rows = sheet.getDataRange().getValues();
       var foundIdx = -1;
       for(var i=1; i<rows.length; i++) {
         if (rows[i][1].toString() === data.cpf.toString()) { foundIdx = i + 1; break; }
       }
       
       var rowData = [data.name, data.cpf, data.role || "", data.sector || "", data.shift || "", data.company || "", data.faceReference || ""];
       if (foundIdx > -1) sheet.getRange(foundIdx, 1, 1, 7).setValues([rowData]);
       else sheet.appendRow(rowData);
       
       return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
    }

    // --- LÓGICA PADRÃO: REGISTRO DE ENTREGA ---
    var sheet = doc.getSheetByName("ENTREGAS") || doc.getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Data", "Hora", "Empresa", "Colaborador", "CPF", "Função", "Turno", "Setor", "Líder", "Coord", "HSE", "Motivo", "EPIs", "Qtd", "Status", "Foto", "PDF", "Visual"]);
    }
    
    var folderFotos = getOrCreateFolder("EPI_FOTOS");
    var linkFoto = "-", visualFoto = "-";
    if (data.facePhoto) {
      var blob = Utilities.newBlob(Utilities.base64Decode(data.facePhoto.split("base64,")[1] || data.facePhoto), "image/jpeg", "BIO_" + data.employeeName + ".jpg");
      var file = folderFotos.createFile(blob);
      linkFoto = file.getUrl();
      visualFoto = '=IMAGE("https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1000"; 1)';
    }

    var items = [], qtds = [];
    if (data.items) {
      var m = {}; data.items.forEach(function(i){ m[i.name] = (m[i.name]||0)+1; });
      for(var k in m){ items.push(k); qtds.push(m[k]); }
    }

    var dt = new Date(data.date);
    sheet.appendRow([
      Utilities.formatDate(dt, "GMT-3", "dd/MM/yyyy"), Utilities.formatDate(dt, "GMT-3", "HH:mm:ss"),
      data.company, data.employeeName, "'" + data.cpf, data.role, data.shift, data.sector, data.teamLeader, data.coordinator, data.hse, data.exchangeReason,
      items.join("\\n"), qtds.join("\\n"), "Sincronizado", linkFoto, data.pdfFile ? "PDF OK" : "-", visualFoto
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", error: e.toString()})).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateFolder(name) {
  var fs = DriveApp.getFoldersByName(name);
  if (fs.hasNext()) return fs.next();
  var f = DriveApp.createFolder(name);
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return f;
}`;

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
  
  const [showScriptHelp, setShowScriptHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setLocalConfig(config);
    if (isOpen) {
        const dataString = JSON.stringify(fullData);
        const bytes = new Blob([dataString]).size;
        const usedKB = bytes / 1024;
        setStorageUsage({ used: usedKB, percent: Math.min((usedKB / 10240) * 100, 100) });
    }
  }, [config, isOpen, fullData]);

  const handleSyncFromSheets = async () => {
    if (!localConfig.googleSheetsUrl) return;
    setIsSyncing(true);
    setSyncResult('idle');
    try {
      const response = await fetch(localConfig.googleSheetsUrl);
      const data = await response.json();
      
      if (data.collaborators || data.catalog) {
        const mergedData = {
          ...fullData,
          collaborators: data.collaborators.length > 0 ? data.collaborators : fullData.collaborators,
          catalog: data.catalog.length > 0 ? data.catalog : fullData.catalog
        };
        onImportData(mergedData);
        setSyncResult('success');
        setTimeout(() => setSyncResult('idle'), 4000);
      } else {
        setSyncResult('error');
      }
    } catch (e) {
      setSyncResult('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-dark-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-dark-800 animate-in fade-in zoom-in duration-200 flex flex-col my-auto max-h-[90vh]">
        <div className="bg-dark-900 px-6 py-4 border-b border-dark-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-bold text-white">Configurações e Nuvem</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2"><X className="w-6 h-6" /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 flex-1 custom-scrollbar">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-zinc-200 font-semibold border-b border-dark-800 pb-2">
                    <DownloadCloud className="w-5 h-5 text-brand-500" />
                    <h4>Sincronização de Dados (Excel para App)</h4>
                </div>
                
                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-4">
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Crie as abas <b>COLABORADORES</b> e <b>CATALOGO</b> no Excel. Ao clicar abaixo, o app busca os nomes e EPIs que você cadastrou na planilha.
                    </p>
                    
                    <button 
                        onClick={handleSyncFromSheets}
                        disabled={!localConfig.googleSheetsUrl || isSyncing}
                        className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:bg-dark-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                    >
                        {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        {isSyncing ? "Buscando Dados..." : "Sincronizar Agora (Tudo)"}
                    </button>

                    {syncResult === 'success' && (
                        <div className="flex items-center gap-2 text-emerald-400 text-xs justify-center bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                            <CheckCircle className="w-4 h-4" /> App atualizado com sucesso!
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-dark-800 pb-2">
                    <div className="flex items-center gap-2 text-zinc-200 font-semibold">
                        <Sheet className="w-5 h-5 text-green-500" />
                        <h4>Script do Google</h4>
                    </div>
                    <button onClick={() => setShowScriptHelp(!showScriptHelp)} className="text-xs text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
                        {showScriptHelp ? 'Ocultar Tutorial' : 'Ver Script Atualizado'}
                    </button>
                </div>

                {showScriptHelp && (
                    <div className="bg-dark-950 border border-dark-700 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2">
                        <p className="text-xs text-zinc-300">
                           Substitua o código no seu <b>Apps Script</b> pelo abaixo para habilitar a sincronização de cadastros.
                        </p>
                        <div className="relative group">
                            <pre className="bg-dark-900 border border-dark-800 p-3 rounded-lg text-[10px] text-zinc-500 font-mono overflow-x-auto max-h-40">
                                {GOOGLE_SCRIPT_CODE}
                            </pre>
                            <button onClick={handleCopyScript} className="absolute top-2 right-2 p-2 bg-dark-800 text-white rounded-md">
                                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-dark-950 p-4 rounded-xl border border-dark-800 space-y-3">
                     <label className="text-sm font-medium text-zinc-400 block">URL da Planilha</label>
                     <div className="relative">
                         <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                         <input 
                            type="text"
                            value={localConfig.googleSheetsUrl || ''}
                            onChange={(e) => setLocalConfig({...localConfig, googleSheetsUrl: e.target.value})}
                            className="w-full pl-10 pr-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:ring-1 focus:ring-green-500 outline-none"
                            placeholder="https://script.google.com/..."
                         />
                     </div>
                </div>
            </div>
              
            <button 
                onClick={() => { onSaveConfig(localConfig); onClose(); }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                <Save className="w-5 h-5" /> Salvar Configurações
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;