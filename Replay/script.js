// CSV 檔案路徑
const CSV_PATH = 'data.csv'; 

document.addEventListener('DOMContentLoaded', () => {
    // 啟動解析 CSV
    Papa.parse(CSV_PATH, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            renderMenu(results.data);
        },
        error: function(err) {
            console.error("無法讀取 CSV:", err);
            document.getElementById('menu-container').innerHTML = 
                `<div style="padding:20px; color: #ff8888;">資料載入失敗</div>`;
        }
    });
});

function renderMenu(data) {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = ''; 
    
    let lastCategory = '';
    let currentGroup = null;

    data.forEach(item => {
        // 依照你的要求使用中文標頭名稱
        const catName = item['分類'];
        const itemName = item['名稱'];
        const itemID = item['id'];
        const itemURL = item['網址'];

        if (!itemName || !catName) return;

        // 當偵測到新分類時
        if (catName !== lastCategory) {
            lastCategory = catName;

            // 1. 建立分類標題 (預設加上收合 class: collapsed)
            const catDiv = document.createElement('div');
            catDiv.className = 'category-title collapsed'; 
            catDiv.textContent = catName;
            
            // 2. 建立該分類的項目容器 (預設加上隱藏 class: is-hidden)
            const groupDiv = document.createElement('div');
            groupDiv.className = 'category-group is-hidden';
            currentGroup = groupDiv;

            // 3. 點擊事件：切換標題箭頭與容器顯示
            catDiv.onclick = () => {
                const isCollapsed = catDiv.classList.toggle('collapsed');
                groupDiv.classList.toggle('is-hidden');
            };

            menuContainer.appendChild(catDiv);
            menuContainer.appendChild(groupDiv);
        }

        // 4. 建立選單項目並塞入當前的群組容器
        const link = document.createElement('a');
        link.className = 'menu-item';
        link.href = "#";
        link.textContent = `${itemID}. ${itemName}`;
        
        link.onclick = (e) => {
            e.preventDefault();
            
            // 移除其他項目的選取狀態
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            link.classList.add('active');

            // 呼叫顯示頁面函式
            updateDisplay(itemURL);
        };

        if (currentGroup) {
            currentGroup.appendChild(link);
        }
    });
}

function updateDisplay(url) {
    const frame = document.getElementById('content-frame');
    const placeholder = document.getElementById('placeholder-text');

    if (url) {
        placeholder.style.display = 'none';
        frame.style.display = 'block';
        frame.src = url;
    }
}