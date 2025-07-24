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
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { AppProvider } from './context/AppContext';
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
  const [currentTab, setCurrentTab] = useState(0);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // Set document title
  useEffect(() => {
    document.title = 'Morning Lavender Cafe Inventory';
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderCurrentScreen = () => {
    if (!hasActiveSession && currentTab === 0) {
      return <StartSessionScreen onSessionStart={() => setHasActiveSession(true)} />;
    }

    switch (currentTab) {
      case 0:
        return <InventoryScreen onSessionEnd={() => setHasActiveSession(false)} />;
      case 1:
        return <HistoryScreen />;
      case 2:
        return <SettingsScreen />;
      default:
        return <StartSessionScreen onSessionStart={() => setHasActiveSession(true)} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static" elevation={1}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Morning Lavender Cafe Inventory
              </Typography>
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
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
