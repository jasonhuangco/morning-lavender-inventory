import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Box,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
} from '@mui/material';
import { useAppContext } from '../context/AppContext';
import { Product, ProductLocation } from '../types';

interface EditProductDialogProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({ open, onClose, product }) => {
  const { state, dispatch } = useAppContext();
  const [productName, setProductName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [requiresQuantity, setRequiresQuantity] = useState(true);
  const [locationSettings, setLocationSettings] = useState<ProductLocation[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && product) {
      setProductName(product.name);
      setSelectedCategories(product.categories);
      setSelectedSuppliers(product.suppliers);
      setRequiresQuantity(product.requiresQuantity);
      setLocationSettings(product.locations);
      setError('');
    }
  }, [open, product]);

  const handleClose = () => {
    setProductName('');
    setSelectedCategories([]);
    setSelectedSuppliers([]);
    setRequiresQuantity(true);
    setLocationSettings([]);
    setError('');
    onClose();
  };

  const handleLocationSettingChange = (locationId: string, field: 'isAvailable' | 'minThreshold', value: boolean | number) => {
    setLocationSettings(prev => 
      prev.map(setting => 
        setting.locationId === locationId 
          ? { ...setting, [field]: value }
          : setting
      )
    );
  };

  const handleSubmit = () => {
    if (!productName.trim()) {
      setError('Product name is required');
      return;
    }

    if (selectedCategories.length === 0) {
      setError('Please select at least one category');
      return;
    }

    if (selectedSuppliers.length === 0) {
      setError('Please select at least one supplier');
      return;
    }

    if (!product) {
      setError('Product not found');
      return;
    }

    const updatedProduct: Product = {
      id: product.id,
      name: productName.trim(),
      categories: selectedCategories,
      suppliers: selectedSuppliers,
      requiresQuantity,
      locations: locationSettings,
    };

    dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
    handleClose();
  };

  if (!product) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Product</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Product Name"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
              setError('');
            }}
            fullWidth
            required
          />

          <FormControl fullWidth required>
            <InputLabel>Categories</InputLabel>
            <Select
              multiple
              value={selectedCategories}
              onChange={(e) => setSelectedCategories(e.target.value as string[])}
              input={<OutlinedInput label="Categories" />}
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

          <FormControl fullWidth required>
            <InputLabel>Suppliers</InputLabel>
            <Select
              multiple
              value={selectedSuppliers}
              onChange={(e) => setSelectedSuppliers(e.target.value as string[])}
              input={<OutlinedInput label="Suppliers" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const supplier = state.suppliers.find(s => s.id === value);
                    return (
                      <Chip
                        key={value}
                        label={supplier?.name}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {state.suppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={requiresQuantity}
                onChange={(e) => setRequiresQuantity(e.target.checked)}
              />
            }
            label="Requires Quantity Tracking"
          />

          <Typography variant="h6" sx={{ mt: 2 }}>
            Location Settings
          </Typography>

          {state.locations.map((location) => {
            const setting = locationSettings.find(s => s.locationId === location.id);
            return (
              <Box key={location.id} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {location.name}
                </Typography>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={setting?.isAvailable || false}
                      onChange={(e) => handleLocationSettingChange(location.id, 'isAvailable', e.target.checked)}
                    />
                  }
                  label="Available at this location"
                />

                {requiresQuantity && setting?.isAvailable && (
                  <TextField
                    label="Minimum Threshold"
                    type="number"
                    value={setting.minThreshold || 0}
                    onChange={(e) => handleLocationSettingChange(location.id, 'minThreshold', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0 }}
                    size="small"
                    sx={{ mt: 1, width: '100%' }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Update Product
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProductDialog;
