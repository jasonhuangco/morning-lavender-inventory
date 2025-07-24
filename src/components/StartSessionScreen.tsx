import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
} from '@mui/material';
import { Start as StartIcon } from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { InventorySession } from '../types';

interface StartSessionScreenProps {
  onSessionStart: () => void;
}

const StartSessionScreen: React.FC<StartSessionScreenProps> = ({ onSessionStart }) => {
  const { state, dispatch } = useAppContext();
  const [userName, setUserName] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [error, setError] = useState('');

  const handleStartSession = () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!selectedLocationId) {
      setError('Please select a location');
      return;
    }

    const newSession: InventorySession = {
      id: Date.now().toString(),
      locationId: selectedLocationId,
      userName: userName.trim(),
      startDate: new Date().toISOString(),
      items: [],
      isSubmitted: false,
    };

    dispatch({ type: 'SET_CURRENT_SESSION', payload: newSession });
    onSessionStart();
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom textAlign="center">
            Start Inventory Count
          </Typography>
          
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
            Enter your name and select the location to begin counting inventory.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Your Name"
              variant="outlined"
              fullWidth
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setError('');
              }}
              placeholder="Enter your full name"
            />

            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={selectedLocationId}
                label="Location"
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  setError('');
                }}
              >
                {state.locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="large"
              startIcon={<StartIcon />}
              onClick={handleStartSession}
              sx={{ mt: 2, py: 1.5 }}
            >
              Start Counting
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StartSessionScreen;
