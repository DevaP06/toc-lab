import React, { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { LucideIcon } from "lucide-react"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
  defaultActive?: string
}

export function AnimeNavBar({ items, className, defaultActive = "Home" }: NavBarProps) {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<string>(defaultActive)

  useEffect(() => {
    const currentPath = location.pathname
    const matched = items.find(i => currentPath.startsWith(i.url) && i.url !== "/") || items.find(i => i.url === currentPath)
    setActiveTab(matched ? matched.name : defaultActive)
  }, [location.pathname, items, defaultActive])

  return (
    <>
      <style>{`
        @keyframes spinLogo {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <nav
        className={className}
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px 8px 18px",
          background: "rgba(18,25,35,0.82)",
          backdropFilter: "blur(24px) saturate(1.2)",
          border: "1px solid rgba(31,59,115,0.45)",
          borderRadius: 999,
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.6)",
        }}
      >
        <Link
          to="/"
          onClick={() => setActiveTab(defaultActive)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingRight: 16,
            borderRight: "1px solid rgba(31,59,115,0.55)",
            textDecoration: "none",
            color: "#E6F1FF",
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              display: "inline-block",
              background: "conic-gradient(from 220deg, #00F5C4, #7CFFB2, #1F3B73, #00F5C4)",
              animation: "spinLogo 8s linear infinite",
            }}
          />
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: -0.3 }}>TOC Lab</span>
        </Link>

        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name
          return (
            <Link
              key={item.name}
              to={item.url}
              onClick={() => setActiveTab(item.name)}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? "#E6F1FF" : "#7A8CA3",
                background: isActive ? "rgba(0,245,196,0.14)" : "transparent",
                transition: "all 220ms",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden" aria-label={item.name}>
                <Icon size={16} strokeWidth={2.2} />
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
