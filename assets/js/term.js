// A small fake shell. Toggle with ~ (or `), close with Esc or `exit`.
import { COMMITS, NOTES, PERSON } from './data.js';
import { esc } from './gitlog.js';
import { lsLine } from './notes.js';

const LOGO = String.raw`__     __ ____   _   _
\ \   / /|  _ \ | | | |
 \ \ / / | | | || |_| |
  \ V /  | |_| ||  _  |
   \_/   |____/ |_| |_|`;

const COMPANIES = { digicracy: 'dig', b40lux: 'b40', dcy: 'dcy', 'vdh-ltd': 'vdh' };

export function mountTerminal(root, ctx) {
  const out = root.querySelector('.term__out');
  const form = root.querySelector('.term__line');
  const input = root.querySelector('.term__in');
  const ps1Text = 'guest@vdh.ai';
  let cwd = '~';
  const hist = [];
  let hi = 0;
  let booted = false;

  // ---------- virtual filesystem ----------
  const readme = () => document.querySelector('#readme .readme')?.textContent.trim() ?? '';
  const fs = {
    '~': ['README.md', 'contact.txt', 'companies/', 'notes/'],
    '~/companies': Object.keys(COMPANIES).map((k) => `${k}.md`),
    '~/notes': NOTES.map((n) => `${n.slug}.md`),
  };
  const hidden = { '~': ['.secrets', '.zshrc'] };
  function resolve(p = '') {
    if (!p || p === '~' || p === '/') return '~';
    let parts = (p.startsWith('~') || p.startsWith('/') ? p.replace(/^[~/]+/, '') : `${cwd.replace(/^~\/?/, '')}/${p}`).split('/').filter(Boolean);
    const stack = [];
    for (const s of parts) { if (s === '..') stack.pop(); else if (s !== '.') stack.push(s); }
    return stack.length ? `~/${stack.join('/')}` : '~';
  }
  function readFile(path) {
    const p = resolve(path);
    if (p === '~/README.md') return readme();
    if (p === '~/contact.txt') return `email     ${PERSON.email}\nlinkedin  ${PERSON.linkedin}\ninstagram ${PERSON.instagram}\noffice    ${PERSON.company.name}, ${PERSON.company.address}`;
    if (p === '~/.secrets') return 'consistently good > occasionally great.';
    if (p === '~/.zshrc') return 'alias coffee="brew install coffee"\nalias quit="echo never"\nexport SHOES=REAL_ONES  # lesson learned';
    let m = p.match(/^~\/companies\/(.+)\.md$/);
    if (m && COMPANIES[m[1]]) return companyText(COMMITS.find((c) => c.id === COMPANIES[m[1]]));
    m = p.match(/^~\/notes\/(.+)\.md$/);
    if (m) { const n = NOTES.find((x) => x.slug === m[1]); if (n) return `# ${n.title}\n${n.date}\n\n${n.body}`; }
    return null;
  }
  function companyText(c) {
    const s = c.show;
    return [`commit ${c.hash} (${c.refs.join(', ')})`, s.role && `Role:   ${s.role}`, s.where && `Where:  ${s.where}`, `Date:   ${s.date}`, s.url && `Url:    ${s.url}`, '', `    ${s.body}`, '', ...s.diff.map(([a, b]) => `${a} ${b}`)].filter((x) => x !== undefined && x !== false && x !== null).join('\n');
  }

  // ---------- output ----------
  function print(html, cls = '') {
    const div = document.createElement('div');
    div.className = `term__o ${cls}`;
    div.innerHTML = html;
    out.append(div);
    out.scrollTop = out.scrollHeight;
    return div;
  }
  const text = (t, cls) => print(esc(t), cls);
  const ps1 = () => `<span class="term__user">${ps1Text}</span>:<span class="term__cwd">${esc(cwd)}</span>$`;
  const link = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)}</a>`;

  // ---------- commands ----------
  const cmds = {
    help: () => print(`<span class="term__h">available commands</span>
  <b>finger mathieu</b>  who runs this place       <b>whoami</b>      who are you?
  <b>ls [-a] [dir]</b>   list files                <b>cd</b> / <b>pwd</b>     move around
  <b>cat</b> &lt;file&gt;      print a file              <b>less</b> &lt;note&gt;  read a note
  <b>git log</b>         career history            <b>git show</b> &lt;hash|branch&gt;
  <b>vdhfetch</b>        system info               <b>ping</b>        get in touch
  <b>open</b> &lt;linkedin|instagram|source|section&gt;
  <b>theme</b> [name]    recolour the site         <b>morph</b> [shape] change the 3D thing
  <b>run marathon</b>    42.195 km, fast-forward   <b>clear</b> / <b>exit</b>
<span class="term__dim">there are a few more. tab completes, ↑/↓ for history.</span>`),

    whoami: () => text(`guest. you're the visitor here.\nthe owner is ${PERSON.name}. try \`finger mathieu\`.`),
    finger: () => print(`<span class="term__h">Login: mathieu</span>                 Name: ${PERSON.name}
Directory: /home/london          Shell: /bin/zsh
Serial entrepreneur and technical founder: 15+ years building
companies across fintech, global health and tech consulting.
Proud father of four, husband to an amazing wife.
<span class="term__h">Plan:</span>
  Find co-founders and mentors for the next venture: tech with
  genuine positive impact on health, wellbeing and the planet.
  → ${link(`mailto:${PERSON.email}`, PERSON.email)}`),

    pwd: () => text(cwd.replace('~', '/home/guest')),
    cd: (a) => {
      const p = resolve(a[0]);
      if (!fs[p]) return text(`cd: no such directory: ${a[0]}`, 'term__err');
      cwd = p; root.querySelector('.term__ps1').innerHTML = ps1();
    },
    ls: (a) => {
      const flags = a.filter((x) => x.startsWith('-')).join('');
      const p = resolve(a.find((x) => !x.startsWith('-')));
      if (!fs[p]) return text(`ls: ${a.find((x) => !x.startsWith('-'))}: No such file or directory`, 'term__err');
      const items = [...(flags.includes('a') ? ['./', '../', ...(hidden[p] || [])] : []), ...fs[p]];
      if (p === '~/notes' && flags.includes('l')) return text(NOTES.map(lsLine).join('\n'));
      print(items.map((f) => `<span class="${f.endsWith('/') ? 'term__dir' : f.startsWith('.') ? 'term__dim' : ''}">${esc(f)}</span>`).join('   '));
    },
    cat: (a) => {
      if (!a.length) return text('cat: give me a file. try `cat README.md`', 'term__err');
      for (const f of a) {
        const c = readFile(f);
        if (c === null) text(fs[resolve(f)] ? `cat: ${f}: Is a directory` : `cat: ${f}: No such file or directory`, 'term__err');
        else text(c);
      }
    },
    less: (a) => {
      const slug = (a[0] || '').replace(/^.*\//, '').replace(/\.md$/, '');
      if (!slug) return text('usage: less <note>.md   (see `ls notes`)', 'term__err');
      if (!ctx.openNote(slug)) return text(`less: ${a[0]}: No such file`, 'term__err');
      text(`opening ~/notes/${slug}.md …`);
    },
    git: (a) => {
      const sub = a[0];
      if (sub === 'log' || !sub) {
        const g = { 0: '*', 1: '| *', 2: '| | *' };
        return print(COMMITS.map((c) => `<span class="term__graph">${(g[c.lane] || '*').padEnd(6)}</span><span class="term__hash">${c.hash}</span>${c.refs.length ? ` <span class="term__ref">(${esc(c.refs.join(', '))})</span>` : ''} ${esc(c.msg)} <span class="term__dim">${esc(c.year)}</span>`).join('\n'));
      }
      if (sub === 'show') {
        const q = (a[1] || 'HEAD').toLowerCase();
        const c = COMMITS.find((x) => x.hash.startsWith(q) || x.refs.some((r) => r.toLowerCase().includes(q)) || x.id === q) || (q === 'head' && COMMITS[0]);
        if (!c) return text(`fatal: ambiguous argument '${a[1]}': unknown revision`, 'term__err');
        ctx.showCommit(c.id);
        return text(companyText({ ...c, refs: c.refs.length ? c.refs : ['main'], show: { diff: [], ...c.show } }));
      }
      if (sub === 'status') return text("On branch main\nYour branch is ahead of 'origin/comfort-zone' by 15+ years.\n\nChanges not staged for commit:\n\tmodified:   next-venture.md\n\nno changes added to commit (use \"ping\" to collaborate)");
      if (sub === 'blame') return text('^0000001 (Mathieu Van der Haegen) it was me. it is always me.');
      if (sub === 'push') return text('To vdh.ai\n ! [rejected]  you → main (fetch first: try `ping`)', 'term__err');
      text(`git: '${sub}' is not a git command here. try: log, show, status, blame`, 'term__err');
    },
    vdhfetch: () => {
      const info = [
        `<span class="term__user">guest</span>@<span class="term__user">vdh.ai</span>`,
        '-------------',
        ['OS', 'Human v1.0'],
        ['Host', PERSON.name],
        ['Kernel', 'founder-15+.lts'],
        ['Uptime', '15+ years building companies'],
        ['Packages', '4 companies (2 exits, 1 closed, 1 running)'],
        ['Family', '1 wife, 4 kids'],
        ['Marathons', '1 (barefoot shoes, not recommended)'],
        ['Shell', 'zsh'],
        ['Theme', ctx.theme()],
        ['Status', 'exploring next venture (impact tech)'],
        '<span class="term__swatch"><i style="--c:var(--br-lime)"></i><i style="--c:var(--br-cyan)"></i><i style="--c:var(--br-magenta)"></i><i style="--c:var(--br-amber)"></i><i style="--c:var(--fg)"></i></span>',
      ].map((x) => (Array.isArray(x) ? `<span class="term__key">${x[0]}</span>: ${esc(x[1])}` : x));
      const logo = LOGO.split('\n');
      const rows = Math.max(logo.length, info.length);
      let s = '';
      for (let i = 0; i < rows; i++) s += `<span class="term__logo">${esc((logo[i] || '').padEnd(26))}</span>${info[i] || ''}\n`;
      print(s.trimEnd());
    },
    ping: () => {
      text(`PING ${PERSON.email}: 56 data bytes\n64 bytes from mathieu: icmp_seq=0 ttl=64 time=☕ ms\n--- opening your mail client ---`);
      setTimeout(() => { location.href = `mailto:${PERSON.email}?subject=Hello%20from%20vdh.ai`; }, 700);
    },
    open: (a) => {
      const t = (a[0] || '').toLowerCase();
      const urls = { linkedin: PERSON.linkedin, instagram: PERSON.instagram, source: PERSON.source, dcy: 'https://www.dcy.io' };
      const sections = { readme: '#readme', log: '#log', career: '#log', notes: '#notes', contact: '#ping', ping: '#ping', top: '#whoami', home: '#whoami' };
      if (urls[t]) { window.open(urls[t], '_blank', 'noopener'); return print(`opened ${link(urls[t], urls[t])}`); }
      if (sections[t]) { ctx.close(); document.querySelector(sections[t])?.scrollIntoView({ behavior: 'smooth' }); return; }
      text(`usage: open <${[...Object.keys(urls), ...Object.keys(sections)].join('|')}>`, 'term__err');
    },
    theme: (a) => {
      if (!a[0]) return text(`current: ${ctx.theme()}\navailable: ${ctx.themes().join(', ')}`);
      if (!ctx.setTheme(a[0])) return text(`theme: unknown theme '${a[0]}'. try: ${ctx.themes().join(', ')}`, 'term__err');
      text(`theme → ${a[0]}`);
    },
    morph: (a) => {
      const names = ctx.ascii.shapes();
      const i = a[0] ? names.indexOf(a[0]) : undefined;
      if (a[0] && i < 0) return text(`morph: unknown shape. try: ${names.join(', ')}`, 'term__err');
      text(`morphing → ${ctx.ascii.next(i)}`);
    },
    spin: () => { ctx.ascii.spin(14); text('wheeeee'); },
    run: (a) => {
      if (a[0] !== 'marathon') return text('usage: run marathon', 'term__err');
      const line = print('', 'term__run');
      const msgs = [[0, 'start line. checking shoes… barefoot ones. ok.'], [10, 'settling into pace'], [21.1, 'halfway. feeling great.'], [30, 'km 30: the wall has entered the chat'], [38, 'left foot filing a complaint'], [42.195, 'FINISH 4:22:00 ✓ consistently good > occasionally great']];
      let km = 0;
      const t = setInterval(() => {
        km = Math.min(42.195, km + 0.9);
        const n = Math.round((km / 42.195) * 30);
        const msg = [...msgs].reverse().find(([k]) => km >= k)[1];
        line.textContent = `[${'#'.repeat(n)}${'.'.repeat(30 - n)}] ${km.toFixed(1).padStart(4)} km  ${msg}`;
        out.scrollTop = out.scrollHeight;
        if (km >= 42.195) clearInterval(t);
      }, 60);
    },
    sudo: (a) => {
      if (a.join(' ').match(/^hire (math|mathieu|me|him|vdh)/i)) {
        text('[sudo] password for guest: ********\naccess granted. drafting the email for you…');
        return setTimeout(() => { location.href = `mailto:${PERSON.email}?subject=Let's%20work%20together`; }, 900);
      }
      text('guest is not in the sudoers file. This incident will be reported to 4 kids.', 'term__err');
    },
    rm: (a) => {
      const s = a.join(' ');
      if (/-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r/.test(s) && /(^|\s)(\/|~|\*|\/\*)(\s|$)/.test(s)) {
        text('removing everything…', 'term__err');
        ctx.collapse();
        return setTimeout(() => text("…just kidding. it's a static site and git remembers everything."), 2600);
      }
      text('rm: permission denied (nice try)', 'term__err');
    },
    uptime: () => text(`${new Date().toTimeString().slice(0, 8)} up 15+ years, 4 kids, load average: 0.42, 0.42, 0.42`),
    date: () => text(new Date().toString()),
    echo: (a) => text(a.join(' ')),
    history: () => text(hist.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n')),
    coffee: () => text("      ( (\n       ) )\n    ........\n    |      |]\n    \\      /\n     `----'\nbrewing… done. now `ping` me and let's drink it."),
    clear: () => { out.innerHTML = ''; },
    exit: () => ctx.close(),
    vim: () => text("you can check in, but you can never leave.\n(kidding: type `exit`)"),
    hello: () => text('hi! 👋 type `help` to look around.'),
  };
  const alias = { neofetch: 'vdhfetch', fetch: 'vdhfetch', mail: 'ping', email: 'ping', contact: 'ping', hire: 'ping', man: 'help', '?': 'help', who: 'finger', about: 'finger', quit: 'exit', q: 'exit', ':q': 'exit', ':wq': 'exit', emacs: 'vim', nano: 'vim', vi: 'vim', hi: 'hello', hey: 'hello', bonjour: 'hello', ll: 'ls', dir: 'ls', more: 'less' };

  function run(line) {
    const raw = line.trim();
    print(`${ps1()} ${esc(raw)}`, 'term__cmd');
    if (!raw) return;
    hist.push(raw); hi = hist.length;
    let [cmd, ...args] = raw.split(/\s+/);
    if (cmd === 'll') args = ['-l', ...args];
    cmd = alias[cmd] || cmd;
    const f = cmds[cmd.toLowerCase()];
    if (!f) return text(`zsh: command not found: ${cmd}. type \`help\``, 'term__err');
    try { f(args); } catch (err) { text(`segfault (just kidding): ${err.message}`, 'term__err'); }
  }

  // ---------- tab completion ----------
  function complete() {
    const v = input.value;
    const parts = v.split(/\s+/);
    if (parts.length === 1) {
      const opts = Object.keys(cmds).filter((c) => c.startsWith(parts[0]));
      if (opts.length === 1) input.value = `${opts[0]} `;
      else if (opts.length > 1) text(opts.join('  '));
      return;
    }
    const last = parts[parts.length - 1];
    const slash = last.lastIndexOf('/');
    const dir = slash >= 0 ? resolve(last.slice(0, slash) || '/') : cwd;
    const base = slash >= 0 ? last.slice(slash + 1) : last;
    const pool = parts[0] === 'git' ? ['log', 'show', 'status', 'blame']
      : parts[0] === 'theme' ? ctx.themes()
      : parts[0] === 'morph' ? ctx.ascii.shapes()
      : parts[0] === 'open' ? ['linkedin', 'instagram', 'source', 'readme', 'log', 'notes', 'contact']
      : parts[0] === 'run' ? ['marathon']
      : [...(fs[dir] || []), ...(hidden[dir] || [])];
    const opts = pool.filter((f) => f.startsWith(base));
    if (opts.length === 1) {
      parts[parts.length - 1] = (slash >= 0 ? last.slice(0, slash + 1) : '') + opts[0];
      input.value = parts.join(' ') + (opts[0].endsWith('/') ? '' : ' ');
    } else if (opts.length > 1) text(opts.join('  '));
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = '';
    run(v);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); complete(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi] || ''; }
    if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
    if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
    if (e.key === 'c' && e.ctrlKey) { e.preventDefault(); print(`${ps1()} ${esc(input.value)}^C`, 'term__cmd'); input.value = ''; }
  });
  out.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });

  return {
    onOpen() {
      root.querySelector('.term__ps1').innerHTML = ps1();
      if (!booted) {
        booted = true;
        print(`<span class="term__h">vdh.ai shell v2.0</span>, last login: ${new Date().toDateString()} from the internet
type <b>help</b> to look around. tab completes. esc closes.`);
      }
      setTimeout(() => input.focus({ preventScroll: true }), 30);
    },
    run,
  };
}
