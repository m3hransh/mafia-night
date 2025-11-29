import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the application title', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /Mafia Night/i })
    expect(heading).toBeInTheDocument()
  })

  it('renders the application description', () => {
    render(<Home />)
    const description = screen.getByText(/Web application for managing physical Mafia games/i)
    expect(description).toBeInTheDocument()
  })
})
