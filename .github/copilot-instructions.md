# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a React TypeScript cafe inventory management web application with the following specifications:

## Tech Stack
- React 18 with TypeScript
- Vite for build tooling
- Material-UI for responsive, mobile-first design
- Google Sheets API for data storage (no OAuth 2.0, using service account)
- EmailJS for sending order summaries
- Day.js for date handling

## Key Features
- Multi-location cafe inventory management
- Dynamic product and category management
- Automatic order flagging based on thresholds
- Email notifications for orders
- Historical inventory tracking
- Mobile-first responsive design

## Design Guidelines
- Mobile-first approach
- White/light gray backgrounds
- Dark, legible text
- Clean, intuitive interface
- Responsive design for both mobile and desktop

## Data Structure
- Products belong to multiple categories
- Location-specific minimum thresholds
- Order history tracking by session
- Multiple supplier support (Costco, Sysco, Shoreline, Trader Joe's, etc.)

## Code Standards
- Use TypeScript for type safety
- Follow React best practices with hooks
- Implement proper error handling
- Use Material-UI components consistently
- Ensure accessibility compliance
