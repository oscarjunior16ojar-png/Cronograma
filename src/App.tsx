/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Download,
  Calendar,
  Clock,
  Wrench,
  Users,
  AlertTriangle,
  Layers,
  ListChecks,
  Briefcase,
  FileCode,
  FileSpreadsheet,
  RefreshCw,
  Gauge,
  Sparkles,
  Search,
  Plus,
  Minus,
  CheckCircle,
  HelpCircle,
  Info,
  Sliders,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import {
  Task,
  Part,
  Resource,
  BuilderProfile,
  LEGO_PARTS,
  INITIAL_RESOURCES,
  REFRESH_TASKS,
  generateMSPXML,
  generateCSV
} from "./types";

export default function App() {
  // Setup primary states
  const [profile, setProfile] = useState<BuilderProfile>({
    startDate: "2026-05-23",
    startTime: "08:00",
    speedMultiplier: 1.0,
    builderLevel: "Intermediate",
    dailyHoursLimit: 24, // 24 = Continuous Sprint
    workOnWeekends: true
  });

  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [parts, setParts] = useState<Part[]>(LEGO_PARTS);
  const [activeTab, setActiveTab] = useState<"gantt" | "grid" | "xml" | "how-to">("gantt");
  const [selectedPhase, setSelectedPhase] = useState<string>("Todas");
  const [partsSearch, setPartsSearch] = useState<string>("");
  const [activeInstructionStep, setActiveInstructionStep] = useState<number | null>(null);

  // Derive final schedule tasks based on the builder parameters
  const calculatedTasks = useMemo(() => {
    return REFRESH_TASKS(profile);
  }, [profile]);

  // Identify which parts have shortages and identify affected task IDs
  const missingPartsMap = useMemo(() => {
    const missing: Record<string, boolean> = {};
    parts.forEach((p) => {
      if (p.quantityHave < p.quantityNeeded) {
        missing[p.id] = true;
      }
    });
    return missing;
  }, [parts]);

  const tasksWithShortage = useMemo(() => {
    const blockedTasks: Record<number, string[]> = {};
    calculatedTasks.forEach((t) => {
      if (t.partsRequired) {
        const missingForTask = t.partsRequired.filter((partId) => missingPartsMap[partId]);
        if (missingForTask.length > 0) {
          blockedTasks[t.uid] = missingForTask;
        }
      }
    });
    return blockedTasks;
  }, [calculatedTasks, missingPartsMap]);

  // Total project statistics
  const stats = useMemo(() => {
    const summaryTask = calculatedTasks[calculatedTasks.length - 1];
    const totalMinutes = calculatedTasks
      .filter((t) => !t.summary && !t.isMilestone)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);

    const activePartsCount = parts.reduce((acc, curr) => acc + curr.quantityHave, 0);
    const totalPartsNeeded = parts.reduce((acc, curr) => acc + curr.quantityNeeded, 0);

    const startString = calculatedTasks[0]?.start;
    const finishString = calculatedTasks[calculatedTasks.length - 1]?.finish;

    return {
      totalDurationMinutes: totalMinutes,
      activePartsCount,
      totalPartsNeeded,
      hasShortages: Object.keys(tasksWithShortage).length > 0,
      startDate: startString ? new Date(startString) : new Date(),
      finishDate: finishString ? new Date(finishString) : new Date()
    };
  }, [calculatedTasks, parts, tasksWithShortage]);

  // Handle speed and level switching
  const handleLevelChange = (level: "Beginner" | "Intermediate" | "Master") => {
    let mult = 1.0;
    if (level === "Beginner") mult = 1.8;
    if (level === "Master") mult = 0.6;

    setProfile((prev) => ({
      ...prev,
      builderLevel: level,
      speedMultiplier: mult
    }));
  };

  // Adjust part inventory count
  const updatePartQuantity = (id: string, delta: number) => {
    setParts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newVal = Math.max(0, Math.min(p.quantityNeeded, p.quantityHave + delta));
          return { ...p, quantityHave: newVal };
        }
        return p;
      })
    );
  };

  // Reset inventory to 100% complete
  const resetInventoryFull = () => {
    setParts((prev) => prev.map((p) => ({ ...p, quantityHave: p.quantityNeeded })));
  };

  // Simulate missing parts for a custom risk scenario
  const simulateMissingPartsScenario = () => {
    setParts((prev) =>
      prev.map((p) => {
        // Simulate a scenario where gold ingots (99563) and transparent plates (28653) are missing
        if (p.id === "99563") return { ...p, quantityHave: 2 }; // Need 8
        if (p.id === "28653") return { ...p, quantityHave: 1 }; // Need 6
        return p;
      })
    );
  };

  // Handle Resource name modifications
  const handleResourceNameChange = (uid: number, name: string) => {
    setResources((prev) => prev.map((r) => (r.uid === uid ? { ...r, name } : r)));
  };

  // Export functions
  const triggerXmlDownload = () => {
    const xmlContent = generateMSPXML(calculatedTasks, resources, profile);
    const blob = new Blob([xmlContent], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lego_falcon_msproject_${profile.builderLevel.toLowerCase()}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerCsvDownload = () => {
    const csvContent = generateCSV(calculatedTasks, resources);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lego_falcon_msproject_${profile.builderLevel.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter tasks based on selected phase
  const filteredTasks = useMemo(() => {
    if (selectedPhase === "Todas") return calculatedTasks;
    return calculatedTasks.filter((t) => t.phase === selectedPhase || t.summary);
  }, [calculatedTasks, selectedPhase]);

  // Unique list of phases (excluding summaries) for filter pills
  const uniquePhases = ["Todas", "Preparación", "Ensamblaje Central", "Alas y Detalles", "Motores y Plataforma", "Detalles Superiores", "Control de Calidad"];

  // Search parts
  const filteredParts = useMemo(() => {
    if (!partsSearch) return parts;
    return parts.filter(
      (p) =>
        p.name.toLowerCase().includes(partsSearch.toLowerCase()) ||
        p.id.includes(partsSearch) ||
        p.color.toLowerCase().includes(partsSearch.toLowerCase())
    );
  }, [parts, partsSearch]);

  // For nice date formatting in the UI
  const formatFriendlyDate = (dateObj: Date) => {
    return dateObj.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      {/* Decorative top ambient bar */}
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-sky-50 text-sky-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-sky-200 uppercase tracking-wider font-mono">
                  Base LEGO 30708 • Millenium Falcon
                </span>
                {stats.hasShortages && (
                  <span className="bg-amber-50 text-amber-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> Riesgo de Faltantes
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-slate-900 flex items-center gap-2.5">
                <Briefcase className="w-7 h-7 text-sky-600" />
                Generador de Cronogramas para MS Project
              </h1>
              <p className="text-slate-600 text-xs md:text-sm mt-1 max-w-2xl">
                Planifica y exporta como <code className="text-sky-700 font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">XML nativo</code> o <code className="text-emerald-700 font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">CSV</code> el cronograma estructurado de ensamblaje para Microsoft Project.
              </p>
            </div>

            {/* Quick Export Panel in Header */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={triggerXmlDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-lg shadow-sky-600/10 transition-all cursor-pointer font-display"
                id="btn-export-xml"
              >
                <Download className="w-4 h-4" />
                Exportar XML Nativo
              </button>
              <button
                onClick={triggerCsvDownload}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs sm:text-sm rounded-lg shadow-lg shadow-emerald-600/10 transition-all cursor-pointer font-display"
                id="btn-export-csv"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <section className="bg-slate-100/80 border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-2xs uppercase tracking-wider block mb-1">Duración Total Estimada</span>
            <span className="text-lg md:text-xl font-bold font-mono text-sky-600">
              {stats.totalDurationMinutes} min
              <span className="text-slate-500 font-sans text-xs font-normal ml-1.5">
                ({(stats.totalDurationMinutes / 60).toFixed(1)} h)
              </span>
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-2xs uppercase tracking-wider block mb-1">Intervalo del Proyecto</span>
            <span className="text-xs md:text-sm font-semibold text-slate-700 block truncate">
              Inicio: {formatFriendlyDate(stats.startDate)}
            </span>
            <span className="text-xs md:text-sm font-semibold text-sky-600 block truncate mt-0.5">
              Fin: {formatFriendlyDate(stats.finishDate)}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 text-2xs uppercase tracking-wider block mb-1">Comprobación de Inventario</span>
            <span className={`text-lg md:text-xl font-bold font-mono ${stats.activePartsCount === stats.totalPartsNeeded ? 'text-emerald-600' : 'text-amber-600'}`}>
              {stats.activePartsCount} / {stats.totalPartsNeeded} u
              <span className="text-slate-500 font-sans text-xs font-normal ml-1.5">
                ({Math.round((stats.activePartsCount / stats.totalPartsNeeded) * 100)}%)
              </span>
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
            <span className="text-slate-500 text-2xs uppercase tracking-wider block mb-0.5">Nivel de Ensamblador</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-2xs font-extrabold uppercase font-mono ${
                profile.builderLevel === "Master" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                profile.builderLevel === "Intermediate" ? "bg-sky-100 text-sky-700 border border-sky-200" :
                "bg-orange-100 text-orange-700 border border-orange-200"
              }`}>
                {profile.builderLevel === "Master" ? "Experto" : profile.builderLevel === "Intermediate" ? "Medio" : "Junior"}
              </span>
              <span className="text-slate-500 text-xs">({profile.speedMultiplier}x d)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: PARAMETERS & INVENTORY CHECKLIST (Span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* CARD 1: CONTROLES Y PARÁMETROS DE CRONOGRAMA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <h2 className="text-sm uppercase tracking-wider font-semibold text-slate-800 flex items-center gap-2 font-display">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  Parámetros del Proyecto
                </h2>
                <button
                  onClick={() => setProfile({
                    startDate: "2026-05-23",
                    startTime: "08:00",
                    speedMultiplier: 1.0,
                    builderLevel: "Intermediate",
                    dailyHoursLimit: 24,
                    workOnWeekends: true
                  })}
                  className="p-1 hover:bg-slate-100 rounded transition text-slate-500 hover:text-slate-800"
                  title="Restablecer valores"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* 1. Start Date & Start Time */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1 block">Fecha de Inicio</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={profile.startDate}
                        onChange={(e) => setProfile(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1 block">Hora de Inicio</label>
                    <input
                      type="time"
                      value={profile.startTime}
                      onChange={(e) => setProfile(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                {/* 2. Builder Skill Level Selection */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Nivel del Constructor
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    {(["Beginner", "Intermediate", "Master"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => handleLevelChange(level)}
                        type="button"
                        className={`py-1.5 text-3xs font-extrabold uppercase rounded-md transition-all cursor-pointer ${
                          profile.builderLevel === level
                            ? "bg-sky-600 text-white shadow-md font-extrabold"
                            : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50"
                        }`}
                      >
                        {level === "Beginner" ? "Novato" : level === "Intermediate" ? "Medio" : "Experto"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {profile.builderLevel === "Beginner" && "🛠️ Ideal para niños o principiantes (Multiplicador x1.8 duración)"}
                    {profile.builderLevel === "Intermediate" && "⏱️ Ritmo de armado estándar de LEGO (Multiplicador x1.0)"}
                    {profile.builderLevel === "Master" && "⚡ Constructor veloz de Millenium Falcons (Multiplicador x0.6)"}
                  </p>
                </div>

                {/* 3. Daily Limit Schedule Selection */}
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Jornada y Límites Diarios
                  </label>
                  <select
                    value={profile.dailyHoursLimit}
                    onChange={(e) => setProfile(prev => ({ ...prev, dailyHoursLimit: parseFloat(e.target.value) }))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
                  >
                    <option value={24}>Ensamblado Continuo (Sin pausas / Sprint)</option>
                    <option value={2}>Bloques de 2 Horas al día</option>
                    <option value={1}>Bloques de 1 Hora al día</option>
                    <option value={0.5}>Sesiones de 30 Minutos al día</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Establece el tiempo de ensamble acumulable diario. Si los pasos exceden el límite, se programarán para el siguiente día laboral.
                  </p>
                </div>

                {/* 4. Weekend Exclusions Toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1">
                  <div>
                    <span className="text-xs font-medium text-slate-700 block">Trabajar fines de semana</span>
                    <span className="text-4xs text-slate-500 block uppercase tracking-wider">Sábados y Domingos hábiles</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.workOnWeekends}
                      onChange={(e) => setProfile(prev => ({ ...prev, workOnWeekends: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600 peer-checked:after:bg-white"></div>
                  </label>
                </div>

                {/* 5. Team Customization section */}
                <div className="mt-2 border-t border-slate-200 pt-3">
                  <span className="text-[11px] font-semibold uppercase text-slate-500 flex items-center gap-1.5 mb-2">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    Asignación de Recursos (MS Project)
                  </span>
                  <div className="flex flex-col gap-2">
                    {resources.map((r) => (
                      <div key={r.uid} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-sm" title={r.role}>{r.icon}</span>
                        <div className="flex-1">
                          <span className="text-[10px] text-slate-500 block leading-3">{r.role}</span>
                          <input
                            type="text"
                            value={r.name}
                            onChange={(e) => handleResourceNameChange(r.uid, e.target.value)}
                            className="w-full bg-transparent border-none text-slate-700 text-xs font-semibold p-0 focus:ring-0 focus:outline-none"
                            placeholder="Nombre del recurso"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* CARD 2: INVENTARIO DE PIEZAS (Mecabricks Reference Check) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-[480px] shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 font-display">
                    <ListChecks className="w-4.5 h-4.5 text-sky-600" />
                    Control de Inventario
                  </h3>
                  <p className="text-[10px] text-slate-500">Mecabricks Bom para LEGO 30708</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={resetInventoryFull}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 text-4xs hover:text-slate-800 uppercase font-bold tracking-wider cursor-pointer font-display"
                    title="Restablecer todas las piezas completas"
                  >
                    100% Ok
                  </button>
                  <button
                    onClick={simulateMissingPartsScenario}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 rounded border border-amber-200 text-4xs uppercase font-extrabold tracking-wider animate-pulse cursor-pointer font-display"
                    title="Simular escenario de riesgo por falta de piezas"
                  >
                    Simular Riesgo
                  </button>
                </div>
              </div>

              {/* Search bar inside inventory */}
              <div className="mb-3 relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-3 w-3 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar pieza por ID o color..."
                  value={partsSearch}
                  onChange={(e) => setPartsSearch(e.target.value)}
                  className="w-full bg-slate-50 text-xs text-slate-755 border border-slate-200 rounded-md pl-7 pr-2.5 py-1.5 focus:outline-none focus:border-sky-500 placeholder-slate-400"
                />
              </div>

              {/* Scrollable Parts List */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar">
                {filteredParts.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-6">No se encontraron piezas.</p>
                ) : (
                  filteredParts.map((p) => {
                    const isShortage = p.quantityHave < p.quantityNeeded;
                    return (
                      <div
                        key={p.id}
                        className={`p-2 rounded-lg border transition-all ${
                          isShortage
                            ? "bg-amber-50 border-amber-300"
                            : "bg-slate-50 border-slate-150 hover:border-slate-250 hover:bg-slate-100/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                              #{p.id}
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                p.colorCategory === 'Blue' ? 'bg-blue-400' :
                                p.colorCategory === 'Red' ? 'bg-red-500' :
                                p.colorCategory === 'Clear' ? 'bg-sky-450' :
                                'bg-slate-500'
                              }`} />
                              {p.color}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 block truncate leading-tight mt-0.5" title={p.name}>
                              {p.name}
                            </span>
                          </div>

                          {/* Controls to change inventory values */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updatePartQuantity(p.id, -1)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded cursor-pointer"
                              title="Restar pieza"
                            >
                              <Minus className="w-3 h-3 text-slate-500" />
                            </button>
                            <span className={`text-xs font-bold font-mono px-1.5 w-9 text-center rounded ${
                              isShortage ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"
                            }`}>
                              {p.quantityHave} / {p.quantityNeeded}
                            </span>
                            <button
                              onClick={() => updatePartQuantity(p.id, 1)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded cursor-pointer"
                              title="Sumar pieza"
                            >
                              <Plus className="w-3 h-3 text-slate-500" />
                            </button>
                          </div>
                        </div>

                        {/* Visual progress bar of inventory status */}
                        <div className="w-full bg-slate-100 h-1 rounded overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded transition-all duration-300 ${isShortage ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${(p.quantityHave / p.quantityNeeded) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: GANTT CHART, GRID VIEWER, AND PROJECT SOURCE CODES (Span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* TABS SELECTOR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-px gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setActiveTab("gantt")}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "gantt"
                      ? "border-sky-600 text-sky-600 bg-white font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Diagrama de Gantt
                </button>
                <button
                  onClick={() => setActiveTab("grid")}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "grid"
                      ? "border-sky-600 text-sky-600 bg-white font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}
                >
                  <ListChecks className="w-4 h-4" />
                  Tabla de Tareas MS Project
                </button>
                <button
                  onClick={() => setActiveTab("xml")}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "xml"
                      ? "border-sky-600 text-sky-600 bg-white font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  Visualizar Código XML
                </button>
                <button
                  onClick={() => setActiveTab("how-to")}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "how-to"
                      ? "border-sky-600 text-sky-600 bg-white font-bold"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  ¿Cómo importar en MS Project?
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 self-end py-1 sm:py-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sincronizado con Microsoft Project XML v14.0
              </div>
            </div>

            {/* TAB CONTENT: GANTT CHART CHIP */}
            {activeTab === "gantt" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm">
                
                {/* Gantt Filter Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 font-display">
                      <TrendingUp className="w-4 h-4 text-sky-600" />
                      Visualización de Cronograma de Ensamble de LEGO
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Diagrama de Gantt dinámico. La escala y los desfases se recalculan automáticamente según tus parámetros.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-4xs uppercase font-extrabold text-slate-500 mr-1.5">Fase:</span>
                    {uniquePhases.map((phase) => (
                      <button
                        key={phase}
                        onClick={() => setSelectedPhase(phase)}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-medium border transition-all cursor-pointer font-display ${
                          selectedPhase === phase
                            ? "bg-sky-50 text-sky-600 border-sky-300"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {phase}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Gantt Grid */}
                <div className="overflow-x-auto">
                  <div className="min-w-[800px] flex flex-col gap-1.5 py-2">
                    
                    {/* Gantt Headers */}
                    <div className="grid grid-cols-12 text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200">
                      <div className="col-span-5">Descripción de la Tarea / Fase</div>
                      <div className="col-span-1 text-center">Duración</div>
                      <div className="col-span-6 flex items-center justify-between font-mono px-3">
                        <span>{formatFriendlyDate(stats.startDate)}</span>
                        <div className="h-2 w-px bg-slate-200 mx-1" />
                        <span>Progreso de Ensamblaje Estructurado</span>
                        <div className="h-2 w-px bg-slate-200 mx-1" />
                        <span>{formatFriendlyDate(stats.finishDate)}</span>
                      </div>
                    </div>

                    {/* Gantt Task Rows */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      {filteredTasks.map((t) => {
                        const isSummary = t.summary;
                        const isMilestone = t.isMilestone;
                        const hasBlockedRisk = tasksWithShortage[t.uid];

                        // Calculate horizontal Gantt offset & width relative to start/end range of the whole project
                        const projStartMs = stats.startDate.getTime();
                        const projEndMs = stats.finishDate.getTime();
                        const totalDurationMs = projEndMs - projStartMs;

                        const taskStartMs = new Date(t.start).getTime();
                        const taskFinishMs = new Date(t.finish).getTime();

                        // Calculate percentage styles
                        let leftPercent = totalDurationMs > 0 ? ((taskStartMs - projStartMs) / totalDurationMs) * 100 : 0;
                        let widthPercent = totalDurationMs > 0 ? ((taskFinishMs - taskStartMs) / totalDurationMs) * 100 : 1;

                        // Bounds checking
                        if (leftPercent < 0) leftPercent = 0;
                        if (leftPercent + widthPercent > 100) widthPercent = 100 - leftPercent;

                        return (
                          <div
                            key={t.uid}
                            className={`grid grid-cols-12 items-center py-1.5 rounded transition-all ${
                              isSummary
                                ? "bg-slate-100/75 border-l-2 border-sky-500 pl-1 font-semibold"
                                : "hover:bg-slate-100/40"
                            }`}
                          >
                            {/* Task Info Column (Name/Role) */}
                            <div className="col-span-5 flex items-center gap-2">
                              <span className="text-2xs text-slate-500 font-mono w-4 shrink-0 text-right">{t.id}</span>
                              <div className="truncate">
                                <span className={`text-2xs block truncate ${isSummary ? 'text-slate-800 font-semibold uppercase tracking-wide' : 'text-slate-700'}`}>
                                  {t.name}
                                </span>
                                {!isSummary && (
                                  <span className="text-[9px] text-slate-500 font-display flex items-center gap-1 mt-0.5">
                                    {resources.find(r => r.uid === t.resourceId)?.icon || "👤"}{" "}
                                    {resources.find(r => r.uid === t.resourceId)?.name || "Asignado"} • {t.phase}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Duration Column */}
                            <div className="col-span-1 text-center font-mono text-[11px] text-slate-650">
                              {isMilestone ? "Hito" : `${t.durationMinutes}m`}
                            </div>

                            {/* Timeline Visual Progress Column */}
                            <div className="col-span-6 relative h-5 bg-slate-105/20 rounded border border-slate-100 px-3 flex items-center">
                              {/* Horizontal bar render */}
                              <div
                                className="absolute h-3 rounded transition-all duration-300 group cursor-pointer flex items-center justify-end"
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${Math.max(1.5, widthPercent)}%`
                                }}
                              >
                                {/* Different style bars depending on task type */}
                                {isSummary ? (
                                  // Phase summary bar brackets
                                  <div className="w-full h-1.5 bg-sky-500 flex justify-between rounded-full items-center">
                                    <div className="w-1 h-3 bg-sky-400 rounded-l" />
                                    <div className="w-1 h-3 bg-sky-400 rounded-r" />
                                  </div>
                                ) : isMilestone ? (
                                  // Milestone Diamond
                                  <div className="w-3 h-3 bg-indigo-550 transform rotate-45 -translate-x-1.5 shadow-md shadow-indigo-400/20" title="Milestone" />
                                ) : hasBlockedRisk ? (
                                  // Blocked / Missing parts warning bar
                                  <div className="w-full h-full bg-amber-500/40 border border-amber-500 rounded-md flex items-center px-1 animate-pulse">
                                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                  </div>
                                ) : (
                                  // Standard calculated task bar in Spanish
                                  <div className={`w-full h-full rounded-md shadow-sm border ${
                                    t.phase === "Preparación" ? "bg-slate-400 border-slate-500" :
                                    t.phase === "Ensamblaje Central" ? "bg-sky-500 border-sky-600" :
                                    t.phase === "Alas y Detalles" ? "bg-indigo-500 border-indigo-600" :
                                    t.phase === "Motores y Plataforma" ? "bg-emerald-500 border-emerald-600" :
                                    t.phase === "Detalles Superiores" ? "bg-purple-500 border-purple-600" :
                                    "bg-rose-500 border-rose-600"
                                  }`} />
                                )}

                                {/* Floating details bubble on hover */}
                                <div className="absolute hidden group-hover:block transition-all bottom-5 left-1/2 transform -translate-x-1/2 bg-white text-slate-800 p-2.5 text-[10px] rounded border border-slate-200 shadow-xl z-50 whitespace-nowrap leading-relaxed">
                                  <span className="font-semibold text-slate-800 block mb-0.5">{t.name}</span>
                                  <span>Inicia: {new Date(t.start).toLocaleTimeString("es-ES")}</span><br />
                                  <span>Termina: {new Date(t.finish).toLocaleTimeString("es-ES")}</span>
                                  {hasBlockedRisk && (
                                    <span className="text-amber-600 block border-t border-slate-100 mt-1 pt-1 font-bold">
                                      ⚠️ Faltante: Pieza {hasBlockedRisk.join(", ")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

                {/* Subtext explanation of Lego construction risks inside scheduler */}
                <div className="bg-slate-100/50 p-3.5 rounded-lg border border-slate-200 flex items-start gap-2.5 text-4xs sm:text-xs">
                  <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <p className="text-slate-600 leading-normal">
                    <strong>Análisis Crítico de Ruta:</strong> El cronograma calcula de forma encadenada cada fase de armado (Fuselaje, Alas, Motores). Si activas el <strong className="text-amber-600 font-bold">Riesgo de Faltantes</strong> reduciendo piezas de inventario a la izquierda, los pasos afectados indicarán un conflicto de bloqueo físico, listo para ser proyectado en MS Project.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: TABULAR GRID FOR COPTING TO MS PROJECT MANUAL FIELD MAP */}
            {activeTab === "grid" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 font-display">
                      <ListChecks className="w-4.5 h-4.5 text-sky-600" />
                      Tabla Detallada de Tareas (Formato MS Project)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Copias directas o mapeo de campos. Contiene la jerarquía y predecesores calculados.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-650 border-collapse">
                    <thead>
                      <tr className="bg-slate-55 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3 w-10">Id</th>
                        <th className="py-2.5 px-3">Estructura / Nombre Tarea</th>
                        <th className="py-2.5 px-3">Nivel</th>
                        <th className="py-2.5 px-2 w-20 text-center">Duración (m)</th>
                        <th className="py-2.5 px-3">Inicio</th>
                        <th className="py-2.5 px-3">Fin</th>
                        <th className="py-2.5 px-3 w-20 text-center">Predecesor</th>
                        <th className="py-2.5 px-3">Recurso Asignado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {calculatedTasks.map((t) => {
                        const isSummary = t.summary;
                        const resource = resources.find(r => r.uid === t.resourceId);
                        
                        // Map precursor IDs
                        const predIds = t.predecessors.map(pUid => {
                          const pt = calculatedTasks.find(x => x.uid === pUid);
                          return pt ? pt.id : "";
                        }).filter(id => id !== "").join(", ");

                        return (
                          <tr
                            key={t.uid}
                            className={`transition-all hover:bg-slate-50 ${
                              isSummary ? "bg-slate-50 text-slate-800 font-semibold" : "text-slate-700"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{t.id}</td>
                            <td className="py-2.5 px-3">
                              <span
                                style={{ paddingLeft: `${(t.outlineLevel - 1) * 1.5}rem` }}
                                className={`inline-flex items-center gap-1.5 ${isSummary ? 'uppercase tracking-wider text-sky-650 font-bold' : ''}`}
                              >
                                {isSummary && <Layers className="w-3.5 h-3.5 shrink-0 text-sky-600" />}
                                {t.name}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">Nivel {t.outlineLevel}</td>
                            <td className="py-2.5 px-2 font-mono text-center font-bold text-slate-700">{t.durationMinutes}</td>
                            <td className="py-2.5 px-3 text-[11px] font-mono whitespace-nowrap text-slate-600">
                              {new Date(t.start).toLocaleDateString("es-ES")} {new Date(t.start).toLocaleTimeString("es-ES", {hour: '2-digit', minute: '2-digit'})}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] font-mono whitespace-nowrap text-slate-600">
                              {new Date(t.finish).toLocaleDateString("es-ES")} {new Date(t.finish).toLocaleTimeString("es-ES", {hour: '2-digit', minute: '2-digit'})}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-center text-amber-700 font-semibold">{predIds || "-"}</td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {resource && (
                                <span className="inline-flex items-center gap-1.5 bg-slate-100/55 px-2 py-0.5 rounded border border-slate-200 text-[10.5px]">
                                  <span>{resource.icon}</span>
                                  <span>{resource.name}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: RAW XML PREVIEW AND DIRECT DOWNLOAD BLUEPRINT */}
            {activeTab === "xml" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 font-display">
                      <FileCode className="w-4.5 h-4.5 text-sky-600" />
                      Vista Previa de XML de Importación Nativa
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Este código estructurado en base a las especificaciones MSP XML Schema permite importar todas las dependencias directo a MS Project.
                    </p>
                  </div>

                  <button
                    onClick={triggerXmlDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold cursor-pointer font-display shadow-md transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar XML completo
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-[10px] overflow-auto h-[350px] leading-relaxed custom-scrollbar text-slate-700">
                  <pre>
                    {`<!-- MS Project XML Schema Mapping Blueprint -->\n`}
                    {generateMSPXML(calculatedTasks, resources, profile)}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DETAILED "HOW-TO" GUIDE TO LOAD FILES INSIDE MS PROJECT */}
            {activeTab === "how-to" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 shadow-sm">
                
                <div>
                  <h3 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-sky-600" />
                    Guía Paso a Paso: Importar tu Cronograma en Microsoft Project
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Hemos diseñado el XML para que cumpla rigurosamente con los esquemas de bases de datos de Microsoft Project. Sigue estos pasos para cargar tu cronograma perfectamente estructurado.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1 Card */}
                  <div
                    onClick={() => setActiveInstructionStep(1)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      activeInstructionStep === 1 ? 'bg-sky-50 border-sky-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-100">1</span>
                      <h4 className="font-semibold text-slate-800 text-sm">Descarga el Archivo</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      Haz clic en el botón <strong className="text-slate-700">"Exportar XML Nativo"</strong>. Se guardará un archivo <code className="text-sky-700 font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px] border border-slate-220">.xml</code> con el cronograma y recursos calculados.
                    </p>
                  </div>

                  {/* Step 2 Card */}
                  <div
                    onClick={() => setActiveInstructionStep(2)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      activeInstructionStep === 2 ? 'bg-sky-50 border-sky-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-100">2</span>
                      <h4 className="font-semibold text-slate-800 text-sm">Abrir en MS Project</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Entra a Microsoft Project. Dirígete al menú superior en <strong className="text-slate-700">Archivo (File) &gt; Abrir (Open)</strong> y haz clic en Examinar (Browse).
                    </p>
                  </div>

                  {/* Step 3 Card */}
                  <div
                    onClick={() => setActiveInstructionStep(3)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      activeInstructionStep === 3 ? 'bg-sky-50 border-sky-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-100">3</span>
                      <h4 className="font-semibold text-slate-800 text-sm">Filtra por formato XML</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      En el cuadro de diálogo de archivos de Windows/Project, cambia el selector de formato en la esquina inferior derecha a <strong className="text-sky-600 font-semibold">"Formato XML de Project (*.xml)"</strong>.
                    </p>
                  </div>

                  {/* Step 4 Card */}
                  <div
                    onClick={() => setActiveInstructionStep(4)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      activeInstructionStep === 4 ? 'bg-sky-50 border-sky-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="w-6 h-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs border border-sky-100">4</span>
                      <h4 className="font-semibold text-slate-800 text-sm">Asistente de Importación</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Selecciona el archivo descargado. Al pulsar abrir, se iniciará el asistente automático. Selecciona la opción <strong className="text-emerald-600 font-semibold">"Como Proyecto Nuevo"</strong> y pulsa finalizar.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50/40 border border-emerald-300 p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-emerald-800 text-xs text-left uppercase tracking-wider mb-1">¡Listo para el Control!</h5>
                    <p className="text-slate-600 text-[11px] md:text-xs leading-normal">
                      Una vez importado, todas las jerarquías de fases (Esquemas / Sangrías), relaciones de precedencia de los 18 pasos e inclusive el calendario laboral de fines de semana o límites de horas quedarán plasmados nativamente dentro de la hoja de Project.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* QUICK STEPS GALLERY AS A CHEAT-SHEET REF ENHANCEMENT */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-3 block font-display flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-sky-600" />
                Flujo de los 18 Pasos de Ensamble (LEGO Set 30708)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { range: "1 - 5", title: "Fuselaje Basal", desc: "Plates & Pins" },
                  { range: "6 - 7", title: "Capa de Alas", desc: "Wedge angled" },
                  { range: "8 - 9", title: "Trabas y Studs", desc: "Symmetric caps" },
                  { range: "10 - 12", title: "Núcleo de Motores", desc: "Engine Tubing" },
                  { range: "13 - 15", title: "Detallado Inferior", desc: "Ingots tiles" },
                  { range: "16 - 18", title: "Radar y Cabina", desc: "Laser weaponry" }
                ].map((ph, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center flex flex-col justify-between hover:bg-slate-100/40 transition-colors">
                    <span className="text-[10px] text-sky-650 font-mono font-bold leading-none mb-1 block">Pasos {ph.range}</span>
                    <span className="text-xs font-semibold text-slate-700 block leading-tight truncate">{ph.title}</span>
                    <span className="text-[9px] text-slate-500 block leading-tight mt-1">{ph.desc}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sky-500">🌌</span>
            <span className="text-xs text-slate-500 font-mono">Lego Falcon Project Timeline Engine v1.1</span>
          </div>
          <span className="text-slate-500 text-xs">
            Planificador creado con amor para fanáticos de Star Wars y la gestión de proyectos.
          </span>
        </div>
      </footer>
    </div>
  );
}
