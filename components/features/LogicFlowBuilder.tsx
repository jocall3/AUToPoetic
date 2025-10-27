/**
 * @file LogicFlowBuilder.tsx
 * @module components/features/LogicFlowBuilder
 * @description This file contains the implementation of the LogicFlowBuilder, a visual tool for creating and orchestrating workflows from available features.
 * @version 2.0.0
 * @author Elite AI Implementation Team
 * @date 2024-07-16
 *
 * @security
 * This component interacts with the backend BFF via GraphQL to generate pipeline code. All code generation prompts are processed server-side, mitigating client-side execution risks. The client only displays the generated code as text. User interactions are limited to graph manipulation and do not involve direct script execution.
 *
 * @performance
 * The component leverages React.memo for node rendering to prevent unnecessary re-renders. State management is optimized with React hooks. For very large workflows (hundreds of nodes), the topological sort in `handleGenerateCode` could potentially impact main thread performance. If this becomes a bottleneck, this logic should be offloaded to a dedicated web worker using the `WorkerPoolManager` service. SVG rendering for a large number of links can also be performance-intensive and may require virtualization techniques if needed.
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';

// Fictional imports for the new architecture
import { Button, Panel, Card, Modal, Spinner, Alert, CodeBlock } from '@proprietary/core-ui';
import { useGraphQLQuery, useGraphQLMutation } from '@proprietary/data-access';
import { MapIcon, SparklesIcon, XMarkIcon } from '@proprietary/icons';
import { useNotification } from '@proprietary/contexts';
import type { WorkflowTool, Node, Link } from '@proprietary/types';
import { WorkerPoolManager } from '@proprietary/services'; // For future performance optimization

// --- GraphQL Definitions (assumed to be in a separate file) ---

/**
 * @const GET_WORKFLOW_TOOLS_QUERY
 * @description GraphQL query to fetch the list of available tools for the workflow builder from the BFF.
 * @example
 * useGraphQLQuery(GET_WORKFLOW_TOOLS_QUERY);
 */
const GET_WORKFLOW_TOOLS_QUERY = `
  query GetWorkflowTools {
    workflowTools {
      id
      name
      description
      category
      icon
      inputs {
        name
        type
        description
      }
      outputs {
        name
        type
        description
      }
    }
  }
`;

/**
 * @const GENERATE_PIPELINE_CODE_MUTATION
 * @description GraphQL mutation to generate pipeline code based on a workflow description.
 * @example
 * const [generateCode, { loading, error }] = useGraphQLMutation(GENERATE_PIPELINE_CODE_MUTATION);
 * generateCode({ variables: { description: "Step 1: Do X. Step 2: Do Y." } });
 */
const GENERATE_PIPELINE_CODE_MUTATION = `
  mutation GeneratePipelineCode($description: String!) {
    generatePipelineCode(description: $description) {
      code
      language
    }
  }
`;


// --- Component Implementations ---

/**
 * Renders a single tool in the feature palette.
 * @param {object} props - The component props.
 * @param {WorkflowTool} props.tool - The tool data to render.
 * @param {(e: React.DragEvent, toolId: string) => void} props.onDragStart - Drag start handler.
 * @returns {React.ReactElement} A draggable palette item.
 */
const FeaturePaletteItem: React.FC<{ tool: WorkflowTool, onDragStart: (e: React.DragEvent, toolId: string) => void }> = React.memo(({ tool, onDragStart }) => (
    <Card
        draggable
        onDragStart={e => onDragStart(e, tool.id)}
        className="p-3 flex items-center gap-3 cursor-grab hover:bg-surface-hover transition-colors"
    >
        <div className="text-primary flex-shrink-0 text-xl">{/* Icon would be rendered here */}</div>
        <div>
            <h4 className="font-bold text-sm text-text-primary">{tool.name}</h4>
            <p className="text-xs text-text-secondary">{tool.category}</p>
        </div>
    </Card>
));

/**
 * Renders a node on the canvas.
 * @param {object} props - The component props.
 * @param {Node} props.node - The node data.
 * @param {WorkflowTool} props.tool - The tool data corresponding to the node.
 * @param {(e: React.MouseEvent, id: number) => void} props.onMouseDown - Mouse down handler for dragging.
 * @param {(e: React.MouseEvent, id: number) => void} props.onLinkStart - Handler for starting a link drag.
 * @param {(e: React.MouseEvent, id: number) => void} props.onLinkEnd - Handler for ending a link drag.
 * @returns {React.ReactElement} A node component.
 */
const NodeComponent: React.FC<{
    node: Node;
    tool: WorkflowTool;
    onMouseDown: (e: React.MouseEvent, id: number) => void;
    onLinkEnd: (e: React.MouseEvent, id: number) => void;
    onLinkStart: (e: React.MouseEvent, id: number) => void;
}> = React.memo(({ node, tool, onMouseDown, onLinkStart, onLinkEnd }) => (
    <div
        className="absolute w-56 bg-surface rounded-lg shadow-md border-2 border-border cursor-grab active:cursor-grabbing flex flex-col"
        style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
        onMouseDown={e => onMouseDown(e, node.id)}
        onMouseUp={e => onLinkEnd(e, node.id)}
    >
        <Card.Header className="p-2 flex items-center gap-2">
            <div className="w-5 h-5 text-primary">{/* Icon */}</div>
            <span className="text-sm font-semibold truncate text-text-primary">{tool.name}</span>
        </Card.Header>
        <Card.Content className="relative p-3 text-xs text-text-secondary min-h-[40px] flex items-center justify-center">
            Workflow Node
            <div
                onMouseDown={e => onLinkStart(e, node.id)}
                className="absolute right-[-9px] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-surface cursor-crosshair hover:scale-125 transition-transform"
                title="Drag to connect"
            />
        </Card.Content>
    </div>
));


/**
 * @component LogicFlowBuilder
 * @description A visual workflow builder for orchestrating AI and development tools. Users can drag tools onto a canvas,
 * connect them to define a sequence, and generate executable pipeline code via a backend service.
 * @example
 * <LogicFlowBuilder />
 */
export const LogicFlowBuilder: React.FC = () => {
    const { addNotification } = useNotification();
    const [nodes, setNodes] = useState<Node[]>([]);
    const [links, setLinks] = useState<Link[]>([]);
    const [draggingNode, setDraggingNode] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
    const [linking, setLinking] = useState<{ from: number; fromPos: { x: number; y: number }; toPos: { x: number; y: number } } | null>(null);
    const [generatedCode, setGeneratedCode] = useState<{ code: string; language: string } | null>(null);
    const [isCodeModalOpen, setCodeModalOpen] = useState(false);
    
    const canvasRef = useRef<HTMLDivElement>(null);

    const { data: toolsData, loading: toolsLoading, error: toolsError } = useGraphQLQuery(GET_WORKFLOW_TOOLS_QUERY);
    const [generateCode, { loading: codeGenerating }] = useGraphQLMutation(GENERATE_PIPELINE_CODE_MUTATION);

    const tools: WorkflowTool[] = useMemo(() => toolsData?.workflowTools || [], [toolsData]);
    const toolsMap = useMemo(() => new Map(tools.map(t => [t.id, t])), [tools]);

    /**
     * @function handleGenerateCode
     * @description Topologically sorts the graph nodes, constructs a workflow description,
     * and calls the BFF via a GraphQL mutation to generate the pipeline code.
     * @performance For very large graphs, the topological sort could be a candidate for offloading to a web worker.
     * @returns {Promise<void>}
     */
    const handleGenerateCode = useCallback(async () => {
        // 1. Topological Sort to determine execution order
        const sortedNodeIds: number[] = [];
        const inDegree = new Map<number, number>();
        nodes.forEach(node => inDegree.set(node.id, 0));
        links.forEach(link => inDegree.set(link.to, (inDegree.get(link.to) || 0) + 1));
        
        const queue = nodes.filter(node => inDegree.get(node.id) === 0).map(n => n.id);
        
        while(queue.length > 0) {
            const u = queue.shift()!;
            sortedNodeIds.push(u);
            links.filter(l => l.from === u).forEach(l => {
                const newDegree = (inDegree.get(l.to) || 0) - 1;
                inDegree.set(l.to, newDegree);
                if(newDegree === 0) queue.push(l.to);
            });
        }

        if (sortedNodeIds.length !== nodes.length) {
            addNotification("Workflow contains a cycle! Cannot generate code.", "error");
            return;
        }

        // 2. Construct description
        const flowDescription = sortedNodeIds.map((id, index) => {
            const node = nodes.find(n => n.id === id)!;
            const toolInfo = toolsMap.get(node.toolId);
            return `Step ${index + 1}: Execute '${toolInfo?.name}'. Description: ${toolInfo?.description}. Inputs: ${JSON.stringify(toolInfo?.inputs)}.`;
        }).join('\n');

        // 3. Call GraphQL mutation
        try {
            const result = await generateCode({ variables: { description: flowDescription } });
            if (result.data?.generatePipelineCode) {
                setGeneratedCode(result.data.generatePipelineCode);
                setCodeModalOpen(true);
            } else {
                throw new Error(result.errors?.[0]?.message || "Unknown error from code generation API.");
            }
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to generate code.';
            addNotification(message, "error");
        }
    }, [nodes, links, toolsMap, generateCode, addNotification]);

    const handleDragStart = useCallback((e: React.DragEvent, toolId: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ toolId }));
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!canvasRef.current) return;
        try {
            const { toolId } = JSON.parse(e.dataTransfer.getData('application/json'));
            if (!toolsMap.has(toolId)) return;
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const newNode: Node = {
                id: Date.now(),
                toolId,
                x: e.clientX - canvasRect.left,
                y: e.clientY - canvasRect.top,
            };
            setNodes(prev => [...prev, newNode]);
        } catch (error) {
            addNotification("Failed to add node from dropped data.", "error");
        }
    }, [toolsMap, addNotification]);

    const handleNodeMouseDown = useCallback((e: React.MouseEvent, id: number) => {
        const node = nodes.find(n => n.id === id);
        if (!node || (e.target as HTMLElement).title === 'Drag to connect') return;
        const canvasRect = canvasRef.current!.getBoundingClientRect();
        setDraggingNode({ id, offsetX: e.clientX - canvasRect.left - node.x, offsetY: e.clientY - canvasRect.top - node.y });
    }, [nodes]);

    const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
        if (!canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;

        if (draggingNode) {
            setNodes(prev => prev.map(n => n.id === draggingNode.id ? { ...n, x: mouseX - draggingNode.offsetX, y: mouseY - draggingNode.offsetY } : n));
        }
        if (linking) {
            setLinking(prev => prev ? { ...prev, toPos: { x: mouseX, y: mouseY } } : null);
        }
    }, [draggingNode, linking]);

    const handleCanvasMouseUp = useCallback(() => {
        setDraggingNode(null);
        setLinking(null);
    }, []);

    const handleLinkStart = useCallback((e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const fromNode = nodes.find(n => n.id === id);
        if (!fromNode) return;
        setLinking({ from: id, fromPos: { x: fromNode.x, y: fromNode.y }, toPos: { x: fromNode.x, y: fromNode.y } });
    }, [nodes]);

    const handleLinkEnd = useCallback((e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (linking && linking.from !== id) {
            setLinks(prev => [...prev.filter(l => l.from !== linking.from), { from: linking.from, to: id }]);
        }
        setLinking(null);
    }, [linking]);

    const nodePositions = useMemo(() => new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }])), [nodes]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold flex items-center"><MapIcon /><span className="ml-3">Logic Flow Builder</span></h1>
                    <p className="text-text-secondary mt-1">Visually build application logic flows and generate pipeline code.</p>
                </div>
                <Button onClick={handleGenerateCode} disabled={codeGenerating || nodes.length === 0} icon={<SparklesIcon />}>
                    {codeGenerating ? 'Generating...' : 'Generate Code'}
                </Button>
            </header>

            {toolsError && <Alert variant="error" title="Failed to load tools">{toolsError.message}</Alert>}

            <div className="flex-grow flex gap-6 min-h-0">
                <Panel className="w-72 flex-shrink-0" title="Tools Palette">
                    <div className="flex-grow overflow-y-auto space-y-3 p-4">
                        {toolsLoading && <Spinner />}
                        {tools.map(tool => <FeaturePaletteItem key={tool.id} tool={tool} onDragStart={handleDragStart} />)}
                    </div>
                </Panel>
                
                <main
                    ref={canvasRef}
                    className="flex-grow relative bg-background-alt border-2 border-dashed border-border rounded-lg overflow-hidden"
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                >
                    <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
                        <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-primary)" /></marker></defs>
                        {links.map((link, i) => {
                            const fromNode = nodePositions.get(link.from);
                            const toNode = nodePositions.get(link.to);
                            return fromNode && toNode ? <line key={i} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} stroke="var(--color-primary)" strokeWidth="2" markerEnd="url(#arrow)" /> : null;
                        })}
                        {linking && <line x1={linking.fromPos.x} y1={linking.fromPos.y} x2={linking.toPos.x} y2={linking.toPos.y} stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="5,5" />}
                    </svg>
                    {nodes.map(node => {
                        const tool = toolsMap.get(node.toolId);
                        return tool ? <NodeComponent key={node.id} node={node} tool={tool} onMouseDown={handleNodeMouseDown} onLinkStart={handleLinkStart} onLinkEnd={handleLinkEnd} /> : null;
                    })}
                </main>
            </div>

            <Modal isOpen={isCodeModalOpen} onClose={() => setCodeModalOpen(false)} title="Generated Pipeline Code">
                {generatedCode && (
                    <CodeBlock language={generatedCode.language} code={generatedCode.code} />
                )}
            </Modal>
        </div>
    );
};