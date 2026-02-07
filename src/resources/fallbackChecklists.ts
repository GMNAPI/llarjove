/**
 * Contextual verification checklists for actionable fallback
 * Provides concrete next steps based on question category
 */

import type { VerificationChecklist } from '../types.js';

/**
 * Predefined checklists by category
 * Each checklist provides 2-5 actionable steps
 */
export const CHECKLISTS: Record<string, VerificationChecklist> = {
  aid: {
    title: 'Passos per sol·licitar ajudes',
    steps: [
      'Comprova que compleixes els requisits d\'edat (generalment 18-35 anys)',
      'Calcula els teus ingressos anuals bruts i verifica els límits',
      'Assegura\'t que el lloguer està dins dels límits establerts',
      'Revisa les dates de convocatòria i terminis de sol·licitud',
      'Prepara la documentació necessària (DNI, contracte, nòmines)',
    ],
  },

  contract: {
    title: 'Què has de verificar abans de signar',
    steps: [
      'Revisa la durada mínima del contracte (normalment 5 anys)',
      'Comprova que consta la fiança (1 mes de lloguer)',
      'Assegura\'t que el preu és correcte i està dins dels límits legals',
      'Verifica que no hi ha clàusules abusives',
      'Sol·licita que s\'especifiquin les despeses incloses',
    ],
  },

  legal: {
    title: 'Com conèixer els teus drets',
    steps: [
      'Consulta la Llei d\'Arrendaments Urbans (LAU) vigent',
      'Verifica si el teu municipi està en zona tensionada',
      'Contacta l\'Oficina Local d\'Habitatge del teu municipi',
      'Si tens un conflicte, busca assessorament legal especialitzat',
    ],
  },

  barcelona: {
    title: 'Recursos específics de Barcelona',
    steps: [
      'Consulta la Borsa Jove d\'Habitatge per pisos assequibles',
      'Contacta amb l\'Oficina d\'Habitatge de Barcelona',
      'Verifica si pots accedir a ajudes municipals addicionals',
      'Revisa els programes de l\'Ajuntament per a joves',
    ],
  },

  generic: {
    title: 'Com trobar més informació',
    steps: [
      'Visita l\'Agència de l\'Habitatge de Catalunya (habitatge.gencat.cat)',
      'Contacta l\'Oficina Local d\'Habitatge del teu municipi',
      'Si tens dubtes legals, consulta un professional especialitzat',
    ],
  },
};

/**
 * Category detection patterns
 * Same patterns as in fallbackResources.ts for consistency
 */
const CATEGORY_PATTERNS = {
  aid: /bono|bono joven|bo lloguer|ajud[ae]|subvenci[óo]|prestaci[óo]|borsa jove|programa|sol·licitud|solicitud/i,
  contract: /contrat[oe]|contracte|firma|signar|cl[áa]usul[ae]|rescindir|renovar|desistimiento/i,
  legal: /llei|ley|dret|derecho|inquil[íi]|arrendament|normativa|zona tensionada|limitaci[óo]|LAU|LPH/i,
  barcelona: /barcelona|bcn|ajuntament/i,
};

/**
 * Get relevant checklist based on question context
 * @param question User's original question
 * @returns Contextual verification checklist
 */
export function getRelevantChecklist(question: string): VerificationChecklist {
  const lowerQuestion = question.toLowerCase();

  // Barcelona has priority (most specific)
  if (CATEGORY_PATTERNS.barcelona.test(lowerQuestion)) {
    return CHECKLISTS['barcelona']!;
  }

  // Detect primary category
  if (CATEGORY_PATTERNS.aid.test(lowerQuestion)) {
    return CHECKLISTS['aid']!;
  }

  if (CATEGORY_PATTERNS.contract.test(lowerQuestion)) {
    return CHECKLISTS['contract']!;
  }

  if (CATEGORY_PATTERNS.legal.test(lowerQuestion)) {
    return CHECKLISTS['legal']!;
  }

  // Default fallback
  return CHECKLISTS['generic']!;
}
