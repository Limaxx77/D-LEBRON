/* ==========================================================================
   D’LEBRON — Moda Masculina
   script.js
   Desenvolvido por Ominy Desenvolvimentos

   Índice
   01. Configurações da loja
   02. Produtos (catálogo de calçados)
   03. Utilitários
   04. Links de WhatsApp
   05. Carrinho (estado + persistência)
   06. Produtos: renderização, filtros e “adicionar ao carrinho”
   07. Carrinho: interface (gaveta, itens, etapas)
   08. Checkout: formulário, CEP, validação e envio ao WhatsApp
   09. Toast (avisos)
   10. Preloader
   11. Header
   12. Menu mobile
   13. Reveal ao rolar
   14. Parallax
   15. Cursor personalizado
   16. Fallback de imagens
   17. Inicialização
   18. Experiência de scroll (vídeo controlado pela rolagem)

   Fluxo de venda atual:
   Produto → Carrinho → Checkout (dados, entrega/retirada, pagamento) → WhatsApp

   Evolução futura (NÃO implementado agora):
   - Pagamento online: substituir sendOrder() por uma chamada ao gateway.
   - Banco de dados / painel admin: trocar o array PRODUCTS por uma
     chamada à API em loadProducts() e registrar pedidos no servidor.
   ========================================================================== */

(() => {
  'use strict';

  /* ========================================================================
     01. CONFIGURAÇÕES DA LOJA — altere aqui
     ======================================================================== */
  const CONFIG = {
    // Número que recebe os pedidos e contatos.
    // ⚠️ PROVISÓRIO (número de testes). Trocar pelo WhatsApp oficial da D’Lebron.
    // Formato: DDI + DDD + número, apenas dígitos.
    whatsappNumber: '5587981076022',

    instagramUrl: 'https://www.instagram.com/dlebronmodas/',

    defaultMessage: 'Olá! Vim pelo site da D’Lebron e gostaria de mais informações.',

    // Mensagem do botão de WhatsApp de cada produto
    productMessage: (product) =>
      `Olá! Vi a peça ${product.name} no site da D’Lebron e gostaria de saber mais.`,

    currency: 'BRL',
    locale: 'pt-BR',

    // Entrega
    deliveryFee: 0, // 0 = entrega grátis
    deliveryCities: ['Petrolina - PE', 'Juazeiro - BA'],

    // Retirada — ⚠️ substituir pelo endereço/horário reais da loja quando houver
    pickupInfo: 'Retire seu pedido na loja D’Lebron. O endereço e o melhor horário são confirmados pelo WhatsApp.',

    paymentMethods: {
      pix: 'Pix',
      debito: 'Cartão de débito',
      credito: 'Cartão de crédito',
    },

    maxQtyPerItem: 10,
    storageKeys: {
      cart: 'dlebron:cart:v1',
      customer: 'dlebron:customer:v1',
    },
  };

  /* ========================================================================
     02. PRODUTOS — CATÁLOGO REAL (somente calçados)
     ------------------------------------------------------------------------
     Roupas e acessórios aparecem como “EM BREVE” no site.

     Como editar cada tênis:
     - id:     identificador único (sem espaços/acentos) — usado no carrinho
     - name:   nome exibido, enviado no pedido e no WhatsApp
     - brand:  chave de BRANDS (define o filtro por marca)
     - price:  número com ponto decimal (ex.: 349.90)
               ou null → aparece “Consulte o valor” e o total fica “a confirmar”
     - sizes:  lista de tamanhos disponíveis (use range(34, 38) ou ['34', '35'])
               ou null → aparece “Tamanhos sob consulta”
     - image:  foto em assets/img/produtos/ (quadrada, 800 × 800)
     - alt:    descrição da foto (acessibilidade/SEO)
     - badge:  etiqueta opcional ('Feminino', 'Pronta entrega'...) ou null

     ⚠️ Preços ainda não informados → todos estão como null (sob consulta).
     ⚠️ Tênis sem tamanho informado nos stories → sizes: null.
     ======================================================================== */
  const BRANDS = {
    'new-balance': 'New Balance',
    nike: 'Nike',
    boss: 'BOSS',
    outros: 'Outras marcas',
  };

  // Gera a grade de numeração: range(34, 38) → ['34','35','36','37','38']
  const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

  const SIZE_TBD = 'A confirmar';
  const IMG = 'assets/img/produtos/';

  const PRODUCTS = [
    {
      id: 'nb-9060-branco',
      name: 'New Balance 9060 Branco',
      brand: 'new-balance',
      price: null,
      sizes: range(34, 41),
      image: `${IMG}nb-9060-branco.jpg`,
      alt: 'Tênis New Balance 9060 branco com detalhes cinza',
      badge: 'Pronta entrega',
    },
    {
      id: 'nike-tn-branco-preto',
      name: 'Nike TN Branco e Preto',
      brand: 'nike',
      price: null,
      sizes: null,
      image: `${IMG}nike-tn-branco-preto.jpg`,
      alt: 'Tênis Nike TN branco e preto com bolhas de ar roxas',
      badge: null,
    },
    {
      id: 'nb-530-branco',
      name: 'New Balance 530 Branco e Prata',
      brand: 'new-balance',
      price: null,
      sizes: range(34, 38),
      image: `${IMG}nb-530-branco.jpg`,
      alt: 'Tênis New Balance 530 branco com detalhes prata',
      badge: 'Pronta entrega',
    },
    {
      id: 'boss-preto',
      name: 'BOSS Preto',
      brand: 'boss',
      price: null,
      sizes: null,
      image: `${IMG}boss-preto.jpg`,
      alt: 'Tênis BOSS preto com solado branco',
      badge: null,
    },
    {
      id: 'nb-9060-branco-preto',
      name: 'New Balance 9060 Branco e Preto',
      brand: 'new-balance',
      price: null,
      sizes: range(34, 39),
      image: `${IMG}nb-9060-branco-preto.jpg`,
      alt: 'Tênis New Balance 9060 branco com detalhes pretos',
      badge: 'Pronta entrega',
    },
    {
      id: 'nike-tn-preto-vermelho',
      name: 'Nike TN Preto e Vermelho',
      brand: 'nike',
      price: null,
      sizes: null,
      image: `${IMG}nike-tn-preto-vermelho.jpg`,
      alt: 'Tênis Nike TN preto e cinza com detalhes vermelhos',
      badge: null,
    },
    {
      id: 'nb-black',
      name: 'New Balance Black',
      brand: 'new-balance',
      price: null,
      sizes: range(39, 42),
      image: `${IMG}nb-black.jpg`,
      alt: 'Tênis New Balance todo preto',
      badge: 'Pronta entrega',
    },
    {
      id: 'boss-camurca-marrom',
      name: 'BOSS Camurça Marrom',
      brand: 'boss',
      price: null,
      sizes: null,
      image: `${IMG}boss-camurca-marrom.jpg`,
      alt: 'Tênis BOSS de camurça marrom com solado branco',
      badge: null,
    },
    {
      id: 'nb-9060-bege',
      name: 'New Balance 9060 Bege',
      brand: 'new-balance',
      price: null,
      sizes: range(34, 37),
      image: `${IMG}nb-9060-bege.jpg`,
      alt: 'Tênis New Balance 9060 bege com detalhes azul-marinho',
      badge: 'Pronta entrega',
    },
    {
      id: 'nb-9060-rosa',
      name: 'New Balance 9060 Rosa',
      brand: 'new-balance',
      price: null,
      sizes: range(34, 37),
      image: `${IMG}nb-9060-rosa.jpg`,
      alt: 'Tênis New Balance 9060 rosa',
      badge: 'Pronta entrega',
    },
    {
      id: 'nb-9060-branco-lilas',
      name: 'New Balance 9060 Branco e Lilás',
      brand: 'new-balance',
      price: null,
      sizes: ['34', '35'],
      image: `${IMG}nb-9060-branco-lilas.jpg`,
      alt: 'Tênis New Balance 9060 branco com detalhes lilás',
      badge: 'Pronta entrega',
    },
    {
      id: 'nb-feminino-caramelo',
      name: 'New Balance Feminino Caramelo',
      brand: 'new-balance',
      price: null,
      sizes: ['34', '35'],
      image: `${IMG}nb-feminino-caramelo.jpg`,
      alt: 'Tênis New Balance feminino caramelo e off-white',
      badge: 'Feminino',
    },
    {
      id: 'nb-feminino-preto',
      name: 'New Balance Feminino Preto',
      brand: 'new-balance',
      price: null,
      sizes: ['34', '35'],
      image: `${IMG}nb-feminino-preto.jpg`,
      alt: 'Tênis New Balance feminino preto e off-white',
      badge: 'Feminino',
    },
    {
      id: 'reserva-branco',
      name: 'Reserva Branco',
      brand: 'outros',
      price: null,
      sizes: null,
      image: `${IMG}reserva-branco.jpg`,
      alt: 'Tênis Reserva branco com logo vermelho',
      badge: null,
    },
    {
      id: 'tenis-casual-branco',
      name: 'Casual Branco e Preto',
      brand: 'outros',
      price: null,
      sizes: null,
      image: `${IMG}tenis-casual-branco.jpg`,
      alt: 'Par de tênis casual branco com detalhe preto no calcanhar',
      badge: null,
    },
  ];

  // Texto da numeração: “34 ao 38”, “34 e 35”, “Tamanho 40” ou “sob consulta”
  function sizesLabel(sizes) {
    if (!sizes || !sizes.length) return 'Tamanhos sob consulta';
    if (sizes.length === 1) return `Tamanho ${sizes[0]}`;
    if (sizes.length === 2) return `Tam. ${sizes[0]} e ${sizes[1]}`;
    const nums = sizes.map(Number);
    const sequential = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
    return sequential ? `Tam. ${sizes[0]} ao ${sizes[sizes.length - 1]}` : `Tam. ${sizes.join(', ')}`;
  }

  const hasPrice = (p) => typeof p.price === 'number' && Number.isFinite(p.price);

  const getProduct = (id) => PRODUCTS.find((p) => p.id === id);

  /* ========================================================================
     03. UTILITÁRIOS
     ======================================================================== */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const priceFormatter = new Intl.NumberFormat(CONFIG.locale, {
    style: 'currency',
    currency: CONFIG.currency,
  });

  const roundMoney = (value) => Math.round(value * 100) / 100;
  const formatPrice = (value) => priceFormatter.format(roundMoney(value));

  const whatsappLink = (message = CONFIG.defaultMessage) =>
    `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;

  const escapeHTML = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));

  const storage = {
    get(key, fallback) {
      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (err) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        /* armazenamento indisponível (aba anônima etc.) — segue sem persistir */
      }
    },
  };

  // Bloqueio de rolagem compartilhado entre menu mobile e carrinho
  const scrollLock = (() => {
    const owners = new Set();
    return {
      add(owner) {
        owners.add(owner);
        document.body.classList.add('is-locked');
      },
      remove(owner) {
        owners.delete(owner);
        if (!owners.size) document.body.classList.remove('is-locked');
      },
    };
  })();

  const openInNewTab = (url) => {
    const win = window.open(url, '_blank');
    if (win) {
      try { win.opener = null; } catch (err) { /* ignore */ }
    } else {
      window.location.href = url; // bloqueador de pop-up: abre na mesma aba
    }
  };

  /* ========================================================================
     04. LINKS DE WHATSAPP
     Todo elemento com a classe .js-whatsapp recebe o link correto.
     A mensagem vem do atributo data-wa (ou a mensagem padrão).
     ======================================================================== */
  function initWhatsAppLinks(scope = document) {
    $$('.js-whatsapp', scope).forEach((el) => {
      el.href = whatsappLink(el.dataset.wa || CONFIG.defaultMessage);
      el.target = '_blank';
      el.rel = 'noopener';
    });
  }

  /* ========================================================================
     05. CARRINHO — estado + persistência (localStorage)
     Cada linha: { key, id, size, qty }. Preço e nome vêm sempre de PRODUCTS,
     então alterar um preço no catálogo reflete automaticamente no carrinho.
     ======================================================================== */
  const Cart = (() => {
    const listeners = new Set();
    const keyOf = (id, size) => `${id}__${size}`;

    const sanitize = (list) => (Array.isArray(list) ? list : [])
      .filter((i) => i && getProduct(i.id) && Number.isInteger(i.qty) && i.qty > 0)
      .map((i) => ({
        key: keyOf(i.id, i.size),
        id: i.id,
        size: String(i.size),
        qty: Math.min(i.qty, CONFIG.maxQtyPerItem),
      }));

    let items = sanitize(storage.get(CONFIG.storageKeys.cart, []));

    const getState = () => {
      const lines = items.map((item) => {
        const product = getProduct(item.id);
        const priced = hasPrice(product);
        return { ...item, product, priced, total: priced ? roundMoney(product.price * item.qty) : 0 };
      });
      const count = lines.reduce((sum, l) => sum + l.qty, 0);
      const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.total, 0));
      const pending = lines.some((l) => !l.priced); // há itens com valor sob consulta
      const allPending = lines.length > 0 && lines.every((l) => !l.priced);
      return { lines, count, subtotal, pending, allPending };
    };

    const emit = () => {
      storage.set(CONFIG.storageKeys.cart, items.map(({ id, size, qty }) => ({ id, size, qty })));
      const state = getState();
      listeners.forEach((fn) => fn(state));
    };

    // Sincroniza entre abas abertas
    window.addEventListener('storage', (e) => {
      if (e.key !== CONFIG.storageKeys.cart) return;
      items = sanitize(storage.get(CONFIG.storageKeys.cart, []));
      const state = getState();
      listeners.forEach((fn) => fn(state));
    });

    return {
      add(id, size, qty = 1) {
        const key = keyOf(id, size);
        const found = items.find((i) => i.key === key);
        if (found) found.qty = Math.min(CONFIG.maxQtyPerItem, found.qty + qty);
        else items.push({ key, id, size, qty: Math.min(CONFIG.maxQtyPerItem, qty) });
        emit();
      },
      setQty(key, qty) {
        const found = items.find((i) => i.key === key);
        if (!found) return;
        if (qty <= 0) items = items.filter((i) => i.key !== key);
        else found.qty = Math.min(CONFIG.maxQtyPerItem, qty);
        emit();
      },
      remove(key) {
        items = items.filter((i) => i.key !== key);
        emit();
      },
      clear() {
        items = [];
        emit();
      },
      getState,
      subscribe(fn) {
        listeners.add(fn);
        fn(getState());
      },
    };
  })();

  /* ========================================================================
     06. PRODUTOS + FILTROS + ADICIONAR AO CARRINHO
     ======================================================================== */
  let revealObserver = null;
  let activeFilter = 'todos';

  // Futuro: substituir por fetch('/api/produtos').then(r => r.json())
  function loadProducts() {
    return Promise.resolve(PRODUCTS);
  }

  function productCardTemplate(product, index) {
    const brandLabel = BRANDS[product.brand] || product.brand;
    const badge = product.badge
      ? `<span class="product-card__badge">${escapeHTML(product.badge)}</span>`
      : '';
    const sizes = product.sizes && product.sizes.length ? product.sizes : null;
    const selectId = `size-${escapeHTML(product.id)}`;

    let sizeField;
    if (!sizes) {
      sizeField = `<span class="product-card__single">Tamanho a confirmar no WhatsApp</span>`;
    } else if (sizes.length === 1) {
      sizeField = `<span class="product-card__single">Tamanho ${escapeHTML(sizes[0])}</span>`;
    } else {
      sizeField = `<label class="visually-hidden" for="${selectId}">Tamanho de ${escapeHTML(product.name)}</label>
         <select class="select product-card__size" id="${selectId}" data-size-for="${escapeHTML(product.id)}">
           <option value="" selected disabled>Tamanho</option>
           ${sizes.map((s) => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('')}
         </select>`;
    }

    const price = hasPrice(product)
      ? `<span class="product-card__price">${formatPrice(product.price)}</span>`
      : `<span class="product-card__price product-card__price--ask">Consulte o valor</span>`;

    return `
      <article class="product-card reveal" data-id="${escapeHTML(product.id)}" data-brand="${escapeHTML(product.brand)}" style="--delay:${(index % 4) * 0.08}s">
        <div class="product-card__media" data-media data-cursor="Ver">
          ${badge}
          <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.alt || product.name)}" loading="lazy" decoding="async" width="800" height="800">
        </div>
        <div class="product-card__info">
          <div class="product-card__meta">
            <span class="product-card__cat">${escapeHTML(brandLabel)}</span>
            <h3 class="product-card__name">${escapeHTML(product.name)}</h3>
            <span class="product-card__sizes${sizes ? '' : ' is-ask'}">${escapeHTML(sizesLabel(sizes))}</span>
            ${price}
          </div>
          <div class="product-card__buy">
            ${sizeField}
            <div class="product-card__actions">
              <button type="button" class="btn btn--light product-card__add" data-add="${escapeHTML(product.id)}">
                <svg class="icon" aria-hidden="true"><use href="#i-bag"/></svg>
                <span class="product-card__add-label">Adicionar</span>
              </button>
              <a class="product-card__wa"
                 href="${whatsappLink(CONFIG.productMessage(product))}"
                 target="_blank" rel="noopener"
                 aria-label="Tenho interesse em ${escapeHTML(product.name)} — perguntar no WhatsApp"
                 title="Tenho interesse — WhatsApp">
                <svg class="icon" aria-hidden="true"><use href="#i-whatsapp"/></svg>
              </a>
            </div>
          </div>
        </div>
      </article>`;
  }

  function renderProducts(products, filter = 'todos') {
    const grid = $('#productGrid');
    if (!grid) return;

    const list = filter === 'todos'
      ? products
      : products.filter((p) => p.brand === filter);

    if (!list.length) {
      const label = BRANDS[filter] || 'esta marca';
      grid.innerHTML = `
        <p class="product-empty">
          Novos modelos ${escapeHTML(label)} chegando em breve.<br>
          Fale com a gente no WhatsApp para saber o que já está disponível na loja.
        </p>`;
      return;
    }

    grid.innerHTML = list.map(productCardTemplate).join('');

    initImageFallback(grid);
    observeReveal($$('.product-card', grid));
  }

  function setActiveFilter(filter) {
    activeFilter = filter;
    $$('.filter-btn').forEach((btn) => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
      if (isActive) {
        const bar = btn.parentElement;
        const target = btn.offsetLeft - (bar.clientWidth - btn.clientWidth) / 2;
        bar.scrollTo({ left: target, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  }

  function applyFilter(products, filter) {
    const grid = $('#productGrid');
    if (filter === activeFilter && grid.children.length) return;
    setActiveFilter(filter);

    if (prefersReducedMotion) {
      renderProducts(products, filter);
      return;
    }

    grid.classList.add('is-switching');
    window.setTimeout(() => {
      renderProducts(products, filter);
      grid.classList.remove('is-switching');
    }, 300);
  }

  function handleAddToCart(button) {
    const product = getProduct(button.dataset.add);
    if (!product) return;

    const card = button.closest('.product-card');
    const select = $('.product-card__size', card);
    const size = select
      ? select.value
      : (product.sizes && product.sizes.length ? product.sizes[0] : SIZE_TBD);

    if (!size) {
      select.classList.remove('is-error');
      void select.offsetWidth; // reinicia a animação
      select.classList.add('is-error');
      select.focus();
      showToast('Escolha o tamanho antes de adicionar.');
      return;
    }

    Cart.add(product.id, size, 1);

    // Feedback no botão
    const label = $('.product-card__add-label', button);
    button.classList.add('is-added');
    if (label) label.textContent = 'Adicionado';
    window.clearTimeout(button._addedTimer);
    button._addedTimer = window.setTimeout(() => {
      button.classList.remove('is-added');
      if (label) label.textContent = 'Adicionar';
    }, 1600);

    const sizeText = size === SIZE_TBD ? '' : ` · Tam. ${size}`;
    showToast(`${product.name}${sizeText} adicionado ao carrinho.`, {
      label: 'Ver carrinho',
      onClick: () => CartUI.open(),
    });
  }

  function initProducts() {
    const grid = $('#productGrid');

    // Delegação: funciona mesmo após re-renderizar os cards
    if (grid) {
      grid.addEventListener('click', (e) => {
        const addBtn = e.target.closest('[data-add]');
        if (addBtn) handleAddToCart(addBtn);
      });
      grid.addEventListener('change', (e) => {
        if (e.target.matches('.product-card__size')) e.target.classList.remove('is-error');
      });
    }

    loadProducts().then((products) => {
      renderProducts(products, 'todos');

      $$('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => applyFilter(products, btn.dataset.filter));
      });

      // Cards de categoria levam à coleção já filtrada
      $$('.cat-card[data-filter]').forEach((card) => {
        card.addEventListener('click', () => applyFilter(products, card.dataset.filter));
      });

      // Links que levam à coleção já filtrada (ex.: “Ver calçados” na seção do vídeo)
      $$('[data-filter-link]').forEach((link) => {
        link.addEventListener('click', () => applyFilter(products, link.dataset.filterLink));
      });
    });
  }

  // Valor com itens “sob consulta”: “A confirmar” ou “R$ 300,00 + a confirmar”
  function moneyOrPending(value, state) {
    if (state.allPending) return 'A confirmar';
    if (state.pending) return `${formatPrice(value)} + a confirmar`;
    return formatPrice(value);
  }

  /* ========================================================================
     07. CARRINHO — INTERFACE
     ======================================================================== */
  const CartUI = (() => {
    const el = {};
    let view = 'items';
    let lastFocus = null;
    let lastOrderUrl = '';

    const VIEWS = {
      items: { step: 'Etapa 1 de 2', title: 'Seu carrinho' },
      checkout: { step: 'Etapa 2 de 2', title: 'Finalizar pedido' },
      done: { step: 'Pedido', title: 'Pedido enviado' },
    };

    function lineTemplate(line) {
      const p = line.product;
      const sizeText = line.size === SIZE_TBD ? 'Tamanho a confirmar' : `Tamanho ${escapeHTML(line.size)}`;
      const unit = line.priced ? formatPrice(p.price) : 'Valor sob consulta';
      const total = line.priced ? formatPrice(line.total) : 'Sob consulta';
      const key = escapeHTML(line.key);
      return `
        <li class="cart-item" data-key="${key}">
          <div class="cart-item__media" data-media>
            <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.alt || p.name)}" loading="lazy" decoding="async" width="160" height="160">
          </div>
          <div class="cart-item__info">
            <div class="cart-item__top">
              <div>
                <h3 class="cart-item__name">${escapeHTML(p.name)}</h3>
                <span class="cart-item__meta">${sizeText} · ${unit}</span>
              </div>
              <button type="button" class="cart-item__remove" data-action="remove" data-key="${key}" aria-label="Remover ${escapeHTML(p.name)} do carrinho">
                <svg class="icon" aria-hidden="true"><use href="#i-trash"/></svg>
              </button>
            </div>
            <div class="cart-item__bottom">
              <div class="qty" role="group" aria-label="Quantidade de ${escapeHTML(p.name)}">
                <button type="button" class="qty__btn" data-action="dec" data-key="${key}" aria-label="Diminuir quantidade">
                  <svg class="icon" aria-hidden="true"><use href="#i-minus"/></svg>
                </button>
                <span class="qty__value" aria-live="polite">${line.qty}</span>
                <button type="button" class="qty__btn" data-action="inc" data-key="${key}" aria-label="Aumentar quantidade" ${line.qty >= CONFIG.maxQtyPerItem ? 'disabled' : ''}>
                  <svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>
                </button>
              </div>
              <span class="cart-item__total${line.priced ? '' : ' is-ask'}">${total}</span>
            </div>
          </div>
        </li>`;
    }

    function render(state) {
      // Contadores (header, botão flutuante)
      $$('[data-cart-count]').forEach((badge) => {
        const prev = badge.textContent;
        badge.textContent = String(state.count);
        badge.hidden = state.count === 0;
        if (prev !== String(state.count) && state.count > 0) {
          badge.classList.remove('is-bump');
          void badge.offsetWidth;
          badge.classList.add('is-bump');
        }
      });
      $$('[data-cart-open]').forEach((btn) => {
        btn.setAttribute('aria-label', state.count
          ? `Abrir carrinho (${state.count} ${state.count === 1 ? 'item' : 'itens'})`
          : 'Abrir carrinho');
      });
      if (el.float) el.float.classList.toggle('is-visible', state.count > 0);

      if (!el.panel) return;

      // Lista
      el.empty.hidden = state.count > 0;
      el.list.hidden = state.count === 0;
      el.list.innerHTML = state.lines.map(lineTemplate).join('');
      initImageFallback(el.list);

      el.itemsCount.textContent = state.count
        ? `${state.count} ${state.count === 1 ? 'peça' : 'peças'}`
        : '';

      renderSummary(state);

      // Carrinho esvaziado durante o checkout → volta para a lista
      if (!state.count && view === 'checkout') goTo('items');
    }

    function renderSummary(state = Cart.getState()) {
      if (!el.subtotal) return;
      const fulfillment = Checkout.getFulfillment();
      const delivery = fulfillment === 'entrega' ? CONFIG.deliveryFee : 0;
      el.subtotal.textContent = moneyOrPending(state.subtotal, state);
      el.delivery.textContent = fulfillment === 'retirada'
        ? 'Retirada na loja'
        : (delivery ? formatPrice(delivery) : 'Grátis');
      el.total.textContent = moneyOrPending(state.subtotal + delivery, state);
      el.total.classList.toggle('is-ask', state.pending);
      el.next.disabled = state.count === 0;
    }

    function goTo(next) {
      view = next;
      el.panel.dataset.view = next;
      $$('.cart__view', el.panel).forEach((v) => {
        const active = v.dataset.view === next;
        v.classList.toggle('is-active', active);
        v.hidden = !active;
      });
      el.step.textContent = VIEWS[next].step;
      el.title.textContent = VIEWS[next].title;
      el.back.hidden = next !== 'checkout';
      el.foot.hidden = next === 'done';

      const isCheckout = next === 'checkout';
      el.nextLabel.textContent = isCheckout ? 'Enviar pelo WhatsApp' : 'Finalizar pedido';
      el.nextIcon.innerHTML = `<use href="${isCheckout ? '#i-whatsapp' : '#i-arrow-right'}"/>`;
      el.foot.classList.toggle('is-checkout', isCheckout);

      el.body.scrollTop = 0;
    }

    function open(startView = 'items') {
      if (typeof closeMobileMenu === 'function') closeMobileMenu();
      lastFocus = document.activeElement;
      hideToast();
      goTo(Cart.getState().count ? startView : 'items');
      el.root.classList.add('is-open');
      el.root.setAttribute('aria-hidden', 'false');
      $$('[data-cart-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
      scrollLock.add('cart');
      window.setTimeout(() => el.close.focus({ preventScroll: true }), 80);
    }

    function close() {
      el.root.classList.remove('is-open');
      el.root.setAttribute('aria-hidden', 'true');
      $$('[data-cart-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
      scrollLock.remove('cart');
      if (view === 'done') window.setTimeout(() => goTo('items'), 600);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    }

    const isOpen = () => el.root && el.root.classList.contains('is-open');

    function trapFocus(e) {
      if (e.key !== 'Tab' || !isOpen()) return;
      const focusables = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])', el.panel)
        .filter((n) => n.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function showDone(url, orderId) {
      lastOrderUrl = url;
      el.doneLink.href = url;
      el.doneId.textContent = `#${orderId}`;
      goTo('done');
    }

    function init() {
      el.root = $('#cartDrawer');
      el.float = $('.cart-float');
      if (!el.root) return;

      el.panel = $('.cart__panel', el.root);
      el.body = $('.cart__body', el.root);
      el.list = $('#cartList');
      el.empty = $('#cartEmpty');
      el.itemsCount = $('#cartItemsCount');
      el.step = $('#cartStep');
      el.title = $('#cartTitle');
      el.back = $('#cartBack');
      el.close = $('.cart__close', el.root);
      el.foot = $('#cartFoot');
      el.next = $('#cartNext');
      el.nextLabel = $('.cart__next-label', el.next);
      el.nextIcon = $('.cart__next-icon', el.next);
      el.subtotal = $('#cartSubtotal');
      el.delivery = $('#cartDelivery');
      el.total = $('#cartTotal');
      el.doneLink = $('#cartDoneLink');
      el.doneId = $('#cartDoneId');

      $$('[data-cart-open]').forEach((btn) => btn.addEventListener('click', () => open()));
      $$('[data-cart-close]', el.root).forEach((btn) => btn.addEventListener('click', close));
      el.back.addEventListener('click', () => goTo('items'));

      el.next.addEventListener('click', () => {
        if (view === 'items') {
          if (Cart.getState().count) goTo('checkout');
        } else if (view === 'checkout') {
          Checkout.submit();
        }
      });

      el.list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const key = btn.dataset.key;
        const line = Cart.getState().lines.find((l) => l.key === key);
        if (!line) return;
        if (btn.dataset.action === 'inc') Cart.setQty(key, line.qty + 1);
        if (btn.dataset.action === 'dec') Cart.setQty(key, line.qty - 1);
        if (btn.dataset.action === 'remove') Cart.remove(key);
      });

      $('#cartContinue') && $('#cartContinue').addEventListener('click', () => {
        close();
        const colecao = document.getElementById('colecao');
        if (colecao) colecao.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
      $('#cartDoneClose') && $('#cartDoneClose').addEventListener('click', close);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) close();
        trapFocus(e);
      });

      Cart.subscribe(render);
    }

    return { init, open, close, goTo, renderSummary, showDone, get lastOrderUrl() { return lastOrderUrl; } };
  })();

  /* ========================================================================
     08. CHECKOUT — formulário, CEP, validação e envio ao WhatsApp
     ======================================================================== */
  const Checkout = (() => {
    let form = null;

    const field = (name) => form && form.elements[name];
    const val = (name) => {
      const f = field(name);
      return f ? String(f.value || '').trim() : '';
    };

    function getFulfillment() {
      if (!form) return 'entrega';
      const checked = form.querySelector('input[name="fulfillment"]:checked');
      return checked ? checked.value : 'entrega';
    }

    function getPayment() {
      const checked = form.querySelector('input[name="payment"]:checked');
      return checked ? checked.value : '';
    }

    function toggleFulfillment() {
      const isDelivery = getFulfillment() === 'entrega';
      $('#addressFields').hidden = !isDelivery;
      $('#pickupInfo').hidden = isDelivery;
      $$('#addressFields [data-required]').forEach((input) => {
        input.required = isDelivery;
      });
      CartUI.renderSummary();
    }

    /* ---- Erros ---- */
    function setError(name, message) {
      let input = field(name);
      if (input && !input.closest) input = input[0]; // grupo de radios (RadioNodeList)
      if (!input) return;
      const wrap = input.closest('.field, .fieldset');
      if (!wrap) return;
      wrap.classList.toggle('is-invalid', Boolean(message));
      const msg = $('.field__error', wrap);
      if (msg) msg.textContent = message || '';
      if (input.setAttribute && input.type !== 'radio') {
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
      }
    }

    function clearErrors() {
      $$('.is-invalid', form).forEach((w) => w.classList.remove('is-invalid'));
      $$('.field__error', form).forEach((m) => { m.textContent = ''; });
      $$('[aria-invalid="true"]', form).forEach((i) => i.setAttribute('aria-invalid', 'false'));
    }

    /* ---- Máscaras ---- */
    const onlyDigits = (s) => String(s).replace(/\D/g, '');

    function maskCep(input) {
      const d = onlyDigits(input.value).slice(0, 8);
      input.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
      return d;
    }

    function maskPhone(input) {
      const d = onlyDigits(input.value).slice(0, 11);
      let out = d;
      if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
      if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
      input.value = out;
    }

    /* ---- Busca de CEP (ViaCEP). Se falhar, o cliente preenche manualmente. ---- */
    let cepRequest = 0;
    async function lookupCep(cep) {
      const hint = $('#cepHint');
      const id = ++cepRequest;
      hint.textContent = 'Buscando endereço...';
      try {
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = window.setTimeout(() => ctrl && ctrl.abort(), 6000);
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, ctrl ? { signal: ctrl.signal } : {});
        window.clearTimeout(timer);
        if (id !== cepRequest) return;
        const data = res.ok ? await res.json() : null;
        if (!data || data.erro) {
          hint.textContent = 'CEP não encontrado. Preencha o endereço manualmente.';
          return;
        }
        if (data.logradouro) field('street').value = data.logradouro;
        if (data.bairro) field('district').value = data.bairro;

        const city = `${data.localidade} - ${data.uf}`;
        if (CONFIG.deliveryCities.includes(city)) {
          field('city').value = city;
          hint.textContent = `${city} · Entrega grátis`;
        } else {
          hint.textContent = `No momento entregamos em ${CONFIG.deliveryCities.map((c) => c.split(' - ')[0]).join(' e ')}.`;
        }
        ['street', 'district', 'city'].forEach((n) => { if (val(n)) setError(n, ''); });
        field('number').focus();
      } catch (err) {
        if (id === cepRequest) hint.textContent = 'Não foi possível buscar o CEP. Preencha manualmente.';
      }
    }

    /* ---- Validação ---- */
    function validate() {
      clearErrors();
      const errors = [];
      const need = (name, message) => {
        if (!val(name)) errors.push([name, message]);
      };

      need('name', 'Informe seu nome.');
      if (val('name') && val('name').length < 3) errors.push(['name', 'Informe seu nome completo.']);

      const phone = onlyDigits(val('phone'));
      if (phone && (phone.length < 10 || phone.length > 11)) {
        errors.push(['phone', 'Telefone inválido. Use DDD + número.']);
      }

      const fulfillment = getFulfillment();
      if (fulfillment === 'entrega') {
        need('city', 'Selecione a cidade.');
        need('district', 'Informe o bairro.');
        need('street', 'Informe a rua.');
        need('number', 'Informe o número (ou “S/N”).');
        const cep = onlyDigits(val('cep'));
        if (cep && cep.length !== 8) errors.push(['cep', 'CEP incompleto.']);
      }

      if (!getPayment()) errors.push(['payment', 'Escolha a forma de pagamento.']);

      errors.forEach(([name, msg]) => setError(name, msg));

      if (errors.length) {
        const firstName = errors[0][0];
        const firstInput = firstName === 'payment'
          ? form.querySelector('input[name="payment"]')
          : field(firstName);
        const wrap = firstInput && firstInput.closest('.field, .fieldset');
        if (wrap) wrap.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        if (firstInput) window.setTimeout(() => firstInput.focus({ preventScroll: true }), 250);
        return null;
      }

      return {
        name: val('name'),
        phone: val('phone'),
        fulfillment,
        cep: val('cep'),
        city: val('city'),
        district: val('district'),
        street: val('street'),
        number: val('number'),
        complement: val('complement'),
        reference: val('reference'),
        payment: getPayment(),
        notes: val('notes'),
      };
    }

    /* ---- Mensagem do pedido ---- */
    function buildOrderMessage(state, data, orderId) {
      const delivery = data.fulfillment === 'entrega' ? CONFIG.deliveryFee : 0;
      const total = state.subtotal + delivery;
      const L = [];

      L.push('*NOVO PEDIDO — D’LEBRON*');
      L.push(`Pedido: #${orderId}`);
      L.push('');
      L.push('*Itens*');
      state.lines.forEach((l) => {
        const size = l.size === SIZE_TBD ? ' (tamanho a confirmar)' : ` (Tam. ${l.size})`;
        const value = l.priced ? formatPrice(l.total) : 'valor a confirmar';
        L.push(`• ${l.qty}x ${l.product.name}${size} — ${value}`);
      });
      L.push('');
      L.push(`Subtotal: ${moneyOrPending(state.subtotal, state)}`);
      L.push(`Entrega: ${data.fulfillment === 'retirada' ? 'Retirada na loja' : (delivery ? formatPrice(delivery) : 'Grátis')}`);
      L.push(`*Total: ${moneyOrPending(total, state)}*`);
      L.push('');
      L.push(`*Cliente:* ${data.name}`);
      if (data.phone) L.push(`*Telefone:* ${data.phone}`);
      L.push(`*Recebimento:* ${data.fulfillment === 'entrega' ? 'Entrega' : 'Retirada na loja'}`);

      if (data.fulfillment === 'entrega') {
        const complement = data.complement ? ` — ${data.complement}` : '';
        L.push('*Endereço:*');
        L.push(`${data.street}, ${data.number}${complement}`);
        L.push(`${data.district} — ${data.city}`);
        if (data.cep) L.push(`CEP: ${data.cep}`);
        if (data.reference) L.push(`Referência: ${data.reference}`);
      }

      L.push('');
      L.push(`*Pagamento:* ${CONFIG.paymentMethods[data.payment] || data.payment}`);
      if (data.notes) {
        L.push('');
        L.push(`*Observações:* ${data.notes}`);
      }
      L.push('');
      L.push('Pedido enviado pelo site da D’Lebron.');

      return L.join('\n');
    }

    const generateOrderId = () => {
      const t = Date.now().toString(36).toUpperCase().slice(-4);
      const r = Math.floor(Math.random() * 36 * 36).toString(36).toUpperCase().padStart(2, '0');
      return `DL${t}${r}`;
    };

    function saveCustomer(data) {
      const { name, phone, cep, city, district, street, number, complement, reference } = data;
      storage.set(CONFIG.storageKeys.customer, { name, phone, cep, city, district, street, number, complement, reference });
    }

    function restoreCustomer() {
      const saved = storage.get(CONFIG.storageKeys.customer, null);
      if (!saved || typeof saved !== 'object') return;
      Object.entries(saved).forEach(([name, value]) => {
        const input = field(name);
        if (input && typeof value === 'string' && !input.value) input.value = value;
      });
    }

    // Futuro: aqui entra o pagamento online / registro do pedido no servidor.
    function sendOrder(message) {
      const url = whatsappLink(message);
      openInNewTab(url);
      return url;
    }

    function submit() {
      const state = Cart.getState();
      if (!state.count) {
        CartUI.goTo('items');
        return;
      }
      const data = validate();
      if (!data) return;

      const orderId = generateOrderId();
      const message = buildOrderMessage(state, data, orderId);
      const url = sendOrder(message);

      saveCustomer(data);
      form.elements.notes.value = '';
      Cart.clear();
      CartUI.showDone(url, orderId);
    }

    function init() {
      form = $('#checkoutForm');
      if (!form) return;

      restoreCustomer();

      $$('input[name="fulfillment"]', form).forEach((r) => r.addEventListener('change', toggleFulfillment));
      $$('input[name="payment"]', form).forEach((r) => r.addEventListener('change', () => setError('payment', '')));

      const cepInput = field('cep');
      cepInput.addEventListener('input', () => {
        const digits = maskCep(cepInput);
        setError('cep', '');
        if (digits.length === 8) lookupCep(digits);
        else $('#cepHint').textContent = '';
      });

      const phoneInput = field('phone');
      phoneInput.addEventListener('input', () => {
        maskPhone(phoneInput);
        setError('phone', '');
      });

      // Limpa o erro assim que o campo é preenchido
      form.addEventListener('input', (e) => {
        if (e.target.name && e.target.name !== 'cep' && e.target.name !== 'phone' && e.target.value.trim()) {
          setError(e.target.name, '');
        }
      });
      form.addEventListener('change', (e) => {
        if (e.target.name === 'city' && e.target.value) setError('city', '');
      });

      // Enter no formulário envia o pedido
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submit();
      });

      toggleFulfillment();
    }

    return { init, submit, getFulfillment };
  })();

  /* ========================================================================
     09. TOAST
     ======================================================================== */
  let toastTimer = null;
  function showToast(text, action) {
    const toast = $('#toast');
    if (!toast) return;
    const msg = $('.toast__text', toast);
    const btn = $('.toast__action', toast);

    msg.textContent = text;
    if (action) {
      btn.hidden = false;
      btn.textContent = action.label;
      btn.onclick = () => {
        hideToast();
        action.onClick();
      };
    } else {
      btn.hidden = true;
      btn.onclick = null;
    }

    toast.classList.remove('is-visible');
    void toast.offsetWidth;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 3600);
  }

  function hideToast() {
    const toast = $('#toast');
    if (toast) toast.classList.remove('is-visible');
  }

  /* ========================================================================
     10. PRELOADER
     ======================================================================== */
  function initPreloader() {
    const preloader = $('#preloader');
    const root = document.documentElement;
    const start = performance.now();
    const MIN_TIME = prefersReducedMotion ? 0 : 1100;
    const MAX_TIME = 2600;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (preloader) preloader.classList.add('is-done');
      window.setTimeout(() => {
        root.classList.add('is-loaded');
        document.body.classList.add('is-loaded');
      }, prefersReducedMotion ? 0 : 250);
      window.setTimeout(() => preloader && preloader.remove(), 1400);
    };

    const onReady = () => {
      const elapsed = performance.now() - start;
      window.setTimeout(finish, Math.max(0, MIN_TIME - elapsed));
    };

    if (document.readyState === 'complete') onReady();
    else window.addEventListener('load', onReady, { once: true });

    // Segurança: nunca prende o usuário no preloader
    window.setTimeout(finish, MAX_TIME);
  }

  /* ========================================================================
     11. HEADER
     ======================================================================== */
  function initHeader() {
    const header = $('#header');
    if (!header) return;

    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 40);

      const locked = document.body.classList.contains('is-locked');
      if (!locked) {
        const goingDown = y > lastY;
        header.classList.toggle('is-hidden', goingDown && y > window.innerHeight * 0.6);
      }

      lastY = y;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();

    // Link ativo conforme a seção visível
    const links = $$('.nav__link');
    const sections = links
      .map((link) => document.getElementById(link.dataset.section))
      .filter(Boolean);

    if (!('IntersectionObserver' in window) || !sections.length) return;

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle('is-active', link.dataset.section === entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* ========================================================================
     12. MENU MOBILE
     ======================================================================== */
  let closeMobileMenu = null;

  function initMobileMenu() {
    const burger = $('#burger');
    const menu = $('#mobileMenu');
    const header = $('#header');
    const floats = $$('.wa-float, .cart-float');
    if (!burger || !menu) return;

    const open = () => {
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fechar menu');
      header.classList.add('menu-open');
      header.classList.remove('is-hidden');
      scrollLock.add('menu');
      floats.forEach((f) => f.classList.add('is-behind-menu'));
    };

    const close = () => {
      if (!menu.classList.contains('is-open')) return;
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menu');
      scrollLock.remove('menu');
      floats.forEach((f) => f.classList.remove('is-behind-menu'));
      window.setTimeout(() => header.classList.remove('menu-open'), 500);
    };

    closeMobileMenu = close;

    burger.addEventListener('click', () => {
      menu.classList.contains('is-open') ? close() : open();
    });

    $$('.mobile-menu__link, .mobile-menu__footer a', menu).forEach((link) => {
      link.addEventListener('click', close);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        close();
        burger.focus();
      }
    });

    // Fecha ao passar para o layout desktop
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => { if (e.matches) close(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ========================================================================
     13. REVEAL AO ROLAR
     ======================================================================== */
  function initReveal() {
    // Atraso escalonado para filhos de containers com [data-stagger]
    $$('[data-stagger]').forEach((group) => {
      Array.from(group.children)
        .filter((child) => child.classList.contains('reveal'))
        .forEach((child, i) => child.style.setProperty('--delay', `${i * 0.09}s`));
    });

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      $$('.reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    observeReveal($$('.reveal'));
  }

  function observeReveal(elements) {
    if (!revealObserver) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    elements.forEach((el) => revealObserver.observe(el));
  }

  /* ========================================================================
     14. PARALLAX (leve, apenas transform)
     ======================================================================== */
  function initParallax() {
    if (prefersReducedMotion) return;

    const items = $$('[data-parallax]');
    if (!items.length) return;

    const visible = new Set();
    let ticking = false;

    const update = () => {
      const vh = window.innerHeight;
      visible.forEach((img) => {
        const section = img.closest('section') || img.parentElement;
        const rect = section.getBoundingClientRect();
        // progresso de -1 (abaixo da tela) a 1 (acima da tela)
        const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
        const offset = Math.max(-1, Math.min(1, progress)) * -10; // em %
        img.style.transform = `translate3d(0, ${offset}%, 0)`;
      });
      ticking = false;
    };

    const requestUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        requestUpdate();
      }, { rootMargin: '10% 0px' });
      items.forEach((img) => io.observe(img));
    } else {
      items.forEach((img) => visible.add(img));
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
    requestUpdate();
  }

  /* ========================================================================
     15. CURSOR PERSONALIZADO (somente mouse)
     ======================================================================== */
  function initCursor() {
    const cursor = $('#cursor');
    if (!cursor || !hasFinePointer || prefersReducedMotion) {
      if (cursor) cursor.remove();
      return;
    }

    const label = $('.cursor__label', cursor);
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let x = mouseX;
    let y = mouseY;

    const loop = () => {
      x += (mouseX - x) * 0.18;
      y += (mouseY - y) * 0.18;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.classList.add('is-active');
    }, { passive: true });

    document.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));

    document.addEventListener('mouseover', (e) => {
      const viewTarget = e.target.closest('[data-cursor]');
      const linkTarget = e.target.closest('a, button, select, label, input[type="radio"]');

      if (viewTarget) {
        label.textContent = viewTarget.dataset.cursor || 'Ver';
        cursor.classList.add('is-view');
        cursor.classList.remove('is-link');
      } else if (linkTarget) {
        cursor.classList.add('is-link');
        cursor.classList.remove('is-view');
      } else {
        cursor.classList.remove('is-view', 'is-link');
      }
    });
  }

  /* ========================================================================
     16. FALLBACK DE IMAGENS
     Se uma imagem não carregar, o container recebe um fundo elegante.
     ======================================================================== */
  function markBroken(img) {
    const holder = img.closest('[data-media]') || img.parentElement;
    if (holder) holder.classList.add('img-fallback');
  }

  function initImageFallback(scope = document) {
    $$('img', scope).forEach((img) => {
      if (img.dataset.fallbackBound) return;
      img.dataset.fallbackBound = 'true';
      img.addEventListener('error', () => markBroken(img), { once: true });
      if (img.complete && img.naturalWidth === 0 && img.src) markBroken(img);
    });
  }

  /* ========================================================================
     18. EXPERIÊNCIA DE SCROLL — VÍDEO CONTROLADO PELA ROLAGEM
     ------------------------------------------------------------------------
     Modo principal: SEQUÊNCIA DE QUADROS NO <canvas>
       • os quadros do vídeo (assets/video/frames/) são desenhados num canvas;
       • trocar de quadro é instantâneo (sem decodificar vídeo a cada passo),
         por isso o movimento fica liso em qualquer aparelho, inclusive iPhone;
       • entre dois quadros é feita uma transição (crossfade) proporcional,
         criando quadros “intermediários” → movimento ainda mais contínuo;
       • a rolagem é suavizada por inércia (o progresso persegue o alvo),
         e esse mesmo progresso suave move vídeo, textos e efeitos.
     Modo ambiente: um canvas minúsculo recebe o quadro atual e é ampliado
       atrás de tudo → o fundo assume as cores do vídeo, quadro a quadro.
     Reserva: se os quadros não carregarem, usa o <video> com scrubbing.
     ======================================================================== */
  function initScrollVideo() {
    const section = $('[data-scroll-video]');
    if (!section) return;

    // Movimento reduzido → versão simplificada (sem scrubbing)
    if (prefersReducedMotion) {
      section.classList.add('is-static');
      return;
    }

    const media = $('[data-sv-media]', section);
    const canvas = $('.sv-canvas', section);
    const ambient = $('.sv-ambient', section);
    const video = $('.sv-video', section);
    const bg = $('.sv-bg', section);
    const shade = $('.sv-shade', section);
    const bar = $('.sv-progress__bar', section);
    if (!media || !canvas) return;

    /* ---- Ajustes finos ---- */
    const VIDEO_END = 0.9;     // o vídeo termina em 90% da seção; o último quadro fica até o fim
    const INERTIA = 0.085;     // suavidade da rolagem: menor = mais macio (0.06–0.15)
    const CROSSFADE = false;   // true = mistura quadros vizinhos (bom p/ vídeos lentos; em giros rápidos gera “fantasma”)
    const lite = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
    const bgLayout = window.matchMedia('(min-aspect-ratio: 6/5)'); // vídeo como fundo de tela inteira
    const isSmall = window.innerWidth < 768;
    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const ease = (t) => t * t * (3 - 2 * t); // smoothstep

    const ctx = canvas.getContext('2d', { alpha: false });
    const actx = ambient ? ambient.getContext('2d', { alpha: false }) : null;
    if (!ctx) return;

    /* ======================================================================
       QUADROS
       ====================================================================== */
    const frameCount = parseInt(section.dataset.frameCount, 10) || 0;
    const frameBase = isSmall ? section.dataset.framesMobile : section.dataset.frames;
    const frameExt = section.dataset.frameExt || 'jpg';
    const frameUrl = (i) => `${frameBase}f${String(i + 1).padStart(3, '0')}.${frameExt}`;

    const frames = new Array(frameCount).fill(null); // HTMLImageElement decodificado
    let loadedCount = 0;
    let failedCount = 0;
    let loadingStarted = false;
    let mode = 'frames'; // 'frames' | 'video'

    // Ordem de carregamento progressiva: 1º, último, depois de 16 em 16, 8 em 8...
    function loadOrder(n) {
      const order = [];
      const seen = new Set();
      const push = (i) => { if (i >= 0 && i < n && !seen.has(i)) { seen.add(i); order.push(i); } };
      push(0);
      push(n - 1);
      for (let step = 16; step >= 1; step = Math.floor(step / 2)) {
        for (let i = 0; i < n; i += step) push(i);
        if (step === 1) break;
      }
      return order;
    }

    function startLoading() {
      if (loadingStarted || !frameCount || !frameBase) return;
      loadingStarted = true;
      const queue = loadOrder(frameCount);
      const CONCURRENCY = 6;

      const next = () => {
        const i = queue.shift();
        if (i === undefined) return;
        const img = new Image();
        img.decoding = 'async';
        img.src = frameUrl(i);
        const done = (ok) => {
          if (ok) {
            frames[i] = img;
            loadedCount += 1;
            if (loadedCount === 1) section.classList.add('sv-has-frames');
            needsDraw = true;
            schedule();
          } else {
            failedCount += 1;
            // Sem quadros (pasta ausente?) → usa o vídeo como reserva
            if (failedCount >= 3 && loadedCount === 0) switchToVideo();
          }
          next();
        };
        const decode = img.decode ? img.decode() : new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        decode.then(() => done(true)).catch(() => done(false));
      };

      for (let k = 0; k < CONCURRENCY; k += 1) next();
    }

    // Quadro carregado mais próximo do índice pedido
    function nearestLoaded(i) {
      if (frames[i]) return i;
      for (let d = 1; d < frameCount; d += 1) {
        if (i - d >= 0 && frames[i - d]) return i - d;
        if (i + d < frameCount && frames[i + d]) return i + d;
      }
      return -1;
    }

    /* ---- Canvas: tamanho real (respeita a densidade de pixels, máx. 2x) ---- */
    function sizeCanvas() {
      // densidade limitada: o quadro original tem 1024 px, não adianta um canvas gigante
      const dpr = Math.min(window.devicePixelRatio || 1, 2, 1800 / Math.max(1, media.offsetWidth));
      const rect = media.getBoundingClientRect();
      // getBoundingClientRect inclui o scale aplicado; usa o tamanho de layout
      const w = Math.max(1, Math.round(media.offsetWidth * dpr));
      const h = Math.max(1, Math.round(media.offsetHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        needsDraw = true;
      }
      if (ambient && (ambient.width !== 24 || ambient.height !== 24)) {
        ambient.width = 24;
        ambient.height = 24;
      }
      return rect;
    }

    // Desenha com “cover” (a caixa tem a mesma proporção, então nada é cortado)
    function drawCover(c, img, alpha, w, h) {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const scale = Math.max(w / iw, h / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      c.globalAlpha = alpha;
      c.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }

    let lastDrawn = -1;
    let needsDraw = true;

    function drawFrame(rawPos, moving) {
      if (!frameCount) return;
      // Parado: mostra um quadro inteiro (nítido). Em movimento: transição entre vizinhos.
      const pos = CROSSFADE && moving ? rawPos : Math.round(rawPos);
      const a = Math.floor(pos);
      const b = Math.min(frameCount - 1, a + 1);
      const t = pos - a;
      const key = Math.round(pos * 100) / 100 + (moving ? 0 : 1000); // evita redesenhar o mesmo estado
      if (!needsDraw && key === lastDrawn) return;

      const ia = nearestLoaded(a);
      if (ia < 0) return;
      const w = canvas.width;
      const h = canvas.height;

      ctx.globalCompositeOperation = 'source-over';
      drawCover(ctx, frames[ia], 1, w, h);

      // Transição entre quadros vizinhos → movimento contínuo
      if (ia === a && t > 0.02 && frames[b] && b !== a) {
        drawCover(ctx, frames[b], t, w, h);
      }
      ctx.globalAlpha = 1;

      // Fundo ambiente: o quadro atual reduzido a 24×24 e ampliado atrás da cena
      if (actx) {
        actx.globalAlpha = 1;
        actx.drawImage(canvas, 0, 0, 24, 24);
      }

      lastDrawn = key;
      needsDraw = false;
    }

    /* ======================================================================
       RESERVA: <video> com scrubbing (só se os quadros não existirem)
       ====================================================================== */
    let vDuration = 0;
    function switchToVideo() {
      if (mode === 'video' || !video) return;
      mode = 'video';
      section.classList.add('sv-mode-video');
      const src = isSmall ? video.dataset.srcMobile : video.dataset.src;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.src = src;
      video.load();
      video.addEventListener('loadedmetadata', () => {
        vDuration = Number.isFinite(video.duration) ? video.duration : 0;
        schedule();
      });
      video.addEventListener('seeked', schedule);
      video.addEventListener('play', () => video.pause());
      window.addEventListener('touchstart', () => {
        const p = video.play();
        if (p && p.then) p.then(() => video.pause()).catch(() => {});
      }, { once: true, passive: true });
    }

    /* ======================================================================
       TEXTOS
       ====================================================================== */
    const moments = $$('[data-sv-moment]', section).map((el) => {
      const [a, b, c, d] = el.dataset.svMoment.split(',').map(Number);
      return { el, a, b, c, d, last: '' };
    });
    const pointsMoment = moments.find((m) => m.el.classList.contains('sv-moment--points'));
    const points = $$('[data-sv-point]', section).map((el, i) => ({
      el,
      a: pointsMoment ? pointsMoment.a + 0.01 + i * 0.03 : 0,
      last: '',
    }));

    function phase(p, a, b, c, d) {
      if (p < a || p > d) return null;
      if (p < b) {
        const k = ease(clamp01((p - a) / (b - a)));
        return { o: k, y: (1 - k) * 40, s: 0.97 + 0.03 * k, blur: (1 - k) * 8 };
      }
      if (p > c) {
        const k = ease(clamp01((p - c) / (d - c)));
        return { o: 1 - k, y: -30 * k, s: 1, blur: k * 6 };
      }
      return { o: 1, y: 0, s: 1, blur: 0 };
    }

    function applyPhase(item, state) {
      let css;
      if (!state || state.o < 0.005) {
        css = 'hidden';
      } else {
        const blur = lite ? '' : `blur(${state.blur.toFixed(2)}px)`;
        css = `${state.o.toFixed(3)}|translate3d(0,${state.y.toFixed(1)}px,0) scale(${state.s.toFixed(4)})|${blur}`;
      }
      if (css === item.last) return;
      item.last = css;

      const s = item.el.style;
      if (css === 'hidden') {
        s.opacity = '0';
        s.visibility = 'hidden';
        item.el.classList.remove('is-interactive');
        return;
      }
      const [o, t, f] = css.split('|');
      s.visibility = 'visible';
      s.opacity = o;
      s.transform = t;
      s.filter = f || 'none';
      item.el.classList.toggle('is-interactive', state.o > 0.6);
    }

    /* ======================================================================
       RENDER
       ====================================================================== */
    let lastMediaCss = '';
    let lastBar = '';

    function render(p, entry) {
      const e = ease(entry);

      // Vídeo: entra (opacity 0→1, scale .96→1) e ganha profundidade sutil (1→1.04)
      const depth = 1 + 0.04 * ease(clamp01(p / VIDEO_END));
      const exitDim = 1 - 0.22 * ease(clamp01((p - VIDEO_END) / (1 - VIDEO_END)));
      // Fundo de tela inteira: entra com um leve “zoom out” (1.06 → 1)
      // Layout em pé: vídeo na largura da tela entra com scale .97 → 1
      const isBg = bgLayout.matches;
      const scale = (isBg ? 1.06 - 0.06 * e : 0.97 + 0.03 * e) * depth;
      const y = isBg ? 0 : (1 - e) * 20 - 8 * clamp01(p);
      const mediaCss = `${(e * exitDim).toFixed(3)}|translate3d(0,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
      if (mediaCss !== lastMediaCss) {
        lastMediaCss = mediaCss;
        const [o, t] = mediaCss.split('|');
        media.style.opacity = o;
        media.style.transform = t;
        if (bg) bg.style.opacity = e.toFixed(3);
        if (ambient) ambient.style.opacity = (e * exitDim * (lite ? 0.75 : 0.9)).toFixed(3);
        if (shade) shade.style.opacity = e.toFixed(3);
      }

      if (bar) {
        const b = clamp01(p).toFixed(3);
        if (b !== lastBar) {
          lastBar = b;
          bar.style.transform = `scaleY(${b})`;
        }
      }

      moments.forEach((m) => applyPhase(m, phase(p, m.a, m.b, m.c, m.d)));
      if (pointsMoment) {
        points.forEach((pt) => applyPhase(pt, phase(p, pt.a, pt.a + 0.04, pointsMoment.c, pointsMoment.d)));
      }
    }

    /* ======================================================================
       LOOP (requestAnimationFrame) — o scroll só agenda; o cálculo é aqui
       ====================================================================== */
    let secTop = 0;
    let secHeight = 0;
    let vh = window.innerHeight;
    let rafId = 0;
    let lastTs = 0;
    let inView = false;
    let isActive = false;
    let pSmooth = null;     // progresso suavizado (inércia)
    let eSmooth = 0;        // entrada suavizada
    let vCurrent = 0;       // tempo atual do vídeo (modo reserva)

    function measure() {
      const rect = section.getBoundingClientRect();
      secTop = rect.top + window.scrollY;
      secHeight = section.offsetHeight;
      vh = window.innerHeight;
      sizeCanvas();
      schedule();
    }

    function schedule() {
      if (!rafId && inView) rafId = window.requestAnimationFrame(tick);
    }

    function tick(ts) {
      rafId = 0;
      const dt = lastTs ? Math.min(64, ts - lastTs) : 16.7;
      lastTs = ts;

      const y = window.scrollY;
      const total = Math.max(1, secHeight - vh);
      const pTarget = (y - secTop) / total;                // < 0 antes · > 1 depois
      const eTarget = clamp01((y - (secTop - vh)) / vh);   // 0 → 1 na entrada

      // Inércia independente da taxa de quadros (60/90/120 Hz)
      const k = 1 - Math.pow(1 - INERTIA, dt / 16.67);
      if (pSmooth === null || Math.abs(pTarget - pSmooth) > 0.5) pSmooth = pTarget; // salto grande (âncora) → acompanha direto
      else pSmooth += (pTarget - pSmooth) * k;
      eSmooth += (eTarget - eSmooth) * k;

      let settled = Math.abs(pTarget - pSmooth) < 0.0004 && Math.abs(eTarget - eSmooth) < 0.001;
      if (settled) {
        pSmooth = pTarget;
        eSmooth = eTarget;
      }

      render(pSmooth, eSmooth);

      const vp = clamp01(pSmooth / VIDEO_END);

      if (mode === 'frames') {
        drawFrame(vp * (frameCount - 1), !settled);
      } else if (video && vDuration) {
        const target = vp * Math.max(0, vDuration - 0.05);
        vCurrent += (target - vCurrent) * k;
        if (Math.abs(target - vCurrent) < 0.002) vCurrent = target;
        else settled = false;
        if (Math.abs(video.currentTime - vCurrent) > 0.01) {
          settled = false;
          if (!video.seeking && video.readyState >= 1) video.currentTime = vCurrent;
        }
      }

      // No celular, os botões flutuantes saem de cena durante a experiência
      const active = pSmooth > -0.02 && pSmooth < 1;
      if (active !== isActive) {
        isActive = active;
        document.body.classList.toggle('sv-active', active);
      }

      if (!settled || needsDraw) schedule();
      else lastTs = 0;
    }

    /* ---- Eventos ---- */
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('orientationchange', () => window.setTimeout(measure, 300));
    window.addEventListener('load', measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);

    if ('IntersectionObserver' in window) {
      // Começa a baixar os quadros quando a seção está a ~2 telas de distância
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) startLoading();
      }, { rootMargin: '200% 0px 200% 0px' }).observe(section);

      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        if (!inView) {
          if (isActive) {
            isActive = false;
            document.body.classList.remove('sv-active');
          }
          pSmooth = null; // ao voltar, retoma da posição real
        } else {
          measure();
          schedule();
        }
      }, { rootMargin: '25% 0px 25% 0px' }).observe(section);
    } else {
      inView = true;
      startLoading();
    }

    measure();
  }

  /* ========================================================================
     17. INICIALIZAÇÃO
     ======================================================================== */
  function init() {
    initPreloader();
    initWhatsAppLinks();
    initImageFallback();
    initReveal();
    initProducts();
    initHeader();
    initMobileMenu();
    Checkout.init();
    CartUI.init();
    initParallax();
    initScrollVideo();
    initCursor();

    const year = $('#year');
    if (year) year.textContent = String(Math.max(2026, new Date().getFullYear()));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();