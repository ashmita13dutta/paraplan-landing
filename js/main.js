'use strict';

/*
  ParaPlan: behaviour for the landing page.
  1. Mobile menu   2. Chanda tracker demo   3. Pricing toggle
  4. Plan buttons  5. Contact form validation
  Scrolling to sections needs no JavaScript (anchor links + CSS smooth scroll).
*/

// Formats a number the Indian way: 120000 -> "₹1,20,000"
const rupees = (n) => '₹' + new Intl.NumberFormat('en-IN').format(n);


/* 1. MOBILE MENU
   JS only adds or removes the class "open"; CSS decides how that looks. */
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('#nav-menu');

function setMenu(open) {
  navMenu.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));   // also drives the X icon in CSS
}

navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
navMenu.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => setMenu(false))      // close the menu after choosing a link
);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});


/* 2. CHANDA TRACKER DEMO
   The data lives in one object (demo); renderDemo() redraws the card from it. */
const GOAL = 120000;

function freshState() {
  return {
    collected: 72000,
    entries: [                                    // newest first
      { name: 'Flat 4B', amount: 2000 },
      { name: 'Mitra Kaku', amount: 1500 },
      { name: 'Rina Di', amount: 500 },
    ],
  };
}
let demo = freshState();

const collectedEl = document.querySelector('#demo-collected');
const progressEl = document.querySelector('#demo-progress');
const barEl = document.querySelector('#demo-bar');
const percentEl = document.querySelector('#demo-percent');
const listEl = document.querySelector('#demo-list');
const chandaForm = document.querySelector('#chanda-form');
const donorInput = document.querySelector('#donor');
const amountInput = document.querySelector('#amount');
const chandaError = document.querySelector('#chanda-error');

function renderDemo() {
  // floor, so the bar never shows 100% before the goal is actually reached
  const pct = Math.min(100, Math.floor((demo.collected / GOAL) * 100));

  collectedEl.textContent = rupees(demo.collected);
  barEl.style.width = pct + '%';
  barEl.classList.toggle('done', pct >= 100);
  progressEl.setAttribute('aria-valuenow', String(pct));
  percentEl.textContent = pct >= 100
    ? 'Goal reached! Time to plan the bhog.'
    : pct + '% of goal collected';

  // rebuild the three newest rows; textContent keeps typed text from running as HTML
  listEl.innerHTML = '';
  demo.entries.slice(0, 3).forEach((entry) => {
    const li = document.createElement('li');
    const who = document.createElement('span');
    const amt = document.createElement('strong');
    who.textContent = entry.name;
    amt.textContent = rupees(entry.amount);
    li.append(who, amt);
    listEl.append(li);
  });
}

// One shared error line: mark the field that needs fixing and move the cursor to it
function showChandaError(input, message) {
  clearChandaError();
  chandaError.textContent = message;
  input.classList.add('invalid');
  input.setAttribute('aria-invalid', 'true');
  input.focus();
}

function clearChandaError() {
  chandaError.textContent = '';
  [donorInput, amountInput].forEach((input) => {
    input.classList.remove('invalid');
    input.removeAttribute('aria-invalid');
  });
}

chandaForm.addEventListener('submit', (event) => {
  event.preventDefault();                          // stop the page from reloading
  const name = donorInput.value.trim();
  const amount = Number(amountInput.value);

  // Rule 1: a flat or name is required before any amount can be added (checked first)
  if (name.length < 2) {
    showChandaError(donorInput, 'Please add your flat or name first.');
    return;
  }

  // Rule 2: the amount must be a whole number from ₹1 to ₹1,00,000
  if (!Number.isInteger(amount) || amount < 1 || amount > 100000) {
    showChandaError(amountInput, 'Enter a whole amount between ₹1 and ₹1,00,000.');
    return;
  }

  clearChandaError();
  demo.collected += amount;
  demo.entries.unshift({ name, amount });          // the name is exactly what was typed
  donorInput.value = '';
  amountInput.value = '';
  renderDemo();
});

// typing in either box clears the error
[donorInput, amountInput].forEach((input) => input.addEventListener('input', clearChandaError));

document.querySelector('#demo-reset').addEventListener('click', () => {
  demo = freshState();
  donorInput.value = '';
  amountInput.value = '';
  clearChandaError();
  renderDemo();
});

renderDemo();


/* 3. PRICING TOGGLE
   Prices are stored in the HTML as data-monthly and data-yearly. */
const billingButtons = document.querySelectorAll('.billing-btn');
const pricedPlans = document.querySelectorAll('.price[data-monthly]');   // the free plan has no data, so it is skipped

function setBilling(period) {                                            // period: "monthly" or "yearly"
  billingButtons.forEach((btn) => {
    const active = btn.dataset.period === period;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });
  pricedPlans.forEach((price) => {
    price.querySelector('.amount').textContent = rupees(Number(price.dataset[period]));
    price.querySelector('.per').textContent = period === 'monthly' ? '/month' : '/year';
  });
}

billingButtons.forEach((btn) =>
  btn.addEventListener('click', () => setBilling(btn.dataset.period))
);


/* 4. PLAN BUTTONS
   "Choose Club" scrolls to the form through its href and also pre-selects Club. */
const planSelect = document.querySelector('#plan');
document.querySelectorAll('[data-plan]').forEach((btn) =>
  btn.addEventListener('click', () => { planSelect.value = btn.dataset.plan; })
);


/* 5. CONTACT FORM VALIDATION
   There is no backend: when everything is valid, a success message is shown. */
const contactForm = document.querySelector('#contact-form');
const successMsg = document.querySelector('#form-success');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;   // something @ something . something

// One rule per field: the input id, a test, and the message to show if it fails
const rules = [
  { id: 'name',    test: (v) => v.length >= 2,        msg: 'Please enter your name (at least 2 letters).' },
  { id: 'email',   test: (v) => emailPattern.test(v), msg: 'Please enter a valid email, like name@example.com.' },
  { id: 'message', test: (v) => v.length >= 10,       msg: 'Please write at least 10 characters.' },
];

function showError(id, message) {
  const input = document.getElementById(id);
  document.getElementById(id + '-error').textContent = message;
  input.classList.toggle('invalid', message !== '');
  input.setAttribute('aria-invalid', String(message !== ''));
}

function validateContactForm() {
  let firstInvalid = null;
  rules.forEach((rule) => {
    const input = document.getElementById(rule.id);
    const ok = rule.test(input.value.trim());      // trim, so spaces alone do not count
    showError(rule.id, ok ? '' : rule.msg);
    if (!ok && !firstInvalid) firstInvalid = input;
  });
  if (firstInvalid) firstInvalid.focus();          // send the user to the first problem
  return firstInvalid === null;
}

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  successMsg.hidden = true;
  if (!validateContactForm()) return;

  const firstName = document.getElementById('name').value.trim().split(' ')[0];
  const plan = planSelect.value;
  contactForm.reset();
  successMsg.textContent = `Thanks, ${firstName}! We got your request for the ${plan} plan and will email you soon.`;
  successMsg.hidden = false;
});

// clear a field's error as soon as the user starts fixing it
rules.forEach((rule) =>
  document.getElementById(rule.id).addEventListener('input', () => showError(rule.id, ''))
);
