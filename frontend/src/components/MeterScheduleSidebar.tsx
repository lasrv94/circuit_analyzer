import React, { useState } from 'react';
import {
  ListFilter,
  ShieldCheck,
  Zap,
  Trash2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  Copy,
  Plus
} from 'lucide-react';
import type { MeterPoint } from '../types';


interface MeterScheduleSidebarProps {
  currentPage: number;
  meters: MeterPoint[];
  selectedMeterId: string | null;
  onSelectMeter: (id: string | null) => void;
  onUpdateMeter: (id: string, updatedFields: Partial<MeterPoint>) => void;
  onDeleteMeter: (id: string) => void;
  onAddNewMeterManually: (type: 'main' | 'subcircuit') => void;
}

export const MeterScheduleSidebar: React.FC<MeterScheduleSidebarProps> = ({
  currentPage,
  meters,
  selectedMeterId,
  onSelectMeter,
  onUpdateMeter,
  onDeleteMeter,
  onAddNewMeterManually,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'compliance'>('schedule');
  const [copied, setCopied] = useState(false);

  const pageMeters = meters.filter((m) => m.page === currentPage);
  const mainMeters = pageMeters.filter((m) => m.type === 'main');
  const subMeters = pageMeters.filter((m) => m.type === 'subcircuit');

  const selectedMeter = meters.find((m) => m.id === selectedMeterId);

  const handleCopySummary = () => {
    const lines = pageMeters.map(
      (m) => `${m.id}\t${m.type.toUpperCase()}\t${m.circuit_name || m.label}\t${m.rating_amps || 'N/A'}A\tX:${m.x}% Y:${m.y}%`
    );
    const header = "ID\tTIPO\tCIRCUITO\tCAPACIDAD\tCOORDENADAS\n";
    navigator.clipboard.writeText(header + lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside className="w-84 bg-slate-950 border-l border-slate-800 flex flex-col h-full select-none z-10 text-xs">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 space-x-1">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-slate-800 text-slate-100 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5 text-red-400" />
          <span>Medidores ({pageMeters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'compliance'
              ? 'bg-slate-800 text-slate-100 shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Normativa & Ley</span>
        </button>
      </div>

      {activeTab === 'schedule' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Row */}
          <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-slate-300">Puntos de Medición (Pág. {currentPage})</span>
            <div className="flex space-x-1.5">
              <button
                onClick={handleCopySummary}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copiar tabla al portapapeles"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onAddNewMeterManually('subcircuit')}
                className="flex items-center space-x-1 px-2 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white font-semibold transition-colors"
                title="Agregar nuevo medidor"
              >
                <Plus className="w-3 h-3" />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {/* List of Meters */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {pageMeters.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Zap className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p>No hay medidores en esta página.</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Usa "⚡ Analizar con IA" o añade uno manualmente.
                </p>
              </div>
            ) : (
              <>
                {/* Main Breakers Section */}
                {mainMeters.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>Acometida Principal (MAIN)</span>
                    </div>
                    {mainMeters.map((meter) => (
                      <MeterCard
                        key={meter.id}
                        meter={meter}
                        isSelected={selectedMeterId === meter.id}
                        onSelect={() => onSelectMeter(meter.id)}
                        onUpdate={(fields) => onUpdateMeter(meter.id, fields)}
                        onDelete={() => onDeleteMeter(meter.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Subcircuits Section */}
                {subMeters.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1.5 flex items-center space-x-1 mt-3">
                      <span>⚡ Primeros Subcircuitos Derivados ({subMeters.length})</span>
                    </div>
                    {subMeters.map((meter) => (
                      <MeterCard
                        key={meter.id}
                        meter={meter}
                        isSelected={selectedMeterId === meter.id}
                        onSelect={() => onSelectMeter(meter.id)}
                        onUpdate={(fields) => onUpdateMeter(meter.id, fields)}
                        onDelete={() => onDeleteMeter(meter.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Selected Item Editor Footer */}
          {selectedMeter && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">Ajuste de Círculo ({selectedMeter.id})</span>
                <span className="font-mono text-[10px] text-slate-400">
                  X: {selectedMeter.x}% | Y: {selectedMeter.y}%
                </span>
              </div>

              {/* Radius slider */}
              <div className="flex items-center space-x-2">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400 w-12">Tamaño:</span>
                <input
                  type="range"
                  min="8"
                  max="40"
                  value={selectedMeter.radius}
                  onChange={(e) => onUpdateMeter(selectedMeter.id, { radius: Number(e.target.value) })}
                  className="flex-1 accent-red-500 cursor-pointer"
                />
                <span className="font-mono text-[10px] text-slate-300 w-6 text-right">
                  {selectedMeter.radius}px
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tab: Compliance & Electrical Code Guidelines */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-300">
          <div className="bg-amber-950/40 border border-amber-800/80 p-3 rounded-xl space-y-1.5">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <Info className="w-4 h-4" />
              <span>Regla: Siempre que la ley lo permita</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              En sistemas de submedición eléctrica (normas NEC / NFPA 70, NOM-001, RETIE, IEC):
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <h4 className="font-bold text-slate-100 flex items-center space-x-1 text-[11px] mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block mr-1"></span>
                Medición en Acometida Principal (MAIN)
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Las donas o TCs deben instalarse en los <strong>conductores de salida</strong> del interruptor general o llegada a la barra principal.
                <strong> Nunca intervenir</strong> antes del medidor de la compañía suministradora ni violar precintos de seguridad.
              </p>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <h4 className="font-bold text-slate-100 flex items-center space-x-1 text-[11px] mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-1"></span>
                Primeros Subcircuitos Derivados (1st Tier)
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Se mide cada alimentador primario directo de la barra general hacia centros de carga derivados (Fuerza, Chillers, Alumbrado).
                Esto permite la desagregación del 100% de la energía consumida sin duplicar mediciones aguas abajo.
              </p>
            </div>

            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
              <h4 className="font-bold text-slate-100 flex items-center space-x-1 text-[11px] mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1"></span>
                Espacio Físico y Seguridad
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Verificar holgura según NEC Art. 110.26 y espacio en canalizaciones según factor de relleno antes de instalar donas de núcleo partido o Rogowski.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

// Subcomponente de Tarjeta de Medidor individual
interface MeterCardProps {
  meter: MeterPoint;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (fields: Partial<MeterPoint>) => void;
  onDelete: () => void;
}

const MeterCard: React.FC<MeterCardProps> = ({
  meter,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isMain = meter.type === 'main';

  return (
    <div
      onClick={onSelect}
      className={`p-2.5 rounded-lg border transition-all mb-2 cursor-pointer ${
        isSelected
          ? 'bg-slate-900 border-sky-500 shadow-md shadow-sky-950/40 ring-1 ring-sky-500'
          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isMain ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-red-500 shadow-sm shadow-red-500'
            }`}
          />
          <span className="font-bold text-slate-200">{meter.id}</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
              isMain ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-red-950 text-red-300 border border-red-800'
            }`}
          >
            {isMain ? 'Main' : 'Sub'}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-slate-500 hover:text-red-400 transition-colors"
            title="Eliminar medidor"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-1 text-slate-300 font-medium truncate" title={meter.circuit_name || meter.label}>
        {meter.circuit_name || meter.label}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
        <span>Capacidad: <strong className="text-slate-300">{meter.rating_amps ? `${meter.rating_amps}A` : 'Auto'}</strong></span>
        <span>Pos: ({meter.x}%, {meter.y}%)</span>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-slate-800 space-y-2 text-[11px]" onClick={(e) => e.stopPropagation()}>
          <div>
            <label className="block text-slate-400 mb-0.5">Nombre del Circuito:</label>
            <input
              type="text"
              value={meter.circuit_name}
              onChange={(e) => onUpdate({ circuit_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 mb-0.5">Tipo:</label>
              <select
                value={meter.type}
                onChange={(e) => onUpdate({ type: e.target.value as 'main' | 'subcircuit' })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value="main">Main (General)</option>
                <option value="subcircuit">Subcircuito (1er Nivel)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-0.5">Capacidad (Amps):</label>
              <input
                type="number"
                value={meter.rating_amps || ''}
                onChange={(e) => onUpdate({ rating_amps: Number(e.target.value) || undefined })}
                placeholder="Ej. 200"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
