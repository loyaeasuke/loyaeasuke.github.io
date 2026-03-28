const csvFileName = 'data.csv'; 
let allData = [];
let myRadarChart = null;

window.onload = () => fetchCSV();

async function fetchCSV() {
    try {
        const cacheBuster = `?v=${new Date().getTime()}`;
        const response = await fetch(csvFileName + cacheBuster);
        if (!response.ok) throw new Error('無法讀取 CSV 檔案，請檢查路徑與伺服器設定。');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
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
        div.innerText = char['名字'] || `未知角色 ${i+1}`;
        div.onclick = () => updateDisplay(char, div);
        list.appendChild(div);
    });
}

function updateDisplay(char, el) {
    // 樣式切換
    document.querySelectorAll('.name-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('detailCard').style.display = 'block';

    // 1. 填入文字資訊 (支援 HTML 語法)
    document.getElementById('displayName').innerText = char['名字'];
    document.getElementById('displayJob').innerText = char['職業'] || '';
    document.getElementById('displayQuote').innerHTML = char['台詞'] || '';
    document.getElementById('displaySummary').innerHTML = char['概要'] || '';

    // 2. 處理三張圖片的顯示/隱藏與不裁切縮放
    handleImageDisplay('imgIcon', char['ICON'], '頭像');
    handleImageDisplay('imgFull', char['全身圖'], '全身立繪');
    handleImageDisplay('imgHalf', char['半身圖'] || char['背景'], '相關圖片');

    // 3. 填入橫向數值網格
    const gridValues = document.getElementById('gridValues');
    const attrKeys = ['STR', 'CON', 'POW', 'DEX', 'APP', 'SIZ', 'INT', 'EDU'];
    gridValues.innerHTML = attrKeys.map(key => `<div>${char[key] || 0}</div>`).join('');

    // 4. 更新雷達圖
    updateRadarChart(char, attrKeys);
}

// 核心功能：判斷圖片是否有資料，無資料則完全隱藏該區塊
function handleImageDisplay(imgId, charData, labelText) {
    const imgEl = document.getElementById(imgId);
    const boxEl = imgEl.parentElement; 
    const labelEl = boxEl.querySelector('.img-label');

    // 檢查資料是否存在且非空字串
    if (charData && charData.trim() !== "") {
        boxEl.style.display = "block"; // 顯示區塊
        imgEl.src = charData;
        if (labelEl) labelEl.innerText = labelText;
        // 綁定點擊放大功能
        boxEl.onclick = () => openLightbox(charData);
    } else {
        boxEl.style.display = "none"; // 隱藏區塊，讓 Grid 自動重排
    }
}

function updateRadarChart(char, labels) {
    const values = labels.map(l => parseInt(char[l]) || 0);
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    if (myRadarChart) myRadarChart.destroy();
    
    myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: '#3498db',
                borderWidth: 2,
                pointBackgroundColor: '#3498db',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: { 
                r: { 
                    suggestedMin: 0, 
                    suggestedMax: 20, 
                    ticks: { display: false },
                    grid: { color: '#e1e8ed' },
                    angleLines: { color: '#e1e8ed' }
                } 
            },
            plugins: { legend: { display: false } }
        }
    });
}

function openLightbox(src) {
    const lb = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightboxImg');
    lbImg.src = src;
    lb.style.display = 'flex';
}