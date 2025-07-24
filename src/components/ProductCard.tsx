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
  useEffect(() => {
    if (product.requiresQuantity && quantity < minThreshold) {
      setShouldOrder(true);
    }
  }, [quantity, minThreshold, product.requiresQuantity]);

  // Update parent when values change
  useEffect(() => {
    if (product.requiresQuantity) {
      onUpdate(product.id, quantity, shouldOrder);
    } else {
      onUpdate(product.id, undefined, shouldOrder);
    }
  }, [quantity, shouldOrder, product.id, product.requiresQuantity]);

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
        mb: 1.5, // Reduced from 2
        border: isLowStock ? '2px solid #f44336' : '1px solid #e0e0e0',
        backgroundColor: isLowStock ? '#ffebee' : 'white',
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}> {/* Reduced padding */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}> {/* Reduced mb from 2 to 1 */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ mb: 0.5 }}> {/* Reduced margin bottom */}
              {product.name}
            </Typography>
            
            {/* Categories */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}> {/* Reduced mb from 1 to 0.5 */}
              {getProductCategories().map((category) => (
                <Chip
                  key={category?.id}
                  label={category?.name}
                  size="small"
                  style={{ backgroundColor: category?.color }}
                />
              ))}
            </Box>

            {/* Suppliers */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}> {/* Reduced mb from 1 to 0.5 */}
              Suppliers: {getProductSuppliers().map(s => s?.name).join(', ')}
            </Typography>

            {product.requiresQuantity && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}> {/* Reduced mb from 1 to 0.5 */}
                Min Threshold: {minThreshold}
              </Typography>
            )}

            {/* Last Order Information */}
            {lastOrderInfo && (
              <Box sx={{ 
                backgroundColor: '#f5f5f5', 
                padding: 0.5, // Reduced from 1
                borderRadius: 1, 
                mb: 0, // Reduced from 1
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}> {/* Smaller font */}
                  Last Order:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}> {/* Smaller font */}
                  {formatLastOrderDate(lastOrderInfo.date)}
                  {lastOrderInfo.quantity && ` • Qty: ${lastOrderInfo.quantity}`}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right side controls */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, ml: 2 }}> {/* Reduced gap from 1 to 0.5 */}
            {/* Quantity controls */}
            {product.requiresQuantity && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}> {/* Reduced gap from 1 to 0.5 */}
                <IconButton 
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 0}
                  size="small"
                  sx={{ p: 0.5 }} // Reduced padding
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
                    style: { textAlign: 'center' },
                  }}
                  sx={{ width: 70 }} // Reduced from 80
                  size="small"
                />
                
                <IconButton 
                  onClick={() => handleQuantityChange(quantity + 1)}
                  size="small"
                  sx={{ p: 0.5 }} // Reduced padding
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

        {isLowStock && (
          <Typography 
            variant="caption" 
            color="error" 
            sx={{ 
              display: 'block', 
              mt: 0.5, // Reduced from 1
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '0.7rem' // Smaller font
            }}
          >
            ⚠️ Below minimum threshold - auto-selected for ordering
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
