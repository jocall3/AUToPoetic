/**
 * @file Web Worker for constructing AI prompts.
 * @description This worker offloads the CPU-intensive and potentially complex task of assembling
 *              multi-part AI prompts from various inputs (user query, system instructions,
 *              contextual data like code snippets or file contents) into a single,
 *              optimized prompt string for generative AI models.
 *              Offloading this to a worker keeps the main thread free and responsive.
 */

// Since workers run in a separate scope, we redefine necessary types here for self-containment.
// In a more advanced build system, these could be shared via a dedicated types package.

/**
 * @interface SystemPrompt
 * @description Defines a configurable AI personality, including persona, rules, and examples.
 */
interface SystemPrompt {
  id: string;
  name: string;
  persona: string;
  rules: string[];
  outputFormat: 'json' | 'markdown' | 'text';
  exampleIO: { input: string; output: string }[];
}

/**
 * @function formatSystemPromptToString
 * @description Converts a structured SystemPrompt object into a single, formatted string.
 * @param {SystemPrompt} prompt The structured `SystemPrompt` object.
 * @returns {string} A formatted string ready for use as a system instruction.
 */
function formatSystemPromptToString(prompt: SystemPrompt): string {
    if (!prompt) return "You are a helpful assistant.";

    let instruction = `**PERSONA:**\n${prompt.persona}\n\n`;

    if (prompt.rules && prompt.rules.length > 0) {
        const validRules = prompt.rules.filter(rule => rule && rule.trim() !== '');
        if (validRules.length > 0) {
            instruction += `**RULES:**\n${validRules.map(rule => `- ${rule}`).join('\n')}\n\n`;
        }
    }

    if (prompt.outputFormat) {
        instruction += `**OUTPUT FORMAT:**\nYou must respond in ${prompt.outputFormat} format.\n\n`;
    }

    if (prompt.exampleIO && prompt.exampleIO.length > 0) {
        instruction += `**EXAMPLES:**\n`;
        prompt.exampleIO.forEach(ex => {
            if (ex.input && ex.output) {
                instruction += `User Input:\n\`\`\`\n${ex.input}\n\`\`\`\n`;
                instruction += `Your Output:\n\`\`\`\n${ex.output}\n\`\`\`\n---\n`;
            }
        });
    }

    return instruction.trim();
}

/**
 * @function buildFinalPrompt
 * @description Assembles a comprehensive AI prompt string from various components.
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
    
    return finalPromptParts.filter(part => part.trim().length > 0).join('\n\n').trim();
}

/**
 * @event onmessage
 * @description Listens for messages from the main thread, processes them to build an AI prompt,
 *              and posts the constructed prompt or an error back to the main thread.
 */
self.onmessage = (event: MessageEvent) => {
    const { id, type, payload } = event.data;

    try {
        let result: any;
        switch (type) {
            case 'format-prompt':
                result = formatSystemPromptToString(payload);
                break;
            case 'build-prompt':
                if (!payload || !payload.userPrompt) {
                    throw new Error("Payload for 'build-prompt' must include a 'userPrompt'.");
                }
                result = buildFinalPrompt(
                    payload.userPrompt,
                    payload.systemInstruction,
                    payload.context,
                    payload.formatOptions
                );
                break;
            default:
                throw new Error(`Unknown task type: ${type}`);
        }

        self.postMessage({ taskId: id, result });
    } catch (error: any) {
        self.postMessage({ taskId: id, error: error.message });
    }
};
