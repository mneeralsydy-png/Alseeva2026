'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    localStorage.removeItem('alshifa_auth')
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
              <AlertCircle className="w-8 h-8" style={{ color: '#dc2626' }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#1a5f4a' }}>
              حدث خطأ غير متوقع
            </h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              {this.state.error?.message || 'حدث خطأ أثناء تحميل الصفحة'}
            </p>
            <div className="p-3 rounded-lg text-left text-xs" style={{ backgroundColor: '#f3f4f6', color: '#9ca3af', direction: 'ltr' }}>
              <code>{this.state.error?.stack?.substring(0, 300)}</code>
            </div>
            <Button
              onClick={this.handleReset}
              className="gap-2"
              style={{
                background: 'linear-gradient(135deg, #d4af37, #f4d03f)',
                color: '#0d3d2e',
              }}
            >
              <RefreshCw className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
