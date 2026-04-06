import { useState, useEffect, useRef } from 'react'

// Auto-clears error after 5 seconds
export function useAutoError() {
  const [error, setErrorRaw] = useState('')
  const timerRef = useRef(null)

  const setError = (msg) => {
    setErrorRaw(msg)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (msg) {
      timerRef.current = setTimeout(() => setErrorRaw(''), 5000)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return [error, setError]
}