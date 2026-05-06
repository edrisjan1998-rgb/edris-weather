// ==========================================
// متغیرهای اصلی
// ==========================================
let LAT = 34.3482;
let LON = 62.2000;
let CITY = 'هرات';
let activeTab = null;
let weatherData = null;
let newsTimer = null;
let sportTimer = null;
let wikiLang = 'fa';
let citySearchTimer = null;
let aiModel = 'pollinations';
let chatHistory = [];
let isAiLoading = false;

// ==========================================
// شهرهای افغانستان
// ==========================================
const AFGHANISTAN_CITIES = {
    'هرات':      { lat:34.3482,lon:62.2000,icon:'🕌', subs:[
        {name:'انجیل',lat:34.41,lon:62.08},{name:'گذره',lat:34.32,lon:62.12},
        {name:'زنده‌جان',lat:34.35,lon:61.75},{name:'شیندند',lat:33.30,lon:62.15},
        {name:'ادرسکن',lat:34.55,lon:62.25},{name:'کرخ',lat:34.75,lon:62.60},
        {name:'فارسی',lat:34.50,lon:63.10},{name:'چشت شریف',lat:34.35,lon:64.00},
    ]},
    'کابل':      { lat:34.5253,lon:69.1783,icon:'🏛️', subs:[
        {name:'بگرام',lat:34.94,lon:69.24},{name:'پغمان',lat:34.58,lon:68.94},
        {name:'استالف',lat:34.86,lon:68.95},{name:'ده سبز',lat:34.65,lon:69.30},
        {name:'چهارآسیاب',lat:34.42,lon:69.15},{name:'کلکان',lat:34.78,lon:69.05},
    ]},
    'مزارشریف': { lat:36.7069,lon:67.1100,icon:'🕌', subs:[
        {name:'بلخ',lat:36.76,lon:66.90},{name:'دهدادی',lat:36.65,lon:67.00},
        {name:'نهرشاهی',lat:36.60,lon:67.35},{name:'شولگره',lat:37.00,lon:67.80},
    ]},
    'قندهار':   { lat:31.6258,lon:65.7150,icon:'🏙️', subs:[
        {name:'ارغنداب',lat:31.80,lon:65.60},{name:'پنجوایی',lat:31.50,lon:65.40},
        {name:'دامان',lat:31.50,lon:65.60},{name:'شاه‌ولی‌کوت',lat:31.90,lon:66.30},
    ]},
    'جلال‌آباد':{ lat:34.4415,lon:70.4360,icon:'🌿', subs:[
        {name:'بهسود',lat:34.49,lon:70.35},{name:'کامه',lat:34.47,lon:70.65},
        {name:'شینوار',lat:34.10,lon:70.80},
    ]},
    'کندز':     { lat:36.7333,lon:68.8667,icon:'🌾', subs:[
        {name:'امام‌صاحب',lat:37.18,lon:68.92},{name:'خانآباد',lat:36.68,lon:69.12},
        {name:'علی‌آباد',lat:36.70,lon:68.60},
    ]},
    'بامیان':   { lat:34.8167,lon:67.8167,icon:'🏔️', subs:[
        {name:'یکه‌ولنگ',lat:34.50,lon:66.50},{name:'پنجاب',lat:34.15,lon:67.00},
        {name:'شیبر',lat:35.00,lon:68.10},
    ]},
    'غزنی':     { lat:33.5531,lon:68.4190,icon:'🏰', subs:[
        {name:'جاغوری',lat:33.20,lon:67.80},{name:'مالستان',lat:33.50,lon:67.30},
    ]},
    'تالقان':   { lat:36.7348,lon:69.5152,icon:'⛰️', subs:[
        {name:'فرخار',lat:37.15,lon:69.75},{name:'خواجه‌گار',lat:37.00,lon:69.40},
    ]},
    'فیض‌آباد': { lat:37.1219,lon:70.5800,icon:'🌄', subs:[
        {name:'جرم',lat:36.85,lon:70.85},{name:'کشم',lat:36.67,lon:70.72},
    ]},
};

// ==========================================
// شروع
// ==========================================
window.addEventListener('load', () => {
    loadWeather();
    setTimeout(fetchNews,   2000);
    setTimeout(fetchSports, 3500);
    document.addEventListener('click', e => {
        if (!e.target.closest('.city-search-wrap')) closeCityDropdown();
    });
});

// ==========================================
// جستجوی شهر
// ==========================================
function onCityInput() {
    const val = document.getElementById('cityInput').value.trim();
    if (!val) { closeCityDropdown(); return; }
    if (citySearchTimer) clearTimeout(citySearchTimer);
    citySearchTimer = setTimeout(() => showCityDropdown(val), 300);
}

function showCityDropdown(query) {
    const dd = document.getElementById('cityDropdown');
    let html = '';
    let found = false;

    for (const [name, data] of Object.entries(AFGHANISTAN_CITIES)) {
        if (name.includes(query) || query.length <= 2) {
            if (!found) { html += `<div class="city-group-title">🇦🇫 افغانستان</div>`; found = true; }
            html += `<div class="city-option" onclick="selectCity('${name}',${data.lat},${data.lon})">
                        <span>${data.icon}</span>
                        <span class="co-name">${name}</span>
                        <span class="co-country">ولایت</span>
                     </div>`;
            if (data.subs?.length) {
                data.subs.forEach(s => {
                    html += `<div class="city-sub" onclick="selectCity('${s.name} (${name})',${s.lat},${s.lon})">${s.name}</div>`;
                });
            }
        }
    }

    if (!found) {
        html += `<div class="city-option" style="cursor:default;opacity:0.6"><span>🔍 جستجوی آنلاین...</span></div>`;
        searchOnlineCities(query);
    }

    dd.innerHTML = html;
    dd.classList.add('open');
}

async function searchOnlineCities(query) {
    try {
        const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=fa`);
        const data = await res.json();
        if (!data.results?.length) return;
        const dd  = document.getElementById('cityDropdown');
        let html  = `<div class="city-group-title">🔍 نتایج جستجو</div>`;
        data.results.forEach(r => {
            html += `<div class="city-option" onclick="selectCity('${r.name}',${r.latitude},${r.longitude})">
                        <span>📍</span>
                        <span class="co-name">${r.name}</span>
                        <span class="co-country">${r.country||''}</span>
                     </div>`;
        });
        dd.innerHTML = html;
        dd.classList.add('open');
    } catch {}
}

function selectCity(name, lat, lon) {
    LAT = parseFloat(lat); LON = parseFloat(lon); CITY = name;
    document.getElementById('cityInput').value = name;
    closeCityDropdown();
    loadWeather();
}

function closeCityDropdown() {
    const dd = document.getElementById('cityDropdown');
    if (dd) { dd.classList.remove('open'); dd.innerHTML = ''; }
}

async function searchCity() {
    const val = document.getElementById('cityInput').value.trim();
    if (!val) return;
    for (const [name, data] of Object.entries(AFGHANISTAN_CITIES)) {
        if (name === val || val.includes(name)) { selectCity(name,data.lat,data.lon); return; }
    }
    setHTML('currentWeather','<div class="loading-box">🔍 جستجو...</div>');
    try {
        const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val)}&count=1&language=fa`);
        const data = await res.json();
        if (data.results?.length > 0) {
            const r = data.results[0];
            selectCity(r.name, r.latitude, r.longitude);
        } else {
            setHTML('currentWeather','<div class="loading-box">❌ شهر پیدا نشد</div>');
        }
    } catch {
        setHTML('currentWeather','<div class="loading-box">❌ خطا در جستجو</div>');
    }
}

// ==========================================
// آب و هوا
// ==========================================
async function loadWeather() {
    setHTML('currentWeather','<div class="loading-box">⏳ در حال دریافت آب و هوا...</div>');
    document.getElementById('weatherCards').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    activeTab = null;

    const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${LAT}&longitude=${LON}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,` +
        `relative_humidity_2m_max,relative_humidity_2m_min,` +
        `weathercode,sunrise,sunset,windspeed_10m_max` +
        `&timezone=auto&past_days=15&forecast_days=16`;

    try {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), 15000);
        const res  = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!res.ok) throw new Error('کد: ' + res.status);
        const data = await res.json();
        if (!data?.daily?.time?.length) throw new Error('داده دریافت نشد');
        weatherData = data;
        renderToday(data);
    } catch (err) {
        const msg = err.name === 'AbortError' ? 'اتصال قطع شد' : err.message;
        setHTML('currentWeather',`
            <div class="loading-box">❌ خطا: ${msg}<br>
                <button onclick="loadWeather()" style="margin-top:10px;padding:6px 14px;
                    border-radius:8px;border:none;background:var(--accent2);color:#fff;
                    cursor:pointer;font-family:Vazirmatn,sans-serif;font-size:0.8rem">
                    🔄 تلاش مجدد</button></div>`);
    }
}

function renderToday(data) {
    const ts = dateToStr(new Date());
    let i = data.daily.time.indexOf(ts);
    if (i === -1) i = 15;

    const maxT = Math.round(data.daily.temperature_2m_max[i]??0);
    const minT = Math.round(data.daily.temperature_2m_min[i]??0);
    const avgT = Math.round((maxT+minT)/2);
    const code = data.daily.weathercode[i]??0;
    const rain = Number(data.daily.precipitation_sum[i]??0).toFixed(1);
    const hum  = Math.round(((data.daily.relative_humidity_2m_max[i]??0)+(data.daily.relative_humidity_2m_min[i]??0))/2);
    const wind = Math.round(data.daily.windspeed_10m_max[i]??0);
    const sr   = (data.daily.sunrise[i]??'').split('T')[1]??'--:--';
    const ss   = (data.daily.sunset[i]??'').split('T')[1]??'--:--';
    const w    = getWeather(code);
    const now  = new Date();

    setHTML('currentWeather',`
        <div class="cur-body">
            <div class="cur-top">
                <div class="cur-icon">${w.icon}</div>
                <div>
                    <div class="cur-temp">${avgT}°C</div>
                    <div class="cur-desc">${w.desc}</div>
                    <div class="cur-city">📍 ${CITY}</div>
                </div>
            </div>
            <div class="cur-grid">
                <div class="cg-item"><div class="cg-label">بیشینه</div><div class="cg-val" style="color:#f85149">${maxT}°</div></div>
                <div class="cg-item"><div class="cg-label">کمینه</div><div class="cg-val" style="color:#58a6ff">${minT}°</div></div>
                <div class="cg-item"><div class="cg-label">رطوبت</div><div class="cg-val" style="color:#3fb950">${hum}%</div></div>
            </div>
            <div class="cur-stats">
                <div class="cs-item"><span class="cs-icon">🌧️</span><div><div class="cs-label">بارندگی</div><div class="cs-val">${rain} mm</div></div></div>
                <div class="cs-item"><span class="cs-icon">💨</span><div><div class="cs-label">سرعت باد</div><div class="cs-val">${wind} km/h</div></div></div>
                <div class="cs-item"><span class="cs-icon">🌅</span><div><div class="cs-label">طلوع</div><div class="cs-val">${sr}</div></div></div>
                <div class="cs-item"><span class="cs-icon">🌇</span><div><div class="cs-label">غروب</div><div class="cs-val">${ss}</div></div></div>
            </div>
            <div class="cur-dates">
                <div class="date-row"><span class="dr-type">📅 میلادی</span><span class="dr-val">${miladi(now)}</span></div>
                <div class="date-row"><span class="dr-type">🗓️ شمسی</span><span class="dr-val">${shamsi(now)}</span></div>
                <div class="date-row"><span class="dr-type">🌙 قمری</span><span class="dr-val">${qamari(now)}</span></div>
            </div>
        </div>`);
}

function showTab(tab, btn) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const c = document.getElementById('weatherCards');
    c.style.display = 'block';
    if (weatherData) renderDays(weatherData);
    else setHTML('weatherCards','<div class="loading-box">⏳ بارگذاری...</div>');
    setTimeout(() => c.scrollIntoView({behavior:'smooth',block:'nearest'}), 100);
}

function renderDays(data) {
    const ts = dateToStr(new Date());
    let ti = data.daily.time.indexOf(ts);
    if (ti === -1) ti = 15;

    const indices = [];
    if (activeTab === 'past') { for (let i=ti-1;i>=0;i--) indices.push(i); }
    else { for (let i=ti+1;i<data.daily.time.length;i++) indices.push(i); }

    if (!indices.length) { setHTML('weatherCards','<div class="loading-box">داده‌ای نیست</div>'); return; }

    let html = `<div class="days-label">${activeTab==='past'?'📅 ۱۵ روز گذشته':'🔮 ۱۵ روز آینده'} — ${CITY}</div>`;

    indices.forEach(i => {
        const dObj = new Date(data.daily.time[i]+'T12:00:00');
        const maxT = Math.round(data.daily.temperature_2m_max[i]??0);
        const minT = Math.round(data.daily.temperature_2m_min[i]??0);
        const code = data.daily.weathercode[i]??0;
        const rain = Number(data.daily.precipitation_sum[i]??0).toFixed(1);
        const hum  = Math.round(((data.daily.relative_humidity_2m_max[i]??0)+(data.daily.relative_humidity_2m_min[i]??0))/2);
        const wind = Math.round(data.daily.windspeed_10m_max[i]??0);
        const sr   = (data.daily.sunrise[i]??'').split('T')[1]??'--:--';
        const ss   = (data.daily.sunset[i]??'').split('T')[1]??'--:--';
        const w    = getWeather(code);

        html += `
            <div class="day-card">
                <div class="dc-row1">
                    <div class="dc-dates">
                        <div class="d-mil">${miladi(dObj)}</div>
                        <div class="d-sh">${shamsi(dObj)}</div>
                        <div class="d-lu">🌙 ${qamari(dObj)}</div>
                    </div>
                    <div class="dc-icon-temp">
                        <div class="dc-icon">${w.icon}</div>
                        <div class="dc-temp"><div class="t-max">${maxT}°</div><div class="t-min">${minT}°</div></div>
                    </div>
                </div>
                <div class="dc-row2">
                    <div class="dc-detail"><div class="dd-val">${hum}%</div><div class="dd-lbl">💧رطوبت</div></div>
                    <div class="dc-detail"><div class="dd-val" style="color:var(--accent)">${rain}</div><div class="dd-lbl">🌧️mm</div></div>
                    <div class="dc-detail"><div class="dd-val">${wind}</div><div class="dd-lbl">💨km/h</div></div>
                    <div class="dc-detail"><div class="dd-val" style="font-size:0.6rem">${w.desc}</div><div class="dd-lbl">وضعیت</div></div>
                </div>
                <div class="dc-row3"><div class="dc-suns"><span class="sr">🌅${sr}</span><span class="ss">🌇${ss}</span></div></div>
            </div>`;
    });

    setHTML('weatherCards', html);
}

// ==========================================
// سوئیچ پنل‌ها
// ==========================================
function switchPanel(name, btn) {
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.right-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + name).style.display = 'flex';
    btn.classList.add('active');
}

// ==========================================
// نمایش خبر در پنل راست
// ==========================================
function showNewsInPanel(title, desc, link, src, imgUrl, pubDate) {
    // برو به پنل خبر
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.right-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-news').style.display = 'flex';
    document.querySelector('.right-tab:first-child').classList.add('active');

    const ago = timeAgoFa(pubDate);

    setHTML('panel-news', `
        <div class="news-viewer">
            <div class="nv-source-badge">📰 ${src}</div>
            <div class="nv-title">${title}</div>
            <div class="nv-meta">
                ${ago ? `<span>🕐 ${ago}</span>` : ''}
                <span style="margin-right:auto"></span>
            </div>
            ${imgUrl ? `<img class="nv-img" src="${imgUrl}" alt="" onerror="this.style.display='none'">` : ''}
            <div class="nv-content">${desc || 'برای مطالعه کامل این خبر روی دکمه زیر کلیک کنید.'}</div>
            <a class="nv-link" href="${link}" target="_blank" rel="noopener">
                📖 مطالعه کامل در منبع اصلی ↗
            </a>
        </div>
    `);
}

// ==========================================
// اخبار
// ==========================================
const NEWS_SOURCES = {
    bbc:    { name:'BBC فارسی',    icon:'🔴', feeds:['https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/persian/rss.xml&count=10'] },
    dw:     { name:'دویچه وله',    icon:'🟡', feeds:['https://api.rss2json.com/v1/api.json?rss_url=https://rss.dw.com/rdf/rss-per-all&count=10'] },
    voa:    { name:'صدای آمریکا', icon:'🔵', feeds:['https://api.rss2json.com/v1/api.json?rss_url=https://ir.voanews.com/api/zpsqepeq_&count=10'] }
};

const SPORT_SOURCES = {
    sport_varzesh3: { name:'ورزش سه',    icon:'⚽', feeds:['https://api.rss2json.com/v1/api.json?rss_url=https://www.varzesh3.com/rss/all&count=10'] },
    sport_isna:     { name:'ایسنا ورزشی',icon:'🏅', feeds:['https://api.rss2json.com/v1/api.json?rss_url=https://www.isna.ir/rss/tp/16&count=10'] },
    sport_football: { name:'فوتبال ۳۶۰', icon:'🏆', feeds:['https://api.rss2json.com/v1/api.json?rss_url=https://www.football360.ir/feed&count=10','https://api.rss2json.com/v1/api.json?rss_url=http://www.football360.ir/feed&count=10'] }
};

async function fetchNews() {
    const key = document.getElementById('newsSource')?.value || 'bbc';
    const src = NEWS_SOURCES[key];
    setHTML('newsContainer','<div class="loading-box">⏳ دریافت اخبار...</div>');
    const ok = await loadFeed(src,'newsContainer','news');
    if (!ok) showFeedError(src,'newsContainer','news');
    if (newsTimer) clearTimeout(newsTimer);
    newsTimer = setTimeout(fetchNews, 10*60*1000);
}

async function fetchSports() {
    const key = document.getElementById('sportSource')?.value || 'sport_varzesh3';
    const src = SPORT_SOURCES[key];
    setHTML('sportsContainer','<div class="loading-box">⏳ دریافت اخبار ورزشی...</div>');
    const ok = await loadFeed(src,'sportsContainer','sport');
    if (!ok) showFeedError(src,'sportsContainer','sport');
    if (sportTimer) clearTimeout(sportTimer);
    sportTimer = setTimeout(fetchSports, 10*60*1000);
}

async function loadFeed(src, containerId, type) {
    for (const feedUrl of src.feeds) {
        try {
            const ctrl = new AbortController();
            const tid  = setTimeout(() => ctrl.abort(), 10000);
            const res  = await fetch(feedUrl, { signal: ctrl.signal });
            clearTimeout(tid);
            if (!res.ok) continue;
            const data = await res.json();
            if (data.status === 'ok' && data.items?.length > 0) {
                renderFeed(data.items.slice(0,10), src, containerId, type);
                return true;
            }
        } catch { continue; }
    }
    return false;
}

function renderFeed(items, src, containerId, type) {
    const isSport = type === 'sport';
    let html = '<div class="news-list">';

    items.forEach((item, idx) => {
        const title   = cleanText(item.title || 'بدون عنوان');
        const link    = item.link || '#';
        const ago     = timeAgoFa(item.pubDate);
        const desc    = cleanText(item.description || item.content || '');
        const imgUrl  = item.thumbnail || item.enclosure?.link || '';
        const pubDate = item.pubDate || '';

        // کلیک روی خبر → نمایش در پنل
        html += `
            <div class="news-item"
                 onclick="showNewsInPanel(
                     ${JSON.stringify(title)},
                     ${JSON.stringify(desc.substring(0,600))},
                     ${JSON.stringify(link)},
                     ${JSON.stringify(src.icon+' '+src.name)},
                     ${JSON.stringify(imgUrl)},
                     ${JSON.stringify(pubDate)}
                 )">
                <div class="ni-num ${isSport?'sport-num':''}">${idx+1}</div>
                <div class="ni-body">
                    <div class="ni-title">${title}</div>
                    <div class="ni-meta">
                        <span class="ni-src ${isSport?'sport':''}">${src.icon} ${src.name}</span>
                        ${ago?`<span class="ni-time">${ago}</span>`:''}
                    </div>
                </div>
            </div>`;
    });

    html += `</div><div style="text-align:left;font-size:0.58rem;color:var(--text2);
        padding:3px 10px 8px;opacity:0.5">🕐${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2,'0')}</div>`;

    setHTML(containerId, html);
}

function showFeedError(src, containerId, type) {
    const rf = type==='sport'?'fetchSports()':'fetchNews()';
    const sf = type==='sport'?'showSampleSports()':'showSampleNews()';
    setHTML(containerId,`<div class="err-box">⚠️ دریافت از ${src.name} ممکن نشد<br>
        <button onclick="${rf}">🔄 تلاش مجدد</button>
        <button onclick="${sf}">📰 نمونه</button></div>`);
}

function showSampleNews() {
    const items = ['تحولات دیپلماتیک در خاورمیانه','بازارهای جهانی با نوسان روبرو شدند',
        'پیشرفت جدید در هوش مصنوعی','تغییرات آب و هوایی جهانی','تحولات سیاسی در اروپا',
        'پیشرفت پزشکی در درمان بیماری‌ها','بحران انرژی و راهکارها','ماموریت فضایی ناسا',
        'رویدادهای اقتصادی این هفته','تحولات تجاری در آسیا'];
    renderSample(items,'newsContainer','news');
}

function showSampleSports() {
    const items = ['⚽ نتایج لیگ قهرمانان اروپا (UCL)','🏴󠁧󠁢󠁥󠁮󠁧󠁿 جدول لیگ برتر انگلیس',
        '🇪🇸 لالیگا - رئال مادرید و بارسلونا','🇩🇪 بوندسلیگا - بایرن مونیخ',
        '🇮🇹 سری آ - ناپولی و اینتر','🏆 لیگ اروپا (UEL)','🔄 انتقالات فوتبال اروپا',
        '🌍 جدول رده‌بندی فیفا','🎾 مسابقات تنیس گرند اسلم','🏀 NBA بسکتبال آمریکا'];
    renderSample(items,'sportsContainer','sport');
}

function renderSample(items, containerId, type) {
    const isSport = type==='sport';
    let html = '<div class="news-list">';
    items.forEach((t,i) => {
        html += `<div class="news-item" style="cursor:default">
                    <div class="ni-num ${isSport?'sport-num':''}">${i+1}</div>
                    <div class="ni-body">
                        <div class="ni-title">${t}</div>
                        <div class="ni-meta"><span class="ni-src ${isSport?'sport':''}">${isSport?'⚽ ورزشی':'📰 نمونه'}</span></div>
                    </div>
                 </div>`;
    });
    setHTML(containerId, html+'</div>');
}

// ==========================================
// ویکی‌پدیا
// ==========================================
function setWikiLang(lang, btn) {
    wikiLang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const ph = { fa:'جستجو در ویکی‌پدیا فارسی...', en:'Search Wikipedia...', ar:'البحث في ويكيبيديا...' };
    document.getElementById('wikiInput').placeholder = ph[lang];
}

async function searchWiki() {
    const q = document.getElementById('wikiInput').value.trim();
    if (!q) return;

    setHTML('wikiResult',`<div class="wiki-loading"><div class="wiki-spinner"></div><span>در حال جستجو...</span></div>`);

    try {
        const res = await fetch(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
        if (res.ok) { showWikiArticle(await res.json()); return; }
        await searchWikiText(q);
    } catch { await searchWikiText(q); }
}

function showWikiArticle(data) {
    const dir = (wikiLang==='fa'||wikiLang==='ar') ? 'rtl' : 'ltr';
    const link = data.content_urls?.desktop?.page || `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(data.title||'')}`;
    setHTML('wikiResult',`
        <div class="wiki-article" dir="${dir}">
            <div class="wiki-art-header">
                ${data.thumbnail?.source?`<img class="wiki-art-img" src="${data.thumbnail.source}" onerror="this.style.display='none'">`:''}
                <div>
                    <div class="wiki-art-title">${data.title||''}</div>
                    ${data.description?`<div class="wiki-art-desc">${data.description}</div>`:''}
                </div>
            </div>
            <div class="wiki-art-extract">${data.extract||'توضیحی یافت نشد.'}</div>
            <a class="wiki-art-link" href="${link}" target="_blank" rel="noopener">📖 مطالعه کامل ↗</a>
        </div>`);
}

async function searchWikiText(q) {
    try {
        const url = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=8`;
        const res  = await fetch(url);
        const data = await res.json();
        const hits = data?.query?.search || [];

        if (!hits.length) {
            setHTML('wikiResult',`<div class="panel-empty"><span>🔍</span><p>نتیجه‌ای یافت نشد</p></div>`);
            return;
        }

        let html = `<div style="padding:10px 14px;border-bottom:1px solid var(--border);font-size:0.76rem;color:var(--text2)">${hits.length} نتیجه برای «${q}»</div><div class="wiki-results-grid">`;
        hits.forEach(item => {
            const link = `https://${wikiLang}.wikipedia.org/wiki/${encodeURIComponent(item.title)}`;
            html += `<a class="wiki-res-card" href="${link}" target="_blank" rel="noopener">
                        <div class="wiki-res-title">${item.title}</div>
                        <div class="wiki-res-snippet">${item.snippet.replace(/<[^>]*>/g,'')}</div>
                     </a>`;
        });
        setHTML('wikiResult', html+'</div>');
    } catch {
        setHTML('wikiResult',`<div class="panel-empty"><span>⚠️</span><p>خطا در جستجو</p></div>`);
    }
}

// ==========================================
// هوش مصنوعی
// ==========================================
function setAiModel(model, btn) {
    aiModel = model;
    document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function aiKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); }
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function askAI(text) {
    document.getElementById('aiInput').value = text;
    sendAiMessage();
}

async function sendAiMessage() {
    if (isAiLoading) return;
    const input = document.getElementById('aiInput');
    const msg   = input.value.trim();
    if (!msg) return;

    input.value = '';
    input.style.height = 'auto';
    isAiLoading = true;
    document.getElementById('aiSendBtn').disabled = true;

    // پاک کردن صفحه خوش‌آمد
    const welcome = document.querySelector('.ai-welcome');
    if (welcome) welcome.remove();

    // نمایش پیام کاربر
    addChatMsg('user', msg);

    // نمایش لودینگ
    const loadId = 'load-' + Date.now();
    addChatMsg('bot', `<div class="typing-dots"><span></span><span></span><span></span></div>`, loadId);

    chatHistory.push({ role: 'user', content: msg });

    try {
        let reply = '';

        if (aiModel === 'pollinations') {
            reply = await callPollinations(msg);
        } else {
            reply = await callOpenRouter(msg);
        }

        // حذف لودینگ و نمایش جواب
        const loadEl = document.getElementById(loadId);
        if (loadEl) loadEl.closest('.chat-msg').remove();

        addChatMsg('bot', formatAiText(reply));
        chatHistory.push({ role: 'assistant', content: reply });

    } catch (err) {
        const loadEl = document.getElementById(loadId);
        if (loadEl) loadEl.closest('.chat-msg').remove();
        addChatMsg('bot', '⚠️ خطا در دریافت پاسخ. لطفاً دوباره تلاش کنید.');
    }

    isAiLoading = false;
    document.getElementById('aiSendBtn').disabled = false;
    input.focus();
}

// API اول: Pollinations (رایگان، بدون key)
async function callPollinations(msg) {
    const systemPrompt = 'تو یک دستیار هوش مصنوعی هستی که به فارسی پاسخ می‌دهی. پاسخ‌های کوتاه، مفید و واضح بده.';
    const fullMsg = systemPrompt + '\n\nسوال: ' + msg;

    const res = await fetch(
        `https://text.pollinations.ai/${encodeURIComponent(fullMsg)}`,
        { signal: AbortSignal.timeout(30000) }
    );

    if (!res.ok) throw new Error('خطای سرور');
    return await res.text();
}

// API دوم: OpenRouter (رایگان با key رایگان)
async function callOpenRouter(msg) {
    // این API رایگان است و نیاز به ثبت‌نام دارد
    // از مدل رایگان mistral استفاده میکنیم
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer free', // کلید رایگان
            'HTTP-Referer': window.location.href,
        },
        body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct:free',
            messages: [
                { role: 'system', content: 'تو یک دستیار هوش مصنوعی هستی که به فارسی پاسخ می‌دهی.' },
                ...chatHistory.slice(-6),
                { role: 'user', content: msg }
            ]
        }),
        signal: AbortSignal.timeout(30000)
    });

    const data = await res.json();
    if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
    }
    throw new Error('پاسخی دریافت نشد');
}

function addChatMsg(role, content, id) {
    const history = document.getElementById('aiChatHistory');
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.innerHTML = `
        <div class="chat-avatar">${role === 'user' ? '👤' : '🤖'}</div>
        <div class="chat-bubble ${id ? 'loading-bubble' : ''}" ${id ? `id="${id}"` : ''}>
            ${content}
        </div>`;
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

function formatAiText(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

// ==========================================
// ابزارهای تاریخ
// ==========================================
function dateToStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function miladi(d) {
    const wd = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
    const mo = ['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','ژوئیه','اوت','سپتامبر','اکتبر','نوامبر','دسامبر'];
    return `${wd[d.getDay()]} ${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear()}`;
}

function shamsi(d) {
    const r  = toJalali(d.getFullYear(), d.getMonth()+1, d.getDate());
    const mo = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    const wd = ['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'];
    return `${wd[d.getDay()]} ${r[2]} ${mo[r[1]-1]} ${r[0]}`;
}

function toJalali(gy, gm, gd) {
    const g = [0,31,59,90,120,151,181,212,243,273,304,334];
    let gy2 = gm>2?gy+1:gy;
    let g_d = 365*gy+Math.floor((gy2+3)/4)-Math.floor((gy2+99)/100)+Math.floor((gy2+399)/400)-80+gd+g[gm-1];
    let jy  = -1595+33*Math.floor(g_d/12053);
    g_d    %= 12053; jy += 4*Math.floor(g_d/1461); g_d %= 1461;
    if (g_d>365) { jy+=Math.floor((g_d-1)/365); g_d=(g_d-1)%365; }
    let jm, jd;
    if (g_d<186) { jm=1+Math.floor(g_d/31); jd=1+(g_d%31); }
    else         { jm=7+Math.floor((g_d-186)/30); jd=1+((g_d-186)%30); }
    return [jy, jm, jd];
}

function qamari(d) {
    const gy=d.getFullYear(), gm=d.getMonth()+1, gd=d.getDate();
    const mo=['محرم','صفر','ربیع‌الاول','ربیع‌الثانی','جمادی‌الاول','جمادی‌الثانی','رجب','شعبان','رمضان','شوال','ذی‌القعده','ذی‌الحجه'];
    let jd2=Math.floor((14+367*gy-Math.floor(7*(gy+Math.floor((gm+9)/12))/4)+Math.floor(275*gm/9)+gd))+2400000;
    let l=jd2-1948440+10632, n=Math.floor((l-1)/10631);
    l=l-10631*n+354;
    let j=Math.floor((10985-l)/5316)*Math.floor((50*l)/17719)+Math.floor(l/5670)*Math.floor((43*l)/15238);
    l=l-Math.floor((30-j)/15)*Math.floor((17719*j)/50)-Math.floor(j/16)*Math.floor((15238*j)/43)+29;
    let hm=Math.floor((24*l)/709), hd=l-Math.floor((709*hm)/24), hy=30*n+j-30;
    return `${hd} ${mo[(hm-1)%12]} ${hy}`;
}

function setHTML(id, html) { const el=document.getElementById(id); if(el) el.innerHTML=html; }

function cleanText(s) { return (s||'').replace(/[\r\n\t]+/g,' ').replace(/<[^>]*>/g,'').trim(); }

function timeAgoFa(ds) {
    if (!ds) return '';
    try {
        const diff = Math.floor((Date.now()-new Date(ds))/60000);
        if (isNaN(diff)||diff<0) return '';
        if (diff<1)    return 'همین الان';
        if (diff<60)   return `${diff} دقیقه پیش`;
        if (diff<1440) return `${Math.floor(diff/60)} ساعت پیش`;
        if (diff<2880) return 'دیروز';
        return `${Math.floor(diff/1440)} روز پیش`;
    } catch { return ''; }
}

function getWeather(code) {
    const m = {
        0:{icon:'☀️',desc:'آسمان صاف'},1:{icon:'🌤️',desc:'عمدتاً صاف'},
        2:{icon:'⛅',desc:'نیمه ابری'},3:{icon:'☁️',desc:'ابری'},
        45:{icon:'🌫️',desc:'مه‌آلود'},48:{icon:'🌫️',desc:'مه یخ‌زده'},
        51:{icon:'🌦️',desc:'نم‌نم خفیف'},53:{icon:'🌦️',desc:'نم‌نم باران'},
        55:{icon:'🌧️',desc:'نم‌نم شدید'},61:{icon:'🌧️',desc:'باران خفیف'},
        63:{icon:'🌧️',desc:'باران متوسط'},65:{icon:'🌧️',desc:'باران شدید'},
        71:{icon:'❄️',desc:'برف خفیف'},73:{icon:'❄️',desc:'برف متوسط'},
        75:{icon:'❄️',desc:'برف سنگین'},77:{icon:'🌨️',desc:'دانه برف'},
        80:{icon:'🌦️',desc:'رگبار خفیف'},81:{icon:'🌧️',desc:'رگبار متوسط'},
        82:{icon:'⛈️',desc:'رگبار شدید'},95:{icon:'⛈️',desc:'طوفان'},
        96:{icon:'⛈️',desc:'طوفان با تگرگ'},99:{icon:'⛈️',desc:'طوفان شدید'}
    };
    return m[code]||{icon:'🌡️',desc:'نامشخص'};
}