import { Component } from 'react'

/**
 * Without this, one unexpected error anywhere leaves a white screen with no way
 * back - on a phone, in a boiler room, that looks like the app is simply gone.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error, info) { console.error('נפילה לא צפויה:', error, info) }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-brand px-6 text-center">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
          <div className="text-5xl">😕</div>
          <h1 className="text-xl font-extrabold mt-3">משהו השתבש</h1>
          <p className="text-slate-500 mt-2">הנתונים שלכם בטוחים. אפשר לחזור למסך הבית ולנסות שוב.</p>
          <button type="button" onClick={() => { window.location.href = '/' }}
            className="mt-5 w-full min-h-14 rounded-2xl bg-accent text-white text-lg font-bold">
            חזרה למסך הבית
          </button>
          <details className="mt-4 text-right">
            <summary className="text-xs text-slate-400 cursor-pointer">פרטים טכניים</summary>
            <pre dir="ltr" className="mt-2 text-[10px] text-slate-500 whitespace-pre-wrap break-words">
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
