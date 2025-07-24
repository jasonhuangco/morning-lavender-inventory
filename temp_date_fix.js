const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/components/InventoryScreen.tsx', 'utf8');

// Replace the formatDate function
const oldFormatDate = `  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };`;

const newFormatDate = `  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };`;

content = content.replace(oldFormatDate, newFormatDate);

// Write the file back
fs.writeFileSync('src/components/InventoryScreen.tsx', content);

console.log('Date format updated successfully');
