import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { MeterPoint, ToolMode, DocType } from '../types';

// Configuración del worker de PDF.js para Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfCanvasViewerProps {
  docType: DocType;
  pdfData: ArrayBuffer | null;
  imageSrc: string | null;
  currentPage: number;
  zoom: number;
  toolMode: ToolMode;
  meters: MeterPoint[];
  selectedMeterId: string | null;
  onSelectMeter: (id: string | null) => void;
  onUpdateMeterPosition: (id: string, newX: number, newY: number) => void;
  onAddMeter: (x: number, y: number) => void;
  onRegisterCapture: (captureFn: () => Promise<Blob | null>) => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  docType,
  pdfData,
  imageSrc,
  currentPage,
  zoom,
  toolMode,
  meters,
  selectedMeterId,
  onSelectMeter,
  onUpdateMeterPosition,
  onAddMeter,
  onRegisterCapture,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [renderScale] = useState<number>(1.5);
  const [isDraggingMarker, setIsDraggingMarker] = useState<boolean>(false);
  const [draggedMarkerId, setDraggedMarkerId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Cargar el documento PDF si el modo es PDF
  useEffect(() => {
    if (docType !== 'pdf' || !pdfData) {
      setPdfDoc(null);
      return;
    }

    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    loadingTask.promise.then(
      (loadedDoc) => {
        setPdfDoc(loadedDoc);
      },
      (error) => {
        console.error('Error al cargar PDF:', error);
      }
    );
  }, [docType, pdfData]);

  // 2. Renderizado en Canvas: Soporte DUAL (PDF vectorial o Imagen / Captura Pegada)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    if (docType === 'image' && imageSrc) {
      // Modo Imagen (archivo cargado o captura pegada con Ctrl+V)
      const img = new Image();
      img.onload = () => {
        // Escalar manteniendo proporción y aplicando zoom
        const baseWidth = Math.min(1600, img.naturalWidth || 1000);
        const ratio = (img.naturalHeight || 800) / (img.naturalWidth || 1000);
        const targetWidth = baseWidth * zoom;
        const targetHeight = targetWidth * ratio;

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        setPageSize({
          width: targetWidth,
          height: targetHeight,
        });

        context.clearRect(0, 0, targetWidth, targetHeight);
        context.drawImage(img, 0, 0, targetWidth, targetHeight);
      };
      img.src = imageSrc;
    } else if (docType === 'pdf' && pdfDoc) {
      // Modo PDF (renderizado vectorial de alta resolución con PDF.js)
      let isMounted = true;

      pdfDoc.getPage(currentPage).then((page) => {
        if (!isMounted) return;

        const effectiveScale = renderScale * zoom;
        const viewport = page.getViewport({ scale: effectiveScale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        setPageSize({
          width: viewport.width,
          height: viewport.height,
        });

        const renderContext = {
          canvas: canvas,
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTask.promise.catch((err) => {
          if (err?.name !== 'RenderingCancelledException') {
            console.error('Error renderizando página PDF:', err);
          }
        });
      });

      return () => {
        isMounted = false;
      };
    }
  }, [docType, imageSrc, pdfDoc, currentPage, zoom, renderScale]);

  // 3. Registrar función para capturar el canvas como Blob PNG (para pasar a Codex CLI)
  const captureCanvasImage = useCallback(async (): Promise<Blob | null> => {
    if (!canvasRef.current) return null;
    return new Promise((resolve) => {
      canvasRef.current?.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }, []);

  useEffect(() => {
    onRegisterCapture(captureCanvasImage);
  }, [captureCanvasImage, onRegisterCapture]);

  // 4. Manejo de Drag & Drop para mover los círculos rojos
  const handleMarkerMouseDown = (e: React.MouseEvent, id: string) => {
    if (toolMode !== 'select') return;
    e.stopPropagation();
    setIsDraggingMarker(true);
    setDraggedMarkerId(id);
    onSelectMeter(id);
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isDraggingMarker && draggedMarkerId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      const relativeX = Math.max(1, Math.min(99, ((clientX - rect.left) / rect.width) * 100));
      const relativeY = Math.max(1, Math.min(99, ((clientY - rect.top) / rect.height) * 100));

      onUpdateMeterPosition(draggedMarkerId, Number(relativeX.toFixed(2)), Number(relativeY.toFixed(2)));
    } else if (isPanning && containerRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      containerRef.current.scrollLeft -= dx;
      containerRef.current.scrollTop -= dy;
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContainerMouseUp = () => {
    setIsDraggingMarker(false);
    setDraggedMarkerId(null);
    setIsPanning(false);
  };

  // 5. Clic sobre el lienzo para añadir medidor o deseleccionar
  const handleSvgClick = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();

    if (toolMode === 'add_meter') {
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;
      onAddMeter(Number(clickX.toFixed(2)), Number(clickY.toFixed(2)));
    } else if (toolMode === 'select') {
      onSelectMeter(null);
    }
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (toolMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const currentMeters = meters.filter((m) => m.page === currentPage);
  const hasContent = (docType === 'pdf' && Boolean(pdfData)) || (docType === 'image' && Boolean(imageSrc));

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseDown={handleContainerMouseDown}
      className={`relative flex-1 bg-slate-950 overflow-auto p-8 flex items-center justify-center select-none ${
        toolMode === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : toolMode === 'add_meter' ? 'cursor-crosshair' : 'cursor-default'
      }`}
    >
      {!hasContent ? (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-md border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
          <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-950/40">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-200 mb-1">Cargar o Pegar Diagrama Unifilar</h2>
          <p className="text-xs text-slate-400 mb-4">
            Puedes cargar un archivo <strong>PDF</strong>, una <strong>Imagen (PNG/JPG)</strong> o simplemente presionar <kbd className="bg-slate-800 border border-slate-700 text-slate-200 px-1.5 py-0.5 rounded font-mono font-bold">Ctrl+V</kbd> con cualquier captura en tu portapapeles.
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
            <span>⚡ Captura en AutoCAD/Bluebeam con Win+Shift+S y pega aquí</span>
          </div>
        </div>
      ) : (
        <div
          className="relative shadow-2xl rounded-sm overflow-hidden bg-white border border-slate-700/60"
          style={{ width: pageSize.width, height: pageSize.height }}
        >
          {/* Canvas base donde se dibuja el PDF o la Imagen */}
          <canvas ref={canvasRef} className="block pointer-events-none" />

          {/* Capa SVG interactiva donde se dibujan los círculos rojos arrastrables */}
          <svg
            ref={svgRef}
            onClick={handleSvgClick}
            className="absolute inset-0 w-full h-full pointer-events-auto"
            style={{ width: pageSize.width, height: pageSize.height }}
          >
            <defs>
              <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ef4444" floodOpacity="0.8" />
              </filter>
              <filter id="glow-gold" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.9" />
              </filter>
            </defs>

            {currentMeters.map((m) => {
              const isMain = m.type === 'main';
              const isSelected = selectedMeterId === m.id;

              const pixelX = (m.x / 100) * pageSize.width;
              const pixelY = (m.y / 100) * pageSize.height;
              const r = m.radius || 16;

              const strokeColor = isMain ? '#f59e0b' : '#ef4444';
              const fillColor = isMain ? 'rgba(245, 158, 11, 0.22)' : 'rgba(239, 68, 68, 0.22)';

              return (
                <g
                  key={m.id}
                  transform={`translate(${pixelX}, ${pixelY})`}
                  onMouseDown={(e) => handleMarkerMouseDown(e, m.id)}
                  className="cursor-move group"
                >
                  {/* Halo de selección */}
                  {isSelected && (
                    <circle
                      r={r + 8}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      className="animate-spin"
                      style={{ animationDuration: '8s', transformOrigin: '0 0' }}
                    />
                  )}

                  {/* Resplandor exterior */}
                  <circle
                    r={r + 3}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={1}
                    opacity={0.4}
                  />

                  {/* Círculo de medición principal (Dona / TC) */}
                  <circle
                    r={r}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3.5 : 2.5}
                    filter={isMain ? 'url(#glow-gold)' : 'url(#glow-red)'}
                    className="transition-transform group-hover:scale-110"
                  />

                  {/* Cruz central (indica el centro exacto del conductor/cable) */}
                  <line x1={-5} y1={0} x2={5} y2={0} stroke={strokeColor} strokeWidth={1.5} />
                  <line x1={0} y1={-5} x2={0} y2={5} stroke={strokeColor} strokeWidth={1.5} />
                  <circle r={1.5} fill={strokeColor} />

                  {/* Etiqueta flotante con ID y Nombre del Circuito */}
                  <g transform={`translate(${r + 6}, ${-r - 6})`}>
                    <rect
                      x={0}
                      y={-14}
                      width={Math.max(65, m.label.length * 7 + 10)}
                      height={20}
                      rx={4}
                      fill="#0f172a"
                      stroke={strokeColor}
                      strokeWidth={1.2}
                      className="shadow-lg"
                    />
                    <text
                      x={6}
                      y={0}
                      fill="#f8fafc"
                      fontSize={10}
                      fontWeight="bold"
                      fontFamily="system-ui, sans-serif"
                    >
                      {m.id}
                      <tspan fill={isMain ? '#fcd34d' : '#fca5a5'} fontWeight="normal" dx={4}>
                        {m.rating_amps ? `${m.rating_amps}A` : isMain ? 'MAIN' : 'SUB'}
                      </tspan>
                    </text>
                  </g>

                  {/* Tooltip con información en hover */}
                  <title>{`${m.label}\nCircuito: ${m.circuit_name || 'Sin especificar'}\nTipo: ${
                    isMain ? 'Acometida Principal (Main)' : 'Subcircuito Derivado 1er Nivel'
                  }\nNorma: ${m.legal_notes || 'Submedición permitida'}\n(Haz clic y arrastra para reubicar)`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
