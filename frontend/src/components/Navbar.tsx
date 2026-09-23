import React from 'react';
import { Zap, Upload, Terminal, FileText, Image as ImageIcon, CheckCircle2, AlertCircle, Clipboard } from 'lucide-react';
import type { DocType, CodexStatusInfo } from '../types';

interface NavbarProps {
  fileName: string | null;
  docType: DocType;
  pageCount: number;
  currentPage: number;
  totalMeters: number;
  codexStatus: CodexStatusInfo | null;
  onUploadClick: () => void;
  onOpenCodexModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  fileName,
  docType,
  pageCount,
  currentPage,
  totalMeters,
  codexStatus,
  onUploadClick,
  onOpenCodexModal,
}) => {
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none z-30">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-br from-amber-500 to-red-600 p-2 rounded-lg text-white shadow-lg shadow-red-900/30">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-100 tracking-tight">
              ElectroSubmeter <span className="text-emerald-400 font-extrabold">Codex</span>
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded flex items-center space-x-1">
              <Terminal className="w-2.5 h-2.5 inline" />
              <span>Local AI</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Marcado de unifilares en PDF, imágenes y capturas (Ctrl+V)
          </p>
        </div>
      </div>

      {/* File & Status Indicators */}
      <div className="flex items-center space-x-3">
        {/* Clipboard Tip */}
        <div className="hidden lg:flex items-center space-x-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] text-slate-400">
          <Clipboard className="w-3.5 h-3.5 text-amber-400" />
          <span>Pega con <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-200 font-mono text-[10px] font-bold">Ctrl+V</kbd></span>
        </div>

        {fileName ? (
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs">
            {docType === 'pdf' ? (
              <FileText className="w-4 h-4 text-amber-400" />
            ) : (
              <ImageIcon className="w-4 h-4 text-sky-400" />
            )}
            <span className="font-medium text-slate-200 max-w-[180px] truncate" title={fileName}>
              {fileName}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              {docType === 'pdf' ? `Pág. ${currentPage} de ${pageCount}` : 'Imagen'}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-red-400 font-semibold">
              {totalMeters} {totalMeters === 1 ? 'medidor' : 'medidores'}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Ningún plano cargado</span>
        )}

        {/* Upload Button */}
        <button
          onClick={onUploadClick}
          className="flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Cargar PDF o Imagen</span>
        </button>

        {/* Codex CLI local status button */}
        <button
          onClick={onOpenCodexModal}
          className={`flex items-center space-x-1.5 border text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            codexStatus?.found
              ? 'bg-slate-900 border-emerald-700/70 text-emerald-300 hover:border-emerald-500'
              : 'bg-slate-900 border-amber-800/80 text-amber-300 hover:border-amber-600'
          }`}
          title="Ver estado de OpenAI Codex CLI Local"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{codexStatus?.found ? 'Codex CLI Local' : 'Codex CLI'}</span>
          {codexStatus?.found ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 ml-0.5" />
          )}
        </button>
      </div>
    </header>
  );
};
