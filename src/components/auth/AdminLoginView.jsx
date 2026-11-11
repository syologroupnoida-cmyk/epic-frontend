import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import PasswordToggle from './PasswordToggle';
import ApiStatusModal from '@/components/common/ApiStatusModal';
import styles from './AdminLoginView.module.css';

function Icon({ name, ...props }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{name === 'mail' ? <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></> : name === 'arrow' ? <path d="M4 12h16m-6-6 6 6-6 6" /> : name === 'grid' ? <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></> : <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>}</svg>;
}

export default function AdminLoginView({ superAdmin = false, form, errors, showPassword, isSubmitting, apiFeedback, onChange, onSubmit, onTogglePassword }) {
  const role = superAdmin ? 'Super-admin' : 'Admin';
  return <div className={`${styles.page} ${styles.centered}`}>
    <Head><title>{role} Login | Epic Wedz</title><meta name="robots" content="noindex, nofollow" /></Head>
    <section className={styles.visual} aria-label={`${role} workspace`}>
      <Image src="/images/auth-admin-login-bg.png" alt="" fill preload sizes="100vw" className={styles.heroImage} />
      <div className={styles.veil} />
    </section>

    <main className={styles.formSide}>
      <div className={styles.formContent}>
        <h1>{superAdmin ? 'Super-admin' : 'Admin Login'}</h1>
        <p className={styles.intro}>Sign in to your {superAdmin ? 'super-admin' : 'admin'} account to continue.</p>
        <form onSubmit={onSubmit} noValidate aria-busy={isSubmitting} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="admin-login-email">Email address</label>
            <div className={`${styles.inputWrap} ${errors.email ? styles.invalid : ''}`}><Icon name="mail" /><input id="admin-login-email" type="email" name="email" value={form.email} onChange={onChange} placeholder="you@company.com" autoComplete="username" autoCapitalize="none" spellCheck={false} required disabled={isSubmitting} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'admin-email-error' : undefined} /></div>
            {errors.email && <p id="admin-email-error" role="alert" className={styles.error}>{errors.email}</p>}
          </div>
          <div className={styles.field}>
            <div className={styles.passwordLabel}><label htmlFor="admin-login-password">Password</label><Link href="/forgot-password">Forgot password?</Link></div>
            <div className={`${styles.inputWrap} ${errors.password ? styles.invalid : ''}`}><Icon name="lock" /><input id="admin-login-password" type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={onChange} placeholder="Enter your password" autoComplete="current-password" required disabled={isSubmitting} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'admin-password-error' : undefined} /><PasswordToggle isVisible={showPassword} label={showPassword ? 'Hide password' : 'Show password'} onClick={onTogglePassword} /></div>
            {errors.password && <p id="admin-password-error" role="alert" className={styles.error}>{errors.password}</p>}
          </div>
          <button className={styles.submit} type="submit" disabled={isSubmitting}>{isSubmitting && <span className="button-spinner" aria-hidden="true" />}<span>{isSubmitting ? 'Signing in...' : 'Sign in to dashboard'}</span>{!isSubmitting && <Icon name="arrow" />}</button>
        </form>
        <div className={styles.accessNote}><Icon name="lock" /><span>For authorised Epic Wedz team members.</span></div>
        <div className={styles.switchPortal}>{superAdmin ? 'Managing daily operations?' : 'Managing the entire platform?'} <Link href={superAdmin ? '/admin/login' : '/superadmin/login'}>{superAdmin ? 'Admin login' : 'Super-admin login'} <span aria-hidden="true">↗</span></Link></div>
      </div>
    </main>
    <ApiStatusModal status={apiFeedback?.status} title={apiFeedback?.title} text={apiFeedback?.text} okLabel={apiFeedback?.okLabel} onOk={apiFeedback?.onOk} />
  </div>;
}
