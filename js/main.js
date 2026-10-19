// ============================================================
// React Universe — interações (módulo principal)
// A cena 3D é carregada dinamicamente; se o CDN falhar, o site
// continua 100% funcional.
// ============================================================

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ---------- tema ----------
const themeToggle = $('#theme-toggle');
const savedTheme = localStorage.getItem('react-universe-theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
const syncThemeBtn = () => {
    themeToggle.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️' : '🌙';
};
syncThemeBtn();
themeToggle.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('react-universe-theme', next);
    syncThemeBtn();
});

// ---------- barra de progresso + opacidade da cena ----------
const progress = $('#progress');
const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const pct = max > 0 ? (scrollY / max) * 100 : 0;
    progress.style.width = pct + '%';
    // cena fica forte no hero e discreta no restante
    const t = Math.min(scrollY / (innerHeight * 0.9), 1);
    const base = document.documentElement.dataset.theme === 'light' ? 0.55 : 0.16;
    document.documentElement.style.setProperty('--scene-opacity', (1 - t * (1 - base)).toFixed(3));
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- dots de navegação + seção ativa ----------
const navSections = $$('section[data-nav]');
const dotsNav = $('#dots');
navSections.forEach(sec => {
    const a = document.createElement('a');
    a.href = '#' + sec.id;
    a.dataset.label = sec.dataset.nav;
    a.setAttribute('aria-label', sec.dataset.nav);
    dotsNav.appendChild(a);
});
const dotLinks = $$('a', dotsNav);
const topLinks = $$('.topnav a');
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        dotLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
        topLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
    });
}, { rootMargin: '-45% 0px -50% 0px' });
navSections.forEach(sec => sectionObserver.observe(sec));

// ---------- reveal on scroll ----------
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });
$$('.reveal').forEach(el => revealObserver.observe(el));

// ---------- contadores animados ----------
const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        counterObserver.unobserve(el);
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        if (prefersReduced) { el.textContent = target + suffix; return; }
        const dur = 1400, start = performance.now();
        const tick = now => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}, { threshold: 0.6 });
$$('.counter').forEach(el => counterObserver.observe(el));

// ---------- typewriter ----------
const typeTarget = $('#typewriter');
const words = ['recrutadores', 'clientes curiosos', 'equipes de produto', 'a sua próxima vaga', 'o mundo inteiro'];
if (prefersReduced) {
    typeTarget.textContent = words.join(' · ');
} else {
    let wi = 0, ci = 0, deleting = false;
    const typeLoop = () => {
        const word = words[wi];
        ci += deleting ? -1 : 1;
        typeTarget.textContent = word.slice(0, ci);
        let delay = deleting ? 45 : 95;
        if (!deleting && ci === word.length) { delay = 1700; deleting = true; }
        else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 350; }
        setTimeout(typeLoop, delay);
    };
    setTimeout(typeLoop, 800);
}

// ---------- tilt 3D nos cards ----------
if (!prefersReduced && matchMedia('(hover: hover)').matches) {
    $$('.tilt').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}

// ---------- roadmap em abas ----------
const phases = [
    {
        name: '1 · Fundação',
        title: 'Fundamentos que sustentam tudo',
        time: '2–4 semanas', level: 'Iniciante',
        items: [
            'HTML semântico, CSS moderno (Grid, Flexbox, custom properties) e JavaScript ES2023.',
            'Git e GitHub: commit diário, branches simples, PRs mesmo em projeto solo.',
            'Defina público, objetivos e 3 referências de design antes de abrir o editor.'
        ],
        deliver: ['Entregável', 'Um site estático publicado (pode ser só HTML/CSS) + repositório GitHub com histórico limpo.']
    },
    {
        name: '2 · React',
        title: 'React na prática: componentes e estado',
        time: '3–5 semanas', level: 'Júnior',
        items: [
            'JSX, props, listas com key e eventos — recrie uma UI que você gosta de usar.',
            'useState para estado local e useEffect para dados assíncronos.',
            'Entenda o ciclo de render: o que faz o React redesenhar a tela?'
        ],
        deliver: ['Entregável', 'SPA com 3+ telas, dados de API real (ex.: PokeAPI) e tratamento de loading/erro.']
    },
    {
        name: '3 · Ecossistema',
        title: 'Ferramentas de produção',
        time: '3–4 semanas', level: 'Júnior → Pleno',
        items: [
            'Vite (build), React Router (páginas) e Tailwind ou CSS Modules (estilo).',
            'TypeScript em modo gradual: comece tipando props e APIs.',
            'Estado global só quando precisar: Context, Zustand ou React Query.'
        ],
        deliver: ['Entregável', 'Projetos com TypeScript, roteamento e padrão de pastas escalável (features/ ou atomic design).']
    },
    {
        name: '4 · Produto real',
        title: 'Projetos com problema, solução e resultado',
        time: '4–8 semanas', level: 'Pleno',
        items: [
            'Integre autenticação, banco de dados e upload de arquivos em ao menos um app.',
            'Escreva README impecável: problema, stack, como rodar, screenshots, demo ao vivo.',
            'Testes: ao mínimo, testes de fluxo crítico com Vitest + Testing Library.'
        ],
        deliver: ['Entregável', '1 app full-stack no ar + estudo de caso escrito (formato: contexto → decisões → resultado).']
    },
    {
        name: '5 · Marca pessoal',
        title: 'Distribuição: o mundo precisa ver',
        time: 'Contínuo', level: 'Todos os níveis',
        items: [
            'Portfólio no ar com domínio próprio, SEO técnico e analytics (plausible ou GA4).',
            'LinkedIn e GitHub sincronizados: o mesmo projeto vive em 3 lugares.',
            'Rotina: 1 post técnico/semana, 1 projeto novo ou revisto/trimestre.'
        ],
        deliver: ['Entregável', 'Funil completo: conteúdo → visitante → contato → oportunidade, com métricas para otimizar.']
    }
];
const tabsWrap = $('#roadmap-tabs');
const phasePanel = $('#phase-panel');
const renderPhase = i => {
    const p = phases[i];
    phasePanel.innerHTML = `
        <div>
            <h3>${p.title}</h3>
            <div class="phase-meta"><span>⏱ ${p.time}</span><span>📈 ${p.level}</span></div>
            <ul>${p.items.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
        <div class="deliverable"><strong>${p.deliver[0]}</strong><p>${p.deliver[1]}</p></div>`;
    $$('.tab', tabsWrap).forEach((t, j) => t.classList.toggle('active', j === i));
};
phases.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'tab';
    btn.textContent = p.name;
    btn.setAttribute('role', 'tab');
    btn.addEventListener('click', () => renderPhase(i));
    tabsWrap.appendChild(btn);
});
renderPhase(0);

// ---------- terminal interativo ----------
const termLines = [
    { c: 1, t: '# 1. criar o projeto com Vite + React' },
    { c: 1, t: 'npm create vite@latest meu-portfolio -- --template react-ts' },
    { c: 0, t: 'Scaffolding project in ./meu-portfolio...' },
    { c: 1, t: 'cd meu-portfolio && npm install' },
    { c: 0, t: 'added 241 packages in 6s' },
    { c: 1, t: '# 2. qualidade de código desde o 1º commit' },
    { c: 1, t: 'npm i -D eslint prettier lint-staged' },
    { c: 1, t: 'npm run dev' },
    { c: 0, t: '  VITE v6 ready in 412 ms', ok: 1 },
    { c: 0, t: '  ➜  Local:   http://localhost:5173/', ok: 1 },
    { c: 0, t: '  ➜  Network: use --host para expor na rede', ok: 1 }
];
const termOut = $('#term-out');
let termRunning = false;
const runTerminal = async () => {
    if (termRunning) return;
    termRunning = true;
    termOut.innerHTML = '';
    for (const line of termLines) {
        const span = document.createElement('span');
        termOut.appendChild(span);
        if (line.c) {
            span.className = 'prompt';
            span.textContent = '$ ';
            for (const ch of line.t) {
                span.textContent += ch;
                await new Promise(r => setTimeout(r, prefersReduced ? 0 : 16));
            }
            await new Promise(r => setTimeout(r, prefersReduced ? 0 : 260));
        } else {
            span.className = line.ok ? 'ok' : 'comment';
            span.textContent = line.t + '\n';
            await new Promise(r => setTimeout(r, prefersReduced ? 0 : 140));
        }
    }
    termRunning = false;
};
const termEl = $('#terminal');
const termObserver = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) { runTerminal(); termObserver.disconnect(); }
}, { threshold: 0.4 });
termObserver.observe(termEl);
termEl.addEventListener('click', runTerminal);
termEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runTerminal(); } });

// ---------- árvore de componentes ----------
$$('#tree .node').forEach(node => {
    const li = node.closest('li');
    if (!$('ul', li)) return;
    node.addEventListener('click', () => li.classList.toggle('open'));
});

// ---------- demos de Hooks ----------
// useState
let count = 0;
const countOut = $('#count-out');
$$('.counter-demo [data-step]').forEach(btn => btn.addEventListener('click', () => {
    count += Number(btn.dataset.step);
    countOut.textContent = count;
    countOut.animate?.([{ transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 180 });
}));
$('#count-reset').addEventListener('click', () => { count = 0; countOut.textContent = 0; });

// useEffect
const fetchBtn = $('#fetch-btn');
const fetchResult = $('#fetch-result');
fetchBtn.addEventListener('click', () => {
    fetchBtn.disabled = true;
    fetchResult.className = 'fetch-result loading';
    fetchResult.textContent = 'useEffect: buscando dados…';
    setTimeout(() => {
        const failed = Math.random() < 0.25; // 25% de chance de erro, de propósito
        if (failed) {
            fetchResult.className = 'fetch-result error';
            fetchResult.textContent = '✗ Erro 500 — sempre trate o caminho do erro também!';
        } else {
            const users = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton'];
            const u = users[Math.floor(Math.random() * users.length)];
            fetchResult.className = 'fetch-result';
            fetchResult.innerHTML = `✓ Dados recebidos: <b style="color:var(--accent)">${u}</b> — cleanup executado antes do novo fetch.`;
        }
        fetchBtn.disabled = false;
    }, 1200);
});

// useContext
const ctxDemo = $('#ctx-demo');
$('#ctx-toggle').addEventListener('click', () => ctxDemo.classList.toggle('light-demo'));

// ---------- filtro de projetos ----------
$$('#filter-bar .chip').forEach(chip => {
    chip.addEventListener('click', () => {
        $$('#filter-bar .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const f = chip.dataset.filter;
        $$('.proj').forEach(card => {
            card.classList.toggle('hidden', f !== 'all' && card.dataset.cat !== f);
        });
    });
});

// ---------- barras de skills e mercado ----------
const barsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        barsObserver.unobserve(entry.target);
        $$('i[data-value]', entry.target).forEach((bar, i) => {
            setTimeout(() => { bar.style.width = bar.dataset.value + '%'; }, prefersReduced ? 0 : i * 120);
        });
    });
}, { threshold: 0.35 });
[$('#bars'), $('#hbars')].forEach(el => el && barsObserver.observe(el));

// ---------- gauges Core Web Vitals ----------
const gaugesObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        gaugesObserver.unobserve(entry.target);
        const g = entry.target;
        const v = Number(g.dataset.value);
        const circle = $('.g-fg', g);
        const circumference = 2 * Math.PI * 52;
        circle.style.strokeDasharray = circumference;
        const offset = circumference * (1 - v / 100);
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
            circle.style.stroke = v >= 88 ? 'var(--good)' : v >= 70 ? 'var(--warn)' : 'var(--bad)';
        }, prefersReduced ? 0 : 200);
    });
}, { threshold: 0.5 });
$$('.gauge').forEach(g => gaugesObserver.observe(g));

// ---------- simulador de deploy ----------
const stages = $$('#pipeline .pipe-stage');
const links = $$('#pipeline .pipe-link');
const pipeMsg = $('#pipe-msg');
let deploying = false;
$$('.plat').forEach(btn => {
    btn.addEventListener('click', async () => {
        if (deploying) return;
        deploying = true;
        $$('.plat').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        stages.forEach(s => s.className = 'pipe-stage');
        links.forEach(l => l.className = 'pipe-link');
        pipeMsg.className = 'pipe-msg';
        pipeMsg.textContent = `> git push → pipeline disparado na ${btn.dataset.name}…`;
        for (let i = 0; i < stages.length; i++) {
            stages[i].classList.add('run');
            await new Promise(r => setTimeout(r, prefersReduced ? 60 : 620));
            stages[i].classList.remove('run');
            stages[i].classList.add('done');
            if (links[i]) links[i].classList.add('filled');
        }
        pipeMsg.className = 'pipe-msg success';
        pipeMsg.textContent = `✔ Deploy concluído! https://${btn.dataset.url} — SSL automático, CDN quente, zero downtime.`;
        deploying = false;
    });
});

// ---------- quiz ----------
const questions = [
    {
        q: 'Quantos projetos no portfólio têm estudo de caso completo (problema → solução → resultado)?',
        opts: [['Nenhum ou só prints', 0], ['1 ou 2 assim', 1], ['3 ou mais, todos assim', 2]]
    },
    {
        q: 'Você mediu quanto tempo o site leva para carregar em uma conexão 4G?',
        opts: [['Nunca medi', 0], ['Medi uma vez, faz tempo', 1], ['Sim — Lighthouse ≥ 90 e monitoro', 2]]
    },
    {
        q: 'O portfólio está em domínio próprio com HTTPS?',
        opts: [['Não, ainda é local', 0], ['Só o domínio gratuito da plataforma', 1], ['Sim, domínio próprio configurado', 2]]
    },
    {
        q: 'Como está o site no celular e em redes lentas?',
        opts: [['Nunca testei', 0], ['Testei de vez em quando', 1], ['Testo sempre, inclusive modo anônimo', 2]]
    },
    {
        q: 'Você recebeu feedback de alguém de fora (dev sênior, mentor, RH) nos últimos 30 dias?',
        opts: [['Não recebi', 0], ['Já recebi, mas não implementei', 1], ['Recebi e já apliquei', 2]]
    }
];
const quizBody = $('#quiz-body');
const quizBar = $('#quiz-progress-bar');
let qi = 0, score = 0;
const renderQuestion = () => {
    const q = questions[qi];
    quizBar.style.width = (qi / questions.length) * 100 + '%';
    quizBody.innerHTML = `
        <h3>${q.q}</h3>
        <div class="quiz-opts">
            ${q.opts.map((o, i) => `<button class="quiz-opt" data-score="${o[1]}">${o[0]}</button>`).join('')}
        </div>
        <p class="tiny-note">Pergunta ${qi + 1} de ${questions.length}</p>`;
    $$('.quiz-opt', quizBody).forEach(btn => btn.addEventListener('click', () => {
        score += Number(btn.dataset.score);
        qi++;
        qi < questions.length ? renderQuestion() : renderResult();
    }));
};
const renderResult = () => {
    quizBar.style.width = '100%';
    const pct = Math.round((score / (questions.length * 2)) * 100);
    let title, msg, cta;
    if (pct < 40) {
        title = '🌒 Despertando'; msg = 'Seu portfólio ainda é um rascunho — e tudo bem. Escolha UM projeto real, escreva o estudo de caso e publique. Progresso bate perfeição.'; cta = '#checklist';
    } else if (pct < 75) {
        title = '🚀 Em órbita'; msg = 'A base está boa! Agora é velocidade e detalhe: domínio próprio, Lighthouse ≥ 90 e métricas reais nos seus cases.'; cta = '#performance';
    } else {
        title = '⭐ Pronto para recrutadores'; msg = 'Nível alto! Para ir além, foque em distribuição: conteúdo no LinkedIn, novos projetos trimestrais e networking ativo.'; cta = '#carreira';
    }
    quizBody.innerHTML = `
        <div class="quiz-result">
            <div class="quiz-ring">
                <svg viewBox="0 0 140 140" width="150" height="150">
                    <circle class="qr-bg" cx="70" cy="70" r="60"/>
                    <circle class="qr-fg" cx="70" cy="70" r="60"/>
                </svg>
                <strong>${pct}</strong>
            </div>
            <h3>${title}</h3>
            <p>${msg}</p>
            <a class="btn primary" href="${cta}">Ver meu próximo passo</a>
            <button class="btn ghost" id="quiz-retry" style="margin-left:10px">Refazer</button>
        </div>`;
    const fg = $('.qr-fg');
    const circ = 2 * Math.PI * 60;
    fg.style.strokeDasharray = circ;
    requestAnimationFrame(() => { fg.style.strokeDashoffset = circ * (1 - pct / 100); });
    $('#quiz-retry').addEventListener('click', () => { qi = 0; score = 0; renderQuestion(); });
};
renderQuestion();

// ---------- checklist com localStorage ----------
const CHECK_KEY = 'react-universe-checklist-v1';
const checkboxes = $$('#checklist-items input');
const checkBar = $('#check-progress-bar');
const checkLabel = $('#check-progress-label');
const savedChecks = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}');
const updateCheckProgress = () => {
    const done = checkboxes.filter(c => c.checked).length;
    checkBar.style.width = (done / checkboxes.length) * 100 + '%';
    checkLabel.textContent = `${done}/${checkboxes.length}` + (done === checkboxes.length ? ' 🎉' : '');
};
checkboxes.forEach(box => {
    if (savedChecks[box.dataset.key]) box.checked = true;
    box.addEventListener('change', () => {
        savedChecks[box.dataset.key] = box.checked;
        localStorage.setItem(CHECK_KEY, JSON.stringify(savedChecks));
        updateCheckProgress();
    });
});
updateCheckProgress();

// ---------- easter egg: tecla "R" pulsa o átomo 3D ----------
addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
        window.dispatchEvent(new CustomEvent('react-boom'));
    }
});

// ---------- cena 3D (Three.js via CDN, com fallback) ----------
if (!prefersReduced) {
    const startScene = () => {
        if (typeof window.__initScene === 'function') {
            try { window.__initScene($('#scene3d')); } catch (e) { $('#scene3d').style.display = 'none'; }
        } else {
            $('#scene3d').style.display = 'none'; // CDN indisponível: página segue de pé
        }
    };
    // scripts usam defer: garante que tudo já executou
    if (document.readyState === 'complete') startScene();
    else addEventListener('load', startScene);
}
