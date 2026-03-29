/**
 * 角色資訊資料庫系統
 * 更新重點：優化動畫邏輯，確保每次切換不同角色時整張卡片重複播放滑入效果
 */

const csvFileName = 'data.csv'; 
let allData = [];            
let myRadarChart = null;     
let currentSelectedId = null; // 用於紀錄當前顯示角色的唯一標識，避免重複點擊時重複執行動畫

window.onload = () => fetchCSV();

async function fetchCSV() {
    try {
        const cacheBuster = `?v=${new Date().getTime()}`;
        const response = await fetch(csvFileName + cacheBuster);
        if (!response.ok) throw new Error('無法讀取 CSV 檔案');
        
        const csvText = await response.text();
        Papa.parse(csvText, {
            header: true, 
            skipEmptyLines: true,
            complete: (results) => {
                allData = results.data;
                document.getElementById('status').innerText = ``; //已載入 ${allData.length} 位角色
                renderNameList();
            }
        });
    } catch (e) { 
        document.getElementById('status').innerText = '發生錯誤: ' + e.message; 
    }
}

function renderNameList() {
    const list = document.getElementById('nameList');
    list.innerHTML = '';
    const categories = [...new Set(allData.map(char => char['分類']).filter(Boolean))];
    if (categories.length === 0) {
        renderGroup("全部角色", allData, list);
    } else {
        categories.forEach(catName => {
            const filtered = allData.filter(char => char['分類'] === catName);
            renderGroup(catName, filtered, list);
        });
    }
}

function renderGroup(titleName, dataArray, container) {
    const title = document.createElement('div');
    title.className = 'list-category-title';
    title.innerText = titleName;
    container.appendChild(title);

    dataArray.forEach(char => {
        const div = document.createElement('div');
        div.className = 'name-item';
        div.innerText = char['名字'] || '未命名角色';
        div.onclick = () => updateDisplay(char, div);
        container.appendChild(div);
    });
}

function updateDisplay(char, el) {
    // 檢查點：若點擊的是當前已顯示的角色，則不執行後續動作（不重新播放動畫）
    if (currentSelectedId === char['名字']) return;
    currentSelectedId = char['名字'];

    // 處理名單選中效果
    document.querySelectorAll('.name-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    
    document.getElementById('welcome').style.display = 'none';
    const card = document.getElementById('detailCard');
    
    // 【重要修改】將動畫控制移至 .card 元素本身
    // 透過 display: block 確保元素存在，才能正常移除動畫類別並重新套用
    card.style.display = 'block';

    // --- 【重置動畫邏輯】套用至 .card 元素本身 ---
    // 先移除 animate 類別
    card.classList.remove('animate');
    // 透過讀取 offsetWidth 強制瀏覽器重新計算樣式 (Reflow)，這能確保類別移除生效
    void card.offsetWidth; 
    // 重新加上 animate 類別，觸發動畫重新開始，從右滑入
    card.classList.add('animate');

    const themeColor = char['顏色'] || '#3498db';

    // 處理 HO 標籤 (佔位修正)
    const headerElement = document.querySelector('.grid-header');
    if (headerElement) {
        // 使用 themeColor 並加上 '22' (約 13% 透明度) 作為底色，避免顏色過深
        const lightBgColor = themeColor.length === 7 ? themeColor + '22' : themeColor;
        headerElement.style.backgroundColor = lightBgColor;
    }

    const hoEl = document.getElementById('displayHO');
    hoEl.innerText = ""; 
    if (char['HO'] && char['HO'].trim() !== "") {
        hoEl.style.visibility = "visible";
        hoEl.innerText = char['HO']; 
        hoEl.style.color = themeColor;
    } else { 
        hoEl.style.visibility = "hidden"; 
        hoEl.innerText = "\u00A0"; 
    }

    // 背景浮水印
    const bgLayer = document.getElementById('cardBgLayer');
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

    // 填入文字資訊
    document.getElementById('displayName').innerText = char['名字'];
    document.getElementById('displayJob').innerText = char['職業'] || '';
    document.getElementById('displayQuote').innerHTML = char['台詞'] || '';
    document.getElementById('displayQuote').style.borderColor = themeColor;
    document.getElementById('displaySummary').innerHTML = char['概要'] || '無資料';
    document.getElementById('displayHistory').innerHTML = char['經歷'] || '暫無經歷紀錄';

    handleImageDisplay('imgIcon', char['ICON']);
    handleImageDisplay('imgFull', char['全身圖']);
    handleImageDisplay('imgExpressions', char['表情差分']);

    const attrKeys = ['STR', 'CON', 'POW', 'DEX', 'APP', 'SIZ', 'INT', 'EDU'];
    document.getElementById('gridValues').innerHTML = attrKeys.map(k => `<div>${char[k] || 0}</div>`).join('');
    updateRadarChart(char, attrKeys, themeColor);
}

function handleImageDisplay(imgId, data) {
    const img = document.getElementById(imgId);
    const box = img.parentElement;
    if (data && data.trim() !== "") { 
        box.style.display = "block"; 
        img.src = data; 
        box.onclick = () => openLightbox(data); 
    } else { 
        box.style.display = "none"; 
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
                backgroundColor: areaColor, 
                borderColor: themeColor, 
                borderWidth: 2, 
                pointBackgroundColor: themeColor, 
                pointRadius: 4,      // 數字越大，圓點越大
                pointHoverRadius: 6  // 滑鼠滑過時的圓點大小
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    suggestedMin: 0, 
                    suggestedMax: 21, // 根據 TRPG 屬性上限調整
                    angleLines: { color: '#aaaaaa' }, 
                    grid: { color: '#aaaaaa' },
                    // --- 【核心修改：補回數字顯示】 ---
                    ticks: { 
                        stepSize: 3,        // 設定間隔為 3 (會顯示 3, 6, 9...)
                        display: true,      // 務必設為 true 以顯示數字
                        showLabelBackdrop: false, // 隱藏數字後方的白色背景框，讓畫面更乾淨
                        color: '#555',   // 數字顏色
                        font: { size: 10 }, // 數字大小
                        z: 1                // 確保數字顯示在最上層，不被背景遮擋
                    },
                    pointLabels: {          // 調整外圍文字 (STR, DEX...) 的樣式
                        color: '#333',
                        font: { size: 12, weight: 'bold' }
                    }
                }
            },
            plugins: { 
                legend: { display: false } // 隱藏圖例
            }
        }
    });
}

function openLightbox(src) { 
    document.getElementById('lightboxImg').src = src; 
    document.getElementById('lightbox').style.display = 'flex'; 
}