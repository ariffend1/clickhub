# Getting Started with ClickHub

A comprehensive guide to set up ClickHub for development and get it running on your local machine.

## 📋 Prerequisites

### Required
- **Node.js**: v18.0.0 or higher ([download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: For version control
- **Supabase Account**: Free tier at [supabase.com](https://supabase.com)

### Optional
- **VS Code**: Recommended editor ([download](https://code.visualstudio.com/))
- **Git GUI**: GitHub Desktop or Sourcetree (optional)
- **Docker**: For containerized development

## 🔍 Verify Installation

```bash
# Check Node.js version
node --version  # Should be v18+

# Check npm version
npm --version   # Should be v9+

# Check Git
git --version   # Should show Git version
```

## 🚀 Step-by-Step Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/ariffend1/clickhub.git

# Navigate to project
cd clickhub
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# Or use alternative package managers
yarn install   # if using yarn
pnpm install   # if using pnpm
```

### Step 3: Set Up Supabase

#### 3.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - **Name**: ClickHub Dev (or your choice)
   - **Database Password**: Strong password (save it!)
   - **Region**: Choose closest to you
4. Wait for project to be created (5-10 minutes)

#### 3.2 Get API Keys
1. Go to **Settings** → **API**
2. Under "Project API Keys", copy:
   - **Project URL** (VITE_SUPABASE_URL)
   - **anon / public key** (VITE_SUPABASE_ANON_KEY)

### Step 4: Configure Environment Variables

```bash
# Copy template
cp .env.example .env.local

# Edit with your Supabase credentials
# On Linux/macOS
nano .env.local

# On Windows
type .env.example > .env.local
# Then edit in your editor
```

**Example `.env.local`:**
```
VITE_SUPABASE_URL=https://xyzabc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_BYPASS_AUTH=false
```

### Step 5: Start Development Server

```bash
# Start Vite dev server
npm run dev

# Output:
# VITE v7.3.2  ready in 512 ms
# ➜  Local:   http://localhost:5173/
```

**Open browser and visit**: `http://localhost:5173`

## 🔑 First Time Login

### Default Demo Account (if BYPASS_AUTH enabled)
- **Email**: demo@clickhub.local
- **Password**: demo123456

### Create New Account
1. Sign up with your email
2. Verify email (check inbox + spam folder)
3. Set password
4. Login

## 🎯 Common Tasks

### View Application
```bash
# Dev server already running?
npm run dev

# Open in browser
http://localhost:5173
```

### Build for Production
```bash
# Create optimized production build
npm run build

# Output in dist/index.html
```

### Preview Production Build
```bash
# Preview the production build locally
npm run preview

# Visit http://localhost:4173
```

### Debug in Browser
```bash
# Open DevTools (F12 or Right-click → Inspect)

# Check Zustand store state
window.useStore.getState()

# Check specific value
window.useStore.getState().activePage
```

## 📁 Project Structure Quick Reference

```
src/
├── components/      # React components organized by feature
├── store/           # Zustand state management
├── lib/             # External library configs (Supabase)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

## 🚨 Troubleshooting

### "Cannot find module" Error
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json  # Linux/macOS
# or
rmdir node_modules /s                  # Windows
npm install
```

### "VITE_SUPABASE_URL is missing" Error
**Solution:**
1. Check `.env.local` file exists
2. Verify environment variables are set correctly
3. Restart dev server: `npm run dev`

### Supabase Connection Fails
**Solution:**
1. Verify URL and anon key are correct
2. Check Supabase project is active
3. Ensure network connectivity
4. Try clearing browser cache

### Port 5173 Already in Use
**Solution:**
```bash
# Kill process on port 5173
# Linux/macOS
lsof -ti:5173 | xargs kill -9

# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

### High Memory Usage
**Solution:**
1. Restart dev server
2. Check browser console for errors
3. Close other applications
4. Update Node.js to latest LTS

## 📚 Next Steps

### Learn the Codebase
1. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Review [src/types/index.ts](./src/types/index.ts) for data models
3. Check [src/store/useStore.ts](./src/store/useStore.ts) for state management

### Make Your First Change
1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Test thoroughly
4. Follow [CONTRIBUTING.md](./CONTRIBUTING.md)
5. Submit pull request

### Run Tests (if available)
```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
```

### Explore Supabase
1. Visit [supabase dashboard](https://app.supabase.com)
2. View tables and data
3. Check real-time capabilities
4. Explore authentication settings

## 🆘 Still Stuck?

- **GitHub Issues**: Search or create an issue
- **Discussions**: Ask in GitHub Discussions
- **Discord** (if available): Join community server
- **Email**: contact@clickhub.local

## ✅ Checklist

Before starting development:
- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` configured
- [ ] Supabase project created
- [ ] Dev server running (`npm run dev`)
- [ ] Browser shows ClickHub interface
- [ ] Can login successfully

---

**Congratulations! You're ready to start developing ClickHub! 🎉**

For more details, check [README.md](./README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md)