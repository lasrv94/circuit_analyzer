import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  MousePointer,
  PlusCircle,
  Terminal,
  Download,
  Image as ImageIcon,
  FileSpreadsheet,
  Trash2,
  RotateCcw
} from 'lucide-react';
import type { ToolMode, DocType } from '../types';

interface ToolbarProps {
  docType: DocType;
  currentPage: number;
  totalPages: number;
  zoom: number;
  toolMode: ToolMode;
  isAnalyzing: boolean;
  selectedMeterId: string | null;
  hasMarkersOnPage: boolean;
  hasDocument: boolean;
  onPageChange: (newPage: number) => void;
  onZoomChange: (newZoom: number) => void;
  onToolModeChange: (mode: ToolMode) => void;
  onAnalyzeClick: () => void;
  onExportPdfClick: () => void;
  onExportImageClick: () => void;
  onExportCsvClick: () => void;
  onDeleteSelectedMeter: () => void;
  onClearPageMeters: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  docType,
  currentPage,
  totalPages,
  zoom,
  toolMode,
  isAnalyzing,
  selectedMeterId,
  hasMarkersOnPage,
  hasDocument,
  onPageChange,
  onZoomChange,
  onToolModeChange,
  onAnalyzeClick,
  onExportPdfClick,
  onExportImageClick,
  onExportCsvClick,
  onDeleteSelectedMeter,
  onClearPageMeters,
}) => {
  return (
    <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs select-none z-20">
      {/* Left: Page Navigator (solo si es PDF) y Zoom */}
      <div className="flex items-center space-x-2">
        {docType === 'pdf' ? (
          <>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || totalPages <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors cursor-pointer"
              title="Página Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 font-medium">
              <span>Pág.</span>
              <select
                value={currentPage}
                onChange={(e) => onPageChange(Number(e.target.value))}
                className="bg-transparent text-amber-400 font-semibold focus:outline-none cursor-pointer"
              >
                {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((pg) => (
                  <option key={pg} value={pg} className="bg-slate-900 text-slate-200">
                    {pg}
                  </option>
                ))}
              </select>
              <span className="text-slate-500">/ {totalPages || 1}</span>
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || totalPages <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition-colors cursor-pointer"
              title="Página Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-sky-400 font-semibold text-[11px]">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Imagen (Vista Única)</span>
          </div>
        )}

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Zoom Controls */}
        <button
          onClick={() => onZoomChange(Math.max(0.3, zoom - 0.2))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          title="Reducir Zoom (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => onZoomChange(1.0)}
          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] hover:text-amber-400 transition-colors cursor-pointer"
          title="Restablecer a 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={() => onZoomChange(Math.min(3.5, zoom + 0.2))}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          title="Aumentar Zoom (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => onZoomChange(1.2)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          title="Ajustar Tamaño Estándar"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Canvas Interaction Modes */}
      <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => onToolModeChange('select')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            toolMode === 'select'
              ? 'bg-red-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Modo Selección: Haz clic y arrastra cualquier círculo rojo para reubicarlo"
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>Mover / Seleccionar</span>
        </button>

        <button
          onClick={() => onToolModeChange('add_meter')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            toolMode === 'add_meter'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Añadir Medidor: Haz clic en cualquier lugar del plano para colocar un nuevo círculo"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Añadir Medidor</span>
        </button>

        <button
          onClick={() => onToolModeChange('pan')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
            toolMode === 'pan'
              ? 'bg-slate-700 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Mover Plano (Pan): Arrastra el fondo para desplazarte"
        >
          <Move className="w-3.5 h-3.5" />
          <span>Pan</span>
        </button>
      </div>

      {/* Right: AI & Export Actions */}
      <div className="flex items-center space-x-2">
        {selectedMeterId && (
          <button
            onClick={onDeleteSelectedMeter}
            className="flex items-center space-x-1 px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg transition-colors cursor-pointer"
            title="Eliminar medidor seleccionado"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        )}

        {hasMarkersOnPage && (
          <button
            onClick={onClearPageMeters}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Limpiar medidores de esta página"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Local Codex AI Analysis Button */}
        <button
          onClick={onAnalyzeClick}
          disabled={isAnalyzing || !hasDocument}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-semibold text-white transition-all shadow-md cursor-pointer ${
            isAnalyzing
              ? 'bg-emerald-600/70 cursor-wait animate-pulse'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-emerald-900/30'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
          title="Detecta automáticamente el Interruptor Principal y Subcircuitos de 1er nivel usando Codex CLI local"
        >
          <Terminal className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analizando con Codex...' : '⚡ Analizar con Codex CLI'}</span>
        </button>

        {/* Export Buttons */}
        <button
          onClick={onExportImageClick}
          disabled={!hasMarkersOnPage}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Descargar imagen (PNG) con los círculos rojos estampados"
        >
          <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
          <span>Exportar PNG</span>
        </button>

        <button
          onClick={onExportPdfClick}
          disabled={!hasMarkersOnPage}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Descargar PDF con los círculos rojos estampados vectorialmente"
        >
          <Download className="w-3.5 h-3.5 text-red-400" />
          <span>Exportar PDF</span>
        </button>

        <button
          onClick={onExportCsvClick}
          disabled={!hasMarkersOnPage}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Exportar Tabla de Medidores (CSV/Excel)"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
