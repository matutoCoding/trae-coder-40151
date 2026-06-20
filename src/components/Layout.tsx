import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Bell, Crown, Calendar, Stethoscope, ShieldCheck, Cross, Settings } from 'lucide-react'

const tabs = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/queue', label: '叫号', icon: Bell },
  { path: '/priority', label: '优先', icon: Crown },
  { path: '/schedule', label: '排期', icon: Calendar },
  { path: '/followups', label: '复诊', icon: Stethoscope },
  { path: '/conflict', label: '校验', icon: ShieldCheck },
  { path: '/chairs', label: '设置', icon: Settings },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = tabs.find((tab) => {
    if (tab.path === '/') return location.pathname === '/'
    return location.pathname.startsWith(tab.path)
  })

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-center h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Cross className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">
              口腔诊所智能叫号系统
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--color-border)] shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => {
            const isActive = activeTab?.path === tab.path
            const Icon = tab.icon
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors duration-200 ${
                  isActive
                    ? 'text-primary'
                    : 'text-[var(--color-text-secondary)] hover:text-primary-light'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
