/**
 * Advanced Data Table - Professional data display with sorting, filtering, export
 */

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Checkbox,
  Stack,
  Button,
  TextField,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Download,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { styled } from '@mui/material/styles';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  '& .MuiTable-root': {
    borderCollapse: 'collapse',
  },
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  '& .MuiTableCell-head': {
    fontWeight: 700,
    color: theme.palette.text.primary,
    borderBottom: `2px solid ${theme.palette.divider}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
  '&.selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
}));

export interface Column {
  id: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface AdvancedDataTableProps {
  columns: Column[];
  rows: any[];
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, any>) => void;
  onExport?: () => void;
  onRowClick?: (row: any) => void;
  onRowAction?: (action: string, row: any) => void;
  selectable?: boolean;
  paginated?: boolean;
  rowsPerPageOptions?: number[];
  loading?: boolean;
}

const AdvancedDataTable: React.FC<AdvancedDataTableProps> = ({
  columns,
  rows,
  onSort,
  onFilter,
  onExport,
  onRowClick,
  onRowAction,
  selectable = true,
  paginated = true,
  rowsPerPageOptions = [5, 10, 25, 50],
  loading = false,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<any>(null);

  // Sorting
  const handleSort = (columnId: string) => {
    const isAsc = orderBy === columnId && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrderBy(columnId);
    setOrder(newOrder);
    onSort?.(columnId, newOrder);
  };

  // Pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Selection
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(new Set(rows.map((_, i) => i.toString())));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selected);
    const key = index.toString();
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelected(newSelected);
  };

  // Filtering
  const handleFilterChange = (columnId: string, value: any) => {
    const newFilters = { ...filters, [columnId]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  // Row actions menu
  const handleRowMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleRowMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleRowAction = (action: string) => {
    onRowAction?.(action, selectedRow);
    handleRowMenuClose();
  };

  // Pagination
  const paginatedRows = paginated
    ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : rows;

  return (
    <Box>
      {/* Toolbar */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        {/* Filter Fields */}
        {columns
          .filter((col) => col.filterable)
          .map((col) => (
            <TextField
              key={col.id}
              size="small"
              placeholder={`Filter ${col.label}`}
              value={filters[col.id] || ''}
              onChange={(e) => handleFilterChange(col.id, e.target.value)}
              sx={{ minWidth: 200 }}
            />
          ))}

        {/* Export Button */}
        {onExport && (
          <Tooltip title="Export data">
            <Button
              startIcon={<Download size={18} />}
              onClick={onExport}
              variant="outlined"
            >
              Export
            </Button>
          </Tooltip>
        )}
      </Stack>

      {/* Table */}
      <StyledTableContainer>
        <Table>
          <StyledTableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.size > 0 && selected.size < rows.length}
                    checked={rows.length > 0 && selected.size === rows.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  width={col.width}
                  sortDirection={orderBy === col.id ? order : false}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
              {onRowAction && <TableCell width={50} align="right">Actions</TableCell>}
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {paginatedRows.map((row, index) => (
              <StyledTableRow
                key={index}
                className={selected.has(index.toString()) ? 'selected' : ''}
                onClick={() => onRowClick?.(row)}
                sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.has(index.toString())}
                      onChange={() => handleSelectRow(index)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    {col.render ? col.render(row[col.id], row) : row[col.id]}
                  </TableCell>
                ))}
                {onRowAction && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => handleRowMenuOpen(e, row)}
                    >
                      <MoreVertical size={18} />
                    </IconButton>
                  </TableCell>
                )}
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>

      {/* Pagination */}
      {paginated && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      {/* Row Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleRowMenuClose}
      >
        <MenuItem onClick={() => handleRowAction('view')}>
          <Eye size={16} style={{ marginRight: 8 }} />
          View
        </MenuItem>
        <MenuItem onClick={() => handleRowAction('edit')}>
          <Edit size={16} style={{ marginRight: 8 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleRowAction('delete')} sx={{ color: 'error.main' }}>
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdvancedDataTable;
