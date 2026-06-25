// ===== ELEMENTOS DO DOM =====
const cartIcon = document.getElementById('cart-icon');
const cartPanel = document.getElementById('cart-panel');
const cartClose = document.getElementById('cart-close');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const mainContent = document.querySelector('main');
const checkoutBtn = document.getElementById('checkout-btn');
const clientNameInput = document.getElementById('client-name'); // NOVO: Nome do Cliente
const deliveryAddress = document.getElementById('delivery-address');
const addressInput = document.getElementById('address');
const trocoContainer = document.getElementById('troco-container');
const trocoInput = document.getElementById('troco');
const checkoutError = document.getElementById('checkout-error');

// ===== VARIÁVEIS DE CONTROLE =====
let cart = [];
let deliveryFeeAdded = false;
let garantiuDesconto = false; // Memória para o desconto

// LISTA DE PALAVRAS PARA IDENTIFICAR BEBIDAS (Não recebem desconto)
const bebidasKeywords = ["Skol", "Bohemia", "Brahma", "Original", "Spaten", "Heineken", "Chopp", "Coca-Cola", "Antarctica", "Sprite", "Fanta", "Suco", "Del Valle", "2L", "600ml", "Long Neck", "Refrigerante"];

cartIcon?.addEventListener('click', () => {
  cartPanel.classList.toggle('open');
  cartPanel.setAttribute('aria-hidden', !cartPanel.classList.contains('open'));
  mainContent?.classList.toggle('shifted');
});

cartClose?.addEventListener('click', () => cartIcon.click());

function updateCart() {
  cartItems.innerHTML = '';

  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Seu carrinho está vazio.</p>';
    cartCount.style.display = 'none';
    return;
  }

  cartCount.style.display = 'block';
  cartCount.textContent = cart.length;

  let subtotal = 0;
  let valorParaDesconto = 0; // Soma apenas o que NÃO é bebida
  
  cart.forEach((item, index) => {
    const precoItem = parseFloat(item.price);
    subtotal += precoItem;
    
    // Verifica se é bebida
    const eBebida = bebidasKeywords.some(k => item.name.toLowerCase().includes(k.toLowerCase()));

    // Se NÃO for bebida e NÃO for taxa, entra no cálculo do desconto
    if (!eBebida && item.name !== 'Taxa de entrega') {
        valorParaDesconto += precoItem;
    }

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <h4>${item.name}</h4>
      <span>R$ ${precoItem.toFixed(2)}</span>
      <button class="btn-remove" aria-label="Remover item" data-index="${index}">&times;</button>
    `;
    cartItems.appendChild(div);
  });

  // --- MATEMÁTICA AUTOMÁTICA DO CARRINHO ---
  let total = subtotal;
  let htmlDesconto = '';

  if (garantiuDesconto && valorParaDesconto > 0) {
    const valorDesconto = valorParaDesconto * 0.10; // 10% só sobre lanches
    total = subtotal - valorDesconto; 
    
    htmlDesconto = `
      <div style="color: #28a745; font-size: 16px; margin-top: 5px;">
        Desconto (10% s/ Lanches): - R$ ${valorDesconto.toFixed(2)}
      </div>
    `;
  }

  const totalDiv = document.createElement('div');
  totalDiv.style.marginTop = '15px';
  totalDiv.style.fontWeight = '900';
  totalDiv.style.color = '#ffc107';
  
  if (garantiuDesconto && valorParaDesconto > 0) {
     totalDiv.innerHTML = `Subtotal: R$ ${subtotal.toFixed(2)} ${htmlDesconto} <div style="font-size: 22px; color: #fff; margin-top: 5px;">Total Final: R$ ${total.toFixed(2)}</div>`;
  } else {
     totalDiv.innerHTML = `<div style="font-size: 22px; color: #fff;">Total: R$ ${total.toFixed(2)}</div>`;
  }
  
  cartItems.appendChild(totalDiv);

  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = e.target.getAttribute('data-index');
      if (cart[i].name === 'Taxa de entrega') {
        document.querySelector('input[name="pickup"][value="balcão"]').checked = true;
        deliveryFeeAdded = false;
      }
      cart.splice(i, 1);
      updateCart();
    });
  });
}

// ===== SCROLL HORIZONTAL DO MENU =====
const scrollContainer = document.querySelector('.menu-scroll');
document.querySelector('.scroll-btn.left')?.addEventListener('click', () => {
  scrollContainer.scrollBy({ left: -150, behavior: 'smooth' });
});
document.querySelector('.scroll-btn.right')?.addEventListener('click', () => {
  scrollContainer.scrollBy({ left: 150, behavior: 'smooth' });
});

// ===== ADICIONAR PRODUTOS =====
document.querySelectorAll('.btn-add').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const card = e.currentTarget.closest('.card');
    if (!card) return;

    const baseName = card.dataset.name?.trim() || 'Produto';
    const variation = e.currentTarget.dataset.name?.trim() || '';
    const price = parseFloat(e.currentTarget.dataset.price || card.dataset.price || 0);

    if (!price || price <= 0) return;

    let name = variation ? (variation.toLowerCase().includes(baseName.toLowerCase()) ? variation : `${baseName} (${variation})`) : baseName;

    const lastItem = cart[cart.length - 1];
    if (lastItem && lastItem.name === name && lastItem.price === price) return;

    cart.push({ name, price });
    updateCart();

    cartPanel.classList.add('open');
    mainContent?.classList.add('shifted');
  });
});

// ===== CAMPOS DE ENTREGA E PAGAMENTO =====
document.querySelectorAll('input[name="pickup"]').forEach(radio => {
  radio.addEventListener('change', toggleFields);
});
document.querySelectorAll('input[name="payment"]').forEach(radio => {
  radio.addEventListener('change', toggleFields);
});

function toggleFields() {
  const pickup = document.querySelector('input[name="pickup"]:checked')?.value || '';
  const payment = document.querySelector('input[name="payment"]:checked')?.value || '';

  if (deliveryAddress) deliveryAddress.style.display = pickup === 'delivery' ? 'block' : 'none';
  if (trocoContainer) trocoContainer.style.display = payment === 'dinheiro' ? 'block' : 'none';

  const deliveryFeeIndex = cart.findIndex(item => item.name === 'Taxa de entrega');

  if (pickup === 'delivery' && deliveryFeeIndex === -1) {
    cart.push({ name: 'Taxa de entrega', price: 5.00 });
    deliveryFeeAdded = true;
    updateCart();
  } else if (pickup !== 'delivery' && deliveryFeeIndex !== -1) {
    cart.splice(deliveryFeeIndex, 1);
    deliveryFeeAdded = false;
    updateCart();
  }
}

function showError(msg) {
  if (!checkoutError) return;
  checkoutError.textContent = msg;
  checkoutError.style.display = 'block';
  checkoutError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { checkoutError.style.display = 'none'; }, 4000);
}

// ===== FINALIZAR PEDIDO VIA WHATSAPP =====
checkoutBtn?.addEventListener('click', () => {
  const nomeCliente = clientNameInput?.value.trim();
  if (!nomeCliente) { showError('Por favor, digite seu nome.'); clientNameInput.focus(); return; }
  if (cart.length === 0) { showError('Seu carrinho está vazio!'); return; }

  const payment = document.querySelector('input[name="payment"]:checked')?.value || '';
  const pickup = document.querySelector('input[name="pickup"]:checked')?.value || '';
  if (!pickup || !payment) { showError('Selecione a forma de entrega e pagamento.'); return; }

  const troco = trocoInput?.value.trim() || '';
  const endereco = addressInput?.value.trim() || 'Não informado';

  let plainMessage = `*NOVO PEDIDO - ${nomeCliente}*\n\n`;
  let itensParaCupom = ''; 

  cart.forEach(item => {
    const linhaItem = `- ${item.name} - R$ ${parseFloat(item.price).toFixed(2)}`;
    plainMessage += `${linhaItem}\n`;
    itensParaCupom += `${linhaItem}\n`;
  });

  // Matemática dos Valores Finais (Recalculando para garantir precisão no WhatsApp)
  let subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  let valorParaDesconto = cart.reduce((sum, item) => {
    const eBebida = bebidasKeywords.some(k => item.name.toLowerCase().includes(k.toLowerCase()));
    return (!eBebida && item.name !== 'Taxa de entrega') ? sum + parseFloat(item.price) : sum;
  }, 0);

  let total = subtotal;
  if (garantiuDesconto && valorParaDesconto > 0) {
    const desconto = valorParaDesconto * 0.10;
    total = subtotal - desconto;
    plainMessage += `\nSubtotal: R$ ${subtotal.toFixed(2)}\nDesconto (10% s/ Lanches): - R$ ${desconto.toFixed(2)}`;
  }

  plainMessage += `\n*Total Final: R$ ${total.toFixed(2)}*\n\n`;
  plainMessage += `👤 Cliente: ${nomeCliente}\n💳 Pagamento: ${payment}\n📍 Retirada: ${pickup}\n`;

  if (pickup === 'delivery') {
      plainMessage += `🏠 Endereço: ${endereco}\n`;
      itensParaCupom += `\nEndereço: ${endereco}`;
  }
  
  if (payment === 'dinheiro' && troco) {
      let valorTrocoDigitado = parseFloat(troco.replace(',', '.'));
      if (!isNaN(valorTrocoDigitado) && valorTrocoDigitado > total) {
          let trocoReal = valorTrocoDigitado - total;
          plainMessage += `💵 Troco p/: R$ ${valorTrocoDigitado.toFixed(2)} \n*(Motoboy, LEVAR R$ ${trocoReal.toFixed(2)} DE TROCO)*\n`;
      } else {
          plainMessage += `💵 Troco p/: ${troco}\n`;
      }
  }

  if (garantiuDesconto) plainMessage += `\n✅ *ESTE PEDIDO FOI FEITO PELO SITE E GARANTIU O DESCONTO!*`;

  // GERAÇÃO DO LINK DO CUPOM COM ENDEREÇO
  const urlBase = new URL('cupom.html', window.location.href).href;
  const linkCupom = `${urlBase}?cliente=${encodeURIComponent(nomeCliente)}&itens=${encodeURIComponent(itensParaCupom)}&total=${encodeURIComponent(total.toFixed(2))}&endereco=${encodeURIComponent(endereco)}`;
  
  plainMessage += `\n\n🖨️ *Para imprimir o cupom, clique no link:* \n${linkCupom}`;

  window.open(`https://wa.me/5517992800946?text=${encodeURIComponent(plainMessage)}`, '_blank');
});

// ===== MENU E BOTÃO TOPO =====
const menuLinks = document.querySelectorAll('.menu-scroll a');
window.addEventListener('scroll', () => {
  let fromTop = window.scrollY + 120;
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const section = document.querySelector(href);
      if (section && section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop) {
        menuLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    }
  });
});

const btnTop = document.getElementById('btn-top');
window.addEventListener('scroll', () => { btnTop.style.display = window.scrollY > 400 ? 'flex' : 'none'; });
btnTop?.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });

// ===== LÓGICA DO MODAL DE DESCONTO =====
const promoModal = document.getElementById('promo-modal');
const closeModal = document.getElementById('close-modal');
const btnPromoOk = document.getElementById('btn-promo-ok');

if (promoModal) promoModal.style.display = 'flex';

if (btnPromoOk) {
  btnPromoOk.addEventListener('click', () => {
    garantiuDesconto = true; 
    promoModal.style.display = 'none';
    alert("Desconto Garantido! Aproveite.");
    updateCart(); 
  });
}

if (closeModal) closeModal.addEventListener('click', () => { promoModal.style.display = 'none'; });
window.addEventListener('click', (evento) => { if (evento.target === promoModal) promoModal.style.display = 'none'; });
