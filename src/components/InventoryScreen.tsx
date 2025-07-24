import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Button,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { InventoryItem, OrderSummary, OrderHistoryItem } from '../types';
import ProductCard from './ProductCard';
import AddProductDialog from './AddProductDialog';
import { EmailService } from '../services/emailService';

interface InventoryScreenProps {
  onSessionEnd: () => void;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ onSessionEnd }) => {
  const { state, dispatch } = useAppContext();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const currentSession = state.currentSession;
  const currentLocation = state.locations.find(loc => loc.id === currentSession?.locationId);

  // Filter products available at current location
  const availableProducts = useMemo(() => {
    if (!currentSession) return [];
    
    return state.products.filter(product => 
      product.locations.some(loc => 
        loc.locationId === currentSession.locationId && loc.isAvailable
      )
    );
  }, [state.products, currentSession]);

  // Filter products by selected categories
  const filteredProducts = useMemo(() => {
    if (selectedCategories.length === 0) return availableProducts;
    
    return availableProducts.filter(product =>
      product.categories.some(categoryId => selectedCategories.includes(categoryId))
    );
  }, [availableProducts, selectedCategories]);

  const handleCategoryChange = (event: any) => {
    const value = event.target.value;
    setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
  };

  const handleProductUpdate = React.useCallback((productId: string, quantity?: number, shouldOrder?: boolean) => {
    if (!currentSession) return;

    const existingItemIndex = currentSession.items.findIndex(
      item => item.productId === productId
    );

    const newItem: InventoryItem = {
      productId,
      locationId: currentSession.locationId,
      currentQuantity: quantity,
      shouldOrder: shouldOrder ?? false,
      lastOrderDate: undefined, // TODO: Get from historical data
    };

    let updatedItems = [...currentSession.items];
    
    if (existingItemIndex >= 0) {
      updatedItems[existingItemIndex] = newItem;
    } else {
      updatedItems.push(newItem);
    }

    const updatedSession = {
      ...currentSession,
      items: updatedItems,
    };

    dispatch({ type: 'UPDATE_SESSION', payload: updatedSession });
  }, [currentSession, dispatch]);

  const getItemsToOrder = () => {
    if (!currentSession) return [];
    
    return currentSession.items.filter(item => item.shouldOrder);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSubmitOrder = async () => {
    if (!currentSession || !currentLocation) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const itemsToOrder = getItemsToOrder();
      
      if (itemsToOrder.length === 0) {
        setSubmitError('No items marked for ordering');
        setIsSubmitting(false);
        return;
      }

      // Get EmailJS credentials from localStorage
      const serviceId = localStorage.getItem('emailServiceId');
      const templateId = localStorage.getItem('emailTemplateId');
      const publicKey = localStorage.getItem('emailPublicKey');

      console.log('EmailJS credentials check:', {
        hasServiceId: !!serviceId,
        hasTemplateId: !!templateId,
        hasPublicKey: !!publicKey,
        serviceId: serviceId ? serviceId.substring(0, 10) + '...' : null
      });

      if (!serviceId || !templateId || !publicKey) {
        setSubmitError('EmailJS not configured. Please configure it in Settings first.');
        setIsSubmitting(false);
        return;
      }

      // Create order summary with properly formatted date
      const orderDate = new Date();
      const orderDateString = orderDate.toISOString();
      
      const orderSummary: OrderSummary = {
        sessionId: currentSession.id,
        locationName: currentLocation.name,
        userName: currentSession.userName,
        orderDate: formatDate(orderDate), // Use formatted date for email
        items: itemsToOrder.map(item => {
          const product = state.products.find(p => p.id === item.productId);
          const suppliers = state.suppliers.filter(s => 
            product?.suppliers.includes(s.id)
          ).map(s => s.name);
          
          return {
            productName: product?.name || 'Unknown Product',
            quantity: item.currentQuantity,
            suppliers: suppliers.length > 0 ? suppliers : ['Unknown Supplier'],
          };
        }),
      };

      const emailService = new EmailService(serviceId, templateId, publicKey);
      const emailSent = await emailService.sendOrderEmail(orderSummary);
      
      if (!emailSent) {
        throw new Error('Failed to send email');
      }

      // Create order history items
      const orderHistoryItems: OrderHistoryItem[] = itemsToOrder.map(item => {
        const product = state.products.find(p => p.id === item.productId);
        const suppliers = state.suppliers.filter(s => 
          product?.suppliers.includes(s.id)
        ).map(s => s.name);
        
        return {
          productId: item.productId,
          locationId: item.locationId,
          orderDate: orderDateString, // Use ISO string for storage
          quantityOrdered: item.currentQuantity,
          sessionId: currentSession.id,
          suppliers: suppliers.length > 0 ? suppliers : ['Unknown Supplier'],
          categoryIds: product?.categories || [],
        };
      });

      // Add to order history
      dispatch({ type: 'ADD_ORDER_HISTORY_ITEMS', payload: orderHistoryItems });

      // Mark session as submitted with ISO string for storage
      const submittedSession = {
        ...currentSession,
        endDate: orderDateString,
        isSubmitted: true,
      };

      dispatch({ type: 'UPDATE_SESSION', payload: submittedSession });
      setSubmitSuccess(true);
      
      // End session after 2 seconds
      setTimeout(() => {
        onSessionEnd();
      }, 2000);

    } catch (error) {
      console.error('Error submitting order:', error);
      setSubmitError('Failed to submit order. Please check your email configuration in Settings.');
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  if (!currentSession || !currentLocation) {
    return (
      <Alert severity="error">
        No active session found. Please start a new session.
      </Alert>
    );
  }

  if (submitSuccess) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" color="success.main" gutterBottom>
          Order Submitted Successfully!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Email sent to jason@morninglavender.com
        </Typography>
      </Box>
    );
  }

  const itemsToOrderCount = getItemsToOrder().length;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {currentLocation.name} Inventory
        </Typography>
        <Typography variant="body2" color="text.secondary">
          User: {currentSession.userName} | Started: {new Date(currentSession.startDate).toLocaleString()}
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Filter by Categories</InputLabel>
          <Select
            multiple
            value={selectedCategories}
            onChange={handleCategoryChange}
            input={<OutlinedInput label="Filter by Categories" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => {
                  const category = state.categories.find(c => c.id === value);
                  return (
                    <Chip
                      key={value}
                      label={category?.name}
                      size="small"
                      style={{ backgroundColor: category?.color }}
                    />
                  );
                })}
              </Box>
            )}
          >
            {state.categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredProducts.length} products
          {itemsToOrderCount > 0 && ` | ${itemsToOrderCount} items to order`}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredProducts.map((product) => {
          const currentItem = currentSession.items.find(
            item => item.productId === product.id
          );
          
          return (
            <ProductCard
              key={product.id}
              product={product}
              location={currentLocation}
              currentItem={currentItem}
              categories={state.categories}
              suppliers={state.suppliers}
              onUpdate={handleProductUpdate}
            />
          );
        })}
      </Box>

      {filteredProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No products found for the selected filters.
          </Typography>
        </Box>
      )}

      {/* Submit Order Button */}
      {itemsToOrderCount > 0 && (
        <Fab
          color="primary"
          variant="extended"
          onClick={() => setShowSubmitConfirm(true)}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} sx={{ mr: 1 }} />
          ) : (
            <SendIcon sx={{ mr: 1 }} />
          )}
          Submit Order ({itemsToOrderCount})
        </Fab>
      )}

      {/* Add Product Button */}
      <Fab
        color="secondary"
        onClick={() => setShowAddProduct(true)}
        sx={{
          position: 'fixed',
          bottom: itemsToOrderCount > 0 ? 140 : 80,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)}>
        <DialogTitle>Submit Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit an order for {itemsToOrderCount} items?
            This will send an email to jason@morninglavender.com and end the current session.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
          <Button onClick={handleSubmitOrder} variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={showAddProduct}
        onClose={() => setShowAddProduct(false)}
      />
    </Box>
  );
};

export default InventoryScreen;
