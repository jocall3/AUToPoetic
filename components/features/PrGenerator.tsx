/**
 * @file PrGenerator.tsx
 * @description This module provides the user interface for generating a GitHub Pull Request.
 *              It allows users to specify source and target branches, auto-generate title
 *              and description using AI based on the branch diff, and then create the PR.
 *              All interactions with the GitHub API and AI services are proxied through
 *              the Backend-for-Frontend (BFF) via GraphQL queries and mutations.
 * @module features/PrGenerator
 * @see {@link Overall_Architectural_Directives} for architectural context.
 * @security This component does not handle any secrets or tokens. All API interactions
 *           are authenticated on the server-side via the BFF and AuthGateway. User input
 *           for branch names and descriptions should be sanitized on the backend.
 * @performance Client-side computations are minimal. Diff fetching and AI generation are
 *              server-side operations. The component is designed as a thin presentation layer.
 */

import React, { useState, useCallback } from 'react';
// Assuming a new UI framework with Core UI components
// import { Button, Input, Select, TextArea, Spinner, Alert } from '@core-ui';
// Assuming a new GraphQL client hook
// import { useGraphQLMutation, useGraphQLQuery } from '@framework/graphql-client';
// Assuming standard icons from a new icon library
import { GitBranchIcon, SparklesIcon, ArrowPathIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';

// --- Mocks for missing framework components ---
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="w-full mt-1 p-2 bg-background border border-border rounded-md" />;
const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} className="w-full mt-1 p-2 bg-background border border-border rounded-md min-h-[150px] font-mono text-sm" />;
const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => <button {...props} className="btn-primary flex items-center justify-center gap-2 px-4 py-2 disabled:opacity-50">{children}</button>;
const Alert = ({ children, type }: { children: React.ReactNode, type: 'error' | 'success' }) => <div className={`p-4 rounded-md text-sm ${type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>{children}</div>;
// --- End Mocks ---

// --- Mocks for missing GraphQL hooks ---
const useGraphQLMutation = <T, V>(mutation: string): [(variables: V) => Promise<{ data: T }>, { loading: boolean, error: Error | null }] => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async (variables: V): Promise<{ data: T }> => {
    setLoading(true);
    setError(null);
    console.log(`Executing GraphQL Mutation: ${mutation.substring(0, 50)}... with variables:`, variables);
    // Simulate network delay
    await new Promise(res => setTimeout(res, 1500));

    // Simulate API responses based on mutation name
    if (mutation.includes('generatePrContent')) {
      setLoading(false);
      return {
        data: {
          generatePullRequestContent: {
            title: `feat: Implement New Feature from ${ (variables as any).headBranch }`,
            body: `This pull request introduces a new feature based on the work in the specified branch.\n\n### Changes:\n- Added new component\n- Updated service layer\n- Implemented business logic\n\nCloses #123.`
          }
        } as any
      };
    }

    if (mutation.includes('createPullRequest')) {
       setLoading(false);
       if (Math.random() > 0.1) {
            return {
                data: {
                    createPullRequest: {
                        url: `https://github.com/example/repo/pull/${Math.floor(Math.random() * 1000)}`,
                        number: Math.floor(Math.random() * 1000),
                    }
                } as any
            };
       } else {
            const err = new Error("Failed to create pull request. The base branch may not exist.");
            setError(err);
            throw err;
       }
    }
    setLoading(false);
    return { data: {} as T };
  };

  return [execute, { loading, error }];
};
// --- End Mocks ---

// GraphQL Mutations (as strings, to be used by the hook)
const GENERATE_PR_CONTENT_MUTATION = `
  mutation generatePrContent($repo: String!, $baseBranch: String!, $headBranch: String!) {
    generatePullRequestContent(repo: $repo, base: $baseBranch, head: $headBranch) {
      title
      body
    }
  }
`;

const CREATE_PULL_REQUEST_MUTATION = `
  mutation createPullRequest($repo: String!, $baseBranch: String!, $headBranch: String!, $title: String!, $body: String) {
    createPullRequest(repo: $repo, base: $baseBranch, head: $headBranch, title: $title, body: $body) {
      url
      number
    }
  }
`;

/**
 * Represents the state of the PR Generator form.
 * @interface
 */
interface PrFormState {
  repo: string;
  baseBranch: string;
  headBranch: string;
  title: string;
  body: string;
}

/**
 * PrGenerator Feature Component
 * @description A user interface for creating GitHub pull requests. It allows for manual entry
 * of PR details as well as AI-powered generation of the title and body based on the
 * diff between the specified branches.
 * @returns {React.ReactElement} The rendered component.
 * @example
 * <PrGenerator initialRepo="my-org/my-project" />
 */
export const PrGenerator: React.FC<{ initialRepo?: string }> = ({ initialRepo = 'my-org/my-project' }) => {
  const [formState, setFormState] = useState<PrFormState>({
    repo: initialRepo,
    baseBranch: 'main',
    headBranch: 'feature/new-widget',
    title: '',
    body: '',
  });

  const [result, setResult] = useState<{ url: string; number: number } | null>(null);
  
  const [generateContent, { loading: isGenerating, error: generationError }] = useGraphQLMutation<any, any>(GENERATE_PR_CONTENT_MUTATION);
  const [createPr, { loading: isCreating, error: creationError }] = useGraphQLMutation<any, any>(CREATE_PULL_REQUEST_MUTATION);
  
  const isLoading = isGenerating || isCreating;
  const error = generationError || creationError;

  /**
   * Handles changes to form input fields and updates the component's state.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e The change event from the input field.
   * @security This function only updates state; sanitization is expected on the backend.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  /**
   * Invokes the AI service via the BFF to generate a pull request title and body.
   * The AI analyzes the diff between the head and base branches.
   * The results populate the form's title and body fields.
   * @performance This operation is performed on the server and may take a few seconds.
   *              The UI displays a loading state during this time.
   */
  const handleGenerateWithAi = useCallback(async () => {
    setResult(null);
    try {
      const { data } = await generateContent({
        repo: formState.repo,
        baseBranch: formState.baseBranch,
        headBranch: formState.headBranch,
      });
      if (data?.generatePullRequestContent) {
        setFormState(prevState => ({
          ...prevState,
          title: data.generatePullRequestContent.title,
          body: data.generatePullRequestContent.body,
        }));
      }
    } catch (e) {
      // Error is handled by the useGraphQLMutation hook's error state
      console.error("Failed to generate PR content with AI:", e);
    }
  }, [generateContent, formState]);

  /**
   * Submits the pull request data to the BFF to create a PR on GitHub.
   * Displays the resulting PR URL upon success or an error message on failure.
   * @param {React.FormEvent} e The form submission event.
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    try {
      const { data } = await createPr({
        repo: formState.repo,
        baseBranch: formState.baseBranch,
        headBranch: formState.headBranch,
        title: formState.title,
        body: formState.body,
      });
       if (data?.createPullRequest) {
        setResult(data.createPullRequest);
        setFormState(prevState => ({ ...prevState, title: '', body: '' }));
      }
    } catch (e) {
       // Error is handled by the useGraphQLMutation hook's error state
       console.error("Failed to create pull request:", e);
    }
  }, [createPr, formState]);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary bg-background">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <GitBranchIcon />
          <span className="ml-3">Pull Request Generator</span>
        </h1>
        <p className="text-text-secondary mt-1">Create a new pull request for your repository.</p>
      </header>
      
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4 min-h-0 max-w-4xl mx-auto w-full">
        <div>
          <label htmlFor="repo" className="text-sm font-medium">Repository</label>
          <Input type="text" id="repo" name="repo" value={formState.repo} onChange={handleChange} required />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="headBranch" className="text-sm font-medium">From branch (head)</label>
            <Input type="text" id="headBranch" name="headBranch" value={formState.headBranch} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="baseBranch" className="text-sm font-medium">To branch (base)</label>
            <Input type="text" id="baseBranch" name="baseBranch" value={formState.baseBranch} onChange={handleChange} required />
          </div>
        </div>
        
        <div className="flex-grow flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Button type="button" onClick={handleGenerateWithAi} disabled={isLoading}>
              {isGenerating ? <LoadingSpinner /> : <SparklesIcon />}
              Generate with AI
            </Button>
          </div>
          <Input type="text" id="title" name="title" value={formState.title} onChange={handleChange} required placeholder="feat: Add new widget" />
          
          <label htmlFor="body" className="text-sm font-medium mt-4">Description</label>
          <TextArea id="body" name="body" value={formState.body} onChange={handleChange} placeholder="Describe the changes in this pull request..." />
        </div>
        
        <div className="mt-4 flex flex-col items-center gap-4">
          <Button type="submit" disabled={isLoading} className="w-full max-w-xs">
            {isCreating ? <LoadingSpinner /> : <ArrowPathIcon />}
            Create Pull Request
          </Button>
          
          {error && <Alert type="error">{error.message}</Alert>}
          {result && (
            <Alert type="success">
              Pull Request #{result.number} created successfully!{' '}
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="font-bold underline">
                View on GitHub
              </a>
            </Alert>
          )}
        </div>
      </form>
    </div>
  );
};

export default PrGenerator;
