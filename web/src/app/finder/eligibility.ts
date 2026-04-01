/**
 * Ajudes Finder — Eligibility Engine
 *
 * Pure TypeScript. No React, no API calls, no side effects.
 * Returns a Verdict for each of the 3 BAJ programs given the user's answers.
 *
 * Programs:
 *   - nacional: Bo Alquiler Joven (MIVAU / estado)
 *   - barcelona: Bo Municipal Habitatge Jove (Ajuntament Barcelona)
 *   - generalitat: Bo Lloguer Jove (Generalitat de Catalunya)
 */

import type { FinderAnswers, LocationAnswer, RentAnswer } from './questions';

export type Verdict = 'ELIGIBLE' | 'POSSIBLE' | 'NOT_ELIGIBLE';

export interface ProgramVerdict {
  programId: 'nacional' | 'barcelona' | 'generalitat';
  verdict: Verdict;
  /** Human-readable reason for NOT_ELIGIBLE. Empty string if not disqualified. */
  disqualifierReason: string;
  /** Signals that had 'unknown' values — relevant for POSSIBLE verdicts */
  uncertainties: string[];
}

export interface EligibilityResult {
  nacional: ProgramVerdict;
  barcelona: ProgramVerdict;
  generalitat: ProgramVerdict;
  /** True if all programs are NOT_ELIGIBLE — triggers early exit in wizard */
  allDisqualified: boolean;
}

// Rent caps by location and contract type (€/month)
// Source: Official BAJ 2026 criteria (scrapped from MIVAU, Ajuntament BCN, Generalitat)
const RENT_CAP: Record<string, Record<'pis' | 'habitacio', number>> = {
  barcelona:      { pis: 950, habitacio: 450 },
  amb:            { pis: 950, habitacio: 450 },
  'rest-catalonia': { pis: 750, habitacio: 450 },
  unknown:        { pis: 600, habitacio: 450 }, // conservative
};

// Maximum rent values mapped from RentAnswer
const RENT_VALUE: Record<RentAnswer, number> = {
  'up-to-450':  450,
  'up-to-600':  600,
  'up-to-700':  700,
  'up-to-750':  750,
  'up-to-900':  900,
  'up-to-950':  950,
  'over-950':   9999, // effectively infinite
};

function getRentValue(rent: RentAnswer | undefined): number | undefined {
  if (!rent) return undefined;
  return RENT_VALUE[rent];
}

function getContractCategory(answers: FinderAnswers): 'pis' | 'habitacio' | null {
  if (answers.contractType === 'room') return 'habitacio';
  if (answers.contractType === 'full-apartment' || answers.contractType === 'cession') return 'pis';
  return null;
}

function makeVerdict(
  programId: ProgramVerdict['programId'],
  verdict: Verdict,
  disqualifierReason: string,
  uncertainties: string[],
): ProgramVerdict {
  return { programId, verdict, disqualifierReason, uncertainties };
}

/**
 * Evaluates eligibility for all 3 BAJ programs given the current answers.
 * Can be called at any point in the wizard (partial answers are fine).
 */
export function computeEligibility(answers: FinderAnswers): EligibilityResult {
  const nacional = evaluateNacional(answers);
  const barcelona = evaluateBarcelona(answers);
  const generalitat = evaluateGeneralitat(answers);

  const allDisqualified =
    nacional.verdict === 'NOT_ELIGIBLE' &&
    barcelona.verdict === 'NOT_ELIGIBLE' &&
    generalitat.verdict === 'NOT_ELIGIBLE';

  return { nacional, barcelona, generalitat, allDisqualified };
}

// ─── Global disqualifiers (apply to all 3 programs) ────────────────────────

function checkGlobalDisqualifiers(answers: FinderAnswers): string | null {
  if (answers.age === 'under-18' || answers.age === 'over-35') {
    return 'Cal tenir entre 18 i 35 anys per accedir al Bo Alquiler Joven.';
  }
  if (answers.income === 'over-25200') {
    return 'Els ingressos superen el límit de 25.200 €/any.';
  }
  if (answers.habitual === 'no') {
    return 'L\'habitatge ha de ser la residència habitual i estar-hi empadronat/ada.';
  }
  if (answers.ownsProperty === 'yes-can-use') {
    return 'Tens un habitatge en propietat al qual pots accedir.';
  }
  if (answers.contractType === 'no-contract') {
    return 'Cal un contracte formal de lloguer per sol·licitar les ajudes.';
  }
  return null;
}

// ─── Nacional (MIVAU) ───────────────────────────────────────────────────────

function evaluateNacional(answers: FinderAnswers): ProgramVerdict {
  const disqualifier = checkGlobalDisqualifiers(answers);
  if (disqualifier) return makeVerdict('nacional', 'NOT_ELIGIBLE', disqualifier, []);

  const uncertainties: string[] = [];

  // Rent check
  if (answers.rent && answers.rent === 'over-950') {
    return makeVerdict('nacional', 'NOT_ELIGIBLE', 'El lloguer supera el límit de 900 €/mes (zones tensionades) o 600 €/mes (resta).', []);
  }
  if (!answers.rent) uncertainties.push('lloguer mensual');

  // Unknowns
  if (!answers.age) uncertainties.push('edat');
  if (!answers.income || answers.income === 'unknown') uncertainties.push('ingressos');
  if (!answers.contractType || answers.contractType === 'other') uncertainties.push('tipus de contracte');
  if (!answers.habitual) uncertainties.push('residència habitual');
  if (!answers.ownsProperty) uncertainties.push('propietat d\'habitatge');
  if (answers.ownsProperty === 'justified-exception') uncertainties.push('excepció de propietat (cal acreditació)');

  const verdict: Verdict = uncertainties.length > 0 ? 'POSSIBLE' : 'ELIGIBLE';
  return makeVerdict('nacional', verdict, '', uncertainties);
}

// ─── Barcelona Municipal ─────────────────────────────────────────────────────

function evaluateBarcelona(answers: FinderAnswers): ProgramVerdict {
  const disqualifier = checkGlobalDisqualifiers(answers);
  if (disqualifier) return makeVerdict('barcelona', 'NOT_ELIGIBLE', disqualifier, []);

  // Location: must be Barcelona city
  if (answers.location && answers.location !== 'barcelona') {
    return makeVerdict('barcelona', 'NOT_ELIGIBLE', 'El Bo Municipal és exclusiu per al municipi de Barcelona.', []);
  }

  // Cession not allowed by Barcelona municipal program
  if (answers.contractType === 'cession') {
    return makeVerdict('barcelona', 'NOT_ELIGIBLE', 'El Bo Municipal de Barcelona no cobreix contractes de cessió d\'ús.', []);
  }

  // Family landlord
  if (answers.familyLandlord === 'yes') {
    return makeVerdict('barcelona', 'NOT_ELIGIBLE', 'El Bo Municipal no s\'aplica quan el propietari és familiar.', []);
  }

  // Rent cap: 900 (pis) / 450 (habitació)
  const contractCat = getContractCategory(answers);
  const rentValue = getRentValue(answers.rent);
  if (contractCat && rentValue !== undefined) {
    const cap = contractCat === 'habitacio' ? 450 : 900;
    if (rentValue > cap) {
      return makeVerdict('barcelona', 'NOT_ELIGIBLE', `El lloguer supera el límit de ${cap} €/mes per al Bo Municipal de Barcelona.`, []);
    }
  }

  const uncertainties: string[] = [];
  if (!answers.location) uncertainties.push('localització (ha de ser Barcelona)');
  if (!answers.age) uncertainties.push('edat');
  if (!answers.income || answers.income === 'unknown') uncertainties.push('ingressos');
  if (!answers.rent) uncertainties.push('lloguer mensual');
  if (!answers.familyLandlord || answers.familyLandlord === 'unknown') uncertainties.push('relació amb el propietari');
  if (answers.ownsProperty === 'justified-exception') uncertainties.push('excepció de propietat (cal acreditació)');

  const verdict: Verdict = uncertainties.length > 0 ? 'POSSIBLE' : 'ELIGIBLE';
  return makeVerdict('barcelona', verdict, '', uncertainties);
}

// ─── Generalitat (Bo Lloguer Jove) ──────────────────────────────────────────

function evaluateGeneralitat(answers: FinderAnswers): ProgramVerdict {
  const disqualifier = checkGlobalDisqualifiers(answers);
  if (disqualifier) return makeVerdict('generalitat', 'NOT_ELIGIBLE', disqualifier, []);

  // Family landlord
  if (answers.familyLandlord === 'yes') {
    return makeVerdict('generalitat', 'NOT_ELIGIBLE', 'El Bo Lloguer Jove no s\'aplica quan el propietari és familiar fins a 2n grau.', []);
  }

  // Tax obligations
  if (answers.taxCurrent === 'no') {
    return makeVerdict('generalitat', 'NOT_ELIGIBLE', 'Cal estar al corrent d\'obligacions tributàries i amb la Seguretat Social.', []);
  }

  // Zone-based rent cap
  const loc = (answers.location ?? 'unknown') as LocationAnswer;
  const contractCat = getContractCategory(answers);
  const rentValue = getRentValue(answers.rent);

  if (contractCat && rentValue !== undefined) {
    const zoneCaps = RENT_CAP[loc] ?? RENT_CAP['unknown']!;
    const cap = zoneCaps[contractCat];
    if (rentValue > cap) {
      return makeVerdict('generalitat', 'NOT_ELIGIBLE', `El lloguer supera el límit de ${cap} €/mes per a la zona (${loc === 'unknown' ? 'conservador' : loc}).`, []);
    }
  }

  const uncertainties: string[] = [];
  if (!answers.age) uncertainties.push('edat');
  if (!answers.income || answers.income === 'unknown') uncertainties.push('ingressos');
  if (!answers.rent) uncertainties.push('lloguer mensual');
  if (!answers.familyLandlord || answers.familyLandlord === 'unknown') uncertainties.push('relació amb el propietari');
  if (!answers.taxCurrent || answers.taxCurrent === 'unknown') uncertainties.push('obligacions tributàries');
  if (answers.ownsProperty === 'justified-exception') uncertainties.push('excepció de propietat (cal acreditació)');

  const verdict: Verdict = uncertainties.length > 0 ? 'POSSIBLE' : 'ELIGIBLE';
  return makeVerdict('generalitat', verdict, '', uncertainties);
}

/**
 * Builds a natural-language context string for the RAG chat handoff.
 * Encodes relevant information about the user's situation and eligibility.
 */
export function buildChatContext(answers: FinderAnswers, result: EligibilityResult): string {
  const parts: string[] = [];

  if (answers.age) {
    parts.push(`Tinc ${answers.age === '18-35' ? 'entre 18 i 35' : answers.age === 'under-18' ? 'menys de 18' : 'més de 35'} anys`);
  }
  if (answers.location) {
    const locationLabel: Record<string, string> = {
      barcelona: 'Barcelona ciutat',
      amb: 'AMB (Àrea Metropolitana)',
      'rest-catalonia': 'resta de Catalunya',
      unknown: 'ubicació no determinada',
    };
    parts.push(`vull llogar a ${locationLabel[answers.location] ?? answers.location}`);
  }
  if (answers.income) {
    parts.push(`ingressos ${answers.income === 'under-25200' ? 'inferiors a 25.200 €/any' : answers.income === 'over-25200' ? 'superiors a 25.200 €/any' : 'no confirmats'}`);
  }
  if (answers.contractType) {
    const ctLabel: Record<string, string> = {
      'full-apartment': 'pis sencer',
      room: 'habitació',
      cession: 'cessió d\'ús',
      'no-contract': 'sense contracte',
      other: 'altre',
    };
    parts.push(`contracte de ${ctLabel[answers.contractType] ?? answers.contractType}`);
  }
  if (answers.rent) {
    const rentLabel: Record<RentAnswer, string> = {
      'up-to-450': 'fins a 450€/mes',
      'up-to-600': 'fins a 600€/mes',
      'up-to-700': 'fins a 700€/mes',
      'up-to-750': 'fins a 750€/mes',
      'up-to-900': 'fins a 900€/mes',
      'up-to-950': 'fins a 950€/mes',
      'over-950': 'més de 950€/mes',
    };
    parts.push(`lloguer ${rentLabel[answers.rent]}`);
  }

  const situation = parts.length > 0 ? `Situació: ${parts.join(', ')}. ` : '';

  const programNames: Record<ProgramVerdict['programId'], string> = {
    nacional: 'Bo Alquiler Joven (estatal)',
    barcelona: 'Bo Municipal Habitatge Jove (Barcelona)',
    generalitat: 'Bo Lloguer Jove (Generalitat)',
  };

  const verdictParts = (Object.values(result) as ProgramVerdict[])
    .filter((v): v is ProgramVerdict => typeof v === 'object' && 'programId' in v)
    .map(v => `${programNames[v.programId]}: ${v.verdict}`)
    .join(', ');

  return `${situation}Resultat del verificador d'ajudes: ${verdictParts}. Pots explicar-me més sobre com sol·licitar aquestes ajudes i quins documents necessito?`;
}
