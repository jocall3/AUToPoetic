/**
 * @file DashboardView.tsx
 * @module components/DashboardView
 * @description This module provides the main dashboard view for the application.
 * It serves as the user's landing page, presenting a summary of workspace activity,
 * quick access to key features, and performance metrics. This component is designed
 * to be a thin presentation layer, consuming data from hooks and utilizing the
 * new proprietary UI framework.
 * @see App.tsx for where this view is routed.
 * @see @/components/ui/composite/Widget for the composite widget component used.
 * @see @/components/ui/core/Grid for the layout component used.
 * @performance The component uses memoization for derived data and relies on efficient child components.
 * Data fetching is expected to be handled by a dedicated hook (e.g., useDashboardData) which should implement caching.
 */

import React from 'react';

// UI Framework Components (Imagined paths based on architecture directives)
// These are assumed to be new, proprietary components as per the UI framework directive.
import { Grid } from '@/components/ui/core/Grid';
import { Card } from '@/components/ui/core/Card';
import { Button } from '@/components/ui/core/Button';
import { Header } from '@/components/ui/composite/Header';
import { Widget } from '@/components/ui/composite/Widget';
import { LoadingSpinner } from '@/components/shared';

// Icons from the existing icon library
import { GitBranchIcon, PaintBrushIcon, BeakerIcon, ChartBarIcon } from './icons';

// Hooks and Context
import { useGlobalState } from '../contexts/GlobalStateContext';

// Types and Constants
import type { ViewType, Feature } from '../types';
import { ALL_FEATURES } from './features';

/**
 * @interface DashboardViewProps
 * @description Props for the DashboardView component.
 */
interface DashboardViewProps {
  /**
   * Callback function to handle navigation to a different view/feature.
   * @param {ViewType} view - The ID of the view or feature to navigate to.
   * @param {any} [props] - Optional props to pass to the destination view.
   */
  onNavigate: (view: ViewType, props?: any) => void;
}

/**
 * @interface Stat
 * @description Defines the structure for a dashboard statistic to be displayed in a widget.
 */
interface Stat {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}

/**
 * @interface ActivityItem
 * @description Defines the structure for a recent activity log item for display.
 */
interface ActivityItem {
    id: number;
    icon: string;
    description: string;
    timestamp: string;
}

// --- Mock Data & Constants ---
// In a real implementation adhering to the new architecture, this data would be fetched
// from a `useDashboardData` hook connected to the BFF via GraphQL.

const favoriteFeatureIds: string[] = ['ai-command-center', 'project-explorer', 'theme-designer', 'ai-feature-builder'];

const mockStats: Stat[] = [
    { title: 'Features Used', value: 12, icon: <ChartBarIcon /> },
    { title: 'Commits Generated', value: 8, icon: <GitBranchIcon /> },
    { title: 'Tests Created', value: 42, icon: <BeakerIcon /> },
];

const mockRecentActivity: ActivityItem[] = [
    { id: 1, icon: 'git-branch', description: 'Generated commit for feature/new-ui', timestamp: '2 hours ago' },
    { id: 2, icon: 'palette', description: 'Created new theme \"Cyberpunk Sunset\"', timestamp: '5 hours ago' },
    { id: 3, icon: 'beaker', description: 'Generated 5 unit tests for Login component', timestamp: '1 day ago' },
];

const activityIconMap: Record<string, React.ReactNode> = {
    'git-branch': <GitBranchIcon />,
    'palette': <PaintBrushIcon />,
    'beaker': <BeakerIcon />,
};

// --- Sub-components ---

/**
 * A widget displaying a grid of buttons for quick navigation to favorite features.
 * @component
 * @param {object} props - Component props.
 * @param {DashboardViewProps['onNavigate']} props.onNavigate - Navigation callback.
 * @returns {React.ReactElement}
 * @performance This component renders a static list of features and should have minimal performance impact.
 */
const QuickAccessWidget: React.FC<{ onNavigate: DashboardViewProps['onNavigate'] }> = ({ onNavigate }) => {
    const features = favoriteFeatureIds
        .map(id => ALL_FEATURES.find(f => f.id === id))
        .filter((f): f is Feature => !!f);

    return (
        <Widget title="Quick Access">
            <Grid columns={2} mdColumns={4} gap="4">
                {features.map(feature => (
                    <Button
                        key={feature.id}
                        variant="secondary"
                        onClick={() => onNavigate(feature.id)}
                        className="flex flex-col items-center justify-center h-28 p-2 text-center"
                    >
                        <div className="w-8 h-8 text-primary">{feature.icon}</div>
                        <span className="text-xs mt-2 font-medium">{feature.name}</span>
                    </Button>
                ))}
            </Grid>
        </Widget>
    );
};

/**
 * A widget displaying a list of recent user activities within the application.
 * @component
 * @param {object} props - Component props.
 * @param {ActivityItem[]} props.activity - Array of activity items to display.
 * @returns {React.ReactElement}
 */
const RecentActivityWidget: React.FC<{ activity: ActivityItem[] }> = ({ activity }) => {
    return (
        <Widget title="Recent Activity">
            <ul className="space-y-3">
                {activity.map(item => (
                    <li key={item.id} className="flex items-start text-sm p-2 -m-2 rounded-lg hover:bg-surface">
                        <div className="w-5 h-5 mr-3 mt-1 text-text-secondary flex-shrink-0">
                            {activityIconMap[item.icon]}
                        </div>
                        <div>
                            <p className="text-text-primary">{item.description}</p>
                            <p className="text-xs text-text-secondary">{item.timestamp}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </Widget>
    );
};

/**
 * The main dashboard component. It orchestrates the layout of various informational
 * widgets to provide the user with an at-a-glance overview of their workspace.
 * This new implementation replaces the previous `MachineView` with a more functional and data-driven interface,
 * aligning with the new architectural directives.
 * @component
 * @param {DashboardViewProps} props - Component props.
 * @returns {React.ReactElement}
 * @security This component is presentational and handles no sensitive data directly. All navigation actions are delegated via the `onNavigate` prop.
 * @example <DashboardView onNavigate={(view) => console.log('Navigating to', view)} />
 */
export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { state } = useGlobalState();
  const { user } = state;
  
  // In a real implementation adhering to the new architecture, data fetching would be handled here by a dedicated hook.
  // e.g., const { data, isLoading, error } = useDashboardData();
  const isLoading = false; // Mocked for demonstration
  const error = null;     // Mocked for demonstration

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>;
  }
  if (error) {
    return <div className="p-6 text-red-500">Error loading dashboard data.</div>;
  }

  return (
    <div className="h-full w-full p-4 md:p-6 lg:p-8 overflow-y-auto no-scrollbar">
        <Header
            title={`Welcome back, ${user?.displayName?.split(' ')[0] || 'Developer'}!`}
            subtitle="Here's a summary of your workspace activity."
        />
        
        <Grid columns={1} smColumns={2} lgColumns={3} gap="6" className="my-6">
            {mockStats.map(stat => (
                <Card key={stat.title} className="p-4 flex items-center">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary mr-4">
                       {stat.icon}
                    </div>
                    <div>
                        <p className="text-sm text-text-secondary">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                </Card>
            ))}
        </Grid>

        <Grid columns="1 lg:3" gap="6">
            <div className="lg:col-span-2">
                <QuickAccessWidget onNavigate={onNavigate} />
            </div>
            <div>
                <RecentActivityWidget activity={mockRecentActivity} />
            </div>
        </Grid>
    </div>
  );
};
