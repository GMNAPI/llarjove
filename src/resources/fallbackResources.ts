/**
 * Official resources database for actionable fallback
 * Used when RAG confidence=none to provide users with concrete next steps
 */

import type { ActionableResource } from '../types.js';

/**
 * Curated list of official Catalan housing resources
 * Sorted by relevance and trustworthiness
 */
export const OFFICIAL_SOURCES: ActionableResource[] = [
  // Primary aid portal
  {
    title: "Agència de l'Habitatge de Catalunya",
    url: 'https://habitatge.gencat.cat',
    description: "Portal oficial d'ajudes a l'habitatge i informació general",
    category: 'aid',
  },

  // Specific aid programs
  {
    title: 'Bono Alquiler Joven 2025',
    url: 'https://tramits.gencat.cat/es/tramits/tramits-temes/22866_Bo_lloguer_joves',
    description: "Sol·licitud del Bo Lloguer Joves (250€/mes)",
    category: 'aid',
  },
  {
    title: 'Borsa Jove d\'Habitatge de Barcelona',
    url: 'https://www.barcelona.cat/joves/ca/canal/borsa-jove-dhabitatge',
    description: 'Pisos assequibles per a joves a Barcelona',
    category: 'aid',
  },
  {
    title: 'Ajuts per pagar el lloguer',
    url: 'https://web.gencat.cat/ca/tramits/tramits-temes/Ajuts-per-pagar-el-lloguer',
    description: 'Prestació econòmica de Serveis Socials per dificultats',
    category: 'aid',
  },

  // Legal resources
  {
    title: 'Llei d\'Arrendaments Urbans (LAU)',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1994-26003',
    description: 'Normativa oficial de contractes de lloguer',
    category: 'legal',
  },
  {
    title: 'Llei del Dret a l\'Habitatge 2023',
    url: 'https://portaljuridic.gencat.cat/eli/es-ct/l/2023/03/21/1',
    description: 'Zones tensionades i limitació de preus',
    category: 'legal',
  },
  {
    title: 'Oficina Local d\'Habitatge',
    url: 'https://habitatge.gencat.cat/ca/serveis/oficines_locals_dhabitatge/',
    description: 'Troba la teva oficina municipal més propera',
    category: 'general',
  },

  // General support
  {
    title: 'Punt d\'Informació i Assessorament (PAH)',
    url: 'https://afectadosporlahipoteca.com/',
    description: 'Assessorament ciutadà sobre habitatge',
    category: 'general',
  },
  {
    title: 'Sindicato de Inquilinas',
    url: 'https://sindicatdellogateres.org/',
    description: 'Defensa col·lectiva dels drets dels inquilins',
    category: 'general',
  },
];

/**
 * Category detection patterns
 * Used to classify user questions and retrieve relevant resources
 */
const CATEGORY_PATTERNS = {
  aid: /bono|bono joven|bo lloguer|ajud[ae]|subvenci[óo]|prestaci[óo]|borsa jove|programa|sol·licitud|solicitud/i,
  contract: /contrat[oe]|contracte|firma|signar|cl[áa]usul[ae]|rescindir|renovar|desistimiento/i,
  legal: /llei|ley|dret|derecho|inquil[íi]|arrendament|normativa|zona tensionada|limitaci[óo]|LAU|LPH/i,
  barcelona: /barcelona|bcn|ajuntament/i,
  generic: /.*/,  // Catch-all
};

/**
 * Get relevant resources based on question context
 * @param question User's original question
 * @param maxResources Maximum number of resources to return
 * @returns Array of relevant ActionableResource objects
 */
export function getRelevantResources(
  question: string,
  maxResources: number = 3
): ActionableResource[] {
  const lowerQuestion = question.toLowerCase();

  // Detect primary category
  let primaryCategory: 'aid' | 'legal' | 'general' = 'general';

  if (CATEGORY_PATTERNS.aid.test(lowerQuestion)) {
    primaryCategory = 'aid';
  } else if (CATEGORY_PATTERNS.legal.test(lowerQuestion) || CATEGORY_PATTERNS.contract.test(lowerQuestion)) {
    primaryCategory = 'legal';
  }

  // Barcelona-specific boost
  const barcelonaBoost = CATEGORY_PATTERNS.barcelona.test(lowerQuestion) ? 1 : 0;

  // Filter and rank resources
  const scored = OFFICIAL_SOURCES.map((resource) => {
    let score = 0;

    // Specific program mentions (highest priority)
    if (lowerQuestion.includes('bono joven') || lowerQuestion.includes('bo jove') || lowerQuestion.includes('bono alquiler')) {
      if (resource.title.includes('Bono Alquiler Joven')) score += 20;
    }
    if (lowerQuestion.includes('borsa jove')) {
      if (resource.title.includes('Borsa Jove')) score += 20;
    }
    if (lowerQuestion.includes('solicitar') || lowerQuestion.includes('sol·licitar')) {
      if (resource.title.includes('Bono') || resource.title.includes('Borsa') || resource.title.includes('Ajuts')) score += 5;
    }

    // Category match
    if (resource.category === primaryCategory) {
      score += 10;
    } else if (resource.category === 'general') {
      score += 3;  // General resources are always somewhat relevant
    }

    // Barcelona-specific resource
    if (barcelonaBoost && resource.url.includes('barcelona.cat')) {
      score += 8;
    }

    return { resource, score };
  });

  // Sort by score descending and take top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResources)
    .map((item) => item.resource);
}

/**
 * Get default fallback resources when no specific context is detected
 * Returns the most general and reliable sources
 */
export function getDefaultResources(): ActionableResource[] {
  return [
    OFFICIAL_SOURCES[0],  // Agència de l'Habitatge
    OFFICIAL_SOURCES[6],  // Oficina Local
    OFFICIAL_SOURCES[7],  // PAH
  ].filter((resource): resource is ActionableResource => resource !== undefined);
}
