# Troubleshooting Guide

Common issues and their solutions for ClickHub development and deployment.

## 🚨 Common Issues

### Installation & Setup

#### ❌ "npm: command not found"
**Problem**: Node.js/npm not installed

**Solution**:
```bash
# Check if Node.js is installed
node --version

# If not, download from:
# https://nodejs.org/ (LTS version)

# Verify after installation
node --version   # Should be v18+
npm --version    # Should be v9+
```

#### ❌ "Cannot find module" errors
**Problem**: Dependencies not installed

**Solution**:
```bash
# Install/reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or try clean install
npm ci
```

#### ❌ ".env.local not found" error
**Problem**: Environment variables not configured

**Solution**:
```bash
# Copy template
cp .env.example .env.local

# Edit file with your Supabase credentials
# Linux/macOS
nano .env.local

# Windows
type .env.local  # to view
# Edit in VS Code
```

**File should contain**:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
```

---

### Development Server Issues

#### ❌ "Port 5173 already in use"
**Problem**: Another process is using the port

**Solution**:
```bash
# Linux/macOS - Kill process on port
lsof -ti:5173 | xargs kill -9

# Windows - Find and kill process
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

#### ❌ "VITE: error when starting dev server"
**Problem**: Vite configuration error

**Solution**:
```bash
# Check vite.config.ts syntax
# Ensure no TypeScript errors

# Restart dev server
npm run dev

# Check for errors in console
```

#### ❌ High memory usage / Dev server crashes
**Problem**: Memory leak or too many watchers

**Solution**:
```bash
# Restart dev server
Ctrl+C (stop)
npm run dev (start)

# Update Node.js to latest LTS
node --version

# Check for large files in src/
find src -type f -size +5M

# Clear Vite cache
rm -rf node_modules/.vite
```

---

### Authentication Issues

#### ❌ "Invalid credentials" on login
**Problem**: Wrong email/password or user doesn't exist

**Solution**:
```bash
# Verify Supabase credentials in .env.local
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test in Supabase Dashboard:
# 1. Go to Authentication → Users
# 2. Check if user exists
# 3. Reset password if needed

# If VITE_BYPASS_AUTH=true, use demo account:
# Email: demo@clickhub.local
# Password: demo123456
```

#### ❌ "Supabase URL or key is missing"
**Problem**: Environment variables not loaded

**Solution**:
1. Check `.env.local` file exists
2. Verify variables are correct:
   ```bash
   grep VITE_SUPABASE .env.local
   ```
3. Restart dev server
4. Check browser console: DevTools → Console tab

#### ❌ "Session expired" or "401 Unauthorized"
**Problem**: JWT token expired

**Solution**:
```bash
# Logout and login again
# Or refresh browser

# Check browser localStorage:
# DevTools → Storage → localStorage
# Look for supabase.auth.token
```

---

### Database & Supabase Issues

#### ❌ "Database connection error"
**Problem**: Cannot connect to Supabase

**Solution**:
```bash
# 1. Verify Supabase project is active
#    Go to supabase.com/dashboard
#    Check project status

# 2. Check internet connectivity
#    ping google.com

# 3. Verify credentials in .env.local
#    VITE_SUPABASE_URL should be:
#    https://[project-id].supabase.co

# 4. Check CORS settings
#    Supabase → Settings → API
#    Verify allowed origins
```

#### ❌ "Table does not exist"
**Problem**: Database tables not created

**Solution**:
1. Go to Supabase Dashboard
2. Check SQL Editor → Tables
3. If tables missing, run migrations or manual SQL
4. Restart application

#### ❌ "RLS policy violation"
**Problem**: Row-Level Security blocking query

**Solution**:
```bash
# 1. Check user role in database
#    SELECT * FROM users WHERE id = 'your-id';

# 2. Review RLS policies
#    Supabase → Authentication → Policies

# 3. Verify role matches policy requirements

# 4. Contact admin if permissions wrong
```

---

### UI/Frontend Issues

#### ❌ Styles not applying (Tailwind CSS)
**Problem**: Tailwind classes not working

**Solution**:
```bash
# 1. Restart dev server
npm run dev

# 2. Clear browser cache
#    DevTools → Storage → Clear Site Data

# 3. Check tailwind.config.js
#    Verify content paths are correct

# 4. Rebuild CSS
#    Dev server rebuilds on file change
```

#### ❌ Modal/Dialog not closing
**Problem**: Modal state stuck in Zustand

**Solution**:
```bash
# 1. Refresh page
#    Ctrl+R or Cmd+R

# 2. Check browser console for errors
#    DevTools → Console

# 3. Reset state in DevTools console:
window.useStore.getState().toggleTaskModal(false);

# 4. Hard refresh
#    Ctrl+Shift+R (Windows/Linux)
#    Cmd+Shift+R (macOS)
```

#### ❌ Icons not showing (Lucide React)
**Problem**: Icon imports or rendering issue

**Solution**:
```bash
# 1. Check icon name spelling
#    Reference: https://lucide.dev

# 2. Verify import statement
#    import { IconName } from 'lucide-react';

# 3. Restart dev server
#    Changes to icon imports need rebuild
```

#### ❌ Theme not switching
**Problem**: Theme toggle not working

**Solution**:
```bash
# 1. Check data-theme attribute on HTML
#    DevTools → Inspector → <html> element

# 2. Verify CSS variables are set
#    Inspect → Styles → :root variables

# 3. Reset in store
window.useStore.getState().setTheme('light');

# 4. Check browser localStorage
#    DevTools → Storage → localStorage
```

---

### Build & Production Issues

#### ❌ "Build fails" / "npm run build" error
**Problem**: TypeScript or build configuration error

**Solution**:
```bash
# 1. Check TypeScript errors
npx tsc --noEmit

# 2. Build with verbose output
npm run build -- --debug

# 3. Check vite.config.ts
#    Ensure all plugins are correct

# 4. Clear cache and retry
rm -rf dist node_modules/.vite
npm run build
```

#### ❌ "Cannot find file after build"
**Problem**: dist/ directory not created

**Solution**:
```bash
# Check if build completed
ls -la dist/

# Rebuild if needed
rm -rf dist
npm run build

# Verify output file
ls -lh dist/index.html
```

#### ❌ "App doesn't work after deployment"
**Problem**: Environment or routing issue

**Solution**:
1. Check environment variables on server
2. Verify API URLs are correct
3. Check browser console for errors (F12)
4. Review deployment logs
5. Test locally first: `npm run preview`

---

### Offline Sync Issues

#### ❌ "Data not syncing when online"
**Problem**: Sync queue stuck

**Solution**:
```bash
# 1. Check sync status indicator in Header
#    Should show "Synced" when online

# 2. Manually trigger sync
window.useStore.getState().processSyncQueue();

# 3. Check browser console for errors

# 4. Review failed sync queue
window.useStore.getState().failedSyncQueue

# 5. Reload page
window.location.reload();
```

#### ❌ "Failed operations stack up"
**Problem**: Sync failures accumulating

**Solution**:
1. Go to Settings → Data tab
2. Review failed operations
3. Check "Retry All" or select individual items
4. Verify Supabase is accessible
5. Check network connectivity

---

### Chat Widget Issues

#### ❌ "Chat widget not showing"
**Problem**: Chat not rendering

**Solution**:
```bash
# 1. Check if VITE_ENABLE_CHAT=true
grep VITE_ENABLE_CHAT .env.local

# 2. Verify chat tables exist in Supabase

# 3. Check browser console for errors

# 4. Reload page
```

#### ❌ "Messages not sending"
**Problem**: Chat message submission fails

**Solution**:
```bash
# 1. Check network tab in DevTools
#    See if request is being sent

# 2. Check Supabase database
#    Verify message was saved

# 3. Check user permissions
#    Verify user has chat role

# 4. Check file upload size
#    File too large? Reduce size
```

---

### Performance Issues

#### ❌ "App is slow / sluggish"
**Problem**: Performance degradation

**Solution**:
```bash
# 1. Check DevTools Performance
#    DevTools → Performance → Record

# 2. Monitor memory usage
#    Task Manager / Activity Monitor

# 3. Check network requests
#    DevTools → Network tab

# 4. Reduce data in view
#    Use pagination or filters

# 5. Clear cache
#    DevTools → Storage → Clear Site Data
```

#### ❌ "Large file uploads fail"
**Problem**: File too large or timeout

**Solution**:
```bash
# 1. Check file size limits
#    Supabase Storage settings

# 2. Use smaller files
#    Compress before upload

# 3. Check network speed
#    Use upload test: speedtest.net

# 4. Retry upload
#    Sometimes timeout is temporary
```

---

## 🔍 Debugging Tips

### Browser DevTools

```bash
# Open DevTools
F12 (Windows/Linux)
Cmd+Option+I (macOS)

# Useful tabs:
# - Console: View logs and errors
# - Network: Monitor API calls
# - Storage: Check localStorage, sessionStorage
# - Application: PWA, Service Worker
# - Performance: Profile app speed
```

### Check Store State

```javascript
// In browser console
window.useStore.getState()  // View all state

// Check specific values
window.useStore.getState().currentUser
window.useStore.getState().tasks
window.useStore.getState().isSyncing

// Update state directly (for testing)
window.useStore.getState().setTheme('dark')
```

### Network Debugging

```bash
# Monitor network requests
# DevTools → Network → XHR
# Look for failed requests (red)

# Check request details
# Click request → Headers, Preview, Response

# Check status codes
# 200 = OK
# 401 = Unauthorized
# 404 = Not Found
# 500 = Server Error
```

### Console Logs

```javascript
// Add in code to debug
console.log('Debug:', value);
console.warn('Warning:', issue);
console.error('Error:', error);

// View in DevTools → Console tab
```

---

## 📞 Getting Help

If issue persists:

1. **Check Documentation**
   - [README.md](./README.md)
   - [GETTING_STARTED.md](./GETTING_STARTED.md)
   - [ARCHITECTURE.md](./ARCHITECTURE.md)

2. **Search GitHub Issues**
   - Similar issues may be solved
   - https://github.com/ariffend1/clickhub/issues

3. **Create New Issue**
   - Include error message
   - Share steps to reproduce
   - Provide environment info

4. **Contact Support**
   - Email: contact@clickhub.local
   - Discord: [Link]

---

**Last Updated**: June 2026

*Contributions welcome! Found a solution? Add it here!*