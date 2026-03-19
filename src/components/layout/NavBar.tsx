import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router'
import { Avatar } from '../ui/Avatar'

interface NavItem {
  label: string
  to: string
}

const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/demos/product-card' },
  { label: 'Profiles', to: '/demos/user-profile' },
  { label: 'Dashboard', to: '/demos/dashboard' },
  { label: 'Settings', to: '/demos/settings' },
  { label: 'Analytics', to: '/demos/analytics' },
]

const currentUser = {
  name: 'Alex Rivera',
  username: 'alexrivera',
  avatarUrl: 'https://i.pravatar.cc/256?u=alexrivera',
  email: 'alex@example.com',
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDropdownOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-shadow duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      } border-b border-gray-200 bg-white/95 backdrop-blur-md`}
    >
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
        {/* Logo */}
        <NavLink to="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-sm font-bold text-white">CD</span>
          </div>
          <span className="hidden text-lg font-bold text-gray-900 sm:block">
            ComponentKit
          </span>
        </NavLink>

        {/* Desktop nav links */}
        <nav aria-label="Main navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Search bar — desktop */}
        <div className="ml-auto hidden max-w-xs flex-1 md:block">
          <label htmlFor="desktop-search" className="sr-only">
            Search components
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="desktop-search"
              type="search"
              placeholder="Search components..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>
        </div>

        {/* User profile dropdown — desktop */}
        <div ref={dropdownRef} className="relative hidden md:block">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            aria-label="User menu"
            className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="sm" />
            <span className="hidden text-sm font-medium text-gray-700 lg:block">
              {currentUser.name}
            </span>
            <svg className={`hidden h-4 w-4 text-gray-500 transition-transform duration-200 lg:block ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Dropdown menu */}
          <div
            className={`absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-gray-200 bg-white py-1 shadow-lg transition-all duration-200 ${
              dropdownOpen
                ? 'scale-100 opacity-100'
                : 'pointer-events-none scale-95 opacity-0'
            }`}
            role="menu"
            aria-label="User menu"
          >
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
            {['Your Profile', 'Settings', 'Help Center'].map((item) => (
              <button
                key={item}
                role="menuitem"
                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                onClick={() => setDropdownOpen(false)}
              >
                {item}
              </button>
            ))}
            <div className="border-t border-gray-100">
              <button
                role="menuitem"
                className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                onClick={() => setDropdownOpen(false)}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Mobile hamburger */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="cursor-pointer rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
          >
            {mobileOpen ? (
              <CloseIcon className="h-6 w-6" />
            ) : (
              <HamburgerIcon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        className={`overflow-hidden border-t border-gray-200 bg-white transition-all duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'max-h-screen' : 'max-h-0 border-t-0'
        }`}
      >
        <div className="space-y-4 px-4 py-4">
          {/* Mobile search */}
          <label htmlFor="mobile-search" className="sr-only">
            Search components
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="mobile-search"
              type="search"
              placeholder="Search components..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-3 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:outline-none"
            />
          </div>

          {/* Mobile nav links */}
          <nav aria-label="Mobile navigation">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile user section */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3 px-3 pb-3">
              <Avatar src={currentUser.avatarUrl} alt={currentUser.name} size="sm" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500">{currentUser.email}</p>
              </div>
            </div>
            {['Your Profile', 'Settings', 'Help Center'].map((item) => (
              <button
                key={item}
                className="block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-gray-600 transition-colors hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {item}
              </button>
            ))}
            <button
              className="block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              onClick={() => setMobileOpen(false)}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
