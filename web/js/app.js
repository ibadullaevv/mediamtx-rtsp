// Global o'zgaruvchilar
let cameras = [];
let currentView = 'grid';

// Sahifa yuklanganda ishga tushadi
document.addEventListener('DOMContentLoaded', function() {
    loadCameras();
    setupEventListeners();
});

// Kameralar ma'lumotlarini yuklash
async function loadCameras() {
    try {
        const response = await fetch('/config/cameras.json');
        const data = await response.json();
        cameras = data.cameras;
        displayCameras(cameras);
        updateOnlineCount();
    } catch (error) {
        console.error('Kameralar yuklanmadi:', error);
        showError('Kameralar ma'lumotlarini yuklab bo\'lmadi');
    }
}

// Kameralarni ko'rsatish
function displayCameras(camerasToShow) {
    const grid = document.getElementById('camera-grid');
    const loading = document.getElementById('loading');
    
    if (loading) loading.style.display = 'none';
    
    grid.innerHTML = '';
    
    camerasToShow.forEach(camera => {
        const cameraCard = createCameraCard(camera);
        grid.appendChild(cameraCard);
    });
}

// Kamera kartasini yaratish
function createCameraCard(camera) {
    const card = document.createElement('div');
    card.className = 'camera-card';
    card.onclick = () => openCameraDetail(camera.id);
    
    card.innerHTML = `
        <div class="camera-preview">
            <video id="preview-${camera.id}" muted autoplay playsinline>
                <source src="${camera.hls_url}" type="application/x-mpegURL">
            </video>
            <div class="placeholder" style="display: none;">
                <i class="fas fa-video-slash"></i>
            </div>
            <div class="camera-status ${camera.status}">
                ${camera.status === 'online' ? 'Online' : 'Offline'}
            </div>
        </div>
        <div class="camera-info">
            <h3>${camera.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${camera.location}</p>
            <p><i class="fas fa-network-wired"></i> ${camera.ip}</p>
            <p class="description">${camera.description}</p>
        </div>
    `;
    
    // HLS video ni ishga tushirish
    setTimeout(() => {
        initializeHLSPlayer(`preview-${camera.id}`, camera.hls_url);
    }, 100);
    
    return card;
}

// HLS playerini ishga tushirish
function initializeHLSPlayer(videoId, hlsUrl) {
    const video = document.getElementById(videoId);
    if (!video) return;
    
    if (Hls.isSupported()) {
        const hls = new Hls({
            enableWorker: false,
            lowLatencyMode: true,
            backBufferLength: 90
        });
        
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play().catch(e => {
                console.log('Video avtomatik ijro etilmadi:', e);
            });
        });
        
        hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS xatolik:', data);
            showVideoError(videoId);
        });
        
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', function() {
            video.play().catch(e => {
                console.log('Video avtomatik ijro etilmadi:', e);
            });
        });
    }
}

// Video xatolik ko'rsatish
function showVideoError(videoId) {
    const video = document.getElementById(videoId);
    const placeholder = video.parentElement.querySelector('.placeholder');
    
    if (video && placeholder) {
        video.style.display = 'none';
        placeholder.style.display = 'flex';
    }
}

// Kamera detali sahifasini ochish
function openCameraDetail(cameraId) {
    window.location.href = `camera-detail.html?id=${cameraId}`;
}

// Kamera detali ma'lumotlarini yuklash
async function loadCameraDetail(cameraId) {
    try {
        const response = await fetch('/config/cameras.json');
        const data = await response.json();
        const camera = data.cameras.find(c => c.id === cameraId);
        
        if (!camera) {
            showError('Kamera topilmadi');
            return;
        }
        
        // Sahifa ma'lumotlarini yangilash
        document.getElementById('camera-title').textContent = camera.name;
        document.getElementById('camera-name').textContent = camera.name;
        document.getElementById('camera-location').textContent = camera.location;
        document.getElementById('camera-ip').textContent = camera.ip;
        document.getElementById('camera-status').textContent = camera.status;
        document.getElementById('camera-description').textContent = camera.description;
        
        // Video playerni ishga tushirish
        initializeMainPlayer(camera.hls_url);
        
    } catch (error) {
        console.error('Kamera detali yuklanmadi:', error);
        showError('Kamera ma\'lumotlarini yuklab bo\'lmadi');
    }
}

// Asosiy video playerni ishga tushirish
function initializeMainPlayer(hlsUrl) {
    const video = document.getElementById('video-player');
    if (!video) return;
    
    if (Hls.isSupported()) {
        const hls = new Hls({
            enableWorker: false,
            lowLatencyMode: true,
            backBufferLength: 90
        });
        
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play().catch(e => {
                console.log('Video avtomatik ijro etilmadi:', e);
            });
        });
        
        hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS xatolik:', data);
            showError('Video yuklanmadi');
        });
        
        // Video statistikasini yangilash
        updateVideoStats(hls, video);
        
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.addEventListener('loadedmetadata', function() {
            video.play().catch(e => {
                console.log('Video avtomatik ijro etilmadi:', e);
            });
        });
    }
}

// Video statistikasini yangilash
function updateVideoStats(hls, video) {
    setInterval(() => {
        if (hls && video) {
            const level = hls.currentLevel;
            const levels = hls.levels;
            
            if (levels && levels[level]) {
                document.getElementById('stream-quality').textContent = 
                    `${levels[level].width}x${levels[level].height}`;
            }
            
            if (video.videoWidth && video.videoHeight) {
                document.getElementById('stream-fps').textContent = '25 FPS';
            }
            
            const delay = video.buffered.length > 0 ? 
                Math.round((video.currentTime - video.buffered.start(0)) * 1000) : 0;
            document.getElementById('stream-delay').textContent = `${delay}ms`;
        }
    }, 2000);
}

// Hodisa tinglovchilarini o'rnatish
function setupEventListeners() {
    // Qidiruv
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const filtered = cameras.filter(camera => 
                camera.name.toLowerCase().includes(query) ||
                camera.location.toLowerCase().includes(query) ||
                camera.description.toLowerCase().includes(query)
            );
            displayCameras(filtered);
        });
    }
    
    // Ko'rinish o'zgartirish
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    
    if (gridViewBtn && listViewBtn) {
        gridViewBtn.addEventListener('click', () => setView('grid'));
        listViewBtn.addEventListener('click', () => setView('list'));
    }
    
    // Video boshqaruv tugmalari
    setupVideoControls();
}

// Ko'rinishni o'rnatish
function setView(view) {
    currentView = view;
    const gridViewBtn = document.getElementById('grid-view');
    const listViewBtn = document.getElementById('list-view');
    const cameraGrid = document.getElementById('camera-grid');
    
    if (gridViewBtn && listViewBtn && cameraGrid) {
        gridViewBtn.classList.toggle('active', view === 'grid');
        listViewBtn.classList.toggle('active', view === 'list');
        
        cameraGrid.className = view === 'list' ? 'camera-list' : 'camera-grid';
    }
}

// Video boshqaruv tugmalarini o'rnatish
function setupVideoControls() {
    const playPauseBtn = document.getElementById('play-pause');
    const fullscreenBtn = document.getElementById('fullscreen');
    const reloadBtn = document.getElementById('reload');
    const video = document.getElementById('video-player');
    
    if (playPauseBtn && video) {
        playPauseBtn.addEventListener('click', () => {
            if (video.paused) {
                video.play();
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                video.pause();
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
    }
    
    if (fullscreenBtn && video) {
        fullscreenBtn.addEventListener('click', () => {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
                video.webkitRequestFullscreen();
            }
        });
    }
    
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            location.reload();
        });
    }
}

// Online kameralar sonini yangilash
function updateOnlineCount() {
    const onlineCount = cameras.filter(camera => camera.status === 'online').length;
    const onlineElement = document.getElementById('online-cameras');
    if (onlineElement) {
        onlineElement.textContent = onlineCount;
    }
}

// Xatolikni ko'rsatish
function showError(message) {
    console.error(message);
    // Bu yerda xatolik modalini yoki toast xabarini ko'rsatishingiz mumkin
    alert(message);
}

// Kamera holatini tekshirish
async function checkCameraStatus() {
    // Bu funksiya kameralar holatini real vaqtda tekshiradi
    // MediaMTX API orqali
    try {
        for (let camera of cameras) {
            const response = await fetch(`http://localhost:9997/v1/paths/list`);
            const data = await response.json();
            // API javobiga qarab kamera holatini yangilang
        }
    } catch (error) {
        console.error('Kamera holati tekshirilmadi:', error);
    }
}

// Har 30 soniyada kamera holatini tekshirish
setInterval(checkCameraStatus, 30000);