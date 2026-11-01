'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { validateSignup } from '@/logic/validateSignup';
import { SignupInput, SignupStatus } from '@/types';

export default function SignupForm() {
  const submitSignup = useAppStore((s) => s.submitSignup);
  const signupStatus = useAppStore((s) => s.signup.lastSubmission);
  const resetSignup = useAppStore((s) => s.resetSignup);

  const [form, setForm] = useState<SignupInput>({
    fullName: '',
    email: '',
    plusOneCount: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof SignupInput, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'plusOneCount' ? (value === '' ? null : parseInt(value, 10)) : value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (showSuccess) setShowSuccess(false);
    if (signupStatus !== 'idle') resetSignup();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateSignup(form);

    if (!result.isValid) {
      setErrors(result.errors as Record<string, string>);
      return;
    }

    const status: SignupStatus = submitSignup(form);

    if (status === 'success') {
      setShowSuccess(true);
      setForm({ fullName: '', email: '', plusOneCount: null });
      setErrors({});
    } else if (status === 'duplicate') {
      setErrors({ email: 'This email is already registered' });
    } else if (status === 'error') {
      setErrors({ email: 'Submission failed. Please try again.' });
    }
  };

  if (showSuccess) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="text-5xl mb-4" aria-hidden="true">🎃</div>
        <p className="text-2xl text-halloween-orange font-semibold mb-2">
          You are registered!
        </p>
        <p className="text-halloween-ghost/70 mb-4">
          See you on Halloween night. If you dare...
        </p>
        <button
          onClick={() => setShowSuccess(false)}
          className="text-halloween-purple hover:text-halloween-orange transition-colors text-sm underline"
        >
          Register another guest
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-halloween-ghost/80 mb-1">
          Full Name *
        </label>
        <input
          id="fullName"
          type="text"
          value={form.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          maxLength={100}
          required
          aria-required="true"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          className="w-full px-4 py-3 rounded-lg bg-halloween-black/60 border border-halloween-purple/40 text-halloween-ghost placeholder-halloween-ghost/30 focus:border-halloween-orange focus:outline-none transition-colors"
          placeholder="Jane Doe"
        />
        {errors.fullName && (
          <p id="fullName-error" role="alert" className="mt-1 text-sm text-red-400">
            {errors.fullName}
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-halloween-ghost/80 mb-1">
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          maxLength={254}
          required
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="w-full px-4 py-3 rounded-lg bg-halloween-black/60 border border-halloween-purple/40 text-halloween-ghost placeholder-halloween-ghost/30 focus:border-halloween-orange focus:outline-none transition-colors"
          placeholder="jane@example.com"
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1 text-sm text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      {/* Plus One */}
      <div>
        <label htmlFor="plusOneCount" className="block text-sm font-medium text-halloween-ghost/80 mb-1">
          Plus One Count (optional)
        </label>
        <input
          id="plusOneCount"
          type="number"
          min={0}
          max={10}
          value={form.plusOneCount ?? ''}
          onChange={(e) => handleChange('plusOneCount', e.target.value)}
          aria-invalid={!!errors.plusOneCount}
          aria-describedby={errors.plusOneCount ? 'plusOne-error' : undefined}
          className="w-full px-4 py-3 rounded-lg bg-halloween-black/60 border border-halloween-purple/40 text-halloween-ghost placeholder-halloween-ghost/30 focus:border-halloween-orange focus:outline-none transition-colors"
          placeholder="0"
        />
        {errors.plusOneCount && (
          <p id="plusOne-error" role="alert" className="mt-1 text-sm text-red-400">
            {errors.plusOneCount}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-gradient-to-r from-halloween-orange to-halloween-pumpkin text-halloween-black font-semibold hover:from-halloween-pumpkin hover:to-halloween-orange transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Sign Me Up
      </button>
    </form>
  );
}
