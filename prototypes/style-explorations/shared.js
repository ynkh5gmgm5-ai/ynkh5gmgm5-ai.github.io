const research = [
  {
    date: '2024—2026',
    title: '中国 Hi-Fi 新用户增长与 PC 装机渠道拓展策略',
    summary: '专业 Hi-Fi 是本体；电竞、PC 装机、便携和风格表达，是它被更多人使用的场景。'
  },
  {
    date: '2026',
    title: '国内 Hi-Fi 竞品与价格带地图',
    summary: '便携 CD、R2R 和电子管并非最大市场，但更容易建立品牌记忆，适合内容、试听和展会驱动。'
  },
  {
    date: '2026',
    title: 'Hi-Fi 渠道角色与进入策略',
    summary: '渠道经理的核心不是开店数量，而是终端动销、价格纪律、样机效率、库存健康和回款质量。'
  }
];

const arrowIcon = `
  <svg class="action-icon" viewBox="0 0 256 256" aria-hidden="true">
    <path d="M80 80h96v96M80 176 176 80" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="18"/>
  </svg>`;

const emptyFrame = `
  <div class="empty-visual" aria-hidden="true">
    <i></i><i></i><i></i><i></i><i></i><i></i>
  </div>`;

document.querySelector('#app').innerHTML = `
  <header class="site-header">
    <nav aria-label="主导航">
      <a href="#top">首页</a>
      <a href="#research">关于hifi市场个人的一些看法</a>
      <a href="#listening">试听档案</a>
      <a href="#photography">一些随手拍</a>
      <a href="#about">关于</a>
    </nav>
  </header>

  <main id="top">
    <section class="hero">
      <div class="hero-title" data-reveal>
        <p class="eyebrow">Hi-Fi 行业观察者与内容创作者</p>
        <h1>欢迎来到我的个人网站</h1>
      </div>
      <div class="hero-note" data-reveal>
        <p>围绕产品、用户与渠道建立可追溯的研究，也为真实试听与摄影保留独立档案。</p>
        <span class="signal" aria-hidden="true"></span>
      </div>
    </section>

    <section class="chapter focus" data-reveal>
      <div class="section-heading">
        <h2>本期关注</h2>
        <p>研究先给出结论，再展开证据、范围与待验证部分。</p>
      </div>
      <a class="focus-card" href="/research/hifi-new-user-pc-channel-growth/">
        <span>2026</span>
        <h3>中国 Hi-Fi 新用户增长与 PC 装机渠道拓展策略</h3>
        <p>专业 Hi-Fi 是本体；电竞、PC 装机、便携和风格表达，是它被更多人使用的场景。</p>
        ${arrowIcon}
      </a>
    </section>

    <section class="chapter listening" id="listening">
      <div class="section-heading" data-reveal>
        <h2>试听档案</h2>
        <p>只记录作者的主观体验，不以分数或排行替代聆听条件。</p>
      </div>
      <div class="listening-grid">
        <a href="/listening/over-ear/" data-stack><strong>大耳</strong><span>头戴式耳机的照片、搭配与主观观察</span>${arrowIcon}</a>
        <a href="/listening/in-ear/" data-stack><strong>入耳</strong><span>入耳式耳机的使用情境与最终印象</span>${arrowIcon}</a>
        <a href="/listening/field-notes/" data-stack><strong>闪击探店与展会蹭听</strong><span>门店、展会与临场试听笔记</span>${arrowIcon}</a>
      </div>
      <p class="empty-state">尚无公开内容</p>
    </section>

    <section class="chapter research" id="research">
      <div class="section-heading" data-reveal>
        <h2>关于hifi市场个人的一些看法</h2>
        <p>市场与竞争、产品与用户、渠道与增长，三条线索彼此交叉。</p>
      </div>
      <div class="research-grid">
        ${research.map((item) => `
          <a href="/research/" data-stack>
            <span>${item.date}</span>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            ${arrowIcon}
          </a>`).join('')}
      </div>
      <p class="section-action"><a href="/research/">浏览全部研究 ${arrowIcon}</a></p>
    </section>

    <section class="chapter closing-grid">
      <div class="photo-panel" id="photography" data-reveal>
        <div>
          <h2>一些随手拍</h2>
          <p>尚无公开内容</p>
        </div>
        ${emptyFrame}
      </div>
      <div class="about-panel" id="about" data-reveal>
        <h2>认识我</h2>
        <p>个人资料尚未公开</p>
        <a href="/about/">前往关于页 ${arrowIcon}</a>
      </div>
    </section>
  </main>

  <footer>
    <p>Hi-Fi 行业研究、主观试听档案与摄影作品。</p>
    <nav aria-label="页脚导航"><a href="#research">研究</a><a href="#listening">试听</a><a href="#photography">随手拍</a><a href="#about">关于</a></nav>
  </footer>`;

if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.from('[data-reveal]', {
    y: 22,
    duration: 0.8,
    stagger: 0.05,
    ease: 'power2.out',
    scrollTrigger: { trigger: 'main', start: 'top 90%' }
  });
  gsap.utils.toArray('[data-stack]').forEach((card) => {
    gsap.from(card, {
      y: 18,
      duration: 0.65,
      ease: 'power2.out',
      scrollTrigger: { trigger: card, start: 'top 94%' }
    });
  });
}
