// ===== ELEMENTOS DO DOM =====
const cartIcon = document.getElementById('cart-icon');
const cartPanel = document.getElementById('cart-panel');
const cartClose = document.getElementById('cart-close');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const mainContent = document.querySelector('main');
const checkoutBtn = document.getElementById('checkout-btn');
const clientNameInput = document.getElementById('client-name'); 
const deliveryAddress = document.getElementById('delivery-address');
const addressInput = document.getElementById('address');
const trocoContainer = document.getElementById('troco-container');
const trocoInput = document.getElementById('troco');
const checkoutError = document.getElementById('checkout-error');

// ===== VARIÁVEIS DE CONTROLE =====
let cart = [];
let deliveryFeeAdded = false;
let garantiuDesconto = false; // Memória para o desconto

// LISTA DE PALAVRAS-CHAVE PARA IDENTIFICAR BEBIDAS (Não recebem desconto)
const bebidasKeywords = [
  "Skol", "Bohemia", "Brahma", "Original", "Spaten", "Heineken", 
  "Chopp", "Coca-Cola", "Antarctica", "Sprite", "Fanta", 
  "Suco", "Del Valle", "2L", "600ml", "Long Neck", "Refrigerante"
];

// Abrir/Fechar Carrinho
cartIcon?.addEventListener('click', () => {
  cartPanel.classList.toggle('open');
  cartPanel.setAttribute('aria-hidden', !cartPanel.classList.contains('open'));
  mainContent?.classList.toggle('shifted');
});

cartClose?.addEventListener('click', () => cartIcon.click());

// ===== ATUALIZAR CARRINHO =====
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
    
    // Verifica se o item é uma bebida pelo nome
    const eBebida = bebidasKeywords.some(k => item.name.toLowerCase().includes(k.toLowerCase()));

    // Se NÃO for bebida e NÃO for a taxa de entrega, entra na conta do desconto
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

  // --- MATEMÁTICA DO DESCONTO ---
  let total = subtotal;
  let htmlDesconto = '';

  if (garantiuDesconto && valorParaDesconto > 0) {
    const valorDesconto = valorParaDesconto * 0.10; // 10% apenas sobre lanches/porções
    total = subtotal - valorDesconto; 
    
    htmlDesconto = `
      <div style="color: #28a745; font-size: 15px; margin-top: 5px;">
        Desconto (10% exceto bebidas): - R$ ${valorDesconto.toFixed(2)}
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

  // Evento de remover item
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', e => {
      const i = e.target.getAttribute('data-index');
      if (cart[i].name === 'Taxa de entrega') {
        const radioBalcao = document.querySelector('input[name=\"pickup\"][value=\"balcão\"]');
        if(radioBalcao) radioBalcao.checked = true;
        deliveryFeeAdded = false;
      }
      cart.splice(i, 1);
      updateCart();
    });
  });
}

// ===== SCROLL DO MENU =====
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

    let name = variation ? `${baseName} (${variation})` : baseName;

    // Evita duplicados rápidos
    const lastItem = cart[cart.length - 1];
    if (lastItem && lastItem.name === name && lastItem.price === price) return;

    cart.push({ name, price });
    updateCart();

    cartPanel.classList.add('open');
    mainContent?.classList.add('shifted');
  });
});

// ===== ENTREGA E PAGAMENTO =====
document.querySelectorAll('input[name=\"pickup\"]').forEach(radio => radio.addEventListener('change', toggleFields));
document.querySelectorAll('input[name=\"payment\"]').forEach(radio => radio.addEventListener('change', toggleFields));

function toggleFields() {
  const pickup = document.querySelector('input[name=\"pickup\"]:checked')?.value || '';
  const payment = document.querySelector('input[name=\"payment\"]:checked')?.value || '';

  if (deliveryAddress) deliveryAddress.style.display = pickup === 'delivery' ? 'block' : 'none';
  if (trocoContainer) trocoContainer.style.display = payment === 'dinheiro' ? 'block' : 'none';

  const deliveryFeeIndex = cart.findIndex(item => item.name === 'Taxa de entrega');

  if (pickup === 'delivery' && deliveryFeeIndex === -1) {
    cart.push({ name: 'Taxa de entrega', price: 4.00 });
    updateCart();
  } else if (pickup !== 'delivery' && deliveryFeeIndex !== -1) {
    cart.splice(deliveryFeeIndex, 1);
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

// ===== FINALIZAR PEDIDO NO WHATSAPP =====
checkoutBtn?.addEventListener('click', () => {
  const nomeCliente = clientNameInput?.value.trim();
  if (!nomeCliente) { showError('Por favor, digite seu nome antes de finalizar.'); clientNameInput.focus(); return; }
  if (cart.length === 0) { showError('Seu carrinho está vazio!'); return; }

  const payment = document.querySelector('input[name=\"payment\"]:checked')?.value || '';
  const pickup = document.querySelector('input[name=\"pickup\"]:checked')?.value || '';
  if (!pickup || !payment) { showError('Selecione a forma de entrega e pagamento.'); return; }

  const troco = trocoInput?.value.trim() || '';
  const endereco = addressInput?.value.trim() || '';

  // Cálculo de valores (Mesma lógica do Carrinho)
  let subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  let valorParaDesconto = cart.reduce((sum, item) => {
    const eBebida = bebidasKeywords.some(k => item.name.toLowerCase().includes(k.toLowerCase()));
    return (!eBebida && item.name !== 'Taxa de entrega') ? sum + parseFloat(item.price) : sum;
  }, 0);

  let total = subtotal;
  let txtDesconto = "";
  if (garantiuDesconto && valorParaDesconto > 0) {
    const desc = valorParaDesconto * 0.10;
    total = subtotal - desc;
    txtDesconto = `\nSubtotal: R$ ${subtotal.toFixed(2)}\nDesconto (Exceto Bebidas): - R$ ${desc.toFixed(2)}`;
  }

  // Montagem da Mensagem
  let msg = `*NOVO PEDIDO - ${nomeCliente}*\n\n`;
  let itensCupom = "";
  cart.forEach(item => {
    const linha = `- ${item.name}: R$ ${parseFloat(item.price).toFixed(2)}`;
    msg += linha + "\n";
    itensCupom += linha + "\n";
  });

  msg += `${txtDesconto}\n*Total Final: R$ ${total.toFixed(2)}*\n\n`;
  msg += `👤 Cliente: ${nomeCliente}\n💳 Pagamento: ${payment}\n📍 Retirada: ${pickup}`;
  if (pickup === 'delivery') msg += `\n🏠 Endereço: ${endereco || '-'}`;
  
  if (payment === 'dinheiro' && troco) {
      let vTroco = parseFloat(troco.replace(',', '.'));
      if (!isNaN(vTroco) && vTroco > total) {
          msg += `\n💵 Troco para R$ ${vTroco.toFixed(2)} (Levar R$ ${(vTroco - total).toFixed(2)})`;
      }
  }

  if (garantiuDesconto) msg += `\n✅ *PEDIDO COM DESCONTO DO SITE!*`;

  // Link do Cupão
  const urlCupom = new URL('cupom.html', window.location.href).href;
  const link = `${urlCupom}?cliente=${encodeURIComponent(nomeCliente)}&itens=${encodeURIComponent(itensCupom)}&total=${encodeURIComponent(total.toFixed(2))}`;
  msg += `\n\n🖨️ *Imprimir Cupom:* \n${link}`;

  window.open(`https://wa.me/5517992800946?text=${encodeURIComponent(msg)}`, '_blank');
});

// ===== BOTÃO TOPO E MENU ATIVO =====
const btnTop = document.getElementById('btn-top');
window.addEventListener('scroll', () => {
  btnTop.style.display = window.scrollY > 400 ? 'flex' : 'none';
  
  const menuLinks = document.querySelectorAll('.menu-scroll a');
  let fromTop = window.scrollY + 120;
  menuLinks.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section && section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop) {
      menuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
});
btnTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ===== MODAL DE PROMOÇÃO =====
const promoModal = document.getElementById('promo-modal');
const btnPromoOk = document.getElementById('btn-promo-ok');

window.addEventListener('load', () => {
  setTimeout(() => { if (promoModal) promoModal.style.display = 'flex'; }, 1000);
});

btnPromoOk?.addEventListener('click', () => {
  garantiuDesconto = true;
  promoModal.style.display = 'none';
  alert("Desconto de 10% Garantido (exceto bebidas)! Aproveite.");
  updateCart();
});

document.getElementById('close-modal')?.addEventListener('click', () => { promoModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === promoModal) promoModal.style.display = 'none'; });
