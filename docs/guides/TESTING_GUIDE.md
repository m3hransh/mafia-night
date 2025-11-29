# Frontend Testing Guide with TypeScript

## Overview

This guide covers testing React components with TypeScript, Jest, and React Testing Library.

---

## Setup

### Installed Packages

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",      // Custom Jest matchers
    "@testing-library/react": "^16.3.0",        // React testing utilities
    "@testing-library/user-event": "^14.6.1",   // User interaction simulation
    "@types/jest": "^30.0.0",                    // TypeScript types for Jest
    "@types/testing-library__jest-dom": "^5.14.9", // Types for jest-dom
    "jest": "^30.2.0",                           // Test runner
    "jest-environment-jsdom": "^30.2.0"          // DOM environment
  }
}
```

### Configuration Files

#### `jest.config.js`
```js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{spec,test}.{ts,tsx}',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

#### `jest.setup.ts`
```ts
import '@testing-library/jest-dom'
```

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"],
    // ... other options
  },
  "include": [
    "jest.setup.ts",
    // ... other files
  ]
}
```

---

## Writing Tests

### Basic Component Test

```tsx
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

function Button({ children }: { children: React.ReactNode }) {
  return <button>{children}</button>
}

describe('Button Component', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    
    // TypeScript knows about these matchers!
    expect(button).toBeInTheDocument()
    expect(button).toBeVisible()
  })
})
```

### Testing User Interactions

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function Counter() {
  const [count, setCount] = React.useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

describe('Counter', () => {
  it('should increment on button click', async () => {
    const user = userEvent.setup()
    render(<Counter />)
    
    const button = screen.getByRole('button', { name: /increment/i })
    
    expect(screen.getByText('Count: 0')).toBeInTheDocument()
    
    await user.click(button)
    
    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })
})
```

### Testing Async Components

```tsx
import { render, screen } from '@testing-library/react'

function AsyncComponent() {
  const [data, setData] = React.useState<string | null>(null)
  
  React.useEffect(() => {
    setTimeout(() => setData('Loaded!'), 100)
  }, [])
  
  return data ? <div>{data}</div> : <div>Loading...</div>
}

describe('AsyncComponent', () => {
  it('should display loading then data', async () => {
    render(<AsyncComponent />)
    
    // Initially loading
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    // Wait for data to appear
    const dataElement = await screen.findByText('Loaded!')
    expect(dataElement).toBeInTheDocument()
  })
})
```

---

## Query Methods

### getBy* (Throws if not found)
```tsx
const button = screen.getByRole('button')           // HTMLElement
const heading = screen.getByRole('heading')         // HTMLElement
const text = screen.getByText(/hello/i)             // HTMLElement
const input = screen.getByLabelText('Username')     // HTMLElement
const element = screen.getByTestId('custom-element') // HTMLElement
```

### queryBy* (Returns null if not found)
```tsx
const button = screen.queryByRole('button')   // HTMLElement | null
const text = screen.queryByText(/hello/i)     // HTMLElement | null

// Good for asserting absence
expect(screen.queryByRole('button')).not.toBeInTheDocument()
```

### findBy* (Async, waits for element)
```tsx
// Returns a Promise!
const button = await screen.findByRole('button')     // Promise<HTMLElement>
const text = await screen.findByText(/loaded/i)     // Promise<HTMLElement>
```

### getAllBy*, queryAllBy*, findAllBy*
```tsx
const buttons = screen.getAllByRole('button')     // HTMLElement[]
const items = screen.queryAllByRole('listitem')   // HTMLElement[]
const divs = await screen.findAllByTestId('div')  // Promise<HTMLElement[]>
```

---

## Jest-DOM Matchers

All these matchers are fully typed thanks to `@testing-library/jest-dom`:

```tsx
// Presence
expect(element).toBeInTheDocument()
expect(element).not.toBeInTheDocument()

// Visibility
expect(element).toBeVisible()
expect(element).not.toBeVisible()
expect(element).toBeEmptyDOMElement()

// Attributes
expect(element).toHaveAttribute('href', '/home')
expect(element).toHaveClass('btn', 'btn-primary')
expect(element).toHaveStyle({ color: 'red' })

// Text content
expect(element).toHaveTextContent('Hello')
expect(element).toHaveTextContent(/hello/i)

// Form elements
expect(input).toHaveValue('John')
expect(input).toBeDisabled()
expect(input).toBeEnabled()
expect(checkbox).toBeChecked()
expect(input).toBeRequired()

// Focus
expect(input).toHaveFocus()
```

---

## TypeScript Features

### Typed Queries

```tsx
// TypeScript infers correct types
const button: HTMLElement = screen.getByRole('button')
const input: HTMLElement = screen.getByRole('textbox')

// Can be more specific
const button = screen.getByRole('button') as HTMLButtonElement
const input = screen.getByRole('textbox') as HTMLInputElement

// Use input-specific properties
input.value = 'test'
```

### Typed Props

```tsx
interface ButtonProps {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

function Button({ onClick, disabled, children }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

describe('Button', () => {
  it('should handle props correctly', () => {
    const handleClick = jest.fn()
    
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    )
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
```

### Typed Mock Functions

```tsx
// Typed mock function
const handleSubmit = jest.fn<void, [string]>()

// TypeScript knows the signature
handleSubmit('test')  // ✅ OK
handleSubmit(123)     // ❌ Type error

// Assertions
expect(handleSubmit).toHaveBeenCalledWith('test')
```

---

## Common Patterns

### Testing Forms

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function LoginForm({ onSubmit }: { onSubmit: (data: { username: string; password: string }) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    onSubmit({
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="username">Username</label>
      <input id="username" name="username" />
      
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" />
      
      <button type="submit">Login</button>
    </form>
  )
}

describe('LoginForm', () => {
  it('should submit form data', async () => {
    const handleSubmit = jest.fn()
    const user = userEvent.setup()
    
    render(<LoginForm onSubmit={handleSubmit} />)
    
    await user.type(screen.getByLabelText('Username'), 'john')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: /login/i }))
    
    expect(handleSubmit).toHaveBeenCalledWith({
      username: 'john',
      password: 'secret',
    })
  })
})
```

### Testing with Context

```tsx
import { render, screen } from '@testing-library/react'

const ThemeContext = React.createContext<'light' | 'dark'>('light')

function ThemedButton() {
  const theme = React.useContext(ThemeContext)
  return <button className={theme}>Themed</button>
}

describe('ThemedButton', () => {
  it('should use theme from context', () => {
    render(
      <ThemeContext.Provider value="dark">
        <ThemedButton />
      </ThemeContext.Provider>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('dark')
  })
})
```

### Custom Render with Providers

```tsx
import { render, RenderOptions } from '@testing-library/react'

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
```

---

## Commands

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- sample.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

---

## File Structure

```
frontend/
├── __tests__/              # Test files
│   ├── page.test.tsx
│   └── sample.test.tsx
├── components/             # Components
│   └── Button.tsx
├── jest.config.js          # Jest configuration
├── jest.setup.ts           # Jest setup (imports jest-dom)
├── types/
│   └── jest.d.ts          # Custom type declarations
└── tsconfig.json          # TypeScript config (includes types)
```

---

## Best Practices

### ✅ DO

- Use `getByRole` when possible (most accessible)
- Use `userEvent` for interactions (more realistic)
- Test user behavior, not implementation
- Keep tests simple and focused
- Use `findBy*` for async operations
- Type your components and props

### ❌ DON'T

- Don't use `getByTestId` unless necessary
- Don't test implementation details
- Don't use `wait` or arbitrary timeouts
- Don't query by class names or IDs
- Don't make tests depend on each other

---

## Debugging Tests

```tsx
import { render, screen } from '@testing-library/react'

it('debug example', () => {
  const { debug } = render(<Component />)
  
  // Print entire DOM
  screen.debug()
  
  // Print specific element
  const button = screen.getByRole('button')
  screen.debug(button)
  
  // Or use the returned debug
  debug()
})
```

---

## TypeScript Tips

### Type Assertions

```tsx
// When you need specific element types
const button = screen.getByRole('button') as HTMLButtonElement
const input = screen.getByRole('textbox') as HTMLInputElement

// Now you can access element-specific properties
console.log(button.disabled)
console.log(input.value)
```

### Generic Props

```tsx
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>
}

describe('List', () => {
  it('should render items', () => {
    render(
      <List
        items={[1, 2, 3]}
        renderItem={(n) => <li key={n}>{n}</li>}
      />
    )
    
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
```

---

## Resources

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [User Event API](https://testing-library.com/docs/user-event/intro)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Playground](https://testing-playground.com/)

---

**Happy Testing! 🧪✅**
