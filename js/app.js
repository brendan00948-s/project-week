        document.addEventListener('DOMContentLoaded', function() {
            // Check if Firebase is loaded
            if (typeof window.firebaseApp === 'undefined') {
                console.error('Firebase not initialized properly');
                return;
            }
            
            // Get Firebase references
            const database = window.firebaseDatabase;
            const auth = window.firebaseAuth;
            const {
                ref, onValue, push, set, remove, onChildAdded, onChildChanged, onChildRemoved,  
                createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
            } = window.firebaseFunctions;

            const currentPage = document.body.dataset.page || 'dashboard';
            const RSS2JSON_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';

            function fetchSmgJson(rssUrl) {
                return fetch(RSS2JSON_URL + encodeURIComponent(rssUrl)).then(function(res) {
                    return res.json();
                });
            }
            
            // DOM Elements
            const statusDot = document.getElementById('status-dot');
            const statusText = document.getElementById('status-text');
            const camerasLoading = document.getElementById('cameras-loading');
            const ipCheckingMessage = document.getElementById('ipCheckingMessage');
            const bannedMessage = document.getElementById('bannedMessage');
            const banDetails = document.getElementById('ban-details');
            const bannedOverlay = document.getElementById('bannedOverlay');
            const banDetailsOverlay = document.getElementById('banDetails');
            
            // Chat System Elements
            const chatPage = document.getElementById('chat-page');
            const authContainer = document.getElementById('authContainer');
            const signupContainer = document.getElementById('signupContainer');
            const loginForm = document.getElementById('loginForm');
            const signupForm = document.getElementById('signupForm');
            const showSignup = document.getElementById('showSignup');
            const showLogin = document.getElementById('showLogin');
            const userInfo = document.getElementById('userInfo');
            const chatMessages = document.getElementById('chatMessages');
            const messageInput = document.getElementById('messageInput');
            const sendMessageBtn = document.getElementById('sendMessageBtn');
            const moderationPanel = document.getElementById('moderationPanel');
            const banUserBtn = document.getElementById('banUserBtn');
            
            // Current user data
            let currentUser = null;
            let userRole = 'member';
            
            // Update Firebase connection status
            function updateFirebaseStatus(connected) {
                if (!statusDot || !statusText) return;
                if (connected) {
                    statusDot.classList.add('connected');
                    statusText.textContent = 'Connected to Firebase';
                } else {
                    statusDot.classList.remove('connected');
                    statusText.textContent = 'Disconnected from Firebase';
                }
            }
            
            // Camera tab navigation
            document.querySelectorAll('.camera-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remove active class from all camera tabs and contents
                    document.querySelectorAll('.camera-tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.camera-content').forEach(c => c.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    tab.classList.add('active');
                    
                    // Show corresponding camera content
                    const contentId = tab.getAttribute('data-camera-tab') + '-content';
                    document.getElementById(contentId).classList.add('active');
                });
            });
            
            // Language selector functionality
            const langButton = document.getElementById('langButton');
            const langDropdown = document.getElementById('langDropdown');
            const langOptions = document.querySelectorAll('.lang-option');
            const currentLangSpan = document.getElementById('currentLang');
            
            if (langButton && langDropdown) {
                langButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    langDropdown.classList.toggle('show');
                });
                
                document.addEventListener('click', function(e) {
                    if (!langButton.contains(e.target)) {
                        langDropdown.classList.remove('show');
                    }
                });
            }
            
            if (langOptions.length && currentLangSpan) {
                langOptions.forEach(option => {
                    option.addEventListener('click', function(e) {
                        e.preventDefault();
                        const lang = this.getAttribute('data-lang');
                        changeLanguage(lang);
                        if (langDropdown) langDropdown.classList.remove('show');
                    });
                });
            }
            
            // Translation data - ALL translations now in one place
            const translations = {
                en: {
                    "header-title": "Macau Traffic Monitor",                           
                    "welcome-message": "Hello! Welcome to visit our website!",                           
                    "header-subtitle": "Real-time traffic conditions and waiting times for Macau's major roads and border crossings",                           
                    "nav-dashboard": "Dashboard",                           
                    "nav-cameras": "Live Cameras",                           
                    "nav-news": "News",                
                    "nav-weather": "Weather",
                    "nav-chat": "Community Chat",                           
                    "nav-about": "About",                           
                    "map-instruction": "Drag to navigate the map",                           
                    "traffic-overview": "Traffic Overview",                           
                    "current-time-label": "Current Time: ",                           
                    "overall-traffic": "Overall Traffic",                           
                    "traffic-status-value": "LIGHT",                           
                    "average-delay-label": "Average Delay",                           
                    "crossing-duration": "Estimated Crossing Duration",                           
                    "friendship-bridge": "Friendship Bridge",                           
                    "sai-van-bridge": "Sai Van Bridge",                           
                    "horta-costa": "Avenida de Horta e Costa",                           
                    "san-ma-lou": "San Ma Lou",                           
                    "praca-amaral": "Praca de Ferreira do Amaral",                           
                    "portas-cerco": "Portas do Cerco",                           
                    "cotai-strip": "Cotai Strip",                           
                    "median-traffic-label": "Median Traffic Time: ",                           
                    "traffic-legend-title": "Traffic Legend",                           
                    "severe-traffic": "Severe Traffic (40+ min delay)",                           
                    "heavy-traffic": "Heavy Traffic (20-40 min delay)",                           
                    "moderate-traffic": "Moderate Traffic (10-20 min delay)",                           
                    "light-traffic": "Light Traffic (<10 min delay)",                           
                    "closed-traffic": "Closed/Blocked",                           
                    "website-info-title": "Website Traffic Information",                           
                    "website-info-desc": "This real-time traffic monitor provides estimated waiting times for major roads and border crossings in Macau.",                           
                    "info-point-1": "Times are updated every 30 seconds based on current traffic conditions",                           
                    "info-point-2": "Colors indicate traffic severity levels",                           
                    "info-point-3": "Data is simulated for demonstration purposes",                           
                    "info-point-4": "Actual travel times may vary",                           
                    "travel-tips-title": "Travel Tips",                           
                    "tip-1": "Avoid peak hours (7:00-9:30 and 17:00-19:00) when possible",                           
                    "tip-2": "Please note that Macau's maximum speed in normal roads is 50 km/h, whole bridges are 80 km/h.",                           
                    "tip-3": "Consider using public transportation during heavy traffic periods",                           
                    "tip-4": "Check border crossing times before traveling",                           
                    "tip-5": "Plan extra time for important appointments",                           
                    "tip-6": "Use alternative routes when main roads show heavy congestion",                           
                    "live-cameras-title": "Live Traffic Cameras",                           
                    "tab-macau-city": "Macau City",                          
                    "tab-taipa": "Taipa",                          
                    "tab-bridges": "Cross-Sea Bridges",                          
                    "tab-border": "Border Crossings",                          
                    "community-chat-title": "Community Chat",                           
                    "community-guidelines-title": "Community Guidelines",                           
                    "community-guidelines-desc": "Welcome to the Macau Traffic Monitor community chat! This space is for sharing real-time traffic updates, road conditions, and travel tips with fellow Macau residents and visitors.",                           
                    "guidelines-intro": "Please follow these guidelines to keep our community helpful and respectful: ",                           
                    "guideline-1": "Share accurate, current traffic information",                           
                    "guideline-2": "Be respectful and courteous to all users",                           
                    "guideline-3": "Report road incidents, accidents, or construction",                           
                    "guideline-4": "Ask questions about traffic patterns or road conditions",                           
                    "guideline-5": "Avoid spam, advertisements, or off-topic discussions",                           
                    "guideline-6": "Use appropriate language - no offensive content",                           
                    "moderation-note": "Our moderators monitor the chat to ensure a positive experience for everyone. Violation of these guidelines may result in temporary or permanent ban from the chat.",                           
                    "about-title": "About Macau Traffic Monitor",                           
                    "about-desc": "Macau Traffic Monitor is a real-time traffic information platform designed to help residents and visitors navigate Macau's road network efficiently. Our service provides up-to-date traffic conditions, estimated crossing times, and live camera feeds for major roads and border crossings.",                           
                    "mission-title": "Our Mission",                           
                    "mission-desc": "We aim to reduce travel time and improve road safety in Macau by providing accurate, real-time traffic information. Our platform helps users make informed decisions about their travel routes and timing.",                           
                    "data-sources-title": "Data Sources",                           
                    "data-sources-desc": "Our traffic data is sourced from multiple official channels: ",                           
                    "source-1": "DSAT (Direcção de Serviços de Trânsito) - Official traffic data",                           
                    "source-2": "Google Maps API - Traffic flow and incident reports",                           
                    "source-3": "Live traffic cameras operated by DSAT",                           
                    "source-4": "Community reports from our users",                           
                    "features-title": "Features",                           
                    "feature-1": "Real-time traffic conditions visualization",                           
                    "feature-2": "Estimated waiting times for border crossings",                           
                    "feature-3": "Live traffic camera feeds",                           
                    "feature-4": "Community chat for real-time updates",                           
                    "feature-5": "Mobile app for on-the-go traffic updates",                           
                    "feature-6": "Historical traffic pattern analysis",                           
                    "mobile-app-title": "Get Traffic Updates on the Go",                           
                    "mobile-app-desc": "Download our mobile app for traffic alerts and navigation assistance",                           
                    "feature-alerts": "Instant Alerts",                           
                    "feature-routing": "Smart Routing",                           
                    "feature-history": "Traffic History",                           
                    "feature-maps": "Offline Maps",                      
                    // Camera titles
                    "camera-title-1": "Tunnel da Penha towards Largo do Governor Vasco Rocha Vieira (Reservoir)",                           
                    "camera-title-2": "Tunnel da Penha towards Rua do Campo",                           
                    "camera-title-3": "Mercado da Rua do Aljube",                           
                    "camera-title-4": "Avenida do Conselheiro Borja and Rua do Campo Intersection",                           
                    "camera-title-5": "Avenida do Conselheiro Borja",                           
                    "camera-title-6": "Avenida de Venceslau de Morais",                           
                    "camera-title-7": "Inner Harbour",                           
                    "camera-title-8": "Rua Nova da Areia Preta",                           
                    "camera-title-9": "Praça de Tap Seac",                           
                    "camera-title-10": "Praça do Vasco Rocha Vieira",                           
                    "camera-title-11": "Blood Donation Centre",                           
                    "camera-title-12": "Praça da Nave Desportiva",                           
                    "camera-title-13": "Praça de Ferreira do Amaral",                           
                    "camera-title-14": "Avenida do Infante D. Henrique and Avenida do Dr. Rodrigo Rodrigues Intersection",                           
                    "camera-title-15": "Rua dos Mercadores / Avenida da Praia Grande Intersection",                           
                    "camera-title-16": "Rua dos Mercadores",                           
                    "camera-title-17": "Haiwan Garden",                           
                    "camera-title-18": "Macau International Airport",                           
                    "camera-title-19": "Estrada do Istmo Circular Intersection",                           
                    "camera-title-20": "Cotai Strip",                           
                    "camera-title-21": "Cotai Strip 2 / Estrada do Istmo",                           
                    "camera-title-22": "Avenida da Amizade",                           
                    "camera-title-23": "Ponte da Amizade near North Bay Entrance Intersection",                           
                    "camera-title-24": "Ponte da Amizade towards Taipa",                           
                    "camera-title-25": "Ponte da Amizade towards Macau",                           
                    "camera-title-26": "Ponte de Sai Van towards Macau",                           
                    "camera-title-27": "Ponte de Sai Van towards Taipa (High)",                           
                    "camera-title-28": "Ponte de Sai Van towards Macau (High)",                           
                    "camera-title-29": "Macau Bridge Entrance (Macau)",                           
                    "camera-title-30": "Macau Bridge towards Taipa",                           
                    "camera-title-31": "Macau Bridge towards Macau",                           
                    "camera-title-32": "Tunnel da Portas do Cerco",                           
                    "camera-title-33": "Avenida da Portas do Cerco",                           
                    "camera-title-34": "Qingmao Port (A)",                           
                    "camera-title-35": "Qingmao Port (B)",                           
                    "camera-title-36": "Outer Harbour Ferry Terminal (A)",                           
                    "camera-title-37": "Outer Harbour Ferry Terminal (B)",                           
                    "camera-title-38": "Hengqin Port (A)",                           
                    "camera-title-39": "Hengqin Port (B)",                           
                    "camera-title-40": "Hengqin Port (C)",                           
                    "camera-title-41": "Hengqin Port (D)",                           
                    "camera-title-42": "Hong Kong-Zhuhai-Macau Bridge to Zhuhai",                           
                    "camera-title-43": "Hong Kong-Zhuhai-Macau Bridge to Macau",                           
                    "camera-title-44": "Hong Kong-Zhuhai-Macau Bridge to Passenger Drop-off Platform",                           
                    "camera-title-45": "Hong Kong-Zhuhai-Macau Bridge (Macau Entry)", 
                    // Weather translations
                    "weather-title": "Weather Information", 
                    "current-weather-title": "Current Weather", 
                    "warning-title": "Weather Warnings",
                    "weather-page-title": "SMG weather",
                    "weather-page-desc": "Official weather warnings and daily conditions from the Meteorological and Geophysical Bureau (SMG) RSS feeds at rss.smg.gov.mo.",
                    "alerts-title-text": "Weather warnings",
                    "report-title-text": "Daily weather report",
                    "forecast-title-text": "Weather forecast",
                    "refresh-label": "Refresh feeds"
                },                           
                zh: {
                    "header-title": "澳門交通監控",                           
                    "welcome-message": "您好！歡迎訪問我們的網站！",                           
                    "header-subtitle": "澳門主要道路和邊境口岸的實時交通狀況和等待時間",                           
                    "nav-dashboard": "儀表板",                           
                    "nav-cameras": "實時攝像頭",                           
                    "nav-news": "新聞",                
                    "nav-weather": "天氣",
                    "nav-chat": "社區聊天",                           
                    "nav-about": "關於",                           
                    "map-instruction": "拖動以導航地圖",                           
                    "traffic-overview": "交通概覽",                           
                    "current-time-label": "當前時間：",                           
                    "overall-traffic": "整體交通",                           
                    "traffic-status-value": "輕鬆",                           
                    "average-delay-label": "平均延遲",                           
                    "crossing-duration": "預計過境時間",                           
                    "friendship-bridge": "友誼大橋",                           
                    "sai-van-bridge": "西灣大橋",                           
                    "horta-costa": "荷蘭園大馬路",                           
                    "san-ma-lou": "新馬路",                           
                    "praca-amaral": "亞馬喇前地",                           
                    "portas-cerco": "关闸边检大楼",                           
                    "cotai-strip": "路氹城",                           
                    "median-traffic-label": "中位交通時間：",                           
                    "traffic-legend-title": "交通圖例",                           
                    "severe-traffic": "嚴重交通（延遲40分鐘以上）",                           
                    "heavy-traffic": "嚴重交通（延遲20-40分鐘）",                           
                    "moderate-traffic": "中等交通（延遲10-20分鐘）",                           
                    "light-traffic": "輕鬆交通（延遲少於10分鐘）",                           
                    "closed-traffic": "關閉/封閉",                           
                    "website-info-title": "網站交通信息",                           
                    "website-info-desc": "此實時交通監控提供澳門主要道路和邊境口岸的預計等待時間。",                           
                    "info-point-1": "時間每30秒根據當前交通狀況更新一次",                           
                    "info-point-2": "顏色表示交通嚴重程度",                           
                    "info-point-3": "數據僅供演示用途",                           
                    "info-point-4": "實際旅行時間可能有所不同",                           
                    "travel-tips-title": "旅行提示",                           
                    "tip-1": "盡可能避免高峰時間（早上7:00-9:30和下午5:00-7:00）",                           
                    "tip-2": "請注意，澳門一般道路的最高速度為50公里/小時，橋樑為80公里/小時。",                           
                    "tip-3": "在交通繁忙時段考慮使用公共交通工具",                           
                    "tip-4": "出行前檢查邊境口岸時間",                           
                    "tip-5": "為重要會議預留額外時間",                           
                    "tip-6": "當主要道路出現嚴重擁堵時使用替代路線",                           
                    "live-cameras-title": "實時交通攝像頭",                           
                    "tab-macau-city": "澳門市區",                          
                    "tab-taipa": "氹仔",                          
                    "tab-bridges": "跨海大橋",                          
                    "tab-border": "口岸",                          
                    "community-chat-title": "社區聊天",                           
                    "community-guidelines-title": "社區指南",                           
                    "community-guidelines-desc": "歡迎來到澳門交通監控社區聊天！此空間用於與澳門居民和遊客分享實時交通更新、道路狀況和旅行提示。",                           
                    "guidelines-intro": "請遵守以下指南以保持我們社區的幫助性和尊重性：",                           
                    "guideline-1": "分享準確、當前的交通信息",                           
                    "guideline-2": "對所有用戶保持尊重和禮貌",                           
                    "guideline-3": "報告道路事件、事故或施工",                           
                    "guideline-4": "詢問交通模式或道路狀況問題",                           
                    "guideline-5": "避免垃圾郵件、廣告或離題討論",                           
                    "guideline-6": "使用適當的語言 - 無 offensive 內容",                           
                    "moderation-note": "我們的管理員監控聊天以確保每個人都有積極的體驗。違反這些指南可能導致暫時或永久禁止聊天。",                           
                    "about-title": "關於澳門交通監控",                           
                    "about-desc": "澳門交通監控是一個實時交通信息平台，旨在幫助居民和遊客高效地導航澳門的道路網絡。我們的服務提供最新的交通狀況、預計過境時間和主要道路及邊境口岸的實時攝像頭饋送。",                           
                    "mission-title": "我們的使命",                           
                    "mission-desc": "我們旨在通過提供準確、實時的交通信息來減少澳門的旅行時間並改善道路安全。我們的平台幫助用戶對旅行路線和時間做出明智的決定。",                           
                    "data-sources-title": "數據來源",                           
                    "data-sources-desc": "我們的交通數據來自多個官方渠道：",                           
                    "source-1": "交通事務局 - 官方交通數據",                           
                    "source-2": "Google Maps API - 交通流量和事件報告",                           
                    "source-3": "交通事務局運營的實時交通攝像頭",                           
                    "source-4": "我們用戶的社區報告",                           
                    "features-title": "功能",                           
                    "feature-1": "實時交通狀況可視化",                           
                    "feature-2": "邊境口岸預計等待時間",                           
                    "feature-3": "實時交通攝像頭饋送",                           
                    "feature-4": "社區聊天實時更新",                           
                    "feature-5": "移動應用程序用於路上交通更新",                           
                    "feature-6": "歷史交通模式分析",                           
                    "mobile-app-title": "隨時隨地獲取交通更新",                           
                    "mobile-app-desc": "下載我們的移動應用程序以獲取交通警報和導航協助",                           
                    "feature-alerts": "即時警報",                           
                    "feature-routing": "智能路線規劃",                           
                    "feature-history": "交通歷史",                           
                    "feature-maps": "離線地圖",                      
                    // Camera titles
                    "camera-title-1": "松山隧道向羅理基（水塘）",                           
                    "camera-title-2": "松山隧道向高士德",                           
                    "camera-title-3": "紅街市",                           
                    "camera-title-4": "提督馬路與高士德大馬路交界",                           
                    "camera-title-5": "提督馬路",                           
                    "camera-title-6": "慕拉士大馬路",                           
                    "camera-title-7": "內港",                           
                    "camera-title-8": "黑沙環新街",                           
                    "camera-title-9": "塔石廣場",                           
                    "camera-title-10": "宋玉生廣場",                           
                    "camera-title-11": "捐血中心",                           
                    "camera-title-12": "南灣湖廣場",                           
                    "camera-title-13": "亚马喇前地",                           
                    "camera-title-14": "殷皇子大馬路與葡京路交界",                           
                    "camera-title-15": "新马路 / 南湾马路交界",                           
                    "camera-title-16": "新馬路",                           
                    "camera-title-17": "海灣花園",                           
                    "camera-title-18": "澳門國際機場",                           
                    "camera-title-19": "路氹連貫公路圓形地",                           
                    "camera-title-20": "金光大道",                           
                    "camera-title-21": "金光大道 2 / 路氹連貫公路",                           
                    "camera-title-22": "友誼馬路",                           
                    "camera-title-23": "友誼大橋近北安入口交匯處",                           
                    "camera-title-24": "友谊大桥向氹仔",                           
                    "camera-title-25": "友誼大橋向澳门",                           
                    "camera-title-26": "西灣大橋向澳门",                           
                    "camera-title-27": "西灣大橋向氹仔（高处）",                           
                    "camera-title-28": "西灣大橋向澳门（高处）",                           
                    "camera-title-29": "澳門大橋入口（澳门）",                           
                    "camera-title-30": "澳門大橋向氹仔",                           
                    "camera-title-31": "澳門大橋向澳门",                           
                    "camera-title-32": "關閘隧道",                           
                    "camera-title-33": "關閘大馬路",                           
                    "camera-title-34": "青茂口岸（A）",                           
                    "camera-title-35": "青茂口岸（B）",                           
                    "camera-title-36": "外港客運碼頭（A）",                           
                    "camera-title-37": "外港客運碼頭（B）",                           
                    "camera-title-38": "橫琴口岸（A）",                           
                    "camera-title-39": "橫琴口岸（B）",                           
                    "camera-title-40": "橫琴口岸（C）",                           
                    "camera-title-41": "橫琴口岸（D）",                           
                    "camera-title-42": "港珠澳大橋往珠海",                           
                    "camera-title-43": "港珠澳大橋往澳門",                           
                    "camera-title-44": "港珠澳大橋往送客平台",                           
                    "camera-title-45": "港珠澳大橋（澳門入境）", 
                    // Weather translations
                    "weather-title": "天氣資訊", 
                    "current-weather-title": "當前天氣", 
                    "warning-title": "天氣警告",
                    "weather-page-title": "地球物理暨氣象局天氣",
                    "weather-page-desc": "來自 rss.smg.gov.mo 的官方 RSS：天氣警告與每日天氣報告。",
                    "alerts-title-text": "天氣警告",
                    "report-title-text": "天氣報告",
                    "forecast-title-text": "天氣預測",
                    "refresh-label": "重新整理"
                },                           
                pt: {
                    "header-title": "Monitor de Trânsito de Macau",                           
                    "welcome-message": "Olá! Bem-vindo ao nosso website!",                           
                    "header-subtitle": "Condições de trânsito em tempo real e tempos de espera para as principais estradas e travessias fronteiriças de Macau",                           
                    "nav-dashboard": "Painel",                           
                    "nav-cameras": "Câmaras ao Vivo",                           
                    "nav-news": "Notícias",                
                    "nav-weather": "Meteorologia",
                    "nav-chat": "Chat Comunitário",                           
                    "nav-about": "Sobre",                           
                    "map-instruction": "Arraste para navegar no mapa",                           
                    "traffic-overview": "Visão Geral do Trânsito",                           
                    "current-time-label": "Hora Atual: ",                           
                    "overall-traffic": "Trânsito Geral",                           
                    "traffic-status-value": "LEVE",                           
                    "average-delay-label": "Atraso Médio",                           
                    "crossing-duration": "Duração Estimada da Travessia",                           
                    "friendship-bridge": "Ponte da Amizade",                           
                    "sai-van-bridge": "Ponte de Sai Van",                           
                    "horta-costa": "Avenida de Horta e Costa",                           
                    "san-ma-lou": "San Ma Lou",                           
                    "praca-amaral": "Praça de Ferreira do Amaral",                           
                    "portas-cerco": "Portas do Cerco",                           
                    "cotai-strip": "Faixa de Cotai",                           
                    "median-traffic-label": "Tempo Médio de Trânsito: ",                           
                    "traffic-legend-title": "Legenda de Trânsito",                           
                    "severe-traffic": "Trânsito Severo (40+ min de atraso)",                           
                    "heavy-traffic": "Trânsito Pesado (20-40 min de atraso)",                           
                    "moderate-traffic": "Trânsito Moderado (10-20 min de atraso)",                           
                    "light-traffic": "Trânsito Leve (<10 min de atraso)",                           
                    "closed-traffic": "Fechado/Bloqueado",                           
                    "website-info-title": "Informações de Trânsito do Website",                           
                    "website-info-desc": "Este monitor de trânsito em tempo real fornece tempos de espera estimados para estradas principais e travessias fronteiriças em Macau.",                           
                    "info-point-1": "Os tempos são atualizados a cada 30 segundos com base nas condições atuais de trânsito",                           
                    "info-point-2": "As cores indicam níveis de gravidade do trânsito",                           
                    "info-point-3": "Os dados são simulados para fins de demonstração",                           
                    "info-point-4": "Os tempos reais de viagem podem variar",                           
                    "travel-tips-title": "Dicas de Viagem",                           
                    "tip-1": "Evite horas de pico (7:00-9:30 e 17:00-19:00) quando possível",                           
                    "tip-2": "Note que a velocidade máxima em estradas normais em Macau é 50 km/h, e nas pontes é 80 km/h.",                           
                    "tip-3": "Considere usar transporte público durante períodos de trânsito pesado",                           
                    "tip-4": "Verifique os horários de travessia fronteiriça antes de viajar",                           
                    "tip-5": "Planeje tempo extra para compromissos importantes",                           
                    "tip-6": "Use rotas alternativas quando estradas principais mostrarem congestionamento pesado",                           
                    "live-cameras-title": "Câmaras de Trânsito ao Vivo",                           
                    "tab-macau-city": "Cidade de Macau",                          
                    "tab-taipa": "Taipa",                          
                    "tab-bridges": "Pontes Transoceânicas",                          
                    "tab-border": "Passagens Fronteiriças",                          
                    "community-chat-title": "Chat Comunitário",                           
                    "community-guidelines-title": "Diretrizes Comunitárias",                           
                    "community-guidelines-desc": "Bem-vindo ao chat comunitário do Monitor de Trânsito de Macau! Este espaço é para compartilhar atualizações de trânsito em tempo real, condições rodoviárias e dicas de viagem com residentes e visitantes de Macau.",                           
                    "guidelines-intro": "Por favor, siga estas diretrizes para manter nossa comunidade útil e respeitosa: ",                           
                    "guideline-1": "Compartilhe informações de trânsito precisas e atuais",                           
                    "guideline-2": "Seja respeitoso e cortês com todos os usuários",                           
                    "guideline-3": "Informe sobre incidentes rodoviários, acidentes ou obras",                           
                    "guideline-4": "Faça perguntas sobre padrões de trânsito ou condições rodoviárias",                           
                    "guideline-5": "Evite spam, anúncios ou discussões fora de tópico",                           
                    "guideline-6": "Use linguagem apropriada - sem conteúdo ofensivo",                           
                    "moderation-note": "Nossos moderadores monitoram o chat para garantir uma experiência positiva para todos. Violação destas diretrizes pode resultar em banimento temporário ou permanente do chat.",                           
                    "about-title": "Sobre o Monitor de Trânsito de Macau",                           
                    "about-desc": "O Monitor de Trânsito de Macau é uma plataforma de informações de trânsito em tempo real projetada para ajudar residentes e visitantes a navegar eficientemente pela rede rodoviária de Macau. Nosso serviço fornece condições de trânsito atualizadas, tempos de travessia estimados e feeds de câmaras ao vivo para estradas principais e travessias fronteiriças.",                           
                    "mission-title": "Nossa Missão",                           
                    "mission-desc": "Nosso objetivo é reduzir o tempo de viagem e melhorar a segurança rodoviária em Macau fornecendo informações de trânsito precisas e em tempo real. Nossa plataforma ajuda os usuários a tomar decisões informadas sobre rotas e horários de viagem.",                           
                    "data-sources-title": "Fontes de Dados",                           
                    "data-sources-desc": "Nossos dados de trânsito são obtidos de múltiplos canais oficiais: ",                           
                    "source-1": "DSAT (Direção de Serviços de Trânsito) - Dados de trânsito oficiais",                           
                    "source-2": "API do Google Maps - Relatórios de fluxo de trânsito e incidentes",                           
                    "source-3": "Câmaras de trânsito ao vivo operadas pela DSAT",                           
                    "source-4": "Relatórios comunitários de nossos usuários",                           
                    "features-title": "Recursos",                           
                    "feature-1": "Visualização de condições de trânsito em tempo real",                           
                    "feature-2": "Tempos de espera estimados para travessias fronteiriças",                           
                    "feature-3": "Feeds de câmaras de trânsito ao vivo",                           
                    "feature-4": "Chat comunitário para atualizações em tempo real",                           
                    "feature-5": "Aplicativo móvel para atualizações de trânsito em movimento",                           
                    "feature-6": "Análise de padrões históricos de trânsito",                           
                    "mobile-app-title": "Receba Atualizações de Trânsito em Movimento",                           
                    "mobile-app-desc": "Baixe nosso aplicativo móvel para alertas de trânsito e assistência de navegação",                           
                    "feature-alerts": "Alertas Instantâneos",                           
                    "feature-routing": "Roteamento Inteligente",                           
                    "feature-history": "Histórico de Trânsito",                           
                    "feature-maps": "Mapas Offline",                      
                    // Camera titles
                    "camera-title-1": "Túnel da Penha em direção ao Largo do Governador Vasco Rocha Vieira (Reservatório)",                           
                    "camera-title-2": "Túnel da Penha em direção à Rua do Campo",                           
                    "camera-title-3": "Mercado da Rua do Aljube",                           
                    "camera-title-4": "Interseção da Avenida do Conselheiro Borja e Rua do Campo",                           
                    "camera-title-5": "Avenida do Conselheiro Borja",                           
                    "camera-title-6": "Avenida de Venceslau de Morais",                           
                    "camera-title-7": "Porto Interior",                           
                    "camera-title-8": "Rua Nova da Areia Preta",                           
                    "camera-title-9": "Praça de Tap Seac",                           
                    "camera-title-10": "Praça do Vasco Rocha Vieira",                           
                    "camera-title-11": "Centro de Doação de Sangue",                           
                    "camera-title-12": "Praça da Nave Desportiva",                           
                    "camera-title-13": "Praça de Ferreira do Amaral",                           
                    "camera-title-14": "Interseção da Avenida do Infante D. Henrique e Avenida do Dr. Rodrigo Rodrigues",                           
                    "camera-title-15": "Interseção da Rua dos Mercadores / Avenida da Praia Grande",                           
                    "camera-title-16": "Rua dos Mercadores",                           
                    "camera-title-17": "Jardim Haiwan",                           
                    "camera-title-18": "Aeroporto Internacional de Macau",                           
                    "camera-title-19": "Interseção Circular da Estrada do Istmo",                           
                    "camera-title-20": "Faixa de Cotai",                           
                    "camera-title-21": "Faixa de Cotai 2 / Estrada do Istmo",                           
                    "camera-title-22": "Avenida da Amizade",                           
                    "camera-title-23": "Ponte da Amizade perto da Interseção da Entrada da Baía Norte",                           
                    "camera-title-24": "Ponte da Amizade em direção a Taipa",                           
                    "camera-title-25": "Ponte da Amizade em direção a Macau",                           
                    "camera-title-26": "Ponte de Sai Van em direção a Macau",                           
                    "camera-title-27": "Ponte de Sai Van em direção a Taipa (Alto)",                           
                    "camera-title-28": "Ponte de Sai Van em direção a Macau (Alto)",                           
                    "camera-title-29": "Entrada da Ponte de Macau (Macau)",                           
                    "camera-title-30": "Ponte de Macau em direção a Taipa",                           
                    "camera-title-31": "Ponte de Macau em direção a Macau",                           
                    "camera-title-32": "Túnel da Portas do Cerco",                           
                    "camera-title-33": "Avenida da Portas do Cerco",                           
                    "camera-title-34": "Porto Qingmao (A)",                           
                    "camera-title-35": "Porto Qingmao (B)",                           
                    "camera-title-36": "Terminal de Ferry do Porto Exterior (A)",                           
                    "camera-title-37": "Terminal de Ferry do Porto Exterior (B)",                           
                    "camera-title-38": "Porto de Hengqin (A)",                           
                    "camera-title-39": "Porto de Hengqin (B)",                           
                    "camera-title-40": "Porto de Hengqin (C)",                           
                    "camera-title-41": "Porto de Hengqin (D)",                           
                    "camera-title-42": "Ponte Hong Kong-Zhuhai-Macau para Zhuhai",                           
                    "camera-title-43": "Ponte Hong Kong-Zhuhai-Macau para Macau",                           
                    "camera-title-44": "Ponte Hong Kong-Zhuhai-Macau para Plataforma de Entrega de Passageiros",                           
                    "camera-title-45": "Ponte Hong Kong-Zhuhai-Macau (Entrada Macau)", 
                    // Weather translations
                    "weather-title": "Informações Meteorológicas", 
                    "current-weather-title": "Clima Atual", 
                    "warning-title": "Avisos Meteorológicos",
                    "weather-page-title": "Meteorologia SMG",
                    "weather-page-desc": "Avisos e informação diária via RSS do Instituto Meteorológico e Geofísico (SMG) em rss.smg.gov.mo.",
                    "alerts-title-text": "Avisos meteorológicos",
                    "report-title-text": "Boletim meteorológico",
                    "forecast-title-text": "Previsão do tempo",
                    "refresh-label": "Atualizar feeds"
                },                           
                ja: {
                    "header-title": "マカオ交通モニター",                           
                    "welcome-message": "こんにちは！当サイトへようこそ！",                           
                    "header-subtitle": "マカオの主要道路と国境横断地点のリアルタイム交通状況と待ち時間",                           
                    "nav-dashboard": "ダッシュボード",                           
                    "nav-cameras": "ライブカメラ",                           
                    "nav-news": "ニュース",                
                    "nav-weather": "天気",
                    "nav-chat": "コミュニティチャット",                           
                    "nav-about": "概要",                           
                    "map-instruction": "ドラッグして地図を操作",                           
                    "traffic-overview": "交通概況",                           
                    "current-time-label": "現在時刻：",                           
                    "overall-traffic": "全体の交通状況",                           
                    "traffic-status-value": "軽度",                           
                    "average-delay-label": "平均遅延",                           
                    "crossing-duration": "推定通過時間",                           
                    "friendship-bridge": "友誼大橋",                           
                    "sai-van-bridge": "西湾大橋",                           
                    "horta-costa": "ホテラ・エ・コスタ大通り",                           
                    "san-ma-lou": "新馬路",                           
                    "praca-amaral": "アマラル広場",                           
                    "portas-cerco": "关闸边检大楼",                           
                    "cotai-strip": "コータイストリップ",                           
                    "median-traffic-label": "中央値交通時間：",                           
                    "traffic-legend-title": "交通凡例",                           
                    "severe-traffic": "深刻な交通（40分以上遅延）",                           
                    "heavy-traffic": "重い交通（20-40分遅延）",                           
                    "moderate-traffic": "中程度の交通（10-20分遅延）",                           
                    "light-traffic": "軽度の交通（10分未満遅延）",                           
                    "closed-traffic": "閉鎖/遮断",                           
                    "website-info-title": "ウェブサイト交通情報",                           
                    "website-info-desc": "このリアルタイム交通モニターは、マカオの主要道路と国境横断地点の推定待ち時間を提供します。",                           
                    "info-point-1": "時間は現在の交通状況に基づいて30秒ごとに更新されます",                           
                    "info-point-2": "色は交通の深刻度を示します",                           
                    "info-point-3": "データはデモンストレーション目的でシミュレートされています",                           
                    "info-point-4": "実際の旅行時間は異なる場合があります",                           
                    "travel-tips-title": "旅行のヒント",                           
                    "tip-1": "可能であればラッシュアワー（午前7時から9時30分、午後5時から7時）を避けてください",                           
                    "tip-2": "マカオの一般道路の最高速度は50km/h、橋は80km/hであることに注意してください。",                           
                    "tip-3": "交通混雑時に公共交通機関の利用を検討してください",                           
                    "tip-4": "旅行前に国境横断の時間を確認してください",                           
                    "tip-5": "重要な予定には余裕を持って時間を計画してください",                           
                    "tip-6": "主要道路が重い混雑を示している場合は代替ルートを使用してください",                           
                    "live-cameras-title": "ライブ交通カメラ",                           
                    "tab-macau-city": "澳門市區",                          
                    "tab-taipa": "氹仔",                          
                    "tab-bridges": "跨海大橋",                          
                    "tab-border": "口岸",                          
                    "community-chat-title": "コミュニティチャット",                           
                    "community-guidelines-title": "コミュニティガイドライン",                           
                    "community-guidelines-desc": "マカオ交通モニターのコミュニティチャットへようこそ！このスペースは、マカオの住民や訪問者とリアルタイムの交通更新、道路状況、旅行のヒントを共有するためのものです。",                           
                    "guidelines-intro": "コミュニティを助け合い、敬意のある場所にするために、以下のガイドラインに従ってください：",                           
                    "guideline-1": "正確で最新の交通情報を共有してください",                           
                    "guideline-2": "すべてのユーザーに対して敬意と礼儀を払ってください",                           
                    "guideline-3": "道路の事件、事故、工事を報告してください",                           
                    "guideline-4": "交通パターンや道路状況について質問してください",                           
                    "guideline-5": "スパム、広告、話題外の議論を避けてください",                           
                    "guideline-6": "適切な言葉遣いをしてください - 攻撃的な内容は禁止です",                           
                    "moderation-note": "私たちのモデレーターはチャットを監視し、すべての人がポジティブな体験ができるようにしています。これらのガイドラインに違反すると、チャットから一時的または永続的に禁止されることがあります。",                           
                    "about-title": "マカオ交通モニターについて",                           
                    "about-desc": "マカオ交通モニターは、住民と訪問者がマカオの道路網を効率的にナビゲートきように設計されたリアルタイム交通情報プラットフォームです。当社のサービスは、最新の交通状況、推定通過時間、主要道路と国境横断地点のライブカメラフィードを提供します。",                           
                    "mission-title": "私たちの使命",                           
                    "mission-desc": "正確でリアルタイムの交通情報を提供することで、マカオの旅行時間を短縮し、道路の安全性を向上させることを目指しています。当社のプラットフォームは、ユーザーが旅行ルートとタイミングについて情報に基づいた決定をできるようにします。",                           
                    "data-sources-title": "データソース",                           
                    "data-sources-desc": "私たちの交通データは複数の公式チャネルから取得されます：",                           
                    "source-1": "交通事務局 - 公式交通データ",                           
                    "source-2": "Google Maps API - 交通流と事件報告",                           
                    "source-3": "交通事務局が運営するライブ交通カメラ",                           
                    "source-4": "私たちのユーザーからのコミュニティ報告",                           
                    "features-title": "機能",                           
                    "feature-1": "リアルタイム交通状況の可視化",                           
                    "feature-2": "国境横断の推定待ち時間",                           
                    "feature-3": "ライブ交通カメラフィード",                           
                    "feature-4": "リアルタイム更新のためのコミュニティチャット",                           
                    "feature-5": "移動中の交通更新のためのモバイルアプリ",                           
                    "feature-6": "歴史的交通パターン分析",                           
                    "mobile-app-title": "外出先で交通情報を取得",                           
                    "mobile-app-desc": "交通アラートとナビゲーション支援のためのモバイルアプリをダウンロード",                           
                    "feature-alerts": "即時アラート",                           
                    "feature-routing": "スマートルーティング",                           
                    "feature-history": "交通履歴",                           
                    "feature-maps": "オフライン地図",                      
                    // Camera titles
                    "camera-title-1": "ペニャトンネル ヴァスコ・ロチャ・ヴィエイラ知事広場方面（貯水池）",                           
                    "camera-title-2": "ペニャトンネル ルア・ド・カンプ方面",                           
                    "camera-title-3": "アルジュベ通り市場",                           
                    "camera-title-4": "コンセレイロ・ボルジャ大通りとルア・ド・カンプの交差点",                           
                    "camera-title-5": "コンセレイロ・ボルジャ大通り",                           
                    "camera-title-6": "ベンセスラウ・デ・モライス大通り",                           
                    "camera-title-7": "内港",                           
                    "camera-title-8": "アレイア・プレタ新街",                           
                    "camera-title-9": "タップ・セアック広場",                           
                    "camera-title-10": "ヴァスコ・ロチャ・ヴィエイラ広場",                           
                    "camera-title-11": "献血センター",                           
                    "camera-title-12": "ナヴェ・デスポーティヴァ広場",                           
                    "camera-title-13": "フェレイラ・ド・アマラル広場",                           
                    "camera-title-14": "インファンテ・ドン・エンリケ大通りとロドリゴ・ロドリゲス医師大通りの交差点",                           
                    "camera-title-15": "ルア・ドス・メルカドーレスとプラヤ・グランデ大通りの交差点",                           
                    "camera-title-16": "ルア・ドス・メルカドーレス",                           
                    "camera-title-17": "ハイワン・ガーデン",                           
                    "camera-title-18": "マカオ国際空港",                           
                    "camera-title-19": "イストモ環状道路交差点",                           
                    "camera-title-20": "コータイ・ストリップ",                           
                    "camera-title-21": "コータイ・ストリップ2 / イストモ道路",                           
                    "camera-title-22": "アミザデ大通り",                           
                    "camera-title-23": "北湾入口交差点付近のアミザデ橋",                           
                    "camera-title-24": "タージャ方面のアミザデ橋",                           
                    "camera-title-25": "マカオ方面のアミザデ橋",                           
                    "camera-title-26": "マカオ方面のサイヴァン橋",                           
                    "camera-title-27": "タージャ方面のサイヴァン橋（高所）",                           
                    "camera-title-28": "マカオ方面のサイヴァン橋（高所）",                           
                    "camera-title-29": "マカオ橋入口（マカオ）",                           
                    "camera-title-30": "タージャ方面のマカオ橋",                           
                    "camera-title-31": "マカオ方面のマカオ橋",                           
                    "camera-title-32": "ポルタス・ド・セルコトンネル",                           
                    "camera-title-33": "ポルタス・ド・セルコ大通り",                           
                    "camera-title-34": "青茂ポート（A）",                           
                    "camera-title-35": "青茂ポート（B）",                           
                    "camera-title-36": "外港フェリー乗り場（A）",                           
                    "camera-title-37": "外港フェリー乗り場（B）",                           
                    "camera-title-38": "横琴ポート（A）",                           
                    "camera-title-39": "横琴ポート（B）",                           
                    "camera-title-40": "横琴ポート（C）",                           
                    "camera-title-41": "横琴ポート（D）",                           
                    "camera-title-42": "香港・珠海・マカオ橋 珠海行き",                           
                    "camera-title-43": "香港・珠海・マカオ橋 マカオ行き",                           
                    "camera-title-44": "香港・珠海・マカオ橋 送客プラットフォーム行き",                           
                    "camera-title-45": "香港・珠海・マカオ橋（マカオ入国）", 
                    // Weather translations
                    "weather-title": "天気情報", 
                    "current-weather-title": "現在の天気", 
                    "warning-title": "天気警報",
                    "weather-page-title": "SMG天気情報",
                    "weather-page-desc": "rss.smg.gov.mo の気象局公式RSSによる警報と日々の天気。",
                    "alerts-title-text": "天気警報",
                    "report-title-text": "天気報告",
                    "forecast-title-text": "天気予報",
                    "refresh-label": "更新"
                }
            };
            
            // Function to change language
            function changeLanguage(lang) {
                // Update current language display
                const langNames = {
                    'en': 'English',                           
                    'zh': '繁體中文',                           
                    'pt': 'Português',                           
                    'ja': '日本語'
                };
                if (currentLangSpan) {
                    currentLangSpan.textContent = langNames[lang];
                }
                
                // Update all translatable elements
                const elements = document.querySelectorAll('[id^="header-title"], [id^="welcome-message"], [id^="header-subtitle"], [id^="nav-"], [id^="map-instruction"], [id^="traffic-overview"], [id^="current-time-label"], [id^="overall-traffic"], [id^="traffic-status-value"], [id^="average-delay-label"], [id^="crossing-duration"], [id^="friendship-bridge"], [id^="sai-van-bridge"], [id^="horta-costa"], [id^="san-ma-lou"], [id^="praca-amaral"], [id^="portas-cerco"], [id^="cotai-strip"], [id^="median-traffic-label"], [id^="traffic-legend-title"], [id^="severe-traffic"], [id^="heavy-traffic"], [id^="moderate-traffic"], [id^="light-traffic"], [id^="closed-traffic"], [id^="website-info-title"], [id^="website-info-desc"], [id^="info-point-"], [id^="travel-tips-title"], [id^="tip-"], [id^="live-cameras-title"], [id^="tab-"], [id^="community-chat-title"], [id^="community-guidelines-title"], [id^="community-guidelines-desc"], [id^="guidelines-intro"], [id^="guideline-"], [id^="moderation-note"], [id^="about-title"], [id^="about-desc"], [id^="mission-title"], [id^="mission-desc"], [id^="data-sources-title"], [id^="data-sources-desc"], [id^="source-"], [id^="features-title"], [id^="feature-"], [id^="mobile-app-title"], [id^="mobile-app-desc"], [id^="feature-alerts"], [id^="feature-routing"], [id^="feature-history"], [id^="feature-maps"], [id^="camera-title-"], [id^="weather-title"], [id^="current-weather-title"], [id^="warning-title"], #weather-page-title, #weather-page-desc, #alerts-title-text, #report-title-text, #forecast-title-text, #refresh-label');
                
                elements.forEach(element => {
                    const id = element.id;
                    if (translations[lang][id]) {
                        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                            element.placeholder = translations[lang][id];
                        } else {
                            element.textContent = translations[lang][id];
                        }
                    }
                });
                
                // Store selected language in localStorage
                localStorage.setItem('selectedLanguage', lang);
                
                // Reload cameras if on cameras page to update camera titles
                if (currentPage === 'cameras') {
                    loadCamerasFromFirebase();
                }
            }
            
            // Load saved language preference or default to English
            const savedLang = localStorage.getItem('selectedLanguage') || 'en';
            changeLanguage(savedLang);
            
            // News popup (dashboard only)
            const newsPopup = document.getElementById('news-popup');
            const closePopup = document.getElementById('close-news-popup');
            const closeSpan = document.querySelector('.news-close');
            
            if (newsPopup && closePopup && closeSpan && currentPage === 'dashboard') {
                if (!sessionStorage.getItem('newsPopupShown')) {
                    setTimeout(showNewsPopup, 2000);
                }
                
                closePopup.addEventListener('click', hideNewsPopup);
                closeSpan.addEventListener('click', hideNewsPopup);
                
                function showNewsPopup() {
                    const newsRef = ref(database, 'news');
                    onValue(newsRef, (snapshot) => {
                        const news = snapshot.val();
                        if (news) {
                            const latestNews = Object.values(news)[0];
                            const popupContent = document.getElementById('popup-news-content');
                            if (popupContent) {
                                popupContent.innerHTML = `
                                    <h3>${latestNews.title}</h3>
                                    <p><strong>Date: </strong> ${latestNews.date}</p>
                                    <p>${latestNews.content}</p>
                                `;
                            }
                            newsPopup.style.display = 'block';
                            sessionStorage.setItem('newsPopupShown', 'true');
                        }
                    }, { onlyOnce: true });
                }
                
                function hideNewsPopup() {
                    newsPopup.style.display = 'none';
                }
                
                window.addEventListener('click', function(event) {
                    if (event.target === newsPopup) {
                        hideNewsPopup();
                    }
                });
            }
            
            // Store camera data for traffic time calculation
            let cameraData = {};
            
            // Function to load camera data from Firebase
            function loadCameraData() {
                const camerasRef = ref(database, 'cameras');
                onValue(camerasRef, (snapshot) => {
                    const cameras = snapshot.val();
                    if (cameras) {
                        cameraData = cameras;
                    }
                }, { onlyOnce: true });
            }
            
            // Initialize camera data
            loadCameraData();
            
            // Updated traffic data with new time ranges
            const trafficData = {
                "friendship": [
                    { start: 7, end: 9.5, min: 4, max: 8 },                                       // 7:00 to 9:30 = 4-8 mins
                    { start: 9, end: 15, min: 6, max: 7 },                                       // 9:00 - 15:00 = 5-10 mins
                    { start: 15.01, end: 20, min: 8, max: 10 },                                   // 15:01 - 20:00 - 8-10 mins
                    { start: 19, end: 6.99, min: 2, max: 4 }    // 19:00 to 6:59 - 4-5 mins
                ],                                   
                "sai-van": [
                    { start: 7, end: 9.5, min: 3, max: 5 },                                       // 7:00 to 9:30 = 3-5 mins
                    { start: 9.51, end: 15, min: 3, max: 5 },                                    // 9:31 - 15:00 = 5-10 mins
                    { start: 15.01, end: 18.99, min: 3, max: 5 },                                   // 15:01 - 18:59 - 6-15 mins
                    { start: 19, end: 6.99, min: 2, max: 4 }   // 19:00 to 6:59 - 4-10 mins
                ],                                   
                "horta": [
                    { start: 7, end: 9.99, min: 2, max: 7 },                                     // 7:00 to 9:59 = 8-18 mins
                    { start: 10, end: 15, min: 5, max: 7 },                                      // 10:00 - 15:00= 5-10 mins
                    { start: 15.5, end: 18.99, min: 15, max: 20 },                                   // 15:30-18:59 - 15-30 mins
                    { start: 19, end: 6.99, min: 2, max: 4 }    // 19:00 to 6:59 - 4-8 mins
                ],                                   
                "san-ma": [
                    { start: 7, end: 8.99, min: 6, max: 10 },                                     // 7:00 to 8:59 = 6-10 mins
                    { start: 9, end: 15, min: 1, max: 10 },                                       // 9:00- 15:00 = 1-10 mins
                    { start: 15.01, end: 18.99, min: 10, max: 20 },                                   // 15:01-18:59 - 10-20 mins
                    { start: 19, end: 6.99, min: 2, max: 4 }   // 19:00to 6:59 - 4-10 mins
                ],                                   
                "praca": [
                    { start: 7, end: 8.99, min: 3, max: 7 },                                     // 7:00 to 8:59 =6-15mins
                    { start: 9, end: 15, min: 3, max: 7 },                                       // 9:00 - 15:00 = 6-15 mins
                    { start: 15.01, end: 18.99, min: 3, max: 5 },                                   // 15:01 - 18:59 - 6-15mins
                    { start: 19, end: 6.99, min: 2, max: 4 }   // 19:00 to 6:59 - 6-15 mins
                ],                                   
                "portas": [
                    { start: 7, end: 8.99, min: 5, max: 10 },                                     // 7:00 to 8:59 = 5 - 10 mins
                    { start: 9, end: 15, min: 5, max: 8 },                                      // 9:00- 15:00 = 10-15 mins
                    { start: 15.01, end: 20, min: 10, max: 25 },                                   // 15:01 - 20:00 = 10-25 min
                    { start: 20.01, end: 23, min: 5, max: 13 },                                   // 20:01 - 23:00 = 10-15 mins
                    { start: 23.01, end: 6.99, min: 1, max: 2 } // 23:01-6:59= 1-3 mins
                ],                                   
                "cotai": [
                    { start: 7, end: 8.99, min: 3, max: 10 },                                     // 7:00 to 8:59 =3-10mins
                    { start: 9, end: 15, min: 3, max: 7 },                                       // 9:00 - 15:00 = 3-10 mins
                    { start: 15.01, end: 18.99, min: 10, max: 15 },                                   // 15:01 - 18:59 - 10-15mins
                    { start: 19, end: 6.99, min: 2, max: 4 }   // 19:00 to 6:59 - 6-10 mins
                ]
            };

            // Initialize current times for each location
            const currentTimes = {};
            let totalDelay = 0;
            let locationCount = 0;
            let lastUpdateTime = 0;

            // Function to get current time in decimal format (e.g., 14.5 for 2:30 PM)
            function getCurrentTimeDecimal() {
                const now = new Date();
                return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
            }

            // Function to format time as HH:MM:SS
            function formatTime(date) {
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                return `${hours}:${minutes}:${seconds}`;
            }

            // Function to get traffic time for a location based on current time and camera data
            function getTrafficTime(location) {
                const currentTime = getCurrentTimeDecimal();
                const data = trafficData[location];
                
                // Find the appropriate time range
                let baseTime = 10; // default base time
                for (const range of data) {
                    // Handle overnight ranges (e.g., 19:00 to 06:59)
                    if (range.start > range.end) {
                        if (currentTime >= range.start || currentTime <= range.end) {
                            baseTime = Math.floor((range.min + range.max) / 2);
                            break;
                        }
                    } else {
                        if (currentTime >= range.start && currentTime <= range.end) {
                            baseTime = Math.floor((range.min + range.max) / 2);
                            break;
                        }
                    }
                }
                
                // Calculate traffic time based on camera data
                let cameraCount = 0;
                Object.keys(cameraData).forEach(cameraId => {
                    const camera = cameraData[cameraId];
                    if (camera.location === location && camera.carCount !== undefined) {
                        cameraCount += camera.carCount;
                    }
                });
                
                // Calculate traffic time: base time + (car count / 10) minutes
                // Minimum of 1 minute, maximum of 60 minutes
                const calculatedTime = Math.max(1, Math.min(60, baseTime + Math.floor(cameraCount / 10)));
                return calculatedTime;
            }

            // Function to update all traffic times
            function updateTrafficTimes() {
                const clockEl = document.getElementById('current-time-display');
                if (!clockEl) return;
                const now = new Date();
                clockEl.textContent = formatTime(now);
                
                // Only update traffic times every 30 seconds to prevent too frequent changes
                const currentTime = now.getTime();
                const shouldUpdateTraffic = currentTime - lastUpdateTime > 30000;
                
                if (shouldUpdateTraffic) {
                    lastUpdateTime = currentTime;
                    
                    totalDelay = 0;
                    locationCount = 0;
                    const timesArray = [];
                    
                    for (const location in trafficData) {
                        const timeElement = document.getElementById(`${location}-time`);
                        if (timeElement) {
                            const newTime = getTrafficTime(location);
                            currentTimes[location] = newTime;
                            timesArray.push(newTime);
                            
                            timeElement.textContent = `${newTime} min`;
                            
                            // Update color class based on time
                            timeElement.className = 'time-display';
                            if (newTime < 10) {
                                timeElement.classList.add('time-low');
                            } else if (newTime < 20) {
                                timeElement.classList.add('time-medium');
                            } else if (newTime < 40) {
                                timeElement.classList.add('time-high');
                            } else {
                                timeElement.classList.add('time-severe');
                            }
                            
                            totalDelay += newTime;
                            locationCount++;
                        }
                    }
                    
                    // Calculate and display actual median delay
                    if (locationCount === 7) {
                        timesArray.sort((a, b) => a - b);
                        const medianIndex = Math.floor(timesArray.length / 2);
                        const medianDelay = timesArray.length % 2 === 0 
                            ? Math.round((timesArray[medianIndex - 1] + timesArray[medianIndex]) / 2)
                            : timesArray[medianIndex];
                        
                        const avgEl = document.getElementById('average-delay');
                        if (avgEl) avgEl.textContent = `${medianDelay} min`;
                    }
                }
            }

            // Fixed IP tracking functions
            async function checkIPBanStatus() {
                try {
                    if (!ipCheckingMessage || !bannedOverlay) return;
                    ipCheckingMessage.style.display = 'flex';
                    
                    // Get user's IP address
                    const ipResponse = await fetch('https://api.ipify.org?format=json');
                    const ipData = await ipResponse.json();
                    const userIP = ipData.ip;
                    
                    // Check if IP is banned
                    const bannedRef = ref(database, 'banned_ips');
                    onValue(bannedRef, (snapshot) => {
                        // Log the visit (always log to all_visits)
                        logVisit(userIP);
                        
                        if (snapshot.exists()) {
                            const bannedIPs = snapshot.val();
                            let isBanned = false;
                            let banInfo = null;
                            
                            // Check each ban record
                            for (const banId in bannedIPs) {
                                if (bannedIPs[banId].ip === userIP) {
                                    isBanned = true;
                                    banInfo = {
                                        banId: banId,           
                                        reason: bannedIPs[banId].reason || 'No reason specified',           
                                        timestamp: bannedIPs[banId].timestamp
                                    };
                                    break;
                                }
                            }
                            
                            if (isBanned) {
                                // Show banned overlay instead of hiding content
                                bannedOverlay.style.display = 'flex';
                                ipCheckingMessage.style.display = 'none';
                                
                                // Display ban details
                                banDetailsOverlay.innerHTML = `
                                    <strong>BAN ID: </strong> ${banInfo.banId}<br>
                                    <strong>Reason: </strong> ${banInfo.reason}<br>
                                    <strong>Timestamp: </strong> ${new Date(banInfo.timestamp).toLocaleString()}
                                `;
                                
                                logBannedAccess(userIP, banInfo.banId);
                                return;
                            }
                        }
                        
                        // IP not banned - hide checking message and show content
                        ipCheckingMessage.style.display = 'none';
                    }, { onlyOnce: true });
                } catch (error) {
                    console.error('Error checking IP ban status: ', error);
                    // Hide checking message even on error to prevent blocking UI
                    ipCheckingMessage.style.display = 'none';
                }
            }
            
            // Fixed visit logging function with generated title
            function logVisit(userIP) {
                try {
                    // Generate a title with date and time
                    const now = new Date();
                    const title = `Visit on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
                    
                    const visitData = {
                        title: title,           // Generated title with date/time
                        ip: userIP,           
                        timestamp: new Date().toISOString(),           
                        userAgent: navigator.userAgent,           
                        page: window.location.href
                    };
                    
                    // Log to Firebase under 'all_visits'
                    const visitRef = push(ref(database, 'all_visits'));
                    set(visitRef, visitData)
                        .then(() => {
                            console.log('Visit logged successfully with ID: ', visitRef.key);
                        })
                        .catch(error => {
                            console.error('Error logging visit: ', error);
                        });
                } catch (error) {
                    console.error('Error in logVisit: ', error);
                }
            }
            
            // Fixed banned access logging
            function logBannedAccess(ip, banId) {
                const logData = {
                    ip: ip,           
                    timestamp: new Date().toISOString(),           
                    userAgent: navigator.userAgent,           
                    page: window.location.href
                };
                
                const logRef = push(ref(database, 'banned_access_logs'));
                set(logRef, logData).catch(error => {
                    console.error('Error logging banned access: ', error);
                });
            }
            
            // Existing camera loading functions
            function loadCamerasFromFirebase() {
                if (!camerasLoading) return;
                camerasLoading.style.display = 'flex';
                
                document.querySelectorAll('.camera-content').forEach(content => {
                    content.innerHTML = ''; // Clear existing content
                });
                
                const camerasRef = ref(database, 'cameras');
                onValue(camerasRef, (snapshot) => {
                    const cameras = snapshot.val();
                    if (cameras) {
                        displayCameras(cameras);
                    } else {
                        displayNoCamerasMessage();
                    }
                    camerasLoading.style.display = 'none';
                }, { onlyOnce: true });
            }

            function displayCameras(cameras) {
                const currentLang = localStorage.getItem('selectedLanguage') || 'en';

                // Convert and sort cameras by position
                const camerasArray = Object.keys(cameras).map(cameraId => ({
                    id: cameraId,               
                    ...cameras[cameraId]
                }));
                
                camerasArray.sort((a, b) => (a.position || 0) - (b.position || 0)); // Sort by position

                const groupedCameras = {
                    'macau-city': [],               
                    'taipa': [],               
                    'bridges': [],               
                    'border': []
                };

                camerasArray.forEach(camera => {
                    groupedCameras[camera.location].push(camera);
                });

                Object.keys(groupedCameras).forEach(location => {
                    const container = document.getElementById(`${location}-content`);
                    const camerasList = groupedCameras[location];

                    if (camerasList.length === 0) {
                        container.innerHTML = '<p>No cameras available for this location.</p>';
                        return;
                    }

                    let html = '<div class="camera-grid">';
                    camerasList.forEach(camera => {
                        let cameraTitle = camera.titles.en; // default to English
                        if (currentLang === 'zh' && camera.titles.zh) {
                            cameraTitle = camera.titles.zh;
                        } else if (currentLang === 'pt' && camera.titles.pt) {
                            cameraTitle = camera.titles.pt;
                        } else if (currentLang === 'ja' && camera.titles.ja) {
                            cameraTitle = camera.titles.ja;
                        }

                        html += `
                            <div class="camera-item">
                                <div class="camera-title">${cameraTitle}</div>
                                <div class="camera-container">
                                    <iframe src="${camera.embedUrl}" allowfullscreen></iframe>
                                </div>
                            </div>
                        `;
                    });

                    html += '</div>';
                    container.innerHTML = html;
                });
            }
            
            // Display message when no cameras are found
            function displayNoCamerasMessage() {
                document.querySelectorAll('.camera-content').forEach(content => {
                    content.innerHTML = '<p style="text-align: center; padding: 20px;">No cameras available at this time.</p>';
                });
            }
            
            // Display error message
            function displayErrorMessage() {
                document.querySelectorAll('.camera-content').forEach(content => {
                    content.innerHTML = '<p style="text-align: center; padding: 20px; color: #ff4d4d;">Error loading cameras. Please try again later.</p>';
                });
            }
            
            // News functionality
            function loadNewsFromFirebase() {
                const newsRef = ref(database, 'news');
                onValue(newsRef, (snapshot) => {
                    const news = snapshot.val();
                    displayNews(news);
                }, { onlyOnce: true });
            }

            function displayNews(newsData) {
                const container = document.getElementById('news-container');
                if (!container) return;
                
                if (!newsData) {
                    container.innerHTML = '<p>No news available at this time.</p>';
                    return;
                }
                
                // Convert to array and process
                const newsArray = Object.keys(newsData).map(key => ({
                    id: key,                
                    ...newsData[key]
                }));
                
                // Sort news: important/urgent first, then by date (newest first)
                newsArray.sort((a, b) => {
                    // Check for important/urgent flags
                    const aIsImportant = a.important || a.urgent;
                    const bIsImportant = b.important || b.urgent;
                    
                    // Important news comes first
                    if (aIsImportant && !bIsImportant) return -1;
                    if (!aIsImportant && bIsImportant) return 1;
                    
                    // Both important or both not important - sort by date
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    
                    // Handle invalid dates
                    if (isNaN(dateA) && isNaN(dateB)) return 0;
                    if (isNaN(dateA)) return 1;
                    if (isNaN(dateB)) return -1;
                    
                    // Sort by date descending (newest first)
                    return dateB - dateA;
                });
                
                let html = '';
                newsArray.forEach(news => {
                    // Format date properly
                    let displayDate = 'Unknown date';
                    if (news.date) {
                        try {
                            const dateObj = new Date(news.date);
                            if (!isNaN(dateObj.getTime())) {
                                displayDate = dateObj.toLocaleDateString('en-US', {
                                    year: 'numeric',                
                                    month: 'long',                
                                    day: 'numeric'
                                });
                            }
                        } catch (e) {
                            console.warn('Invalid date format: ', news.date);
                        }
                    }
                    
                    html += `
                        <div class="news-item">
                            <h3>
                                <i class="fas fa-newspaper"></i> 
                                ${news.title}
                                ${(news.important || news.urgent) ? '<span class="urgent-tag">URGENT</span>' : ''}
                            </h3>
                            <span class="news-date"><i class="fas fa-calendar"></i> ${displayDate}</span>
                            <div class="news-content">${news.content}</div>
                        </div>
                    `;
                });
                
                container.innerHTML = html;
            }

            // Chat System Functions
            function initChat() {
                if (!authContainer || !signupContainer || !loginForm || !signupForm || !showSignup || !showLogin || !sendMessageBtn || !messageInput) return;
                // Show signup form
                showSignup.addEventListener('click', () => {
                    authContainer.style.display = 'none';
                    signupContainer.style.display = 'flex';
                });
                
                // Show login form
                showLogin.addEventListener('click', () => {
                    signupContainer.style.display = 'none';
                    authContainer.style.display = 'flex';
                });
                
                // Signup form submission
                signupForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const username = document.getElementById('signupUsername').value;
                    const password = document.getElementById('signupPassword').value;
                    const email = document.getElementById('signupEmail').value;
                    
                    // Create user in Firebase Auth
                    createUserWithEmailAndPassword(auth, email, password)
                        .then((userCredential) => {
                            // Save additional user data to database
                            const userId = userCredential.user.uid;
                            const userData = {
                                username: username,      
                                email: email,      
                                role: 'member',      
                                createdAt: new Date().toISOString()
                            };
                            
                            return set(ref(database, 'users/' + userId), userData);
                        })
                        .then(() => {
                            alert('Account created successfully! Please login.');
                            signupContainer.style.display = 'none';
                            authContainer.style.display = 'flex';
                        })
                        .catch((error) => {
                            alert('Error: ' + error.message);
                        });
                });
                
                // Login form submission
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const email = document.getElementById('loginUsername').value;
                    const password = document.getElementById('loginPassword').value;
                    
                    // For demo purposes, we'll allow login with username or email
                    // In a real app, you'd need to store usernames separately
                    signInWithEmailAndPassword(auth, email.includes('@') ? email : email + '@example.com', password)
                        .then((userCredential) => {
                            // Get user data from database
                            const userId = userCredential.user.uid;
                            return onValue(ref(database, 'users/' + userId), (snapshot) => {
                                if (snapshot.exists()) {
                                    currentUser = snapshot.val();
                                    userRole = currentUser.role || 'member';
                                    displayUserInfo();
                                    authContainer.style.display = 'none';
                                    loadChatMessages();
                                    setupModerationPanel();
                                } else {
                                    alert('User data not found');
                                    signOut(auth);
                                }
                            }, { onlyOnce: true });
                        })
                        .catch((error) => {
                            alert('Login error: ' + error.message);
                        });
                });
                
                // Send message
                sendMessageBtn.addEventListener('click', sendMessage);
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        sendMessage();
                    }
                });
            }
            
            // Display user info
            function displayUserInfo() {
                if (!userInfo || !authContainer) return;
                userInfo.innerHTML = `
                    <span>Welcome, ${currentUser.username}</span>
                    <span class="user-role role-${userRole}">${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
                    <button class="logout-btn" id="logoutBtn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                `;
                
                document.getElementById('logoutBtn').addEventListener('click', () => {
                    signOut(auth);
                    currentUser = null;
                    userRole = 'member';
                    authContainer.style.display = 'flex';
                    userInfo.innerHTML = '';
                    moderationPanel.classList.remove('active');
                });
            }
            
            // Setup moderation panel for admins/moderators
            function setupModerationPanel() {
                if (userRole === 'admin' || userRole === 'moderator') {
                    moderationPanel.classList.add('active');
                    
                    banUserBtn.addEventListener('click', () => {
                        const username = document.getElementById('banUserInput').value;
                        const duration = document.getElementById('banDuration').value;
                        const reason = document.getElementById('banReason').value;
                        
                        if (!username) {
                            alert('Please enter a username to ban');
                            return;
                        }
                        
                        // Find user by username
                        const usersRef = ref(database, 'users');
                        onValue(usersRef, (snapshot) => {
                            if (snapshot.exists()) {
                                const users = snapshot.val();
                                let userId = null;
                                
                                for (const key in users) {
                                    if (users[key].username === username) {
                                        userId = key;
                                        break;
                                    }
                                }
                                
                                if (userId) {
                                    const banData = {
                                        userId: userId,      
                                        username: username,      
                                        bannedBy: currentUser.username,      
                                        reason: reason,      
                                        timestamp: new Date().toISOString(),      
                                        duration: duration
                                    };
                                    
                                    // Add ban record
                                    const banRef = push(ref(database, 'bans'));
                                    return set(banRef, banData)
                                        .then(() => {
                                            // Add system message
                                            const systemMessage = {
                                                type: 'system',      
                                                content: `${username} has been ${duration === 'perm' ? 'permanently' : 'temporarily'} banned by ${currentUser.username}`,      
                                                timestamp: new Date().toISOString()
                                            };
                                            
                                            const chatRef = push(ref(database, 'chat'));
                                            return set(chatRef, systemMessage);
                                        })
                                        .then(() => {
                                            alert('User banned successfully');
                                            document.getElementById('banUserInput').value = '';
                                            document.getElementById('banReason').value = '';
                                        })
                                        .catch((error) => {
                                            alert('Error banning user: ' + error.message);
                                        });
                                } else {
                                    throw new Error('User not found');
                                }
                            } else {
                                throw new Error('No users found');
                            }
                        }, { onlyOnce: true });
                    });
                }
            }
            
            // Load chat messages
            function loadChatMessages() {
                chatMessages.innerHTML = '';
                
                const chatRef = ref(database, 'chat');
                onChildAdded(chatRef, (snapshot) => {
                    const message = snapshot.val();
                    displayMessage(message, snapshot.key);
                });
            }
            
            // Display a message
            function displayMessage(message, messageId) {
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                
                if (message.type === 'system') {
                    messageElement.classList.add('system-message');
                    messageElement.innerHTML = `
                        <div class="message-content">${message.content}</div>
                        <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
                    `;
                } else {
                    // Regular message
                    const messageRole = message.role || 'member';
                    const roleClass = `role-${messageRole}`;
                    
                    messageElement.innerHTML = `
                        <div class="message-header">
                            <div class="message-user">
                                <span class="user-role ${roleClass}">${messageRole.charAt(0).toUpperCase() + messageRole.slice(1)}</span>
                                ${message.username}
                            </div>
                            <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
                        </div>
                        <div class="message-content">${message.content}</div>
                        ${canDeleteMessage(message.username) ? `
                            <div class="message-actions">
                                <button class="action-btn delete-btn" data-id="${messageId}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    `;
                    
                    // Add delete functionality
                    const deleteBtn = messageElement.querySelector('.delete-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', () => {
                            deleteMessage(messageId);
                        });
                    }
                }
                
                chatMessages.appendChild(messageElement);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            // Check if current user can delete a message
            function canDeleteMessage(messageUsername) {
                // Admins and moderators can delete any message
                // Users can delete their own messages
                return userRole === 'admin' || userRole === 'moderator' || 
                       (currentUser && currentUser.username === messageUsername);
            }
            
            // Delete a message
            function deleteMessage(messageId) {
                if (confirm('Are you sure you want to delete this message?')) {
                    remove(ref(database, 'chat/' + messageId))
                        .catch((error) => {
                            alert('Error deleting message: ' + error.message);
                        });
                }
            }
            
            // Send message
            function sendMessage() {
                const content = messageInput.value.trim();
                if (!content) return;
                
                if (!currentUser) {
                    alert('You must be logged in to send messages');
                    return;
                }
                
                // Check if user is banned
                const bansRef = ref(database, 'bans');
                onValue(bansRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const bans = snapshot.val();
                        let isBanned = false;
                        
                        for (const banId in bans) {
                            const ban = bans[banId];
                            // Check if permanent ban or temporary ban still active
                            if (ban.duration === 'perm') {
                                isBanned = true;
                                break;
                            } else if (ban.duration === 'temp') {
                                const banTime = new Date(ban.timestamp).getTime();
                                const now = new Date().getTime();
                                // 24 hours in milliseconds
                                if (now - banTime < 24 * 60 * 60 * 1000) {
                                    isBanned = true;
                                    break;
                                } else {
                                    // Remove expired temp ban
                                    remove(ref(database, 'bans/' + banId));
                                }
                            }
                        }
                        
                        if (isBanned) {
                            alert('You are banned from the chat');
                            return;
                        }
                    }
                    
                    // Send message
                    const messageData = {
                        username: currentUser.username,      
                        role: userRole,      
                        content: content,      
                        timestamp: new Date().toISOString()
                    };
                    
                    const chatRef = push(ref(database, 'chat'));
                    return set(chatRef, messageData);
                }, { onlyOnce: true })
                .then(() => {
                    messageInput.value = '';
                })
                .catch((error) => {
                    alert('Error sending message: ' + error.message);
                });
            }
            
            // Auth state change listener
            onAuthStateChanged(auth, (user) => {
                if (!user) {
                    currentUser = null;
                    userRole = 'member';
                    if (authContainer) authContainer.style.display = 'flex';
                    if (userInfo) userInfo.innerHTML = '';
                    if (moderationPanel) moderationPanel.classList.remove('active');
                }
            });
            
            // Weather — SMG RSS via rss2json (browser-safe; direct RSS is often blocked by CORS)
            function parseActualWeatherHtml(html, titleText) {
                const wrap = document.createElement('div');
                wrap.innerHTML = html;
                const text = wrap.textContent || '';
                let temp = '--';
                let humidity = '--';
                let pressure = null;
                const tZh = text.match(/溫度[：:\s]*([\d.]+)/);
                const tEn = text.match(/Temperature:\s*([\d.]+)/i);
                if (tZh) temp = tZh[1];
                else if (tEn) temp = tEn[1];
                const hZh = text.match(/濕度[：:\s]*([\d.]+)/);
                const hEn = text.match(/Humidity:\s*([\d.]+)/i);
                if (hZh) humidity = hZh[1];
                else if (hEn) humidity = hEn[1];
                const pEn = text.match(/Pressure:\s*([\d.]+)\s*hPa/i);
                if (pEn) pressure = pEn[1];
                const img = wrap.querySelector('img');
                const iconUrl = img ? img.src : null;
                return { temp: temp, humidity: humidity, pressure: pressure, iconUrl: iconUrl, titleText: titleText };
            }

            function loadWeatherData() {
                const weatherLoading = document.getElementById('weather-loading');
                const warningLoading = document.getElementById('warning-loading');
                const currentWeather = document.getElementById('current-weather');
                const weatherWarnings = document.getElementById('weather-warnings');
                if (!currentWeather || !weatherWarnings) return;

                fetchSmgJson('https://rss.smg.gov.mo/c_ActualWeather_rss.xml')
                    .then(function(data) {
                        if (weatherLoading) weatherLoading.style.display = 'none';
                        if (data.status !== 'ok' || !data.items || !data.items.length) {
                            currentWeather.innerHTML = '<p>Weather data not available</p>';
                            return;
                        }
                        const item = data.items[0];
                        const titleText = item.title || '';
                        const desc = item.description || '';
                        const parsed = parseActualWeatherHtml(desc, titleText);
                        const iconBlock = parsed.iconUrl
                            ? `<div class="weather-icon weather-icon-img"><img src="${parsed.iconUrl}" alt="" width="72" height="72" loading="lazy"></div>`
                            : '<div class="weather-icon"><i class="fas fa-cloud-sun"></i></div>';
                        const pressureRow = parsed.pressure
                            ? `<div><span>Pressure</span><strong>${parsed.pressure} hPa</strong></div>`
                            : '';
                        currentWeather.innerHTML = `
                            <div class="weather-data">
                                <div class="weather-main">
                                    ${iconBlock}
                                    <div class="weather-details">
                                        <div class="weather-temp">${parsed.temp}°C</div>
                                        <div class="weather-desc">${titleText}</div>
                                    </div>
                                </div>
                                <div class="weather-extra">
                                    <div><span>Humidity</span><strong>${parsed.humidity}%</strong></div>
                                    ${pressureRow}
                                </div>
                            </div>`;
                    })
                    .catch(function(error) {
                        console.error('Error fetching weather: ', error);
                        if (weatherLoading) weatherLoading.style.display = 'none';
                        currentWeather.innerHTML = '<p>Error loading weather data</p>';
                    });

                fetchSmgJson('https://rss.smg.gov.mo/c_WSignal_rss.xml')
                    .then(function(data) {
                        if (warningLoading) warningLoading.style.display = 'none';
                        if (data.status !== 'ok' || !data.items || !data.items.length) {
                            weatherWarnings.innerHTML = '<div class="no-warning"><i class="fas fa-check-circle"></i><p>No current weather warnings</p></div>';
                            return;
                        }
                        const htmlParts = [];
                        data.items.forEach(function(entry) {
                            htmlParts.push('<div class="rss-html">' + (entry.description || '') + '</div>');
                        });
                        weatherWarnings.innerHTML = htmlParts.join('');
                    })
                    .catch(function(error) {
                        console.error('Error fetching warnings: ', error);
                        if (warningLoading) warningLoading.style.display = 'none';
                        weatherWarnings.innerHTML = '<p>Error loading warnings data</p>';
                    });
            }

            function initWeatherPage() {
                const alertsHost = document.getElementById('smg-alerts-host');
                const reportHost = document.getElementById('smg-report-host');
                const forecastHost = document.getElementById('smg-forecast-host');
                const alertsLoading = document.getElementById('alerts-loading');
                const reportLoading = document.getElementById('report-loading');
                const forecastLoading = document.getElementById('forecast-loading');
                const meta = document.getElementById('feed-last-updated');
                const btn = document.getElementById('btn-refresh-feeds');

                function hideLoaders() {
                    if (alertsLoading) alertsLoading.style.display = 'none';
                    if (reportLoading) reportLoading.style.display = 'none';
                    if (forecastLoading) forecastLoading.style.display = 'none';
                }

                function loadFeeds() {
                    Promise.all([
                        fetchSmgJson('https://rss.smg.gov.mo/c_WSignal_rss.xml'),
                        fetchSmgJson('https://rss.smg.gov.mo/c_ActualWeather_rss.xml'),
                        fetchSmgJson('https://rss.smg.gov.mo/c_WForecast_rss.xml')
                    ]).then(function(results) {
                        hideLoaders();
                        const sig = results[0];
                        const act = results[1];
                        const fc = results[2];
                        if (sig.status === 'ok' && sig.items && sig.items[0] && alertsHost) {
                            alertsHost.innerHTML = sig.items[0].description || '';
                            alertsHost.hidden = false;
                        } else if (alertsHost) {
                            alertsHost.innerHTML = '<p>Warnings feed unavailable.</p>';
                            alertsHost.hidden = false;
                        }
                        if (act.status === 'ok' && act.items && act.items[0] && reportHost) {
                            reportHost.innerHTML = act.items[0].description || '';
                            reportHost.hidden = false;
                        } else if (reportHost) {
                            reportHost.innerHTML = '<p>Daily report unavailable.</p>';
                            reportHost.hidden = false;
                        }
                        if (fc.status === 'ok' && fc.items && fc.items[0] && forecastHost) {
                            forecastHost.innerHTML = fc.items[0].description || '';
                            forecastHost.hidden = false;
                        } else if (forecastHost) {
                            forecastHost.innerHTML = '<p>Forecast unavailable.</p>';
                            forecastHost.hidden = false;
                        }
                        if (meta) meta.textContent = 'Last updated: ' + new Date().toLocaleString();
                    }).catch(function(err) {
                        console.error(err);
                        hideLoaders();
                        const msg = '<p>Unable to load feeds. Please try again.</p>';
                        if (alertsHost) { alertsHost.innerHTML = msg; alertsHost.hidden = false; }
                        if (reportHost) { reportHost.innerHTML = msg; reportHost.hidden = false; }
                        if (forecastHost) { forecastHost.innerHTML = msg; forecastHost.hidden = false; }
                    });
                }

                loadFeeds();
                if (btn) btn.addEventListener('click', loadFeeds);
            }

            function init() {
                updateFirebaseStatus(true);
                checkIPBanStatus();

                if (currentPage === 'dashboard') {
                    updateTrafficTimes();
                    setInterval(updateTrafficTimes, 1000);
                    loadWeatherData();
                } else if (currentPage === 'cameras') {
                    loadCamerasFromFirebase();
                } else if (currentPage === 'news') {
                    loadNewsFromFirebase();
                } else if (currentPage === 'chat') {
                    initChat();
                } else if (currentPage === 'weather') {
                    initWeatherPage();
                }
            }

            init();
        });
