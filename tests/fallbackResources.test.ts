/**
 * Tests for fallback resources classification and retrieval
 */

import { describe, it, expect } from 'vitest';
import {
  getRelevantResources,
  getDefaultResources,
  OFFICIAL_SOURCES,
} from '../src/resources/fallbackResources.js';
import { getRelevantChecklist } from '../src/resources/fallbackChecklists.js';

describe('fallbackResources', () => {
  describe('getRelevantResources', () => {
    it('should return aid resources for aid-related questions', () => {
      const question = '¿Cómo solicitar el Bono Alquiler Joven?';
      const resources = getRelevantResources(question, 3);

      expect(resources).toHaveLength(3);
      expect(resources[0].category).toBe('aid');
      expect(resources[0].title).toContain('Bono Alquiler Joven');
    });

    it('should return legal resources for legal questions', () => {
      const question = '¿Qué dice la LAU sobre la duración del contrato?';
      const resources = getRelevantResources(question, 3);

      expect(resources).toHaveLength(3);
      expect(resources.some((r) => r.category === 'legal')).toBe(true);
    });

    it('should boost Barcelona resources when mentioned', () => {
      const question = 'Ajudes per joves a Barcelona';
      const resources = getRelevantResources(question, 3);

      expect(resources).toHaveLength(3);
      expect(resources.some((r) => r.url.includes('barcelona.cat'))).toBe(true);
    });

    it('should return general resources when no specific category detected', () => {
      const question = '¿Cuánto cuesta un Ferrari?';
      const resources = getRelevantResources(question, 3);

      expect(resources).toHaveLength(3);
      expect(resources.some((r) => r.category === 'general')).toBe(true);
    });

    it('should respect maxResources limit', () => {
      const question = 'Ayudas de vivienda';
      const resources = getRelevantResources(question, 2);

      expect(resources).toHaveLength(2);
    });

    it('should prioritize specific program mentions', () => {
      const question = 'Información sobre la Borsa Jove';
      const resources = getRelevantResources(question, 3);

      expect(resources[0].title).toContain('Borsa Jove');
    });
  });

  describe('getDefaultResources', () => {
    it('should return 3 default resources', () => {
      const resources = getDefaultResources();

      expect(resources).toHaveLength(3);
      expect(resources[0].url).toBe('https://habitatge.gencat.cat');
    });

    it('should include Agència de l\'Habitatge as first resource', () => {
      const resources = getDefaultResources();

      expect(resources[0].title).toContain('Agència de l\'Habitatge');
    });
  });

  describe('OFFICIAL_SOURCES', () => {
    it('should have valid URLs for all sources', () => {
      OFFICIAL_SOURCES.forEach((source) => {
        expect(source.url).toMatch(/^https:\/\//);
        expect(source.title).toBeTruthy();
      });
    });

    it('should have categories for all sources', () => {
      OFFICIAL_SOURCES.forEach((source) => {
        expect(['aid', 'legal', 'general']).toContain(source.category);
      });
    });
  });
});

describe('fallbackChecklists', () => {
  describe('getRelevantChecklist', () => {
    it('should return aid checklist for aid questions', () => {
      const question = 'Cómo solicitar el Bono Joven';
      const checklist = getRelevantChecklist(question);

      expect(checklist.title).toContain('sol·licitar ajudes');
      expect(checklist.steps.length).toBeGreaterThanOrEqual(2);
    });

    it('should return contract checklist for contract questions', () => {
      const question = '¿Qué revisar antes de firmar un contrato?';
      const checklist = getRelevantChecklist(question);

      expect(checklist.title).toContain('verificar abans de signar');
      expect(checklist.steps.length).toBeGreaterThanOrEqual(2);
    });

    it('should return legal checklist for legal questions', () => {
      const question = '¿Qué dice la LAU?';
      const checklist = getRelevantChecklist(question);

      expect(checklist.title).toContain('drets');
      expect(checklist.steps.length).toBeGreaterThanOrEqual(2);
    });

    it('should return Barcelona checklist when Barcelona mentioned', () => {
      const question = 'Recursos en Barcelona';
      const checklist = getRelevantChecklist(question);

      expect(checklist.title).toContain('Barcelona');
      expect(checklist.steps.length).toBeGreaterThanOrEqual(2);
    });

    it('should return generic checklist for unrelated questions', () => {
      const question = '¿Cuánto cuesta un coche?';
      const checklist = getRelevantChecklist(question);

      expect(checklist.title).toContain('trobar més informació');
      expect(checklist.steps.length).toBeGreaterThanOrEqual(2);
    });

    it('should never return empty steps', () => {
      const questions = [
        'Bono Alquiler Joven',
        'Contrato de alquiler',
        'LAU',
        'Barcelona',
        'Algo random',
      ];

      questions.forEach((q) => {
        const checklist = getRelevantChecklist(q);
        expect(checklist.steps.length).toBeGreaterThan(0);
      });
    });
  });
});
