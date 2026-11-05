import type {Metadata} from "next";
import {Brand,Icon} from "./components/RangeUI";
import styles from "./landing.module.css";

export const metadata:Metadata={title:"range. — Your liquidity. Your next move.",description:"Understand your Meteora positions and explore holding, rebalancing or exiting with Jupiter-powered swap estimates. Read-only. No wallet connection required."};

function PositionPreview(){return <figure className={styles.preview} aria-label="Illustrative SOL/USDC position, not live data">
  <figcaption className={styles.caption}><span>POSITION / PREVIEW</span><span>Illustrative · not live data</span></figcaption>
  <div className={styles.panel}>
    <div className={styles.pair}><strong>SOL / USDC</strong><span className={styles.status}>In range</span></div>
    <div className={styles.rangeLabel}><span>Liquidity range</span><span>USDC per SOL</span></div>
    <svg className={styles.plot} viewBox="0 0 360 76" fill="none" aria-hidden="true"><path d="M0 40H360" stroke="var(--color-line)"/><path d="M38 31H322V49H38Z" fill="var(--color-accent-tint)"/><path d="M38 24V56M322 24V56" stroke="currentColor" strokeWidth="2"/><path d="M142 10V66" stroke="currentColor" strokeDasharray="3 4"/><path d="m142 35 5 5-5 5-5-5Z" fill="var(--color-text)"/></svg>
    <div className={styles.numbers}><span>120.00<small>Lower</small></span><span>131.00<small>Pool price</small></span><span>150.00<small>Upper</small></span></div>
    <div className={styles.options} aria-label="Available analysis options"><span>HOLD</span><span>REBALANCE</span><span>EXIT</span></div>
  </div>
  <p className={styles.previewNote}>Illustrative prices only. Live analysis uses available position data and Jupiter quotes; complete execution costs may be unavailable.</p>
</figure>;}

export default function Home(){return <div className={styles.page}>
  <a className="skip-link" href="#main">Skip to content</a>
  <header className={styles.nav}><Brand/><nav aria-label="Main navigation" className={styles.navLinks}><a href="#how-it-works">How it works</a><a className={styles.navCta} href="/app">Open App <span aria-hidden="true">↗</span></a></nav></header>
  <main id="main" className={styles.main} tabIndex={-1}>
    <section className={styles.hero} aria-labelledby="headline">
      <div className={styles.intro}><h1 id="headline">Your liquidity.<span>Your next move.</span></h1><p>Understand your Meteora positions and explore the cost of holding, rebalancing or exiting — powered by Jupiter quotes.</p>
      <div className={styles.actions}><a className="primary" href="/app">Open App <Icon name="arrow"/></a><a href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a></div><small className={styles.trust}>Read-only. No wallet connection required.</small></div>
      <PositionPreview/>
    </section>
    <section id="how-it-works" className={styles.how} aria-labelledby="how-heading"><h2 id="how-heading" className={styles.sectionHeading}>From your position to your next move.</h2><div className={styles.steps}>
      <div><span className={styles.stepNumber}>01</span><h3>Analyze</h3><p>Paste your public wallet or position address.</p></div>
      <div><span className={styles.stepNumber}>02</span><h3>Understand</h3><p>See your liquidity range, position status and available information.</p></div>
      <div><span className={styles.stepNumber}>03</span><h3>Compare</h3><p>Explore holding, rebalancing or exiting with Jupiter-powered swap estimates.</p></div>
    </div></section>
  </main>
  <footer className={styles.footer}><div className={styles.footerTop}><div className={styles.footerIdentity}><Brand/><p>Independent research pilot<br/>Read-only / No custody</p></div><nav className={styles.footerLinks} aria-label="Documentation"><a href="https://developers.jup.ag/docs/swap" target="_blank" rel="noreferrer">Jupiter docs ↗</a><a href="https://docs.meteora.ag/" target="_blank" rel="noreferrer">Meteora docs ↗</a></nav></div>
    <div className={styles.footerBottom}><details className={styles.methodology}><summary>Methodology and limitations</summary><p>RANGE reads public Meteora position information and requests Jupiter swap quotes. Quotes are estimates, not executed trades or predictions. Historical profitability is not implied.</p><p>Meteora withdrawal and redeposit costs, network costs and reliable USD valuations may be unavailable. The app identifies missing information; an incomplete estimate is never a total execution cost. Pilot analysis remains invitation-only.</p></details><p className={styles.disclaimer}>An independent product. No official endorsement by Jupiter or Meteora.</p></div>
  </footer>
</div>;}
