# Cafe Inventory Manager

A mobile-first web application for managing cafe inventory across multiple locations with automatic order threshold detection and email notifications.

## Features

- **Multi-location support** - Manage inventory for multiple cafe locations
- **Dynamic categories** - Organize products with multiple categories per item
- **Smart ordering** - Automatic order flagging when inventory falls below thresholds
- **Email notifications** - Automatic order summaries sent via EmailJS
- **Historical tracking** - Complete history of all inventory sessions
- **Mobile-first design** - Optimized for mobile devices with responsive desktop support
- **Offline-capable** - Data stored locally with Google Sheets sync capability

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- EmailJS account

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **EmailJS Setup:**
   - Create an EmailJS account at https://www.emailjs.com/
   - Create a new service and template
   - Note your Service ID, Template ID, and Public Key
   - Configure these in the app's Settings screen

3. **Environment Configuration:**
   Create a `.env` file in the root directory:
   ```
   VITE_EMAILJS_SERVICE_ID=your_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```

   Note: You can also configure EmailJS directly in the Settings screen without using environment variables.

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or next available port)

### Build for Production

```bash
npm run build
```

## Current Status

### ✅ Fully Implemented Features:
- **Multi-location inventory management**
- **Dynamic product and category management**
- **Automatic order threshold detection**
- **Email notifications via EmailJS**
- **Complete order history tracking**
- **Mobile-first responsive design**
- **Local data storage with browser persistence**

### 🚧 Coming Soon:
- **Google Sheets Integration** - Cloud backup and cross-device sync (currently in development)

## Usage

### Starting an Inventory Session

1. Enter your name and select the location
2. Click "Start Counting" to begin

### Managing Inventory

- **Filter by categories** - Use the multi-select dropdown to filter products
- **Quantity tracking** - For quantity-based products, use +/- buttons or type directly
- **Order flagging** - Check the "Order" checkbox or let it auto-check when below threshold
- **Add products** - Use the floating + button to add new products

### Submitting Orders

1. Products marked for ordering will show in the floating action button
2. Click "Submit Order" to send an email summary
3. The session will be saved to history

### Settings

- **Locations** - Add new cafe locations
- **Categories** - Create and color-code product categories
- **Suppliers** - Manage supplier information

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Material-UI (MUI) for responsive components
- **State Management**: React Context + useReducer
- **Storage**: localStorage + Google Sheets API
- **Email**: EmailJS for order notifications
- **Styling**: CSS-in-JS with MUI theming

## EmailJS Template Variables

Your EmailJS template should include these variables:
- `{{to_email}}` - Recipient email (jason@morninglavender.com)
- `{{location_name}}` - Location name
- `{{user_name}}` - Person who did the count
- `{{order_date}}` - Date of the order
- `{{items_list}}` - List of items to order
- `{{total_items}}` - Total number of items

## Data Structure

The app uses localStorage for immediate access and reliable data persistence. All data is stored locally in your browser, including:

- **Products**: Name, categories, suppliers, location-specific thresholds
- **Locations**: Name and address information  
- **Categories**: Color-coded organization tags
- **Suppliers**: Vendor information
- **Sessions**: Complete inventory count history
- **Order History**: Tracking of all submitted orders with dates and quantities

Google Sheets cloud sync integration is planned for future releases.

## Mobile Optimization

- Touch-friendly interface with large buttons
- Optimized for portrait orientation
- Fast loading with minimal dependencies
- Offline-capable with localStorage
- Bottom navigation for easy thumb access

## License

Private use only - Morning Lavender Cafe
