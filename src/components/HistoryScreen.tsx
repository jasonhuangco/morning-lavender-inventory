import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Divider,
  Stack,
  Checkbox,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { InventorySession, InventoryItem } from '../types';
import dayjs from 'dayjs';

const HistoryScreen: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const { sessions, locations, categories, suppliers, products } = state;

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'user' | 'location'>('date-desc');
  
  // Detail dialog state
  const [selectedSession, setSelectedSession] = useState<InventorySession | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Modal filter state
  const [modalSupplierFilter, setModalSupplierFilter] = useState<string>('');
  const [modalCategoryFilter, setModalCategoryFilter] = useState<string>('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');

  // Checked items state - tracks which items are checked in the modal
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<InventorySession | null>(null);

  // Get unique users from sessions
  const uniqueUsers = useMemo(() => {
    const users = sessions.map(session => session.userName).filter(Boolean);
    return [...new Set(users)];
  }, [sessions]);

  // Helper functions
  const getLocationName = (locationId: string) => {
    return locations.find(loc => loc.id === locationId)?.name || 'Unknown Location';
  };

  const getProductName = (productId: string) => {
    return products.find(prod => prod.id === productId)?.name || 'Unknown Product';
  };

  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds.map(id => categories.find(cat => cat.id === id)?.name || 'Unknown').join(', ');
  };

  const getSupplierNames = (supplierIds: string[]) => {
    return supplierIds.map(id => suppliers.find(sup => sup.id === id)?.name || 'Unknown').join(', ');
  };

  // Filter and sort sessions
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions.filter(session => {
      // Search filter
      if (searchTerm) {
        const locationName = getLocationName(session.locationId).toLowerCase();
        const userName = session.userName.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        const matchesSearch = locationName.includes(searchLower) || 
                            userName.includes(searchLower) ||
                            session.items.some(item => {
                              const product = products.find(p => p.id === item.productId);
                              if (!product) return false;
                              
                              const productNameMatch = product.name.toLowerCase().includes(searchLower);
                              const supplierNamesMatch = product.suppliers.some(supplierId => 
                                getSupplierNames([supplierId]).toLowerCase().includes(searchLower)
                              );
                              
                              return productNameMatch || supplierNamesMatch;
                            });
        
        if (!matchesSearch) return false;
      }

      // Location filter
      if (selectedLocation && session.locationId !== selectedLocation) {
        return false;
      }

      // User filter
      if (selectedUser && session.userName !== selectedUser) {
        return false;
      }

      return true;
    });

    // Sort sessions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'date-asc':
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        case 'user':
          return a.userName.localeCompare(b.userName);
        case 'location':
          return getLocationName(a.locationId).localeCompare(getLocationName(b.locationId));
        default:
          return 0;
      }
    });

    return filtered;
  }, [sessions, searchTerm, selectedLocation, selectedUser, sortBy, locations, products, suppliers]);

  const handleViewDetails = (session: InventorySession) => {
    setSelectedSession(session);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedSession(null);
    // Reset modal filters
    setModalSupplierFilter('');
    setModalCategoryFilter('');
    setModalSearchTerm('');
    // Reset checked items
    setCheckedItems(new Set());
  };

  const handleItemCheck = (productId: string, checked: boolean) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleDeleteSession = (session: InventorySession) => {
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      dispatch({ type: 'DELETE_SESSION', payload: sessionToDelete.id });
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedLocation('');
    setSelectedUser('');
    setSortBy('date-desc');
  };

  const getSessionSummary = (session: InventorySession) => {
    const totalItems = session.items.filter(item => item.shouldOrder).length;
    
    // Get all unique suppliers from products in this session
    const allSupplierIds = [...new Set(session.items.flatMap(item => {
      const product = products.find(p => p.id === item.productId);
      return product?.suppliers || [];
    }))];
    
    // Get all unique categories from products in this session
    const allCategoryIds = [...new Set(session.items.flatMap(item => {
      const product = products.find(p => p.id === item.productId);
      return product?.categories || [];
    }))];
    
    return {
      totalItems,
      supplierCount: allSupplierIds.length,
      categoryCount: allCategoryIds.length,
      suppliers: allSupplierIds.map(id => getSupplierNames([id])).join(', '),
      categories: allCategoryIds.map(id => getCategoryNames([id])).join(', ')
    };
  };

  // Filter items within the modal based on modal filters
  const getFilteredModalItems = (items: InventoryItem[], shouldOrder: boolean) => {
    return items.filter(item => {
      if (item.shouldOrder !== shouldOrder) return false;
      
      const product = products.find(p => p.id === item.productId);
      if (!product) return false;

      // Search filter
      if (modalSearchTerm) {
        const searchLower = modalSearchTerm.toLowerCase();
        const productNameMatch = product.name.toLowerCase().includes(searchLower);
        const supplierMatch = product.suppliers.some(supplierId => 
          getSupplierNames([supplierId]).toLowerCase().includes(searchLower)
        );
        const categoryMatch = product.categories.some(categoryId => 
          getCategoryNames([categoryId]).toLowerCase().includes(searchLower)
        );
        
        if (!productNameMatch && !supplierMatch && !categoryMatch) return false;
      }

      // Supplier filter
      if (modalSupplierFilter && !product.suppliers.includes(modalSupplierFilter)) {
        return false;
      }

      // Category filter
      if (modalCategoryFilter && !product.categories.includes(modalCategoryFilter)) {
        return false;
      }

      return true;
    });
  };

  // Get unique suppliers and categories from the selected session
  const getSessionSuppliersAndCategories = (session: InventorySession) => {
    const sessionSuppliers = [...new Set(session.items.flatMap(item => {
      const product = products.find(p => p.id === item.productId);
      return product?.suppliers || [];
    }))];
    
    const sessionCategories = [...new Set(session.items.flatMap(item => {
      const product = products.find(p => p.id === item.productId);
      return product?.categories || [];
    }))];

    return { sessionSuppliers, sessionCategories };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Inventory History
      </Typography>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Search */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search sessions by location, user, products, or suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                endAdornment: searchTerm ? (
                  <IconButton onClick={() => setSearchTerm('')} size="small">
                    <ClearIcon />
                  </IconButton>
                ) : null,
              }}
            />

            {/* Filter Row */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              {/* Location Filter */}
              <FormControl size="small">
                <InputLabel>Location</InputLabel>
                <Select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  input={<OutlinedInput label="Location" />}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {locations.map(location => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* User Filter */}
              <FormControl size="small">
                <InputLabel>User</InputLabel>
                <Select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  input={<OutlinedInput label="User" />}
                >
                  <MenuItem value="">All Users</MenuItem>
                  {uniqueUsers.map(user => (
                    <MenuItem key={user} value={user}>
                      {user}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sort */}
              <FormControl size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  input={<OutlinedInput label="Sort By" />}
                >
                  <MenuItem value="date-desc">Newest First</MenuItem>
                  <MenuItem value="date-asc">Oldest First</MenuItem>
                  <MenuItem value="user">User Name</MenuItem>
                  <MenuItem value="location">Location</MenuItem>
                </Select>
              </FormControl>

              {/* Clear Filters */}
              <Button
                variant="outlined"
                onClick={clearAllFilters}
                startIcon={<ClearIcon />}
                size="small"
              >
                Clear Filters
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {filteredAndSortedSessions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No inventory sessions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {sessions.length === 0 
                ? "No inventory sessions have been completed yet."
                : "Try adjusting your search and filter criteria."
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {filteredAndSortedSessions.map((session) => {
            const summary = getSessionSummary(session);
            
            return (
              <Card key={session.id} sx={{ '&:hover': { boxShadow: 2 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {getLocationName(session.locationId)} - {dayjs(session.startDate).format('MMM D, YYYY')}
                      </Typography>
                      
                      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {session.userName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {dayjs(session.startDate).format('h:mm A')}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
                        <Chip 
                          label={`${summary.totalItems} items to order`} 
                          size="small" 
                          color={summary.totalItems > 0 ? "primary" : "default"}
                        />
                        {session.isSubmitted && (
                          <Chip label="Submitted" size="small" color="success" />
                        )}
                        {summary.supplierCount > 0 && (
                          <Chip 
                            label={`${summary.supplierCount} supplier${summary.supplierCount !== 1 ? 's' : ''}`} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>

                    <IconButton
                      onClick={() => handleViewDetails(session)}
                      color="primary"
                      sx={{ ml: 1 }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteSession(session)}
                      color="error"
                      sx={{ ml: 0.5 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Session Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { maxHeight: '90vh' }
        }}
      >
        <DialogTitle>
          Session Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedSession && (
            <Stack spacing={3}>
              {/* Session Info */}
              <Box>
                <Typography variant="h6" gutterBottom>Session Information</Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography><strong>Location:</strong> {getLocationName(selectedSession.locationId)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography><strong>User:</strong> {selectedSession.userName}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography>
                      <strong>Date:</strong> {dayjs(selectedSession.startDate).format('MMMM D, YYYY h:mm A')}
                    </Typography>
                  </Box>
                  <Typography>
                    <strong>Status:</strong> {selectedSession.isSubmitted ? 'Submitted' : 'Draft'}
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              {/* Filters for Modal */}
              <Box>
                <Typography variant="h6" gutterBottom>Filter Items</Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder="Search products, suppliers, or categories..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                      endAdornment: modalSearchTerm ? (
                        <IconButton onClick={() => setModalSearchTerm('')} size="small">
                          <ClearIcon />
                        </IconButton>
                      ) : null,
                    }}
                  />
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                    {/* Supplier Filter */}
                    <FormControl size="small">
                      <InputLabel>Supplier</InputLabel>
                      <Select
                        value={modalSupplierFilter}
                        onChange={(e) => setModalSupplierFilter(e.target.value)}
                        input={<OutlinedInput label="Supplier" />}
                      >
                        <MenuItem value="">All Suppliers</MenuItem>
                        {getSessionSuppliersAndCategories(selectedSession).sessionSuppliers.map(supplierId => (
                          <MenuItem key={supplierId} value={supplierId}>
                            {suppliers.find(s => s.id === supplierId)?.name || 'Unknown'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Category Filter */}
                    <FormControl size="small">
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={modalCategoryFilter}
                        onChange={(e) => setModalCategoryFilter(e.target.value)}
                        input={<OutlinedInput label="Category" />}
                      >
                        <MenuItem value="">All Categories</MenuItem>
                        {getSessionSuppliersAndCategories(selectedSession).sessionCategories.map(categoryId => (
                          <MenuItem key={categoryId} value={categoryId}>
                            {categories.find(c => c.id === categoryId)?.name || 'Unknown'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Clear Modal Filters */}
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setModalSupplierFilter('');
                        setModalCategoryFilter('');
                        setModalSearchTerm('');
                      }}
                      startIcon={<ClearIcon />}
                      size="small"
                    >
                      Clear Filters
                    </Button>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              {/* Items to Order */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Items to Order ({getFilteredModalItems(selectedSession.items, true).length})
                </Typography>
                {getFilteredModalItems(selectedSession.items, true).length === 0 ? (
                  <Typography color="text.secondary">No items marked for ordering match the current filters</Typography>
                ) : (
                  <Stack spacing={2}>
                    {getFilteredModalItems(selectedSession.items, true).map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      
                      return (
                        <Card key={index} variant="outlined">
                          <CardContent sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight="medium">
                                  {getProductName(item.productId)}
                                </Typography>
                                {item.currentQuantity !== undefined && (
                                  <Typography variant="body2" color="text.secondary">
                                    Quantity: {item.currentQuantity}
                                  </Typography>
                                )}
                                {product && product.suppliers.length > 0 && (
                                  <Typography variant="body2" color="text.secondary">
                                    Suppliers: {getSupplierNames(product.suppliers)}
                                  </Typography>
                                )}
                                {product && product.categories.length > 0 && (
                                  <Typography variant="body2" color="text.secondary">
                                    Categories: {getCategoryNames(product.categories)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              <Divider />

              {/* All Items in Session */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  All Items in Session ({getFilteredModalItems([...selectedSession.items], true).length + getFilteredModalItems([...selectedSession.items], false).length} of {selectedSession.items.length} shown)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Total items counted: {selectedSession.items.length}
                </Typography>
                <Stack spacing={1}>
                  {/* Items marked for ordering */}
                  {getFilteredModalItems(selectedSession.items, true).map((item, index) => {
                    const isChecked = checkedItems.has(item.productId);
                    return (
                      <Box key={`order-${index}`} sx={{ 
                        p: 1, 
                        bgcolor: isChecked ? 'action.disabled' : 'action.selected',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        opacity: isChecked ? 0.5 : 1,
                        transition: 'all 0.3s ease'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => handleItemCheck(item.productId, e.target.checked)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textDecoration: isChecked ? 'line-through' : 'none',
                              color: isChecked ? 'text.disabled' : 'text.primary'
                            }}
                          >
                            {getProductName(item.productId)}
                            {item.currentQuantity !== undefined && ` (${item.currentQuantity})`}
                          </Typography>
                        </Box>
                        <Chip 
                          label="Order" 
                          size="small" 
                          color="primary" 
                          sx={{ opacity: isChecked ? 0.5 : 1 }}
                        />
                      </Box>
                    );
                  })}
                  
                  {/* Items not marked for ordering */}
                  {getFilteredModalItems(selectedSession.items, false).map((item, index) => {
                    const isChecked = checkedItems.has(item.productId);
                    return (
                      <Box key={`no-order-${index}`} sx={{ 
                        p: 1, 
                        bgcolor: isChecked ? 'action.disabled' : 'background.default',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        opacity: isChecked ? 0.5 : 1,
                        transition: 'all 0.3s ease'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <Checkbox
                            checked={isChecked}
                            onChange={(e) => handleItemCheck(item.productId, e.target.checked)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Typography 
                            variant="body2"
                            sx={{ 
                              textDecoration: isChecked ? 'line-through' : 'none',
                              color: isChecked ? 'text.disabled' : 'text.primary'
                            }}
                          >
                            {getProductName(item.productId)}
                            {item.currentQuantity !== undefined && ` (${item.currentQuantity})`}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Session</DialogTitle>
        <DialogContent>
          {sessionToDelete && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this inventory session? This action cannot be undone.
              </Typography>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Session Details
                </Typography>
                <Typography><strong>Location:</strong> {getLocationName(sessionToDelete.locationId)}</Typography>
                <Typography><strong>User:</strong> {sessionToDelete.userName}</Typography>
                <Typography><strong>Date:</strong> {dayjs(sessionToDelete.startDate).format('MMM D, YYYY h:mm A')}</Typography>
                <Typography><strong>Items:</strong> {sessionToDelete.items?.length || 0} products</Typography>
                <Typography><strong>Status:</strong> {sessionToDelete.isSubmitted ? 'Submitted' : 'Draft'}</Typography>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error">
            Delete Session
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HistoryScreen;


