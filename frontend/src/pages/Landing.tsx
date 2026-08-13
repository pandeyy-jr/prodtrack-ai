import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  Box,
  ChevronRight,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import heroImage from '../assets/precision-hero.png';
import jpLogoWhite from '../assets/jp-logo-footer.svg';
import cardImg1 from '../assets/jp-toolroom-1542.jpg';
import cardImg2 from '../assets/jp-moulding-1365.jpg';
import cardImg3 from '../assets/jp-infrastructure.jpg';

const projects = [
  {
    code: '01',
    title: 'Precision turning',
    copy: 'CNC turning for pharmaceutical, medical and industrial components — machined to critical tolerances with consistent repeatability.',
    tag: 'CNC turning',
    img: cardImg1,
    alt: 'CNC precision toolroom machinery at Jay Precision Products facility',
  },
  {
    code: '02',
    title: 'Milled assemblies',
    copy: 'Multi-cavity moulds and complex VMC-machined profiles built for dependable fit across high-volume production runs.',
    tag: 'VMC machining',
    img: cardImg2,
    alt: 'Injection moulding and machined assembly production at Jay Precision Products',
  },
  {
    code: '03',
    title: 'Production control',
    copy: 'Every shift visible, measured and improved — live machine data, output tracking and supervisors connected in one view.',
    tag: 'ProdTrack AI',
    img: cardImg3,
    alt: 'Jay Precision Products manufacturing facility floor overview',
  },
];

const services = [
  ['01', 'Precision machining', 'CNC turning and vertical machining for critical components.'],
  ['02', 'Production visibility', 'Live shift data, output tracking and machine-level reporting.'],
  ['03', 'Quality control', 'Traceable processes designed around consistent quality.'],
];

const Landing = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 28);
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const moveTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="industrial-page">
      <style>{styles}</style>

      <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
        <button className="brand" onClick={() => moveTo('top')} aria-label="Jay Precision Products Pvt. Ltd. — home">
          <img src={jpLogoWhite} alt="Jay Precision Products Pvt. Ltd." className="brand-logo" />
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <button onClick={() => moveTo('about')}>About us</button>
          <button onClick={() => moveTo('capabilities')}>Capabilities</button>
          <button onClick={() => moveTo('projects')}>Projects</button>
          <button onClick={() => moveTo('contact')}>Contact</button>
        </nav>
        <button className="outline-button desktop-login" onClick={() => navigate('/login')}>Client login <ArrowUpRight size={15} /></button>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" aria-expanded={menuOpen}>
          {menuOpen ? <X /> : <Menu />}
        </button>
        {menuOpen && <div className="mobile-menu">
          <button onClick={() => moveTo('about')}>About us</button>
          <button onClick={() => moveTo('capabilities')}>Capabilities</button>
          <button onClick={() => moveTo('projects')}>Projects</button>
          <button onClick={() => moveTo('contact')}>Contact</button>
          <button className="amber-button" onClick={() => navigate('/login')}>Client login <ArrowUpRight size={15} /></button>
        </div>}
      </header>

      <section className="hero" id="top" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="eyebrow">JAY PRECISION PRODUCTS · EST. 2010</p>
          <h1>ENGINEERED<br /><em>TO PERFORM.</em></h1>
          <p className="hero-copy">Precision machining and smarter production control for components that have no room for compromise.</p>
          <div className="hero-actions">
            <button className="amber-button" onClick={() => moveTo('capabilities')}>Explore capabilities <ChevronRight size={16} /></button>
            <button className="text-button" onClick={() => navigate('/login')}>Open ProdTrack AI <ArrowUpRight size={16} /></button>
          </div>
        </div>
        <div className="hero-foot">
          <div><span>01</span><p>ISO-led processes<br />for exacting work</p></div>
          <div><span>24/7</span><p>Production intelligence<br />for every shift</p></div>
          <button onClick={() => moveTo('about')} aria-label="Scroll to about"><ArrowDownRight /></button>
        </div>
      </section>

      <section className="about section-grid" id="about">
        <p className="section-label">ABOUT US</p>
        <div className="about-content">
          <p className="intro">WE MAKE PRECISION FEEL <span>REPEATABLE.</span></p>
          <p className="body-copy">Jay Precision Products combines practical manufacturing experience with live production intelligence. From a single drawing to repeat batches, our team keeps quality, pace and traceability in the same line of sight.</p>
          <div className="stats">
            <div><strong>15<span>+</span></strong><p>Years of<br />manufacturing</p></div>
            <div><strong>0.01</strong><p>mm-level<br />precision focus</p></div>
            <div><strong>24<span>/7</span></strong><p>Production<br />visibility</p></div>
          </div>
        </div>
      </section>

      <section className="projects" id="projects">
        <div className="section-head">
          <div><p className="section-label">OUR WORK</p><h2>A CLOSER LOOK AT<br />WHAT WE <em>BUILD.</em></h2></div>
          <p>From rapid prototypes to reliable production runs, we build components and processes around your specification.</p>
        </div>
        <div className="project-grid">
          {projects.map((project, index) => <article className={`project-card project-card--${index}`} key={project.code}
            style={{ backgroundImage: `url(${project.img})` }}>
            <img src={project.img} alt={project.alt} className="project-card-photo" aria-hidden="true" />
            <div className="project-card-overlay" />
            <div className="project-top"><span>{project.code}</span><span>{project.tag}</span></div>
            <div><h3>{project.title}</h3><p>{project.copy}</p></div>
            <ArrowUpRight className="project-arrow" size={21} />
          </article>)}
        </div>
      </section>

      <section className="capabilities section-grid" id="capabilities">
        <p className="section-label">OUR CAPABILITIES</p>
        <div className="capability-content">
          <div className="capability-title"><h2>STRENGTH IN<br /><em>EVERY DETAIL.</em></h2><p>Manufacturing discipline backed by data that keeps work moving.</p></div>
          <div className="service-list">
            {services.map(([number, title, copy]) => <article key={number}>
              <span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div><ArrowUpRight size={20} />
            </article>)}
          </div>
        </div>
      </section>

      <section className="platform" id="contact">
        <div className="platform-icon"><Sparkles size={20} /></div>
        <p className="section-label">PRODTRACK AI</p>
        <h2>SEE THE FLOOR.<br /><em>MOVE WITH CONFIDENCE.</em></h2>
        <p>Our production platform connects supervisors, machine data and leadership reporting in one working view.</p>
        <div className="platform-points"><span><ShieldCheck size={15} /> Role-based access</span><span><Box size={15} /> Export-ready data</span></div>
        <button className="amber-button" onClick={() => navigate('/login')}>Access the platform <ArrowUpRight size={16} /></button>
      </section>

      <footer><div className="footer-brand"><img src={jpLogoWhite} alt="Jay Precision Products Pvt. Ltd." className="footer-logo" /></div><p>© {new Date().getFullYear()} Jay Precision Products</p><button onClick={() => moveTo('top')}>Back to top ↑</button></footer>
    </main>
  );
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap');
  .industrial-page{--ink:#10100f;--panel:#161614;--muted:#a6a29a;--line:rgba(255,255,255,.12);--amber:#d99219;background:var(--ink);color:#f0eee8;font-family:Manrope,Arial,sans-serif;overflow:hidden}.industrial-page button{font:inherit}.site-header{height:86px;padding:0 max(28px,calc((100vw - 1320px)/2));display:flex;align-items:center;gap:30px;position:fixed;top:0;z-index:20;width:100%;transition:.25s;background:linear-gradient(180deg,rgba(10,10,9,.92),rgba(10,10,9,0))}.site-header--scrolled{height:70px;background:rgba(16,16,15,.94);backdrop-filter:blur(16px);border-bottom:1px solid var(--line)}.brand{border:0;background:transparent;display:flex;align-items:center;cursor:pointer;padding:0;flex-shrink:0}.brand-logo{height:36px;width:auto;display:block;object-fit:contain}.desktop-nav{display:flex;gap:29px;margin:auto}.desktop-nav button,.text-button{border:0;background:transparent;color:#ddd9d1;font-size:12px;cursor:pointer}.desktop-nav button:hover,.text-button:hover{color:var(--amber)}.outline-button,.amber-button{display:inline-flex;align-items:center;justify-content:center;gap:9px;border:1px solid var(--line);background:transparent;color:#f6f3ed;padding:12px 17px;text-transform:uppercase;font:500 10px 'DM Mono';letter-spacing:.9px;cursor:pointer;transition:.2s}.outline-button:hover{border-color:var(--amber);color:var(--amber)}.amber-button{background:var(--amber);border-color:var(--amber);color:#15120d;font-weight:500}.amber-button:hover{background:#f3ae33;border-color:#f3ae33;transform:translateY(-2px)}.menu-button,.mobile-menu{display:none}.hero{min-height:770px;height:100vh;max-height:960px;background-position:center;background-size:cover;position:relative;display:flex;align-items:center}.hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(11,11,10,.94) 0%,rgba(11,11,10,.72) 34%,rgba(11,11,10,.08) 70%),linear-gradient(0deg,rgba(11,11,10,.75),transparent 42%)}.hero-content{position:relative;z-index:1;width:min(1320px,100%);margin:0 auto;padding:96px 28px 0}.eyebrow,.section-label{font:500 10px 'DM Mono';letter-spacing:1.5px;color:var(--amber);margin:0 0 24px}.hero h1,h2,.intro{font-family:'Barlow Condensed',Impact,sans-serif;font-weight:700;letter-spacing:-1px;margin:0}.hero h1{font-size:clamp(72px,10vw,158px);line-height:.82;max-width:780px}.hero em,h2 em,.intro span{color:var(--amber);font-style:normal}.hero-copy{max-width:380px;color:#d0ccc3;font-size:14px;line-height:1.7;margin:32px 0}.hero-actions{display:flex;gap:23px;align-items:center}.text-button{display:flex;align-items:center;gap:8px;padding:10px 0}.hero-foot{position:absolute;z-index:1;bottom:28px;left:max(28px,calc((100vw - 1320px)/2 + 28px));right:max(28px,calc((100vw - 1320px)/2 + 28px));display:flex;align-items:end;gap:48px}.hero-foot>div{display:flex;gap:11px;align-items:baseline}.hero-foot span{font:600 29px 'Barlow Condensed';color:var(--amber)}.hero-foot p{margin:0;color:#d6d1c7;font-size:10px;line-height:1.55}.hero-foot button{margin-left:auto;color:#f5f2ec;border:1px solid var(--line);width:46px;height:46px;background:#15151399;cursor:pointer}.section-grid{display:grid;grid-template-columns:27% 1fr;gap:20px;max-width:1320px;margin:auto;padding:135px 28px}.about{border-bottom:1px solid var(--line)}.about-content{max-width:735px}.intro{font-size:clamp(42px,5.4vw,74px);line-height:.93;max-width:600px}.body-copy{font-size:14px;color:#a9a59d;line-height:1.8;max-width:550px;margin:35px 0 52px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.stats strong{font:600 clamp(43px,4.3vw,64px) 'Barlow Condensed';color:var(--amber);letter-spacing:-1px}.stats strong span{font-size:.7em}.stats p{margin:4px 0 0;color:#97938c;font-size:10px;line-height:1.6}.projects{max-width:1320px;margin:auto;padding:128px 28px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:28px;margin-bottom:48px}.section-head h2,.capability-title h2,.platform h2{font-size:clamp(45px,5vw,72px);line-height:.88}.section-head>p{color:#98948c;line-height:1.7;font-size:12px;max-width:275px;margin:0}.project-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.project-card{height:420px;padding:21px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden;background-color:#1a1a17;background-size:cover;background-position:center;border:none;border-radius:22px;isolation:isolate;cursor:default;box-shadow:0 8px 32px rgba(0,0,0,.45);transition:transform .32s cubic-bezier(.25,.46,.45,.94),box-shadow .32s cubic-bezier(.25,.46,.45,.94);will-change:transform}.project-card:hover{transform:translateY(-6px);box-shadow:0 20px 56px rgba(0,0,0,.55),0 0 0 0 transparent,0 8px 24px rgba(217,146,25,.08)}.project-card-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:22px;z-index:0;transform:scale(1.04);transition:transform .55s cubic-bezier(.25,.46,.45,.94);filter:brightness(.45) saturate(.7)}.project-card:hover .project-card-photo{transform:scale(1.07);filter:brightness(.38) saturate(.65)}.project-card-overlay{position:absolute;inset:0;z-index:1;border-radius:22px;background:linear-gradient(180deg,rgba(10,10,9,.10) 0%,rgba(10,10,9,.52) 42%,rgba(10,10,9,.92) 100%);transition:background .32s}.project-card:hover .project-card-overlay{background:linear-gradient(180deg,rgba(10,10,9,.16) 0%,rgba(10,10,9,.60) 38%,rgba(10,10,9,.96) 100%)}.project-card:before{display:none}.project-top{position:relative;z-index:2;display:flex;justify-content:space-between;font:10px 'DM Mono';letter-spacing:.7px;color:#dfd9ce}.project-top span:last-child{color:var(--amber);text-transform:uppercase}.project-card h3{position:relative;z-index:2;font:600 36px 'Barlow Condensed';text-transform:uppercase;line-height:.95;margin:0 0 9px;text-shadow:0 2px 8px rgba(0,0,0,.7)}.project-card>div:last-of-type{position:relative;z-index:2}.project-card p{font-size:11px;max-width:230px;line-height:1.65;margin:0;color:#d7d0c4;text-shadow:0 1px 4px rgba(0,0,0,.8)}.project-arrow{position:absolute;right:20px;bottom:21px;z-index:2;color:var(--amber);transition:transform .25s ease,color .2s}.project-card:hover .project-arrow{transform:translate(3px,-3px);color:#f3ae33}@media(prefers-reduced-motion:reduce){.project-card,.project-card-photo,.project-card-overlay,.project-arrow{transition:none!important;transform:none!important}}.capabilities{padding-top:100px}.capability-content{max-width:800px}.capability-title{display:flex;align-items:end;justify-content:space-between;gap:25px;margin-bottom:58px}.capability-title p{font-size:12px;line-height:1.7;color:#99958d;max-width:220px;margin:0}.service-list{border-top:1px solid var(--line)}.service-list article{display:grid;grid-template-columns:78px 1fr 28px;gap:17px;align-items:center;padding:25px 0;border-bottom:1px solid var(--line)}.service-list span{font:500 50px 'Barlow Condensed';color:#44413d}.service-list h3{font:600 18px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.3px;margin:0 0 4px}.service-list p{font-size:11px;line-height:1.6;margin:0;color:#96928a}.service-list svg{color:var(--amber)}.platform{margin:0 28px 28px;padding:82px 28px;min-height:460px;text-align:center;background:linear-gradient(120deg,#1a1814,#272016 52%,#181714);border:1px solid rgba(217,146,25,.25);position:relative}.platform:after{content:'JPP';font:800 26vw 'Barlow Condensed';color:rgba(255,255,255,.025);position:absolute;inset:auto 0 -12vw;pointer-events:none}.platform>*{position:relative;z-index:1}.platform-icon{color:var(--amber);margin-bottom:18px}.platform .section-label{margin-bottom:17px}.platform>p:not(.section-label){max-width:420px;color:#c1b9ad;font-size:13px;line-height:1.7;margin:24px auto}.platform-points{display:flex;justify-content:center;gap:22px;margin:27px 0}.platform-points span{display:flex;align-items:center;gap:7px;color:#d9d2c7;font-size:11px}.platform-points svg{color:var(--amber)}.platform .amber-button{margin-top:6px}footer{max-width:1320px;margin:auto;padding:28px;display:flex;align-items:center;justify-content:space-between;color:#969189;font-size:10px;border-top:1px solid var(--line)}.footer-brand{display:flex;align-items:center}.footer-logo{height:28px;width:auto;display:block;object-fit:contain}footer button{border:0;background:transparent;color:#c5bfb4;font:10px 'DM Mono';cursor:pointer}footer button:hover{color:var(--amber)}
  @media(max-width:760px){.site-header{height:67px;padding:0 18px}.brand-logo{height:28px}.desktop-nav,.desktop-login{display:none}.menu-button{display:grid;place-items:center;margin-left:auto;width:38px;height:38px;color:#f2eee8;background:transparent;border:1px solid var(--line);cursor:pointer}.mobile-menu{display:flex;position:absolute;top:59px;left:18px;right:18px;flex-direction:column;padding:9px;background:#1a1916;border:1px solid var(--line);box-shadow:0 20px 35px #0008}.mobile-menu button{padding:14px;text-align:left;border:0;background:transparent;color:#eee9e0;font-size:13px}.mobile-menu .amber-button{margin-top:7px;text-align:center}.hero{min-height:680px;height:100svh;background-position:61% center}.hero-shade{background:linear-gradient(90deg,rgba(11,11,10,.92),rgba(11,11,10,.42)),linear-gradient(0deg,rgba(11,11,10,.9),transparent 55%)}.hero-content{padding:90px 23px 70px}.hero h1{font-size:clamp(59px,18vw,86px)}.hero-copy{font-size:12px;max-width:290px;margin:27px 0}.hero-actions{gap:16px;flex-wrap:wrap}.hero-foot{left:23px;right:23px;gap:16px}.hero-foot>div:nth-child(2){display:none}.hero-foot button{width:40px;height:40px}.section-grid{grid-template-columns:1fr;padding:82px 23px;gap:30px}.section-label{margin-bottom:0}.intro{font-size:46px}.body-copy{font-size:12px;margin:25px 0 35px}.stats{gap:10px}.stats strong{font-size:43px}.stats p{font-size:9px}.projects{padding:82px 23px}.section-head{display:block;margin-bottom:31px}.section-head h2,.capability-title h2,.platform h2{font-size:47px}.section-head>p{margin-top:23px;font-size:11px}.project-grid{grid-template-columns:1fr}.project-card{height:300px;transform:none!important}.capabilities{padding-top:78px}.capability-title{display:block;margin-bottom:38px}.capability-title p{margin-top:20px}.service-list article{grid-template-columns:52px 1fr 20px}.service-list span{font-size:40px}.platform{margin:0 12px 12px;padding:65px 23px}.platform-points{flex-direction:column;align-items:center;gap:10px}footer{padding:23px;gap:15px;flex-wrap:wrap}.footer-brand{order:0}footer p{order:2;width:100%;margin:0}footer button{order:1;margin-left:auto}}
`;

export default Landing;
