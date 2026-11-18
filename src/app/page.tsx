import Link from "next/link";
import { ArrowRight, ArrowUpRight, CarFront, HeartPulse, House, ShieldCheck, Sparkles } from "lucide-react";

const covers = [
  { icon: CarFront, name: "Motor", detail: "For every road ahead.", tone: "coral" },
  { icon: HeartPulse, name: "Health", detail: "Care when it matters.", tone: "mint" },
  { icon: House, name: "Home", detail: "A safe place to land.", tone: "sand" },
];

export default function HomePage() {
  return (
    <div className="marketing">
      <header className="site-header">
        <Link href="/" className="site-logo" aria-label="Solace home"><span className="site-logo-mark"><ShieldCheck size={20} strokeWidth={2.2} /></span>solace<span className="site-logo-dot">.</span></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#coverage">Coverage</a><a href="#experience">Why Solace</a><a href="#how-it-works">How it works</a>
        </nav>
        <div className="site-actions"><Link href="/login" className="header-login">Log in</Link><Link href="/register" className="header-cta">Get started <ArrowUpRight size={16} /></Link></div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-photo" role="img" aria-label="Sunlit coastal home overlooking the ocean" />
          <div className="hero-shade" />
          <div className="hero-content">
            <div className="hero-line"><span className="hero-line-dot" /> Insurance for the life you&apos;re building</div>
            <h1>Peace of mind<br />looks good on you<span>.</span></h1>
            <p>More than a policy. A simpler, more human way to protect what makes your life yours.</p>
            <div className="hero-buttons"><Link href="/register" className="button-light">Explore your coverage <ArrowUpRight size={18} /></Link><a href="#experience" className="button-text">Get to know us <ArrowRight size={18} /></a></div>
          </div>
          <div className="hero-caption"><span>Made for life&apos;s big moments</span><span>01 / 03</span></div>
        </section>

        <section className="intro-section" id="experience">
          <div className="intro-side"><span className="mini-sun"><Sparkles size={20} /></span><span>Feel covered.<br />Live fully.</span></div>
          <div className="intro-main"><h2>The best protection is the kind that lets you <em>forget it&apos;s there.</em></h2><p>Insurance should make room for living. Solace brings your coverage, claims, and next steps into one clear place, so you can get back to what matters.</p></div>
        </section>

        <section className="coverage-section" id="coverage">
          <div className="section-heading"><div><p className="section-note">Made for what matters</p><h2>Life has layers.<br /><em>We&apos;ve got them covered.</em></h2></div><p>From your first car to the place you call home, find thoughtful protection that moves with you.</p></div>
          <div className="coverage-grid">{covers.map(({ icon: Icon, name, detail, tone }) => <Link href="/register" className={`cover-card cover-${tone}`} key={name}><div className="cover-top"><Icon size={32} strokeWidth={1.5} /><ArrowUpRight size={22} strokeWidth={1.5} /></div><div><h3>{name} insurance</h3><p>{detail}</p></div></Link>)}</div>
        </section>

        <section className="feature-section" id="how-it-works">
          <div className="feature-visual"><div className="feature-orbit orbit-one" /><div className="feature-orbit orbit-two" /><div className="feature-center"><ShieldCheck size={48} strokeWidth={1.3} /><span>Covered, clearly.</span></div><span className="feature-chip chip-one">Your policies</span><span className="feature-chip chip-two">Claim updates</span><span className="feature-chip chip-three">One calm place</span></div>
          <div className="feature-copy"><p className="section-note">Simple by design</p><h2>Less paperwork.<br /><em>More living.</em></h2><p>Everything you need is right where you expect it. See your policies, start a claim, and follow its progress without chasing the details.</p><div className="feature-steps"><div><strong>01</strong><span>Choose the cover that fits your life</span></div><div><strong>02</strong><span>Keep every detail in one place</span></div><div><strong>03</strong><span>Get clear updates when you need us</span></div></div><Link href="/register" className="text-link">Create your account <ArrowUpRight size={18} /></Link></div>
        </section>

        <section className="closing-section"><div><p className="section-note">A little more certainty</p><h2>Make room for<br /><em>what&apos;s next.</em></h2></div><div><p>Good things happen when you feel ready for anything. Let&apos;s make that feeling yours.</p><Link href="/register" className="button-dark">Get started today <ArrowUpRight size={18} /></Link></div></section>
      </main>
      <footer className="site-footer"><Link href="/" className="site-logo">solace<span className="site-logo-dot">.</span></Link><p>Insurance, quietly handled.</p><div><Link href="/login">Log in</Link><Link href="/register">Create account</Link></div><span>© {new Date().getFullYear()} Solace</span></footer>
    </div>
  );
}
