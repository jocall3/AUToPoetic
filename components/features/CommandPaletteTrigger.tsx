/**
 * @file Renders a trigger view for the Command Palette.
 * @module components/features/CommandPaletteTrigger
 *
 * @description
 * This component serves as a visual prompt, instructing users on how to access
 * the application's global Command Palette via a keyboard shortcut. It is designed
 * as a placeholder or default view within the main content area when no other
 * feature is active.
 *
 * It utilizes components from the proprietary Core UI framework to ensure consistency
 * and themeability across the application.
 *
 * @see {@link ../CommandPalette.tsx} for the actual implementation of the command palette.
 * @see {@link ../../ui/Core} for the Core UI components used.
 */

import React from 'react';
import { Container, Heading, Text, Card, Icon, KeyboardShortcut } from 'ui/Core'; // Hypothetical path to Core UI library
import { CommandLineIcon } from 'ui/Core/icons'; // Hypothetical path to Core UI icons

/**
 * A functional component that displays instructions for opening the Command Palette.
 *
 * This component is intended to be displayed in the main content area, providing a
 * clear and helpful message to the user about this core application feature.
 *
 * @returns {React.ReactElement} The rendered trigger view for the Command Palette.
 *
 * @performance
 * This is a static, presentational component with no state or side effects, resulting
 * in minimal performance overhead. It renders once and does not cause re-renders.
 *
 * @security
 * This component is purely presentational and does not handle any user input or data,
 * posing no security risks.
 *
 * @example
 * ```tsx
 * <CommandPaletteTrigger />
 * ```
 */
export const CommandPaletteTrigger: React.FC = () => {
    return (
        <Container
            variant="flex"
            direction="col"
            align="center"
            justify="center"
            className="h-full p-8 text-center"
        >
            <Icon
                as={CommandLineIcon}
                size="24"
                color="primary"
                className="mb-4"
                aria-hidden="true"
            />
            <Heading level={1} size="3xl" weight="bold" color="primary" className="mb-2">
                Command Palette
            </Heading>
            <Text size="lg" color="secondary" className="mb-4 max-w-md">
                The Command Palette provides quick keyboard access to all features and commands.
            </Text>
            <Card variant="pulsing" padding="lg">
                <Text weight="semibold" color="primary">
                    Press <KeyboardShortcut>Ctrl</KeyboardShortcut> + <KeyboardShortcut>K</KeyboardShortcut> to open.
                </Text>
            </Card>
        </Container>
    );
};
