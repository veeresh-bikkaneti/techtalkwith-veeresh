---
layout: default
title: Home
---

<section class="hero">
  <canvas id="network-canvas" class="network-canvas" aria-hidden="true"></canvas>
  <h1 class="hero-title">Tech Talk with Veeresh</h1>
  <p class="hero-subtitle">
    Principal QA Architect · AI Test Architect · writing on AI-driven test strategy, automation frameworks, and quality engineering teams.
    <a href="https://veeresh-bikkaneti.github.io/about.html">About Veeresh</a> lives on the portfolio.
  </p>
  <div class="hero-links">
    <a href="{{ '/blog/' | relative_url }}" class="btn-primary"><i class="fas fa-rss" aria-hidden="true"></i> Latest posts</a>
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
    <h2 id="oss-title">Projects &amp; live sites</h2>
    <div class="section-divider"></div>
  </div>
  <div class="bento-grid">
    <a class="bento-card bento-card--cta" href="https://veeresh-bikkaneti.github.io/#projects" data-reveal>
      <span class="bento-cta-kicker">Open source</span>
      <span class="bento-cta-title">AI-assisted QA, Cypress to Playwright migration, LLM council and more</span>
      <span class="bento-cta-link">See projects <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
    </a>
    <a class="bento-card bento-card--cta" href="https://veeresh-bikkaneti.github.io/#sites" data-reveal>
      <span class="bento-cta-kicker">Live sites &amp; tools</span>
      <span class="bento-cta-title">System Design Mastery, TicketRouter, testing guides and more</span>
      <span class="bento-cta-link">Browse live sites <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
    </a>
  </div>
</section>
