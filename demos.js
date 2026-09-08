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
    { q: '黑客窃取并公开了医院的病人病历', ans: 'C', exp: '病历被「未授权访问」——机密性（Confidentiality）被破坏：信息只应让授权实体看到。' },
    { q: '网络转账页面的收款账号被攻击者替换', ans: 'I', exp: '数据被「未授权修改」——完整性（Integrity）被破坏：信息应准确、未被篡改。' },
    { q: '勒索软件加密了公司所有文件，业务瘫痪', ans: 'A', exp: '文件在需要时「不可用」——可用性（Availability）被破坏。' },
    { q: 'DDoS 攻击使在线考试系统无法访问', ans: 'A', exp: '拒绝服务攻击的典型目标：让系统/服务不可用——可用性被破坏。' },
    { q: '员工偷偷把客户名单卖给了竞争对手', ans: 'C', exp: '客户名单被泄露给未授权方——机密性被破坏（内部威胁）。' },
    { q: '攻击者把邮件中的「同意退款」改成「拒绝退款」', ans: 'I', exp: '消息内容被篡改——完整性被破坏。' },
    { q: '机房空调故障导致服务器过热宕机', ans: 'A', exp: '系统不可用——可用性被破坏。注意：威胁可以是非人为的（设备故障、自然灾害）。' },
    { q: '黑客在官网发布了一条虚假停业公告', ans: 'I', exp: '官网内容被未授权修改（伪造信息）——完整性被破坏，同时伴随真实性（Authenticity）问题。' },
    { q: '快递员偷看包裹上打印的完整手机号', ans: 'C', exp: '个人信息被未授权查看——机密性被破坏，也涉及隐私（Privacy）。' },
    { q: '管理员误操作删除了订单表，且没有备份', ans: 'A', exp: '数据永久丢失、无法在需要时使用——可用性被破坏（也提醒我们备份的重要性）。' },
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
    { q: 'NIST 对网络安全的定义是：保护或防御（　）免受网络攻击的能力。', opts: ['A. 网络设备', 'B. 网络空间的使用', 'C. 数据库系统', 'D. 密码算法'], ans: 1, exp: 'NIST：The ability to protect or defend the use of cyberspace from cyber attacks。' },
    { q: 'ISO/IEC 27032 中，网络安全 = 在网络空间中保护信息的：', opts: ['A. 机密性、完整性、可用性', 'B. 速度、容量、成本', 'C. 认证、授权、审计', 'D. 加密、签名、哈希'], ans: 0, exp: 'ISO/IEC 27032 定义直接对应 CIA 三元组。' },
    { q: '「客户名单被泄露给竞争对手」主要破坏了：', opts: ['A. 机密性', 'B. 完整性', 'C. 可用性', 'D. 问责性'], ans: 0, exp: '信息被未授权实体访问 = 机密性破坏。' },
    { q: '「银行转账金额被篡改」主要破坏了：', opts: ['A. 机密性', 'B. 完整性', 'C. 可用性', 'D. 隐私'], ans: 1, exp: '数据被未授权修改 = 完整性破坏（数据完整性）。' },
    { q: '「DDoS 攻击使网站瘫痪」主要破坏了：', opts: ['A. 机密性', 'B. 完整性', 'C. 可用性', 'D. 真实性'], ans: 2, exp: '需要时不可用 = 可用性破坏；DoS 是典型的可用性攻击。' },
    { q: '以下哪一项属于主动攻击（Active Attack）？', opts: ['A. 流量分析', 'B. 窃听消息内容', 'C. 重放 Replay', 'D. 监视传输'], ans: 2, exp: '主动攻击：伪装、重放、修改消息、DoS；被动攻击：获取消息内容、流量分析。' },
    { q: '下列哪一项不属于 X.800 的五大类安全服务？', opts: ['A. 认证', 'B. 访问控制', 'C. 数据机密性', 'D. 可用性'], ans: 3, exp: '五大类：认证、访问控制、数据机密性、数据完整性、不可抵赖——没有可用性（高频陷阱）。' },
    { q: 'n 个实体两两安全通信，对称加密共需要多少把共享密钥？', opts: ['A. n', 'B. n²', 'C. n(n−1)/2', 'D. 2n'], ans: 2, exp: '每对实体一把：C(n,2) = n(n−1)/2，随 n 快速膨胀——密钥分发与管理难题。' },
    { q: 'AES 不支持的密钥长度是（位）：', opts: ['A. 128', 'B. 192', 'C. 256', 'D. 320'], ans: 3, exp: 'AES 支持 128 / 192 / 256 位。' },
    { q: 'RSA 的安全性基于哪个数学难题？', opts: ['A. 大整数分解', 'B. 离散对数', 'C. 椭圆曲线离散对数', 'D. 背包问题'], ans: 0, exp: 'RSA ← Factoring；DSA/DH ← 离散对数；ECC ← 椭圆曲线离散对数。' },
    { q: '发送者用自己的私钥加密、接收者用对应公钥解密，可以实现：', opts: ['A. 机密性', 'B. 数字签名与不可抵赖', 'C. 可用性', 'D. 访问控制'], ans: 1, exp: '私钥只有发送者有 → 签名/真实性/不可抵赖；公钥加密才实现机密性。' },
    { q: '哈希函数的特性不包括：', opts: ['A. 定长输出', 'B. 单向性', 'C. 无碰撞', 'D. 可逆性'], ans: 3, exp: '哈希是单向（one-way）的，不可逆；输出固定长度、碰撞难找。' },
    { q: '数字签名验证时，Bob 计算出的 H1 与解密得到的 H2 不相等，应：', opts: ['A. 接受', 'B. 拒绝', 'C. 重发', 'D. 忽略'], ans: 1, exp: '哈希不一致说明消息被篡改或签名无效 → Reject。' },
    { q: '使用 X.509 证书前，验证四步的第一步是：', opts: ['A. 检查 CRL', 'B. 验证 CA 签名', 'C. 检查有效期', 'D. 提取公钥'], ans: 2, exp: '顺序：有效期 → CRL → CA 签名 → 提取公钥（前三步完成前不能使用公钥）。' },
    { q: 'X.509 PKI 中，把用户身份与公钥绑定在一起的是：', opts: ['A. 口令', 'B. 数字证书（CA 签名）', 'C. 访问控制列表', 'D. 会话密钥'], ans: 1, exp: '证书主体含身份+公钥，由 CA 签名担保。' },
    { q: 'PGP 的信任模型是：', opts: ['A. 中心化 CA', 'B. 信任网络 Web of Trust', 'C. 交叉认证', 'D. 等级信任'], ans: 1, exp: 'PGP 无 CA，用户互相签名建立信任网络（Zimmermann 创建）。' },
    { q: '最可靠的产品安全认证方式是：', opts: ['A. 厂商认证', 'B. 市场认证', 'C. 用户认证', 'D. 独立认证'], ans: 3, exp: '独立第三方无利益关系，最可信——呼应「功能正常 ≠ 安全」。' },
    { q: 'Cryptanalysis（密码分析）研究的是：', opts: ['A. 设计密码算法', 'B. 破解密码系统', 'C. 隐藏信息', 'D. 密钥管理'], ans: 1, exp: 'Cryptography 设计、Cryptanalysis 破解、Steganography 隐藏。' },
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
   页面级 UI：导航高亮 + 回到顶部
   ============================================================ */
(function () {
  const links = document.querySelectorAll('.nav a, .toc a');
  const sections = document.querySelectorAll('section.chapter');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((a) => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
        });
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


