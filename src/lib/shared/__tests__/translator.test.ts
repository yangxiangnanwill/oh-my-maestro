import { describe, it, expect } from 'vitest';
import { translate, shouldHide, translatePayload, TRANSLATIONS } from '../translations.js';

describe('Concept Translator', () => {
  describe('translate', () => {
    it('should translate technical terms to simple labels', () => {
      expect(translate('chain', 'simple')).toBe('Workflow');
      expect(translate('skill', 'simple')).toBe('Action');
      expect(translate('milestone', 'simple')).toBe('Goal');
      expect(translate('phase', 'simple')).toBe('Stage');
    });

    it('should show advanced labels in advanced mode', () => {
      expect(translate('chain', 'advanced')).toBe('Chain (Workflow)');
      expect(translate('delegate', 'advanced')).toBe('Delegate (Run)');
    });

    it('should replace hidden terms with generic placeholder in simple mode', () => {
      expect(translate('delegate', 'simple')).toBe('Processing');
      expect(translate('session', 'simple')).toBe('Processing');
    });

    it('should return original term when no translation exists', () => {
      expect(translate('unknown-term', 'simple')).toBe('unknown-term');
      expect(translate('unknown-term', 'advanced')).toBe('unknown-term');
    });

    it('should translate aliases', () => {
      expect(translate('command', 'simple')).toBe('Action');
      expect(translate('execution', 'simple')).toBe('Build');
    });
  });

  describe('shouldHide', () => {
    it('should hide hidden terms in simple mode', () => {
      expect(shouldHide('delegate', 'simple')).toBe(true);
      expect(shouldHide('session', 'simple')).toBe(true);
    });

    it('should not hide non-hidden terms in simple mode', () => {
      expect(shouldHide('chain', 'simple')).toBe(false);
      expect(shouldHide('milestone', 'simple')).toBe(false);
    });

    it('should never hide in advanced mode', () => {
      expect(shouldHide('delegate', 'advanced')).toBe(false);
      expect(shouldHide('session', 'advanced')).toBe(false);
    });
  });

  describe('translatePayload', () => {
    it('should translate label-like fields only', () => {
      const payload = {
        stepName: 'execute',
        description: 'Run the chain',
        data: 'chain', // data values should NOT be translated
      };

      const { translated } = translatePayload(payload, 'simple');
      expect(translated.stepName).toBe('Build');
      expect(translated.description).toBe('Run the Workflow');
      expect(translated.data).toBe('chain'); // preserved
    });

    it('should return empty untranslated terms when all terms are known', () => {
      const payload = { stepName: 'chain', description: 'execute the phase' };
      const { untranslatedTerms } = translatePayload(payload, 'simple');
      expect(untranslatedTerms).not.toContain('chain');
      expect(untranslatedTerms).not.toContain('execute');
      expect(untranslatedTerms).not.toContain('phase');
    });
  });

  describe('coverage', () => {
    it('should have at least 7 translation entries', () => {
      expect(TRANSLATIONS.length).toBeGreaterThanOrEqual(7);
    });

    it('should cover all guidance §2 terminology', () => {
      const terms = TRANSLATIONS.map((t) => t.term);
      const requiredTerms = ['chain', 'skill', 'delegate', 'milestone', 'phase', 'artifact'];
      for (const term of requiredTerms) {
        expect(terms).toContain(term);
      }
    });
  });

  describe('compound word boundary', () => {
    it('should not replace term inside compound word (e.g., delegate in delegate-executor)', () => {
      const payload = {
        stepName: 'delegate-executor',
        description: 'Run the delegate-executor chain',
      };
      const { translated } = translatePayload(payload, 'simple');
      // 'delegate-executor' should NOT have 'delegate' replaced — it is a compound word
      expect(translated.stepName).toBe('delegate-executor');
      // 'chain' is a standalone word — should still be translated
      expect(translated.description).toBe('Run the delegate-executor Workflow');
    });

    it('should still replace standalone terms', () => {
      const payload = {
        stepName: 'delegate',
        description: 'execute the chain',
      };
      const { translated } = translatePayload(payload, 'simple');
      // Standalone 'delegate' should be replaced (hidden in simple mode → 'Processing')
      expect(translated.stepName).toBe('Processing');
      expect(translated.description).toBe('Build the Workflow');
    });

    it('should not replace term inside hyphenated compound words', () => {
      const payload = {
        stepName: 'my-command-tool',
        description: 'my-execution-tool my-phase-runner',
      };
      const { translated } = translatePayload(payload, 'simple');
      // Compound words should not have substrings replaced
      expect(translated.stepName).toBe('my-command-tool');
      expect(translated.description).toBe('my-execution-tool my-phase-runner');
    });

    it('should not leak maestro terminology in translated output', () => {
      // Verify that translated output does not contain raw maestro terms
      const payload = {
        stepName: 'delegate',
        description: 'chain skill milestone phase artifact execute plan analyze',
      };
      const { translated } = translatePayload(payload, 'simple');
      const translatedText = JSON.stringify(translated);
      // Raw maestro terms should not appear in translated output
      expect(translatedText).not.toMatch(/\bmaestro\b/);
      // 'delegate' is hidden in simple mode — should be 'Processing', not 'delegate'
      expect(translated.stepName).not.toBe('delegate');
      // 'chain' should be 'Workflow', not 'chain'
      expect(translated.description).not.toMatch(/\bchain\b/);
    });
  });
});
