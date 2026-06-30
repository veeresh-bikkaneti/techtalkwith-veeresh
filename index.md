---
layout: default
title: Home
---

<section class="hero">
  <canvas id="network-canvas"></canvas>
  <div class="hero-badge">Open to opportunities</div>
  <h1 class="hero-title">Tech Talk with Veeresh</h1>
  <p class="hero-subtitle">
    Principal QA Architect · AI Test Architect · 20+ years driving enterprise software quality. Writing about AI-driven test strategy, automation frameworks, and building quality engineering teams.
  </p>
  <div class="hero-links">
    <a href="{{ '/about/' | relative_url }}" class="btn-primary"><i class="fas fa-user"></i> About Me</a>
    <a href="{{ '/blog/' | relative_url }}" class="btn-secondary"><i class="fas fa-rss"></i> Read the Blog</a>
    <a href="https://github.com/veeresh-bikkaneti" target="_blank" class="btn-secondary"><i class="fab fa-github"></i> GitHub</a>
    <a href="https://www.linkedin.com/in/sdetbaveer/" target="_blank" class="btn-secondary"><i class="fab fa-linkedin"></i> LinkedIn</a>
  </div>
</section>

<section class="section">
  <div class="section-header">
    <i class="fas fa-fire"></i>
    <span>Latest Posts</span>
    <span class="section-number">01</span>
    <div class="section-divider"></div>
  </div>
  <div class="posts-grid">
    {% assign posts = site.posts | limit: 6 %}
    {% for post in posts %}
    <article class="post-card" data-reveal>
      <div class="post-card-meta">
        <span><i class="fas fa-calendar-alt"></i> {{ post.date | date: "%b %d, %Y" }}</span>
        {% if post.reading_time %}
          <span><i class="fas fa-clock"></i> {{ post.reading_time }} min read</span>
        {% endif %}
      </div>
      <h3 class="post-card-title">
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h3>
      <p class="post-card-excerpt">{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
      {% if post.tags.size > 0 %}
      <div class="post-card-tags">
        {% for tag in post.tags limit:3 %}
          <span class="tag">#{{ tag }}</span>
        {% endfor %}
      </div>
      {% endif %}
    </article>
    {% endfor %}
  </div>
</section>

<section class="section">
  <div class="section-header">
    <i class="fab fa-github"></i>
    <span>Open Source</span>
    <span class="section-number">02</span>
    <div class="section-divider"></div>
  </div>
  <div class="bento-grid">
    <article class="bento-card bento-card--featured" data-reveal>
      <div class="bento-header">
        <div class="bento-icon"><i class="fas fa-robot"></i></div>
        <h3 class="bento-title"><a href="https://github.com/veeresh-bikkaneti/cypress-qa-ai-workforce" target="_blank">cypress-qa-ai-workforce</a></h3>
      </div>
      <p class="bento-desc">AI-powered Cypress QA system with agent orchestration, self-healing locators, and security gates. Built for enterprise test automation with multi-agent collaboration.</p>
      <div class="bento-tags">
        <span class="bento-tag bento-tag--lang">JavaScript</span>
        <span class="bento-tag">Cypress</span>
        <span class="bento-tag">AI Agents</span>
        <span class="bento-tag">Playwright</span>
      </div>
      <div class="bento-stats">
        <span><i class="fas fa-star"></i> Featured</span>
        <span><i class="fas fa-code-branch"></i> Active</span>
      </div>
    </article>
    <article class="bento-card bento-card--stat" data-reveal>
      <div class="bento-stat-value">4</div>
      <div class="bento-stat-label">Repos</div>
    </article>
    <article class="bento-card bento-card--stat" data-reveal>
      <div class="bento-stat-value">AI</div>
      <div class="bento-stat-label">Focus</div>
    </article>
    <article class="bento-card" data-reveal>
      <div class="bento-header">
        <div class="bento-icon"><i class="fas fa-brain"></i></div>
        <h3 class="bento-title"><a href="https://github.com/veeresh-bikkaneti/LLMcouncil" target="_blank">LLMcouncil</a></h3>
      </div>
      <p class="bento-desc">Multi-agent AI orchestration framework: 3 parallel analysis agents + Chairperson synthesizer.</p>
      <div class="bento-tags">
        <span class="bento-tag bento-tag--lang">TypeScript</span>
        <span class="bento-tag">LLM</span>
        <span class="bento-tag">Multi-Agent</span>
      </div>
    </article>
    <article class="bento-card" data-reveal>
      <div class="bento-header">
        <div class="bento-icon"><i class="fas fa-plug"></i></div>
        <h3 class="bento-title"><a href="https://github.com/veeresh-bikkaneti/azdo-ai-toolkit" target="_blank">azdo-ai-toolkit</a></h3>
      </div>
      <p class="bento-desc">Azure DevOps AI integration: automated test case generation from work items.</p>
      <div class="bento-tags">
        <span class="bento-tag bento-tag--lang">TypeScript</span>
        <span class="bento-tag">Azure DevOps</span>
        <span class="bento-tag">AI</span>
      </div>
    </article>
    <article class="bento-card bento-card--wide" data-reveal>
      <div class="bento-header">
        <div class="bento-icon"><i class="fas fa-exchange-alt"></i></div>
        <h3 class="bento-title"><a href="https://github.com/veeresh-bikkaneti/cypress-playwright" target="_blank">cypress-playwright</a></h3>
      </div>
      <p class="bento-desc">Migration framework bridging Cypress and Playwright ecosystems. Smooth transition path for teams moving between frameworks.</p>
      <div class="bento-tags">
        <span class="bento-tag bento-tag--lang">TypeScript</span>
        <span class="bento-tag">Cypress</span>
        <span class="bento-tag">Playwright</span>
        <span class="bento-tag">Migration</span>
      </div>
    </article>
  </div>
</section>
