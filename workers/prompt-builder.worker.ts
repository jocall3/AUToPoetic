/**
 * @file Web Worker for constructing AI prompts.
 * @description This worker offloads the CPU-intensive and potentially complex task of assembling
 *              multi-part AI prompts from various inputs (user query, system instructions,
 *              contextual data like code snippets or file contents) into a single,
 *              optimized prompt string for generative AI models.
 *              Offloading this to a worker keeps the main thread free and responsive.
 */

/**
 * @interface PromptBuilderMessage
 * @description Defines the structure of messages received by the prompt builder worker from the main thread.
 * @property {string} type - The type of message, indicating the task for the worker (e.g., 'buildPrompt').
 * @property {Object} data - The payload containing all necessary information for prompt construction.
 * @property {string} data.userPrompt - The direct textual input from the user.
 * @property {string} [data.systemInstruction] - Pre-formatted system-level instructions for the AI, often derived from an AI personality.
 * @property {Record<string, any>} [data.context] - Additional contextual data to be included in the prompt (e.g., code, diffs, JSON). Keys should describe the content.
 * @property {Object} [data.formatOptions] - Options influencing the final formatting of the prompt.
 * @property {'markdown' | 'json' | 'text'} [data.formatOptions.responseFormat] - The desired output format for the AI's response (e.g., 'markdown', 'json').
 * @property {string} [data.formatOptions.additionalInstructions] - Any final, specific instructions to append to the prompt.
 * @property {string} requestId - A unique identifier to correlate the worker's response with the originating request on the main thread.
 */
interface PromptBuilderMessage {
    type: 'buildPrompt';
    data: {
        userPrompt: string;
        systemInstruction?: string;
        context?: Record<string, any>;
        formatOptions?: {
            responseFormat?: 'markdown' | 'json' | 'text';
            additionalInstructions?: string;
        };
        requestId: string;
    };
}

/**
 * @interface PromptBuilderResponse
 * @description Defines the structure of messages sent from the prompt builder worker back to the main thread.
 * @property {'promptBuilt' | 'error'} type - Indicates whether the prompt was successfully built or an error occurred.
 * @property {string} requestId - The unique identifier of the original request, for correlation.
 * @property {Object} [payload] - Contains the result if the operation was successful.
 * @property {string} payload.finalPrompt - The complete, constructed AI prompt string.
 * @property {string} [error] - The error message if the operation failed.
 */
interface PromptBuilderResponse {
    type: 'promptBuilt' | 'error';
    requestId: string;
    payload?: {
        finalPrompt: string;
    };
    error?: string;
}

/**
 * @function buildFinalPrompt
 * @description Assembles a comprehensive AI prompt string from various components.
 *              This function ensures that system instructions, contextual data, and user queries
 *              are combined coherently and efficiently, often in Markdown for readability.
 * @param {string} userPrompt - The direct input from the user.
 * @param {string} [systemInstruction] - Pre-formatted system instructions for the AI.
 * @param {Record<string, any>} [context] - Additional data (e.g., code snippets, diffs) to embed.
 * @param {Object} [formatOptions] - Options for structuring the final prompt.
 * @param {'markdown' | 'json' | 'text'} [formatOptions.responseFormat] - Desired AI response format.
 * @param {string} [formatOptions.additionalInstructions] - Final instructions for the AI.
 * @returns {string} The fully constructed and formatted AI prompt string.
 * @security This function operates on strings and objects received. No direct execution of
 *           user-provided code is performed. Input sanitization should occur before passing
 *           data to this worker if it originates from untrusted sources and is not simply text.
 * @performance Optimized for string concatenation; avoids excessive intermediate string creations.
 *              Runs in a Web Worker to prevent blocking the main thread.
 */
function buildFinalPrompt(
    userPrompt: string,
    systemInstruction?: string,
    context?: Record<string, any>,
    formatOptions?: { responseFormat?: 'markdown' | 'json' | 'text'; additionalInstructions?: string; }
): string {
    let finalPromptParts: string[] = [];

    if (systemInstruction && systemInstruction.trim().length > 0) {
        finalPromptParts.push(systemInstruction.trim());
        finalPromptParts.push('\n\n---'); // Separator
    }

    if (context) {
        let contextParts: string[] = [];
        contextParts.push('**CONTEXTUAL INFORMATION:**');
        for (const key in context) {
            if (Object.prototype.hasOwnProperty.call(context, key)) {
                const value = context[key];
                if (typeof value === 'string') {
                    // Try to guess if it's code/diff/json to wrap in markdown code blocks
                    if (key.toLowerCase().includes('code') || key.toLowerCase().includes('diff') || key.toLowerCase().includes('script')) {
                        contextParts.push(`**${key.toUpperCase().replace(/_/g, ' ')}:**`);
                        contextParts.push('```\n' + value + '\n```');
                    } else if (key.toLowerCase().includes('json') && typeof JSON.parse(value) === 'object') {
                        contextParts.push(`**${key.toUpperCase().replace(/_/g, ' ')}:**`);
                        contextParts.push('```json\n' + value + '\n```');
                    } else {
                        contextParts.push(`**${key.toUpperCase().replace(/_/g, ' ')}:** ${value}`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    contextParts.push(`**${key.toUpperCase().replace(/_/g, ' ')}:**`);
                    contextParts.push('```json\n' + JSON.stringify(value, null, 2) + '\n```');
                } else {
                    contextParts.push(`**${key.toUpperCase().replace(/_/g, ' ')}:** ${String(value)}`);
                }
            }
        }
        if (contextParts.length > 1) { // If actual context was added beyond the header
            finalPromptParts.push(contextParts.join('\n\n'));
            finalPromptParts.push('\n\n---');
        }
    }

    if (userPrompt && userPrompt.trim().length > 0) {
        finalPromptParts.push('**USER QUERY:**');
        finalPromptParts.push(userPrompt.trim());
    }

    if (formatOptions) {
        if (formatOptions.responseFormat) {
            finalPromptParts.push(`\n\n**RESPONSE INSTRUCTIONS:**`);
            finalPromptParts.push(`You MUST respond in **${formatOptions.responseFormat.toUpperCase()}** format.`);
        }
        if (formatOptions.additionalInstructions && formatOptions.additionalInstructions.trim().length > 0) {
            finalPromptParts.push(`\n\n**ADDITIONAL INSTRUCTIONS:**`);
            finalPromptParts.push(formatOptions.additionalInstructions.trim());
        }
    }

    // Join all parts, ensuring no empty lines unless explicitly desired by double newlines.
    // Filter out empty strings to prevent extra newlines from `join`.
    return finalPromptParts.filter(part => part.trim().length > 0).join('\n\n').trim();
}

/**
 * @event onmessage
 * @description Listens for messages from the main thread, processes them to build an AI prompt,
 *              and posts the constructed prompt or an error back to the main thread.
 * @param {MessageEvent<PromptBuilderMessage>} event - The message event containing the prompt construction request.
 * @listens MessageEvent
 * @returns {void}
 */
self.onmessage = (event: MessageEvent<PromptBuilderMessage>) => {
    const { type, data, requestId } = event.data;

    if (type === 'buildPrompt') {
        try {
            const finalPrompt = buildFinalPrompt(
                data.userPrompt,
                data.systemInstruction,
                data.context,
                data.formatOptions
            );

            const response: PromptBuilderResponse = {
                type: 'promptBuilt',
                requestId,
                payload: {
                    finalPrompt,
                },
            };
            self.postMessage(response);
        } catch (e: any) {
            const errorResponse: PromptBuilderResponse = {
                type: 'error',
                requestId,
                error: e.message || 'Unknown error during prompt construction.',
            };
            self.postMessage(errorResponse);
        }
    } else {
        const errorResponse: PromptBuilderResponse = {
            type: 'error',
            requestId,
            error: `Unknown message type: ${type}`,
        };
        self.postMessage(errorResponse);
    }
};
