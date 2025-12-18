import { render, screen } from '@testing-library/react'
import RolesPage from '@/app/roles/page'

describe('Roles Page', () => {
  it('renders the page title', () => {
    render(<RolesPage />)
    const heading = screen.getByRole('heading', { name: /Role Cards/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the role selector description', () => {
    render(<RolesPage />)
    const description = screen.getByText(/Select a Role to View/i)
    expect(description).toBeInTheDocument()
  })

  it('renders role cards', () => {
    render(<RolesPage />)
    // Check for some of the role names
    expect(screen.getByText('Sherlock')).toBeInTheDocument()
    expect(screen.getByText('Mafia')).toBeInTheDocument()
    expect(screen.getByText('Doctor Watson')).toBeInTheDocument()
  })

  it('renders back to home link', () => {
    render(<RolesPage />)
    const homeLink = screen.getByRole('link', { name: /Home/i })
    expect(homeLink).toBeInTheDocument()
  })

  it('renders all 30 role cards', () => {
    render(<RolesPage />)
    const roleCards = screen.getAllByText(/View Card/i)
    expect(roleCards).toHaveLength(30)
  })
})
