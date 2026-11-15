import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type MathJaxApi = {
  startup?: { promise?: Promise<unknown> }
  typesetPromise?: (elements?: HTMLElement[]) => Promise<void>
  typesetClear?: (elements?: HTMLElement[]) => void
  tex?: {
    inlineMath?: string[][]
    displayMath?: string[][]
  }
  svg?: { fontCache?: 'global' }
}

declare global {
  interface Window {
    MathJax?: MathJaxApi
  }
}

type MathJaxStatus = 'loading' | 'ready' | 'error'

const MathJaxContext = createContext<MathJaxStatus>('loading')
const MATHJAX_SCRIPT_ID = 'geoflex-mathjax-3-2-2'
const MATHJAX_SOURCE = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.min.js'

let mathJaxLoadPromise: Promise<void> | null = null
let typesetQueue: Promise<void> = Promise.resolve()

function verifyMathJax(): Promise<void> {
  const startup = window.MathJax?.startup?.promise
  return Promise.resolve(startup).then(() => {
    if (!window.MathJax?.typesetPromise || !window.MathJax.typesetClear) {
      throw new Error('The MathJax script loaded without its typesetting API.')
    }
  })
}

function loadMathJax(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('MathJax can only be initialized in a browser.'))
  }
  if (mathJaxLoadPromise) return mathJaxLoadPromise

  if (!window.MathJax) {
    window.MathJax = {
      tex: {
        inlineMath: [['\\(', '\\)']],
        displayMath: [['\\[', '\\]']],
      },
      svg: { fontCache: 'global' },
    }
  }

  if (window.MathJax.typesetPromise && window.MathJax.typesetClear) {
    mathJaxLoadPromise = verifyMathJax()
    return mathJaxLoadPromise
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script#${MATHJAX_SCRIPT_ID}, script[src="${MATHJAX_SOURCE}"]`,
  )
  const script = existingScript ?? document.createElement('script')

  mathJaxLoadPromise = new Promise<void>((resolve, reject) => {
    let settled = false
    const timeout = window.setTimeout(() => {
      finish(new Error('Timed out while loading MathJax. Check your internet connection and try again.'))
    }, 20000)

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
      if (error) reject(error)
      else resolve()
    }
    const onLoad = () => {
      void verifyMathJax().then(() => finish(), (error: unknown) => {
        finish(error instanceof Error ? error : new Error('MathJax initialization failed.'))
      })
    }
    const onError = () => finish(new Error('MathJax could not be downloaded. Check your internet connection and try again.'))

    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })

    if (window.MathJax?.typesetPromise && window.MathJax.typesetClear) {
      onLoad()
      return
    }

    if (!existingScript) {
      script.id = MATHJAX_SCRIPT_ID
      script.src = MATHJAX_SOURCE
      script.async = true
      document.head.appendChild(script)
    }
  }).catch((error: unknown) => {
    mathJaxLoadPromise = null
    throw error
  })

  return mathJaxLoadPromise
}

function enqueueTypesetJob(job: () => void | Promise<void>): Promise<void> {
  const result = typesetQueue.then(job, job)
  typesetQueue = result.then(() => undefined, () => undefined)
  return result
}

function replaceMathWithFallback(element: HTMLElement) {
  element.querySelectorAll<HTMLElement>('.math').forEach((formula) => {
    formula.textContent = 'Mathematical expression unavailable.'
    formula.setAttribute('aria-label', 'Mathematical expression unavailable.')
  })
}

export function MathJaxProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<MathJaxStatus>('loading')

  useEffect(() => {
    let active = true
    void loadMathJax().then(
      () => {
        if (active) setStatus('ready')
      },
      (error: unknown) => {
        console.error('MathJax failed to initialize.', error)
        if (active) setStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [])

  return <MathJaxContext.Provider value={status}>{children}</MathJaxContext.Provider>
}

export function MathJaxRegion({
  children,
  className,
  contentVersion,
}: {
  children: ReactNode
  className?: string
  contentVersion: string | number
}) {
  const status = useContext(MathJaxContext)
  const regionRef = useRef<HTMLDivElement>(null)
  const [renderError, setRenderError] = useState(false)
  const [typesetVersion, setTypesetVersion] = useState<string | number | null>(null)

  useEffect(() => {
    const element = regionRef.current
    if (!element) return

    if (status === 'error') {
      replaceMathWithFallback(element)
      return
    }
    if (status !== 'ready') return

    let active = true
    void enqueueTypesetJob(async () => {
      if (!element.isConnected) return
      const mathJax = window.MathJax
      if (!mathJax?.typesetPromise || !mathJax.typesetClear) {
        throw new Error('MathJax is not ready to render this content.')
      }
      mathJax.typesetClear([element])
      await mathJax.typesetPromise([element])
    }).then(
      () => {
        if (active) {
          setTypesetVersion(contentVersion)
        } else {
          void enqueueTypesetJob(() => window.MathJax?.typesetClear?.([element]))
        }
      },
      (error: unknown) => {
        console.error('MathJax failed to render mathematical content.', error)
        if (active) {
          replaceMathWithFallback(element)
          setRenderError(true)
        }
      },
    )

    return () => {
      active = false
      void enqueueTypesetJob(() => window.MathJax?.typesetClear?.([element])).catch((error: unknown) => {
        console.error('MathJax failed to clear rendered content.', error)
      })
    }
  }, [contentVersion, status])

  const mathPending =
    !renderError &&
    status !== 'error' &&
    (status === 'loading' || typesetVersion !== contentVersion)

  return (
    <div ref={regionRef} className={className} data-math-pending={mathPending}>
      {(renderError || status === 'error') && (
        <p className="mathjax-fallback" role="alert">
          Mathematical expressions could not be displayed. Reconnect and reload this guide to try again.
        </p>
      )}
      {children}
    </div>
  )
}
