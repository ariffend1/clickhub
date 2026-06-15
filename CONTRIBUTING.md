# Contributing to ClickHub

Thank you for considering contributing to ClickHub! This document provides guidelines and instructions for contributing.

## 🤝 Ways to Contribute

- 🐛 **Report Bugs** - Found an issue? Open a bug report
- ✨ **Suggest Features** - Have a great idea? Share it with us
- 📝 **Improve Documentation** - Help us make docs clearer
- 💻 **Submit Code** - Fix bugs or implement features
- 🎨 **Design** - Improve UI/UX

## 🚀 Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/clickhub.git
   cd clickhub
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or for bugfix
   git checkout -b fix/issue-description
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create `.env.local`** (copy from `.env.example`)
   ```bash
   cp .env.example .env.local
   # Edit with your Supabase credentials
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Commit Guidelines

We follow conventional commits for clear and organized git history.

### Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- **feat** - New feature
- **fix** - Bug fix
- **docs** - Documentation changes
- **style** - Code style changes (formatting, semicolons, etc)
- **refactor** - Code refactoring without feature changes
- **perf** - Performance improvements
- **test** - Adding or updating tests
- **chore** - Build process, dependencies, tooling

### Examples:
```bash
git commit -m "feat(tasks): add drag-and-drop reordering"
git commit -m "fix(auth): resolve login timeout issue"
git commit -m "docs(readme): update installation steps"
git commit -m "style(components): format code with prettier"
```

## 🎨 Code Style

### General Rules
- Use **TypeScript** - Always add proper types
- Use **Prettier** - Auto-format code
- Use **ESLint** - Follow linting rules
- Use **Tailwind CSS** - For styling

### File Naming
- **Components**: `PascalCase.tsx` (e.g., `TaskBoard.tsx`)
- **Utils**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Types**: in `types/index.ts`
- **Stores**: in `store/` directory

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { useStore } from '@/store/useStore';

// 2. Types/Interfaces (if component-specific)
interface ComponentProps {
  title: string;
  onClose: () => void;
}

// 3. Component Definition
export default function MyComponent({ title, onClose }: ComponentProps) {
  const state = useStore((s) => s.someState);
  const [local, setLocal] = useState('');

  // 4. Logic
  const handleAction = () => {
    // ...
  };

  // 5. Render
  return (
    <div className="flex items-center">
      <h1>{title}</h1>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## 🧪 Testing

- Write tests for critical functionality
- Run tests before submitting PR: `npm run test` (if available)
- Use descriptive test names

## 📤 Pull Request Process

1. **Update your branch with latest main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Go to GitHub and create PR
   - Fill out the PR template completely
   - Reference related issues (e.g., "Closes #123")

### PR Title Format
```
[feat] Add task drag-and-drop support
[fix] Fix login timeout issue
[docs] Update README installation steps
```

### PR Checklist
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No console errors/warnings
- [ ] Changes tested locally
- [ ] Commit messages are clear
- [ ] Related issues are referenced

## 🐛 Bug Reports

### Include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/environment info
- Screenshots if applicable

### Template:
```markdown
**Description:** Clear description

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:** What should happen

**Actual Behavior:** What actually happens

**Environment:**
- OS: Windows 10 / macOS / Linux
- Browser: Chrome / Firefox / Safari
- Node version: 18.x
```

## ✨ Feature Requests

### Include:
- Clear problem/use case
- Proposed solution
- Alternative solutions
- Additional context

### Template:
```markdown
**Problem:** What problem does this solve?

**Proposed Solution:** How should it work?

**Alternative Solutions:** Other approaches?

**Use Case:** Real-world example
```

## 📚 Development Tips

### Useful Commands
```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

### Debugging
- Use browser DevTools
- Check Zustand state: `window.useStore.getState()`
- Enable debug logs in console

### Common Issues
- **Supabase connection error**: Check `.env.local` credentials
- **Module not found**: Run `npm install`
- **Type errors**: Ensure all TypeScript types are correct

## 📖 Documentation

If adding features, update:
- `README.md` - Add feature description
- `CHANGELOG.md` - Log changes
- Inline code comments - Explain complex logic
- Type documentation - JSDoc comments

## 🎯 Project Structure

When adding features:
1. **New component** → `src/components/[category]/`
2. **New type** → `src/types/index.ts`
3. **New store action** → `src/store/useStore.ts`
4. **New utility** → `src/utils/[name].ts`

## 💬 Communication

- Ask questions via GitHub Discussions
- Report security issues privately
- Be respectful and inclusive
- Follow CODE_OF_CONDUCT.md

## 🙏 Recognition

All contributors will be recognized in:
- Commit history
- Pull request credits
- Future contributor list

## 📋 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code.

---

**Thank you for contributing to ClickHub! Your efforts help make this project better. 🚀**