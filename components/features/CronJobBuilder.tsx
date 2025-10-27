/**
 * @file CronJobBuilder.tsx
 * @module components/features/CronJobBuilder
 * @description A feature component for building and understanding cron expressions,
 * with both manual controls and AI-powered generation from natural language.
 * Adheres to the new UI framework directives by using abstracted components
 * and provides comprehensive JSDoc as per architectural mandates.
 * @security User input in the AI prompt is sent to a third-party AI service.
 * Ensure no sensitive information is entered.
 * @performance The component makes asynchronous calls to AI services, which can have
 * variable latency. UI feedback is provided via loading states.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CommandLineIcon, SparklesIcon, ClipboardDocumentIcon } from '../icons.tsx';
import { generateCronFromDescription, explainCronExpression, CronParts } from '../../services/index.ts';
import { LoadingSpinner } from '../shared/index.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';

const minuteOptions = ['*', ...Array.from({ length: 60 }, (_, i) => i)];
const hourOptions = ['*', ...Array.from({ length: 24 }, (_, i) => i)];
const dayOfMonthOptions = ['*', ...Array.from({ length: 31 }, (_, i) => i + 1)];
const monthOptions = ['*', ...Array.from({ length: 12 }, (_, i) => i + 1)];
const dayOfWeekOptions = ['*', ...Array.from({ length: 7 }, (_, i) => i)];

/**
 * Props for the CronPartSelector component.
 * @interface
 */
interface CronPartSelectorProps {
  /** The label for the selector dropdown. */
  label: string;
  /** The current value of the selector. */
  value: string;
  /** Callback function to handle value changes. */
  onChange: (value: string) => void;
  /** Array of options to display in the dropdown. */
  options: (string | number)[];
  /** A flag to indicate if the component is in a loading state. */
  isLoading: boolean;
}

/**
 * A reusable dropdown component for selecting a part of a cron expression.
 * This simulates a component from a proprietary 'Core UI' library.
 *
 * @param {CronPartSelectorProps} props The properties for the component.
 * @returns {React.ReactElement} The rendered select dropdown component.
 */
const CronPartSelector: React.FC<CronPartSelectorProps> = ({ label, value, onChange, options, isLoading }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={isLoading}
        className="w-full px-3 py-2 rounded-md bg-surface border border-border focus:ring-2 focus:ring-primary focus:outline-none transition-colors disabled:opacity-50"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
};

/**
 * A React component for building cron expressions, either through a visual
 * interface or by generating them from a natural language prompt using AI.
 * It also provides an AI-powered explanation of the generated cron expression.
 *
 * @param {object} props - Component props.
 * @param {string} [props.initialPrompt] - An optional natural language prompt to generate a cron expression when the component loads.
 * @returns {React.ReactElement} The rendered CronJobBuilder component.
 * @example
 * <CronJobBuilder initialPrompt="Every day at midnight" />
 * @example
 * <CronJobBuilder />
 */
export const CronJobBuilder: React.FC<{ initialPrompt?: string }> = ({ initialPrompt }) => {
  const [cronParts, setCronParts] = useState<CronParts>({
    minute: '0',
    hour: '17',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '1-5',
  });
  const [aiPrompt, setAiPrompt] = useState(initialPrompt || 'every weekday at 5pm');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isExplanationLoading, setIsExplanationLoading] = useState(false);

  const { addNotification } = useNotification();

  const cronExpression = useMemo(() => {
    return `${cronParts.minute} ${cronParts.hour} ${cronParts.dayOfMonth} ${cronParts.month} ${cronParts.dayOfWeek}`;
  }, [cronParts]);

  /**
   * @name handlePartChange
   * @description Updates a single part of the cron expression state.
   * @param {keyof CronParts} part The part of the cron expression to update.
   * @param {string} value The new value for the part.
   * @performance A simple state update, very performant.
   */
  const handlePartChange = useCallback((part: keyof CronParts, value: string) => {
    setCronParts(prev => ({ ...prev, [part]: value }));
  }, []);

  /**
   * @name handleAiGenerate
   * @description Generates a cron expression from a natural language prompt using an AI service.
   * @param {string} p The natural language prompt.
   * @performance Makes a network request to an AI service. Latency can vary. The UI is updated with loading states.
   */
  const handleAiGenerate = useCallback(async (p: string) => {
    if (!p.trim()) {
      addNotification('Please enter a description for the schedule.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const result: CronParts = await generateCronFromDescription(p);
      setCronParts(result);
      addNotification('Cron expression generated by AI!', 'success');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred.';
      addNotification(`AI generation failed: ${message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (initialPrompt) {
      handleAiGenerate(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  useEffect(() => {
    const getExplanation = async () => {
      if (cronExpression) {
        setIsExplanationLoading(true);
        try {
          const result = await explainCronExpression(cronExpression);
          setExplanation(result);
        } catch (e) {
          setExplanation('Could not generate an explanation for this expression.');
        } finally {
          setIsExplanationLoading(false);
        }
      }
    };
    getExplanation();
  }, [cronExpression]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cronExpression);
    addNotification('Cron expression copied to clipboard!', 'info');
  }, [cronExpression, addNotification]);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
      <header className="mb-8 flex-shrink-0">
        <h1 className="text-3xl font-bold flex items-center">
          <CommandLineIcon />
          <span className="ml-3">AI Cron Job Builder</span>
        </h1>
        <p className="text-text-secondary mt-1">Visually construct a cron expression or describe it in plain English.</p>
      </header>

      <div className="flex-grow overflow-y-auto space-y-8 pr-2">
        <section className="bg-surface p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Generate with AI</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiGenerate(aiPrompt)}
              placeholder="Describe a schedule, e.g., 'every 15 minutes'"
              className="flex-grow px-4 py-2 rounded-md bg-background border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <button onClick={() => handleAiGenerate(aiPrompt)} disabled={isLoading} className="btn-primary px-4 py-2 flex items-center justify-center gap-2 w-40">
              {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> Generate</>}
            </button>
          </div>
        </section>

        <section className="bg-surface p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Manual Configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <CronPartSelector label="Minute" value={cronParts.minute} onChange={(v) => handlePartChange('minute', v)} options={minuteOptions} isLoading={isLoading} />
            <CronPartSelector label="Hour" value={cronParts.hour} onChange={(v) => handlePartChange('hour', v)} options={hourOptions} isLoading={isLoading} />
            <CronPartSelector label="Day (Month)" value={cronParts.dayOfMonth} onChange={(v) => handlePartChange('dayOfMonth', v)} options={dayOfMonthOptions} isLoading={isLoading} />
            <CronPartSelector label="Month" value={cronParts.month} onChange={(v) => handlePartChange('month', v)} options={monthOptions} isLoading={isLoading} />
            <CronPartSelector label="Day (Week)" value={cronParts.dayOfWeek} onChange={(v) => handlePartChange('dayOfWeek', v)} options={dayOfWeekOptions} isLoading={isLoading} />
          </div>
        </section>

        <section className="bg-surface p-6 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <div className="bg-background p-4 rounded-lg text-center border border-border">
            <p className="text-text-secondary text-sm">Generated Expression</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <p className="font-mono text-primary text-2xl tracking-wider select-all">{cronExpression}</p>
              <button onClick={handleCopy} title="Copy to clipboard" className="p-2 text-text-secondary hover:text-primary rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                <ClipboardDocumentIcon />
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50 text-sm text-text-secondary min-h-[40px]">
              {isExplanationLoading ? <LoadingSpinner/> : explanation}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
