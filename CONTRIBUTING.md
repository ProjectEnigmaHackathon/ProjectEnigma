# Contributing to Project Enigma 🤝

Thank you for your interest in contributing to Project Enigma! This guide will help you get started with development and contributions.

## 🚀 Quick Start for Contributors

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/project-enigma.git
   cd project-enigma
   ```
3. **Set up development environment**
   ```bash
   .\scripts\dev-setup.ps1
   ```
4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-amazing-feature
   ```

## 📋 Development Guidelines

### Code Style

**Python (Backend):**
- Follow PEP 8 style guide
- Use type hints for all functions
- Format with `black` and `isort`
- Lint with `flake8` and `mypy`

**TypeScript (Frontend):**
- Follow TypeScript strict mode
- Use functional components with hooks
- Format with Prettier
- Lint with ESLint

### Running Quality Checks

```bash
# Backend
cd backend
black app/
isort app/
flake8 app/
mypy app/
pytest tests/

# Frontend
cd frontend
npm run lint:fix
npm run format
npm run type-check
npm test
```

### Commit Convention

We use conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

Example:
```bash
git commit -m "feat: add repository validation to settings page"
```

## 🧪 Testing

### Writing Tests

**Backend Tests:**
```python
# tests/test_example.py
import pytest
from app.core.config import get_settings

def test_settings_load():
    settings = get_settings()
    assert settings.app_name == "Project Enigma Backend"
```

**Frontend Tests:**
```typescript
// src/components/__tests__/Layout.test.tsx
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Layout from '../Layout'

test('renders layout with navigation', () => {
  render(
    <BrowserRouter>
      <Layout>Test Content</Layout>
    </BrowserRouter>
  )
  expect(screen.getByText('Test Content')).toBeInTheDocument()
})
```

### Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v
pytest tests/ --cov=app

# Frontend tests
cd frontend
npm test
npm run test:coverage

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 🏗️ Architecture Principles

### Backend Principles
- **Separation of Concerns**: Keep API routes, business logic, and data models separate
- **Type Safety**: Use Pydantic models for all data validation
- **Error Handling**: Implement proper exception handling with meaningful messages
- **Logging**: Use structured logging for debugging and monitoring

### Frontend Principles
- **Component Composition**: Build reusable, composable React components
- **State Management**: Use React hooks for local state, consider context for global state
- **Type Safety**: Use TypeScript interfaces for all props and API responses
- **Accessibility**: Follow WCAG guidelines for accessible UI components

### Workflow Principles
- **Node-based Design**: Each workflow step should be a discrete, testable node
- **Error Recovery**: Implement proper error handling and recovery mechanisms
- **State Persistence**: Maintain workflow state for resumability
- **Mock-first Development**: Support mock APIs for development and testing

## 📂 Project Structure Guide

```
project-enigma/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routes and endpoints
│   │   ├── core/         # Configuration, logging, utilities
│   │   ├── models/       # Pydantic models and schemas
│   │   ├── services/     # External API integrations
│   │   ├── workflows/    # LangGraph workflow definitions
│   │   └── utils/        # Helper functions
│   └── tests/            # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Page-level components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client functions
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
└── config/               # Application configuration
```

## 🎯 Contribution Areas

### High Priority
- **Workflow Nodes**: Implement LangGraph workflow steps
- **API Integrations**: Real JIRA, GitHub, Confluence integrations
- **Error Handling**: Comprehensive error recovery mechanisms
- **Testing**: Unit and integration test coverage

### Medium Priority
- **UI Components**: Enhanced chat interface components
- **Documentation**: API documentation and user guides
- **Performance**: Optimization for large repository sets
- **Security**: Authentication and authorization enhancements

### Good First Issues
- **Configuration**: Environment variable validation
- **Logging**: Structured logging improvements
- **UI Polish**: Styling and accessibility improvements
- **Documentation**: README and code comment improvements

## 🔍 Code Review Process

### Before Submitting PR
1. **Run all tests**: Ensure tests pass locally
2. **Code quality**: Run linting and formatting tools
3. **Type checking**: Ensure TypeScript/mypy passes
4. **Documentation**: Update relevant documentation
5. **Commit cleanup**: Squash/rewrite commits if needed

### PR Requirements
- **Descriptive title**: Use conventional commit format
- **Clear description**: Explain what changes and why
- **Tests included**: Add tests for new functionality
- **Documentation updated**: Update docs if needed
- **No merge conflicts**: Rebase on latest main if needed

### Review Criteria
- **Functionality**: Does it work as intended?
- **Code quality**: Is it clean, readable, and maintainable?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Testing**: Is it adequately tested?

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment information**
   - Operating system
   - Docker version
   - Node.js version (if applicable)
   - Python version (if applicable)

2. **Steps to reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots if applicable

3. **Error logs**
   - Backend logs: `docker-compose logs backend`
   - Frontend console errors
   - Network errors from browser dev tools

## 💡 Feature Requests

For new features:

1. **Check existing issues** first
2. **Describe the problem** you're trying to solve
3. **Propose a solution** with implementation details
4. **Consider alternatives** and trade-offs
5. **Provide use cases** and examples

## ❓ Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check README and code comments
- **Code Examples**: Look at existing implementations

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special recognition for outstanding contributions

Thank you for helping make Project Enigma better! 🎉