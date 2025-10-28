/**
 * @file This file contains the FeatureDock component, a primary UI element for launching micro-frontend features.
 * @module components/desktop/FeatureDock
 * @see {@link DesktopView} for usage.
 * @copyright James Burvel O'Callaghan III
 * @license Apache-2.0
 */

import React from 'react';
import { Dock, Grid } from '@/ui/composite/Layout'; // Hypothetical UI library components
import { FeatureIcon } from '@/ui/composite/FeatureIcon'; // Hypothetical UI library components
import { Skeleton } from '@/ui/core/Feedback'; // Hypothetical UI library component
import { useFeatureRegistry } from '@/services/business/useFeatureRegistry'; // Hypothetical hook for DI service
import { useResourceOrchestrator } from '@/services/business/useResourceOrchestrator'; // For pre-fetching
import type { Feature } from '@/types';

/**
 * Props for the FeatureDock component.
 * @interface FeatureDockProps
 * @property {(featureId: string) => void} onLaunch - Callback function to launch a feature by its ID.
 */
interface FeatureDockProps {
  /**
   * Callback function executed when a feature icon is clicked.
   * This function is responsible for signaling the WorkspaceManager to load and display the micro-frontend.
   * @param {string} featureId - The unique identifier of the feature to be launched.
   * @security This callback should ensure that only registered and permitted features can be launched. The launching mechanism itself is handled by a higher-level manager which should perform its own security checks.
   */
  onLaunch: (featureId: string) => void;
}

/**
 * The FeatureDock is a UI component that displays a collection of available features (micro-frontends)
 * as interactive icons. It allows users to launch features into the current workspace.
 *
 * It fetches the list of available features from the FeatureRegistry service and uses the
 * ResourceOrchestrator to proactively prefetch feature bundles on hover for a faster user experience.
 * This component is designed to be themeable and is part of the pluggable WorkspaceManager system.
 *
 * @component
 * @param {FeatureDockProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered FeatureDock component.
 * @example
 * ```tsx
 * <FeatureDock onLaunch={(id) => console.log(`Launching feature: ${id}`)} />
 * ```
 * @see {@link useFeatureRegistry} for how features are fetched.
 * @see {@link useResourceOrchestrator} for prefetching logic.
 * @performance The component uses virtualization within the `Grid` component (hypothetically) to handle a large number of features efficiently. Prefetching on hover reduces perceived launch time for micro-frontends.
 */
export const FeatureDock: React.FC<FeatureDockProps> = ({ onLaunch }) => {
  const { features, isLoading, error } = useFeatureRegistry();
  const { prefetchFeature } = useResourceOrchestrator();

  /**
   * Handles the mouse enter event on a feature icon to trigger a prefetch.
   * @param {Feature} feature - The feature to prefetch.
   * @performance Triggers a background fetch of the micro-frontend bundle associated with the feature, improving subsequent launch times.
   */
  const handlePrefetch = (feature: Feature): void => {
    prefetchFeature(feature.id);
  };

  const renderContent = () => {
    if (isLoading) {
      // Render skeleton loaders for a better loading experience
      return (
        <Grid columns={{ sm: 4, md: 6, lg: 8 }} gap="medium">
          {Array.from({ length: 16 }).map((_, index) => (
            <Skeleton key={index} variant="icon" />
          ))}
        </Grid>
      );
    }

    if (error) {
      // Display a user-friendly error message within the dock
      return (
        <div
          role="alert"
          className="flex items-center justify-center h-full text-text-secondary"
        >
          <p>Error loading features: {String(error)}</p>
        </div>
      );
    }

    return (
      <Grid columns={{ sm: 4, md: 6, lg: 8 }} gap="medium">
        {features.map((feature) => (
          <FeatureIcon
            key={feature.id}
            feature={feature}
            onPress={() => onLaunch(feature.id)}
            onHoverStart={() => handlePrefetch(feature)}
          />
        ))}
      </Grid>
    );
  };

  return (
    <Dock
      variant="glass"
      position="top"
      aria-label="Feature Dock"
      data-testid="feature-dock"
    >
      {renderContent()}
    </Dock>
  );
};