// ===== ELEMENTOS DO DOM =====
const cartIcon = document.getElementById('cart-icon');
const cartPanel = document.getElementById('cart-panel');
const cartClose = document.getElementById('cart-close');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const mainContent = document.querySelector('main');
const checkoutBtn = document.getElementById('checkout-btn');
const deliveryAddress = document.getElementById('delivery-address');
const addressInput = document.getElementById('address');
const trocoContainer = document.getElementById('troco-container');
const trocoInput = document.getElementById('troco');
const checkoutError = document.getElementById('checkout-error'); // novo

// ===== CARRINHO =====
let cart = [];
let deliveryFeeAdded = false;

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

  let total = 0;
  cart.forEach((item, index) => {
    total += parseFloat(item.price);
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <h4>${item.name}</h4>
      <span>R$ ${parseFloat(item.price).toFixed(2)}</span>
      <button class="btn-remove" aria-label="Remover item" data-index="${index}">&times;</button>
    `;
    cartItems.appendChild(div);
  });

  const totalDiv = document.createElement('div');
  totalDiv.style.marginTop = '10px';
  totalDiv.style.fontWeight = '900';
  totalDiv.style.color = '#ffc107';
  totalDiv.textContent = `Total: R$ ${total.toFixed(2)}`;
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

    let name;
    if (!variation) {
      name = baseName;
    } else if (variation.toLowerCase().includes(baseName.toLowerCase())) {
      name = variation;
    } else {
      name = `${baseName} (${variation})`;
    }

    const lastItem = cart[cart.length - 1];
    if (lastItem && lastItem.name === name && lastItem.price === price) return;

    cart.push({ name, price });
    updateCart();

    cartPanel.classList.add('open');
    mainContent?.classList.add('shifted');
  });
});

// ===== MOSTRAR CAMPO DE ENDEREÇO E TROCO =====
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
    cart.push({ name: 'Taxa de entrega', price: 4.00 });
    deliveryFeeAdded = true;
    updateCart();
  } else if (pickup !== 'delivery' && deliveryFeeIndex !== -1) {
    cart.splice(deliveryFeeIndex, 1);
    deliveryFeeAdded = false;
    updateCart();
  }
}

// ===== FUNÇÃO PARA MOSTRAR ERROS BONITOS =====
function showError(msg) {
  if (!checkoutError) return;
  checkoutError.textContent = msg;
  checkoutError.style.display = 'block';
  checkoutError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    checkoutError.style.display = 'none';
  }, 4000); // esconde após 4s
}

// ===== FINALIZAR PEDIDO VIA WHATSAPP =====
checkoutBtn?.addEventListener('click', () => {
  if (cart.length === 0) {
    showError('Seu carrinho está vazio!');
    return;
  }

  const payment = document.querySelector('input[name="payment"]:checked')?.value || '';
  const pickup = document.querySelector('input[name="pickup"]:checked')?.value || '';

  if (!pickup) {
    showError('Selecione se o pedido será retirado no balcão ou por delivery.');
    return;
  }

  if (!payment) {
    showError('Selecione a forma de pagamento.');
    return;
  }

  const troco = trocoInput?.value.trim() || '';
  const endereco = addressInput?.value.trim() || '';

  let message = 'Olá, gostaria de fazer o pedido:%0A';
  cart.forEach(item => {
    message += `- ${item.name} - R$ ${parseFloat(item.price).toFixed(2)}%0A`;
  });

  const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  message += `Total: R$ ${total.toFixed(2)}%0A`;
  message += `Pagamento: ${payment}%0A`;
  message += `Retirada: ${pickup}%0A`;

  if (pickup === 'delivery') message += `Endereço: ${endereco || '-'}%0A`;
  if (payment === 'dinheiro' && troco) message += `Precisa de troco para: R$ ${troco}%0A`;

  window.open(`https://wa.me/5517992800946?text=${message}`, '_blank');
});

// ===== MENU FIXO E SCROLL SUAVE =====
const menuLinks = document.querySelectorAll('.menu-scroll a');
window.addEventListener('scroll', () => {
  let fromTop = window.scrollY + 120;
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    const section = document.querySelector(href);
    if (!section) return;
    if (section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop) {
      menuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    }
  });
});

menuLinks.forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const offset = 80;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    }
  });
});

// ===== BOTÃO VOLTAR AO TOPO =====
const btnTop = document.getElementById('btn-top');

window.addEventListener('scroll', () => {
  btnTop.style.display = window.scrollY > 400 ? 'flex' : 'none';
});

btnTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
