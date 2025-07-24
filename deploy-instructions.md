# 🚀 Deployment Instructions for Morning Lavender Cafe Inventory

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)
1. **Sign up at [vercel.com](https://vercel.com)** with your GitHub account
2. **Create GitHub repository:**
   - Go to [github.com](https://github.com) and create a new repository
   - Name it: `morning-lavender-inventory`
   - Make it public or private
3. **Push your code to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/morning-lavender-inventory.git
   git branch -M main
   git push -u origin main
   ```
4. **Deploy on Vercel:**
   - In Vercel dashboard, click "New Project"
   - Import your GitHub repository
   - Click "Deploy" (no configuration needed!)
   - Get your live URL in ~2 minutes

### Option 2: Netlify (Also Great)
1. **Sign up at [netlify.com](https://netlify.com)**
2. **Manual Deploy (Fastest):**
   - Drag and drop your `dist` folder to Netlify
   - Get instant URL
3. **GitHub Deploy (Better for updates):**
   - Connect GitHub repository
   - Auto-deploy on code changes

### Option 3: Firebase Hosting
1. **Install Firebase CLI:** `npm install -g firebase-tools`
2. **Initialize:** `firebase init hosting`
3. **Deploy:** `firebase deploy`

## 🔒 Environment Variables Setup

Before deploying, you'll need to configure your environment variables in the hosting platform:

### Required Variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_EMAILJS_SERVICE_ID`: Your EmailJS service ID
- `VITE_EMAILJS_TEMPLATE_ID`: Your EmailJS template ID
- `VITE_EMAILJS_PUBLIC_KEY`: Your EmailJS public key

### In Vercel:
1. Go to Project Settings → Environment Variables
2. Add each variable with its value

### In Netlify:
1. Go to Site Settings → Build & Deploy → Environment Variables
2. Add each variable with its value

## 📱 Mobile-First Design
Your app is already optimized for mobile use! It will work great on:
- Phones and tablets
- Desktop computers
- Any modern web browser

## 🔗 Share with Employees
Once deployed, you'll get a URL like:
- Vercel: `https://morning-lavender-inventory.vercel.app`
- Netlify: `https://morning-lavender-inventory.netlify.app`

Just share this URL with your employees - no app installation needed!

## 🔄 Updating the App
1. Make changes to your code
2. Commit and push to GitHub
3. Your hosting platform will auto-deploy the updates
4. Changes appear live in ~1-2 minutes

## 💡 Pro Tips
- **Custom Domain**: Both Vercel and Netlify support custom domains (morninglavender.com/inventory)
- **Password Protection**: Add basic auth if you want to restrict access
- **Analytics**: Both platforms offer usage analytics
- **SSL**: Automatic HTTPS security included

## 🆘 Need Help?
Your app is production-ready! The built `dist` folder contains everything needed for deployment.
