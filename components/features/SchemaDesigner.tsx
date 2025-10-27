/**
 * @file components/features/SchemaDesigner.tsx
 * @module SchemaDesigner
 * @description A comprehensive, interactive, visual tool for designing database schemas.
 * It allows users to create, position, and edit tables and their columns on a canvas.
 * The designed schema can be exported as SQL or JSON.
 * This component has been refactored to be more modular and feature-rich, following architectural directives.
 * @see {@link Table} for the data structure of a table.
 * @see {@link Column} for the data structure of a column.
 * @example
 * <SchemaDesigner />
 * @security This component is entirely client-side and does not transmit schema data to any server, ensuring user data privacy. Exported files are generated and downloaded locally.
 * @performance The component uses React state management and direct DOM manipulation for dragging, which is efficient for a moderate number of tables. Performance may degrade with hundreds of tables on the canvas.
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { MapIcon, ArrowDownTrayIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '../icons.tsx';
import { downloadFile } from '../../services/fileUtils.ts';

// --- TYPE DEFINITIONS ---

/**
 * @interface Column
 * @description Represents a single column within a database table schema.
 * @property {number} id - A unique identifier for the column within its table.
 * @property {string} name - The name of the column (e.g., 'user_id', 'created_at').
 * @property {string} type - The data type of the column (e.g., 'INTEGER PRIMARY KEY', 'VARCHAR(255)').
 */
interface Column {
  id: number;
  name: string;
  type: string;
}

/**
 * @interface Table
 * @description Represents a single table in the database schema, including its properties and columns.
 * @property {number} id - A unique identifier for the table.
 * @property {string} name - The name of the table (e.g., 'users', 'posts').
 * @property {Column[]} columns - An array of Column objects that belong to this table.
 * @property {number} x - The x-coordinate for the table's position on the canvas.
 * @property {number} y - The y-coordinate for the table's position on the canvas.
 */
interface Table {
  id: number;
  name: string;
  columns: Column[];
  x: number;
  y: number;
}

/**
 * @type DragState
 * @description Represents the state of a drag operation on a table node.
 * @property {number} id - The ID of the table being dragged.
 * @property {number} offsetX - The horizontal offset from the cursor to the top-left of the element.
 * @property {number} offsetY - The vertical offset from the cursor to the top-left of the element.
 */
type DragState = {
  id: number;
  offsetX: number;
  offsetY: number;
} | null;

// --- UTILITY FUNCTIONS ---

/**
 * @function exportSchemaToSQL
 * @description Converts an array of Table objects into a SQL CREATE TABLE string.
 * @param {Table[]} tables - The array of table schemas to convert.
 * @returns {string} A string containing SQL statements for creating the tables.
 * @example
 * const tables = [{ id: 1, name: 'users', columns: [{ id: 1, name: 'id', type: 'INTEGER' }], x: 0, y: 0 }];
 * const sql = exportSchemaToSQL(tables);
 * // sql is "CREATE TABLE \"users\" (\n  \"id\" INTEGER\n);"
 * @performance This function has a complexity of O(T * C) where T is the number of tables and C is the number of columns. For typical schemas, it's very fast.
 * @security The function does basic quoting of table and column names, but does not sanitize for complex SQL injection vectors in types. Assumes `name` and `type` are controlled inputs.
 */
const exportSchemaToSQL = (tables: Table[]): string => {
    return tables.map(table => {
        const columnsSQL = table.columns
            .map(col => `  \"${col.name}\" ${col.type.toUpperCase()}`)
            .join(',\n');
        return `CREATE TABLE \"${table.name}\" (\n${columnsSQL}\n);`;
    }).join('\n\n');
};

/**
 * @function exportSchemaToJson
 * @description Converts an array of Table objects into a formatted JSON string.
 * @param {Table[]} tables - The array of table schemas to convert.
 * @returns {string} A pretty-printed JSON string representing the schema.
 * @performance This is a very fast operation, relying on the native JSON.stringify.
 */
const exportSchemaToJson = (tables: Table[]): string => {
    return JSON.stringify(tables, null, 2);
};

// --- SUB-COMPONENTS ---

/**
 * @component TableNode
 * @description Renders a single draggable table node on the schema canvas. Includes functionality for inline editing of columns.
 * @param {object} props - The component props.
 * @param {Table} props.table - The table data to render.
 * @param {boolean} props.isSelected - Whether this table is currently selected.
 * @param {Function} props.onMouseDown - Callback for when a drag operation starts on the table.
 * @param {Function} props.onClick - Callback for when the table is clicked (to select it).
 * @param {Function} props.onUpdate - Callback to update the table's data in the parent state.
 * @returns {React.ReactElement} The rendered table node.
 */
const TableNode: React.FC<{ 
    table: Table; 
    isSelected: boolean;
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>, id: number) => void;
    onClick: (e: React.MouseEvent<HTMLDivElement>, id: number) => void;
    onUpdate: (table: Table) => void;
}> = ({ table, isSelected, onMouseDown, onClick, onUpdate }) => {
    const [editingColumnId, setEditingColumnId] = useState<number | null>(null);
    const [tempColumn, setTempColumn] = useState<Column | null>(null);

    const handleEditColumn = (column: Column) => {
        setEditingColumnId(column.id);
        setTempColumn(column);
    };

    const handleSaveColumn = () => {
        if (!tempColumn) return;
        const newColumns = table.columns.map(c => c.id === tempColumn.id ? tempColumn : c);
        onUpdate({ ...table, columns: newColumns });
        setEditingColumnId(null);
        setTempColumn(null);
    };

    const handleCancelEdit = () => {
        setEditingColumnId(null);
        setTempColumn(null);
    };

    const handleAddColumn = () => {
        const newColumn: Column = { id: Date.now(), name: 'new_column', type: 'TEXT' };
        onUpdate({ ...table, columns: [...table.columns, newColumn] });
    };

    const handleDeleteColumn = (columnId: number) => {
        onUpdate({ ...table, columns: table.columns.filter(c => c.id !== columnId) });
    };

    return (
        <div 
            className={`absolute w-64 bg-surface rounded-lg shadow-xl border cursor-grab active:cursor-grabbing flex flex-col ${isSelected ? 'border-primary ring-2 ring-primary/50' : 'border-border'}`}
            style={{ top: table.y, left: table.x }}
            onMouseDown={e => onMouseDown(e, table.id)}
            onClick={e => onClick(e, table.id)}
        >
            <h3 className="font-bold text-primary text-lg p-2 bg-background rounded-t-lg border-b border-border">{table.name}</h3>
            <div className="p-2 space-y-1 font-mono text-xs">
                {table.columns.map(col => (
                    <div key={col.id} className="group flex justify-between items-center hover:bg-background/50 rounded p-1">
                        {editingColumnId === col.id && tempColumn ? (
                            <div className="flex flex-col gap-1 w-full">
                                <input value={tempColumn.name} onChange={e => setTempColumn({...tempColumn, name: e.target.value})} className="w-full bg-background border rounded px-1"/>
                                <input value={tempColumn.type} onChange={e => setTempColumn({...tempColumn, type: e.target.value})} className="w-full bg-background border rounded px-1"/>
                                <div className='flex gap-1 self-end'><button onClick={handleSave}><CheckIcon/></button><button onClick={handleCancelEdit}><XMarkIcon/></button></div>
                            </div>
                        ) : (
                            <>
                                <span className="text-text-primary">{col.name}</span>
                                <div className='flex items-center gap-2'>
                                    <span className="text-text-secondary">{col.type.toUpperCase()}</span>
                                    <div className='flex opacity-0 group-hover:opacity-100'>
                                        <button onClick={() => handleEditColumn(col)}><PencilIcon/></button>
                                        <button onClick={() => handleDeleteColumn(col.id)}><TrashIcon/></button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                 <button onClick={handleAddColumn} className="mt-2 w-full text-center text-xs text-primary p-1 rounded hover:bg-primary/10">+ Add Column</button>
            </div>
        </div>
    );
};

/**
 * @component SchemaEditorPanel
 * @description A sidebar panel that provides controls for adding new tables and editing the properties of a selected table.
 * @param {object} props - The component props.
 * @param {Table | null} props.selectedTable - The currently selected table object, or null if none is selected.
 * @param {Function} props.onAddTable - Callback to add a new table to the schema.
 * @param {Function} props.onUpdateTable - Callback to update the selected table's data.
 * @param {Function} props.onDeleteTable - Callback to delete the selected table.
 * @returns {React.ReactElement} The rendered editor panel.
 */
const SchemaEditorPanel: React.FC<{ 
    selectedTable: Table | null; 
    onAddTable: () => void;
    onUpdateTable: (table: Table) => void;
    onDeleteTable: (tableId: number) => void;
}> = ({ selectedTable, onAddTable, onUpdateTable, onDeleteTable }) => {
    return (
        <div className="bg-surface border border-border p-4 rounded-lg overflow-y-auto">
            <h3 className="font-bold mb-2 text-lg">Schema Editor</h3>
            {selectedTable ? (
                <div className='space-y-4'>
                    <div>
                        <label className='text-sm font-semibold'>Table Name</label>
                        <input 
                            value={selectedTable.name} 
                            onChange={e => onUpdateTable({...selectedTable, name: e.target.value})} 
                            className='w-full p-2 mt-1 bg-background border border-border rounded'
                        />
                    </div>
                    <div>
                        <h4 className='text-sm font-semibold mb-1'>Columns</h4>
                        {/* Column editor can be expanded here */}
                        <p className='text-xs text-text-secondary'>Edit columns directly on the table nodes for now.</p>
                    </div>
                     <button onClick={() => onDeleteTable(selectedTable.id)} className="w-full text-sm py-2 bg-red-500/10 text-red-500 rounded-md flex items-center justify-center gap-2 hover:bg-red-500/20">
                        <TrashIcon /> Delete Table
                    </button>
                </div>
            ) : (
                <div className='text-center text-text-secondary py-8'>
                    <p>No table selected.</p>
                    <button onClick={onAddTable} className="btn-primary mt-4 w-full flex items-center justify-center gap-2 px-4 py-2">
                        <PlusIcon /> Add New Table
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * @component SchemaDesigner
 * @description A comprehensive, interactive, visual tool for designing database schemas.
 * It allows users to create, position, and edit tables and their columns on a canvas.
 * The designed schema can be exported as SQL or JSON.
 */
export const SchemaDesigner: React.FC = () => {
    const [tables, setTables] = useState<Table[]>([
        { id: 1, name: 'users', columns: [{ id: 1, name: 'id', type: 'INTEGER PRIMARY KEY' }, {id: 2, name: 'username', type: 'VARCHAR(255)'}], x: 50, y: 50 },
        { id: 2, name: 'posts', columns: [{ id: 1, name: 'id', type: 'INTEGER PRIMARY KEY' }, {id: 2, name: 'user_id', type: 'INTEGER'}, {id: 3, name: 'content', type: 'TEXT'}], x: 350, y: 100 },
    ]);
    const [dragging, setDragging] = useState<DragState>(null);
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId) || null, [tables, selectedTableId]);

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, id: number) => {
        const tableElement = e.currentTarget.parentElement as HTMLDivElement;
        const rect = tableElement.getBoundingClientRect();
        const canvasRect = canvasRef.current!.getBoundingClientRect();
        setDragging({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
        setSelectedTableId(id);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!dragging || !canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const newX = e.clientX - dragging.offsetX - canvasRect.left + canvasRef.current.scrollLeft;
        const newY = e.clientY - dragging.offsetY - canvasRect.top + canvasRef.current.scrollTop;
        setTables(prevTables => prevTables.map(t => t.id === dragging.id ? { ...t, x: Math.max(0, newX), y: Math.max(0, newY) } : t));
    }, [dragging]);

    const handleMouseUp = useCallback(() => {
        setDragging(null);
    }, []);

    const handleTableClick = useCallback((e: React.MouseEvent<HTMLDivElement>, id: number) => {
        e.stopPropagation();
        setSelectedTableId(id);
    }, []);

    const handleCanvasClick = useCallback(() => {
        setSelectedTableId(null);
    }, []);

    const handleUpdateTable = useCallback((updatedTable: Table) => {
        setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
    }, []);

    const handleAddTable = useCallback(() => {
        const newTable: Table = {
            id: Date.now(),
            name: 'new_table',
            columns: [{ id: Date.now(), name: 'id', type: 'INTEGER PRIMARY KEY' }],
            x: 100,
            y: 100,
        };
        setTables(prev => [...prev, newTable]);
        setSelectedTableId(newTable.id);
    }, []);

    const handleDeleteTable = useCallback((tableId: number) => {
        setTables(prev => prev.filter(t => t.id !== tableId));
        if (selectedTableId === tableId) {
            setSelectedTableId(null);
        }
    }, [selectedTableId]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6"><h1 className="text-3xl font-bold flex items-center"><MapIcon /><span className="ml-3">Schema Designer</span></h1><p className="text-text-secondary mt-1">Visually design your database schema with drag-and-drop.</p></header>
            <div className="flex-grow flex gap-6 min-h-0">
                <main ref={canvasRef} className="flex-grow relative bg-background rounded-lg border-2 border-dashed border-border overflow-auto" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleCanvasClick}>
                    {tables.map(table => (
                       <TableNode 
                            key={table.id} 
                            table={table} 
                            isSelected={selectedTableId === table.id}
                            onMouseDown={handleMouseDown} 
                            onClick={handleTableClick}
                            onUpdate={handleUpdateTable}
                       />
                    ))}
                </main>
                <aside className="w-80 flex-shrink-0 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                         <button onClick={() => downloadFile(exportSchemaToJson(tables), 'schema.json', 'application/json')} className="flex-1 text-sm py-2 bg-gray-100 dark:bg-slate-700 border border-border rounded-md flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-slate-600">
                            <ArrowDownTrayIcon className="w-4 h-4"/> Download JSON
                        </button>
                         <button onClick={() => downloadFile(exportSchemaToSQL(tables), 'schema.sql', 'application/sql')} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2">
                            <ArrowDownTrayIcon className="w-4 h-4"/> Download SQL
                         </button>
                    </div>
                    <SchemaEditorPanel 
                        selectedTable={selectedTable} 
                        onAddTable={handleAddTable}
                        onUpdateTable={handleUpdateTable}
                        onDeleteTable={handleDeleteTable}
                    />
                </aside>
            </div>
        </div>
    );
};