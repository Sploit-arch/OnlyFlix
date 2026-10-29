
(() => {
  'use strict';

  const cfg = window.ONLYFLIX_CONFIG || {};
  const API = (cfg.vidApiBase || 'https://vidapi.ru').replace(/\/$/, '');
  const TMDB = 'https://api.themoviedb.org/3';
  const IMG = 'https://image.tmdb.org/t/p/';

  const $ = id => document.getElementById(id);

  const state = {
    view: 'home',
    page: 1,
    latest: [],
    tv: [],
    catalog: [],
    active: null,
    hero: null,
    trending: [],
    watchlist: load('onlyflix_watchlist', []),
    pref: localStorage.getItem('onlyflix_playback_preference') || 'auto',
    key: (cfg.tmdbApiKey || '').trim(),
    searchToken: 0,
    loading: false
  };

  function load(k, d) {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  }

  function save(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  }

  function toast(t) {
    $('toast').textContent = t;
    $('toast').classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(
      () => $('toast').classList.remove('show'),
      2400
    );
  }

  function status(t = '', err = false) {
    $('status').replaceChildren();
    $('status').className = 'status' + (err ? ' error' : '');

    if (t) {
      if (!err) {
        const i = document.createElement('i');
        $('status').append(i);
      }
      $('status').append(document.createTextNode(t));
    }
  }

  function norm(x, type = 'movie') {
    const tv = type === 'tv' || x.type === 'tv' || x.media_type === 'tv';
    const id = String(x.tmdb_id || x.id || x.tmdbId || x.imdb_id || x.title);

    return {
      id: (tv ? 'tv:' : 'movie:') + id,
      tmdbId: String(x.tmdb_id || x.id || ''),
      imdbId: x.imdb_id || '',
      type: tv ? 'tv' : 'movie',
      title: x.title || x.name || 'Untitled',
      year: String(
        x.year ||
        (x.release_date || x.first_air_date || '').slice(0, 4) ||
        ''
      ),
      rating: x.rating || x.vote_average || '',
      genre: x.genre || '',
      overview: x.overview || x.description || '',
      poster: x.poster_url || (
        x.poster_path
          ? (x.poster_path.startsWith('http')
              ? x.poster_path
              : IMG + 'w500' + x.poster_path)
          : ''
      ),
      backdrop: x.backdrop_url || (
        x.backdrop_path
          ? (x.backdrop_path.startsWith('http')
              ? x.backdrop_path
              : IMG + 'original' + x.backdrop_path)
          : ''
      ) || x.poster_url || '',
      embedUrl: x.embed_url || '',
      directUrl: x.direct_url || x.stream_url || x.video_url || ''
    };
  }

  function unique(items) {
    const seen = new Set();
    return items.filter(x => x && x.id && !seen.has(x.id) && seen.add(x.id));
  }

  async function json(url) {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw Error('HTTP ' + response.status);
    }

    return response.json();
  }

  async function feed(type, page) {
    const path = type === 'tv'
      ? `/tvshows/latest/page-${page}.json`
      : `/movies/latest/page-${page}.json`;

    const data = await json(API + path);
    return (data.items || data.result || []).map(x => norm(x, type));
  }

  async function tmdb(path, params = {}) {
    if (!state.key) {
      throw Error('TMDB API key is missing from config.js');
    }

    const query = new URLSearchParams({
      api_key: state.key,
      language: 'en-US',
      ...params
    });

    return json(TMDB + path + '?' + query);
  }

  function inList(x) {
    return state.watchlist.some(y => y.id === x.id);
  }

  function updateCount() {
    $('list-count').textContent = state.watchlist.length;
  }

  function toggleList(x) {
    if (inList(x)) {
      state.watchlist = state.watchlist.filter(y => y.id !== x.id);
      toast('Removed from My List');
    } else {
      const item = { ...x };
      delete item.raw;
      state.watchlist.unshift(item);
      toast('Added to My List');
    }

    save('onlyflix_watchlist', state.watchlist);
    updateCount();

    if (state.view === 'watchlist') renderList();

    if (!$('detail-modal').hidden && state.active?.id === x.id) {
      updateDetailList();
    }
  }

  function card(x) {
    const article = document.createElement('article');
    article.className = 'poster';
    article.tabIndex = 0;
    article.setAttribute('role', 'button');
    article.setAttribute('aria-label', x.title + ' details');

    const art = document.createElement('div');
    art.className = 'poster-art';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = x.title;
    img.src = x.poster || './assets/poster-placeholder.svg';
    img.onerror = () => {
      img.onerror = null;
      img.src = './assets/poster-placeholder.svg';
    };
    art.append(img);

    if (x.rating) {
      const rating = document.createElement('span');
      rating.className = 'rating';
      rating.textContent = '★ ' + Number(x.rating).toFixed(1);
      art.append(rating);
    }

    const add = document.createElement('button');
    add.className = 'list-add' + (inList(x) ? ' in-list' : '');
    add.textContent = inList(x) ? '✓' : '+';
    add.title = inList(x) ? 'Remove from My List' : 'Add to My List';

    add.addEventListener('click', event => {
      event.stopPropagation();
      toggleList(x);
      add.classList.toggle('in-list', inList(x));
      add.textContent = inList(x) ? '✓' : '+';
    });

    art.append(add);

    const title = document.createElement('h3');
    title.className = 'poster-title';
    title.textContent = x.title;

    const sub = document.createElement('div');
    sub.className = 'poster-sub';

    const year = document.createElement('span');
    year.textContent = x.year || (x.type === 'tv' ? 'Series' : 'Movie');

    const kind = document.createElement('span');
    kind.textContent = x.type === 'tv' ? 'SERIES' : 'MOVIE';

    sub.append(year, kind);
    article.append(art, title, sub);

    const open = () => details(x);
    article.addEventListener('click', open);
    article.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });

    return article;
  }

  function renderRow(id, items) {
    const element = $(id);
    element.replaceChildren();

    if (!items.length) {
      element.textContent = 'No titles available right now.';
      element.classList.add('muted');
      return;
    }

    element.classList.remove('muted');
    items.forEach(x => element.append(card(x)));
  }

  function renderGrid(id, items) {
    const element = $(id);
    element.replaceChildren();
    items.forEach(x => element.append(card(x)));
  }

  function details(x) {
    state.active = x;
    $('detail-title').textContent = x.title;
    $('detail-type').textContent = x.type === 'tv' ? 'TV SERIES' : 'MOVIE';
    $('detail-meta').replaceChildren();

    [
      x.year,
      x.rating ? '★ ' + Number(x.rating).toFixed(1) : '',
      x.genre
    ].filter(Boolean).forEach(value => {
      const span = document.createElement('span');
      span.textContent = value;
      $('detail-meta').append(span);
    });

    $('detail-overview').textContent =
      x.overview || 'No synopsis is available for this title yet.';

    $('detail-backdrop').style.backgroundImage = x.backdrop
      ? `url("${x.backdrop.replace(/"/g, '%22')}")`
      : '';

    updateDetailList();
    $('detail-modal').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function updateDetailList() {
    $('detail-list').textContent = inList(state.active)
      ? '✓ In My List'
      : '＋ My List';
  }

  function closeModal(id) {
    $(id).hidden = true;

    if (
      $('detail-modal').hidden &&
      $('player-modal').hidden &&
      $('prefs-modal').hidden
    ) {
      document.body.style.overflow = '';
    }
  }

  function embed(x) {
    if (x.embedUrl) return x.embedUrl;

    if (x.type === 'tv') {
      if (x.imdbId) {
        return `https://vaplayer.ru/embed/tv/${encodeURIComponent(x.imdbId)}/1/1`;
      }
      if (x.tmdbId) {
        return `https://vaplayer.ru/embed/tv/${encodeURIComponent(x.tmdbId)}/1/1`;
      }
      return '';
    }

    if (x.imdbId) {
      return `https://vaplayer.ru/embed/movie/${encodeURIComponent(x.imdbId)}`;
    }

    if (x.tmdbId) {
      return `https://vaplayer.ru/embed/movie/${encodeURIComponent(x.tmdbId)}`;
    }

    return '';
  }

  function direct(url) {
    return /\.(mp4|m3u8)(?:$|[?#])/i.test(url || '');
  }

  function player(x) {
    state.active = x;
    $('player-title').textContent = x.title;
    $('player-modal').hidden = false;
    document.body.style.overflow = 'hidden';

    const stage = $('player-stage');
    stage.replaceChildren();

    const url = direct(x.directUrl) ? x.directUrl : '';

    if (url && state.pref !== 'embed') {
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.src = url;
      video.poster = x.backdrop || x.poster || '';

      video.addEventListener('error', () => {
        $('player-message').textContent =
          'This direct stream could not be played. The source may be unavailable or unsupported.';
      });

      stage.append(video);
      $('player-message').textContent =
        'Playing a direct media URL supplied by the catalogue provider.';
      return;
    }

    if (state.pref === 'direct') {
      stage.innerHTML = '<p>Direct stream unavailable for this title.</p>';
      $('player-message').textContent =
        'No direct MP4/HLS URL was supplied. OnlyFlix does not extract hidden URLs from embed pages.';
      return;
    }

    const urlEmbed = embed(x);

    if (!urlEmbed) {
      stage.innerHTML = '<p>Playback source unavailable.</p>';
      $('player-message').textContent =
        'No supported playback source was returned for this title.';
      return;
    }

    const frame = document.createElement('iframe');
    frame.src = urlEmbed;
    frame.title = x.title + ' player';
    frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    stage.append(frame);

    $('player-message').textContent =
      'Using the provider embed. Direct playback is selected only when a compatible direct URL is supplied.';
  }

  function renderList() {
    renderGrid('list-grid', state.watchlist);
    $('empty-list').hidden = state.watchlist.length > 0;
  }

  function view(v) {
    state.view = v;
    $('search').value = '';
    $('clear').hidden = true;
    $('search-section').hidden = true;
    $('home-view').hidden = v !== 'home';
    $('catalog-view').hidden = !['movies', 'tv'].includes(v);
    $('list-view').hidden = v !== 'watchlist';

    document.querySelectorAll('.nav').forEach(button => {
      button.classList.toggle('active', button.dataset.view === v);
    });

    if (v === 'movies' || v === 'tv') {
      state.page = 1;
      state.catalog = [...(v === 'tv' ? state.tv : state.latest)];
      $('catalog-title').textContent = v === 'tv' ? 'TV Shows' : 'All Movies';
      renderGrid('catalog-grid', state.catalog);
      $('catalog-count').textContent = state.catalog.length + ' titles loaded';
    }

    if (v === 'watchlist') renderList();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function more() {
    if (state.loading) return;

    state.loading = true;
    $('load-more').disabled = true;
    $('load-more').textContent = 'Loading…';

    try {
      let items;

      if (state.key) {
        const type = state.view === 'tv' ? 'tv' : 'movie';
        const data = await tmdb('/' + type + '/popular', {
          page: String(state.page + 1)
        });
        items = (data.results || []).map(x => norm(x, type));
      } else {
        items = await feed(
          state.view === 'tv' ? 'tv' : 'movie',
          state.page + 1
        );
      }

      state.catalog = unique([...state.catalog, ...items]);
      state.page++;

      renderGrid('catalog-grid', state.catalog);
      $('catalog-count').textContent = state.catalog.length + ' titles loaded';
    } catch (error) {
      console.error('Load more failed:', error);
      toast('Could not load more titles. Check API access and try again.');
    } finally {
      state.loading = false;
      $('load-more').disabled = false;
      $('load-more').textContent = 'Load more titles';
    }
  }

  async function search(q) {
    const token = ++state.searchToken;
    q = q.trim();

    $('clear').hidden = !q;

    if (!q) {
      $('search-section').hidden = true;
      $('home-view').hidden = state.view !== 'home';
      return;
    }

    $('search-section').hidden = false;
    $('home-view').hidden = true;
    $('catalog-view').hidden = true;
    $('list-view').hidden = true;
    $('search-heading').textContent = 'Results for “' + q + '”';
    $('search-count').textContent = 'Searching…';
    $('search-results').replaceChildren();

    try {
      let results = [];

      if (state.key) {
        try {
          const [movies, shows] = await Promise.all([
            tmdb('/search/movie', {
              query: q,
              include_adult: 'false'
            }),
            tmdb('/search/tv', {
              query: q,
              include_adult: 'false'
            })
          ]);

          results = [
            ...(movies.results || []).map(x => norm(x, 'movie')),
            ...(shows.results || []).map(x => norm(x, 'tv'))
          ];
        } catch (error) {
          console.warn('TMDB search failed; trying VidAPI.', error);
          results = await fallbackSearch(q);
        }
      } else {
        results = await fallbackSearch(q);
      }

      if (token !== state.searchToken) return;

      results = unique(results);
      $('search-count').textContent =
        results.length + ' title' + (results.length === 1 ? '' : 's');

      if (!results.length) {
        const message = document.createElement('p');
        message.className = 'empty';
        message.textContent = state.key
          ? 'No matching titles found.'
          : 'No match in the latest catalogue pages. Configure a TMDB API key for full-catalogue search.';
        $('search-results').append(message);
      } else {
        renderGrid('search-results', results);
      }
    } catch (error) {
      if (token !== state.searchToken) return;

      console.error('Search failed:', error);
      $('search-count').textContent = '';

      const message = document.createElement('p');
      message.className = 'empty';
      message.textContent =
        'Search is temporarily unavailable. Check your connection or API configuration.';
      $('search-results').append(message);
    }
  }

  async function fallbackSearch(q) {
    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map(page =>
        feed('movie', page).catch(() => [])
      ).concat(
        [1, 2].map(page =>
          feed('tv', page).catch(() => [])
        )
      )
    );

    const needle = q.toLocaleLowerCase();

    return unique(pages.flat()).filter(item =>
      item.title.toLocaleLowerCase().includes(needle) ||
      item.year.includes(needle)
    );
  }

  function setHero(x) {
    state.hero = x;

    $('hero-image').style.backgroundImage = x.backdrop || x.poster
      ? `url("${(x.backdrop || x.poster).replace(/"/g, '%22')}")`
      : '';

    $('hero-title').textContent = x.title;
    $('hero-desc').textContent =
      x.overview || 'Discover something new with OnlyFlix.';

    $('hero-meta').replaceChildren();

    [
      x.year,
      x.rating ? '★ ' + Number(x.rating).toFixed(1) : '',
      x.type === 'tv' ? 'TV SERIES' : 'MOVIE'
    ].filter(Boolean).forEach(value => {
      const span = document.createElement('span');
      span.textContent = value;
      $('hero-meta').append(span);
    });

    $('hero-play').onclick = () => player(x);
    $('hero-info').onclick = () => details(x);
  }

  function renderHome() {
    renderRow('trending', state.trending.length
      ? state.trending
      : state.latest.slice(0, 12));

    renderRow('latest', state.latest);
    renderRow('tv-row', state.tv);

    const featured = state.latest.find(x => x.backdrop || x.poster);
    if (featured) setHero(featured);
  }

  async function init() {
    updateCount();
    $('playback-pref').value = state.pref;

    const cached = load('onlyflix_cache_v1', null);

    if (cached && Date.now() - cached.savedAt < 1800000) {
      state.latest = cached.latest || [];
      state.tv = cached.tv || [];
      renderHome();
      status('Showing cached catalogue while refreshing…');
    }

    try {
      const [movies, shows] = await Promise.all([
        feed('movie', 1),
        feed('tv', 1)
      ]);

      state.latest = movies;
      state.tv = shows;
      state.trending = movies.slice(0, 12);

      if (state.key) {
        try {
          const [trendingMovies, trendingShows] = await Promise.all([
            tmdb('/trending/movie/week'),
            tmdb('/trending/tv/week')
          ]);

          state.trending = unique([
            ...(trendingMovies.results || []).map(x => norm(x, 'movie')),
            ...(trendingShows.results || []).map(x => norm(x, 'tv'))
          ]).slice(0, 24);
        } catch (error) {
          console.warn('TMDB trending unavailable; using VidAPI.', error);
        }
      }

      save('onlyflix_cache_v1', {
        latest: movies,
        tv: shows,
        savedAt: Date.now()
      });

      renderHome();
      status('');
    } catch (error) {
      console.error('Catalogue refresh failed:', error);

      if (!state.latest.length) {
        status('Live catalogue could not be reached. Check your connection.', true);
        ['trending', 'latest', 'tv-row'].forEach(id => renderRow(id, []));
      } else {
        renderHome();
        status('Refresh failed; showing cached titles.', true);
      }
    }
  }

  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => view(button.dataset.view));
  });

  $('search-form').addEventListener('submit', event => {
    event.preventDefault();
    search($('search').value);
  });

  $('search').addEventListener('input', () => {
    const q = $('search').value;
    $('clear').hidden = !q;

    clearTimeout(search.timer);

    if (q.trim().length >= 2) {
      search.timer = setTimeout(() => search($('search').value), 300);
    } else if (!q.trim()) {
      search('');
    }
  });

  $('clear').addEventListener('click', () => {
    $('search').value = '';
    search('');
    $('search').focus();
  });

  $('load-more').addEventListener('click', more);

  $('detail-play').addEventListener('click', () => {
    const item = state.active;
    closeModal('detail-modal');
    if (item) player(item);
  });

  $('detail-list').addEventListener('click', () => {
    if (state.active) toggleList(state.active);
  });

  document.querySelectorAll('[data-close="detail"]').forEach(button => {
    button.addEventListener('click', () => closeModal('detail-modal'));
  });

  document.querySelectorAll('[data-close="player"]').forEach(button => {
    button.addEventListener('click', () => {
      closeModal('player-modal');
      $('player-stage').replaceChildren();
    });
  });

  document.querySelectorAll('[data-close="prefs"]').forEach(button => {
    button.addEventListener('click', () => closeModal('prefs-modal'));
  });

  $('prefs').addEventListener('click', () => {
    $('prefs-modal').hidden = false;
    document.body.style.overflow = 'hidden';
  });

  $('playback-pref').addEventListener('change', () => {
    state.pref = $('playback-pref').value;
    localStorage.setItem('onlyflix_playback_preference', state.pref);
    toast('Playback preference saved');
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      ['detail-modal', 'player-modal', 'prefs-modal'].forEach(closeModal);
      $('player-stage').replaceChildren();
    }
  });

  init();
})();
