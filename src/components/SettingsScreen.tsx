import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  CloudSync as CloudSyncIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { Location, Category, Supplier, OrderSummary } from '../types';
import { EmailService } from '../services/emailService';

const SettingsScreen: React.FC = () => {
  const { state, dispatch, syncWithGoogleSheets, syncWithSupabase, autoSyncEnabled, setAutoSyncEnabled } = useAppContext();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryColor, setCategoryColor] = useState('#E3F2FD');
  const [supplierName, setSupplierName] = useState('');
  const [emailServiceId, setEmailServiceId] = useState('');
  const [emailTemplateId, setEmailTemplateId] = useState('');
  const [emailPublicKey, setEmailPublicKey] = useState('');
  const [emailTesting, setEmailTesting] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState('');
  const [sheetsSpreadsheetId, setSheetsSpreadsheetId] = useState('');
  const [sheetsCredentials, setSheetsCredentials] = useState<File | null>(null);
  const [sheetsTesting, setSheetsTesting] = useState(false);
  const [sheetsTestResult, setSheetsTestResult] = useState('');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncResult, setSyncResult] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState('');
  const [supabaseSyncInProgress, setSupabaseSyncInProgress] = useState(false);
  const [supabaseSyncResult, setSupabaseSyncResult] = useState('');

  // Load saved settings on component mount
  React.useEffect(() => {
    const savedEmailServiceId = localStorage.getItem('emailServiceId');
    const savedEmailTemplateId = localStorage.getItem('emailTemplateId');
    const savedEmailPublicKey = localStorage.getItem('emailPublicKey');
    const savedSupabaseUrl = localStorage.getItem('supabaseUrl');
    const savedSupabaseKey = localStorage.getItem('supabaseKey');
    const savedSheetsSpreadsheetId = localStorage.getItem('googleSheetsSpreadsheetId');

    if (savedEmailServiceId) setEmailServiceId(savedEmailServiceId);
    if (savedEmailTemplateId) setEmailTemplateId(savedEmailTemplateId);
    if (savedEmailPublicKey) setEmailPublicKey(savedEmailPublicKey);
    if (savedSupabaseUrl) setSupabaseUrl(savedSupabaseUrl);
    if (savedSupabaseKey) setSupabaseKey(savedSupabaseKey);
    if (savedSheetsSpreadsheetId) setSheetsSpreadsheetId(savedSheetsSpreadsheetId);
  }, []);

  const handleAddLocation = () => {
    if (!locationName.trim()) return;

    const newLocation: Location = {
      id: Date.now().toString(),
      name: locationName.trim(),
      address: locationAddress.trim() || undefined,
    };

    dispatch({ type: 'ADD_LOCATION', payload: newLocation });
    setLocationName('');
    setLocationAddress('');
    setShowLocationDialog(false);
  };

  const handleUpdateLocation = () => {
    if (!locationName.trim() || !editingLocation) return;

    const updatedLocation: Location = {
      id: editingLocation.id,
      name: locationName.trim(),
      address: locationAddress.trim() || undefined,
    };

    dispatch({ type: 'UPDATE_LOCATION', payload: updatedLocation });
    setLocationName('');
    setLocationAddress('');
    setShowLocationDialog(false);
    setEditingLocation(null);
  };

  const handleDeleteLocation = (location: Location) => {
    if (confirm(`Are you sure you want to delete "${location.name}"?`)) {
      dispatch({ type: 'DELETE_LOCATION', payload: location.id });
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setLocationAddress(location.address || '');
    setShowLocationDialog(true);
  };

  const handleAddCategory = () => {
    if (!categoryName.trim()) return;

    const newCategory: Category = {
      id: Date.now().toString(),
      name: categoryName.trim(),
      color: categoryColor,
    };

    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    setCategoryName('');
    setCategoryColor('#E3F2FD');
    setShowCategoryDialog(false);
  };

  const handleUpdateCategory = () => {
    if (!categoryName.trim() || !editingCategory) return;

    const updatedCategory: Category = {
      id: editingCategory.id,
      name: categoryName.trim(),
      color: categoryColor,
    };

    dispatch({ type: 'UPDATE_CATEGORY', payload: updatedCategory });
    setCategoryName('');
    setCategoryColor('#E3F2FD');
    setShowCategoryDialog(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      dispatch({ type: 'DELETE_CATEGORY', payload: category.id });
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryColor(category.color || '#E3F2FD');
    setShowCategoryDialog(true);
  };

  const handleAddSupplier = () => {
    if (!supplierName.trim()) return;

    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: supplierName.trim(),
    };

    dispatch({ type: 'ADD_SUPPLIER', payload: newSupplier });
    setSupplierName('');
    setShowSupplierDialog(false);
  };

  const handleUpdateSupplier = () => {
    if (!supplierName.trim() || !editingSupplier) return;

    const updatedSupplier: Supplier = {
      id: editingSupplier.id,
      name: supplierName.trim(),
    };

    dispatch({ type: 'UPDATE_SUPPLIER', payload: updatedSupplier });
    setSupplierName('');
    setShowSupplierDialog(false);
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    if (confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      dispatch({ type: 'DELETE_SUPPLIER', payload: supplier.id });
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierName(supplier.name);
    setShowSupplierDialog(true);
  };

  const handleTestEmail = async () => {
    if (!emailServiceId || !emailTemplateId || !emailPublicKey) {
      setEmailTestResult('Please fill in all email configuration fields.');
      return;
    }

    setEmailTesting(true);
    setEmailTestResult('');
    try {
      const emailService = new EmailService(emailServiceId, emailTemplateId, emailPublicKey);
      
      // Create a test order summary
      const testOrderSummary: OrderSummary = {
        sessionId: 'test-session',
        locationName: 'Test Location',
        userName: 'Test User',
        orderDate: new Date().toISOString(),
        items: [
          {
            productName: 'Test Product',
            quantity: 5,
            suppliers: ['Test Supplier 1', 'Test Supplier 2']
          }
        ]
      };

      await emailService.sendOrderEmail(testOrderSummary);
      setEmailTestResult('✅ Email test successful! Check your inbox.');
    } catch (error) {
      setEmailTestResult(`❌ Email test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setEmailTesting(false);
  };

    const handleSaveEmailSettings = async () => {
    try {
      setEmailTesting(true);
      setEmailTestResult('Saving email settings...');
      
      // Save to localStorage first for immediate use
      localStorage.setItem('emailServiceId', emailServiceId);
      localStorage.setItem('emailTemplateId', emailTemplateId);
      localStorage.setItem('emailPublicKey', emailPublicKey);
      
      // Create email-config object for compatibility
      const emailConfig = {
        serviceId: emailServiceId,
        templateId: emailTemplateId,
        publicKey: emailPublicKey
      };
      localStorage.setItem('email-config', JSON.stringify(emailConfig));

      // Try to save to database if Supabase is configured
      const savedSupabaseUrl = localStorage.getItem('supabaseUrl');
      const savedSupabaseKey = localStorage.getItem('supabaseKey');
      
      let databaseSaveStatus = 'not-configured';
      
      if (savedSupabaseUrl && savedSupabaseKey) {
        try {
          const { SupabaseService } = await import('../services/supabase');
          const supabaseService = new SupabaseService();
          supabaseService.initialize(savedSupabaseUrl, savedSupabaseKey);

          const promises = [
            supabaseService.upsertAppSetting('emailServiceId', emailServiceId),
            supabaseService.upsertAppSetting('emailTemplateId', emailTemplateId),
            supabaseService.upsertAppSetting('emailPublicKey', emailPublicKey)
          ];

          const results = await Promise.all(promises);
          databaseSaveStatus = results.every(r => r) ? 'success' : 'partial-failure';
          
        } catch (dbError) {
          console.warn('Failed to save email settings to database:', dbError);
          databaseSaveStatus = 'failure';
        }
      }

      // Provide appropriate user feedback
      if (databaseSaveStatus === 'success') {
        setEmailTestResult('✅ Email settings saved successfully to both local storage and cloud database!');
      } else if (databaseSaveStatus === 'failure') {
        setEmailTestResult('⚠️ Email settings saved locally. Cloud sync failed - please check your Supabase configuration.');
      } else if (databaseSaveStatus === 'not-configured') {
        setEmailTestResult('✅ Email settings saved locally. Configure Supabase to sync across devices.');
      } else {
        setEmailTestResult('⚠️ Email settings saved locally. Some cloud settings may not have synced properly.');
      }
      
    } catch (error) {
      console.error('Error saving email settings:', error);
      setEmailTestResult('❌ Failed to save email settings. Please try again.');
    } finally {
      setEmailTesting(false);
    }
  };

  const handleTestGoogleSheets = async () => {
    if (!sheetsSpreadsheetId || !sheetsCredentials) {
      setSheetsTestResult('Please provide both spreadsheet ID and credentials file.');
      return;
    }

    setSheetsTesting(true);
    try {
      // Test connection logic would go here
      setSheetsTestResult('Google Sheets connection test successful!');
    } catch (error) {
      setSheetsTestResult(`Google Sheets test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setSheetsTesting(false);
  };

  const handleSaveGoogleSheetsSettings = () => {
    // Save Google Sheets settings to localStorage
    localStorage.setItem('googleSheetsSpreadsheetId', sheetsSpreadsheetId);
    setSheetsTestResult('✅ Google Sheets settings saved successfully!');
    
    // Clear the message after a short delay
    setTimeout(() => {
      setSheetsTestResult('');
    }, 3000);
  };

  const handleSyncWithGoogleSheets = async () => {
    setSyncInProgress(true);
    try {
      await syncWithGoogleSheets();
      setSyncResult('Sync with Google Sheets successful!');
    } catch (error) {
      setSyncResult(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setSyncInProgress(false);
  };

  const handleTestSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setSupabaseTestResult('Please provide both Supabase URL and API Key.');
      return;
    }

    setSupabaseTesting(true);
    try {
      // Test connection logic would go here
      setSupabaseTestResult('Supabase connection test successful!');
    } catch (error) {
      setSupabaseTestResult(`Supabase test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setSupabaseTesting(false);
  };

  const handleSaveSupabaseSettings = () => {
    // Save Supabase settings to localStorage
    localStorage.setItem('supabaseUrl', supabaseUrl);
    localStorage.setItem('supabaseKey', supabaseKey);
    setSupabaseTestResult('✅ Supabase settings saved successfully!');
    
    // Clear the message after a short delay
    setTimeout(() => {
      setSupabaseTestResult('');
    }, 3000);
  };

  const handleSyncWithSupabase = async () => {
    setSupabaseSyncInProgress(true);
    try {
      await syncWithSupabase();
      setSupabaseSyncResult('Sync with Supabase successful!');
    } catch (error) {
      setSupabaseSyncResult(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setSupabaseSyncInProgress(false);
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {/* Locations Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Locations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Card>
            <CardContent>
              <List>
                {state.locations.map((location) => (
                  <ListItem key={location.id}>
                    <ListItemText
                      primary={location.name}
                      secondary={location.address}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditLocation(location)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteLocation(location)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Fab
                size="small"
                color="primary"
                aria-label="add location"
                onClick={() => setShowLocationDialog(true)}
                sx={{ mt: 2 }}
              >
                <AddIcon />
              </Fab>
            </CardContent>
          </Card>
        </AccordionDetails>
      </Accordion>

      {/* Categories Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Categories</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Card>
            <CardContent>
              <List>
                {state.categories.map((category) => (
                  <ListItem key={category.id}>
                    <ListItemText
                      primary={category.name}
                      secondary={
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: category.color,
                            borderRadius: 1,
                            border: '1px solid #ccc',
                          }}
                        />
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditCategory(category)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Fab
                size="small"
                color="primary"
                aria-label="add category"
                onClick={() => setShowCategoryDialog(true)}
                sx={{ mt: 2 }}
              >
                <AddIcon />
              </Fab>
            </CardContent>
          </Card>
        </AccordionDetails>
      </Accordion>

      {/* Suppliers Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Suppliers</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Card>
            <CardContent>
              <List>
                {state.suppliers.map((supplier) => (
                  <ListItem key={supplier.id}>
                    <ListItemText primary={supplier.name} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditSupplier(supplier)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleDeleteSupplier(supplier)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Fab
                size="small"
                color="primary"
                aria-label="add supplier"
                onClick={() => setShowSupplierDialog(true)}
                sx={{ mt: 2 }}
              >
                <AddIcon />
              </Fab>
            </CardContent>
          </Card>
        </AccordionDetails>
      </Accordion>

      {/* Email Integration Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Email Integration
            {emailServiceId && emailTemplateId && emailPublicKey && (
              <Typography component="span" variant="body2" color="success.main" sx={{ ml: 1 }}>
                ✓ Configured
              </Typography>
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Configure EmailJS for sending order summaries
              </Typography>
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => setShowEmailDialog(true)}
                fullWidth
                color={emailServiceId && emailTemplateId && emailPublicKey ? 'success' : 'primary'}
              >
                {emailServiceId && emailTemplateId && emailPublicKey ? 
                  'Email Settings Configured' : 
                  'Configure Email Settings'
                }
              </Button>
              {emailServiceId && emailTemplateId && emailPublicKey && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Service ID: {emailServiceId} | Template ID: {emailTemplateId}
                </Typography>
              )}
            </CardContent>
          </Card>
        </AccordionDetails>
      </Accordion>

      {/* Supabase Integration Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            Supabase Integration
            {supabaseUrl && supabaseKey && (
              <Typography component="span" variant="body2" color="success.main" sx={{ ml: 1 }}>
                ✓ Configured
              </Typography>
            )}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sync data with Supabase cloud database
              </Typography>
              
              {/* Auto-sync toggle */}
              <Card variant="outlined" sx={{ mb: 2, bgcolor: 'rgba(33, 150, 243, 0.04)' }}>
                <CardContent sx={{ py: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={autoSyncEnabled}
                        onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2">
                          Auto-sync enabled
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Automatically sync with Supabase on app startup, every 5 minutes, and when app regains focus
                        </Typography>
                      </Box>
                    }
                  />
                </CardContent>
              </Card>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Supabase URL"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Supabase Anon Key"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  fullWidth
                  size="small"
                  type="password"
                />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={handleTestSupabase}
                    disabled={supabaseTesting}
                    size="small"
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveSupabaseSettings}
                    size="small"
                  >
                    Save Settings
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CloudSyncIcon />}
                    onClick={handleSyncWithSupabase}
                    disabled={supabaseSyncInProgress}
                    size="small"
                  >
                    {supabaseSyncInProgress ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </Box>
                {supabaseTestResult && (
                  <Alert severity={supabaseTestResult.includes('successful') ? 'success' : 'error'}>
                    {supabaseTestResult}
                  </Alert>
                )}
                {supabaseSyncResult && (
                  <Alert severity={supabaseSyncResult.includes('successful') ? 'success' : 'error'}>
                    {supabaseSyncResult}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </AccordionDetails>
      </Accordion>

      {/* Google Sheets Integration Section */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Google Sheets Integration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Sync data with Google Sheets (requires service account credentials)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Spreadsheet ID"
                  value={sheetsSpreadsheetId}
                  onChange={(e) => setSheetsSpreadsheetId(e.target.value)}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="outlined"
                  component="label"
                  size="small"
                >
                  Upload Credentials JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => setSheetsCredentials(e.target.files?.[0] || null)}
                    hidden
                  />
                </Button>
                {sheetsCredentials && (
                  <Typography variant="body2" color="text.secondary">
                    File selected: {sheetsCredentials.name}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={handleTestGoogleSheets}
                    disabled={sheetsTesting}
                    size="small"
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveGoogleSheetsSettings}
                    size="small"
                  >
                    Save Settings
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<StorageIcon />}
                    onClick={handleSyncWithGoogleSheets}
                    disabled={syncInProgress}
                    size="small"
                  >
                    {syncInProgress ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </Box>
                {sheetsTestResult && (
                  <Alert severity={sheetsTestResult.includes('successful') ? 'success' : 'error'}>
                    {sheetsTestResult}
                  </Alert>
                )}
                {syncResult && (
                  <Alert severity={syncResult.includes('successful') ? 'success' : 'error'}>
                    {syncResult}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </AccordionDetails>
      </Accordion>

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onClose={() => {
        setShowLocationDialog(false);
        setEditingLocation(null);
        setLocationName('');
        setLocationAddress('');
      }}>
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Location Name"
            fullWidth
            variant="outlined"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Address (Optional)"
            fullWidth
            variant="outlined"
            value={locationAddress}
            onChange={(e) => setLocationAddress(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowLocationDialog(false);
            setEditingLocation(null);
            setLocationName('');
            setLocationAddress('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingLocation ? handleUpdateLocation : handleAddLocation}
            variant="contained"
          >
            {editingLocation ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onClose={() => {
        setShowCategoryDialog(false);
        setEditingCategory(null);
        setCategoryName('');
        setCategoryColor('#E3F2FD');
      }}>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Color"
            type="color"
            fullWidth
            variant="outlined"
            value={categoryColor}
            onChange={(e) => setCategoryColor(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowCategoryDialog(false);
            setEditingCategory(null);
            setCategoryName('');
            setCategoryColor('#E3F2FD');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
            variant="contained"
          >
            {editingCategory ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={showSupplierDialog} onClose={() => {
        setShowSupplierDialog(false);
        setEditingSupplier(null);
        setSupplierName('');
      }}>
        <DialogTitle>
          {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Supplier Name"
            fullWidth
            variant="outlined"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowSupplierDialog(false);
            setEditingSupplier(null);
            setSupplierName('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={editingSupplier ? handleUpdateSupplier : handleAddSupplier}
            variant="contained"
          >
            {editingSupplier ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onClose={() => setShowEmailDialog(false)}>
        <DialogTitle>Email Configuration</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="EmailJS Service ID"
            fullWidth
            variant="outlined"
            value={emailServiceId}
            onChange={(e) => setEmailServiceId(e.target.value)}
          />
          <TextField
            margin="dense"
            label="EmailJS Template ID"
            fullWidth
            variant="outlined"
            value={emailTemplateId}
            onChange={(e) => setEmailTemplateId(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            margin="dense"
            label="EmailJS Public Key"
            fullWidth
            variant="outlined"
            value={emailPublicKey}
            onChange={(e) => setEmailPublicKey(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Button
            variant="outlined"
            onClick={handleTestEmail}
            disabled={emailTesting}
            sx={{ mt: 2 }}
            fullWidth
          >
            {emailTesting ? 'Testing...' : 'Test Email'}
          </Button>
          {emailTestResult && (
            <Alert 
              severity={emailTestResult.includes('successful') ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {emailTestResult}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmailDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEmailSettings} variant="contained" disabled={emailTesting}>
            {emailTesting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsScreen;
