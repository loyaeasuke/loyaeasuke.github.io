const csvFileName = 'data.csv'; 
let allData = [];
let myRadarChart = null;

window.onload = () => fetchCSV();

async function fetchCSV() {
    try {
        const cacheBuster = `?v=${new Date().getTime()}`;
        const response = await fetch(csvFileName + cacheBuster);
        if (!response.ok) throw new Error('無法讀取 CSV');
        const csvText = await response.text();
        Papa.parse(csvText, {
            header: true, skipEmptyLines: true,
            complete: (results) => {
                allData = results.data;
                document.getElementById('status').innerText = `已載入 ${allData.length} 位角色`;
                renderNameList();
            }
        });
    } catch (e) { document.getElementById('status').innerText = '錯誤: ' + e.message; }
}

function renderNameList() {
    const list = document.getElementById('nameList');
    list.innerHTML = '';
    allData.forEach((char, i) => {
        const div = document.createElement('div');
        div.className = 'name-item';
        div.innerText = char['名字'] || `角色 ${i+1}`;
        div.onclick = () => updateDisplay(char, div);
        list.appendChild(div);
    });
}

function updateDisplay(char, el) {
    document.querySelectorAll('.name-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    
    const card = document.getElementById('detailCard');
    const bgLayer = document.getElementById('cardBgLayer');
    const cardContent = document.getElementById('cardContent');
    
    document.getElementById('welcome').style.display = 'none';
    card.style.display = 'block';

    const charThemeColor = char['顏色'] || '#3498db';

    if (bgLayer) {
        bgLayer.style.backgroundImage = 'none';
        bgLayer.style.animation = 'none';
        void bgLayer.offsetWidth; 
        const bgPath = char['背景'] || char['全身圖'] || '';
        if (bgPath.trim() !== "") {
            bgLayer.style.backgroundImage = `url('${bgPath}')`;
            bgLayer.style.animation = 'bgFadeIn 0.8s ease-out 0.2s forwards';
        }
    }

    document.getElementById('displayName').innerText = char['名字'];
    document.getElementById('displayJob').innerText = char['職業'] || '';
    const displayQuote = document.getElementById('displayQuote');
    displayQuote.innerHTML = char['台詞'] || '';
    displayQuote.style.borderColor = charThemeColor; 
    
    document.getElementById('displaySummary').innerHTML = char['概要'] || '暫無概要資料';
    document.getElementById('displayHistory').innerHTML = char['經歷'] || '暫無經歷紀錄';

    handleImageDisplay('imgIcon', char['ICON']);
    handleImageDisplay('imgFull', char['全身圖']);
    handleImageDisplay('imgExpressions', char['表情差分']);

    const attrKeys = ['STR', 'CON', 'POW', 'DEX', 'APP', 'SIZ', 'INT', 'EDU'];
    document.getElementById('gridValues').innerHTML = attrKeys.map(k => `<div>${char[k] || 0}</div>`).join('');
    updateRadarChart(char, attrKeys, charThemeColor);
}

function handleImageDisplay(imgId, charData) {
    const imgEl = document.getElementById(imgId);
    if (!imgEl) return;
    const boxEl = imgEl.parentElement; 
    if (charData && charData.trim() !== "") {
        boxEl.style.display = "block";
        imgEl.src = charData;
        boxEl.onclick = () => openLightbox(charData);
    } else {
        boxEl.style.display = "none";
    }
}

function updateRadarChart(char, labels, themeColor) {
    const values = labels.map(l => parseInt(char[l]) || 0);
    const ctx = document.getElementById('radarChart').getContext('2d');
    const areaColor = themeColor.length === 7 ? themeColor + '44' : themeColor;

    if (myRadarChart) myRadarChart.destroy();
    myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: areaColor, borderColor: themeColor, borderWidth: 2,
                pointBackgroundColor: themeColor, pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: { 
                r: { 
                    suggestedMin: 0, 
                    suggestedMax: 21, // 設定為 21 可以讓 18 後面還有一個空間，視覺較平衡
                    angleLines: { color: 'rgba(0,0,0,0.1)' },
                    grid: { color: 'rgba(0,0,0,0.1)' },
                    pointLabels: { font: { size: 12, weight: 'bold' } },
                    ticks: { 
                        display: true,      // 開啟數字顯示
                        stepSize: 3,       // 設定間隔為 3 (顯示 3, 6, 9, 12, 15, 18...)
                        showLabelBackdrop: false, // 移除數字背景白框
                        font: { size: 10 },
                        color: '#95a5a6'   // 數字顏色
                    }
                } 
            },
            plugins: { legend: { display: false } }
        }
    });
}

function openLightbox(src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').style.display = 'flex';
}