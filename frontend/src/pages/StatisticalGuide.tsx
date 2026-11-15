import { useLayoutEffect, useRef } from 'react'
import originalGuide from '../../Highstudent Guide.html?raw'
import { MathJaxRegion } from '../services/mathjax'
import './statistical-guide.css'

function extractGuideContent(source: string) {
  const contentStart = source.indexOf('<div class="wrap">')
  const scriptStart = source.lastIndexOf('<script>')
  const scriptEnd = source.lastIndexOf('</script>')
  if (contentStart < 0 || scriptStart < contentStart || scriptEnd < scriptStart) {
    throw new Error('The original Highstudent Guide document is missing its content or interactive examples.')
  }

  const markup = source.slice(contentStart, scriptStart).trim()
    .replace('<main>', '<div class="guide-main">')
    .replace('</main>', '</div>')
    .replace(
      '(the test statistic \\(Z\\); if \\(H_0\\) is true, results follow this bell curve)',
      '(the test statistic <span class="math inline">\\(Z\\)</span>; if <span class="math inline">\\(H_0\\)</span> is true, results follow this bell curve)',
    )
  const script = source.slice(scriptStart + '<script>'.length, scriptEnd)
  return { markup, script }
}

const guideContent = extractGuideContent(originalGuide)
const guideScriptStart = "const $=s=>document.querySelector(s),NS="

export default function StatisticalGuide() {
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return

    const scriptStart = guideContent.script.indexOf(guideScriptStart)
    if (scriptStart < 0) {
      throw new Error('The original guide examples could not be safely initialized.')
    }

    const script = document.createElement('script')
    const scopedScript = guideContent.script.replace(
      guideScriptStart,
      'const root=document.currentScript?.parentElement;const $=s=>root?.querySelector(s),NS=',
    )
    script.textContent = `(() => {${scopedScript}\n})()`
    content.appendChild(script)
    return () => script.remove()
  }, [])

  return (
    <section className="guide-shell" aria-label="Highstudent statistical guide">
      <MathJaxRegion className="guide-typeset-region" contentVersion="highstudent-guide-v1">
        <div
          ref={contentRef}
          className="guide-content"
          dangerouslySetInnerHTML={{ __html: guideContent.markup }}
        />
      </MathJaxRegion>
    </section>
  )
}
