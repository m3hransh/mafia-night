import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the application title', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /Mafia Night/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the game description', () => {
    render(<Home />)
    const description = screen.getByText(/A social deduction game of mystery and deception/i)
    expect(description).toBeInTheDocument()
  })

  it('renders game action buttons', () => {
    render(<Home />)
    expect(screen.getByRole('link', { name: /Create Game/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Join Game/i })).toBeInTheDocument()
  })

  it('renders link to browse role cards', () => {
    render(<Home />)
    expect(screen.getByRole('link', { name: /Browse Role Cards/i })).toBeInTheDocument()
  })
})
