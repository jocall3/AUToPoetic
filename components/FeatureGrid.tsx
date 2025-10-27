/**
 * @file Renders a searchable grid of available features.
 * @summary This module is responsible for the primary feature discovery view, allowing users
 * to browse and select from a list of available tools and functionalities.
 * It has been refactored to use the new Core UI component library for consistency
 * and themeability, and includes comprehensive JSDoc for maintainability.
 * @version 2.0.0
 * @author Elite AI Implementation Team
 */

import React, { useState, useMemo } from 'react';
import type { Feature } from '../types';
import * as ui from '../ui/core'; // Assumed path to the new Core UI library
import { Icon } from '../ui/core'; // Assuming Icon is a separate export

/**
 * @interface FeatureCardProps
 * @description Props for the FeatureCard component.
 * @property {Feature} feature - The feature object to display.
 * @property {() => void} onClick - Callback function executed when the card is clicked.
 */
interface FeatureCardProps {
  /** The feature object containing details like name, description, icon, and category. */
  feature: Feature;
  /** Callback function to be executed when the user clicks on the card. */
  onClick: () => void;
}

/**
 * A presentational component that displays a single feature as an interactive card.
 * It shows the feature's icon, name, description, and category.
 *
 * @component
 * @param {FeatureCardProps} props - The props for the component.
 * @returns {React.ReactElement} A clickable card representing a feature.
 *
 * @example
 * const feature = { id: 'ai-explainer', name: 'AI Explainer', ... };
 * return <FeatureCard feature={feature} onClick={() => console.log('Card clicked!')} />;
 *
 * @security This is a presentational component and does not handle sensitive data. Clicks are handled by the parent.
 */
const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onClick }) => {
  return (
    <ui.Card onClick={onClick} hoverEffect="lift" isClickable>
      <ui.Card.Body>
        <ui.Flex direction="column" justify="between" className="h-full">
          <ui.Box>
            <ui.Flex align="center" gap={3} mb={2}>
              <Icon size="md" color="primary">{feature.icon}</Icon>
              <ui.Heading as="h3" size="md" fontWeight="bold">
                {feature.name}
              </ui.Heading>
            </ui.Flex>
            <ui.Text size="sm" color="secondary">
              {feature.description}
            </ui.Text>
          </ui.Box>
          <ui.Text size="xs" color="tertiary" mt={4}>
            {feature.category}
          </ui.Text>
        </ui.Flex>
      </ui.Card.Body>
    </ui.Card>
  );
};

/**
 * @interface FeatureGridProps
 * @description Props for the FeatureGrid component.
 * @property {Feature[]} features - An array of feature objects to display in the grid.
 * @property {(id: string) => void} [onFeatureSelect] - Optional callback when a feature is selected.
 */
interface FeatureGridProps {
  /** An array of all available feature objects that can be displayed. */
  features: Feature[];
  /** An optional callback function that is executed when a feature card is clicked, passing the feature's ID. */
  onFeatureSelect?: (id: string) => void;
}

/**
 * Displays a searchable grid of `FeatureCard` components.
 * This component provides the main browsing interface for users to discover and launch features.
 * It includes a search bar to filter features by name, description, or category.
 *
 * @component
 * @param {FeatureGridProps} props - The props for the component.
 * @returns {React.ReactElement} A full-page component with a search bar and a grid of features.
 *
 * @performance
 * The filtering logic is performed client-side using `useMemo` for optimization. For an extremely
 * large number of features (e.g., 1000+), this filtering operation could be offloaded to a Web Worker
 * to prevent any potential blocking of the main thread, as per architectural directives.
 *
 * @example
 * const allFeatures = [{ id: 'ai-explainer', ... }, { id: 'theme-designer', ... }];
 * return <FeatureGrid features={allFeatures} onFeatureSelect={(id) => openFeature(id)} />;
 */
export const FeatureGrid: React.FC<FeatureGridProps> = ({ features, onFeatureSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFeatures = useMemo(() => {
    const featureList = features || [];
    if (!searchTerm) {
      return featureList;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return featureList.filter(
      (feature) =>
        feature.name.toLowerCase().includes(lowerCaseSearchTerm) ||
        feature.description.toLowerCase().includes(lowerCaseSearchTerm) ||
        feature.category.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm, features]);

  return (
    <ui.Box p={{ base: 4, sm: 6, lg: 8 }} className="h-full">
      <ui.Box mb={8} textAlign="center">
        <ui.Heading as="h1" size="4xl" fontWeight="extrabold" tracking="tight">
          DevCore AI Toolkit
        </ui.Heading>
        <ui.Text as="p" mt={2} size="lg" color="secondary">
          A focused toolkit for modern development, powered by AI.
        </ui.Text>
        <ui.Box mt={6} maxWidth="xl" mx="auto">
          <ui.Input
            type="text"
            placeholder="Search features by name, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search features"
            size="lg"
          />
        </ui.Box>
      </ui.Box>

      <ui.Grid 
        columns={{ base: 1, md: 2, lg: 3, xl: 4 }} 
        gap={4}
      >
        {filteredFeatures.map((feature) => (
          <FeatureCard 
            key={feature.id} 
            feature={feature} 
            onClick={() => onFeatureSelect?.(feature.id)} 
          />
        ))}
      </ui.Grid>
    </ui.Box>
  );
};
