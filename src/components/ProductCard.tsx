import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Chip,
  TextField,
} from '@mui/material';
import {
  Remove as RemoveIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Product, Location, Category, Supplier, InventoryItem } from '../types';
import { useAppContext } from '../context/AppContext';

interface ProductCardProps {
  product: Product;
  location: Location;
  currentItem?: InventoryItem;
  categories: Category[];
  suppliers: Supplier[];
  onUpdate: (productId: string, quantity?: number, shouldOrder?: boolean) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  location,
  currentItem,
  categories,
  suppliers,
  onUpdate,
}) => {
  const { getLastOrderInfo } = useAppContext();
  const [quantity, setQuantity] = useState(currentItem?.currentQuantity || 0);
  const [shouldOrder, setShouldOrder] = useState(currentItem?.shouldOrder || false);

  const productLocation = product.locations.find(loc => loc.locationId === location.id);
  const minThreshold = productLocation?.minThreshold || 0;

  // Get last order information
  const lastOrderInfo = getLastOrderInfo(product.id, location.id);

  // Auto-check order checkbox when quantity is below threshold
  // Auto-uncheck when quantity goes above threshold
  useEffect(() => {
    if (product.requiresQuantity) {
      if (quantity < minThreshold) {
        setShouldOrder(true);
      } else if (quantity >= minThreshold && shouldOrder) {
        setShouldOrder(false);
      }
    }
  }, [quantity, minThreshold, product.requiresQuantity, shouldOrder]);

  // Update parent when values change - but only if user has interacted or item already exists
  useEffect(() => {
    // Only update if there's already a currentItem (meaning user has interacted before)
    // or if shouldOrder is true (meaning user wants to order it)
    if (currentItem || shouldOrder) {
      if (product.requiresQuantity) {
        onUpdate(product.id, quantity, shouldOrder);
      } else {
        onUpdate(product.id, undefined, shouldOrder);
      }
    }
  }, [quantity, shouldOrder, product.id, product.requiresQuantity, currentItem, onUpdate]);

  const handleQuantityChange = (newQuantity: number) => {
    const validQuantity = Math.max(0, newQuantity);
    setQuantity(validQuantity);
  };

  const handleOrderChange = (checked: boolean) => {
    setShouldOrder(checked);
  };

  const getProductCategories = () => {
    return product.categories.map(catId => 
      categories.find(cat => cat.id === catId)
    ).filter(Boolean);
  };

  const getProductSuppliers = () => {
    return product.suppliers.map(suppId => 
      suppliers.find(supp => supp.id === suppId)
    ).filter(Boolean);
  };

  const formatLastOrderDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const isLowStock = product.requiresQuantity && quantity < minThreshold;

  return (
    <Card 
      sx={{ 
        mb: 0.75, // Further reduced from 1 for maximum compactness
        border: isLowStock ? '2px solid #f44336' : '1px solid #e0e0e0',
        backgroundColor: isLowStock ? '#ffebee' : 'white',
      }}
    >
      <CardContent sx={{ py: 0.75, px: 1.5, '&:last-child': { pb: 0.75 } }}> {/* Even more reduced padding */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}> {/* Further reduced mb */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 0.25 }}> {/* Further reduced margin bottom */}
              {product.name}
            </Typography>
            
            {/* Min Threshold - moved above suppliers */}
            {product.requiresQuantity && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}> {/* Further reduced mb */}
                Min Threshold: {minThreshold}
              </Typography>
            )}

            {/* Suppliers */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}> {/* Further reduced mb */}
              Suppliers: {getProductSuppliers().map(s => s?.name).join(', ')}
            </Typography>

            {/* Categories */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, mb: 0.25 }}> {/* Reduced gaps and margins */}
              {getProductCategories().map((category) => (
                <Chip
                  key={category?.id}
                  label={category?.name}
                  size="small"
                  sx={{ 
                    height: 20, // Smaller chips
                    fontSize: '0.7rem', // Smaller text
                  }}
                  style={{ backgroundColor: category?.color }}
                />
              ))}
            </Box>

            {/* Last Order Information */}
            {lastOrderInfo && (
              <Box sx={{ 
                backgroundColor: '#f5f5f5', 
                padding: 0.25, // Further reduced padding
                borderRadius: 1, 
                mb: 0,
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.65rem' }}> {/* Even smaller font */}
                  Last Order:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.65rem' }}> {/* Even smaller font */}
                  {formatLastOrderDate(lastOrderInfo.date)}
                  {lastOrderInfo.quantity && ` • Qty: ${lastOrderInfo.quantity}`}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right side controls */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, ml: 1.5 }}> {/* Reduced left margin */}
            {/* Quantity controls */}
            {product.requiresQuantity && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}> {/* Further reduced gap */}
                <IconButton 
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 0}
                  size="small"
                  sx={{ 
                    p: 0, // Remove padding to match TextField height
                    backgroundColor: '#f44336',
                    color: 'white',
                    borderRadius: 1, // More rectangular/square shape
                    '&:hover': {
                      backgroundColor: '#d32f2f',
                    },
                    '&:disabled': {
                      backgroundColor: '#ffcdd2',
                      color: '#ffffff80',
                    },
                    width: 50, // Match TextField width
                    height: 40, // Match TextField height (small size)
                  }}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                
                <TextField
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    handleQuantityChange(value);
                  }}
                  inputProps={{
                    min: 0,
                    style: { textAlign: 'center', fontSize: '0.9rem' }, // Even smaller font
                  }}
                  sx={{ width: 50 }} // Further reduced width
                  size="small"
                />
                
                <IconButton 
                  onClick={() => handleQuantityChange(quantity + 1)}
                  size="small"
                  sx={{ 
                    p: 0, // Remove padding to match TextField height
                    backgroundColor: '#4caf50',
                    color: 'white',
                    borderRadius: 1, // More rectangular/square shape
                    '&:hover': {
                      backgroundColor: '#388e3c',
                    },
                    width: 50, // Match TextField width
                    height: 40, // Match TextField height (small size)
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            {/* Order checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={shouldOrder}
                  onChange={(e) => handleOrderChange(e.target.checked)}
                  color="primary"
                  size="small" // Made checkbox smaller
                />
              }
              label={<Typography variant="body2">Order</Typography>} // Smaller label
              sx={{ m: 0 }} // Removed default margins
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
