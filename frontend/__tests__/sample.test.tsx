import React, { useState, useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Sample component for testing
function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick}>{children}</button>
}

describe('Sample Test with TypeScript', () => {
  it('should render button with text', () => {
    render(<Button onClick={() => {}}>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    
    // TypeScript knows about jest-dom matchers
    expect(button).toBeInTheDocument()
    expect(button).toBeVisible()
  })

  it('should handle click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should have proper types for queries', () => {
    render(<Button onClick={() => {}}>Test</Button>)
    
    // TypeScript knows the return types
    const button: HTMLElement = screen.getByRole('button')
    const buttonOrNull: HTMLElement | null = screen.queryByRole('button')
    
    expect(button).toHaveTextContent('Test')
    expect(buttonOrNull).not.toBeNull()
  })
})

// Test async operations
describe('Async Testing', () => {
  it('should wait for elements to appear', async () => {
    function AsyncComponent() {
      const [show, setShow] = useState(false)
      
      useEffect(() => {
        setTimeout(() => setShow(true), 100)
      }, [])
      
      return show ? <div>Loaded!</div> : <div>Loading...</div>
    }
    
    render(<AsyncComponent />)
    
    // findBy* methods return promises (TypeScript knows this!)
    const element = await screen.findByText('Loaded!')
    expect(element).toBeInTheDocument()
  })
})

// Test with proper TypeScript types
describe('TypeScript Types', () => {
  it('should have type-safe custom matchers', () => {
    render(<div data-testid="test-div">Content</div>)
    
    const element = screen.getByTestId('test-div')
    
    // All these matchers are typed thanks to @testing-library/jest-dom
    expect(element).toBeInTheDocument()
    expect(element).toBeVisible()
    expect(element).toHaveTextContent('Content')
    expect(element).not.toBeDisabled()
    expect(element).not.toBeEmptyDOMElement()
  })
})
