import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Container,
  Box,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { AppProvider, useAppContext } from './context/AppContext';
import InventoryScreen from './components/InventoryScreen';
import HistoryScreen from './components/HistoryScreen';
import SettingsScreen from './components/SettingsScreen';
import StartSessionScreen from './components/StartSessionScreen';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
    primary: {
      main: '#2196f3',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderTop: '1px solid #e0e0e0',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { isLoading, isInitialized, autoSyncEnabled, state, dispatch } = useAppContext();
  const [currentTab, setCurrentTab] = useState(0);
  
  // Derive hasActiveSession from the actual currentSession in context
  const hasActiveSession = !!state.currentSession && !state.currentSession.isSubmitted;

  // Set document title
  useEffect(() => {
    document.title = 'Morning Lavender Cafe Inventory';
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderCurrentScreen = () => {
    if (!hasActiveSession && currentTab === 0) {
      return <StartSessionScreen onSessionStart={() => {
        // Session start is handled by the StartSessionScreen component via dispatch
        // No need to manually set anything here
      }} />;
    }

    switch (currentTab) {
      case 0:
        return <InventoryScreen onSessionEnd={() => {
          // Clear the current session when session ends
          dispatch({ type: 'SET_CURRENT_SESSION', payload: undefined });
        }} />;
      case 1:
        return (
          <HistoryScreen 
            onNavigateToInventory={() => {
              // Just navigate to inventory tab, the session is already set by HistoryScreen
              setCurrentTab(0);
            }} 
          />
        );
      case 2:
        return <SettingsScreen />;
      default:
        return <StartSessionScreen onSessionStart={() => {
          // Session start is handled by the StartSessionScreen component via dispatch
        }} />;
    }
  };

  // Show loading screen during initial data load
  if (!isInitialized) {
    return (
      <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6">
            Loading Cafe Inventory...
          </Typography>
          <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
            {isLoading ? 'Syncing with database...' : 'Preparing your data...'}
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Morning Lavender Cafe Inventory
          </Typography>
          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              <Typography variant="body2" color="inherit">
                Syncing...
              </Typography>
            </Box>
          )}
          {autoSyncEnabled && !isLoading && (
            <Typography variant="body2" color="inherit" sx={{ opacity: 0.7 }}>
              ✓ Auto-sync enabled
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          py: 2,
          pb: 10, // Space for bottom navigation
        }}
      >
        {renderCurrentScreen()}
      </Container>

      <BottomNavigation
        value={currentTab}
        onChange={handleTabChange}
        showLabels
      >
        <BottomNavigationAction
          label="Inventory"
          icon={<InventoryIcon />}
        />
        <BottomNavigationAction
          label="History"
          icon={<HistoryIcon />}
        />
        <BottomNavigationAction
          label="Settings"
          icon={<SettingsIcon />}
        />
      </BottomNavigation>
    </Box>
  );
}

export default App;
