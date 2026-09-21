import { useEffect, useRef, useState } from 'react'

export default function UnlockModalPrototype() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        return
      }

      if (event.key !== 'Tab') return

      const modal = modalRef.current
      if (!modal) return

      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null)

      if (!focusable.length) {
        event.preventDefault()
        modal.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) triggerRef.current?.focus()
  }, [open])

  return (
    <main className="unlock-page">
      <div className="demo-stage">
        <p className="eyebrow">Interaction prototype</p>
        <h1>Unlock event</h1>
        <p className="intro">
          Preview the post-peel unlock moment. The modal delivers the mode information,
          while the particle burst marks the unlock itself.
        </p>

        <button ref={triggerRef} className="preview-btn" onClick={() => setOpen(true)}>
          Preview unlock
        </button>
      </div>

      {open && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false)
          }}
        >
          <div
            ref={modalRef}
            className="unlock-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mode-name"
            aria-describedby="mode-description"
            tabIndex={-1}
          >
            <div className="particles" aria-hidden="true">
              {Array.from({ length: 34 }, (_, index) => (
                <span
                  key={index}
                  className={index % 6 === 0 ? 'particle star' : 'particle'}
                  style={{
                    '--x': `${Math.cos((index / 34) * Math.PI * 2 + index * 0.17) * (95 + (index % 5) * 18)}px`,
                    '--y': `${Math.sin((index / 34) * Math.PI * 2 + index * 0.17) * (72 + (index % 7) * 16)}px`,
                    '--delay': `${(index % 8) * 18}ms`,
                    '--size': `${2 + (index % 3)}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            <div className="unlock-label">Mode unlocked</div>

            <h2 id="mode-name">Quickfire</h2>

            <div id="mode-description" className="mode-purpose">
              <strong>Build the habit.</strong>
              <p>
                A short, focused session designed to make showing up every day easier.
                Small sessions compound into serious preparation.
              </p>
            </div>

            <button ref={closeRef} className="got-it" onClick={() => setOpen(false)}>
              Got it →
            </button>
          </div>
        </div>
      )}

      <style>{`
        .unlock-page {
          --bg: #050B13;
          --text: #EEF4F8;
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px 16px;
          color: var(--text);
          background:
            radial-gradient(circle at 50% 25%, rgba(48, 190, 255, .13), transparent 34%),
            #050B13;
          font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .demo-stage {
          width: min(100%, 420px);
          text-align: center;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #42C8FF;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .demo-stage h1 {
          margin: 0;
          font-family: var(--font-geist-sans), Inter, sans-serif;
          font-size: 30px;
          line-height: 1.05;
          letter-spacing: -.035em;
        }

        .intro {
          max-width: 350px;
          margin: 10px auto 22px;
          color: #91A0B0;
          font-size: 13px;
          line-height: 1.6;
        }

        .preview-btn,
        .got-it {
          min-height: 46px;
          border: 0;
          border-radius: 12px;
          color: #03101A;
          background: linear-gradient(135deg, #5DDAFF, #20A9E8);
          font: 700 13px var(--font-inter), Inter, sans-serif;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.45),
            0 10px 28px rgba(32,169,232,.18);
        }

        .preview-btn {
          padding: 0 22px;
        }

        .preview-btn:active,
        .got-it:active {
          transform: translateY(1px);
        }

        .preview-btn:focus-visible,
        .got-it:focus-visible {
          outline: 2px solid #7DE5FF;
          outline-offset: 3px;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 20;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(1, 6, 12, .76);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: overlay-in .22s ease both;
        }

        .unlock-modal {
          position: relative;
          width: min(100%, 360px);
          padding: 30px 24px 22px;
          overflow: visible;
          border: 1px solid rgba(125, 229, 255, .48);
          border-radius: 16px;
          background:
            repeating-linear-gradient(105deg, rgba(255,255,255,.018) 0 1px, transparent 1px 5px),
            linear-gradient(145deg, #182633, #101B27 48%, #0B151F);
          box-shadow:
            0 30px 80px rgba(0,0,0,.58),
            0 0 0 1px rgba(93,218,255,.08),
            0 0 42px rgba(32,169,232,.10),
            inset 0 1px 0 rgba(255,255,255,.11);
          animation: modal-in .42s cubic-bezier(.2,.85,.25,1) both;
        }

        .unlock-modal::before {
          content: "";
          position: absolute;
          top: 0;
          left: 7%;
          right: 7%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #8BEAFF, transparent);
          box-shadow: 0 0 10px rgba(93,218,255,.65);
        }

        .unlock-modal::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 15px;
          pointer-events: none;
          background: linear-gradient(115deg, rgba(255,255,255,.06), transparent 24%, transparent 75%, rgba(93,218,255,.025));
        }

        .unlock-label {
          position: relative;
          z-index: 2;
          margin-bottom: 8px;
          color: #5DDAFF;
          text-align: center;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .15em;
          text-transform: uppercase;
          text-shadow: 0 0 12px rgba(93,218,255,.45);
        }

        .unlock-modal h2 {
          position: relative;
          z-index: 2;
          margin: 0 0 18px;
          color: #F5FCFF;
          text-align: center;
          font-family: var(--font-geist-sans), Inter, sans-serif;
          font-size: 30px;
          line-height: 1;
          font-weight: 650;
          letter-spacing: -.04em;
        }

        .mode-purpose {
          position: relative;
          z-index: 2;
          color: #9DAEBC;
          text-align: center;
          font-size: 13px;
          line-height: 1.65;
        }

        .mode-purpose strong {
          display: block;
          margin-bottom: 6px;
          color: #F0F8FC;
          font-size: 14px;
          font-weight: 650;
        }

        .mode-purpose p {
          margin: 0;
        }

        .got-it {
          position: relative;
          z-index: 2;
          width: 100%;
          margin-top: 24px;
        }

        .particles {
          position: absolute;
          inset: -115px;
          overflow: visible;
          pointer-events: none;
        }

        .particle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          background: #5DDAFF;
          box-shadow: 0 0 7px #5DDAFF, 0 0 15px rgba(93,218,255,.55);
          opacity: 0;
          animation: dust 760ms cubic-bezier(.1,.72,.22,1) var(--delay) both;
        }

        .particle.star {
          width: 4px;
          height: 4px;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
        }

        .particle.star::before,
        .particle.star::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: #C8F6FF;
          box-shadow: 0 0 8px #5DDAFF;
        }

        .particle.star::before {
          width: 2px;
          height: 13px;
        }

        .particle.star::after {
          width: 13px;
          height: 2px;
        }

        @keyframes overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modal-in {
          from {
            opacity: 0;
            transform: translateY(14px) scale(.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes dust {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(0, 0) scale(.2);
          }
          12% { opacity: 1; }
          68% { opacity: .9; }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .modal-overlay,
          .unlock-modal,
          .particle {
            animation: none;
          }

          .particle {
            display: none;
          }
        }

        @media (max-width: 380px) {
          .unlock-page { padding-inline: 12px; }
          .unlock-modal { padding: 28px 20px 20px; }
        }
      `}</style>
    </main>
  )
}
