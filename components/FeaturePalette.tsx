/**
 * @file FeaturePalette.tsx
 * @description This file contains the implementation of the FeaturePalette component, which serves as a UI plugin
 * for the WorkspaceManager. It displays a searchable and filterable list of available features (micro-frontends).
 * This component is designed to be a thin presentation layer, adhering to the new federated architecture.
 *
 * @module components/FeaturePalette
 * @see @/services/feature-registry/useFeatureRegistry
 * @see @/services/action-manager/useActionManager
 * @see @/services/resource-orchestrator/resourceOrchestrator
 * @see @/hooks/useWorker
 * @performance This component offloads search filtering to a web worker to ensure the main thread remains responsive,
 * even with a large number of features. It also integrates with the ResourceOrchestrator to prefetch features on hover,
 * improving perceived launch times.
 * @security This component only displays feature metadata and triggers actions via a centralized ActionManager. It does
 * not handle any sensitive data or business logic directly.
 */

import React from 'react';

// Hypothetical imports from the new proprietary UI framework
import { Card, Icon, Text, Spinner, VisuallyHidden } from '@/ui/core';
import { SearchInput, ScrollArea } from '@/ui/composite';

// Types and hooks from the new architecture
import type { Feature } from '@/types';
import { useFeatureRegistry } from '@/services/feature-registry/useFeatureRegistry';
import { useActionManager } from '@/services/action-manager/useActionManager';
import { resourceOrchestrator } from '@/services/resource-orchestrator/resourceOrchestrator';
import { useWorker } from '@/hooks/useWorker';

/**
 * @interface FeatureItemProps
 * @description Props for the FeatureItem component, which represents a single, launchable feature in the palette.
 */
interface FeatureItemProps {
  /**
   * @property {Feature} feature - The feature metadata object to display.
   * @required
   */
  feature: Feature;
}

/**
 * Renders a single feature item in the palette.
 * It is responsible for displaying the feature's icon and name, and handling user interactions
 * such as clicking to launch or hovering to prefetch.
 *
 * @component FeatureItem
 * @param {FeatureItemProps} props - The props for the component.
 * @returns {React.ReactElement} A card representing a feature.
 * @example
 * <FeatureItem feature={myFeatureObject} />
 * @see @/services/action-manager/useActionManager
 * @see @/services/resource-orchestrator/resourceOrchestrator
 */
const FeatureItem: React.FC<FeatureItemProps> = ({ feature }) => {
  const { execute: executeAction } = useActionManager();

  /**
   * @function handleSelect
   * @description Handles the click event on a feature item. It executes the 'launchFeature' command
   * via the ActionManager, passing the feature ID as a payload. This decouples the palette from
   * the windowing system.
   * @performance Triggers a high-priority action that should result in immediate user feedback.
   */
  const handleSelect = (): void => {
    executeAction('launchFeature', { featureId: feature.id });
  };

  /**
   * @function handlePrefetch
   * @description Handles the mouse enter event. It hints to the ResourceOrchestrator to begin
   * pre-fetching the associated micro-frontend resources for this feature, improving subsequent
   * launch times.
   * @performance This is a low-priority, predictive action to improve perceived performance.
   */
  const handlePrefetch = (): void => {
    resourceOrchestrator.prefetchFeature(feature.id);
  };

  /**
   * @function handleDragStart
   * @description Sets the feature ID in the data transfer object when a drag operation begins.
   * This allows the drop target (e.g., the workspace) to identify which feature to launch.
   * @param {React.DragEvent} e - The drag event object.
   */
  const handleDragStart = (e: React.DragEvent): void => {
    e.dataTransfer.setData('application/x-feature-id', feature.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card
      as="div"
      onClick={handleSelect}
      onMouseEnter={handlePrefetch}
      draggable="true"
      onDragStart={handleDragStart}
      role="button"
      tabIndex={0}
      aria-label={`Launch ${feature.name}`}
      className="feature-item" // Hypothetical class for styling via ThemeEngine
    >
      <Icon iconElement={feature.icon} size="medium" aria-hidden="true" />
      <div className="feature-item-text-container">
        <Text as="h4" variant="heading-small">{feature.name}</Text>
        <Text as="p" variant="body-extra-small" color="secondary">{feature.category}</Text>
        <VisuallyHidden>{feature.description}</VisuallyHidden>
      </div>
    </Card>
  );
};

/**
 * The main component for the Feature Palette UI plugin.
 * It fetches the list of available features from the FeatureRegistry,
 * provides a search/filter mechanism, and displays the features as a list of FeatureItems.
 *
 * This component exemplifies the thin presentation layer principle, delegating business logic
 * to services (FeatureRegistry, ActionManager), computational tasks to workers (search),
 * and performance optimizations to an orchestrator.
 *
 * @component FeaturePalette
 * @returns {React.ReactElement} The rendered feature palette component.
 * @security This component is safe as it only handles presentation and delegates all actions
 * to a centralized, secure ActionManager.
 */
export const FeaturePalette: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // 1. Fetch the list of all available micro-frontends from the registry.
  const { data: allFeatures, isLoading, error } = useFeatureRegistry();

  // 2. Offload filtering logic to a dedicated web worker to keep the UI thread free.
  const { result: filteredFeatures } = useWorker<Feature[]>('feature-filter-worker', {
    list: allFeatures || [],
    term: searchTerm,
  });

  const handleSearchChange = (value: string): void => {
    setSearchTerm(value);
  };

  /**
   * @function renderContent
   * @description Renders the main content of the palette based on the current state
   * (loading, error, or success with data).
   * @returns {React.ReactElement} The content to be displayed.
   */
  const renderContent = (): React.ReactElement => {
    if (isLoading) {
      return (
        <div className="content-feedback-container">
          <Spinner size="large" />
          <Text>Loading Features...</Text>
        </div>
      );
    }

    if (error) {
      return (
        <div className="content-feedback-container">
          <Icon iconName="error" color="danger" />
          <Text color="danger">Failed to load features.</Text>
          <Text color="secondary" size="small">{error}</Text>
        </div>
      );
    }
    
    const featuresToDisplay = searchTerm ? filteredFeatures : allFeatures;

    if (!featuresToDisplay || featuresToDisplay.length === 0) {
      return (
        <div className="content-feedback-container">
          <Text>No features found.</Text>
        </div>
      );
    }

    return (
      <ScrollArea>
        <div className="feature-list-grid">
          {featuresToDisplay.map((feature: Feature) => (
            <FeatureItem key={feature.id} feature={feature} />
          ))}
        </div>
      </ScrollArea>
    );
  };
  
  return (
    <aside className="feature-palette-container" aria-label="Feature Palette">
      <div className="feature-palette-header">
        <Text as="h3" variant="heading-large">Feature Palette</Text>
        <SearchInput
          value={searchTerm}
          onValueChange={handleSearchChange}
          placeholder="Search features..."
          aria-label="Search for features"
        />
      </div>
      <div className="feature-palette-content">
        {renderContent()}
      </div>
    </aside>
  );
};
