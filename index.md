---
layout: default
title: Home
---

<section class="hero">
  <canvas id="network-canvas" aria-hidden="true"></canvas>
  <div class="hero-badge">Open to opportunities</div>
  <h1 class="hero-title">Tech Talk with Veeresh</h1>
  <p class="hero-subtitle">
    Principal QA Architect · AI Test Architect · 20+ years driving enterprise software quality. Writing about AI-driven test strategy, automation frameworks, and building quality engineering teams.
  </p>
  <div class="hero-links">
    <a href="{{ '/about/' | relative_url }}" class="btn-primary"><i class="fas fa-user" aria-hidden="true"></i> About Me</a>
    <a href="{{ '/blog/' | relative_url }}" class="btn-secondary"><i class="fas fa-rss" aria-hidden="true"></i> Read the Blog</a>
    <a href="https://github.com/veeresh-bikkaneti" target="_blank" rel="noopener" class="btn-secondary"><i class="fab fa-github" aria-hidden="true"></i> GitHub</a>
    <a href="https://www.linkedin.com/in/sdetbaveer/" target="_blank" rel="noopener" class="btn-secondary"><i class="fab fa-linkedin" aria-hidden="true"></i> LinkedIn</a>
  </div>
</section>

<section class="section" aria-labelledby="latest-title">
  <div class="section-header">
    <i class="fas fa-fire" aria-hidden="true"></i>
    <h2 id="latest-title">Latest Posts</h2>
    <div class="section-divider"></div>
    <a class="section-link" href="{{ '/blog/' | relative_url }}">All {{ site.posts.size }} posts <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
  </div>
  <div class="posts-grid posts-grid--home">
    {% for post in site.posts limit: 5 %}
      {% if forloop.first %}
        {% include post-card.html post=post featured=true words=45 %}
      {% else %}
        {% include post-card.html post=post %}
      {% endif %}
    {% endfor %}
  </div>

  {% capture tag_str %}{% for t in site.tags %}{{ t[1].size | plus: 1000 }}#{{ t[0] }}{% unless forloop.last %},{% endunless %}{% endfor %}{% endcapture %}
  {% assign top_tags = tag_str | split: ',' | sort | reverse %}
  <div class="topic-row">
    <span class="topic-label">Popular topics</span>
    {% for item in top_tags limit: 10 %}
      {% assign parts = item | split: '#' %}
      <a class="chip" href="{{ '/blog/' | relative_url }}?tag={{ parts[1] | uri_escape }}">{{ parts[1] }}</a>
    {% endfor %}
  </div>
</section>

<section class="section" aria-labelledby="oss-title">
  <div class="section-header">
    <i class="fab fa-github" aria-hidden="true"></i>
    <h2 id="oss-title">Open Source</h2>
    <div class="section-divider"></div>
    <a class="section-link" href="https://veeresh-bikkaneti.github.io/">All projects <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
  </div>
  <div class="bento-grid">
    <article class="bento-card bento-card--featured" data-reveal>
      <div class="bento-header">
        <div class="bento-icon"><i class="fas fa-robot"></i></div>
        <h3 class="bento-title"><a href="https://github.com/veeresh-bikkaneti/cypress-qa-ai-workforce" target="_blank" rel="noopener">cypress-qa-ai-workforce</a></h3>
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
    <article class="bento-card" data-reveal>
      <div class="bento-header">
        <div class="bento-icon"><i class="fas fa-brain"></i></div>
        <h3 class="bento-title"><a href="https://github.com/veeresh-bikkaneti/LLMcouncil" target="_blank" rel="noopener">LLMcouncil</a></h3>
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
        <h3 class="bento-title"><a href="https://github.com/veeresh-bikkaneti/azdo-ai-toolkit" target="_blank" rel="noopener">azdo-ai-toolkit</a></h3>
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
        <h3 class="bento-title"><a href="https://github.com/veeresh-bikkaneti/cypress-playwright" target="_blank" rel="noopener">cypress-playwright</a></h3>
      </div>
      <p class="bento-desc">Migration framework bridging Cypress and Playwright ecosystems. Smooth transition path for teams moving between frameworks.</p>
      <div class="bento-tags">
        <span class="bento-tag bento-tag--lang">TypeScript</span>
        <span class="bento-tag">Cypress</span>
        <span class="bento-tag">Playwright</span>
        <span class="bento-tag">Migration</span>
      </div>
    </article>
    <a class="bento-card bento-card--cta" href="https://veeresh-bikkaneti.github.io/" data-reveal>
      <span class="bento-cta-kicker">Live sites &amp; tools</span>
      <span class="bento-cta-title">System Design Mastery, TicketRouter, testing guides and more</span>
      <span class="bento-cta-link">Browse everything <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
    </a>
  </div>
</section>
