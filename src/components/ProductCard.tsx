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
        mb: 2,
        border: isLowStock ? '2px solid #f44336' : '1px solid #e0e0e0',
        backgroundColor: isLowStock ? '#ffebee' : 'white',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {product.name}
            </Typography>
            
            {/* Categories */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Suppliers: {getProductSuppliers().map(s => s?.name).join(', ')}
            </Typography>

            {product.requiresQuantity && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Min Threshold: {minThreshold}
              </Typography>
            )}

            {/* Last Order Information */}
            {lastOrderInfo && (
              <Box sx={{ 
                backgroundColor: '#f5f5f5', 
                padding: 1, 
                borderRadius: 1, 
                mb: 1,
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Last Order:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatLastOrderDate(lastOrderInfo.date)}
                  {lastOrderInfo.quantity && ` • Qty: ${lastOrderInfo.quantity}`}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {product.requiresQuantity ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 0}
                size="small"
              >
                <RemoveIcon />
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
                sx={{ width: 80 }}
                size="small"
              />
              
              <IconButton 
                onClick={() => handleQuantityChange(quantity + 1)}
                size="small"
              >
                <AddIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ flex: 1 }} />
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={shouldOrder}
                onChange={(e) => handleOrderChange(e.target.checked)}
                color="primary"
              />
            }
            label="Order"
            sx={{ ml: 2 }}
          />
        </Box>

        {isLowStock && (
          <Typography 
            variant="caption" 
            color="error" 
            sx={{ 
              display: 'block', 
              mt: 1, 
              fontWeight: 'bold',
              textAlign: 'center' 
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
