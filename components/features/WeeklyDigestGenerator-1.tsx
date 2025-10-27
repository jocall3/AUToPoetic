/**
 * @file Implements the Weekly Digest Generator feature as a federated micro-frontend component.
 * @description This component serves as the presentation layer for generating and sending
 * a weekly project summary. It communicates with the Backend-for-Frontend (BFF) via
 * GraphQL to orchestrate AI-powered digest generation and email dispatch.
 * All business logic is handled server-side, adhering to the new microservice architecture.
 * @module features/WeeklyDigestGenerator
 * @security This component makes authenticated requests to the BFF. User context is managed
 * by the global state, and authentication tokens are not directly handled here.
 * @performance Offloads all heavy computation (AI interaction, data fetching) to the BFF,
 * keeping the client lightweight. Renders a loading state during GraphQL mutations.
 * @see {@link WeeklyDigestGenerator.tsx} for the previous monolithic implementation.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';

// Hooks for global state, notifications, and BFF communication
import { useNotification } from '@/contexts/NotificationContext';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import { useBffMutation } from '@/hooks/useBffMutation';

// GraphQL mutations for interacting with the BFF
import { GENERATE_WEEKLY_DIGEST, SEND_DIGEST } from '@/graphql/mutations';

// Core and Composite UI components from the new proprietary UI framework
import { Button } from '@/ui/core/Button';
import { Input } from '@/ui/core/Input';
import { Card, CardContent, CardHeader } from '@/ui/core/Card';
import { Panel } from '@/ui/core/Panel';
import { Spinner } from '@/ui/core/Spinner';
import { Typography } from '@/ui/core/Typography';
import { HtmlPreview } from '@/ui/composite/HtmlPreview';
import { MailIcon, SparklesIcon } from '@/lib/icons';

/**
 * Represents the Weekly Digest Generator feature component.
 * @description This component provides a user interface to trigger the generation
 * of a weekly project digest and send it as an email. It has been refactored
 * to be a thin presentation layer, delegating all logic to the BFF.
 * @component WeeklyDigestGenerator
 * @returns {React.ReactElement} The rendered component.
 * @example
 * <Window feature={{...}} ... >
 *   <WeeklyDigestGenerator />
 * </Window>
 */
export const WeeklyDigestGenerator: React.FC = () => {
  /**
   * @hook useNotification
   * @description Provides a function to display toast notifications to the user.
   */
  const { addNotification } = useNotification();

  /**
   * @hook useGlobalState
   * @description Accesses the global application state, primarily for user information.
   */
  const { state } = useGlobalState();

  /**
   * @state {string} recipient - The email address of the digest recipient.
   */
  const [recipient, setRecipient] = useState('');

  /**
   * @hook useBffMutation<GENERATE_WEEKLY_DIGEST>
   * @description Manages the GraphQL mutation to generate the weekly digest.
   * Provides loading state, error handling, and the resulting data.
   */
  const [generateDigest, { data: digestData, loading: isGenerating, error: generateError }] = useBffMutation(GENERATE_WEEKLY_DIGEST);

  /**
   * @hook useBffMutation<SEND_DIGEST>
   * @description Manages the GraphQL mutation to send the generated digest email.
   * Provides loading state and error handling.
   */
  const [sendDigest, { loading: isSending, error: sendError }] = useBffMutation(SEND_DIGEST);

  /**
   * @effect Sets the initial recipient email from the globally authenticated user's state.
   * @security Populates user data from a trusted global state provider.
   */
  useEffect(() => {
    if (state.user?.email) {
      setRecipient(state.user.email);
    }
  }, [state.user]);

  /**
   * @effect Handles errors from GraphQL mutations and displays notifications.
   * @performance Prevents component re-renders from cascading errors by handling them in effects.
   */
  useEffect(() => {
    if (generateError) {
      addNotification(generateError.message, 'error');
    }
    if (sendError) {
      addNotification(sendError.message, 'error');
    }
  }, [generateError, sendError, addNotification]);

  /**
   * @constant {string | null} emailHtml - Memoized HTML content of the generated digest.
   */
  const emailHtml = useMemo(() => digestData?.generateWeeklyDigest?.htmlContent || null, [digestData]);

  /**
   * @function handleGenerate
   * @description Triggers the weekly digest generation process by calling the BFF.
   * The BFF is responsible for gathering all necessary data (e.g., commit logs, telemetry).
   */
  const handleGenerate = useCallback(async () => {
    try {
      const result = await generateDigest();
      if (result.data) {
        addNotification('Digest content generated!', 'success');
      }
    } catch (e) {
      // Error is handled by the useEffect hook, but we catch here to prevent unhandled promise rejections.
      console.error("Error during digest generation:", e);
    }
  }, [generateDigest, addNotification]);

  /**
   * @function handleSend
   * @description Triggers the email sending process via the BFF.
   */
  const handleSend = useCallback(async () => {
    if (!emailHtml || !recipient) {
      addNotification('Please generate a digest and provide a recipient.', 'error');
      return;
    }
    try {
      const result = await sendDigest({ variables: { to: recipient, htmlContent: emailHtml } });
      if (result.data?.sendDigest?.success) {
        addNotification('Email sent successfully!', 'success');
      }
    } catch (e) {
      // Error is handled by the useEffect hook.
      console.error("Error during digest sending:", e);
    }
  }, [emailHtml, recipient, sendDigest, addNotification]);

  return (
    <Panel className="p-4 sm:p-6 lg:p-8">
      <Header
        icon={<MailIcon />}
        title="Weekly Digest Generator"
        subtitle="Generate an AI-powered weekly summary and send it via your connected Gmail account."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 min-h-0 flex-grow">
        <Card className="flex flex-col items-center justify-center text-center">
          <CardHeader>
            <Typography variant="h3">Generate & Send Digest</Typography>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 w-full max-w-xs">
            <Typography variant="body2" color="secondary">
              The BFF will gather project data to generate a summary email.
            </Typography>
            <Button onClick={handleGenerate} disabled={isGenerating} icon={<SparklesIcon />} fullWidth>
              {isGenerating ? 'Generating...' : 'Generate Digest'}
            </Button>
            <Input
              id="recipient-email"
              label="Recipient Email"
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="recipient@example.com"
              disabled={!state.user}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !emailHtml || !state.user}
              icon={<MailIcon />}
              variant="success"
              fullWidth
            >
              {isSending ? 'Sending...' : 'Send via Gmail'}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <Typography variant="h3">Email Preview</Typography>
          </CardHeader>
          <CardContent className="flex-grow min-h-0">
            <Panel className="bg-white border h-full w-full">
              {isGenerating && (
                <div className="flex justify-center items-center h-full">
                  <Spinner size="large" />
                </div>
              )}
              {emailHtml && <HtmlPreview content={emailHtml} />}
              {!isGenerating && !emailHtml && (
                <div className="flex justify-center items-center h-full">
                  <Typography color="secondary">Preview will appear here.</Typography>
                </div>
              )}
            </Panel>
          </CardContent>
        </Card>
      </div>
    </Panel>
  );
};
