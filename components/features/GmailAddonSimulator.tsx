/**
 * @file GmailAddonSimulator.tsx
 * @module components/features/GmailAddonSimulator
 * @description This file contains the implementation of the GmailAddonSimulator feature,
 * which simulates a contextual AI-powered add-on within a mock Gmail interface.
 * It demonstrates how the frontend presentation layer interacts with the BFF
 * to generate AI content based on the context of a mock email.
 * @see useAiBffService for the business logic hook.
 * @see @core/ui for UI components.
 * @security This component makes authenticated GraphQL requests to the BFF. All AI interactions are brokered server-side.
 * @performance Prompt construction is minimal and performed on the main thread.
 *              For more complex prompt engineering, offloading to a web worker
 *              via the WorkerPoolManager would be required.
 */

import React, { useState, useCallback, useEffect } from 'react';

// Fictional UI framework components as per architecture directives
import {
  Box,
  Button,
  Card,
  Dialog,
  Flex,
  Icon,
  Markdown,
  Spinner,
  Text,
} from '@core/ui'; // Assuming a path to the new Core UI library
import { MailIcon, SparklesIcon, XMarkIcon } from '@core/ui/icons'; // Centralized icons

// Fictional hook for interacting with the BFF, abstracting GraphQL and state management
import { useAiBffService } from '@business/hooks/useAiBffService';

// Mock data remains for presentation purposes
const mockEmail = {
    from: 'Alice <alice@example.com>',
    to: 'Me <me@example.com>',
    subject: 'Project Update & Question',
    body: `Hey,\n\nJust wanted to give you a quick update. The new user authentication flow is complete and pushed to the staging server.\n\nI had a question about the next task regarding the database migration. The ticket says we need to migrate the 'users' table, but it's not clear on the required schema changes. Should I just add the new 'last_login' column or are there other modifications needed?\n\nLet me know when you have a chance.\n\nThanks,\nAlice`,
    avatar: 'https://avatar.vercel.sh/alice', // Added for better UI
};

/**
 * @interface ComposeDialogProps
 * @description Props for the ComposeDialog sub-component.
 */
interface ComposeDialogProps {
  /** Required. Controls the visibility of the dialog. */
  isOpen: boolean;
  /** Required. Callback function to close the dialog. */
  onClose: () => void;
  /** Required. The content of the reply being generated. */
  replyContent: string;
  /** Required. Indicates if the AI is currently generating the reply. */
  isGenerating: boolean;
}

/**
 * A dialog component to display the composed AI-generated reply.
 * This is a sub-component of GmailAddonSimulator.
 *
 * @param {ComposeDialogProps} props - The properties for the component.
 * @returns {React.ReactElement} The rendered dialog.
 * @example
 * <ComposeDialog
 *   isOpen={isComposeOpen}
 *   onClose={() => setComposeOpen(false)}
 *   replyContent={generatedReply}
 *   isGenerating={isLoading}
 * />
 */
const ComposeDialog: React.FC<ComposeDialogProps> = ({ isOpen, onClose, replyContent, isGenerating }) => {
  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Overlay />
      <Dialog.Content as={Card.Root} size="large" className="h-[70vh] flex flex-col">
        <Dialog.Header as={Card.Header}>
          <Dialog.Title as={Text} weight="semibold">New Message</Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" size="icon">
              <Icon as={XMarkIcon} />
            </Button>
          </Dialog.Close>
        </Dialog.Header>
        <Card.Body className="flex-grow flex flex-col p-0">
          <Box className="p-3 text-sm border-b">
            <Text as="p"><Text as="span" color="secondary">To: </Text>{mockEmail.from}</Text>
          </Box>
          <Box className="p-3 text-sm border-b">
            <Text as="p"><Text as="span" color="secondary">Subject: </Text>Re: {mockEmail.subject}</Text>
          </Box>
          <Box className="flex-grow p-3 overflow-y-auto">
            {isGenerating && !replyContent ? (
              <Flex justify="center" align="center" className="h-full">
                <Spinner size="large" />
              </Flex>
            ) : (
              <Markdown content={replyContent} />
            )}
          </Box>
        </Card.Body>
        <Card.Footer>
          <Button variant="primary">Send</Button>
        </Card.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
};


/**
 * Simulates a contextual add-on within a Gmail-like interface.
 * The component displays a mock email and provides an "AI Reply" button.
 * Clicking the button triggers a request to the BFF to generate a reply
 * based on the email's content, which is then streamed into a compose dialog.
 *
 * @returns {React.ReactElement} The GmailAddonSimulator feature component.
 * @example
 * <Window feature={{id: 'gmail-addon-simulator', ...}}>
 *   <GmailAddonSimulator />
 * </Window>
 */
export const GmailAddonSimulator: React.FC = () => {
    const [isComposeOpen, setComposeOpen] = useState(false);
    
    // The new hook abstracts away the complexity of streaming, state management, and BFF communication.
    const { stream, data: generatedReply, isLoading, error } = useAiBffService();

    /**
     * @function handleGenerateReply
     * @description Constructs a prompt and initiates a streaming request to the AI BFF service
     * to generate a reply for the mock email.
     * @performance This function's prompt construction is trivial. In a more complex scenario,
     * this logic would be passed to a Web Worker via the WorkerPoolManager.
     */
    const handleGenerateReply = useCallback(async () => {
        setComposeOpen(true);
        const prompt = `Generate a professional and friendly reply to the following email. Acknowledge the update and answer the question by stating that only the 'last_login' column (as a DATETIME) is needed for now.\n\nEMAIL:\n${mockEmail.body}`;
        
        // The 'stream' function from the hook handles the entire streaming process.
        stream({
            prompt,
            systemInstruction: "You are a helpful assistant writing a professional email reply.",
            temperature: 0.7,
        });
    }, [stream]);

    useEffect(() => {
      if(error){
        // In a real app, we might use a notification service here.
        console.error("AI Service Error:", error);
      }
    }, [error])

    return (
        <Flex direction="column" className="h-full p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <Flex align="center" gap="3">
                  <Icon as={MailIcon} size="xl" color="primary" />
                  <Text as="h1" size="3xl" weight="bold">Gmail Add-on Simulator</Text>
                </Flex>
                <Text color="secondary" className="mt-1">
                    A simulation of how contextual add-on scopes would work inside Gmail.
                </Text>
            </header>
            
            <Flex
                justify="center"
                align="center"
                className="relative flex-grow bg-surface border-2 border-dashed border-border rounded-lg p-6"
            >
                <ComposeDialog
                    isOpen={isComposeOpen}
                    onClose={() => setComposeOpen(false)}
                    replyContent={generatedReply}
                    isGenerating={isLoading}
                />
                
                <Card.Root className="w-full max-w-4xl h-full flex flex-col shadow-2xl">
                    <Card.Header>
                        <Text as="h2" size="xl" weight="bold">{mockEmail.subject}</Text>
                        <Flex align="center" gap="2" className="text-sm mt-2">
                            <img src={mockEmail.avatar} alt="Alice" className="w-8 h-8 rounded-full" />
                            <Box>
                                <Text weight="semibold">{mockEmail.from.split('<')[0].trim()}</Text>
                                <Text color="secondary" size="xs">to {mockEmail.to.split('<')[0].trim()}</Text>
                            </Box>
                        </Flex>
                    </Card.Header>
                    
                    <Card.Body className="flex-grow overflow-y-auto">
                        <Text as="pre" className="whitespace-pre-wrap font-sans text-sm">
                            {mockEmail.body}
                        </Text>
                    </Card.Body>

                    <Card.Footer justify="between">
                        <Text size="xs" color="secondary" className="max-w-md">
                            <strong>Disclaimer:</strong> This is a simulation. The requested scopes allow this app to read the current email and compose replies <strong>if it were running inside Gmail.</strong>
                        </Text>
                        <Button
                            onClick={handleGenerateReply}
                            disabled={isLoading}
                            variant="primary"
                            size="medium"
                        >
                           <Icon as={SparklesIcon} />
                           AI Reply
                        </Button>
                    </Card.Footer>
                </Card.Root>
            </Flex>
        </Flex>
    );
};