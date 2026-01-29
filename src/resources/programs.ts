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
  status: 'open' | 'closed' | 'upcoming';
  requirements: string[];
  url: string;
  region: 'catalunya' | 'barcelona' | 'spain';
}

// Programs data - easily updatable
const PROGRAMS: Program[] = [
  {
    id: 'bono-alquiler-joven-2025',
    name: 'Bono Alquiler Joven 2025',
    description: 'Ajuda estatal de fins a 250€/mes durant 24 mesos per a joves de 18-35 anys',
    amount: '250€/mes',
    deadline: '11-07-2025',
    status: 'upcoming',
    requirements: [
      'Edat: 18-35 anys',
      'Ingressos ≤ 25.200€ bruts/any',
      'Lloguer ≤ 900€/mes (zones tensionades)',
      'No ser propietari d\'un altre habitatge',
      'Estar empadronat a l\'habitatge',
    ],
    url: 'https://tramits.gencat.cat/es/tramits/tramits-temes/22866_Bo_lloguer_joves',
    region: 'catalunya',
  },
  {
    id: 'ajudes-lloguer-generalitat',
    name: 'Ajudes al lloguer Generalitat',
    description: 'Ajudes complementàries per a qui no obtingui el Bono Joven',
    amount: '20-250€/mes',
    status: 'upcoming',
    requirements: [
      'Residir a Catalunya',
      'Ingressos segons barems',
      'Contracte de lloguer vigent',
    ],
    url: 'https://habitatge.gencat.cat',
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
