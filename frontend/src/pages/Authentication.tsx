import { ArrowLeft, Compass, Eye, EyeOff, KeyRound, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

type AuthKind = 'login' | 'signup'

function AuthenticationPage({ kind }: { kind: AuthKind }) {
  const isSignup = kind === 'signup'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [notice, setNotice] = useState('')
  const [experience, setExperience] = useState<'standard' | 'kids'>('standard')

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSignup) {
      const fields = new FormData(event.currentTarget)
      if (fields.get('password') !== fields.get('password-confirmation')) {
        setNotice('The passwords do not match.')
        return
      }
    }
    setNotice('Authentication is not connected in this version. No credentials were sent or saved. You can continue as a guest.')
  }

  return (
    <div className="auth-screen">
      <Link to="/" className="auth-brand brand" aria-label="Return to GEO-FLEX welcome">
        <span className="brand-mark">GF</span>
        <span className="brand-copy">
          <strong>GEO-FLEX</strong>
          <small>Earth Intelligence</small>
        </span>
      </Link>

      <section className="auth-panel" aria-labelledby="auth-heading">
        <Link to="/" className="auth-back"><ArrowLeft aria-hidden="true" /> Back to welcome</Link>
        <p className="auth-eyebrow">{isSignup ? 'CREATE YOUR PROFILE' : 'RETURN TO YOUR EXPLORATION'}</p>
        <h1 id="auth-heading">{isSignup ? 'Join GEO-FLEX' : 'Welcome back'}</h1>
        <p className="auth-description">
          {isSignup
            ? 'Choose the GEO-FLEX experience that is right for you.'
            : 'Sign in to continue your GEO-FLEX experience.'}
        </p>

        {isSignup && (
          <div className="experience-options" role="group" aria-label="Choose your GEO-FLEX experience">
            <button type="button" className={`experience-option ${experience === 'standard' ? 'selected' : ''}`} aria-pressed={experience === 'standard'} onClick={() => { setExperience('standard'); setNotice('') }}>
              <Compass aria-hidden="true" />
              <span><strong>STANDARD MODE</strong><small>Earth exploration, scientific analysis, discoveries and reports.</small></span>
            </button>
            <button type="button" className={`experience-option ${experience === 'kids' ? 'selected' : ''}`} aria-pressed={experience === 'kids'} onClick={() => { setExperience('kids'); setNotice('') }}>
              <Sparkles aria-hidden="true" />
              <span><strong>KIDS MODE</strong><small>A separate, guided Earth-science learning adventure.</small></span>
            </button>
          </div>
        )}

        {isSignup && experience === 'kids' ? (
          <div className="kids-signup-preview">
            <p className="kids-signup-label"><LockKeyhole aria-hidden="true" /> PRIVATE LEARNING PREVIEW</p>
            <h2>Explore first. No child profile needed.</h2>
            <p>Account creation is not connected yet. Kids Mode is available as a local learning preview and does not ask for a child’s name or other personal details.</p>
            <Link to="/kids" className="welcome-button welcome-button-primary kids-signup-button" onClick={() => sessionStorage.setItem('geoflex-access', 'guest')}>
              ENTER KIDS MODE <Sparkles aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            {isSignup && (
              <label className="auth-field">
                <span>Full name</span>
                <span className="auth-input-wrap">
                  <UserRound aria-hidden="true" />
                  <input name="name" type="text" autoComplete="name" placeholder="Your full name" required />
                </span>
              </label>
            )}

            <label className="auth-field">
              <span>Email address</span>
              <span className="auth-input-wrap">
                <Mail aria-hidden="true" />
                <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
              </span>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <span className="auth-input-wrap">
                <LockKeyhole aria-hidden="true" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={isSignup ? 'Create a password' : 'Enter your password'}
                  minLength={isSignup ? 8 : undefined}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </span>
            </label>

            {isSignup && (
              <label className="auth-field">
                <span>Confirm password</span>
                <span className="auth-input-wrap">
                  <KeyRound aria-hidden="true" />
                  <input
                    name="password-confirmation"
                    type={showConfirmation ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    aria-label={showConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}
                    aria-pressed={showConfirmation}
                    onClick={() => setShowConfirmation((value) => !value)}
                  >
                    {showConfirmation ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </span>
              </label>
            )}

            {notice && <p className="auth-notice" role="status">{notice}</p>}

            <button type="submit" className="welcome-button welcome-button-primary auth-submit">
              {isSignup ? 'CREATE ACCOUNT' : 'LOG IN'}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        )}

        {!(isSignup && experience === 'kids') && (
          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : 'New to GEO-FLEX?'}
            {' '}
            <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create an account'}</Link>
          </p>
        )}
        <Link to="/overview" className="auth-guest" onClick={() => sessionStorage.setItem('geoflex-access', 'guest')}>
          Continue as Guest
        </Link>
        <p className="auth-integration-note">Account access is not available yet. Your credentials are not transmitted.</p>
      </section>

      <p className="auth-footer">EXPLORE EARTH. UNDERSTAND CHANGE. SHAPE THE FUTURE.</p>
    </div>
  )
}

export function LoginPage() {
  return <AuthenticationPage kind="login" />
}

export function SignupPage() {
  return <AuthenticationPage kind="signup" />
}
