# Supabase Database Setup Instructions

## Setting Up Email Settings Persistence

To enable email settings to persist across browsers and devices, you need to create an `app_settings` table in your Supabase database.

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard at [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Create the app_settings Table

Copy and paste the following SQL command into the SQL Editor and click "Run":

```sql
-- Create app_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- Enable Row Level Security (RLS)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on app_settings" ON app_settings
  FOR ALL USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Verify Table Creation

After running the SQL command, you should see:
- A new table called `app_settings` in your database
- The table will have columns: `id`, `setting_key`, `setting_value`, `created_at`, `updated_at`

### Step 4: Test Email Settings Sync

1. Go back to your application
2. Navigate to Settings
3. Configure your email settings (Service ID, Template ID, Public Key)
4. Click "Save"
5. You should see a success message indicating the settings were saved to both local storage and cloud database

### What This Enables

- **Cross-Device Sync**: Your email settings will now sync across all browsers and devices
- **Persistent Storage**: Settings won't be lost when clearing browser data
- **Automatic Loading**: Email settings will be loaded from the database when you open the app

### Security Notes

The example policy allows all operations on the `app_settings` table. For production use, you may want to implement more restrictive policies based on your authentication setup.

### Troubleshooting

If you encounter issues:

1. **Table Creation Failed**: Check that you have the necessary permissions in your Supabase project
2. **Settings Not Syncing**: Verify your Supabase URL and API key are correctly configured in the app
3. **Permission Errors**: Ensure the RLS policy is correctly applied

For additional help, check the Supabase documentation or contact support.
