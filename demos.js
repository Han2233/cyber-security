/* ==========================================================================
   网络安全概述 —— 交互演示脚本
   原生 JavaScript，零依赖，离线可用。
   6 个演示：CIA 判断 / 凯撒密码 / 密钥数量 / 关系图 / 数字签名动画 / 全章自测
   ========================================================================== */

const fmt = (v, d = 2) => Number(v).toFixed(d);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

/* ============================================================
   演示 1：CIA 情景判断（10 题）
   ============================================================ */
(function () {
  const boxEl = document.getElementById('cia-box');
  const submitBtn = document.getElementById('cia-submit');
  const resetBtn = document.getElementById('cia-reset');
  const scoreEl = document.getElementById('cia-score');

  const QUESTIONS = [
    { q: 'A hacker steals and publishes patients\' medical records.', ans: 'C', exp: 'Records accessed by unauthorized parties → Confidentiality is broken (information should be accessible only to authorized entities).' },
    { q: 'The payee account on a bank transfer page was replaced by an attacker.', ans: 'I', exp: 'Unauthorized modification of data → Integrity is broken (data integrity).' },
    { q: 'Ransomware encrypted all company files and business came to a halt.', ans: 'A', exp: 'Files unavailable when needed → Availability is broken.' },
    { q: 'A DDoS attack made the online exam system inaccessible.', ans: 'A', exp: 'Denial of service targets Availability: the system must be available to authorized entities when needed.' },
    { q: 'An employee secretly sold the customer list to a competitor.', ans: 'C', exp: 'The list was disclosed to unauthorized parties → Confidentiality (insider threat).' },
    { q: 'An attacker changed "approve the refund" to "reject the refund" in an email.', ans: 'I', exp: 'Message content was tampered with → Integrity.' },
    { q: 'A server room air-conditioning failure caused servers to overheat and shut down.', ans: 'A', exp: 'Systems unavailable → Availability. Note: threats can be non-human (equipment failure, natural disaster).' },
    { q: 'A hacker posted a fake closure notice on the official website.', ans: 'I', exp: 'Unauthorized modification of official content → Integrity, also involving Authenticity.' },
    { q: 'A courier peeked at the full phone numbers printed on parcels.', ans: 'C', exp: 'Personal information viewed by unauthorized person → Confidentiality and Privacy.' },
    { q: 'An administrator mistakenly dropped the orders table and there was no backup.', ans: 'A', exp: 'Data permanently lost and unusable → Availability (a reminder of why backups matter).' },
  ];

  const st = { answered: false, wrong: new Set(), user: {} };

  function render() {
    boxEl.innerHTML = QUESTIONS.map((q, i) =>
      '<div class="quiz-q" id="cia-' + i + '" data-qi="' + i + '">' +
      '<div class="qtext">第 ' + (i + 1) + ' 题：' + esc(q.q) + ' —— 主要破坏？</div>' +
      [['C', '机密性 Confidentiality'], ['I', '完整性 Integrity'], ['A', '可用性 Availability']]
        .map(([v, lab]) =>
          '<label class="opt"><input type="radio" name="ciaq' + i + '" value="' + v + '"' +
          (st.user[i] === v ? ' checked' : '') + '> ' + lab + '</label>'
        ).join('') +
      '<div class="quiz-explain"><b>解析：</b>' + esc(q.exp) + '</div>' +
      '</div>'
    ).join('');
    scoreEl.style.display = 'none';
    st.answered = false;
  }

  boxEl.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    const i = parseInt(e.target.closest('.quiz-q').dataset.qi, 10);
    st.user[i] = e.target.value;
  });

  submitBtn.addEventListener('click', () => {
    if (st.answered) return;
    let correct = 0;
    st.wrong = new Set();
    QUESTIONS.forEach((q, i) => {
      const el = document.getElementById('cia-' + i);
      el.classList.add('done');
      const opts = el.querySelectorAll('label.opt');
      opts.forEach((lab, k) => { if (k === 0) {} });
      const ansIdx = ['C', 'I', 'A'].indexOf(q.ans);
      opts[ansIdx].classList.add('correct');
      if (st.user[i] === q.ans) correct++;
      else {
        st.wrong.add(i);
        const chose = ['C', 'I', 'A'].indexOf(st.user[i]);
        if (chose >= 0) opts[chose].classList.add('wrong');
      }
    });
    st.answered = true;
    const pct = correct / QUESTIONS.length;
    scoreEl.style.display = 'block';
    scoreEl.innerHTML = '得分：<b>' + correct + ' / ' + QUESTIONS.length + '</b>　正确率 ' + fmt(pct * 100, 0) + '%' +
      '<div class="bar"><div class="fill" style="width:' + fmt(pct * 100, 0) + '%"></div></div>' +
      '<div style="font-size:14px;color:var(--ink-soft);margin-top:8px">' +
      (pct >= 0.9 ? 'CIA 三性已完全掌握！' : pct >= 0.7 ? '不错，回看第 2 章把混淆的场景再理一遍。' : '建议重读第 2 章的对比表：机密=泄密、完整=篡改、可用=瘫痪。') + '</div>';
  });

  resetBtn.addEventListener('click', () => { st.user = {}; render(); });
  render();
})();

/* ============================================================
   演示 2：凯撒密码实验室
   原理：C = (P + K) mod 26，密钥空间只有 25 种 —— 直观感受「密钥太小不安全」
   ============================================================ */
(function () {
  const textEl = document.getElementById('cs-text');
  const shiftEl = document.getElementById('cs-shift');
  const shiftVal = document.getElementById('cs-shift-val');
  const encBtn = document.getElementById('cs-enc');
  const decBtn = document.getElementById('cs-dec');
  const outEl = document.getElementById('cs-out');
  const mapEl = document.getElementById('cs-map');

  // 只处理英文字母，其他字符原样保留
  function transform(text, k) {
    return text.toUpperCase().split('').map((ch) => {
      if (ch >= 'A' && ch <= 'Z') {
        return String.fromCharCode(65 + ((ch.charCodeAt(0) - 65 + k + 26) % 26));
      }
      return ch;
    }).join('');
  }

  function show(k) {
    const src = textEl.value.toUpperCase();
    const out = transform(src, k);
    outEl.textContent = out || '（输入为空）';
    // 映射表：只列出输入中出现过的字母，直观展示「每个字母如何平移」
    const seen = new Set(src.split('').filter((c) => c >= 'A' && c <= 'Z'));
    mapEl.innerHTML = Array.from(seen).sort().map((c) =>
      '<span class="m">' + c + ' &#8594; ' + transform(c, k) + '</span>'
    ).join('');
    if (k === 13) {
      outEl.textContent += '　← ROT13：位移 13 时加密=解密（自反变换）';
    }
  }

  shiftEl.addEventListener('input', () => {
    shiftVal.textContent = shiftEl.value;
    show(parseInt(shiftEl.value, 10));
  });
  encBtn.addEventListener('click', () => show(parseInt(shiftEl.value, 10)));
  decBtn.addEventListener('click', () => show(-parseInt(shiftEl.value, 10)));
  textEl.addEventListener('input', () => show(parseInt(shiftEl.value, 10)));

  shiftVal.textContent = '3';
  show(3);
})();

/* ============================================================
   演示 3：密钥数量计算器
   对称：n(n−1)/2；非对称：n 对（2n 个密钥）
   ============================================================ */
(function () {
  const nEl = document.getElementById('kc-n');
  const nVal = document.getElementById('kc-n-val');
  const infoEl = document.getElementById('kc-info');

  function update() {
    const n = parseInt(nEl.value, 10);
    nVal.textContent = n;
    const sym = n * (n - 1) / 2;
    infoEl.innerHTML =
      '<b>对称加密：</b>' + n + ' 人两两安全通信需要 <b>' + sym + '</b> 把共享密钥' +
      '（公式 n(n−1)/2 = ' + n + '×' + (n - 1) + '÷2）。' +
      '每新增一个人，要和新老所有人各建一把新密钥，且每把都要安全分发——这就是「密钥分发与管理难题」。<br>' +
      '<b>非对称加密：</b>同样 ' + n + ' 人只需要 <b>' + n + ' 对</b>密钥（每人一对公私钥，共 ' + (2 * n) + ' 个）。' +
      '公钥可以直接公开，无需秘密分发——密钥管理简单得多，代价是运算慢。' +
      (n >= 20 ? '<br><b style="color:#dc2626">看！对称密钥数已经爆炸（' + sym + '），现实中靠「非对称分发会话密钥 + 对称加密数据」的混合方案解决。</b>' : '');
  }

  nEl.addEventListener('input', update);
  update();
})();

/* ============================================================
   演示 4：攻击·威胁·风险关系图（点击节点看定义）
   ============================================================ */
(function () {
  const box = document.getElementById('rel-detail');
  const svg = document.querySelector('.rel-box svg');
  const els = svg.querySelectorAll('.rel-el');

  const DETAILS = [
    { t: '威胁主体 Threat Agent', x: '制造威胁的主体：黑客、恶意内部员工、甚至自然灾害。没有威胁主体，威胁只是「潜在可能」。' },
    { t: '威胁 Threat', x: '具有潜在违反安全可能的一组情形。分两类：人为（人为失误、黑客）与非人为（软件缺陷、自然灾害）。' },
    { t: '脆弱性 Vulnerability', x: '安全系统中的弱点——如软件缺陷、配置错误、弱口令。威胁「利用」（exploits）脆弱性才会成事。' },
    { t: '安全攻击 Attack', x: '任何危及组织所拥有信息安全的行为。威胁主体利用脆弱性 → 导致安全攻击（课件核心关系句）。' },
    { t: '资产 Assets', x: '组织拥有的有价值事物：数据、系统、声誉等。攻击「损害」（damages）资产，资产「暴露」（exposure）产生风险。' },
    { t: '风险 Risk', x: '资产暴露后「可能造成」的损失与影响。风险管理就是围绕它做文章：评估 → 策略 → 实施 → 监控 → 审计。' },
  ];

  box.addEventListener('click', (e) => {
    const el = e.target.closest('.rel-el');
    if (!el) return;
    // 高亮当前节点，其余恢复默认
    els.forEach((n) => {
      const active = n === el;
      n.setAttribute('stroke-width', active ? '4' : '2');
      n.setAttribute('stroke', active ? '#047857' : '#94a3b8');
    });
    const d = DETAILS[parseInt(el.dataset.idx, 10)];
    box.innerHTML = '<b>' + d.t + '：</b>' + esc(d.x);
  });
})();

/* ============================================================
   演示 5：数字签名分步动画
   两种模式：只签名（无机密性）/ 签名+加密（有机密性）
   SVG 由 JS 生成，点「下一步」逐步点亮节点
   ============================================================ */
(function () {
  const box = document.getElementById('ds-box');
  const tab1 = document.getElementById('ds-tab1');
  const tab2 = document.getElementById('ds-tab2');
  const nextBtn = document.getElementById('ds-next');
  const resetBtn = document.getElementById('ds-reset');
  const infoEl = document.getElementById('ds-info');
  const NS = 'http://www.w3.org/2000/svg';

  // ---- 模式一：只签名（无机密性） ----
  const MODE1 = {
    nodes: [
      { id: 'p', x: 20, y: 40, w: 150, h: 52, label: '消息 P', sub: 'Message', color: '#ecfdf5' },
      { id: 'h', x: 230, y: 40, w: 150, h: 52, label: '哈希值 H', sub: 'SHA-2(P)', color: '#eff6ff' },
      { id: 's', x: 440, y: 40, w: 190, h: 52, label: '数字签名 S', sub: 'RSA + Alice 私钥', color: '#f5f3ff' },
      { id: 'send', x: 690, y: 40, w: 150, h: 52, label: '发送 P + S', sub: '给 Bob', color: '#fffbeb' },
      { id: 'h1', x: 230, y: 220, w: 150, h: 52, label: '哈希值 H1', sub: 'SHA-2(收到的 P)', color: '#eff6ff' },
      { id: 'h2', x: 440, y: 220, w: 190, h: 52, label: '解密 S 得 H2', sub: 'RSA + Alice 公钥', color: '#f5f3ff' },
      { id: 'cmp', x: 690, y: 220, w: 150, h: 52, label: '比较 H1 = H2 ?', sub: '相等→接受 / 不等→拒绝', color: '#fff1f2' },
    ],
    edges: [
      { a: 'p', b: 'h', label: 'SHA-2' },
      { a: 'h', b: 's', label: '私钥加密' },
      { a: 's', b: 'send', label: '' },
      { a: 'p', b: 'h1', label: 'Bob 重算' },
      { a: 's', b: 'h2', label: '公钥解密' },
      { a: 'h1', b: 'cmp', label: '' },
      { a: 'h2', b: 'cmp', label: '' },
    ],
    steps: [
      { text: '① Alice 对消息 P 计算哈希值 H = SHA-2(P)（得到「指纹」）', on: ['p', 'h'] },
      { text: '② Alice 用自己的私钥对 H 做 RSA 运算，生成数字签名 S（盖章）', on: ['s'] },
      { text: '③ Alice 把 P 和 S 一起发送给 Bob', on: ['send'] },
      { text: '④ Bob 对收到的 P 重新计算哈希值 H1', on: ['h1'] },
      { text: '⑤ Bob 用 Alice 的公钥对 S 解密，得到 H2', on: ['h2'] },
      { text: '⑥ Bob 比较 H1 与 H2：相等 → Accept；不等 → Reject', on: ['cmp'] },
    ],
  };

  // ---- 模式二：签名 + 加密（有机密性） ----
  const MODE2 = {
    nodes: [
      { id: 'p', x: 20, y: 30, w: 150, h: 50, label: '消息 P', sub: 'Message', color: '#ecfdf5' },
      { id: 'h', x: 210, y: 30, w: 150, h: 50, label: '哈希值 H', sub: 'SHA-2(P)', color: '#eff6ff' },
      { id: 's', x: 400, y: 30, w: 190, h: 50, label: '签名 S', sub: 'RSA + Alice 私钥', color: '#f5f3ff' },
      { id: 'k', x: 20, y: 130, w: 150, h: 50, label: '会话密钥 K', sub: '随机生成 Session Key', color: '#fffbeb' },
      { id: 'c', x: 210, y: 130, w: 150, h: 50, label: '密文 C', sub: 'AES 加密 P', color: '#ecfdf5' },
      { id: 'k2', x: 400, y: 130, w: 190, h: 50, label: '加密的 K', sub: 'RSA + Bob 公钥', color: '#f5f3ff' },
      { id: 'send', x: 630, y: 80, w: 200, h: 50, label: '发送 C + S + 加密K', sub: '给 Bob', color: '#fffbeb' },
      { id: 'bk', x: 630, y: 170, w: 200, h: 50, label: '解出 K', sub: 'RSA + Bob 私钥', color: '#f5f3ff' },
      { id: 'bp', x: 630, y: 260, w: 200, h: 50, label: '解密出 P', sub: 'AES 用 K 解密 C', color: '#ecfdf5' },
      { id: 'bh', x: 380, y: 270, w: 160, h: 50, label: 'H1 = SHA-2(P)', sub: '重算哈希', color: '#eff6ff' },
      { id: 'bh2', x: 380, y: 350, w: 160, h: 50, label: 'H2 = 解密 S', sub: 'RSA + Alice 公钥', color: '#f5f3ff' },
      { id: 'cmp', x: 590, y: 340, w: 180, h: 50, label: 'H1 = H2 ?', sub: '接受 / 拒绝', color: '#fff1f2' },
    ],
    edges: [
      { a: 'p', b: 'h', label: 'SHA-2' },
      { a: 'h', b: 's', label: '私钥加密' },
      { a: 'p', b: 'c', label: '' },
      { a: 'k', b: 'c', label: 'AES' },
      { a: 'k', b: 'k2', label: 'Bob 公钥' },
      { a: 's', b: 'send', label: '' },
      { a: 'c', b: 'send', label: '' },
      { a: 'k2', b: 'send', label: '' },
      { a: 'send', b: 'bk', label: '' },
      { a: 'bk', b: 'bp', label: '' },
      { a: 'bp', b: 'bh', label: 'SHA-2' },
      { a: 's', b: 'bh2', label: '' },
      { a: 'bh', b: 'cmp', label: '' },
      { a: 'bh2', b: 'cmp', label: '' },
    ],
    steps: [
      { text: '① Alice 生成随机会话密钥 K（Session Key）', on: ['k'] },
      { text: '② Alice 签名：H = SHA-2(P)，再用自己私钥加密 H 得 S', on: ['p', 'h', 's'] },
      { text: '③ 用对称算法 AES + K 加密消息 P → 密文 C（快）', on: ['c'] },
      { text: '④ 用 Bob 的公钥（RSA）加密 K（只加密小小的密钥，慢一点没关系）', on: ['k2'] },
      { text: '⑤ 把 C + S + 加密后的 K 一起发给 Bob', on: ['send'] },
      { text: '⑥ Bob 用自己的私钥解出 K', on: ['bk'] },
      { text: '⑦ Bob 用 K 解密 C → 得到 P', on: ['bp'] },
      { text: '⑧ Bob 验证签名：H1 = SHA-2(P)；用 Alice 公钥解密 S 得 H2', on: ['bh', 'bh2'] },
      { text: '⑨ 比较 H1 与 H2：相等 → Accept，不等 → Reject', on: ['cmp'] },
    ],
  };

  let mode = 1, step = -1;
  const nodeEls = {}, edgeEls = {};

  function build() {
    const m = mode === 1 ? MODE1 : MODE2;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 860 400');
    svg.setAttribute('style', 'width:100%;height:auto');

    // 先画边（线在节点下层），每条边给一个编号
    m.edges.forEach((e, i) => {
      const a = m.nodes.find((n) => n.id === e.a);
      const b = m.nodes.find((n) => n.id === e.b);
      const line = document.createElementNS(NS, 'line');
      const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
      line.setAttribute('x1', ax); line.setAttribute('y1', ay);
      line.setAttribute('x2', bx); line.setAttribute('y2', by);
      line.setAttribute('stroke', '#cbd5e1');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('class', 'ds-edge');
      svg.appendChild(line);
      edgeEls[i] = line;
      if (e.label) {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', (ax + bx) / 2);
        t.setAttribute('y', (ay + by) / 2 - 6);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-size', '11');
        t.setAttribute('fill', '#64748b');
        t.textContent = e.label;
        svg.appendChild(t);
      }
    });

    // 节点
    m.nodes.forEach((n) => {
      const g = document.createElementNS(NS, 'g');
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', n.x); r.setAttribute('y', n.y);
      r.setAttribute('width', n.w); r.setAttribute('height', n.h);
      r.setAttribute('rx', '10');
      r.setAttribute('fill', n.color);
      r.setAttribute('stroke', '#94a3b8');
      r.setAttribute('stroke-width', '2');
      r.setAttribute('class', 'ds-node');
      const t1 = document.createElementNS(NS, 'text');
      t1.setAttribute('x', n.x + n.w / 2); t1.setAttribute('y', n.y + n.h / 2 - 4);
      t1.setAttribute('text-anchor', 'middle');
      t1.setAttribute('font-size', '13'); t1.setAttribute('font-weight', '700');
      t1.setAttribute('fill', '#1e293b');
      t1.textContent = n.label;
      const t2 = document.createElementNS(NS, 'text');
      t2.setAttribute('x', n.x + n.w / 2); t2.setAttribute('y', n.y + n.h / 2 + 16);
      t2.setAttribute('text-anchor', 'middle');
      t2.setAttribute('font-size', '11'); t2.setAttribute('fill', '#64748b');
      t2.textContent = n.sub;
      g.appendChild(r); g.appendChild(t1); g.appendChild(t2);
      svg.appendChild(g);
      nodeEls[n.id] = { r, t1 };
    });

    box.innerHTML = '';
    box.appendChild(svg);
  }

  function highlight(ids) {
    Object.values(nodeEls).forEach((n) => { n.r.classList.remove('active'); });
    Object.values(edgeEls).forEach((e) => { e.classList.remove('active'); });
    if (!ids) return;
    ids.forEach((id) => {
      if (nodeEls[id]) nodeEls[id].r.classList.add('active');
    });
  }

  function renderStep() {
    const m = mode === 1 ? MODE1 : MODE2;
    if (step < 0) {
      infoEl.innerHTML = '点击「下一步」开始' + (mode === 1 ? '（无机密性：只签名与验证）' : '（有机密性：签名 + 加密全流程）');
      highlight(null);
      return;
    }
    const s = m.steps[step];
    infoEl.innerHTML = s.text;
    highlight(s.on);
  }

  function switchMode(m2) {
    mode = m2;
    step = -1;
    tab1.classList.toggle('on', mode === 1);
    tab2.classList.toggle('on', mode === 2);
    build();
    renderStep();
  }

  nextBtn.addEventListener('click', () => {
    const m = mode === 1 ? MODE1 : MODE2;
    if (step < m.steps.length - 1) step++;
    renderStep();
  });
  resetBtn.addEventListener('click', () => { step = -1; renderStep(); });
  tab1.addEventListener('click', () => switchMode(1));
  tab2.addEventListener('click', () => switchMode(2));

  switchMode(1);
})();

/* ============================================================
   演示 6：全章自测（18 题）
   ============================================================ */
(function () {
  const boxEl = document.getElementById('quiz-box');
  const submitBtn = document.getElementById('quiz-submit');
  const resetBtn = document.getElementById('quiz-reset');
  const wrongBtn = document.getElementById('quiz-wrong');
  const scoreEl = document.getElementById('quiz-score');

  const QUESTIONS = [
    { q: 'According to NIST, cybersecurity is the ability to protect or defend (　) from cyber attacks.', opts: ['A. network devices', 'B. the use of cyberspace', 'C. database systems', 'D. cryptographic algorithms'], ans: 1, exp: 'NIST: "The ability to protect or defend the use of cyberspace from cyber attacks".' },
    { q: 'In ISO/IEC 27032, cybersecurity is the preservation of (　) of information in the Cyberspace.', opts: ['A. confidentiality, integrity and availability', 'B. speed, capacity and cost', 'C. authentication, authorization and auditing', 'D. encryption, signature and hashing'], ans: 0, exp: 'ISO/IEC 27032 directly refers to the C.I.A triad.' },
    { q: '"The customer list was leaked to a competitor" mainly breaks:', opts: ['A. Confidentiality', 'B. Integrity', 'C. Availability', 'D. Accountability'], ans: 0, exp: 'Information accessed by unauthorized entities → Confidentiality.' },
    { q: '"A bank transfer amount was tampered with" mainly breaks:', opts: ['A. Confidentiality', 'B. Integrity', 'C. Availability', 'D. Privacy'], ans: 1, exp: 'Unauthorized modification → Integrity (data integrity).' },
    { q: '"A DDoS attack took the website down" mainly breaks:', opts: ['A. Confidentiality', 'B. Integrity', 'C. Availability', 'D. Authenticity'], ans: 2, exp: 'Not available when needed → Availability. DoS is a typical availability attack.' },
    { q: 'Which of the following is an ACTIVE attack?', opts: ['A. Traffic analysis', 'B. Eavesdropping on message content', 'C. Replay', 'D. Monitoring transmissions'], ans: 2, exp: 'Active: masquerade, replay, modification, DoS. Passive: message content, traffic analysis.' },
    { q: 'Which one is NOT among the five major categories of X.800 security services?', opts: ['A. Authentication', 'B. Access control', 'C. Data confidentiality', 'D. Availability'], ans: 3, exp: 'The five: Authentication, Access control, Data confidentiality, Data integrity, Non-repudiation — no Availability (a classic trap).' },
    { q: 'For n entities communicating pairwise with symmetric encryption, how many shared keys are needed in total?', opts: ['A. n', 'B. n²', 'C. n(n−1)/2', 'D. 2n'], ans: 2, exp: 'One key per pair: C(n,2) = n(n−1)/2 — the key distribution and management problem.' },
    { q: 'Which key size (in bits) is NOT supported by AES?', opts: ['A. 128', 'B. 192', 'C. 256', 'D. 320'], ans: 3, exp: 'AES supports 128 / 192 / 256 bits.' },
    { q: 'The security of RSA is based on which mathematical problem?', opts: ['A. Integer factorization', 'B. Discrete logarithm', 'C. Elliptic curve discrete logarithm', 'D. Knapsack problem'], ans: 0, exp: 'RSA ← factoring; DSA/DH ← discrete log; ECC ← elliptic curve DL.' },
    { q: 'Encrypting with the sender\'s PRIVATE key (decrypted with the public key) achieves:', opts: ['A. Confidentiality', 'B. Digital signature and non-repudiation', 'C. Availability', 'D. Access control'], ans: 1, exp: 'Only the sender holds the private key → signature / authenticity / non-repudiation. Public-key encryption gives confidentiality.' },
    { q: 'Which is NOT a property of hash functions?', opts: ['A. Fixed-size output', 'B. One-way', 'C. Collision free', 'D. Reversible'], ans: 3, exp: 'Hash functions are one-way (irreversible) with fixed-size outputs and collision resistance.' },
    { q: 'During digital signature verification, H1 computed by Bob does not equal H2 obtained by decrypting S. Bob should:', opts: ['A. Accept', 'B. Reject', 'C. Resend', 'D. Ignore'], ans: 1, exp: 'Hash mismatch means the message was tampered with or the signature is invalid → Reject.' },
    { q: 'Before using a public key from an X.509 certificate, the FIRST verification step is to check:', opts: ['A. the CRL', 'B. the CA\'s signature', 'C. the validity period', 'D. the public key format'], ans: 2, exp: 'Order: validity period → CRL → CA signature → extract public key (steps 1–3 must be done first).' },
    { q: 'In an X.509 PKI, the user\'s identity is bound to his/her public key by:', opts: ['A. A password', 'B. A digital certificate signed by the CA', 'C. An access control list', 'D. A session key'], ans: 1, exp: 'The certificate body contains identity + public key, signed by the CA.' },
    { q: 'The trust model used by PGP is:', opts: ['A. Centralized CA', 'B. Web of trust', 'C. Cross certification', 'D. Hierarchical trust'], ans: 1, exp: 'PGP has no CA; users sign each other\'s certificates (created by Philip Zimmermann).' },
    { q: 'The most reliable choice of product certification is:', opts: ['A. Vendor certification', 'B. Market certification', 'C. User certification', 'D. Independent certification'], ans: 3, exp: 'Independent third parties have no conflict of interest — echoing "functionality does not guarantee security".' },
    { q: 'Cryptanalysis is the mathematical science that deals with:', opts: ['A. Designing cryptographic algorithms', 'B. Breaking cryptographic systems', 'C. Hiding information', 'D. Key management'], ans: 1, exp: 'Cryptography designs, Cryptanalysis breaks, Steganography hides.' },
  ];

  const st = { view: [], answered: false, wrongSet: new Set(), user: {} };

  function render() {
    boxEl.innerHTML = st.view.map((qi, n) => {
      const q = QUESTIONS[qi];
      return '<div class="quiz-q" id="qz-' + qi + '" data-qi="' + qi + '">' +
        '<div class="qtext"><span class="qtag">Q' + (n + 1) + '</span>' + esc(q.q) + '</div>' +
        q.opts.map((o, k) =>
          '<label class="opt"><input type="radio" name="qz-' + qi + '" value="' + k + '"' +
          (st.user[qi] === k ? ' checked' : '') + '> ' + esc(o) + '</label>'
        ).join('') +
        '<div class="quiz-explain"><b>解析：</b>' + esc(q.exp) + '</div>' +
        '</div>';
    }).join('');
    scoreEl.style.display = 'none';
    st.answered = false;
  }

  function grade() {
    let correct = 0;
    st.wrongSet = new Set();
    st.view.forEach((qi) => {
      const q = QUESTIONS[qi];
      const chosen = st.user[qi];
      const el = document.getElementById('qz-' + qi);
      el.classList.add('done');
      const opts = el.querySelectorAll('label.opt');
      opts.forEach((lab, k) => { if (k === q.ans) lab.classList.add('correct'); });
      if (chosen === q.ans) correct++;
      else {
        st.wrongSet.add(qi);
        if (chosen !== undefined) opts[chosen].classList.add('wrong');
      }
    });
    st.answered = true;
    const pct = correct / st.view.length;
    scoreEl.style.display = 'block';
    scoreEl.innerHTML = '得分：<b>' + correct + ' / ' + st.view.length + '</b>　正确率 ' + fmt(pct * 100, 0) + '%' +
      '<div class="bar"><div class="fill" style="width:' + fmt(pct * 100, 0) + '%"></div></div>' +
      '<div style="font-size:14px;color:var(--ink-soft);margin-top:8px">' +
      (pct >= 0.85 ? '概念掌握扎实，可以挑战 Review Exercise Set 1、2 了。' :
       pct >= 0.6 ? '基础不错，把错题对应章节（重点第 5、10、11、12 章）再读一遍。' :
       '建议从头通读一遍，并动手玩一遍所有演示。') + '</div>';
  }

  boxEl.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    const qi = parseInt(e.target.closest('.quiz-q').dataset.qi, 10);
    st.user[qi] = parseInt(e.target.value, 10);
  });

  submitBtn.addEventListener('click', () => { if (!st.answered) grade(); });
  resetBtn.addEventListener('click', () => {
    st.user = {};
    st.view = QUESTIONS.map((_, i) => i);
    render();
  });
  wrongBtn.addEventListener('click', () => {
    if (st.wrongSet.size === 0) {
      scoreEl.style.display = 'block';
      scoreEl.innerHTML = '暂无错题——先交卷一次，错题才会进入错题本。';
      return;
    }
    st.user = {};
    st.view = Array.from(st.wrongSet);
    render();
  });

  st.view = QUESTIONS.map((_, i) => i);
  render();
})();

/* ============================================================
   演示 7：ALE 计算器（Lecture 2）
   SLE = AV × EF；ALE = SLE × ARO；缓解价值 = ALE − (ALE′ + 成本)
   ============================================================ */
(function () {
  const avEl = document.getElementById('ale-av');
  const efEl = document.getElementById('ale-ef');
  const efVal = document.getElementById('ale-ef-val');
  const aroEl = document.getElementById('ale-aro');
  const aroVal = document.getElementById('ale-aro-val');
  const ef2El = document.getElementById('ale-ef2');
  const ef2Val = document.getElementById('ale-ef2-val');
  const costEl = document.getElementById('ale-cost');
  const infoEl = document.getElementById('ale-info');

  const money = (v) => '$' + Math.round(v).toLocaleString('en-US');

  function update() {
    const av = parseFloat(avEl.value.replace(/[,$\s]/g, '')) || 0;
    const ef = parseInt(efEl.value, 10) / 100;
    const aro = parseFloat(aroEl.value);
    const ef2 = parseInt(ef2El.value, 10) / 100;
    const cost = parseFloat(costEl.value.replace(/[,$\s]/g, '')) || 0;

    const sle = av * ef;
    const ale = sle * aro;
    const ale2 = av * ef2 * aro;
    const mitigation = ale - (ale2 + cost);
    const good = mitigation > 0;

    infoEl.innerHTML =
      'SLE = AV × EF = ' + money(av) + ' × ' + fmt(ef * 100, 0) + '% = <b>' + money(sle) + '</b><br>' +
      'ALE = SLE × ARO = ' + money(sle) + ' × ' + aro + ' = <b>' + money(ale) + '</b>（每年期望损失）<br>' +
      '加防护后：ALE′ = ' + money(av) + ' × ' + fmt(ef2 * 100, 0) + '% × ' + aro + ' = <b>' + money(ale2) + '</b><br>' +
      '期望缓解价值 = ALE − (ALE′ + 防护年均成本) = ' + money(ale) + ' − (' + money(ale2) + ' + ' + money(cost) + ') = ' +
      '<b style="color:' + (good ? '#16a34a' : '#dc2626') + '">' + (mitigation >= 0 ? '+' : '−') + money(Math.abs(mitigation)) + '</b>' +
      (good ? '　<b style="color:#16a34a">值得购买防护</b>' : '　<b style="color:#dc2626">防护比风险还贵，考虑其他方案或接受风险</b>');
  }

  efEl.addEventListener('input', () => { efVal.textContent = efEl.value + '%'; update(); });
  aroEl.addEventListener('input', () => { aroVal.textContent = aroEl.value; update(); });
  ef2El.addEventListener('input', () => { ef2Val.textContent = ef2El.value + '%'; update(); });
  avEl.addEventListener('input', update);
  costEl.addEventListener('input', update);
  update();
})();

/* ============================================================
   演示 8：策略层级归类（Lecture 3）
   8 句话归类为 Policy / Standard / Guideline / Procedure
   ============================================================ */
(function () {
  const boxEl = document.getElementById('match-box');
  const submitBtn = document.getElementById('match-submit');
  const resetBtn = document.getElementById('match-reset');
  const scoreEl = document.getElementById('match-score');

  const OPTS = ['Policy', 'Standard', 'Guideline', 'Procedure'];
  const ITEMS = [
    { t: 'Access to and use of departmental computing resources is restricted to authorized persons.', ans: 0, exp: '高层方向声明（restricted to authorized persons）→ Policy。' },
    { t: 'Two-factor authentication mechanism will be used to authenticate users.', ans: 1, exp: '强制性的具体规则（must 语气、指定技术）→ Standard。' },
    { t: 'Passwords/smartcard PINs should consist of at least 8 characters with a mix of alpha, numeric and special characters.', ans: 2, exp: '「should…at least 8 characters」是建议而非强制 → Guideline。' },
    { t: 'Requests for user id and smartcard must be approved and signed by the relevant system owners.', ans: 3, exp: '具体操作步骤与审批流程 → Procedure。' },
    { t: 'Information is an invaluable asset and should be appropriately protected.', ans: 0, exp: '组织安全愿景的高层陈述 → Policy（General Policy 例句）。' },
    { t: 'All company information must be classified into Public or Confidential categories through a formal review process.', ans: 1, exp: '强制性的分类规则（must + 具体类别）→ Standard。' },
    { t: 'It is recommended to review information classification at least once a year.', ans: 2, exp: '「recommended」= 建议 → Guideline。' },
    { t: 'Internal auditors will perform periodic reviews; each department must submit a compliance report by the end of each quarter.', ans: 3, exp: '规定了谁在何时做什么（操作细节）→ Procedure。' },
  ];

  const st = { user: {}, answered: false };

  function render() {
    boxEl.innerHTML = ITEMS.map((it, i) =>
      '<div class="match-q" id="mt-' + i + '" data-mi="' + i + '">' +
      '<div class="mt">' + (i + 1) + '. ' + esc(it.t) + '</div>' +
      '<div class="match-opts">' +
      OPTS.map((o, k) => '<button data-k="' + k + '"' + (st.user[i] === k ? ' class="chosen"' : '') + '>' + o + '</button>').join('') +
      '</div>' +
      '<div class="match-explain"><b>答案：' + OPTS[it.ans] + '</b>　' + esc(it.exp) + '</div>' +
      '</div>'
    ).join('');
    scoreEl.style.display = 'none';
    st.answered = false;
  }

  boxEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-k]');
    if (!btn || st.answered) return;
    const i = parseInt(btn.closest('.match-q').dataset.mi, 10);
    st.user[i] = parseInt(btn.dataset.k, 10);
    const q = document.getElementById('mt-' + i);
    q.querySelectorAll('button').forEach((b) => b.classList.toggle('chosen', b === btn));
  });

  submitBtn.addEventListener('click', () => {
    if (st.answered) return;
    let correct = 0;
    ITEMS.forEach((it, i) => {
      const el = document.getElementById('mt-' + i);
      el.classList.add('done');
      const btns = el.querySelectorAll('button');
      btns.forEach((b, k) => {
        if (k === it.ans) b.classList.add('right');
        if (st.user[i] === k) {
          if (k === it.ans) { correct++; }
          else b.classList.add('wrong');
        }
      });
    });
    st.answered = true;
    const pct = correct / ITEMS.length;
    scoreEl.style.display = 'block';
    scoreEl.innerHTML = '得分：<b>' + correct + ' / ' + ITEMS.length + '</b>　正确率 ' + fmt(pct * 100, 0) + '%' +
      '<div class="bar"><div class="fill" style="width:' + fmt(pct * 100, 0) + '%"></div></div>' +
      '<div style="font-size:14px;color:var(--ink-soft);margin-top:8px">' +
      (pct === 1 ? '完美！层级概念已吃透。' : '提示：must 具体规则=Standard；should/建议=Guideline；审批步骤=Procedure；方向声明=Policy。') + '</div>';
  });

  resetBtn.addEventListener('click', () => { st.user = {}; render(); });
  render();
})();

/* ============================================================
   演示 9：模运算实验室（Lecture 4）
   验证 (a+b) mod n、ab mod n、a^k mod n 的「先取模再算」性质
   ============================================================ */
(function () {
  const aEl = document.getElementById('mod-a');
  const bEl = document.getElementById('mod-b');
  const nEl = document.getElementById('mod-n');
  const kEl = document.getElementById('mod-k');
  const goBtn = document.getElementById('mod-go');
  const infoEl = document.getElementById('mod-info');

  const mod = (x, n) => ((x % n) + n) % n;  // 处理负数：结果恒为非负余数
  const modpow = (base, exp, m) => {
    let r = 1n; base = mod(base, m);
    while (exp > 0n) {
      if (exp % 2n === 1n) r = mod(r * base, m);
      base = mod(base * base, m);
      exp /= 2n;
    }
    return r;
  };

  function calc() {
    const A = BigInt(aEl.value || '0');
    const B = BigInt(bEl.value || '0');
    const N = BigInt(nEl.value || '1');
    const K = BigInt(kEl.value || '1');
    if (N <= 0n) { infoEl.innerHTML = '<b style="color:#dc2626">n 必须为正整数</b>'; return; }

    const sum1 = mod(A + B, N), sum2 = mod(mod(A, N) + mod(B, N), N);
    const prod1 = mod(A * B, N), prod2 = mod(mod(A, N) * mod(B, N), N);
    const pow1 = modpow(A, K, N), pow2 = modpow(mod(A, N), K, N);

    infoEl.innerHTML =
      'a mod n = <b>' + mod(A, N) + '</b>　·　b mod n = <b>' + mod(B, N) + '</b><br>' +
      '(a + b) mod n = <b>' + sum1 + '</b>；　((a mod n) + (b mod n)) mod n = <b>' + sum2 + '</b>　' +
      (sum1 === sum2 ? '<b style="color:#16a34a">✓ 相等</b>' : '<b style="color:#dc2626">✗ 不等（检查输入）</b>') + '<br>' +
      'ab mod n = <b>' + prod1 + '</b>；　((a mod n)(b mod n)) mod n = <b>' + prod2 + '</b>　' +
      (prod1 === prod2 ? '<b style="color:#16a34a">✓ 相等</b>' : '') + '<br>' +
      'a^k mod n = <b>' + pow1 + '</b>；　(a mod n)^k mod n = <b>' + pow2 + '</b>　' +
      (pow1 === pow2 ? '<b style="color:#16a34a">✓ 相等</b>' : '') +
      '<br><span style="color:var(--ink-faint)">结论：先取模再运算，结果不变——RSA 里的大数运算全靠这个性质。</span>';
  }

  goBtn.addEventListener('click', calc);
  calc();
})();

/* ============================================================
   演示 10：扩展欧几里得 & 模逆元求解器（Lecture 4）
   ============================================================ */
(function () {
  const aEl = document.getElementById('eea-a');
  const nEl = document.getElementById('eea-n');
  const goBtn = document.getElementById('eea-go');
  const infoEl = document.getElementById('eea-info');

  // 迭代版扩展欧几里得（避免大数递归爆栈），返回 gcd 及系数 x、y 使 ax+by=g
  function egcd(a, b) {
    let r0 = a, r1 = b, x0 = 1n, x1 = 0n, y0 = 0n, y1 = 1n;
    const steps = [];
    while (r1 !== 0n) {
      const q = r0 / r1;
      steps.push(r0 + ' = ' + q + '×' + r1 + ' + ' + (r0 % r1));
      [r0, r1] = [r1, r0 - q * r1];
      [x0, x1] = [x1, x0 - q * x1];
      [y0, y1] = [y1, y0 - q * y1];
    }
    return { g: r0, x: x0, y: y0, steps };
  }

  function calc() {
    const a = BigInt(aEl.value || '0');
    const n = BigInt(nEl.value || '1');
    if (n <= 0n) { infoEl.innerHTML = '<b style="color:#dc2626">n 必须为正整数</b>'; return; }
    const r = egcd(a, n);
    let html = '<b>辗转相除过程：</b><br>' + r.steps.map((s) => esc(s)).join('<br>') + '<br>' +
      '<b>gcd(' + a + ', ' + n + ') = ' + r.g + '</b>　·　' +
      '线性组合：' + r.g + ' = (' + r.x + ')×' + a + ' + (' + r.y + ')×' + n;
    if (r.g === 1n) {
      const inv = ((r.x % n) + n) % n;
      html += '<br><b style="color:#16a34a">' + a + '⁻¹ mod ' + n + ' = ' + inv + '</b>' +
        '　（验证：' + a + '×' + inv + ' mod ' + n + ' = ' + ((a * inv) % n) + '）';
    } else {
      html += '<br><b style="color:#dc2626">gcd ≠ 1，' + a + ' 模 ' + n + ' 不存在逆元</b>' +
        '<br><span style="color:var(--ink-faint)">这就是 RSA 要求 gcd(e, φ(n)) = 1 的原因。</span>';
    }
    infoEl.innerHTML = html;
  }

  goBtn.addEventListener('click', calc);
  calc();
})();

/* ============================================================
   演示 11：RSA 小型加解密实验室（Lecture 4）
   p=13, q=11 → n=143, φ=120, e=7, d=103；全程 BigInt 运算
   ============================================================ */
(function () {
  const pEl = document.getElementById('rsa-p');
  const qEl = document.getElementById('rsa-q');
  const eEl = document.getElementById('rsa-e');
  const mEl = document.getElementById('rsa-m');
  const goBtn = document.getElementById('rsa-go');
  const infoEl = document.getElementById('rsa-info');

  const gcd = (a, b) => (b === 0n ? a : gcd(b, a % b));
  const modpow = (base, exp, m) => {
    let r = 1n; base = ((base % m) + m) % m;
    while (exp > 0n) {
      if (exp % 2n === 1n) r = (r * base) % m;
      base = (base * base) % m;
      exp /= 2n;
    }
    return r;
  };
  function egcd(a, b) {
    let r0 = a, r1 = b, x0 = 1n, x1 = 0n;
    while (r1 !== 0n) {
      const q = r0 / r1;
      [r0, r1] = [r1, r0 - q * r1];
      [x0, x1] = [x1, x0 - q * x1];
    }
    return { g: r0, x: x0 };
  }

  function calc() {
    const p = BigInt(pEl.value || '0'), q = BigInt(qEl.value || '0');
    const e = BigInt(eEl.value || '0'), m = BigInt(mEl.value || '0');
    if (p < 2n || q < 2n || e < 1n) { infoEl.innerHTML = '<b style="color:#dc2626">请填入合法正整数</b>'; return; }
    const n = p * q, phi = (p - 1n) * (q - 1n);

    let html = '<b>密钥生成：</b>n = p×q = ' + n + '　·　φ(n) = (p−1)(q−1) = ' + phi;
    if (gcd(e, phi) !== 1n) {
      html += '<br><b style="color:#dc2626">gcd(e, φ(n)) ≠ 1！此 e 无法生成私钥 d，换一个与 φ(n) 互素的 e</b>';
      infoEl.innerHTML = html;
      return;
    }
    const r = egcd(e, phi);
    const d = ((r.x % phi) + phi) % phi;
    html += '<br>e = ' + e + '，d = e⁻¹ mod φ = <b>' + d + '</b>（验证：e×d mod φ = ' + ((e * d) % phi) + '）';
    html += '<br>公钥 &lt;e, n&gt; = &lt;' + e + ', ' + n + '&gt;　·　私钥 &lt;d, n&gt; = &lt;' + d + ', ' + n + '&gt;';

    if (m >= n) {
      html += '<br><b style="color:#dc2626">消息 m = ' + m + ' ≥ n = ' + n + '，超出范围！明文必须 m &lt; n（课件重点）</b>';
      infoEl.innerHTML = html;
      return;
    }
    const c = modpow(m, e, n);
    const m2 = modpow(c, d, n);
    html += '<br><b>加密：</b>c = m^e mod n = ' + m + '^' + e + ' mod ' + n + ' = <b>' + c + '</b>' +
      '<br><b>解密：</b>m = c^d mod n = ' + c + '^' + d + ' mod ' + n + ' = <b>' + m2 + '</b>' +
      (m2 === m ? '　<b style="color:#16a34a">✓ 解密成功，原文恢复</b>' : '　<b style="color:#dc2626">✗ 出错</b>') +
      '<br><span style="color:var(--ink-faint)">提示：真实 RSA 的 p、q 是几百位的大素数，这里用小数字演示数学原理。</span>';
    infoEl.innerHTML = html;
  }

  goBtn.addEventListener('click', calc);
  calc();
})();

/* ============================================================
   演示 12/13/14：L2/L3/L4 自测（工厂函数，避免三份重复代码）
   ============================================================ */
function makeQuiz(suffix, QUESTIONS) {
  const boxEl = document.getElementById('quiz-box' + suffix);
  const submitBtn = document.getElementById('quiz-submit' + suffix);
  const resetBtn = document.getElementById('quiz-reset' + suffix);
  const wrongBtn = document.getElementById('quiz-wrong' + suffix);
  const scoreEl = document.getElementById('quiz-score' + suffix);

  const st = { view: [], answered: false, wrongSet: new Set(), user: {} };

  function render() {
    boxEl.innerHTML = st.view.map((qi, n) => {
      const q = QUESTIONS[qi];
      return '<div class="quiz-q" id="qz' + suffix + '-' + qi + '" data-qi="' + qi + '">' +
        '<div class="qtext"><span class="qtag">Q' + (n + 1) + '</span>' + esc(q.q) + '</div>' +
        q.opts.map((o, k) =>
          '<label class="opt"><input type="radio" name="qz' + suffix + '-' + qi + '" value="' + k + '"' +
          (st.user[qi] === k ? ' checked' : '') + '> ' + esc(o) + '</label>'
        ).join('') +
        '<div class="quiz-explain"><b>解析：</b>' + esc(q.exp) + '</div>' +
        '</div>';
    }).join('');
    scoreEl.style.display = 'none';
    st.answered = false;
  }

  function grade() {
    let correct = 0;
    st.wrongSet = new Set();
    st.view.forEach((qi) => {
      const q = QUESTIONS[qi];
      const chosen = st.user[qi];
      const el = document.getElementById('qz' + suffix + '-' + qi);
      el.classList.add('done');
      const opts = el.querySelectorAll('label.opt');
      opts.forEach((lab, k) => { if (k === q.ans) lab.classList.add('correct'); });
      if (chosen === q.ans) correct++;
      else {
        st.wrongSet.add(qi);
        if (chosen !== undefined) opts[chosen].classList.add('wrong');
      }
    });
    st.answered = true;
    const pct = correct / st.view.length;
    scoreEl.style.display = 'block';
    scoreEl.innerHTML = 'Score: <b>' + correct + ' / ' + st.view.length + '</b>　(' + fmt(pct * 100, 0) + '%)' +
      '<div class="bar"><div class="fill" style="width:' + fmt(pct * 100, 0) + '%"></div></div>' +
      '<div style="font-size:14px;color:var(--ink-soft);margin-top:8px">' +
      (pct >= 0.85 ? 'Excellent! This lecture is well understood.' :
       pct >= 0.6 ? 'Good. Review the questions you missed before moving on.' :
       'Go through the lecture content again — pay attention to the highlighted points.') + '</div>';
  }

  boxEl.addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    const qi = parseInt(e.target.closest('.quiz-q').dataset.qi, 10);
    st.user[qi] = parseInt(e.target.value, 10);
  });

  submitBtn.addEventListener('click', () => { if (!st.answered) grade(); });
  resetBtn.addEventListener('click', () => {
    st.user = {};
    st.view = QUESTIONS.map((_, i) => i);
    render();
  });
  wrongBtn.addEventListener('click', () => {
    if (st.wrongSet.size === 0) {
      scoreEl.style.display = 'block';
      scoreEl.innerHTML = 'No wrong answers yet — submit once first.';
      return;
    }
    st.user = {};
    st.view = Array.from(st.wrongSet);
    render();
  });

  st.view = QUESTIONS.map((_, i) => i);
  render();
}

// ---------- L2 自测（12 题） ----------
makeQuiz('2', [
  { q: 'In ISO 31000, "the overall structure of the planning and design of the risk management activities" refers to the:', opts: ['A. risk management process', 'B. risk management framework', 'C. risk assessment', 'D. safeguard'], ans: 1, exp: 'Framework = structure (planning & design); process = implementation of the activities.' },
  { q: 'Which question corresponds to "Risk Evaluation"?', opts: ['A. What (and where) are the risks?', 'B. What are the current risk levels?', 'C. Are the current risk levels acceptable?', 'D. What does the organization need to do?'], ans: 2, exp: 'Identification → Analysis → Evaluation (acceptable?) → Treatment.' },
  { q: 'Which is NOT a category of security controls used to limit the project scope?', opts: ['A. Administrative', 'B. Physical', 'C. Technical', 'D. Financial'], ans: 3, exp: 'Controls: Administrative, Physical, Technical. Assets: Tangible / Intangible.' },
  { q: 'A customer list is an example of:', opts: ['A. A tangible asset', 'B. An intangible asset', 'C. A security control', 'D. A safeguard'], ans: 1, exp: 'Intangible = identifiable, non-monetary assets without physical substance (customer list, reputation, intellectual property).' },
  { q: 'The elements of a threat include:', opts: ['A. Agent, motive and outcomes', 'B. Agent, vulnerability and risk', 'C. Motive, asset and control', 'D. Agent, exposure and cost'], ans: 0, exp: 'Agent (may not be human), Motive (accidental or intentional), Outcomes (undesirable).' },
  { q: 'The two major categories of threats are:', opts: ['A. Accidental and intentional', 'B. Passive and active', 'C. Internal and external', 'D. Technical and physical'], ans: 0, exp: 'Accidental vs Intentional threats.' },
  { q: 'RIIOT stands for:', opts: ['A. Review, Interview, Inspect, Observe, Test', 'B. Review, Identify, Inspect, Observe, Test', 'C. Read, Interview, Inspect, Observe, Track', 'D. Review, Interview, Index, Observe, Test'], ans: 0, exp: 'RIIOT = Review + Interview + Inspect + Observe + Test.' },
  { q: 'The formula for Single Loss Expectancy (SLE) is:', opts: ['A. Asset Value × Exposure Factor', 'B. Asset Value × ARO', 'C. EF × ARO', 'D. ALE × EF'], ans: 0, exp: 'SLE = AV × EF; ALE = SLE × ARO.' },
  { q: 'A threat occurs 2 times every 6 months. Its ARO is:', opts: ['A. 2', 'B. 0.25', 'C. 4', 'D. 1'], ans: 2, exp: '4 times per year → ARO = 4. (2 times every 8 years would be ARO = 0.25.)' },
  { q: 'HQ valued at $3 million, EF estimated at 60%, 6 earthquakes in the past 4 years. The ALE is:', opts: ['A. $1.8 million', 'B. $2.7 million', 'C. $4.5 million', 'D. $900,000'], ans: 1, exp: 'ARO = 6/4 = 1.5; SLE = 3M × 60% = 1.8M; ALE = 1.8M × 1.5 = $2.7M.' },
  { q: 'The expected risk mitigation value is:', opts: ['A. ALE before − (ALE after + safeguard annual cost)', 'B. ALE after − ALE before', 'C. SLE − safeguard cost', 'D. AV − (ALE + cost)'], ans: 0, exp: 'Mitigation value = ALE(before) − (ALE(after) + annual cost of safeguards). Positive → worth buying.' },
  { q: 'Which is NOT one of the six primitive risk metric elements?', opts: ['A. Asset value', 'B. Threat frequency', 'C. Exposure factor', 'D. Encryption key length'], ans: 3, exp: 'Six elements: asset value, threat frequency, threat exposure factor, safeguard effectiveness, safeguard cost, confidence factor.' },
]);

// ---------- L3 自测（10 题） ----------
makeQuiz('3', [
  { q: 'Which statement about cyber security policies is NOT true?', opts: ['A. They are high level general descriptions', 'B. They are implementation specifications', 'C. They describe beliefs, goals and objectives', 'D. They provide blueprints for standards'], ans: 1, exp: 'Policies are NOT implementation specifications, nor standards/procedures/guidelines.' },
  { q: 'A policy that "addresses a specific topic, focusing on one particular issue at a time" is a(n):', opts: ['A. General policy', 'B. Topic-specific policy', 'C. Application-specific policy', 'D. Procedure'], ans: 1, exp: 'General = overall vision; Topic-specific = one issue; Application-specific = a particular system.' },
  { q: 'The FIRST step of the policy development process is:', opts: ['A. Understand the information infrastructure', 'B. Write the policy', 'C. Determine the scopes and objectives', 'D. Review'], ans: 2, exp: 'Process: scopes/objectives → infrastructure → write → review → approve → enforce.' },
  { q: 'Which is NOT a key element of a good policy?', opts: ['A. Clear and easy to understand', 'B. Enforceable', 'C. Complex and technical', 'D. Proactive'], ans: 2, exp: 'Key elements: clear, applicable, doable, enforceable, proactive, phasing in.' },
  { q: 'Mandatory specific rules that provide specific directions for policies are called:', opts: ['A. Standards', 'B. Guidelines', 'C. Procedures', 'D. Legislation'], ans: 0, exp: 'Standards = mandatory rules; Guidelines = suggestions; Procedures = implementation specifics.' },
  { q: '"Passwords should consist of at least 8 characters with a mix of alpha, numeric and special characters" is a:', opts: ['A. Policy', 'B. Standard', 'C. Guideline', 'D. Procedure'], ans: 2, exp: '"should + recommendation" → Guideline (not mandatory).' },
  { q: '"Requests for user id and smartcard must be approved and signed by the relevant system owners" is a:', opts: ['A. Policy', 'B. Standard', 'C. Guideline', 'D. Procedure'], ans: 3, exp: 'Concrete operational steps (approval and signing workflow) → Procedure.' },
  { q: 'In the topic-specific policy example, who authorizes and removes information access rights?', opts: ['A. Information Owner', 'B. Information Custodian', 'C. Information User', 'D. The auditor'], ans: 0, exp: 'Owner: classification + authorization/removal of access; Custodian: maintains mechanisms; User: authorized access.' },
  { q: 'According to Lecture 3, the correct hierarchy from top to bottom is:', opts: ['A. Legislation → Policy → Standards → Procedures → Guidelines', 'B. Legislation → Policy → Standards → Guidelines → Procedures', 'C. Policy → Legislation → Standards → Procedures → Guidelines', 'D. Legislation → Standards → Policy → Guidelines → Procedures'], ans: 1, exp: 'L3 order: Legislation, Corporate Policy, Standards, Guidelines, Procedures (note the L1 slide shows a different order).' },
  { q: 'Information that "if disclosed could cause significant damage to the company" is classified as:', opts: ['A. Public', 'B. Confidential', 'C. Internal', 'D. Secret'], ans: 1, exp: 'Public = made available via authorized channels; Confidential = disclosure causes significant damage.' },
]);

// ---------- L4 自测（10 题） ----------
makeQuiz('4', [
  { q: '10 mod 7 = ?', opts: ['A. 3', 'B. 4', 'C. 1', 'D. 0'], ans: 0, exp: '10 = 1×7 + 3 → 10 mod 7 = 3.' },
  { q: '−10 mod 7 = ?', opts: ['A. −3', 'B. 3', 'C. 4', 'D. −4'], ans: 2, exp: 'The residue must be a non-negative integer in {0,…,6}: −10 + 14 = 4 → −10 mod 7 = 4.' },
  { q: 'gcd(68, 36) = ?', opts: ['A. 2', 'B. 4', 'C. 6', 'D. 8'], ans: 1, exp: '68 = 1×36 + 32; 36 = 1×32 + 4; 32 = 8×4 → gcd = 4.' },
  { q: '28⁻¹ mod 51 = ?', opts: ['A. 20', 'B. 31', 'C. 41', 'D. 51'], ans: 1, exp: '1 = 11×51 + (−20)×28 → 28⁻¹ = (−20) mod 51 = 31 (31×28 mod 51 = 1).' },
  { q: 'φ(10) = ? (Euler totient function)', opts: ['A. 2', 'B. 4', 'C. 5', 'D. 10'], ans: 1, exp: 'Integers 1–9 coprime to 10: 1, 3, 7, 9 → φ(10) = 4.' },
  { q: 'Fermat\'s Little Theorem states that for a prime p and p ∤ a:', opts: ['A. a^p ≡ 1 (mod p)', 'B. a^(p−1) ≡ 1 (mod p)', 'C. a^(p−1) ≡ p (mod a)', 'D. a^p ≡ 0 (mod p)'], ans: 1, exp: 'a^(p−1) ≡ 1 (mod p). Also used for probabilistic primality testing.' },
  { q: 'In RSA, the ciphertext c is computed by:', opts: ['A. c = m^d mod n', 'B. c = m^e mod n', 'C. c = e^m mod n', 'D. c = m mod φ(n)'], ans: 1, exp: 'Encrypt with public key <e, n>: c = m^e mod n; decrypt with private key: m = c^d mod n.' },
  { q: 'The solution of x ≡ 2 (mod 5), x ≡ 3 (mod 13) is:', opts: ['A. 42 mod 65', 'B. 17 mod 65', 'C. 42 mod 18', 'D. 5 mod 65'], ans: 0, exp: 'M = 65; M₁⁻¹ mod 5 = 2, M₂⁻¹ mod 13 = 8; x = (2·13·2 + 3·5·8) mod 65 = 42.' },
  { q: 'The Discrete Logarithm Problem is: given p, g and y, find x such that:', opts: ['A. y = g^x mod p', 'B. x = g^y mod p', 'C. y = x^g mod p', 'D. g = y^x mod p'], ans: 0, exp: 'DLP: find x with y = g^x mod p — computationally hard; the basis of DSA and Diffie-Hellman.' },
  { q: 'In GF(2⁸) with the AES irreducible polynomial, {57} ⊕ {83} = ?', opts: ['A. {D4}', 'B. {C1}', 'C. {47}', 'D. {83}'], ans: 0, exp: '01010111 ⊕ 10000011 = 11010100 = {D4}. AES uses m(x) = x⁸+x⁴+x³+x+1.' },
]);

/* ============================================================
   页面级 UI：导航高亮（按讲座分组）+ 回到顶部
   ============================================================ */
(function () {
  const pills = document.querySelectorAll('.nav a[data-lecture]');
  const tocLinks = document.querySelectorAll('.toc a');
  const sections = document.querySelectorAll('section.chapter');

  // 由章节 id 判断所属讲座（L2/L3/L4 以 l2-/l3-/l4- 开头，其余归 L1）
  function lectureOf(id) {
    if (id.startsWith('l2-')) return 'L2';
    if (id.startsWith('l3-')) return 'L3';
    if (id.startsWith('l4-') || id === 'glossary-all') return 'L4';
    return 'L1';
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        const id = en.target.id;
        // 顶部导航：按讲座高亮对应的讲座胶囊
        pills.forEach((p) => p.classList.toggle('active', p.dataset.lecture === lectureOf(id)));
        // 侧栏目录：按章节精确高亮
        tocLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-15% 0px -70% 0px' });
  sections.forEach((s) => obs.observe(s));

  const toTop = document.getElementById('toTop');
  window.addEventListener('scroll', () => {
    toTop.classList.toggle('show', window.scrollY > 600);
  }, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();


