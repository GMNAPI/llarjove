import { describe, it, expect } from 'vitest';
import { computeEligibility, buildChatContext } from './eligibility';
import type { FinderAnswers } from './questions';

// Base "perfect" answers — all eligible
const BASE_ELIGIBLE: FinderAnswers = {
  age: '18-35',
  location: 'barcelona',
  income: 'under-25200',
  contractType: 'full-apartment',
  habitual: 'yes',
  ownsProperty: 'no',
  rent: 'up-to-750',
  familyLandlord: 'no',
  taxCurrent: 'yes',
};

describe('Global disqualifiers — all 3 programs NOT_ELIGIBLE', () => {
  it('age under-18 disqualifies all', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, age: 'under-18' });
    expect(result.nacional.verdict).toBe('NOT_ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
    expect(result.allDisqualified).toBe(true);
  });

  it('age over-35 disqualifies all', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, age: 'over-35' });
    expect(result.nacional.verdict).toBe('NOT_ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
  });

  it('income over-25200 disqualifies all', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, income: 'over-25200' });
    expect(result.nacional.verdict).toBe('NOT_ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
    expect(result.allDisqualified).toBe(true);
  });

  it('habitual=no disqualifies all', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, habitual: 'no' });
    expect(result.nacional.verdict).toBe('NOT_ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
    expect(result.allDisqualified).toBe(true);
  });

  it('ownsProperty=yes-can-use disqualifies all', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, ownsProperty: 'yes-can-use' });
    expect(result.nacional.verdict).toBe('NOT_ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
    expect(result.allDisqualified).toBe(true);
  });

  it('no-contract disqualifies all', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, contractType: 'no-contract' });
    expect(result.nacional.verdict).toBe('NOT_ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
    expect(result.allDisqualified).toBe(true);
  });
});

describe('BCN + perfect profile → ELIGIBLE ×3', () => {
  it('barcelona, 24y, 750€/mes, no family landlord, taxes ok → ELIGIBLE ×3', () => {
    const result = computeEligibility(BASE_ELIGIBLE);
    expect(result.nacional.verdict).toBe('ELIGIBLE');
    expect(result.barcelona.verdict).toBe('ELIGIBLE');
    expect(result.generalitat.verdict).toBe('ELIGIBLE');
    expect(result.allDisqualified).toBe(false);
  });
});

describe('Location-based program eligibility', () => {
  it('rest-catalonia → nacional ELIGIBLE, barcelona NOT_ELIGIBLE, generalitat ELIGIBLE', () => {
    const answers: FinderAnswers = { ...BASE_ELIGIBLE, location: 'rest-catalonia', rent: 'up-to-600' };
    const result = computeEligibility(answers);
    expect(result.nacional.verdict).toBe('ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('ELIGIBLE');
  });

  it('amb → nacional ELIGIBLE, barcelona NOT_ELIGIBLE, generalitat ELIGIBLE', () => {
    const answers: FinderAnswers = { ...BASE_ELIGIBLE, location: 'amb', rent: 'up-to-900' };
    const result = computeEligibility(answers);
    expect(result.nacional.verdict).toBe('ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('ELIGIBLE');
  });
});

describe('Rent cap enforcement', () => {
  it('rent over-950 → NOT_ELIGIBLE ×3', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, rent: 'over-950' });
    expect(result.nacional.verdict).toBe('NOT_ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
  });

  it('rest-catalonia + rent 800€ (up-to-900) → generalitat NOT_ELIGIBLE (cap 750)', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, location: 'rest-catalonia', rent: 'up-to-900' });
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
    expect(result.nacional.verdict).toBe('ELIGIBLE');
  });
});

describe('Unknown income → POSSIBLE ×3', () => {
  it('income unknown + all else ok → POSSIBLE ×3', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, income: 'unknown' });
    expect(result.nacional.verdict).toBe('POSSIBLE');
    expect(result.barcelona.verdict).toBe('POSSIBLE');
    expect(result.generalitat.verdict).toBe('POSSIBLE');
    expect(result.allDisqualified).toBe(false);
  });
});

describe('FamilyLandlord program-specific rules', () => {
  it('familyLandlord=yes → nacional ELIGIBLE, barcelona NOT_ELIGIBLE, generalitat NOT_ELIGIBLE', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, familyLandlord: 'yes' });
    expect(result.nacional.verdict).toBe('ELIGIBLE');
    expect(result.barcelona.verdict).toBe('NOT_ELIGIBLE');
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
  });
});

describe('TaxCurrent program-specific rules', () => {
  it('taxCurrent=no → nacional ELIGIBLE, barcelona ELIGIBLE, generalitat NOT_ELIGIBLE', () => {
    const result = computeEligibility({ ...BASE_ELIGIBLE, taxCurrent: 'no' });
    expect(result.nacional.verdict).toBe('ELIGIBLE');
    expect(result.barcelona.verdict).toBe('ELIGIBLE');
    expect(result.generalitat.verdict).toBe('NOT_ELIGIBLE');
  });
});

describe('Early exit detection', () => {
  it('age over-35 → allDisqualified true immediately', () => {
    const result = computeEligibility({ age: 'over-35' });
    expect(result.allDisqualified).toBe(true);
  });
});

describe('ChatContext string', () => {
  it('contains program names and location in context string', () => {
    const result = computeEligibility(BASE_ELIGIBLE);
    const ctx = buildChatContext(BASE_ELIGIBLE, result);
    expect(ctx).toContain('Bo Alquiler Joven');
    expect(ctx).toContain('Bo Lloguer Jove');
    expect(ctx).toContain('Bo Municipal');
    expect(ctx).toContain('Barcelona');
    expect(ctx).toContain('ELIGIBLE');
  });
});
