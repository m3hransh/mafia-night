import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the application title', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /Mafia Night/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the role selector description', () => {
    render(<Home />)
    const description = screen.getByText(/Select a Role Card/i)
    expect(description).toBeInTheDocument()
  })

  it('renders role cards', () => {
    render(<Home />)
    // Check for some of the role names
    expect(screen.getByText('Sherlock')).toBeInTheDocument()
    expect(screen.getByText('Mafia')).toBeInTheDocument()
    expect(screen.getByText('Doctor Watson')).toBeInTheDocument()
  })
})
