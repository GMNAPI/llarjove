/**
 * Ajudes Finder — Question Schema & Answer Types
 *
 * Defines the 8-question flow for the BAJ eligibility wizard.
 * Pure data — no React dependencies.
 */

export type AgeAnswer = 'under-18' | '18-35' | 'over-35';
export type LocationAnswer = 'barcelona' | 'amb' | 'rest-catalonia' | 'unknown';
export type IncomeAnswer = 'under-25200' | 'over-25200' | 'unknown';
export type ContractTypeAnswer = 'full-apartment' | 'room' | 'cession' | 'no-contract' | 'other';
export type HabitualAnswer = 'yes' | 'no';
export type OwnsPropertyAnswer = 'no' | 'justified-exception' | 'yes-can-use';
export type RentAnswer = 'up-to-450' | 'up-to-600' | 'up-to-700' | 'up-to-750' | 'up-to-900' | 'up-to-950' | 'over-950';
export type FamilyLandlordAnswer = 'yes' | 'no' | 'unknown';
export type TaxCurrentAnswer = 'yes' | 'no' | 'unknown';

export interface FinderAnswers {
  age?: AgeAnswer;
  location?: LocationAnswer;
  income?: IncomeAnswer;
  contractType?: ContractTypeAnswer;
  habitual?: HabitualAnswer;
  ownsProperty?: OwnsPropertyAnswer;
  rent?: RentAnswer;
  familyLandlord?: FamilyLandlordAnswer;
  taxCurrent?: TaxCurrentAnswer;
}

export type QuestionId = keyof FinderAnswers;

export interface QuestionOption<T extends string = string> {
  value: T;
  label: string;
  sublabel?: string;
}

export interface Question<T extends string = string> {
  id: QuestionId;
  title: string;
  subtitle?: string;
  options: QuestionOption<T>[];
}

// The ordered list of question IDs for the wizard flow
export const QUESTION_ORDER: QuestionId[] = [
  'age',
  'location',
  'income',
  'contractType',
  'habitual',
  'ownsProperty',
  'rent',
  'familyLandlord',
];

// Question definitions
export const QUESTIONS: Record<QuestionId, Question> = {
  age: {
    id: 'age',
    title: 'Quants anys tens?',
    subtitle: 'Les ajudes al Bo Alquiler Joven estan limitades per franja d\'edat.',
    options: [
      { value: 'under-18', label: 'Menys de 18 anys' },
      { value: '18-35', label: '18 a 35 anys' },
      { value: 'over-35', label: 'Més de 35 anys' },
    ] satisfies QuestionOption<AgeAnswer>[],
  },

  location: {
    id: 'location',
    title: 'On vius o vols llogar?',
    subtitle: 'La localització determina quins programes i límits de lloguer s\'apliquen.',
    options: [
      { value: 'barcelona', label: 'Barcelona ciutat', sublabel: 'Municipi de Barcelona' },
      { value: 'amb', label: 'AMB (Àrea Metropolitana)', sublabel: 'Badalona, Hospitalet, Cornellà...' },
      { value: 'rest-catalonia', label: 'Resta de Catalunya', sublabel: 'Girona, Tarragona, Lleida, altres' },
      { value: 'unknown', label: 'Encara no ho sé' },
    ] satisfies QuestionOption<LocationAnswer>[],
  },

  income: {
    id: 'income',
    title: 'Quins són els teus ingressos anuals bruts?',
    subtitle: 'El límit general és 25.200 €/any (IPREM × 3). Inclou tots els ingressos de la unitat familiar.',
    options: [
      { value: 'under-25200', label: 'Menys de 25.200 €/any', sublabel: 'Compleixo el requisit d\'ingressos' },
      { value: 'over-25200', label: 'Més de 25.200 €/any', sublabel: 'Supero el límit' },
      { value: 'unknown', label: 'No estic segur/a', sublabel: 'Comprovo la declaració de renda' },
    ] satisfies QuestionOption<IncomeAnswer>[],
  },

  contractType: {
    id: 'contractType',
    title: 'Quin tipus de contracte tens o vols signar?',
    subtitle: 'El tipus de contracte afecta quins programes pots sol·licitar.',
    options: [
      { value: 'full-apartment', label: 'Lloguer de pis sencer' },
      { value: 'room', label: 'Lloguer d\'habitació', sublabel: 'Contracte d\'arrendament d\'habitació' },
      { value: 'cession', label: 'Cessió d\'ús', sublabel: 'Habitatge de cooperativa o similar' },
      { value: 'no-contract', label: 'Sense contracte formal', sublabel: 'Acord de paraula o similar' },
      { value: 'other', label: 'Altre tipus' },
    ] satisfies QuestionOption<ContractTypeAnswer>[],
  },

  habitual: {
    id: 'habitual',
    title: 'Serà la teva residència habitual?',
    subtitle: 'Has d\'estar empadronat/ada a l\'habitatge per poder sol·licitar les ajudes.',
    options: [
      { value: 'yes', label: 'Sí, serà on estic empadronat/ada' },
      { value: 'no', label: 'No, és una segona residència o temporal' },
    ] satisfies QuestionOption<HabitualAnswer>[],
  },

  ownsProperty: {
    id: 'ownsProperty',
    title: 'Ets propietari/ària d\'algun habitatge?',
    subtitle: 'No pots tenir un habitatge disponible per al teu ús.',
    options: [
      { value: 'no', label: 'No, no tinc cap habitatge en propietat' },
      { value: 'justified-exception', label: 'Sí, però no puc accedir-hi', sublabel: 'Per separació, accessibilitat o causa acreditada' },
      { value: 'yes-can-use', label: 'Sí, i hi podria viure' },
    ] satisfies QuestionOption<OwnsPropertyAnswer>[],
  },

  rent: {
    id: 'rent',
    title: 'Quin és o seria el lloguer mensual?',
    options: [] as QuestionOption<RentAnswer>[], // Generated dynamically based on location + contractType
  },

  familyLandlord: {
    id: 'familyLandlord',
    title: 'El propietari/ària és familiar teu?',
    subtitle: 'Alguns programes exclouen lloguers entre familiars fins a 2n grau (pares, germans, avis, oncles).',
    options: [
      { value: 'no', label: 'No, no hi ha relació familiar' },
      { value: 'yes', label: 'Sí, és familiar meu' },
      { value: 'unknown', label: 'No estic segur/a' },
    ] satisfies QuestionOption<FamilyLandlordAnswer>[],
  },

  taxCurrent: {
    id: 'taxCurrent',
    title: 'Estàs al corrent de les obligacions tributàries?',
    subtitle: 'La Generalitat requereix estar al corrent amb Hisenda i Seguretat Social.',
    options: [
      { value: 'yes', label: 'Sí, estic al corrent' },
      { value: 'no', label: 'No, tinc deutes pendents' },
      { value: 'unknown', label: 'No ho sé amb seguretat' },
    ] satisfies QuestionOption<TaxCurrentAnswer>[],
  },
};

/**
 * Returns dynamic rent options based on location and contract type.
 * Labels adapt to show contextual max thresholds.
 */
export function getRentOptions(
  location: LocationAnswer | undefined,
  contractType: ContractTypeAnswer | undefined,
): QuestionOption<RentAnswer>[] {
  const isRoom = contractType === 'room';

  if (isRoom) {
    return [
      { value: 'up-to-450', label: 'Fins a 450 €/mes', sublabel: 'Dins del límit per habitació' },
      { value: 'over-950', label: 'Més de 450 €/mes', sublabel: 'Supera el límit per habitació' },
    ];
  }

  const cap =
    location === 'barcelona' || location === 'amb' ? 950
    : location === 'rest-catalonia' ? 750
    : 600; // unknown → conservative

  const baseOptions: QuestionOption<RentAnswer>[] = [
    { value: 'up-to-600', label: 'Fins a 600 €/mes' },
    { value: 'up-to-700', label: '601 – 700 €/mes' },
    { value: 'up-to-750', label: '701 – 750 €/mes' },
    { value: 'up-to-900', label: '751 – 900 €/mes' },
  ];
  if (cap >= 950) {
    baseOptions.push({ value: 'up-to-950', label: '901 – 950 €/mes' });
  }
  baseOptions.push({ value: 'over-950', label: `Més de ${cap} €/mes`, sublabel: 'Supera el límit de la zona' });
  return baseOptions;
}
