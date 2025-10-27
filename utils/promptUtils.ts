/**
 * @module utils/promptUtils
 * @description Provides utility functions for constructing and formatting AI prompts.
 * This module centralizes logic for converting structured prompt objects into formatted strings
 * suitable for various AI models, ensuring consistency in how system instructions are built.
 * @see {SystemPrompt} - The primary data structure this module operates on.
 * @security This module does not perform any input sanitization. Callers are responsible for
 * ensuring that the content within prompt objects is safe and does not contain malicious
 * instructions before passing it to an AI service.
 */

import type { SystemPrompt } from '../types.ts';

/**
 * Converts a structured SystemPrompt object into a single, formatted string
 * that can be used as the `systemInstruction` for the Gemini API or similar models.
 * This function assembles the persona, rules, output format, and examples into a
 * markdown-formatted block that clearly defines the AI's expected behavior.
 *
 * @param {SystemPrompt} prompt The structured `SystemPrompt` object containing the persona, rules, and examples.
 * @returns {string} A formatted string ready for use as a system instruction. If the prompt object is falsy, a default "helpful assistant" prompt is returned.
 *
 * @example
 * const myPrompt: SystemPrompt = {
 *   id: '1',
 *   name: 'Code Reviewer',
 *   persona: 'You are a senior software engineer performing a code review.',
 *   rules: ['Be clear and concise.', 'Provide code examples for suggestions.'],
 *   outputFormat: 'markdown',
 *   exampleIO: [{
 *     input: 'function add(a,b){return a+b}',
 *     output: '`function add(a, b) { return a + b; }` - Good, but consider adding a semicolon for consistency.'
 *   }]
 * };
 *
 * const instruction = formatSystemPromptToString(myPrompt);
 * // instruction will be a markdown formatted string:
 * // **PERSONA:**
 * // You are a senior software engineer performing a code review.
 * //
 * // **RULES:**
 * // - Be clear and concise.
 * // - Provide code examples for suggestions.
 * //
 * // **OUTPUT FORMAT:**
 * // You must respond in markdown format.
 * //
 * // **EXAMPLES:**
 * // User Input:
 * // ```
 * // function add(a,b){return a+b}
 * // ```
 * // Your Output:
 * // ```
 * // `function add(a, b) { return a + b; }` - Good, but consider adding a semicolon for consistency.
 * // ```
 * // ---
 *
 * @see {SystemPrompt} - For the structure of the input object.
 * @see {@link ../services/aiService.ts} - Where the output of this function is consumed.
 * @performance This is a lightweight, synchronous string manipulation function. Its performance
 * impact is negligible and is not a candidate for offloading to a web worker unless
 * dealing with an extremely large number of prompts in a blocking loop.
 * @security This function directly concatenates strings from the input `prompt` object. It does not
 * perform any sanitization. Ensure that any user-generated content within the `prompt` object
 * is sanitized before calling this function to prevent prompt injection vulnerabilities if the
 * structure is saved or shared.
 */
export const formatSystemPromptToString = (prompt: SystemPrompt): string => {
    if (!prompt) return "You are a helpful assistant.";

    let instruction = `**PERSONA:**\n${prompt.persona}\n\n`;

    if (prompt.rules && prompt.rules.length > 0) {
        // Filter out empty rules before joining
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
};
