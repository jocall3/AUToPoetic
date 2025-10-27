/**
 * @file This file is the central repository for all SVG icons used throughout the application.
 * It adheres to the 'Core UI' library directive by providing a single, consistent source for iconography.
 * Each icon is a stateless React functional component.
 * @licence
 * Copyright James Burvel O’Callaghan III
 * President Citibank Demo Business Inc.
 * @security This file is safe to expose publicly as it only contains UI definitions.
 * @performance Icons are small, stateless components and have minimal performance impact.
 */

import React from 'react';

/**
 * A wrapper component to provide consistent sizing and styling for all icons.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The SVG element to wrap.
 * @param {string} [props.className] - Optional additional CSS classes.
 * @returns {React.ReactElement} The wrapped icon.
 * @example <IconWrapper><svg>...</svg></IconWrapper>
 */
const IconWrapper: React.FC<{children: React.ReactNode; className?: string}> = ({ children, className }) => (
    <div className={className ?? 'w-6 h-6'}>{children}</div>
);

/**
 * A specialized wrapper for icons used within window title bars for consistent sizing.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The SVG element to wrap.
 * @returns {React.ReactElement} The wrapped window icon.
 */
const WindowIconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (<div className="w-4 h-4">{children}</div>);

// --- General UI & Navigation Icons ---

/** Renders a home icon. */
export const HomeIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg></IconWrapper>;
/** Renders a settings (cog) icon. */
export const Cog6ToothIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.008 1.11-1.212l2.39-1.062a1.25 1.25 0 0 1 1.415.602l.62 1.24a1.25 1.25 0 0 0 1.282.693l2.394-.852a1.25 1.25 0 0 1 1.415 1.415l-.852 2.394a1.25 1.25 0 0 0 .693 1.282l1.24.62a1.25 1.25 0 0 1 .602 1.415l-1.062 2.39a1.25 1.25 0 0 0-1.212 1.11l-.22 1.319a1.25 1.25 0 0 1-1.393 1.053l-2.32-.82a1.25 1.25 0 0 0-1.353 0l-2.32.82a1.25 1.25 0 0 1-1.393-1.053l-.22-1.319a1.25 1.25 0 0 0-1.212-1.11l-1.062-2.39a1.25 1.25 0 0 1 .602-1.415l1.24-.62a1.25 1.25 0 0 0 .693-1.282l-.852-2.394a1.25 1.25 0 0 1 1.415-1.415l2.394.852a1.25 1.25 0 0 0 1.282-.693l.62-1.24a1.25 1.25 0 0 1 1.415-.602l-2.39 1.062a1.25 1.25 0 0 0-1.11 1.212Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg></IconWrapper>;
/** Renders a folder icon. */
export const FolderIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg></IconWrapper>;
/** Renders a link icon. */
export const LinkIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg></IconWrapper>;
/** Renders an 'x' mark icon, typically used for closing. */
export const XMarkIcon: React.FC<{className?: string}> = ({className}) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></IconWrapper>;
/** Renders a plus icon. */
export const PlusIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></IconWrapper>;
/** Renders a trash can icon. */
export const TrashIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></IconWrapper>;
/** Renders a pencil icon. */
export const PencilIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg></IconWrapper>;
/** Renders a sun icon for theme toggling. */
export const SunIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg></IconWrapper>;
/** Renders a moon icon for theme toggling. */
export const MoonIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg></IconWrapper>;
/** Renders a logout icon. */
export const ArrowLeftOnRectangleIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H5" /></svg></IconWrapper>;
/** Renders a download icon. */
export const ArrowDownTrayIcon: React.FC<{className?: string}> = ({className}) => <IconWrapper className={className}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg></IconWrapper>;
/** Renders an upload icon. */
export const ArrowUpOnSquareIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3v12" /></svg></IconWrapper>;
/** Renders a chevron down icon. */
export const ChevronDownIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg></IconWrapper>;
/** Renders a notification bell icon. */
export const BellIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg></IconWrapper>;
/** Renders a clipboard document icon. */
export const ClipboardDocumentIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876C9.083 2.25 6.105 5.106 6.105 9.125v3.375c0 .621.504 1.125 1.125 1.125h9.75Z" /></svg></IconWrapper>;
/** Renders a window icon. */
export const WindowIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v17.792M6 3.104h12M6 20.896h12" /></svg></IconWrapper>;
/** Renders a window minimize icon. */
export const MinimizeIcon: React.FC = () => <WindowIconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg></WindowIconWrapper>;
/** Renders a window maximize icon. */
export const MaximizeIcon: React.FC = () => <WindowIconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h15v15h-15z" /></svg></WindowIconWrapper>;
/** Renders a window restore icon. */
export const RestoreIcon: React.FC = () => <WindowIconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5h11v11h-11z M4.5 4.5h11v11h-11z" /></svg></WindowIconWrapper>;

// --- Feature & Application Icons ---

/** Renders a CPU chip icon. */
export const CpuChipIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M8.25 21v-1.5M4.5 15.75H3m18 0h-1.5M21 8.25v7.5A2.25 2.25 0 0 1 18.75 18H5.25A2.25 2.25 0 0 1 3 15.75v-7.5A2.25 2.25 0 0 1 5.25 6h13.5A2.25 2.25 0 0 1 21 8.25ZM12 18V6" /></svg></IconWrapper>;
/** Renders a document icon. */
export const DocumentIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></IconWrapper>;
/** Renders an archive box icon. */
export const ArchiveBoxIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg></IconWrapper>;
/** Renders a magnifying glass icon. */
export const MagnifyingGlassIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg></IconWrapper>;
/** Renders a file with code icon. */
export const FileCodeIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg></IconWrapper>;
/** Renders a git branch icon. */
export const GitBranchIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 3v4a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V3M6 21v-4a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></IconWrapper>;
/** Renders a sparkles icon. */
export const SparklesIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg></IconWrapper>;
/** Renders an eye icon. */
export const EyeIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.368-7.28A1.012 1.012 0 0 1 7.105 4.5h9.79a1.012 1.012 0 0 1 .701.293l4.368 7.28c.15.25.228.538.228.828s-.078.578-.228.828l-4.368 7.28a1.012 1.012 0 0 1-.701.293h-9.79a1.012 1.012 0 0 1-.701-.293l-4.368-7.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg></IconWrapper>;
/** Renders a map icon. */
export const MapIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5-10.5h-7a.5.5 0 0 0-.5.5v13.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V4.25a.5.5 0 0 0-.5-.5Z" /></svg></IconWrapper>;
/** Renders a beaker icon. */
export const BeakerIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c.139-.02.28-.032.427-.032.147 0 .288.012.427.032M5 14.5h14M14.25 3.104v5.714c0 .822-.394 1.573-.986 2.05l-2.014.915a2.25 2.25 0 0 0-.659 1.591v5.714m-3.468-18.222.01.001" /></svg></IconWrapper>;
/** Renders a command line icon. */
export const CommandLineIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5 3 11.25l3.75 3.75M17.25 7.5 21 11.25l-3.75 3.75" /></svg></IconWrapper>;
/** Renders a locked padlock icon. */
export const LockClosedIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg></IconWrapper>;
/** Renders a code bracket in a square icon. */
export const CodeBracketSquareIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg></IconWrapper>;
/** Renders a photo icon. */
export const PhotoIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg></IconWrapper>;
/** Renders a chart bar icon. */
export const ChartBarIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625Zm6.75-5.25c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V3.375Z" /></svg></IconWrapper>;
/** Renders a bug/ant icon. */
export const BugAntIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m15.182 16.318A4.5 4.5 0 0 0 18 12a4.5 4.5 0 0 0-3.818-4.318m-3.564 4.318a4.5 4.5 0 0 1 3.564 0M6 12a4.5 4.5 0 0 1 3.818-4.318M12 12a4.5 4.5 0 0 1-3.818-4.318m0 8.636a4.5 4.5 0 0 1 3.818 0M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0a8.949 8.949 0 0 0 5.482-1.611m-10.964 0A8.949 8.949 0 0 1 12 21Zm0 0a8.949 8.949 0 0 0-5.482-1.611m10.964 0A8.949 8.949 0 0 0 12 21Zm-5.482 1.61a8.973 8.973 0 0 1-2.18-1.001m10.342 0a8.973 8.973 0 0 0-2.18-1.001m-6-1.611a8.973 8.973 0 0 1-2.18-1.001M18 12a8.973 8.973 0 0 0-2.18-1.001m-6 0a8.973 8.973 0 0 1-2.18-1.001M6 12a8.973 8.973 0 0 0-2.18-1.001m10.342 0a8.973 8.973 0 0 0-2.18-1.001M12 3a8.973 8.973 0 0 1 2.18 1.001m-4.36 0A8.973 8.973 0 0 1 12 3m0 18a8.973 8.973 0 0 0 2.18-1.001m-4.36 0A8.973 8.973 0 0 0 12 21Zm0-18a8.973 8.973 0 0 0-2.18-1.001m4.36 0A8.973 8.973 0 0 0 12 3Z" /></svg></IconWrapper>;
/** Renders a server stack icon. */
export const ServerStackIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3.75v3.75m3.75-3.75v3.75M12 3c-5.12 0-9.25 4.13-9.25 9.25s4.13 9.25 9.25 9.25 9.25-4.13 9.25-9.25S17.12 3 12 3Z" /></svg></IconWrapper>;
/** Renders a cloud icon. */
export const CloudIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-5.056-2.287 4.5 4.5 0 0 0-8.25-2.287 4.5 4.5 0 0 0-1.25 8.25Z" /></svg></IconWrapper>;
/** Renders a paper airplane icon. */
export const PaperAirplaneIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg></IconWrapper>;
/** Renders a shield with a checkmark icon. */
export const ShieldCheckIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Z" /></svg></IconWrapper>;
/** Renders a circular arrow path icon. */
export const ArrowPathIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691V5.25a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75" /></svg></IconWrapper>;
/** Renders a rectangle group icon. */
export const RectangleGroupIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125A2.25 2.25 0 0 1 4.5 4.875h15A2.25 2.25 0 0 1 21.75 7.125v10.5A2.25 2.25 0 0 1 19.5 19.875h-15A2.25 2.25 0 0 1 2.25 17.625v-10.5ZM11.25 4.875v10.5a2.25 2.25 0 0 1-2.25 2.25h-1.5a2.25 2.25 0 0 1-2.25-2.25v-10.5a2.25 2.25 0 0 1 2.25-2.25h1.5a2.25 2.25 0 0 1 2.25 2.25Z" /></svg></IconWrapper>;
/** Renders a microphone icon. */
export const MicrophoneIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 4.5v-1.5a6 6 0 0 0-12 0v1.5m12 0v-1.5a6 6 0 0 0-12 0v1.5m6 3.75a3 3 0 0 1-3-3V6.75a3 3 0 0 1 6 0v6a3 3 0 0 1-3 3Z" /></svg></IconWrapper>;
/** Renders a mail/envelope icon. */
export const MailIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg></IconWrapper>;
/** Renders a GitHub logo icon. */
export const GithubIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg></IconWrapper>;
/** Renders a GCP logo icon. */
export const GcpIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="#4285F4" stroke="none"/><path d="M2 12l10 5 10-5-10-5-10 5z" fill="#34A853" stroke="none" opacity="0.7"/><path d="M12 22L2 17l10-5 10 5-10 5z" fill="#FBBC05" stroke="none" opacity="0.7"/></svg></IconWrapper>;

// --- Custom & Stylized Feature Icons ---

/** Renders a stylized command center icon. */
export const CommandCenterIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 9V5l-7 7 7 7v-4.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 14.5V19l7-7-7-7v4.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4"/></svg></IconWrapper>;
/** Renders a stylized project explorer icon. */
export const ProjectExplorerIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></IconWrapper>;
/** Renders a stylized code explainer icon. */
export const CodeExplainerIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><circle cx="12" cy="15" r="3"/><path d="M12 18v2"/></svg></IconWrapper>;
/** Renders a stylized feature builder icon. */
export const FeatureBuilderIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/><path d="M17 8.5l-5 2.5-5-2.5"/><path d="M12 17.5V14"/></svg></IconWrapper>;
/** Renders a stylized code migrator icon. */
export const CodeMigratorIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 22H5a2 2 0 01-2-2V4a2 2 0 012-2h5"/><path d="M14 2h5a2 2 0 012 2v16a2 2 0 01-2 2h-5"/><path d="M7 8h2m-2 4h4m-4 4h2"/></svg></IconWrapper>;
/** Renders a stylized theme designer icon. */
export const ThemeDesignerIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 000 20z"/><path d="M22 12c-5.523 0-10-4.477-10-10"/></svg></IconWrapper>;
/** Renders a stylized snippet vault icon. */
export const SnippetVaultIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><circle cx="12" cy="12" r="3"/><path d="M8 12h8m-4-4v8"/></svg></IconWrapper>;
/** Renders a stylized digital whiteboard icon. */
export const DigitalWhiteboardIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><path d="M7 8h4m-4 4h8m-8 4h6" /></svg></IconWrapper>;
/** Renders a stylized unit test generator icon. */
export const UnitTestGeneratorIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4.5 12.5l3-3 3 3 6-6"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></IconWrapper>;
/** Renders a stylized commit generator icon. */
export const CommitGeneratorIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg></IconWrapper>;
/** Renders a stylized git log analyzer icon. */
export const GitLogAnalyzerIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 3v18"/><path d="M18 3v18"/><path d="M12 3v18"/><circle cx="6" cy="6" r="3" fill="currentColor" opacity="0.4"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4"/><circle cx="18" cy="18" r="3" fill="currentColor" opacity="0.4"/></svg></IconWrapper>;
/** Renders a stylized concurrency analyzer icon. */
export const ConcurrencyAnalyzerIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6l-6 6-6-6"/><path d="M18 18l-6-6-6 6"/></svg></IconWrapper>;
/** Renders a stylized regex sandbox icon. */
export const RegexSandboxIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 4l-8 16"/><path d="M22 12H2"/><path d="M10 3L6 21"/></svg></IconWrapper>;
/** Renders a stylized prompt craft pad icon. */
export const PromptCraftPadIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></IconWrapper>;
/** Renders a stylized code formatter icon. */
export const CodeFormatterIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h3m-3 6h3m-3 6h3M9 6h12M9 12h12M9 18h12"/></svg></IconWrapper>;
/** Renders a stylized JSON tree icon. */
export const JsonTreeIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 21v-4a2 2 0 012-2h8"/><path d="M10 17H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v2"/><rect x="2" y="2" width="20" height="20" rx="2" ry="2" opacity="0.2"/></svg></IconWrapper>;
/** Renders a stylized XBRL converter icon. */
export const XbrlConverterIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 8l-4 4 4 4m8-8l4 4-4-4" strokeLinecap="round" strokeLinejoin="round"/><path d="M14.5 5.5l-5 13" strokeLinecap="round"/></svg></IconWrapper>;
/** Renders a stylized CSS grid editor icon. */
export const CssGridEditorIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></IconWrapper>;
/** Renders a stylized schema designer icon. */
export const SchemaDesignerIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7V4h16v3"/><path d="M4 12h16"/><path d="M4 17h16"/><rect x="2" y="2" width="20" height="20" rx="2" ry="2" opacity="0.2"/></svg></IconWrapper>;
/** Renders a stylized PWA manifest editor icon. */
export const PwaManifestEditorIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22a10 10 0 100-20 10 10 0 000 20z"/><path d="M12 12l4-4m-4 8l-4-4"/></svg></IconWrapper>;
/** Renders a stylized markdown slides icon. */
export const MarkdownSlidesIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 3H4a2 2 0 00-2 2v14a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2z"/><path d="M9 16V8h6"/></svg></IconWrapper>;
/** Renders a stylized screenshot to component icon. */
export const ScreenshotToComponentIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5-5 5 5m-5 8v-13"/></svg></IconWrapper>;
/** Renders a stylized typography lab icon. */
export const TypographyLabIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7V4h16v3"/><path d="M4 17h16"/><rect x="2" y="2" width="20" height="20" rx="2" ry="2" opacity="0.2"/></svg></IconWrapper>;
/** Renders a stylized SVG path editor icon. */
export const SvgPathEditorIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20.9l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 20.9z"/></svg></IconWrapper>;
/** Renders a stylized style transfer icon. */
export const StyleTransferIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l.94-2.69.94 2.69L16.5 3l-2.69.94L13 6.58 12 4l-1 2.58L8.31 4 5.62 3l2.69.94.94 2.69.94-2.69z"/><path d="M12 2.69l.94-2.69.94 2.69L16.5 3l-2.69.94L13 6.58 12 4l-1 2.58L8.31 4 5.62 3l2.69.94.94 2.69.94-2.69zM12 2.69l.94-2.69.94 2.69L16.5 3l-2.69.94L13 6.58 12 4l-1 2.58L8.31 4 5.62 3l2.69.94.94 2.69.94-2.69zM3.5 13.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5-3.806 8.5-8.5 8.5-8.5-3.806-8.5-8.5z"/></svg></IconWrapper>;
/** Renders a stylized coding challenge icon. */
export const CodingChallengeIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8V6m0 12v-2m-4-6H6m12 0h-2m-2-4l-1.5-1.5M18 18l-1.5-1.5M6 18l1.5-1.5M6 6l1.5 1.5"/><circle cx="12" cy="12" r="3"/></svg></IconWrapper>;
/** Renders a stylized code review bot icon. */
export const CodeReviewBotIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20V10m0 0V4m0 6h8m-8 0H4"/><path d="M12 20a8 8 0 100-16 8 8 0 000 16z"/></svg></IconWrapper>;
/** Renders a stylized PR assistant icon. */
export const AiPullRequestAssistantIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M13 2v7h7"/><path d="M17.5 2.5l-2-2m2 2l2-2m-2 2v4"/></svg></IconWrapper>;
/** Renders a stylized changelog generator icon. */
export const ChangelogGeneratorIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8m8 4H8m-1-8l-2-2-2 2"/></svg></IconWrapper>;
/** Renders a stylized cron job builder icon. */
export const CronJobBuilderIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></IconWrapper>;
/** Renders a stylized async call tree icon. */
export const AsyncCallTreeIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18M3 12h18M3 18h18"/><path d="M6 3v18m12-18v18"/></svg></IconWrapper>;
/** Renders a stylized audio to code icon. */
export const AudioToCodeIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><path d="M12 19v4"/></svg></IconWrapper>;
/** Renders a stylized code diff ghost icon. */
export const CodeDiffGhostIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 16l-4-4 4-4m-8 8l4-4-4-4"/></svg></IconWrapper>;
/** Renders a stylized code spell checker icon. */
export const CodeSpellCheckerIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.72-1.72"/></svg></IconWrapper>;
/** Renders a stylized color palette generator icon. */
export const ColorPaletteGeneratorIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></IconWrapper>;
/** Renders a stylized logic flow builder icon. */
export const LogicFlowBuilderIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6h18m-9 6H3m9 6H3"/><path d="M8 3v18m8-18v18"/></svg></IconWrapper>;
/** Renders a stylized meta tag editor icon. */
export const MetaTagEditorIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><path d="M7 7h.01"/></svg></IconWrapper>;
/** Renders a stylized network visualizer icon. */
export const NetworkVisualizerIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 10h4V6h-4V2l-4 4 4 4zM6 14H2v4h4v4l4-4-4-4z"/><path d="M10 14v-4h4v4"/></svg></IconWrapper>;
/** Renders a stylized responsive tester icon. */
export const ResponsiveTesterIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M21 12a9 9 0 00-9-9m9 9a9 9 0 01-9 9"/></svg></IconWrapper>;
/** Renders a stylized SASS compiler icon. */
export const SassCompilerIcon: React.FC = () => <IconWrapper><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.168 18.168A10 10 0 118.832 2.832m12.336 15.336L8.832 2.832"/></svg></IconWrapper>;
/** Renders a hugging face logo icon. */
export const HuggingFaceIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.25,4.01A2.25,2.25,0,0,0,18,1.76H6A2.25,2.25,0,0,0,3.75,4.01V15.5A2.25,2.25,0,0,0,6,17.75H8.6l3.4,3.4,3.4-3.4H18a2.25,2.25,0,0,0,2.25-2.25V4.01ZM8.5,12.06a1,1,0,0,1,1,1,1,1,0,0,1-2,0,1,1,0,0,1,1-1Zm4.9,0a1,1,0,0,1,1,1,1,1,0,0,1-2,0,1,1,0,0,1,1-1Zm2.6,3.44a3.25,3.25,0,0,1-6,0,.75.75,0,0,1,1.5,0,1.75,1.75,0,0,0,3,0,.75.75,0,0,1,1.5,0Z"/></svg></IconWrapper>;
/** Renders a transparent cube icon. */
export const CubeTransparentIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg></IconWrapper>;
/** Renders a variable icon. */
export const VariableIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg></IconWrapper>;
/** Renders a fingerprint icon. */
export const FingerPrintIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.588 8.26l-1.064-1.063a.456.456 0 010-.642l1.064-1.064a5.25 5.25 0 00-7.424-7.424l-1.064 1.064a.456.456 0 01-.642 0L7.864 4.243zM4.5 10.5c0 1.25.334 2.417.91 3.44l-1.064 1.063a.456.456 0 000 .642l1.064 1.064a5.25 5.25 0 017.424 7.424l1.064-1.064a.456.456 0 00.642 0l-1.064-1.063a7.5 7.5 0 00-8.26-1.588A7.5 7.5 0 014.5 10.5z" /></svg></IconWrapper>;
/** Renders a horizontal adjustments icon. */
export const AdjustmentsHorizontalIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg></IconWrapper>;
/** Renders a code bracket icon. */
export const CodeBracketIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg></IconWrapper>;
/** Renders an open folder icon. */
export const FolderOpenIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg></IconWrapper>;
/** Renders a left-aligned bars icon. */
export const Bars3CenterLeftIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg></IconWrapper>;
/** Renders a magnifying glass in a circle icon. */
export const MagnifyingGlassCircleIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 15.91L19.5 19.5" /></svg></IconWrapper>;
/** Renders a pie chart icon. */
export const ChartPieIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg></IconWrapper>;
/** Renders a swatch icon. */
export const SwatchIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></IconWrapper>;
/** Renders a stacked squares icon. */
export const Square2StackIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75m9 9.375c.621 0 1.125-.504 1.125-1.125v-9.75a1.125 1.125 0 00-1.125-1.125h-9.75a1.125 1.125 0 00-1.125 1.125v9.75c0 .621.504 1.125 1.125 1.125h9.75z" /></svg></IconWrapper>;
/** Renders a checkmark badge icon. */
export const CheckBadgeIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></IconWrapper>;
/** Renders a wifi icon. */
export const WifiIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a3.75 3.75 0 015.424 0M5.136 11.886c2.478-2.478 6.49-2.478 8.968 0M2.022 8.734a12.75 12.75 0 0117.956 0" /></svg></IconWrapper>;
/** Renders a lightbulb icon. */
export const LightBulbIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM12 3a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0112 3zM21 12a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 01.75.75zM4.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 014.5 12zM18.364 5.636a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM7.05 16.95a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 011.06-1.06l1.06 1.06zM5.636 7.05a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM16.95 18.364a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM12 6.75a5.25 5.25 0 100 10.5 5.25 5.25 0 000-10.5z" /></svg></IconWrapper>;
/** Renders a circle stack (database) icon. */
export const CircleStackIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v-.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 12v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m-1.125 0H5.625a3.375 3.375 0 00-3.375 3.375v1.5c0 .621.504 1.125 1.125 1.125H5.25m5.25 0h7.5m-7.5 0a3.375 3.375 0 013.375-3.375h1.5a1.125 1.125 0 011.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5a3.375 3.375 0 01-3.375-3.375zM10.5 6.75a3.375 3.375 0 00-3.375-3.375H5.625a3.375 3.375 0 00-3.375 3.375v1.5c0 .621.504 1.125 1.125 1.125h1.125" /></svg></IconWrapper>;
/** Renders a cube icon. */
export const CubeIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25-9 5.25M3 16.5l9 5.25 9-5.25M21 7.5v9l-9 5.25-9-5.25v-9L12 2.25 21 7.5z" /></svg></IconWrapper>;
/** Renders a rocket launch icon. */
export const RocketLaunchIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38c-3.46 0-6.28-2.82-6.28-6.28a6.262 6.262 0 013.88-5.84 6.262 6.262 0 015.84-3.88c3.46 0 6.28 2.82 6.28 6.28a6 6 0 01-7.38 5.84z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-2.25 2.25m-3.75-3.75L12 9.75" /></svg></IconWrapper>;
/** Renders a globe icon. */
export const GlobeAltIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0 0a8.96 8.96 0 01-5.18-1.74m5.18 1.74a8.96 8.96 0 005.18-1.74m-5.18 1.74c-.64.093-1.3.14-1.98.14a8.963 8.963 0 01-1.98-.14M6.82 17.26a9 9 0 010-10.52" /></svg></IconWrapper>;
/** Renders a puzzle piece icon. */
export const PuzzlePieceIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-1.036-.84-1.875-1.875-1.875s-1.875.84-1.875 1.875v.563c-1.036 0-1.875.84-1.875 1.875v1.5c0 1.036.84 1.875 1.875 1.875h1.5c1.036 0 1.875-.84 1.875-1.875v-1.5c0-1.036-.84-1.875-1.875-1.875v-.563Zm-4.5 0v.563c-1.036 0-1.875.84-1.875 1.875v1.5c0 1.036.84 1.875 1.875 1.875h1.5c1.036 0 1.875-.84 1.875-1.875v-1.5c0-1.036-.84-1.875-1.875-1.875v-.563a1.875 1.875 0 0 0-3.75 0Z" /></svg></IconWrapper>;
/** Renders a user group icon. */
export const UserGroupIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.75h-12A2.25 2.25 0 013.75 16.5v-3.75m14.25 6V12.75a4.5 4.5 0 00-9 0v3.75M18 18.75H6.75M12 15.75a3 3 0 110-6 3 3 0 010 6z" /></svg></IconWrapper>;
/** Renders a trophy icon. */
export const TrophyIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a3.375 3.375 0 01-3.375-3.375V9.375c0-1.036.84-1.875 1.875-1.875h11.25c1.035 0 1.875.84 1.875 1.875v6c0 1.86-1.515 3.375-3.375 3.375zM12 14.25v-3.75m0 0a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" /></svg></IconWrapper>;
/** Renders a currency dollar icon. */
export const CurrencyDollarIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-6h6" /></svg></IconWrapper>;
/** Renders a presentation chart bar icon. */
export const PresentationChartBarIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 3.375h17.25c1.035 0 1.875.84 1.875 1.875v13.5c0 1.035-.84 1.875-1.875 1.875H3.375c-1.035 0-1.875-.84-1.875-1.875V5.25c0-1.035.84-1.875 1.875-1.875zM9.75 18.75l-4.5-4.5m4.5-4.5l3 3m-3-3l-3-3" /></svg></IconWrapper>;
/** Renders an academic cap icon. */
export const AcademicCapIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.25c2.472 0 4.786-.684 6.73-1.857a48.627 48.627 0 016.73-1.857 60.436 60.436 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-1.07-1.07a51.455 51.455 0 011.07-1.07m15.482 0l1.07 1.07a51.455 51.455 0 00-1.07 1.07" /></svg></IconWrapper>;
/** Renders a bug icon. */
export const BugIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" /></svg></IconWrapper>;
/** Renders a megaphone icon. */
export const MegaphoneIcon: React.FC = () => <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3H7.5a3 3 0 01-3-3V7.5a3 3 0 013-3h7.5a3 3 0 013 3v4.5" /></svg></IconWrapper>;
