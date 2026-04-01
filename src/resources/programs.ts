/**
 * Active Housing Programs Database
 *
 * Simple in-memory store for MVP.
 * Can be migrated to DB later without changing the interface.
 */

export interface Program {
  id: string;
  name: string;
  description: string;
  amount?: string;
  deadline?: string;        // DD-MM-YYYY
  windowStart?: string;     // DD-MM-YYYY — start of application window
  windowEnd?: string;       // DD-MM-YYYY — end of application window
  status: 'open' | 'closed' | 'upcoming';
  requirements: string[];
  url: string;
  region: 'catalunya' | 'barcelona' | 'spain';
  rentCapPis?: number;       // max rent (€/month) for full apartment
  rentCapHabitacio?: number; // max rent (€/month) for room
}

// Programs data — updated with 2026 BAJ official criteria
const PROGRAMS: Program[] = [
  {
    id: 'bono-alquiler-joven-nacional',
    name: 'Bono Alquiler Joven — Estatal (MIVAU)',
    description: 'Ajuda estatal de fins a 250€/mes durant 24 mesos per a joves de 18-35 anys a tot l\'estat',
    amount: '250€/mes × 24 mesos',
    status: 'open',
    rentCapPis: 900,
    rentCapHabitacio: 450,
    requirements: [
      'Edat: 18-35 anys',
      'Ingressos ≤ 25.200€ bruts/any (3× IPREM)',
      'Lloguer ≤ 600€/mes o ≤ 900€/mes (zones tensionades)',
      'Residència habitual i empadronament',
      'No ser propietari d\'un altre habitatge accessible',
      'Contracte de lloguer formal',
    ],
    url: 'https://www.mivau.gob.es/vivienda/ayudas-y-financiacion/bono-alquiler-joven',
    region: 'spain',
  },
  {
    id: 'bo-municipal-habitatge-jove-barcelona',
    name: 'Bo Municipal Habitatge Jove — Barcelona',
    description: 'Ajuda municipal de fins a 250€/mes durant 24 mesos exclusiva per al municipi de Barcelona',
    amount: '250€/mes × 24 mesos',
    deadline: '13-03-2026',
    windowStart: '09-03-2026',
    windowEnd: '13-03-2026',
    status: 'open',
    rentCapPis: 900,
    rentCapHabitacio: 450,
    requirements: [
      'Edat: 18-35 anys',
      'Residir al municipi de Barcelona',
      'Ingressos ≤ 25.200€ bruts/any',
      'Lloguer ≤ 900€/mes (pis) o ≤ 450€/mes (habitació)',
      'Residència habitual i empadronament',
      'No ser propietari d\'un habitatge al qual es pugui accedir',
      'Propietari/ària no familiar',
      'No cessió d\'ús',
    ],
    url: 'https://habitatge.barcelona/ca/tramits-serveis/bo-municipal-habitatge-jove',
    region: 'barcelona',
  },
  {
    id: 'bo-lloguer-jove-generalitat',
    name: 'Bo Lloguer Jove — Generalitat de Catalunya',
    description: 'Ajuda de la Generalitat de 20–250€/mes durant 24 mesos per a joves a Catalunya',
    amount: '20-250€/mes × 24 mesos',
    deadline: '13-03-2026',
    windowStart: '09-03-2026',
    windowEnd: '13-03-2026',
    status: 'open',
    rentCapPis: 950,       // BCN/AMB; 750 Girona; 700 Tarragona; 600 Lleida
    rentCapHabitacio: 450,
    requirements: [
      'Edat: 18-35 anys',
      'Residir a Catalunya',
      'Ingressos ≤ 25.200€ bruts/any',
      'Lloguer dins del cap per zona (fins a 950€/mes AMB, 750€ Girona...)',
      'Residència habitual i empadronament',
      'No ser propietari d\'un habitatge accessible',
      'Propietari/ària no familiar (fins a 2n grau)',
      'Al corrent d\'obligacions tributàries i Seguretat Social',
    ],
    url: 'https://habitatge.gencat.cat/ca/detalls/Tramits/22866_Bo_lloguer_joves',
    region: 'catalunya',
  },
  {
    id: 'borsa-jove-habitatge',
    name: 'Borsa Jove d\'Habitatge',
    description: 'Programa d\'intermediació amb habitatges a preus per sota de mercat',
    status: 'open',
    requirements: [
      'Edat: 18-35 anys',
      'Ingressos segons barems',
    ],
    url: 'https://habitatge.gencat.cat',
    region: 'catalunya',
  },
];

/**
 * Get all programs, optionally filtered
 */
export function getPrograms(filters?: {
  status?: Program['status'];
  region?: Program['region'];
}): Program[] {
  let result = [...PROGRAMS];

  if (filters?.status) {
    result = result.filter(p => p.status === filters.status);
  }
  if (filters?.region) {
    result = result.filter(p => p.region === filters.region);
  }

  return result;
}

/**
 * Get program by ID
 */
export function getProgramById(id: string): Program | undefined {
  return PROGRAMS.find(p => p.id === id);
}

/**
 * Get programs with upcoming deadlines (next 30 days)
 */
export function getUpcomingDeadlines(): Program[] {
  const today = new Date();
  const thirtyDays = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return PROGRAMS.filter(p => {
    if (!p.deadline) return false;

    const [day, month, year] = p.deadline.split('-').map(Number);
    const deadlineDate = new Date(year!, month! - 1, day);

    return deadlineDate >= today && deadlineDate <= thirtyDays;
  });
}
