import React from 'react';
import { Terminal, X, CheckCircle2, AlertCircle, RefreshCw, Cpu, ShieldCheck } from 'lucide-react';
import type { CodexStatusInfo } from '../types';

interface CodexStatusModalProps {
  isOpen: boolean;
  status: CodexStatusInfo | null;
  isLoading: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const CodexStatusModal: React.FC<CodexStatusModalProps> = ({
  isOpen,
  status,
  isLoading,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-emerald-500/20 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Motor de IA Local (Codex CLI)</h3>
            <p className="text-xs text-slate-400">Análisis local de diagramas unifilares 100% privado y sin APIs externas en la nube</p>

          </div>
        </div>

        {/* Estado actual de Codex */}
        <div className="space-y-3 mb-5">
          <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
            status?.found
              ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
              : 'bg-amber-950/30 border-amber-800/80 text-amber-200'
          }`}>
            {status?.found ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs space-y-1">
              <div className="font-bold text-slate-100 flex items-center justify-between">
                <span>{status?.found ? 'Codex CLI Local Conectado' : 'Codex CLI No Detectado'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800">
                  {status?.version || 'N/A'}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {status?.message || 'Verificando instalación local de Codex...'}
              </p>
              {status?.path && (
                <div className="mt-2 pt-2 border-t border-slate-800/60 font-mono text-[10px] text-slate-400 break-all">
                  Ruta: <span className="text-emerald-300">{status.path}</span>
                </div>
              )}
            </div>
          </div>

          {/* Características de Privacidad y Ejecución */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Ejecución Local Soberana</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              El análisis eléctrico se realiza directamente en tu máquina ejecutando el comando <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">codex exec -i &lt;imagen&gt;</code>. Ningún diagrama o plano es transmitido a servicios de terceros.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Soporte para PDF, PNG, JPG y capturas pegadas con <kbd className="bg-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-200">Ctrl+V</kbd>.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Verificar Estado</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
