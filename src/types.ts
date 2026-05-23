export interface Task {
  uid: number;
  id: number;
  name: string;
  phase: string;
  outlineLevel: number; // 1 for Phase summary task, 2 for subtask
  stepNumber?: number; // Corresponding step number in Lego PDF instructions (1-18)
  baseDurationMinutes: number; // Duration for reference "Intermediate" builder
  durationMinutes: number; // Calculated duration based on multiplier
  start: string; // ISO string or LocalDateTime
  finish: string; // ISO string or LocalDateTime
  predecessors: number[]; // Array of task uids
  resourceId: number; // Assigned resource UID
  partsRequired?: string[]; // IDs of physical parts required for this step
  summary: boolean; // Is it a summary group task
  isMilestone: boolean;
}

export interface Part {
  id: string; // e.g., "43093"
  name: string;
  color: string;
  colorCategory: 'Grey' | 'Blue' | 'Red' | 'Clear' | 'Other';
  quantityNeeded: number;
  quantityHave: number; // for inventory checkoff
  imageUrl?: string;
}

export interface Resource {
  uid: number;
  name: string;
  role: string;
  icon: string;
}

export interface BuilderProfile {
  startDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  speedMultiplier: number; // 0.6 = Master, 1.0 = Intermediate, 1.8 = Junior
  builderLevel: 'Beginner' | 'Intermediate' | 'Master';
  dailyHoursLimit: number; // daily work hours cap, e.g., 0.5, 2, 8, 24 (Sprint)
  workOnWeekends: boolean;
}

export const LEGO_PARTS: Part[] = [
  { id: "43093", name: "CONN.BUSH W.FRIC./CROSS ALE", color: "Bright Blue", colorCategory: "Blue", quantityNeeded: 1, quantityHave: 1 },
  { id: "30162", name: "PRISMATIC BINOCULARS", color: "Dark Stone Grey", colorCategory: "Grey", quantityNeeded: 1, quantityHave: 1 },
  { id: "3020", name: "PLATE 2X4", color: "Dark Stone Grey", colorCategory: "Grey", quantityNeeded: 4, quantityHave: 4 },
  { id: "15535", name: "FLAT TILE 2X2 ROUND W. HOLE Ø4.85", color: "Dark Stone Grey", colorCategory: "Grey", quantityNeeded: 2, quantityHave: 2 },
  { id: "99781", name: "ANGULAR PLATE 1.5 TOP 1X2 1/2", color: "Dark Stone Grey", colorCategory: "Grey", quantityNeeded: 2, quantityHave: 2 },
  { id: "35480", name: "PLATE 1X2 ROUNDED NO. 1", color: "Dark Stone Grey", colorCategory: "Grey", quantityNeeded: 4, quantityHave: 4 },
  { id: "28626", name: "PL.ROUND 1X1 W. THROUGHG. HOLE", color: "Dark Stone Grey", colorCategory: "Grey", quantityNeeded: 15, quantityHave: 15 },
  { id: "3023", name: "PLATE 1X2", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 4, quantityHave: 4 },
  { id: "3710", name: "PLATE 1X4", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 1, quantityHave: 1 },
  { id: "4599", name: "TAP Ø4.9/6.4", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 1, quantityHave: 1 },
  { id: "4740", name: "PARABOLA Ø16", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 1, quantityHave: 1 },
  { id: "54383", name: "RIGHT PLATE 3X6 W. ANGLE", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 2, quantityHave: 2 },
  { id: "54384", name: "LEFT PLATE 3X6 W ANGLE", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 2, quantityHave: 2 },
  { id: "30565", name: "PLATE 4X4, 1/4 CIRCLE", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 8, quantityHave: 8 },
  { id: "99780", name: "ANGULAR PLATE 1.5 BOT. 1X2 1/2", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 2, quantityHave: 2 },
  { id: "98100", name: "2X2 ROUND, SLOPE BRICK W. KNOB", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 1, quantityHave: 1 },
  { id: "23893", name: "PLATE 2X2 W 1 KNOB", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 1, quantityHave: 1 },
  { id: "18646", name: "PLATE HALF CIRCLE 3X6 WITH CUT", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 2, quantityHave: 2 },
  { id: "99563", name: "GOLD INGOT", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 8, quantityHave: 8 },
  { id: "26601", name: "PLATE 2X2, CORNER, 45 DEG", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 2, quantityHave: 2 },
  { id: "73109", name: "BRICK 2X2, W/4.85 HOLE, NO. 1", color: "Medium Stone Grey", colorCategory: "Grey", quantityNeeded: 1, quantityHave: 1 },
  { id: "25269", name: "1/4 CIRCLE TILE 1X1", color: "New Dark Red", colorCategory: "Red", quantityNeeded: 3, quantityHave: 3 },
  { id: "28653", name: "PLATE 1X2", color: "Transparent Light Blue", colorCategory: "Clear", quantityNeeded: 6, quantityHave: 6 }
];

export const INITIAL_RESOURCES: Resource[] = [
  { uid: 1, name: "Lead Builder", role: "Primary Assembler", icon: "🔧" },
  { uid: 2, name: "Sorting Assistant", role: "Logistics", icon: "📦" },
  { uid: 3, name: "Inspection Officer", role: "QA/QC", icon: "🔍" }
];

export const REFRESH_TASKS = (profile: BuilderProfile): Task[] => {
  // Define task list with their baseline durations (minutes)
  // outlineLevel: 1 = Phase summarizing, 2 = actual task, 3 = milestone or detail
  const list: Omit<Task, 'durationMinutes' | 'start' | 'finish'>[] = [
    // PHASE 1: Preparación y Planificación
    {
      uid: 100,
      id: 1,
      name: "1. PREPARACIÓN Y ACCESO A MATERIALES",
      phase: "Preparación",
      outlineLevel: 1,
      baseDurationMinutes: 0,
      predecessors: [],
      resourceId: 2,
      summary: true,
      isMilestone: false,
    },
    {
      uid: 101,
      id: 2,
      name: "Desembalaje de componentes LEGO y configuración de la bandeja de clasificación",
      phase: "Preparación",
      outlineLevel: 2,
      baseDurationMinutes: 5,
      predecessors: [],
      resourceId: 2,
      summary: false,
      isMilestone: false,
    },
    {
      uid: 102,
      id: 3,
      name: "Reconciliación de inventario (verificación con Mecabricks BOM)",
      phase: "Preparación",
      outlineLevel: 2,
      baseDurationMinutes: 15,
      predecessors: [101],
      resourceId: 2,
      summary: false,
      isMilestone: false,
    },
    {
      uid: 103,
      id: 4,
      name: "Preclasificación de pasos (agrupar piezas por tamaño, color y fase de ensamblaje)",
      phase: "Preparación",
      outlineLevel: 2,
      baseDurationMinutes: 15,
      predecessors: [102],
      resourceId: 2,
      summary: false,
      isMilestone: false,
    },

    // PHASE 2: Plataforma central del fuselaje (Pasos 1 a 5)
    {
      uid: 200,
      id: 5,
      name: "2. ENSAMBLAJE CENTRAL DEL FUSELAJE",
      phase: "Ensamblaje Central",
      outlineLevel: 1,
      baseDurationMinutes: 0,
      predecessors: [],
      resourceId: 1,
      summary: true,
      isMilestone: false,
    },
    {
      uid: 201,
      id: 6,
      name: "Paso 1: Acoplamiento de placas base centrales (uniones Dark Stone 2x4)",
      phase: "Ensamblaje Central",
      outlineLevel: 2,
      stepNumber: 1,
      baseDurationMinutes: 4,
      predecessors: [103],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["3020"]
    },
    {
      uid: 202,
      id: 7,
      name: "Paso 2: Montaje de placa base radial (flat circular Dark Stone 2x2)",
      phase: "Ensamblaje Central",
      outlineLevel: 2,
      stepNumber: 2,
      baseDurationMinutes: 4,
      predecessors: [201],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["15535"]
    },
    {
      uid: 203,
      id: 8,
      name: "Paso 3: Configuración de bloqueo por soporte (3x Transparent Light Blue)",
      phase: "Ensamblaje Central",
      outlineLevel: 2,
      stepNumber: 3,
      baseDurationMinutes: 5,
      predecessors: [202],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["28653"]
    },
    {
      uid: 204,
      id: 9,
      name: "Paso 4: Expansión izquierda de la placa de soporte del ala central",
      phase: "Ensamblaje Central",
      outlineLevel: 2,
      stepNumber: 4,
      baseDurationMinutes: 4,
      predecessors: [203],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["99781"]
    },
    {
      uid: 205,
      id: 10,
      name: "Paso 5: Bloqueo de cuña de soporte derecha del ala central",
      phase: "Ensamblaje Central",
      outlineLevel: 2,
      stepNumber: 5,
      baseDurationMinutes: 4,
      predecessors: [204],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["99781", "35480"]
    },

    // PHASE 3: Estructura de alas y detalles (Pasos 6 a 9)
    {
      uid: 300,
      id: 11,
      name: "3. ESTRUCTURA DE ALAS Y DETALLES EXTERIORES",
      phase: "Alas y Detalles",
      outlineLevel: 1,
      baseDurationMinutes: 0,
      predecessors: [],
      resourceId: 1,
      summary: true,
      isMilestone: false,
    },
    {
      uid: 301,
      id: 12,
      name: "Paso 6: Ensamblaje en ángulo de placa de ala de babor (ala 3x6 izquierda/derecha)",
      phase: "Alas y Detalles",
      outlineLevel: 2,
      stepNumber: 6,
      baseDurationMinutes: 6,
      predecessors: [205],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["54383", "30565"]
    },
    {
      uid: 302,
      id: 13,
      name: "Paso 7: Ensamblaje en ángulo de placa de ala de estribor",
      phase: "Alas y Detalles",
      outlineLevel: 2,
      stepNumber: 7,
      baseDurationMinutes: 6,
      predecessors: [301],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["54384", "30565"]
    },
    {
      uid: 303,
      id: 14,
      name: "Paso 8: Ensamblaje de clips laterales de estabilidad (2x placas exteriores)",
      phase: "Alas y Detalles",
      outlineLevel: 2,
      stepNumber: 8,
      baseDurationMinutes: 5,
      predecessors: [302],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["35480"]
    },
    {
      uid: 304,
      id: 15,
      name: "Paso 9: Acoplamiento y bloqueo del cilindro central del núcleo",
      phase: "Alas y Detalles",
      outlineLevel: 2,
      stepNumber: 9,
      baseDurationMinutes: 4,
      predecessors: [303],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["28626"]
    },

    // PHASE 4: Motores de hiperimpulsor (Pasos 10 a 12)
    {
      uid: 400,
      id: 16,
      name: "4. MOTORES Y PLATAFORMA DE CABINA",
      phase: "Motores y Plataforma",
      outlineLevel: 1,
      baseDurationMinutes: 0,
      predecessors: [],
      resourceId: 1,
      summary: true,
      isMilestone: false,
    },
    {
      uid: 401,
      id: 17,
      name: "Paso 10: Subensamblaje del motor hiperimpulsor y sujeción al casco",
      phase: "Motores y Plataforma",
      outlineLevel: 2,
      stepNumber: 10,
      baseDurationMinutes: 8,
      predecessors: [304],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["4599", "4740", "73109"]
    },
    {
      uid: 402,
      id: 18,
      name: "Paso 11: Fijación del blindaje pesado lateral (2x conjuntos con bisagras)",
      phase: "Motores y Plataforma",
      outlineLevel: 2,
      stepNumber: 11,
      baseDurationMinutes: 6,
      predecessors: [401],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["99780", "26601"]
    },
    {
      uid: 403,
      id: 19,
      name: "Paso 12: Instalación del panel circular de la cubierta superior de la cabina",
      phase: "Motores y Plataforma",
      outlineLevel: 2,
      stepNumber: 12,
      baseDurationMinutes: 5,
      predecessors: [402],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["18646"]
    },

    // PHASE 5: Detalles superiores y armamento (Pasos 13 to 18)
    {
      uid: 500,
      id: 20,
      name: "5. BLINDAJE SUPERIOR DEL CASCO Y SENSORES",
      phase: "Detalles Superiores",
      outlineLevel: 1,
      baseDurationMinutes: 0,
      predecessors: [],
      resourceId: 1,
      summary: true,
      isMilestone: false,
    },
    {
      uid: 501,
      id: 21,
      name: "Paso 13: Acoplamiento de mosaicos de detalle superior (8x lingotes dorados)",
      phase: "Detalles Superiores",
      outlineLevel: 2,
      stepNumber: 13,
      baseDurationMinutes: 6,
      predecessors: [403],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["99563"]
    },
    {
      uid: 502,
      id: 22,
      name: "Paso 14: Montaje del domo central de la cubierta de la cabina (2x2 sloped)",
      phase: "Detalles Superiores",
      outlineLevel: 2,
      stepNumber: 14,
      baseDurationMinutes: 4,
      predecessors: [501],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["98100"]
    },
    {
      uid: 503,
      id: 23,
      name: "Paso 15: Colocación de detalles estructurales del cono de proa de la cabina",
      phase: "Detalles Superiores",
      outlineLevel: 2,
      stepNumber: 15,
      baseDurationMinutes: 5,
      predecessors: [502],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["23893", "25269"]
    },
    {
      uid: 504,
      id: 24,
      name: "Paso 16: Montaje de horquillas de aterrizaje de proa y rejillas superiores",
      phase: "Detalles Superiores",
      outlineLevel: 2,
      stepNumber: 16,
      baseDurationMinutes: 6,
      predecessors: [503],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["3023", "3710"]
    },
    {
      uid: 505,
      id: 25,
      name: "Paso 17: Acoplamiento de detalles del motor hiperimpulsor y binoculares",
      phase: "Detalles Superiores",
      outlineLevel: 2,
      stepNumber: 17,
      baseDurationMinutes: 5,
      predecessors: [504],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["30162", "43093"]
    },
    {
      uid: 506,
      id: 26,
      name: "Paso 18: Colocación de torretas de armas y acoplamiento del plato de radar",
      phase: "Detalles Superiores",
      outlineLevel: 2,
      stepNumber: 18,
      baseDurationMinutes: 6,
      predecessors: [505],
      resourceId: 1,
      summary: false,
      isMilestone: false,
      partsRequired: ["28626"]
    },

    // PHASE 6: Control de calidad (QA)
    {
      uid: 600,
      id: 27,
      name: "6. CONTROL DE CALIDAD Y PUESTA EN MARCHA",
      phase: "Control de Calidad",
      outlineLevel: 1,
      baseDurationMinutes: 0,
      predecessors: [],
      resourceId: 3,
      summary: true,
      isMilestone: false,
    },
    {
      uid: 601,
      id: 28,
      name: "Inspección visual (verificación de ajuste simétrico y comparación de brechas)",
      phase: "Control de Calidad",
      outlineLevel: 2,
      baseDurationMinutes: 8,
      predecessors: [506],
      resourceId: 3,
      summary: false,
      isMilestone: false,
    },
    {
      uid: 602,
      id: 29,
      name: "Prueba de estrés por vibración y validación de integridad estructural",
      phase: "Control de Calidad",
      outlineLevel: 2,
      baseDurationMinutes: 5,
      predecessors: [601],
      resourceId: 3,
      summary: false,
      isMilestone: false,
    },
    {
      uid: 603,
      id: 30,
      name: "Plan de entrega del proyecto: Montaje sobre base y colocación de piloto",
      phase: "Control de Calidad",
      outlineLevel: 2,
      baseDurationMinutes: 10,
      predecessors: [602],
      resourceId: 1,
      summary: false,
      isMilestone: false,
    },
    {
      uid: 604,
      id: 31,
      name: "Firma de Halcón de Millenium listo para el despegue (Hito del Proyecto)",
      phase: "Control de Calidad",
      outlineLevel: 2,
      baseDurationMinutes: 0,
      predecessors: [603],
      resourceId: 3,
      summary: false,
      isMilestone: true,
    }
  ];

  // Let's implement full scheduling logic that respects:
  // 1. Duration scaling (baseDurationMinutes * profile.speedMultiplier)
  // 2. Daily hour limit caps
  // 3. Weekends off/on
  // 4. Proper predecessor constraints (each task starts only after its predecessors finish)

  const initializedTasks: Task[] = [];
  
  // Basic date parsing and setup
  // We'll calculate work sequentially or using a dependency graph.
  // Since this is a simple linear/serial build of Lego with preparation and QA,
  // we can calculate the times securely in UID order, mapping predecessor dependencies!

  const startBase = new Date(`${profile.startDate}T${profile.startTime}:00`);

  // Simple state trackers to compute scheduling times based on constraints
  // Since we want robust computation:
  // Let's maintain a dictionary: uid -> finish Date
  const finishTimes: Record<number, Date> = {};

  // For computing the project timeline considering standard daily slots, sleep cycles, etc.
  // We simulate builder clock.
  // Let's build a helper that schedules a duration starting from a specific date/time,
  // respecting work hour limit per day, sleeping/off hours, and weekends.
  
  function addMinutesWorking(startDate: Date, durationMins: number): Date {
    if (durationMins <= 0) return new Date(startDate);

    let current = new Date(startDate);
    let remainingMinutes = durationMins;

    // Daily caps or continuous sprint?
    if (profile.dailyHoursLimit >= 24) {
      // Continuous sprint: no breaks, just direct arithmetic!
      current.setMinutes(current.getMinutes() + durationMins);
      return current;
    }

    // Daily limited schedules:
    // Say we can only work dailyHoursLimit hours per day (starting from the initial startTime daily).
    // E.g. work hours are active from 'startTime' to 'startTime + dailyHoursLimit'.
    // Say start hour is 08:30 (8.5). If daily limit is 2 hours, work window is 08:30 - 10:30 everyday.
    const startHourStr = profile.startTime.split(":");
    const workStartHour = parseInt(startHourStr[0], 10);
    const workStartMin = parseInt(startHourStr[1], 10);
    const dailyLimitMinutes = profile.dailyHoursLimit * 60;

    while (remainingMinutes > 0) {
      // Determine what the work bounds of the current day are.
      const currentDayStart = new Date(current);
      currentDayStart.setHours(workStartHour, workStartMin, 0, 0);

      const currentDayEnd = new Date(currentDayStart);
      currentDayEnd.setMinutes(currentDayEnd.getMinutes() + dailyLimitMinutes);

      // Handle weekends if weekends option is disabled
      const isWeekend = current.getDay() === 0 || current.getDay() === 6; // Sunday/Saturday
      if (isWeekend && !profile.workOnWeekends) {
        // Skip current day to next Monday start
        current.setDate(current.getDate() + (current.getDay() === 0 ? 1 : 2));
        current.setHours(workStartHour, workStartMin, 0, 0);
        continue;
      }

      // If current time is before today's work start, jump to start
      if (current < currentDayStart) {
        current = new Date(currentDayStart);
      }

      // If current time is after today's work end, jump to tomorrow's work start
      if (current >= currentDayEnd) {
        current.setDate(current.getDate() + 1);
        current.setHours(workStartHour, workStartMin, 0, 0);
        continue;
      }

      // How many minutes are left in the current shift?
      const minsLeftInShift = (currentDayEnd.getTime() - current.getTime()) / 60000;
      
      if (remainingMinutes <= minsLeftInShift) {
        current.setMinutes(current.getMinutes() + remainingMinutes);
        remainingMinutes = 0;
      } else {
        remainingMinutes -= minsLeftInShift;
        // Jump to next day start
        current.setDate(current.getDate() + 1);
        current.setHours(workStartHour, workStartMin, 0, 0);
      }
    }

    return current;
  }

  // Iterate the list and assign precise start and finish times
  list.forEach((item) => {
    const isSummary = item.summary;
    let actualDuration = 0;

    if (!isSummary && !item.isMilestone) {
      actualDuration = Math.round(item.baseDurationMinutes * profile.speedMultiplier);
    }

    // Determine when this task can start
    let earliestStart = new Date(startBase);
    
    if (item.predecessors.length > 0) {
      item.predecessors.forEach((predId) => {
        const predFinish = finishTimes[predId];
        if (predFinish && predFinish > earliestStart) {
          earliestStart = new Date(predFinish);
        }
      });
    }

    let finishDate: Date;
    if (isSummary) {
      // Summary start is arbitrary for now; we'll fix summary bounds in a second pass.
      finishDate = new Date(earliestStart);
    } else if (item.isMilestone) {
      finishDate = new Date(earliestStart);
    } else {
      finishDate = addMinutesWorking(earliestStart, actualDuration);
    }

    // Record finish time
    if (!isSummary) {
      finishTimes[item.uid] = finishDate;
    }

    initializedTasks.push({
      ...item,
      durationMinutes: actualDuration,
      start: earliestStart.toISOString(),
      finish: finishDate.toISOString(),
    } as Task);
  });

  // Second pass: Calculate proper Start/Finish and Duration bounds for Summary tasks (outlineLevel: 1)
  for (let i = 0; i < initializedTasks.length; i++) {
    const t = initializedTasks[i];
    if (t.summary) {
      // Find all subtasks belonging to this summary section (all task following until next level 1)
      const subtasks: Task[] = [];
      for (let j = i + 1; j < initializedTasks.length; j++) {
        if (initializedTasks[j].outlineLevel === 1) break;
        subtasks.push(initializedTasks[j]);
      }

      if (subtasks.length > 0) {
        let minStart = new Date(subtasks[0].start);
        let maxFinish = new Date(subtasks[0].finish);
        let totalSubDuration = 0;

        subtasks.forEach(st => {
          const stStart = new Date(st.start);
          const stFinish = new Date(st.finish);
          if (stStart < minStart) minStart = stStart;
          if (stFinish > maxFinish) maxFinish = stFinish;
          totalSubDuration += st.durationMinutes;
        });

        t.start = minStart.toISOString();
        t.finish = maxFinish.toISOString();
        t.durationMinutes = totalSubDuration;
        
        // Also update finishTimes mapping for summaries so they can be referenced as outline predecessors
        finishTimes[t.uid] = maxFinish;
      }
    }
  }

  return initializedTasks;
};

// Generates an MS Project native XML file
export function generateMSPXML(tasks: Task[], resources: Resource[], profile: BuilderProfile): string {
  const formatXMLDate = (iso: string) => {
    return iso.split('.')[0]; // MS Project likes YYYY-MM-DDTHH:MM:SS format without MS or Z
  };

  const projectStart = tasks.length > 0 ? formatXMLDate(tasks[0].start) : formatXMLDate(new Date().toISOString());
  const projectFinish = tasks.length > 0 ? formatXMLDate(tasks[tasks.length - 1].finish) : formatXMLDate(new Date().toISOString());

  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>Lego Millennium Falcon Project Schedule</Name>
  <Title>Lego Falcon Microfighter Build Blueprint</Title>
  <Company>Lego Builder Space</Company>
  <Author>AI Studio Build Scheduler</Author>
  <CreationDate>${projectStart}</CreationDate>
  <StartDate>${projectStart}</StartDate>
  <FinishDate>${projectFinish}</FinishDate>
  <DurationFormat>5</DurationFormat> <!-- Minutes -->
  <ScheduleFromStart>1</ScheduleFromStart>
  
  <Calendars>
    <Calendar>
      <UID>1</UID>
      <Name>Standard Lego Build Hour</Name>
      <IsBaseCalendar>1</IsBaseCalendar>
      <WeekDays>
        <WeekDay>
          <DayType>1</DayType> <!-- Sunday -->
          <DayWorking>${profile.workOnWeekends ? '1' : '0'}</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>2</DayType> <!-- Monday -->
          <DayWorking>1</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>3</DayType> <!-- Tuesday -->
          <DayWorking>1</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>4</DayType> <!-- Wednesday -->
          <DayWorking>1</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>5</DayType> <!-- Thursday -->
          <DayWorking>1</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>6</DayType> <!-- Friday -->
          <DayWorking>1</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>7</DayType> <!-- Saturday -->
          <DayWorking>${profile.workOnWeekends ? '1' : '0'}</DayWorking>
        </WeekDay>
      </WeekDays>
    </Calendar>
  </Calendars>
  
  <Resources>
    ${resources.map(r => `
    <Resource>
      <UID>${r.uid}</UID>
      <ID>${r.uid}</ID>
      <Name>${r.name} (${r.role})</Name>
      <Type>1</Type> <!-- Work Resource -->
      <MaxUnits>1.00</MaxUnits>
    </Resource>`).join('')}
  </Resources>
  
  <Tasks>
    ${tasks.map(t => {
      // Format Duration for MS Project. ISO 8601 duration format, e.g., PT1H20M0S or PT35M0S
      const durationVal = t.durationMinutes;
      const hours = Math.floor(durationVal / 60);
      const mins = durationVal % 60;
      const mspDurationStr = `PT${hours}H${mins}M0S`;

      // Find matched resource
      const resource = resources.find(r => r.uid === t.resourceId);
      const resName = resource ? escapeXml(resource.name) : "";

      return `
    <Task>
      <UID>${t.uid}</UID>
      <ID>${t.id}</ID>
      <Name>${escapeXml(t.name)}</Name>
      <Type>0</Type> <!-- Fixed Units -->
      <IsNull>0</IsNull>
      <CreateDate>${formatXMLDate(t.start)}</CreateDate>
      <Start>${formatXMLDate(t.start)}</Start>
      <Finish>${formatXMLDate(t.finish)}</Finish>
      <Duration>${mspDurationStr}</Duration>
      <DurationSeconds>${t.durationMinutes * 60}</DurationSeconds>
      <Manual>0</Manual>
      <PercentComplete>0</PercentComplete>
      <Priority>500</Priority>
      <Critical>0</Critical>
      <Milestone>${t.isMilestone ? '1' : '0'}</Milestone>
      <Summary>${t.summary ? '1' : '0'}</Summary>
      <OutlineLevel>${t.outlineLevel}</OutlineLevel>
      ${t.predecessors.map(pred => `
      <PredecessorLink>
        <PredecessorUID>${pred}</PredecessorUID>
        <Type>1</Type> <!-- Finish-to-Start -->
        <LinkLag>0</LinkLag>
        <LagFormat>7</LagFormat>
      </PredecessorLink>`).join('')}
      ${resource ? `
      <ResourceUID>${resource.uid}</ResourceUID>
      <ResourceNames>${resName}</ResourceNames>` : ''}
    </Task>`;
    }).join('')}
  </Tasks>
</Project>`;

  return xml.trim();
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

// Generates importable CSV for MS Project
export function generateCSV(tasks: Task[], resources: Resource[]): string {
  // Common MS Project CSV Headers
  const headers = ["ID", "Name", "OutlineLevel", "DurationMinutes", "Start", "Finish", "Predecessors", "ResourceNames", "Phase"];
  const rows = tasks.map(t => {
    const resource = resources.find(r => r.uid === t.resourceId);
    const resName = resource ? `"${resource.name} (${resource.role})"` : "";
    
    // Pred IDs need to be the task IDs (1, 2, 3...) of predecessors, not their UIDs
    const predIds = t.predecessors.map(pUid => {
      const predTask = tasks.find(pt => pt.uid === pUid);
      return predTask ? predTask.id : "";
    }).filter(id => id !== "").join(";");

    return [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      t.outlineLevel,
      t.durationMinutes,
      t.start,
      t.finish,
      predIds ? `"${predIds}"` : "",
      resName,
      `"${t.phase}"`
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
