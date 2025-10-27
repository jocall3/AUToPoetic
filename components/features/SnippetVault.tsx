/**
 * @fileoverview SnippetVault micro-frontend.
 * This component provides a user interface for managing reusable code snippets.
 * It communicates with the BFF via GraphQL to perform CRUD operations and
 * leverage AI-powered enhancements like code improvement and automatic tagging.
 * All UI elements are sourced from the proprietary Core and Composite UI libraries.
 *
 * @see /services/core/snippet/ISnippetService.ts - for the backend service interface
 * @see /ui/core/Button.tsx - for the Button component
 * @security This component handles user-generated code. While the code is not executed
 *           client-side, care is taken to properly render it as text to prevent XSS.
 *           All AI operations are performed server-side.
 * @performance The component uses GraphQL for data fetching and mutations.
 *              A local search filter is implemented with useMemo for performance.
 *              Large snippet lists could impact client-side filtering performance.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Button,
  Icon,
  Input,
  TextArea,
  SidebarLayout,
  Panel,
  Header,
  Heading,
  Text,
  Tag,
  TagInput,
  Spinner,
} from '@jester/ui-core'; // Hypothetical Core UI library
import { useGraphQLQuery, useGraphQLMutation } from '@jester/infra-services'; // Hypothetical infra layer
import { downloadService } from '@jester/business-services'; // Hypothetical business layer service
import { useNotification } from '@jester/composite-ui'; // Hypothetical composite UI hook
import { Snippet } from '@jester/domain-models'; // Hypothetical domain models

// --- GraphQL Definitions ---

const GET_SNIPPETS_QUERY = `
  query GetSnippets {
    snippets {
      id
      name
      code
      language
      tags
    }
  }
`;

const CREATE_SNIPPET_MUTATION = `
  mutation CreateSnippet($input: CreateSnippetInput!) {
    createSnippet(input: $input) {
      id
      name
      code
      language
      tags
    }
  }
`;

const UPDATE_SNIPPET_MUTATION = `
  mutation UpdateSnippet($id: ID!, $input: UpdateSnippetInput!) {
    updateSnippet(id: $id, input: $input) {
      id
      name
      code
      language
      tags
    }
  }
`;

const DELETE_SNIPPET_MUTATION = `
  mutation DeleteSnippet($id: ID!) {
    deleteSnippet(id: $id)
  }
`;

const ENHANCE_SNIPPET_MUTATION = `
  mutation EnhanceSnippet($code: String!) {
    enhanceSnippet(code: $code) {
      enhancedCode
    }
  }
`;

const GENERATE_TAGS_MUTATION = `
  mutation GenerateTags($code: String!) {
    generateTagsForSnippet(code: $code)
  }
`;

const langToExt: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  css: 'css',
  html: 'html',
  json: 'json',
  markdown: 'md',
  plaintext: 'txt',
};

/**
 * Renders the Snippet Vault feature, allowing users to manage a collection of code snippets.
 * @returns {React.ReactElement} The rendered SnippetVault component.
 * @example
 * <SnippetVault />
 */
export const SnippetVault: React.FC = () => {
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const { addNotification } = useNotification();

  // --- Data Fetching & Mutations ---
  const { data, loading, error: queryError } = useGraphQLQuery(GET_SNIPPETS_QUERY);
  const snippets: Snippet[] = data?.snippets || [];

  const [createSnippet] = useGraphQLMutation(CREATE_SNIPPET_MUTATION, {
    refetchQueries: [{ query: GET_SNIPPETS_QUERY }],
  });
  const [updateSnippet] = useGraphQLMutation(UPDATE_SNIPPET_MUTATION);
  const [deleteSnippet] = useGraphQLMutation(DELETE_SNIPPET_MUTATION, {
    refetchQueries: [{ query: GET_SNIPPETS_QUERY }],
  });
  const [enhanceSnippet, { loading: isEnhancing }] = useGraphQLMutation(ENHANCE_SNIPPET_MUTATION);
  const [generateTags, { loading: isTagging }] = useGraphQLMutation(GENERATE_TAGS_MUTATION);

  const activeSnippet = useMemo(() => snippets.find((s) => s.id === activeSnippetId), [snippets, activeSnippetId]);

  const filteredSnippets = useMemo(() => {
    if (!searchTerm) return snippets;
    const lowerSearch = searchTerm.toLowerCase();
    return snippets.filter((s: Snippet) =>
      s.name.toLowerCase().includes(lowerSearch) ||
      s.code.toLowerCase().includes(lowerSearch) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(lowerSearch)))
    );
  }, [snippets, searchTerm]);

  useEffect(() => {
    if (!activeSnippetId && filteredSnippets.length > 0) {
      setActiveSnippetId(filteredSnippets[0].id);
    }
  }, [filteredSnippets, activeSnippetId]);

  /**
   * Handles the AI-driven enhancement of the active snippet's code.
   * @performance This is an async operation that communicates with the backend.
   *              UI feedback is provided via the `isEnhancing` loading state.
   */
  const handleEnhance = useCallback(async () => {
    if (!activeSnippet) return;

    try {
      const result = await enhanceSnippet({ variables: { code: activeSnippet.code } });
      const enhancedCode = result.data.enhanceSnippet.enhancedCode;
      
      // Optimistically update or use mutation response to update cache
      await updateSnippet({
        variables: {
          id: activeSnippet.id,
          input: { code: enhancedCode.replace(/^```(?:\w+\n)?/, '').replace(/```$/, '') },
        },
      });
      addNotification('Snippet enhanced by AI!', 'success');
    } catch (e) {
      const err = e as Error;
      addNotification(`Enhancement failed: ${err.message}`, 'error');
    }
  }, [activeSnippet, enhanceSnippet, updateSnippet, addNotification]);

  /**
   * Uses AI to generate and add relevant tags to a snippet.
   * @param {Snippet} snippet The snippet to generate tags for.
   */
  const handleAiTagging = useCallback(async (snippet: Snippet) => {
    if (!snippet.code.trim()) return;

    try {
      const result = await generateTags({ variables: { code: snippet.code } });
      const suggestedTags = result.data.generateTagsForSnippet;
      const newTags = [...new Set([...(snippet.tags || []), ...suggestedTags])];
      
      await updateSnippet({
        variables: { id: snippet.id, input: { tags: newTags } },
      });
      addNotification('AI tags added!', 'success');
    } catch (e) {
      const err = e as Error;
      addNotification(`AI tagging failed: ${err.message}`, 'error');
    }
  }, [generateTags, updateSnippet, addNotification]);

  /**
   * Creates a new, empty snippet and adds it to the list.
   */
  const handleAddNew = useCallback(async () => {
    try {
      const result = await createSnippet({
        variables: {
          input: { name: 'New Snippet', code: '', language: 'plaintext', tags: [] },
        },
      });
      setActiveSnippetId(result.data.createSnippet.id);
    } catch (e) {
      const err = e as Error;
      addNotification(`Failed to create snippet: ${err.message}`, 'error');
    }
  }, [createSnippet, addNotification]);

  /**
   * Deletes a snippet from the vault.
   * @param {string} id The ID of the snippet to delete.
   */
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteSnippet({ variables: { id } });
      if (activeSnippetId === id) {
        setActiveSnippetId(filteredSnippets.length > 1 ? filteredSnippets[0].id : null);
      }
      addNotification('Snippet deleted.', 'info');
    } catch (e) {
      const err = e as Error;
      addNotification(`Failed to delete snippet: ${err.message}`, 'error');
    }
  }, [deleteSnippet, addNotification, activeSnippetId, filteredSnippets]);

  /**
   * Triggers a browser download of the active snippet's code.
   */
  const handleDownload = useCallback(() => {
    if (!activeSnippet) return;
    const extension = langToExt[activeSnippet.language] || 'txt';
    const filename = `${activeSnippet.name.replace(/\s/g, '_')}.${extension}`;
    downloadService.downloadText(activeSnippet.code, filename);
  }, [activeSnippet]);

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditingName(false);
    if (activeSnippet && activeSnippet.name !== e.target.value) {
      updateSnippet({ variables: { id: activeSnippet.id, input: { name: e.target.value } } });
    }
  };

  /**
   * Updates the tags for the active snippet.
   * @param {string[]} newTags An array of the new tags.
   */
  const handleTagsUpdate = (newTags: string[]) => {
    if (activeSnippet) {
      updateSnippet({
        variables: { id: activeSnippet.id, input: { tags: newTags } },
      });
    }
  };

  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><Spinner size="large" /></div>;
  }

  if (queryError) {
    return <div className="flex h-full w-full items-center justify-center text-red-500">Error loading snippets: {queryError.message}</div>;
  }

  const sidebarContent = (
    <Panel className="flex flex-col h-full">
      <Panel.Header>
        <Input
          placeholder="Search snippets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search snippets"
        />
      </Panel.Header>
      <Panel.Body className="flex-grow overflow-y-auto pr-2">
        <ul className="space-y-2">
          {filteredSnippets.map((s: Snippet) => (
            <li key={s.id} className="group flex items-center justify-between">
              <Button
                variant={activeSnippet?.id === s.id ? 'primary' : 'ghost'}
                onClick={() => setActiveSnippetId(s.id)}
                className="w-full text-left justify-start"
              >
                {s.name}
              </Button>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(s.code); addNotification("Copied snippet!", "success"); }} title="Copy">
                  <Icon name="clipboard-document" />
                </Button>
                <Button variant="ghost" size="icon" color="danger" onClick={() => handleDelete(s.id)} title="Delete">
                  <Icon name="trash" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel.Body>
      <Panel.Footer>
        <Button variant="primary" onClick={handleAddNew} className="w-full">
          Add New Snippet
        </Button>
      </Panel.Footer>
    </Panel>
  );

  const mainContent = (
    <Panel className="flex flex-col h-full">
      {activeSnippet ? (
        <>
          <Header className="flex justify-between items-center">
            {isEditingName ? (
              <Input
                defaultValue={activeSnippet.name}
                onBlur={handleNameBlur}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                autoFocus
                className="text-lg font-bold"
                aria-label="Snippet name"
              />
            ) : (
              <Heading as="h3" onDoubleClick={() => setIsEditingName(true)} className="cursor-pointer">
                {activeSnippet.name}
              </Heading>
            )}
            <div className="flex gap-2">
              <Button onClick={() => handleAiTagging(activeSnippet)} disabled={isTagging} size="sm" variant="secondary">
                <Icon name="sparkles" /> {isTagging ? 'Tagging...' : 'AI Tag'}
              </Button>
              <Button onClick={handleEnhance} disabled={isEnhancing} size="sm" variant="secondary">
                <Icon name="sparkles" /> {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
              </Button>
              <Button onClick={handleDownload} size="sm" variant="ghost">
                <Icon name="arrow-down-tray" /> Download
              </Button>
            </div>
          </Header>
          <TextArea
            value={activeSnippet.code}
            onChange={(e) => updateSnippet({
              variables: { id: activeSnippet.id, input: { code: e.target.value } },
              optimisticResponse: { updateSnippet: { ...activeSnippet, code: e.target.value, __typename: 'Snippet' } }
            })}
            className="flex-grow font-mono text-sm"
            aria-label="Snippet code"
          />
          <Panel.Footer>
            <TagInput
              tags={activeSnippet.tags ?? []}
              onTagsChange={handleTagsUpdate}
              placeholder="+ Add tag"
              aria-label="Snippet tags"
            />
          </Panel.Footer>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center text-text-secondary">
          Select a snippet or create a new one.
        </div>
      )}
    </Panel>
  );
  
  return (
    <div className="h-full p-4 sm:p-6 lg:p-8">
      <Header>
        <Heading as="h1" className="flex items-center gap-3">
          <Icon name="lock-closed" />
          Snippet Vault
        </Heading>
        <Text variant="secondary">Store, search, tag, and enhance your reusable code snippets with AI.</Text>
      </Header>
      <SidebarLayout sidebar={sidebarContent} main={mainContent} />
    </div>
  );
};