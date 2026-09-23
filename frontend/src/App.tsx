import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { PdfCanvasViewer } from './components/PdfCanvasViewer';
import { MeterScheduleSidebar } from './components/MeterScheduleSidebar';
import { CodexStatusModal } from './components/CodexStatusModal';
import type { MeterPoint, ToolMode, AnalysisResponse, DocType, CodexStatusInfo } from './types';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

export const App: React.FC = () => {
  const [docType, setDocType] = useState<DocType>('pdf');
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [serverFilename, setServerFilename] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [toolMode, setToolMode] = useState<ToolMode>('select');

  const [meters, setMeters] = useState<MeterPoint[]>([]);
  const [selectedMeterId, setSelectedMeterId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const [codexStatus, setCodexStatus] = useState<CodexStatusInfo | null>(null);
  const [isCodexModalOpen, setIsCodexModalOpen] = useState<boolean>(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);

  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'info' | 'error';
    message: string;
  } | null>(null);

  const captureFnRef = useRef<(() => Promise<Blob | null>) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'warning' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 6000);
  };

  // Consultar estado de Codex CLI local
  const fetchCodexStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/codex-status');
      if (res.ok) {
        const data: CodexStatusInfo = await res.json();
        setCodexStatus(data);
      }
    } catch (err) {
      console.warn('No se pudo consultar estado de Codex CLI:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchCodexStatus();
  }, [fetchCodexStatus]);

  // Manejo de carga de archivos (PDF o Imagen)
  const handleFileUpload = async (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isPdf = ext === '.pdf';
    const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.bmp'].includes(ext);

    if (!isPdf && !isImage) {
      showNotification('error', 'Formato no compatible. Carga un archivo PDF o imagen (PNG, JPG, WEBP).');
      return;
    }

    try {
      setFileName(file.name);
      setCurrentPage(1);

      if (isPdf) {
        setDocType('pdf');
        setImageSrc(null);
        const arrayBuffer = await file.arrayBuffer();
        setPdfData(arrayBuffer);

        const loadedDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setTotalPages(loadedDoc.numPages);
      } else {
        setDocType('image');
        setPdfData(null);
        setTotalPages(1);

        const reader = new FileReader();
        reader.onload = (e) => {
          setImageSrc(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Sincronizar con el backend
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setServerFilename(data.filename);
        }
      } catch (err) {
        console.warn('Backend local en proceso de sincronización:', err);
      }

      showNotification('success', `"${file.name}" cargado exitosamente.`);
    } catch (err) {
      console.error('Error al cargar archivo:', err);
      showNotification('error', 'Error al procesar el archivo seleccionado.');
    }
  };

  // Cargar imagen generada desde el portapapeles (Ctrl+V)
  const handlePastedImage = async (blob: File | Blob) => {
    const timeStr = new Date().toLocaleTimeString().replace(/:/g, '-');
    const autoName = `Captura_Portapapeles_${timeStr}.png`;
    setFileName(autoName);
    setDocType('image');
    setPdfData(null);
    setCurrentPage(1);
    setTotalPages(1);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(blob);

    // Subir imagen pegada al servidor
    const file = new File([blob], autoName, { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setServerFilename(data.filename);
      }
    } catch (err) {
      console.warn('Backend local en proceso de sincronización:', err);
    }

    showNotification('success', '¡Captura de pantalla pegada desde el portapapeles! Lista para marcar y analizar.');
  };

  // Listener global para Ctrl+V (Portapapeles)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            handlePastedImage(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Manejo de Drag and Drop en ventana
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Modificar posición de un medidor (arrastrar y soltar)
  const handleUpdateMeterPosition = (id: string, newX: number, newY: number) => {
    setMeters((prev) =>
      prev.map((m) => (m.id === id ? { ...m, x: newX, y: newY } : m))
    );
  };

  // Añadir medidor manualmente al hacer clic en el plano
  const handleAddMeterAtPosition = (x: number, y: number) => {
    const pageMeters = meters.filter((m) => m.page === currentPage);
    const hasMainOnPage = pageMeters.some((m) => m.type === 'main');
    
    const type: 'main' | 'subcircuit' = hasMainOnPage ? 'subcircuit' : 'main';
    const subCount = pageMeters.filter((m) => m.type === 'subcircuit').length + 1;
    const newId = type === 'main' ? `M-0${pageMeters.filter(m => m.type === 'main').length + 1}` : `S-${subCount < 10 ? '0' : ''}${subCount}`;

    const newMeter: MeterPoint = {
      id: newId,
      label: type === 'main' ? `${newId}: Main` : `${newId}: Subcircuito`,
      circuit_name: type === 'main' ? 'Interruptor Principal' : `Alimentador Derivado ${subCount}`,
      type: type,
      x: x,
      y: y,
      radius: 16.0,
      rating_amps: type === 'main' ? 400 : 150,
      confidence: 1.0,
      legal_notes: 'Punto agregado manualmente por el proyectista.',
      page: currentPage,
    };

    setMeters((prev) => [...prev, newMeter]);
    setSelectedMeterId(newMeter.id);
    setToolMode('select');
    showNotification('info', `Medidor ${newId} agregado. Puedes moverlo arrastrándolo.`);
  };

  const handleAddNewMeterManually = (suggestedType: 'main' | 'subcircuit') => {
    const pageMeters = meters.filter((m) => m.page === currentPage);
    const count = pageMeters.filter((m) => m.type === suggestedType).length + 1;
    const newId = suggestedType === 'main' ? `M-0${count}` : `S-${count < 10 ? '0' : ''}${count}`;

    const newMeter: MeterPoint = {
      id: newId,
      label: suggestedType === 'main' ? `${newId}: Main` : `${newId}: Subcircuito`,
      circuit_name: suggestedType === 'main' ? 'Interruptor Principal' : `Alimentador Derivado ${count}`,
      type: suggestedType,
      x: 50.0,
      y: 50.0,
      radius: 16.0,
      rating_amps: suggestedType === 'main' ? 400 : 150,
      confidence: 1.0,
      legal_notes: 'Punto agregado manualmente por el proyectista.',
      page: currentPage,
    };

    setMeters((prev) => [...prev, newMeter]);
    setSelectedMeterId(newMeter.id);
    showNotification('info', `Medidor ${newId} colocado al centro. Arrástralo a su posición.`);
  };

  const handleUpdateMeter = (id: string, fields: Partial<MeterPoint>) => {
    setMeters((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...fields } : m))
    );
  };

  const handleDeleteMeter = (id: string) => {
    setMeters((prev) => prev.filter((m) => m.id !== id));
    if (selectedMeterId === id) setSelectedMeterId(null);
  };

  const handleClearPageMeters = () => {
    if (window.confirm(`¿Seguro que deseas eliminar todos los medidores de la página ${currentPage}?`)) {
      setMeters((prev) => prev.filter((m) => m.page !== currentPage));
      setSelectedMeterId(null);
    }
  };

  // Análisis con OpenAI Codex CLI Local
  const handleAnalyzePage = async () => {
    if (!captureFnRef.current) {
      showNotification('error', 'El visor de planos no está listo.');
      return;
    }

    setIsAnalyzing(true);
    showNotification('info', `Ejecutando análisis topológico local con Codex CLI...`);

    try {
      const imageBlob = await captureFnRef.current();
      if (!imageBlob) {
        throw new Error('No se pudo capturar la imagen del plano.');
      }

      const formData = new FormData();
      formData.append('page', currentPage.toString());
      if (serverFilename) formData.append('filename', serverFilename);
      formData.append('image', imageBlob, `analysis_${currentPage}.png`);

      const res = await fetch('/api/analyze-page', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error en la respuesta del servidor');
      }

      const data: AnalysisResponse = await res.json();
      
      setMeters((prev) => {
        const otherPages = prev.filter((m) => m.page !== currentPage);
        return [...otherPages, ...data.points];
      });

      if (data.points.length > 0) {
        setSelectedMeterId(data.points[0].id);
        const mainCount = data.points.filter((p) => p.type === 'main').length;
        const subCount = data.points.filter((p) => p.type === 'subcircuit').length;
        showNotification(
          'success',
          `¡Detección completada con Codex! ${mainCount} Main y ${subCount} Subcircuitos identificados. Puedes mover cualquier círculo si es necesario.`
        );
      } else {
        showNotification('warning', 'Codex no detectó nuevos interruptores. Puedes agregarlos con "+ Añadir Medidor".');
      }
    } catch (err: any) {
      console.error('Error durante análisis con Codex:', err);
      showNotification('error', `Error al analizar con Codex CLI: ${err.message || err}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Exportar Imagen anotada (PNG)
  const handleExportImage = async () => {
    if (!serverFilename) {
      showNotification('warning', 'El archivo no está sincronizado con el backend.');
      return;
    }

    try {
      showNotification('info', 'Generando imagen PNG anotada...');
      const formData = new FormData();
      formData.append('filename', serverFilename);
      formData.append('annotations_json', JSON.stringify(meters));

      const res = await fetch('/api/export-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Error al generar la imagen anotada');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marcado_${fileName?.replace(/\.[^/.]+$/, '') || 'unifilar'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification('success', 'Imagen anotada descargada exitosamente en PNG.');
    } catch (err: any) {
      console.error('Error exportando imagen:', err);
      showNotification('error', 'No se pudo exportar la imagen.');
    }
  };

  // Exportar PDF con marcas vectoriales estampadas
  const handleExportPdf = async () => {
    if (!serverFilename) {
      showNotification('warning', 'El archivo no está sincronizado con el backend.');
      return;
    }

    try {
      showNotification('info', 'Generando documento PDF con marcas vectoriales...');
      const formData = new FormData();
      formData.append('filename', serverFilename);
      formData.append('annotations_json', JSON.stringify(meters));

      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Error al generar el PDF exportado');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submedicion_${fileName?.replace(/\.[^/.]+$/, '') || 'diagrama'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification('success', 'Documento PDF marcado descargado exitosamente.');
    } catch (err: any) {
      console.error('Error exportando PDF:', err);
      showNotification('error', 'No se pudo exportar el PDF.');
    }
  };

  // Exportar cuadro de medidores en CSV / Excel
  const handleExportCsv = () => {
    if (meters.length === 0) {
      showNotification('warning', 'No hay medidores para exportar.');
      return;
    }

    const headers = ['ID', 'Página', 'Tipo', 'Etiqueta', 'Nombre del Circuito', 'Capacidad (Amps)', 'Posición X (%)', 'Posición Y (%)', 'Normativa / Notas'];
    const rows = meters.map((m) => [
      `"${m.id}"`,
      m.page,
      `"${m.type.toUpperCase()}"`,
      `"${m.label}"`,
      `"${m.circuit_name}"`,
      m.rating_amps || '',
      m.x,
      m.y,
      `"${m.legal_notes || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuadro_submedicion_${fileName?.replace(/\.[^/.]+$/, '') || 'unifilar'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showNotification('success', 'Cuadro de medidores exportado en CSV.');
  };

  const currentPageMeters = meters.filter((m) => m.page === currentPage);
  const hasDocument = Boolean(pdfData || imageSrc);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans"
    >
      {/* Input de archivo universal (PDF o Imágenes) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp,image/bmp"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Navbar Superior */}
      <Navbar
        fileName={fileName}
        docType={docType}
        pageCount={totalPages}
        currentPage={currentPage}
        totalMeters={meters.length}
        codexStatus={codexStatus}
        onUploadClick={() => fileInputRef.current?.click()}
        onOpenCodexModal={() => setIsCodexModalOpen(true)}
      />

      {/* Barra de herramientas */}
      <Toolbar
        docType={docType}
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        toolMode={toolMode}
        isAnalyzing={isAnalyzing}
        selectedMeterId={selectedMeterId}
        hasMarkersOnPage={currentPageMeters.length > 0}
        hasDocument={hasDocument}
        onPageChange={(pg) => {
          setCurrentPage(pg);
          setSelectedMeterId(null);
        }}
        onZoomChange={setZoom}
        onToolModeChange={setToolMode}
        onAnalyzeClick={handleAnalyzePage}
        onExportPdfClick={handleExportPdf}
        onExportImageClick={handleExportImage}
        onExportCsvClick={handleExportCsv}
        onDeleteSelectedMeter={() => selectedMeterId && handleDeleteMeter(selectedMeterId)}
        onClearPageMeters={handleClearPageMeters}
      />

      {/* Área Central de Trabajo: Visor Universal + Panel Lateral */}
      <div className="flex-1 flex overflow-hidden relative">
        <PdfCanvasViewer
          docType={docType}
          pdfData={pdfData}
          imageSrc={imageSrc}
          currentPage={currentPage}
          zoom={zoom}
          toolMode={toolMode}
          meters={meters}
          selectedMeterId={selectedMeterId}
          onSelectMeter={setSelectedMeterId}
          onUpdateMeterPosition={handleUpdateMeterPosition}
          onAddMeter={handleAddMeterAtPosition}
          onRegisterCapture={(fn) => {
            captureFnRef.current = fn;
          }}
        />

        {/* Panel lateral con el cuadro de medidores y normativas */}
        <MeterScheduleSidebar
          currentPage={currentPage}
          meters={meters}
          selectedMeterId={selectedMeterId}
          onSelectMeter={setSelectedMeterId}
          onUpdateMeter={handleUpdateMeter}
          onDeleteMeter={handleDeleteMeter}
          onAddNewMeterManually={handleAddNewMeterManually}
        />
      </div>

      {/* Notificaciones Flotantes */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-2 fade-in">
          <div
            className={`p-3.5 rounded-xl shadow-2xl border flex items-start space-x-3 text-xs ${
              notification.type === 'success'
                ? 'bg-slate-900 border-emerald-600 text-emerald-200'
                : notification.type === 'warning'
                ? 'bg-slate-900 border-amber-600 text-amber-200'
                : notification.type === 'error'
                ? 'bg-slate-900 border-red-600 text-red-200'
                : 'bg-slate-900 border-sky-600 text-sky-200'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
            <span className="flex-1 leading-relaxed">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de estado de Codex CLI Local */}
      <CodexStatusModal
        isOpen={isCodexModalOpen}
        status={codexStatus}
        isLoading={isLoadingStatus}
        onClose={() => setIsCodexModalOpen(false)}
        onRefresh={fetchCodexStatus}
      />
    </div>
  );
};

export default App;
