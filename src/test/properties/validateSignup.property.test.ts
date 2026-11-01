import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateSignup } from '@/logic/validateSignup';
import { signupReducer, createInitialSignupState, isDuplicateEmail } from '@/logic/signupReducer';
import { SignupInput } from '@/types';

// Feature: upside-down-escape, Property 8: Signup validation constraints
describe('Property 8: Signup validation constraints', () => {
  it('reports errors for exactly the violating fields, no errors for valid input', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 200 }),
        fc.string({ maxLength: 300 }),
        fc.oneof(fc.constant(null), fc.integer({ min: -5, max: 15 })),
        (name, email, plusOne) => {
          const input: SignupInput = {
            fullName: name,
            email: email,
            plusOneCount: plusOne,
          };
          const result = validateSignup(input);

          // Check name validation
          if (!name || name.trim() === '') {
            expect(result.errors.fullName).toBeDefined();
          } else if (name.length > 100) {
            expect(result.errors.fullName).toBeDefined();
          } else {
            expect(result.errors.fullName).toBeUndefined();
          }

          // Check email validation
          if (!email || email.trim() === '') {
            expect(result.errors.email).toBeDefined();
          } else if (email.length > 254) {
            expect(result.errors.email).toBeDefined();
          } else {
            const atIndex = email.indexOf('@');
            if (atIndex < 1 || atIndex === email.length - 1) {
              expect(result.errors.email).toBeDefined();
            }
          }

          // Check plus-one validation
          if (plusOne !== null && (plusOne < 0 || plusOne > 10)) {
            expect(result.errors.plusOneCount).toBeDefined();
          }

          // If all valid, isValid should be true
          if (Object.keys(result.errors).length === 0) {
            expect(result.isValid).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 200 }
    );
  });
});

// Feature: upside-down-escape, Property 9: Duplicate email detection
describe('Property 9: Duplicate email detection', () => {
  // Simple email generator: word + @ + word + . + word
  const emailArb = fc.tuple(
    fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'a') || 'user'),
    fc.string({ minLength: 1, maxLength: 10 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'a') || 'example'),
    fc.string({ minLength: 1, maxLength: 5 }).map(s => s.replace(/[^a-zA-Z0-9]/g, 'a') || 'com')
  ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

  it('duplicate emails transition to duplicate with retained input, new emails to success', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            fullName: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/\s/g, 'x') || 'TestUser'),
            email: emailArb,
            plusOneCount: fc.constant(null),
          }),
          { maxLength: 10 }
        ),
        (submissions) => {
          let state = createInitialSignupState();

          for (const input of submissions) {
            const trimmedInput: SignupInput = {
              fullName: input.fullName,
              email: input.email,
              plusOneCount: input.plusOneCount,
            };
            const result = validateSignup(trimmedInput);
            if (!result.isValid) continue;

            const duplicate = isDuplicateEmail(state, trimmedInput.email);
            state = signupReducer(state, {
              type: 'SUBMIT',
              input: trimmedInput,
              isValid: true,
              isDuplicate: duplicate,
            });

            if (duplicate) {
              expect(state.lastSubmission).toBe('duplicate');
              expect(state.lastInput).toEqual(trimmedInput);
            } else {
              expect(state.lastSubmission).toBe('success');
              expect(state.registeredEmails).toContain(trimmedInput.email.toLowerCase());
            }
          }
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
