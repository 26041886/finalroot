/* ═══════════════════════════════════════════
   ROOTLINK PRO — FULL APP LOGIC
   Auth · Pager · Groot AI Voice · Data
═══════════════════════════════════════════ */

/* ── LANGUAGE STRINGS ── */
const LANGS = {
  en:  { greeting:'Good',  morning:'Morning', afternoon:'Afternoon', evening:'Evening',
         tagline:'Your smart agricultural marketplace for Mopani District, Limpopo' },
  nso: { greeting:'Dumelang', morning:'Masa', afternoon:'Mosegare', evening:'Mantšiboa',
         tagline:'Mmaraka wa temo wa Mopani District' },
  ts:  { greeting:'Avuxeni', morning:'Xikati', afternoon:'Nkarhi wa nhlikanhi', evening:'Vusiku',
         tagline:'Ndhawu ya vuhweleri bya timo – Mopani District' },
  ve:  { greeting:'Ndaa', morning:'Matsheloni', afternoon:'Masiari', evening:'Madekwane',
         tagline:'Nḓowelo ya vhulimi Mopani District' }
};
let currentLang = 'en';
function t(section, key) { return (LANGS[currentLang]||LANGS.en)[key] || (LANGS.en[key]||''); }
function switchLang(l) { currentLang = l; updateHomeGreeting(); }

/* ── TOAST ── */
function showToast(msg, dur=3200) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

/* ════════════════════════════════════════
   AUTH
════════════════════════════════════════ */
const AUTH_KEY = 'rl_pro_user';
let currentUser = null;

function showAuthTab(tab) {
  document.getElementById('form-signin').style.display = tab==='signin'?'flex':'none';
  document.getElementById('form-signup').style.display = tab==='signup'?'flex':'none';
  document.getElementById('tab-signin').classList.toggle('active', tab==='signin');
  document.getElementById('tab-signup').classList.toggle('active', tab==='signup');
}

function doSignIn() {
  const phone = document.getElementById('si-phone').value.trim();
  const pass  = document.getElementById('si-pass').value;
  const err   = document.getElementById('signin-err');

  if (!phone || !pass) { showAuthError(err, 'Please fill in all fields.'); return; }

  const stored = JSON.parse(localStorage.getItem(AUTH_KEY+'_users') || '[]');
  const user = stored.find(u => (u.phone === phone || u.email === phone) && u.pass === pass);

  if (user) {
    loginUser(user);
  } else if (phone.toLowerCase() === 'demo' || phone === '+27720000000') {
    loginUser(demoUser());
  } else {
    showAuthError(err, 'Incorrect phone/email or password. Try the Demo Account.');
  }
}

function doSignUp() {
  const fname = document.getElementById('su-fname').value.trim();
  const lname = document.getElementById('su-lname').value.trim();
  const phone = document.getElementById('su-phone').value.trim();
  const email = document.getElementById('su-email').value.trim();
  const role  = document.getElementById('su-role').value;
  const pass  = document.getElementById('su-pass').value;
  const err   = document.getElementById('signup-err');

  if (!fname||!lname||!phone||!email||!pass) { showAuthError(err, 'Please fill in all fields.'); return; }
  if (pass.length < 6) { showAuthError(err, 'Password must be at least 6 characters.'); return; }

  const stored = JSON.parse(localStorage.getItem(AUTH_KEY+'_users') || '[]');
  if (stored.find(u => u.phone===phone || u.email===email)) {
    showAuthError(err, 'An account with that phone/email already exists.'); return;
  }

  const user = { id:'u_'+Date.now(), fname, lname, name:fname+' '+lname, phone, email, role, pass,
                 avatar: fname[0].toUpperCase(), joined: new Date().toLocaleDateString('en-ZA') };
  stored.push(user);
  localStorage.setItem(AUTH_KEY+'_users', JSON.stringify(stored));
  loginUser(user);
}

function doDemo() {
  loginUser(demoUser());
}

function demoUser() {
  return { id:'demo_1', fname:'Thabo', lname:'Sithole', name:'Thabo Sithole',
           phone:'+27720000000', email:'thabo@rootlink.co.za', role:'farmer',
           avatar:'T', joined:'01/01/2024' };
}

function showAuthError(el, msg) {
  el.textContent = msg; el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 5000);
}

function loginUser(user) {
  currentUser = user;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app').style.display = '';
  document.getElementById('groot-fab').style.display = '';
  initApp();
}

function doSignOut() {
  if (!confirm('Sign out of RootLink Pro?')) return;
  currentUser = null;
  localStorage.removeItem(AUTH_KEY);
  closeDrawer();
  document.getElementById('app').style.display = 'none';
  document.getElementById('groot-fab').style.display = 'none';
  document.getElementById('auth-screen').style.display = 'flex';
  speechSynthesis && speechSynthesis.cancel();
}

/* Auto-login on reload */
(function checkAuth() {
  const saved = localStorage.getItem(AUTH_KEY);
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      document.getElementById('auth-screen').style.display = 'none';
      document.getElementById('app').style.display = '';
      document.getElementById('groot-fab').style.display = '';
      document.addEventListener('DOMContentLoaded', initApp);
    } catch(e) {}
  }
})();

/* ════════════════════════════════════════
   APP INIT
════════════════════════════════════════ */
function initApp() {
  updateUserUI();
  updateHomeGreeting();
  renderMarketplace();
  renderCollab();
  renderLogistics();
  renderProcessing();
  renderStorage();
  renderFarmLink();
  renderCommunity('general');
  initMap();
  showPage('home');
}

function updateUserUI() {
  if (!currentUser) return;
  const av = currentUser.avatar || currentUser.name[0].toUpperCase();
  document.getElementById('nav-av').textContent = av;
  document.getElementById('drawer-av').textContent = av;
  document.getElementById('drawer-uname').textContent = currentUser.name;
  document.getElementById('drawer-uemail').textContent = (currentUser.role||'farmer').charAt(0).toUpperCase()+(currentUser.role||'farmer').slice(1)+' · Mopani';
  document.getElementById('fl-av').textContent = av;
  document.getElementById('fl-name').textContent = currentUser.name;
  const roleMap = {farmer:'Farmer',buyer:'Buyer / Trader',transporter:'Transporter',processor:'Processor'};
  document.getElementById('fl-role-badge').textContent = (roleMap[currentUser.role]||'Farmer')+' · Mopani';
}

function updateHomeGreeting() {
  if (!currentUser) return;
  const h = new Date().getHours();
  const L = LANGS[currentLang]||LANGS.en;
  const tod = h<12 ? L.morning : h<17 ? L.afternoon : L.evening;
  document.getElementById('home-user-name').textContent = L.greeting+', '+currentUser.fname+'! Good '+tod+'. 🌾';
  document.getElementById('home-welcome-sub').textContent = L.tagline;
  document.getElementById('home-user-role').textContent =
    (currentUser.role||'farmer').charAt(0).toUpperCase()+(currentUser.role||'farmer').slice(1)+' · Mopani District';
}

/* ════════════════════════════════════════
   PAGER NAV
════════════════════════════════════════ */
const PAGE_MAP = {
  home:'page-home', market:'page-market', collab:'page-collab',
  logistics:'page-logistics', quality:'page-quality', map:'page-map',
  processing:'page-processing', storage:'page-storage', farmlink:'page-farmlink',
  community:'page-community', premium:'page-premium'
};
const BOT_MAP = { home:'bot-home', market:'bot-market', quality:'bot-quality', community:'bot-community' };
let currentPage = 'home';

function showPage(key) {
  currentPage = key;
  Object.values(PAGE_MAP).forEach(id => { document.getElementById(id)?.classList.remove('active'); });
  document.getElementById(PAGE_MAP[key])?.classList.add('active');

  // bottom nav active
  document.querySelectorAll('.bot-btn').forEach(b => b.classList.remove('active'));
  if (BOT_MAP[key]) document.getElementById(BOT_MAP[key])?.classList.add('active');

  // drawer active
  document.querySelectorAll('.drawer-item').forEach(el => {
    el.classList.toggle('active', el.textContent.trim().toLowerCase().startsWith(key) ||
      (key==='collab' && el.textContent.includes('Collaborat')) ||
      (key==='farmlink' && el.textContent.includes('FarmLink')) ||
      (key==='community' && el.textContent.includes('Community')) ||
      (key==='quality' && el.textContent.includes('Quality')) ||
      (key==='processing' && el.textContent.includes('Process')) ||
      (key==='storage' && el.textContent.includes('Storage')) ||
      (key==='premium' && el.textContent.includes('Premium'))
    );
  });

  // init map on first visit
  if (key==='map' && !window._mapInited) { setTimeout(initMap, 100); }

  closeDrawer();
  window.scrollTo && window.scrollTo(0,0);
}

function navTo(key) { showPage(key); }

/* ════════════════════════════════════════
   DRAWER
════════════════════════════════════════ */
function toggleDrawer() { document.body.classList.toggle('drawer-open'); }
function closeDrawer()  { document.body.classList.remove('drawer-open'); }

/* ════════════════════════════════════════
   SEED DATA
════════════════════════════════════════ */
const LISTINGS = [
  {id:1,name:'Roma Tomatoes',cat:'Vegetables',price:14.5,qty:800,sold:320,loc:'Tzaneen',desc:'Grade A, field-grown, pesticide-free.',farmer:'Khutso Ramaphosa',farm:'Ramaphosa Farms',av:'K',verified:true,img:'images/tomatoes.jpg'},
  {id:2,name:'Navel Oranges',cat:'Fruits',price:9.8,qty:1200,sold:900,loc:'Phalaborwa',desc:'Sweet, freshly harvested.',farmer:'Nomsa Dlamini',farm:'Sunrise Citrus',av:'N',verified:true,img:'images/bakkie-veg.jpg'},
  {id:3,name:'Baby Spinach',cat:'Vegetables',price:22.0,qty:300,sold:120,loc:'Giyani',desc:'Hydroponic, pesticide-free.',farmer:'Thabo Sithole',farm:'Green Roots',av:'T',verified:false,img:'images/cabbage.jpg'},
  {id:4,name:'Purple Cabbage',cat:'Vegetables',price:8.5,qty:650,sold:200,loc:'Tzaneen',desc:'Firm, vibrant heads.',farmer:'Lerato Mokoena',farm:'Lebo\'s Garden',av:'L',verified:true,img:'images/cabbage.jpg'},
  {id:5,name:'Morogo (Wild Spinach)',cat:'Herbs',price:18.0,qty:150,sold:60,loc:'Nkowankowa',desc:'Traditionally harvested.',farmer:'Mmapitsi Nkuna',farm:'Traditional Harvest',av:'M',verified:false,img:'images/bakkie-veg.jpg'},
  {id:6,name:'Cherry Tomatoes',cat:'Vegetables',price:28.5,qty:200,sold:140,loc:'Tzaneen',desc:'Premium export quality.',farmer:'Sipho Mabunda',farm:'Mabunda Holdings',av:'S',verified:true,img:'images/tomatoes.jpg'},
  {id:7,name:'Avocado (Hass)',cat:'Fruits',price:5.5,qty:2500,sold:1800,loc:'Tzaneen',desc:'Mature, ready-to-ripen.',farmer:'Funani Chauke',farm:'Chauke Avocados',av:'F',verified:true,img:'images/bakkie-veg.jpg'},
  {id:8,name:'Butternut Squash',cat:'Vegetables',price:7.2,qty:900,sold:300,loc:'Maruleng',desc:'Large, firm.',farmer:'Tinyiko Maluleke',farm:'Maluleke Farms',av:'T',verified:false,img:'images/cabbage.jpg'},
  {id:9,name:'Mango (Tommy Atkins)',cat:'Fruits',price:6.9,qty:3000,sold:2200,loc:'Phalaborwa',desc:'Fully ripe, sweet.',farmer:'Joyce Nhlapo',farm:'Nhlapo Orchards',av:'J',verified:true,img:'images/bakkie-veg.jpg'},
  {id:10,name:'Butterhead Lettuce',cat:'Vegetables',price:16.0,qty:400,sold:280,loc:'Tzaneen',desc:'Crisp, loose-leaf.',farmer:'Vusumuzi Zondo',farm:'Fresh Greens SA',av:'V',verified:true,img:'images/cabbage.jpg'},
  {id:11,name:'Rooibos Herbs',cat:'Herbs',price:45.0,qty:80,sold:20,loc:'Giyani',desc:'Dried, premium blend.',farmer:'Nandi Mthembu',farm:'Heritage Herbs',av:'N',verified:false,img:'images/bakkie-veg.jpg'},
  {id:12,name:'Maize (White)',cat:'Grains',price:4.2,qty:5000,sold:1500,loc:'Tzaneen',desc:'Dry, cleaned.',farmer:'Bongani Sithole',farm:'Sithole Grains',av:'B',verified:true,img:'images/bakkie-veg.jpg'},
  {id:13,name:'Sweet Peppers',cat:'Vegetables',price:19.5,qty:350,sold:150,loc:'Nkowankowa',desc:'Mixed colours.',farmer:'Tryphina Mawela',farm:'Rainbow Peppers',av:'T',verified:true,img:'images/tomatoes.jpg'},
  {id:14,name:'Free-Range Eggs',cat:'Livestock',price:3.5,qty:600,sold:400,loc:'Tzaneen',desc:'Per egg, mixed sizes.',farmer:'Albert Mabasa',farm:'Mabasa Poultry',av:'A',verified:true,img:'images/bakkie-veg.jpg'},
  {id:15,name:'Brinjal (Eggplant)',cat:'Vegetables',price:11.0,qty:280,sold:90,loc:'Maruleng',desc:'Firm, glossy.',farmer:'Sindisiwe Nxumalo',farm:'Nxumalo Veg',av:'S',verified:false,img:'images/cabbage.jpg'},
  {id:16,name:'Sweet Potatoes',cat:'Vegetables',price:6.8,qty:1100,sold:600,loc:'Giyani',desc:'Orange-fleshed.',farmer:'Kgomotso Phiri',farm:'Phiri Fields',av:'K',verified:true,img:'images/bakkie-veg.jpg'},
];

const CARRIERS = [
  {name:'Limpopo Agri Logistics',area:'Tzaneen · Polokwane · Jo\'burg',fleet:'12 vehicles (bakkie to semi)',logo:'LAL',
   img:'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80'},
  {name:'Mopani Fresh Transport',area:'All Mopani District',fleet:'8 bakkies, 4 reefers',logo:'MFT',
   img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'},
  {name:'Maruleng Carriers',area:'Maruleng · Phalaborwa',fleet:'5 trucks (3t–8t)',logo:'MC',
   img:'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80'},
  {name:'GreenRoute SA',area:'Regional & National',fleet:'20+ vehicles, cold chain',logo:'GR',
   img:'https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=600&q=80'},
];

const PROCESSORS = [
  {name:'Tzaneen Valley Packers',loc:'Tzaneen',crops:'Tomatoes, Citrus, Avocados',rate:'R100/day',cap:'30t/day',img:'images/processing.jpg'},
  {name:'Mopani Agri-Processing Hub',loc:'Giyani',crops:'Maize, Groundnuts, Sunflower',rate:'R200/day',cap:'50t/day',img:'images/warehouse.jpg'},
  {name:'Phalaborwa Fresh Pack',loc:'Phalaborwa',crops:'Mango, Citrus, Export veg',rate:'R150/day',cap:'20t/day',img:'images/processing.jpg'},
  {name:'Maruleng Veg Centre',loc:'Maruleng',crops:'All vegetables',rate:'R100/day',cap:'15t/day',img:'images/warehouse.jpg'},
];

const STORAGE_UNITS = [
  {name:'Tzaneen CoolStore',loc:'Tzaneen Industrial',price:200,disc:'10% off for 3+ months',spec:'2°C–8°C, 400t capacity, 24/7 monitoring',img:'images/warehouse.jpg'},
  {name:'Phalaborwa Coldrooms',loc:'Phalaborwa Township',price:100,disc:'First month free',spec:'0°C–5°C, 150t capacity, generator backup',img:'images/processing.jpg'},
  {name:'Mopani Agri Storage',loc:'Giyani',price:150,disc:'Cooperative rates available',spec:'Ambient + cold, 600t total capacity',img:'images/warehouse.jpg'},
  {name:'Maruleng Cold Chain',loc:'Maruleng',price:100,disc:'Transport links included',spec:'4°C–10°C, 80t, Mopani-approved',img:'images/processing.jpg'},
];

const CHAT_DATA = {
  general: [
    {u:'Khutso R.',av:'K',msg:'Good morning everyone! Tomato prices are very good at Tzaneen market today.',time:'08:14'},
    {u:'Nomsa D.',av:'N',msg:'I sold my oranges to that Johannesburg buyer yesterday. R9.80/kg is excellent!',time:'08:22'},
    {u:'Thabo S.',av:'T',msg:'Anyone knows a good reefer going to Polokwane this Thursday?',time:'08:45'},
    {u:'Lerato M.',av:'L',msg:'Check the logistics page, there are several carriers listed.',time:'08:47'},
    {u:'Sipho M.',av:'S',msg:'I have a bakkie going that way Thursday morning.',time:'09:02'},
  ],
  market_prices: [
    {u:'Joyce N.',av:'J',msg:'Mangoes: R6.90/kg. Tzaneen fresh produce market.',time:'07:30'},
    {u:'Bongani S.',av:'B',msg:'White maize: R4.20/kg bulk. Negotiable for 5t+',time:'07:55'},
    {u:'Khutso R.',av:'K',msg:'Tomatoes hit R14.50/kg today, up from R12 last week.',time:'08:10'},
    {u:'Funani C.',av:'F',msg:'Avocado market is flooded. Dropped to R5.50/kg from R8.',time:'08:30'},
  ],
  weather: [
    {u:'System',av:'🌤',msg:'Mopani District forecast: Sunny Mon–Wed, Rain expected Thu–Fri. High 29°C.',time:'06:00'},
    {u:'Tinyiko M.',av:'T',msg:'I saw that forecast. Planning to harvest butternut Wednesday then.',time:'07:12'},
    {u:'Mmapitsi N.',av:'M',msg:'Good idea. Last time I waited too long and the rain damaged the crop.',time:'07:45'},
  ],
  equipment: [
    {u:'Albert M.',av:'A',msg:'Anyone have a tractor to hire for the weekend near Tzaneen?',time:'09:30'},
    {u:'Vusumuzi Z.',av:'V',msg:'I have a Massey Ferguson 35, R800/day. WhatsApp me.',time:'09:45'},
    {u:'Sindisiwe N.',av:'S',msg:'There\'s also the Maruleng Farmers Cooperative, they hire equipment.',time:'10:00'},
  ],
  youth: [
    {u:'Kgomotso P.',av:'K',msg:'Just completed the DAFF young farmer training! So much to learn.',time:'10:00'},
    {u:'Tryphina M.',av:'T',msg:'Which training? I want to apply too.',time:'10:15'},
    {u:'Kgomotso P.',av:'K',msg:'Department of Agriculture, Forestry and Fisheries. Apply at their Tzaneen office.',time:'10:22'},
    {u:'Nandi M.',av:'N',msg:'Limpopo has good youth farmer grants too. Groot AI can help you research.',time:'10:35'},
  ],
};

const POSTS = [
  {id:1,user:'Khutso Ramaphosa',av:'K',time:'2 hours ago',img:'images/tomatoes.jpg',
   body:'Had an amazing harvest this season! 800kg of Roma tomatoes ready for market. Using integrated pest management has really paid off this year. 🍅🌱',
   likes:24,liked:false,comments:[{u:'Nomsa',txt:'Wonderful! What spray schedule did you use?'},{u:'Sipho',txt:'Looks great Khutso!'}]},
  {id:2,user:'Funani Chauke',av:'F',time:'5 hours ago',img:null,
   body:'Reminder to all avocado growers: apply fungicide before the rain on Thursday. I lost 20% of my crop last year to fungal disease after heavy rains. Prevention is cheaper than cure! 🥑',
   likes:31,liked:false,comments:[{u:'Lerato',txt:'Thanks for the tip! Which fungicide do you recommend?'}]},
  {id:3,user:'Joyce Nhlapo',av:'J',time:'Yesterday',img:'images/bakkie-veg.jpg',
   body:'Loaded up and heading to the Johannesburg market! 3 tons of mangoes. Praying for good prices. 🚛🥭 Anyone else selling in Joburg this week?',
   likes:18,liked:false,comments:[]},
  {id:4,user:'Bongani Sithole',av:'B',time:'2 days ago',img:null,
   body:'Pro tip: Join the Tzaneen Smallholder Cooperative. We get 15% better prices on inputs because we bulk-buy together. DM me for membership details.',
   likes:45,liked:false,comments:[{u:'Tryphina',txt:'I joined last month. Already saved R800 on fertilizer!'},{u:'Kgomotso',txt:'Adding this to my to-do list!'}]},
];

/* ════════════════════════════════════════
   RENDER FUNCTIONS
════════════════════════════════════════ */
function renderMarketplace(cat='', sort='new') {
  let items = [...LISTINGS];
  if (cat) items = items.filter(i => i.cat === cat);
  if (sort === 'price-asc') items.sort((a,b) => a.price-b.price);
  else if (sort === 'price-desc') items.sort((a,b) => b.price-a.price);

  const grid = document.getElementById('prod-grid');
  grid.innerHTML = items.map(p => `
    <div class="prod-card">
      <img class="prod-img" src="${p.img}" alt="${p.name}" onerror="this.src='images/bakkie-veg.jpg'">
      <div class="prod-body">
        <div class="prod-district">${p.loc} · ${p.cat}</div>
        <div class="prod-name">${p.name}</div>
        <div class="prod-farmer-row">
          <div class="prod-av">${p.av}</div>
          <div>
            <div class="prod-farmer-name">
              ${p.farmer}
              ${p.verified?'<span class="verified"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></span>':''}
            </div>
            <div class="prod-farmer-farm">${p.farm}</div>
          </div>
        </div>
        <div class="prod-price">R${p.price.toFixed(2)} <small>per kg</small></div>
        <div class="qty-bar">
          <div class="qty-labels"><span>Available: ${(p.qty-p.sold).toLocaleString()}kg</span><span>${p.qty.toLocaleString()}kg total</span></div>
          <div class="qty-track"><div class="qty-fill" style="width:${Math.round((p.sold/p.qty)*100)}%"></div></div>
        </div>
        <div class="prod-actions" style="margin-top:12px">
          <button class="btn btn-primary btn-sm" onclick="buyListing(${p.id})">Buy Now</button>
          <button class="btn btn-glass btn-sm" onclick="contactFarmer('${p.farmer}')">Contact</button>
        </div>
      </div>
    </div>`).join('');
}

function filterListings() {
  const cat = document.getElementById('mkt-cat').value;
  const sort = document.getElementById('mkt-sort').value;
  renderMarketplace(cat, sort);
}

function buyListing(id) {
  const p = LISTINGS.find(l=>l.id===id);
  if (p) showToast(`Order placed for ${p.name} · R${p.price}/kg. Farmer will contact you within 24h.`);
}

function contactFarmer(name) {
  showToast(`Message sent to ${name}. They'll reply within 2 hours.`);
}

function renderCollab() {
  const groups = [
    {name:'Tzaneen Smallholder Coop',members:48,crops:'Tomatoes, Cabbage, Spinach',desc:'Bulk buying and collective selling. 15% better input prices.',thumb:'images/tomatoes.jpg',open:true},
    {name:'Mopani Youth Farmers',members:32,crops:'Mixed vegetables',desc:'Young farmers network. Training, mentorship, shared equipment.',thumb:'images/bakkie-veg.jpg',open:true},
    {name:'Phalaborwa Citrus Group',members:19,crops:'Oranges, Lemons, Avocados',desc:'Export-ready citrus farmers. GLOBALG.A.P. support.',thumb:'images/bakkie-veg.jpg',open:false},
    {name:'Maruleng Grain Farmers',members:27,crops:'Maize, Sunflower, Sorghum',desc:'Grain storage, processing, collective sales.',thumb:'images/warehouse.jpg',open:true},
    {name:'Giyani Herb Circle',members:14,crops:'Morogo, Marula, Indigenous herbs',desc:'Traditional and medicinal plant farmers.',thumb:'images/bakkie-veg.jpg',open:true},
    {name:'Tzaneen Avocado Network',members:22,crops:'Hass, Fuerte, Ryan avocados',desc:'Export market connections and grading support.',thumb:'images/bakkie-veg.jpg',open:false},
  ];
  document.getElementById('collab-grid').innerHTML = groups.map(g => `
    <div class="card card-hover">
      <div class="collab-header">
        <div class="collab-thumb"><img src="${g.thumb}" alt="" onerror="this.src='images/bakkie-veg.jpg'"></div>
        <div>
          <div class="collab-title">${g.name}</div>
          <div class="collab-info">${g.members} members · ${g.crops}</div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text2);margin-bottom:12px;line-height:1.5">${g.desc}</div>
      ${g.open
        ?`<button class="btn btn-primary btn-sm" onclick="joinGroup('${g.name}')">Join Group</button>`
        :`<span class="badge badge-gold">Application Required</span>`}
    </div>`).join('');
}

function joinGroup(name) {
  showToast(`Request sent to join ${name}. Admin will approve within 48h.`);
}

function renderLogistics() {
  document.getElementById('logi-grid').innerHTML = CARRIERS.map(c => `
    <div class="card logi-card-new" style="padding:0;overflow:hidden">
      <div class="logi-car-img-wrap">
        <img src="${c.img}" alt="${c.name}" class="logi-car-img"
             onerror="this.src='images/logistics-truck.jpg'">
        <div class="logi-car-overlay">
          <div class="logi-car-badge">${c.logo}</div>
        </div>
      </div>
      <div class="logi-card-body">
        <div class="logi-name">${c.name}</div>
        <div class="logi-area">📍 ${c.area}</div>
        <div class="logi-fleet">🚚 ${c.fleet}</div>
        <div style="display:flex;gap:7px;margin-top:12px">
          <button class="btn btn-primary btn-sm" onclick="showToast('Contacting ${c.name}…')">Get Quote</button>
          <button class="btn btn-glass btn-sm" onclick="showToast('Calling ${c.name}…')">Call</button>
        </div>
      </div>
    </div>`).join('');
}

function renderProcessing() {
  document.getElementById('proc-grid').innerHTML = PROCESSORS.map(p => `
    <div class="card proc-card card-hover">
      <img class="proc-img" src="${p.img}" alt="" onerror="this.src='images/warehouse.jpg'">
      <div class="proc-body">
        <div class="proc-name">${p.name}</div>
        <div class="proc-loc">📍 ${p.loc}</div>
        <div class="proc-crops">Crops: ${p.crops}</div>
        <div class="proc-rate">💰 ${p.rate} processing fee</div>
        <div class="proc-cap">Capacity: ${p.cap}</div>
        <button class="btn btn-primary btn-sm" onclick="showToast('Contacting ${p.name}…')">Book Slot</button>
      </div>
    </div>`).join('');
}

function renderStorage() {
  document.getElementById('stor-grid').innerHTML = STORAGE_UNITS.map(s => `
    <div class="card stor-card card-hover">
      <img class="stor-img" src="${s.img}" alt="" onerror="this.src='images/warehouse.jpg'">
      <div class="stor-body">
        <div class="stor-name">${s.name}</div>
        <div class="stor-loc">📍 ${s.loc}</div>
        <div class="stor-price">R${s.price.toLocaleString()} <small>/month</small></div>
        <div class="stor-disc">🏷️ ${s.disc}</div>
        <div class="stor-spec">${s.spec}</div>
        <button class="btn btn-primary btn-sm" onclick="showToast('Enquiry sent to ${s.name}…')">Enquire Now</button>
      </div>
    </div>`).join('');
}

/* ── FARMLINK ── */
let posts = JSON.parse(JSON.stringify(POSTS));
function renderFarmLink() {
  document.getElementById('fl-feed-list').innerHTML = posts.map(renderPost).join('');
}
function renderPost(p) {
  return `
  <div class="fl-post-card" id="post-${p.id}">
    <div class="fl-post-hd">
      <div class="fl-mini-av">${p.av}</div>
      <div>
        <div class="fl-post-name">${p.user}</div>
        <div class="fl-post-time">${p.time}</div>
      </div>
    </div>
    ${p.img?`<img class="fl-post-img" src="${p.img}" alt="" onerror="this.src='images/bakkie-veg.jpg'">`:''}
    <div class="fl-post-body">${p.body}</div>
    <div class="fl-post-actions">
      <button class="fl-action${p.liked?' liked':''}" onclick="toggleLike(${p.id})">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="${p.liked?'#e74c3c':'none'}" stroke="${p.liked?'#e74c3c':'currentColor'}" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        ${p.likes}
      </button>
      <button class="fl-action" onclick="toggleComments(${p.id})">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        ${p.comments.length}
      </button>
      <button class="fl-action" onclick="showToast('Post link copied!')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Share
      </button>
    </div>
    <div class="fl-comments-wrap" id="comments-${p.id}">
      ${p.comments.map(c=>`<div class="fl-comment-item"><div class="fl-comment-author">${c.u}</div><div class="fl-comment-text">${c.txt}</div></div>`).join('')}
      <div class="fl-ci">
        <input id="ci-${p.id}" placeholder="Add a comment…" onkeydown="if(event.key==='Enter')addComment(${p.id})">
        <button class="btn btn-primary btn-sm" onclick="addComment(${p.id})">Post</button>
      </div>
    </div>
  </div>`;
}
function toggleLike(id) {
  const p = posts.find(x=>x.id===id);
  if (!p) return;
  p.liked = !p.liked; p.likes += p.liked ? 1 : -1;
  document.getElementById('post-'+id).outerHTML = renderPost(p);
}
function toggleComments(id) {
  document.getElementById('comments-'+id)?.classList.toggle('show');
}
function addComment(id) {
  const p = posts.find(x=>x.id===id);
  const inp = document.getElementById('ci-'+id);
  if (!p||!inp||!inp.value.trim()) return;
  p.comments.push({u: currentUser?.fname||'You', txt: inp.value.trim()});
  document.getElementById('post-'+id).outerHTML = renderPost(p);
  document.getElementById('comments-'+id).classList.add('show');
}
function submitPost() {
  const ta = document.getElementById('fl-new-post');
  if (!ta.value.trim()) return;
  const newPost = {
    id: Date.now(), user: currentUser?.name||'You',
    av: currentUser?.avatar||'Y', time: 'Just now',
    img: null, body: ta.value.trim(), likes: 0, liked: false, comments: []
  };
  posts.unshift(newPost); ta.value = '';
  renderFarmLink();
  showToast('Post published!');
}

/* ── COMMUNITY CHAT ── */
let currentChannel = 'general';
let localChatMsgs = {};
function renderCommunity(ch) {
  currentChannel = ch;
  document.querySelectorAll('.ch-btn').forEach(b => { b.classList.toggle('active', b.textContent.trim().toLowerCase().replace(/[^a-z_]/g,'').includes(ch.replace('_','')||ch)); });
  document.getElementById('chat-ch-name').textContent = ch.replace('_',' ');
  const seed = CHAT_DATA[ch] || [];
  const local = localChatMsgs[ch] || [];
  const all = [...seed, ...local];
  document.getElementById('chat-msgs').innerHTML = all.map(m => `
    <div class="chat-msg">
      <div class="chat-mini-av">${m.av}</div>
      <div>
        <div class="chat-bubble">${m.msg}</div>
        <div class="chat-meta">${m.u} · ${m.time}</div>
      </div>
    </div>`).join('');
  const c = document.getElementById('chat-msgs');
  c.scrollTop = c.scrollHeight;
}
function switchChannel(ch) { renderCommunity(ch); }
function sendChatMsg() {
  const inp = document.getElementById('chat-inp');
  if (!inp.value.trim()) return;
  const msg = {u: currentUser?.name||'You', av: currentUser?.avatar||'Y',
               msg: inp.value.trim(), time: new Date().toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})};
  if (!localChatMsgs[currentChannel]) localChatMsgs[currentChannel] = [];
  localChatMsgs[currentChannel].push(msg);
  inp.value = '';
  renderCommunity(currentChannel);
}

/* ── MAP ── */
function initMap() {
  if (window._mapInited) return;
  const mapEl = document.getElementById('farm-map');
  if (!mapEl || typeof L === 'undefined') return;
  window._mapInited = true;
  const map = L.map('farm-map').setView([-23.8,-30.6],9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    attribution:'© OpenStreetMap',maxZoom:17
  }).addTo(map);
  const catColors = {Vegetables:'#2d6a4f',Fruits:'#c9a227',Grains:'#3498db',Livestock:'#e74c3c',Herbs:'#9b59b6'};
  LISTINGS.forEach(l => {
    const lat = -23.8 + (Math.random()-.5)*1.2;
    const lng = 30.6 + (Math.random()-.5)*1.5;
    const col = catColors[l.cat]||'#2d6a4f';
    const mk = L.divIcon({className:'',iconSize:[12,12],iconAnchor:[6,6],
      html:`<div style="width:12px;height:12px;border-radius:50%;background:${col};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`});
    L.marker([lat,lng],{icon:mk}).addTo(map)
      .bindPopup(`<b>${l.name}</b><br>${l.farmer}<br>R${l.price}/kg · ${l.loc}`);
  });
}

/* ── LOGISTICS QUOTE ── */
let selVehType = 'bakkie';
const VEH_RATES = {bakkie:6.5, truck:9.8, semi:14.2, reefer:18.5};
function selVeh(type) {
  selVehType = type;
  document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('sel'));
  document.getElementById('veh-'+type)?.classList.add('sel');
}
function calcQuote() {
  const from = document.getElementById('logi-from').value.trim();
  const to   = document.getElementById('logi-to').value.trim();
  const kg   = parseFloat(document.getElementById('logi-kg').value)||0;
  if (!from||!to||!kg) { showToast('Please fill in all fields.'); return; }
  const dist = 50 + Math.floor(Math.random()*200);
  const rate = VEH_RATES[selVehType]||6.5;
  const base = rate * dist;
  const fuel = base * 0.12;
  const total = base + fuel;
  const r = document.getElementById('route-result');
  document.getElementById('route-price').textContent = 'R'+total.toFixed(2);
  document.getElementById('route-break').innerHTML =
    `📍 ${from} → ${to} · ~${dist} km<br>Vehicle rate: R${rate}/km · Fuel levy: R${fuel.toFixed(2)}<br>Load: ${kg}kg · Estimated trip time: ${Math.ceil(dist/80)}h`;
  r.classList.add('show');
}

/* ── SELL MODAL ── */
function openSellModal() { document.getElementById('sell-modal').classList.add('show'); }
function closeSellModal() { document.getElementById('sell-modal').classList.remove('show'); }
function submitListing() {
  const name = document.getElementById('sell-name').value.trim();
  const price = parseFloat(document.getElementById('sell-price').value)||0;
  if (!name||!price) { showToast('Please fill in produce name and price.'); return; }
  LISTINGS.unshift({
    id: Date.now(), name, cat: document.getElementById('sell-cat').value,
    price, qty: parseInt(document.getElementById('sell-qty').value)||100, sold:0,
    loc: document.getElementById('sell-loc').value||'Mopani District',
    desc: document.getElementById('sell-desc').value||'Fresh produce.',
    farmer: currentUser?.name||'You', farm: 'My Farm', av: currentUser?.avatar||'Y',
    verified:false, img:'images/bakkie-veg.jpg'
  });
  closeSellModal();
  renderMarketplace();
  showPage('market');
  showToast(`${name} listed for sale at R${price}/kg!`);
}

/* ── PREMIUM MODAL ── */
const PREM_DATA = {
  pro: {
    title:'Upgrade to Pro', price:'R149 <small>/mo</small>',
    feats:['Unlimited listings','AI Quality Control','Logistics calculator','Market price alerts','Priority support','Verified badge']
  },
  enterprise: {
    title:'Enterprise Plan', price:'R599 <small>/mo</small>',
    feats:['Everything in Pro','Dedicated account manager','Cooperative bulk tools','Export documentation','White-label invoicing','API access','Training & onboarding']
  }
};
function showPremModal(tier) {
  const d = PREM_DATA[tier];
  document.getElementById('prem-modal-title').textContent = d.title;
  document.getElementById('prem-modal-price').innerHTML = d.price;
  document.getElementById('prem-modal-feats').innerHTML = d.feats.map(f=>`<li>${f}</li>`).join('');
  document.getElementById('prem-modal').classList.add('show');
}

/* ── QC ANALYSIS ── */
let qcImageLoaded = false;
function qcDrop(e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) loadQcImage(file);
}
function qcFileSelected(e) {
  const file = e.target.files[0];
  if (file) loadQcImage(file);
}
function loadQcImage(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('qc-img').src = ev.target.result;
    document.getElementById('qc-preview-wrap').style.display = '';
    document.getElementById('qc-drop').style.display = 'none';
    document.querySelectorAll('.qc-or,.qc-btn-row').forEach(el=>el.style.display='none');
    document.getElementById('qc-result').classList.remove('show');
    document.getElementById('qc-loading').classList.remove('show');
    qcImageLoaded = true;
  };
  reader.readAsDataURL(file);
}
function resetQC() {
  qcImageLoaded = false;
  document.getElementById('qc-preview-wrap').style.display='none';
  document.getElementById('qc-drop').style.display='';
  document.querySelectorAll('.qc-or,.qc-btn-row').forEach(el=>el.style.display='');
  document.getElementById('qc-result').classList.remove('show');
  document.getElementById('qc-loading').classList.remove('show');
  document.getElementById('qc-file').value='';
  document.getElementById('qc-cam').value='';
}
function runQcAnalysis() {
  if (!qcImageLoaded) { showToast('Please load an image first.'); return; }
  document.getElementById('qc-loading').classList.add('show');
  document.getElementById('qc-result').classList.remove('show');
  const steps = ['Detecting produce type…','Analysing colour uniformity…','Checking for surface defects…','Assessing firmness indicators…','Generating quality report…'];
  let i=0;
  const stepInv = setInterval(() => {
    if (i<steps.length) { document.getElementById('qc-loading-step').textContent = steps[i++]; }
    else clearInterval(stepInv);
  }, 600);
  setTimeout(() => {
    clearInterval(stepInv);
    document.getElementById('qc-loading').classList.remove('show');
    showQcResult();
  }, 3400);
}
const QC_RESULTS = [
  {score:88,grade:'A',title:'Good Quality — Grade A',color:'#2d6a4f',issues:[
    {sev:'l',name:'Minor surface blemishes',desc:'Small cosmetic marks detected on 8% of visible surface area.',action:'Cosmetic only. Suitable for local fresh market sales.'},
    {sev:'l',name:'Slight colour variation',desc:'Minor colour inconsistency detected. Could indicate varied ripening.',action:'Sort by ripeness stage before selling.'}
  ]},
  {score:63,grade:'B',title:'Acceptable — Grade B',color:'#c9a227',issues:[
    {sev:'m',name:'Moderate bruising',desc:'Impact bruising detected on approximately 15% of surface.',action:'Remove damaged sections. Suitable for processing/juice.'},
    {sev:'m',name:'Early signs of decay',desc:'Small soft spots indicating early-stage decay on edges.',action:'Refrigerate immediately. Sell within 24 hours.'},
    {sev:'l',name:'Irregular sizing',desc:'Size inconsistency above 20% variance detected.',action:'Grade by size before sale. Smaller sizes suit processing.'}
  ]},
  {score:34,grade:'C',title:'Below Standard — Grade C',color:'#e74c3c',issues:[
    {sev:'h',name:'Fungal infection likely',desc:'Dark spots and discolouration patterns consistent with fungal disease.',action:'Do not sell fresh. Consult an agronomist immediately.'},
    {sev:'h',name:'Advanced bruising',desc:'Severe impact damage detected across 30%+ surface area.',action:'Only suitable for composting or animal feed.'},
    {sev:'m',name:'Surface dehydration',desc:'Wrinkled texture detected indicating moisture loss.',action:'Increase post-harvest moisture management.'}
  ]},
  {score:76,grade:'B+',title:'Good — Grade B+',color:'#40916c',issues:[
    {sev:'l',name:'Minor discolouration',desc:'Slight yellowing detected, may indicate over-ripeness in spots.',action:'Prioritise immediate sale. Suitable for all markets.'},
    {sev:'l',name:'Small surface cracks',desc:'Hairline cracks detected, possibly from heat stress.',action:'Cosmetic issue. No food safety concern.'}
  ]},
];
function showQcResult() {
  const r = QC_RESULTS[Math.floor(Math.random()*QC_RESULTS.length)];
  const icon = r.score>74 ? '✅' : r.score>49 ? '⚠️' : '❌';
  document.getElementById('qc-result-icon').style.background = r.color+'33';
  document.getElementById('qc-result-icon').style.fontSize = '22px';
  document.getElementById('qc-result-icon').textContent = icon;
  document.getElementById('qc-result-title').textContent = r.title;
  document.getElementById('qc-result-sub').textContent = `Confidence: Simulated · Grade: ${r.grade}`;
  document.getElementById('qc-score-pct').textContent = r.score+'%';
  const fill = document.getElementById('qc-score-fill');
  fill.style.width = '0%'; fill.style.background = r.color;
  setTimeout(() => { fill.style.width = r.score+'%'; }, 100);
  const dotCls = {h:'dot-h',m:'dot-m',l:'dot-l'};
  document.getElementById('qc-issues').innerHTML = r.issues.map(iss=>`
    <div class="qc-issue">
      <div class="qc-dot ${dotCls[iss.sev]}"></div>
      <div>
        <div class="qc-iss-name">${iss.name}</div>
        <div class="qc-iss-desc">${iss.desc}</div>
        <div class="qc-iss-action">→ ${iss.action}</div>
      </div>
    </div>`).join('');
  document.getElementById('qc-result').classList.add('show');
}

/* ════════════════════════════════════════
   GROOT — AI VOICE ASSISTANT
════════════════════════════════════════ */
let grootPanelOpen = false;
let grootSpeaking = false;
let grootListening = false;
let ttsEnabled = true;
let recognition = null;

function toggleGrootPanel() {
  grootPanelOpen = !grootPanelOpen;
  document.getElementById('groot-panel').classList.toggle('open', grootPanelOpen);
  if (grootPanelOpen) setTimeout(() => document.getElementById('groot-input').focus(), 400);
}
function openGrootPanel() {
  grootPanelOpen = true;
  document.getElementById('groot-panel').classList.add('open');
  setTimeout(() => document.getElementById('groot-input').focus(), 400);
}
function closeGrootPanel() {
  grootPanelOpen = false;
  document.getElementById('groot-panel').classList.remove('open');
  if (grootSpeaking) { speechSynthesis.cancel(); grootSpeaking = false; }
  setGrootOrb('idle');
}
function toggleTTS() {
  ttsEnabled = !ttsEnabled;
  document.getElementById('groot-tts-toggle').classList.toggle('on', ttsEnabled);
  if (!ttsEnabled && grootSpeaking) { speechSynthesis.cancel(); grootSpeaking = false; setGrootOrb('idle'); }
  showToast('Voice ' + (ttsEnabled ? 'enabled' : 'muted'));
}
function setGrootOrb(state) {
  const orb = document.getElementById('groot-orb');
  if (!orb) return;
  orb.className = 'groot-orb ' + state;
  const labels = {idle:'tap the mic or type below',thinking:'thinking…',speaking:'speaking…',listening:'listening… speak now'};
  document.getElementById('groot-orb-label').textContent = labels[state]||'';
  document.getElementById('groot-status').textContent =
    state==='idle'?'AI Farming Assistant': state==='thinking'?'Thinking…': state==='speaking'?'Speaking…':'Listening…';
}

/* ── VOICE SYNTHESIS ── */
let _voiceCached = null;
function pickBestVoice() {
  if (_voiceCached) return _voiceCached;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const pref = ['en-ZA','en-GB','en-AU','en-US','en-NZ'];
  for (const p of pref) {
    const v = voices.find(v => v.lang===p && !v.localService) || voices.find(v => v.lang===p);
    if (v) { _voiceCached = v; return v; }
  }
  const en = voices.find(v => v.lang.startsWith('en'));
  if (en) { _voiceCached = en; return en; }
  return voices[0]||null;
}

if (window.speechSynthesis) {
  speechSynthesis.onvoiceschanged = () => { _voiceCached = null; pickBestVoice(); };
}

function grootSpeak(text) {
  if (!ttsEnabled || !window.speechSynthesis) { setGrootOrb('idle'); return; }
  speechSynthesis.cancel();
  const clean = text.replace(/[*_#`]/g,'').replace(/\s+/g,' ').trim();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = 'en-ZA'; utter.rate = 0.88; utter.pitch = 1.02; utter.volume = 1.0;
  const v = pickBestVoice();
  if (v) utter.voice = v;
  utter.onstart = () => { grootSpeaking = true; setGrootOrb('speaking'); };
  utter.onend   = () => { grootSpeaking = false; setGrootOrb('idle'); };
  utter.onerror = () => { grootSpeaking = false; setGrootOrb('idle'); };
  // Chrome bug: silence after 15s. Resume every 10s.
  const resumeTimer = setInterval(() => {
    if (speechSynthesis.paused) speechSynthesis.resume();
    if (!speechSynthesis.speaking) clearInterval(resumeTimer);
  }, 10000);
  utter.onend = () => { clearInterval(resumeTimer); grootSpeaking = false; setGrootOrb('idle'); };
  setGrootOrb('speaking');
  speechSynthesis.speak(utter);
}

/* ── SPEECH RECOGNITION ── */
function initRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.lang = 'en-ZA'; r.continuous = false; r.interimResults = true; r.maxAlternatives = 1;
  r.onresult = e => {
    let interim = '', final = '';
    for (let i=e.resultIndex; i<e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    document.getElementById('groot-input').value = final || interim;
    if (final) { stopListening(); setTimeout(sendGrootMsg, 200); }
  };
  r.onerror = e => { console.warn('SR error', e.error); stopListening(); };
  r.onend   = () => { if (grootListening) stopListening(); };
  return r;
}

function toggleListening() {
  if (grootListening) stopListening();
  else startListening();
}
function startListening() {
  if (grootSpeaking) { speechSynthesis.cancel(); grootSpeaking = false; }
  if (!recognition) recognition = initRecognition();
  if (!recognition) { showToast('Voice input not supported in this browser.'); return; }
  try {
    recognition.start();
    grootListening = true;
    document.getElementById('groot-mic').classList.add('on');
    setGrootOrb('listening');
    document.getElementById('groot-input').placeholder = 'Listening…';
  } catch(e) {}
}
function stopListening() {
  grootListening = false;
  document.getElementById('groot-mic').classList.remove('on');
  setGrootOrb('idle');
  document.getElementById('groot-input').placeholder = 'Ask Groot anything...';
  try { recognition && recognition.stop(); } catch(e) {}
}

/* ── AI RESPONSES ── */
function quickAsk(q) {
  document.getElementById('groot-input').value = q;
  sendGrootMsg();
}
function sendGrootMsg() {
  const inp = document.getElementById('groot-input');
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';
  appendGrootMsg(msg, 'user');
  setGrootOrb('thinking');
  document.getElementById('groot-status').textContent = 'Thinking…';
  const delay = 900 + Math.random()*700;
  setTimeout(() => {
    const resp = getGrootResponse(msg);
    appendGrootMsg(resp, 'groot');
    setGrootOrb('speaking');
    if (ttsEnabled) grootSpeak(resp);
    else setGrootOrb('idle');
  }, delay);
}
function appendGrootMsg(text, who) {
  const msgs = document.getElementById('groot-msgs');
  const div = document.createElement('div');
  div.className = 'groot-msg' + (who==='user'?' user':'');
  const avClass = who==='groot'?'groot-av-g':'groot-av-u';
  const avText  = who==='groot'?'G':(currentUser?.avatar||'Y');
  div.innerHTML = `
    <div class="groot-msg-av ${avClass}">${avText}</div>
    <div class="groot-bubble">${text}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

const GROOT_KB = [
  {k:['tomato','tamati'],r:`Tomatoes are one of the best crops for Mopani District! 🍅 Key tips:
• Plant in well-drained soil with pH 6.0–6.8
• Water consistently — 1 to 1.5 litres per plant per day
• Watch for early blight and spider mites in dry months
• Current market price in Tzaneen is around R12–15 per kilogram
• Roma and Cherry tomatoes fetch the best premium prices`},
  {k:['avocado','avo'],r:`Avocados are a major crop in Mopani! 🥑 Here's what you need to know:
• Best varieties for the area: Hass, Fuerte, and Ryan
• They need well-drained, slightly acidic soil (pH 5.5–6.5)
• Very sensitive to waterlogging — raised beds help
• Current prices have dropped to around R5–6 per kilogram due to oversupply
• Export market through Tzaneen Valley Packers can get you better rates`},
  {k:['price','priis','mtengo','theko'],r:`Here are today's approximate Mopani District market prices: 🌽
• Tomatoes (Roma): R12–15/kg
• Avocados (Hass): R5–6/kg
• Mangoes: R6–7/kg
• White Maize: R4–4.50/kg
• Citrus (Navel): R8–10/kg
• Sweet Peppers: R18–20/kg
Prices vary daily. Check the Marketplace page for live farmer listings!`},
  {k:['disease','siekte','bolwetsi','vhulwadze'],r:`Crop disease prevention in Mopani District: 🌿
• Rotate crops every season to break disease cycles
• Use certified disease-resistant seeds from SAKATA or Starke Ayres
• Apply copper-based fungicides before the rainy season (October–November)
• Scout fields twice a week — early detection saves your crop
• Common threats: Fusarium wilt in tomatoes, Phytophthora in avocados, Powdery mildew in cucurbits
Contact Limpopo Department of Agriculture for free advisory services.`},
  {k:['water','irrigation','besproeiing'],r:`Water-wise farming for Mopani District: 💧
• Drip irrigation saves 40–60% water vs flood irrigation
• Water early morning (5–8am) to reduce evaporation
• Mulch with straw or compost to retain soil moisture
• Soil moisture sensors save water and improve yields
• The Limpopo Department of Water Affairs has bursary programs for drip systems
• Average crop water need: tomatoes 1–1.5L/day, avocados 2–3L/day per tree`},
  {k:['sell','market','marketplace','listing'],r:`How to sell on RootLink Pro: 🛒
1. Go to the Marketplace page
2. Click "Sell Produce" and fill in your listing details
3. Your produce goes live instantly — buyers can contact you directly
4. RootLink charges 2.5% commission on successful sales only
5. For premium visibility, consider upgrading to Pro (R149/month)
6. For large volumes, the Collaborate page shows buyer cooperatives`},
  {k:['transport','logistics','truck','lorry','bakkie'],r:`Logistics in Mopani District: 🚛
• Registered carriers: Limpopo Agri Logistics, Mopani Fresh Transport, GreenRoute SA
• Bakkie rates: ~R6.50/km (up to 1 ton)
• Refrigerated reefer: ~R18.50/km for temperature-sensitive produce
• Use the Logistics page to get a live price quote
• Book transport 48 hours in advance for the best rates
• Cold storage is available in Tzaneen, Phalaborwa, and Giyani`},
  {k:['weather','reën','rain','reang'],r:`Mopani District weather forecast: ☀️🌧️
• Current week: Sunny Monday to Wednesday, rain expected Thursday–Friday
• Temperature: 29°C high, 18°C low
• Rainy season: October to April (plant summer crops now!)
• Dry season: May to September (ideal for citrus and avocados)
• Watch for frost risk in June–July in highland areas near Tzaneen
• Plan your harvest and transport bookings around the rain this week`},
  {k:['grant','subsidy','funding','money','moolah'],r:`Farming funding in Limpopo: 💰
• DAFF (Dept of Agriculture, Forestry and Fisheries) — subsidy programs for small farmers
• Limpopo Economic Development Agency (LEDA) — business grants up to R500,000
• Land Bank — affordable agricultural loans at prime minus 2%
• AgriBEE Fund — for Black-owned agricultural enterprises
• Youth farmer program — ages 18–35, free training + startup capital
Contact the Tzaneen DAFF office at +27 15 307 3000 for applications.`},
  {k:['hello','hi','halo','sawubona','dumela','avuxeni','ndaa'],r:`Sawubona! Hello! Halo! 👋🌱
I'm Groot, your RootLink AI farming assistant for Mopani District.
I can help you with:
• Crop advice and planting tips
• Current market prices
• Disease and pest management
• Water and irrigation guidance
• Transport and logistics
• Selling your produce on RootLink
What can I help you with today?`},
];

function getGrootResponse(msg) {
  const m = msg.toLowerCase();
  for (const item of GROOT_KB) {
    if (item.k.some(k => m.includes(k))) return item.r;
  }
  // Default smart responses
  if (m.includes('cooperat') || m.includes('group'))
    return `Joining a cooperative can increase your income by 15–30%! 🤝 Check the Collaborate page for active farmer groups in Mopani District. The Tzaneen Smallholder Cooperative has 48 members and offers bulk input purchases at reduced prices.`;
  if (m.includes('premium') || m.includes('upgrade') || m.includes('pro'))
    return `RootLink Pro costs R149/month and gives you unlimited listings, AI quality control, logistics pricing, and market price alerts. 🌟 The first 30 days are free! Check the Premium page to upgrade.`;
  if (m.includes('storage') || m.includes('cold'))
    return `Cold storage in Mopani District starts from R1.90 per kilogram per month. 🏭 Tzaneen CoolStore and Mopani Agri Storage are the largest facilities. Visit the Cold Storage page to compare options and make enquiries.`;
  if (m.includes('processing') || m.includes('pack'))
    return `Processing facilities can add 20–40% value to your produce! 📦 Tzaneen Valley Packers handles up to 30 tonnes per day at R0.85/kg. Visit the Processing Units page for a full list of facilities in the district.`;
  if (m.includes('mango'))
    return `Mangoes are one of Mopani's finest! 🥭 Tommy Atkins and Sensation are the most commercially grown varieties. Current prices are around R6–7/kg. The mango season peaks November to January. Phalaborwa has excellent mango-growing conditions.`;
  if (m.includes('maize') || m.includes('corn'))
    return `White maize is a staple crop in Mopani! 🌽 Current price: ~R4.20/kg. Best planted after the first rains in October. Use certified seed like SC403 or PAN 6Q-416B for best yields. Mopani Agri-Processing Hub can mill your maize at R1.20/kg.`;
  return `I understand you're asking about "${msg.substring(0,30)}${msg.length>30?'…':''}". 🌿
For the best farming advice specific to Mopani District, I'd recommend:
• Contacting the Limpopo Dept of Agriculture at +27 15 307 3000
• Visiting the RootLink Collaborate page to connect with other farmers
• Checking the Marketplace for current prices in your area
Is there something more specific I can help you with? Try asking about crops, prices, transport, or disease management!`;
}

/* ════════════════════════════════════════
   DOMContentLoaded — bootstrap
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem(AUTH_KEY);
  if (!saved) return; // auth screen is shown
  try {
    currentUser = JSON.parse(saved);
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = '';
    document.getElementById('groot-fab').style.display = '';
    initApp();
  } catch(e) {
    localStorage.removeItem(AUTH_KEY);
  }
});
