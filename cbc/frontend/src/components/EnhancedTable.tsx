import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Paper,
    Checkbox,
    Box,
    Typography,
    IconButton,
    Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState, useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import {
    borderRadius,
    spacing,
    transition,
    shadows,
    hoverShadows,
} from '../utils/designSystem';

type Order = 'asc' | 'desc';

interface Column<T> {
    id: keyof T;
    label: string;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    width?: string | number;
    render?: (value: any, row: T) => React.ReactNode;
}

interface EnhancedTableProps<T> {
    columns: Column<T>[];
    data: T[];
    /**
     * Enable row selection
     * @default false
     */
    selectable?: boolean;
    /**
     * Selected row IDs
     */
    selected?: string[];
    /**
     * Selection change handler
     */
    onSelectionChange?: (selected: string[]) => void;
    /**
     * Row click handler
     */
    onRowClick?: (row: T) => void;
    /**
     * Row actions menu
     */
    rowActions?: (row: T) => React.ReactNode;
    /**
     * Enable sticky header
     * @default true
     */
    stickyHeader?: boolean;
    /**
     * Max height for scrollable table
     */
    maxHeight?: number | string;
    /**
     * Row ID field
     * @default 'id'
     */
    rowIdField?: keyof T;
    /**
     * Empty state component
     */
    emptyState?: React.ReactNode;
}

/**
 * Enhanced Table Component with Professional Interactions
 * 
 * Features:
 * - Smooth row hover effects
 * - Sortable columns
 * - Row selection with checkboxes
 * - Sticky header
 * - Custom cell rendering
 * - Row actions menu
 * - Empty state support
 */
function EnhancedTable<T extends Record<string, any>>({
    columns,
    data,
    selectable = false,
    selected = [],
    onSelectionChange,
    onRowClick,
    rowActions,
    stickyHeader = true,
    maxHeight = 600,
    rowIdField = 'id' as keyof T,
    emptyState,
}: EnhancedTableProps<T>) {
    const theme = useTheme();
    const [orderBy, setOrderBy] = useState<keyof T | null>(null);
    const [order, setOrder] = useState<Order>('asc');

    const handleSort = (columnId: keyof T) => {
        const isAsc = orderBy === columnId && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(columnId);
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allIds = data.map((row) => String(row[rowIdField]));
            onSelectionChange?.(allIds);
        } else {
            onSelectionChange?.([]);
        }
    };

    const handleSelectRow = (id: string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = [...selected, id];
        } else {
            newSelected = selected.filter((selectedId) => selectedId !== id);
        }

        onSelectionChange?.(newSelected);
    };

    const sortedData = useMemo(() => {
        if (!orderBy) return data;

        return [...data].sort((a, b) => {
            const aValue = a[orderBy];
            const bValue = b[orderBy];

            if (aValue < bValue) {
                return order === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [data, orderBy, order]);

    const isSelected = (id: string) => selected.indexOf(id) !== -1;

    if (data.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    return (
        <TableContainer
            component={Paper}
            sx={{
                maxHeight,
                borderRadius: borderRadius.lg,
                boxShadow: shadows.sm,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                    width: 8,
                    height: 8,
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: theme.palette.background.default,
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: theme.palette.divider,
                    borderRadius: borderRadius.sm,
                    '&:hover': {
                        backgroundColor: theme.palette.text.disabled,
                    },
                },
            }}
        >
            <Table stickyHeader={stickyHeader}>
                <TableHead>
                    <TableRow>
                        {selectable && (
                            <TableCell
                                padding="checkbox"
                                sx={{
                                    backgroundColor: theme.palette.background.paper,
                                    borderBottom: `2px solid ${theme.palette.divider}`,
                                }}
                            >
                                <Checkbox
                                    indeterminate={selected.length > 0 && selected.length < data.length}
                                    checked={data.length > 0 && selected.length === data.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                        )}
                        {columns.map((column) => (
                            <TableCell
                                key={String(column.id)}
                                align={column.align || 'left'}
                                sx={{
                                    backgroundColor: theme.palette.background.paper,
                                    borderBottom: `2px solid ${theme.palette.divider}`,
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    color: theme.palette.text.secondary,
                                    width: column.width,
                                }}
                            >
                                {column.sortable !== false ? (
                                    <TableSortLabel
                                        active={orderBy === column.id}
                                        direction={orderBy === column.id ? order : 'asc'}
                                        onClick={() => handleSort(column.id)}
                                    >
                                        {column.label}
                                    </TableSortLabel>
                                ) : (
                                    column.label
                                )}
                            </TableCell>
                        ))}
                        {rowActions && (
                            <TableCell
                                sx={{
                                    backgroundColor: theme.palette.background.paper,
                                    borderBottom: `2px solid ${theme.palette.divider}`,
                                    width: 60,
                                }}
                            />
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedData.map((row, index) => {
                        const rowId = String(row[rowIdField]);
                        const isItemSelected = isSelected(rowId);

                        return (
                            <TableRow
                                key={rowId}
                                hover
                                selected={isItemSelected}
                                onClick={() => onRowClick?.(row)}
                                sx={{
                                    cursor: onRowClick ? 'pointer' : 'default',
                                    transition: transition.all,
                                    '&:hover': {
                                        backgroundColor: theme.palette.action.hover,
                                        transform: 'scale(1.001)',
                                        boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}20`,
                                    },
                                    '&.Mui-selected': {
                                        backgroundColor: `${theme.palette.primary.main}08`,
                                        '&:hover': {
                                            backgroundColor: `${theme.palette.primary.main}12`,
                                        },
                                    },
                                }}
                            >
                                {selectable && (
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={isItemSelected}
                                            onChange={() => handleSelectRow(rowId)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </TableCell>
                                )}
                                {columns.map((column) => (
                                    <TableCell
                                        key={String(column.id)}
                                        align={column.align || 'left'}
                                        sx={{
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        {column.render
                                            ? column.render(row[column.id], row)
                                            : row[column.id]}
                                    </TableCell>
                                ))}
                                {rowActions && (
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                        >
                                            <MoreVertical size={18} />
                                        </IconButton>
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default EnhancedTable;
