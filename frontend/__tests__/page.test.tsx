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

  it('renders links to view role cards', () => {
    render(<Home />)
    const links = screen.getAllByRole('link', { name: /View Role Cards|Browse Roles/i })
    expect(links.length).toBeGreaterThan(0)
  })

  it('displays the total number of roles', () => {
    render(<Home />)
    expect(screen.getByText(/30 unique roles/i)).toBeInTheDocument()
  })
})
