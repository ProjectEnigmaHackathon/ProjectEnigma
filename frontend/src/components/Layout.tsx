import React, { useState, useEffect } from 'react'
import { Settings, Menu, X, MessageCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const navigation = [
    {
      name: 'Chat',
      href: '/',
      icon: MessageCircle,
      current: location.pathname === '/'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      current: location.pathname === '/settings'
    }
  ]

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-gray-900"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 z-40 transition-transform duration-300',
          isMobile
            ? 'w-64 transform'
            : 'w-16',
          isMobile && !isMobileMenuOpen && '-translate-x-full'
        )}
      >
        <div className="mb-8">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          {isMobile && (
            <div className="mt-2 text-center">
              <h2 className="text-sm font-semibold text-gray-900">Project Enigma</h2>
            </div>
          )}
        </div>
        
        <nav className={clsx('flex flex-col space-y-2', isMobile ? 'w-full px-4' : '')}>
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={closeMobileMenu}
                className={clsx(
                  'flex items-center rounded-lg transition-colors',
                  isMobile
                    ? 'px-3 py-2 text-sm font-medium'
                    : 'p-2 justify-center',
                  item.current
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
                title={!isMobile ? item.name : undefined}
              >
                <Icon size={20} />
                {isMobile && (
                  <span className="ml-3">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer for mobile */}
        {isMobile && (
          <div className="mt-auto px-4 py-2 text-center">
            <p className="text-xs text-gray-500">
              AI-powered release automation
            </p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className={clsx(
        'min-h-screen transition-all duration-300',
        isMobile ? 'ml-0' : 'ml-16'
      )}>
        {/* Mobile header spacer */}
        {isMobile && <div className="h-16" />}
        {children}
      </div>
    </div>
  )
}

export default Layout