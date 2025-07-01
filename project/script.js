// Global variables
let currentLanguage = 'ar';
let currentTheme = 'light';
let map;
let trainMarkers = [];
let stationMarkers = [];
let routeLines = [];
let currentTrainData = null;
let trackingInterval = null;
let trackedTrainId = null;
let lastDeparturesUpdate = '';

// Updated station data with exact GPS coordinates from your files
const stations = {
    // Agha-Zeralda Line
    'agha': { name: 'أغا', nameEn: 'Agha', lat: 36.768, lng: 3.057, code: 'AGH', line: 'agha-zeralda' },
    'ateliers': { name: 'الورشات', nameEn: 'Ateliers', lat: 36.756, lng: 3.065, code: 'ATL', line: 'agha-zeralda' },
    'h-dey': { name: 'حسين داي', nameEn: 'H.Dey', lat: 36.745, lng: 3.094, code: 'HSD', line: 'agha-zeralda' },
    'caroubier': { name: 'خروبة', nameEn: 'Caroubier', lat: 36.735, lng: 3.119, code: 'CRB', line: 'agha-zeralda' },
    'el-harrach': { name: 'الحراش', nameEn: 'El Harrach', lat: 36.721, lng: 3.132, code: 'ELH', line: 'agha-zeralda' },
    'gue-constantine': { name: 'جسر قسنطينة', nameEn: 'Gué de Constantine', lat: 36.697, lng: 3.095, code: 'GCN', line: 'agha-zeralda' },
    'ain-naadja': { name: 'عين النعجة', nameEn: 'Ain Naadja', lat: 36.689, lng: 3.077, code: 'ANN', line: 'agha-zeralda' },
    'baba-ali': { name: 'بابا علي', nameEn: 'Baba Ali', lat: 36.667, lng: 3.052, code: 'BAL', line: 'agha-zeralda' },
    'birtouta': { name: 'بئر توتة', nameEn: 'Birtouta', lat: 36.630, lng: 3.009, code: 'BRT', line: 'agha-zeralda' },
    'tessala': { name: 'تسالة المرجة', nameEn: 'Tessala El Merdja', lat: 36.639, lng: 2.935, code: 'TSL', line: 'agha-zeralda' },
    'sidi-abdellah': { name: 'سيدي عبد الله', nameEn: 'Sidi Abde allah', lat: 36.680, lng: 2.892, code: 'SDA', line: 'agha-zeralda' },
    'sidi-abdellah-university': { name: 'سيدي عبد الله الجامعة', nameEn: 'Sidi Abde allah-University', lat: 36.692, lng: 2.871, code: 'SDU', line: 'agha-zeralda' },
    'zeralda': { name: 'زرالدة', nameEn: 'Zéralda', lat: 36.702, lng: 2.849, code: 'ZRL', line: 'agha-zeralda' },
    
    // Oran-Agha Line
    'blida': { name: 'البليدة', nameEn: 'Blida', lat: 36.478, lng: 2.815, code: 'BLD', line: 'oran-agha' },
    'afroune': { name: 'عفرون', nameEn: 'Afroune', lat: 36.473, lng: 2.624, code: 'AFR', line: 'oran-agha' },
    'ain-defla': { name: 'عين الدفلى', nameEn: 'Ain El Defla', lat: 36.267, lng: 1.969, code: 'ADF', line: 'oran-agha' },
    'chlef': { name: 'الشلف', nameEn: 'Chlef', lat: 36.166, lng: 1.342, code: 'CHL', line: 'oran-agha' },
    'relizane': { name: 'غليزان', nameEn: 'Relizane', lat: 35.748, lng: 0.555, code: 'RLZ', line: 'oran-agha' },
    'oran': { name: 'وهران', nameEn: 'Oran', lat: 35.698, lng: -0.638, code: 'ORA', line: 'oran-agha' }
};

// Define the station sequences for each line
const lineStations = {
    'agha-zeralda': ['agha', 'ateliers', 'h-dey', 'caroubier', 'el-harrach', 'gue-constantine', 'ain-naadja', 'baba-ali', 'birtouta', 'tessala', 'sidi-abdellah', 'sidi-abdellah-university', 'zeralda'],
    'oran-agha': ['agha', 'el-harrach', 'blida', 'afroune', 'ain-defla', 'chlef', 'relizane', 'oran']
};

// Train timetable data - CORRECTED
const trainTimetable = {
    'agha-zeralda': {
        '1501': { agha: '5:10', ateliers: '5:12', 'h-dey': '5:16', caroubier: '5:19', 'el-harrach': '5:22', 'gue-constantine': '5:26', 'ain-naadja': '5:29', 'baba-ali': '5:33', birtouta: '5:38', tessala: '5:46', 'sidi-abdellah': '5:51', 'sidi-abdellah-university': '5:54', zeralda: '5:58' },
        '1505': { agha: '7:30', ateliers: '7:32', 'h-dey': '7:36', caroubier: '7:39', 'el-harrach': '7:42', 'gue-constantine': '7:46', 'ain-naadja': '7:49', 'baba-ali': '7:53', birtouta: '7:58', tessala: '8:06', 'sidi-abdellah': '8:11', 'sidi-abdellah-university': '8:14', zeralda: '8:18' },
        '1509': { agha: '8:40', ateliers: '8:42', 'h-dey': '8:46', caroubier: '8:49', 'el-harrach': '8:52', 'gue-constantine': '8:56', 'ain-naadja': '8:59', 'baba-ali': '9:03', birtouta: '9:08', tessala: '9:16', 'sidi-abdellah': '9:21', 'sidi-abdellah-university': '9:24', zeralda: '9:28' },
        '1513': { agha: '10:15', ateliers: '10:17', 'h-dey': '10:21', caroubier: '10:24', 'el-harrach': '10:27', 'gue-constantine': '10:31', 'ain-naadja': '10:34', 'baba-ali': '10:38', birtouta: '10:43', tessala: '10:51', 'sidi-abdellah': '10:56', 'sidi-abdellah-university': '10:59', zeralda: '11:03' },
        '1515': { agha: '11:35', ateliers: '11:37', 'h-dey': '11:41', caroubier: '11:44', 'el-harrach': '11:47', 'gue-constantine': '11:51', 'ain-naadja': '11:54', 'baba-ali': '11:58', birtouta: '12:03', tessala: '12:11', 'sidi-abdellah': '12:16', 'sidi-abdellah-university': '12:19', zeralda: '12:23' },
        '1519': { agha: '13:10', ateliers: '13:12', 'h-dey': '13:16', caroubier: '13:19', 'el-harrach': '13:22', 'gue-constantine': '13:26', 'ain-naadja': '13:29', 'baba-ali': '13:33', birtouta: '13:38', tessala: '13:46', 'sidi-abdellah': '13:51', 'sidi-abdellah-university': '13:54', zeralda: '13:58' },
        '1521': { agha: '14:40', ateliers: '14:42', 'h-dey': '14:46', caroubier: '14:49', 'el-harrach': '14:52', 'gue-constantine': '14:56', 'ain-naadja': '14:59', 'baba-ali': '15:03', birtouta: '15:08', tessala: '15:16', 'sidi-abdellah': '15:21', 'sidi-abdellah-university': '15:24', zeralda: '15:28' },
        '1525': { agha: '16:25', ateliers: '16:27', 'h-dey': '16:31', caroubier: '16:34', 'el-harrach': '16:37', 'gue-constantine': '16:41', 'ain-naadja': '16:44', 'baba-ali': '16:48', birtouta: '16:53', tessala: '17:01', 'sidi-abdellah': '17:06', 'sidi-abdellah-university': '17:09', zeralda: '17:13' },
        '1529': { agha: '18:35', ateliers: '18:37', 'h-dey': '18:41', caroubier: '18:44', 'el-harrach': '18:47', 'gue-constantine': '18:51', 'ain-naadja': '18:54', 'baba-ali': '18:58', birtouta: '19:03', tessala: '19:11', 'sidi-abdellah': '19:16', 'sidi-abdellah-university': '19:19', zeralda: '19:23' }
    },
    'oran-agha': { // Corrected schedule for Algiers -> Oran based on the image
        '1001': { agha: '6:10', 'el-harrach': '6:18', blida: '6:46', afroune: '6:59', 'ain-defla': '8:00', chlef: '8:54', relizane: '9:56', oran: '11:25' },
        'C800': { agha: '8:00', blida: '8:36', afroune: '8:49', 'ain-defla': '9:16', chlef: '10:05', relizane: '10:56', oran: '12:20' }, // Coradia at 8:00
        'C1230': { agha: '12:30', blida: '13:06', chlef: '14:28', relizane: '15:19', oran: '15:59' }, // Coradia at 12:30
        'C1700': { agha: '17:00', blida: '17:36', chlef: '18:57', relizane: '19:42', oran: '20:20' }  // Coradia at 17:00
    }
};

// Calculate price based on distance and line
function calculatePrice(fromStationId, toStationId, line) {
    const lineStationList = lineStations[line];
    const fromIndex = lineStationList.indexOf(fromStationId);
    const toIndex = lineStationList.indexOf(toStationId);
    const distance = Math.abs(toIndex - fromIndex);
    
    if (line === 'agha-zeralda') {
        return 30 + (distance * 15); // Start 30 DA, +15 DA per station
    } else if (line === 'oran-agha') {
        return 400 + (distance * 100); // Start 400 DA, +100 DA per station
    }
    return 50; // fallback
}

/**
 * NEW HELPER FUNCTION
 * Calculates the duration between two time strings (HH:MM).
 * @param {string} startTime - The start time, e.g., "05:10".
 * @param {string} endTime - The end time, e.g., "05:58".
 * @returns {string} The formatted duration, e.g., "48m" or "1h 15m".
 */
function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return 'N/A';
    
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    const diffMinutes = endMinutes - startMinutes;
    
    if (diffMinutes < 0) return 'N/A'; // Handles cases where end time is before start time
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}


// Updated train data with real examples for both lines - CORRECTED
const sampleTrains = [
    {
        id: 'T001', number: '1501', line: 'agha-zeralda', direction: 'forward',
        departure: '05:10', arrival: '05:58', status: 'moving', delay: 0, platform: '1', duration: '48m',
        stationIndex: 0, lastStationTime: Date.now(), isAtStation: false, finished: false
    },
    {
        id: 'T002', number: '1001', line: 'oran-agha', direction: 'forward',
        departure: '06:10', arrival: '11:25', status: 'moving', delay: 0, platform: 'A', duration: '5h 15m',
        stationIndex: 0, lastStationTime: Date.now(), isAtStation: false, finished: false
    },
    {
        id: 'T003', number: 'C800', line: 'oran-agha', direction: 'forward',
        departure: '08:00', arrival: '12:20', status: 'on-time', delay: 0, platform: 'B', duration: '4h 20m',
        stationIndex: 0, lastStationTime: Date.now(), isAtStation: false, finished: false
    }
];

// AI Assistant variables
let selectedTransportMethod = null;
let userLocation = null;
let selectedTrain = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    // Wait for Leaflet to be available before initializing map
    if (typeof L !== 'undefined') {
        initializeMap();
    } else {
        // Retry after a short delay if Leaflet isn't loaded yet
        setTimeout(() => {
            if (typeof L !== 'undefined') {
                initializeMap();
            } else {
                console.warn('Leaflet library not loaded, map will not be available');
            }
        }, 1000);
    }
    populateDepartures();
    setupEventListeners();
    setupLanguageToggle();
    setupThemeToggle();
    setupPaymentHandlers();
    setupAIAssistant();
    populateStationSelects();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('travelDate').value = today;
    
    // Start train simulation
    startTrainSimulation();
});

function initializeApp() {
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    currentTheme = savedTheme;
    
    // Apply saved language
    const savedLang = localStorage.getItem('language') || 'ar';
    document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', savedLang);
    currentLanguage = savedLang;
    
    updateLanguageContent();
}

function populateStationSelects() {
    const fromSelect = document.getElementById('fromStation');
    const toSelect = document.getElementById('toStation');
    
    // Clear existing options except the first one
    fromSelect.innerHTML = `<option value="">${currentLanguage === 'ar' ? 'اختر المحطة' : 'Select Station'}</option>`;
    toSelect.innerHTML = `<option value="">${currentLanguage === 'ar' ? 'اختر المحطة' : 'Select Station'}</option>`;
    
    // Add all stations
    Object.keys(stations).forEach(stationId => {
        const station = stations[stationId];
        const optionText = currentLanguage === 'ar' ? station.name : station.nameEn;
        
        const fromOption = document.createElement('option');
        fromOption.value = stationId;
        fromOption.textContent = optionText;
        fromSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = stationId;
        toOption.textContent = optionText;
        toSelect.appendChild(toOption);
    });
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('swapStations').addEventListener('click', swapStations);
    
    // Navigation
    document.getElementById('backToMain').addEventListener('click', () => showPage('main'));
    document.getElementById('backToMainFromTicket').addEventListener('click', () => showPage('main'));
    
    // Map controls - only center map button
    if (typeof L !== 'undefined') {
        document.getElementById('centerMap').addEventListener('click', centerMap);
    }
    
    // Ticket download
    document.getElementById('downloadTicket').addEventListener('click', downloadTicket);
    
    // Mouse movement for 3D train
    document.addEventListener('mousemove', (e) => {
        if (window.updateTrainRotation) {
            const mouseXNorm = e.clientX / window.innerWidth;
            const mouseYNorm = e.clientY / window.innerHeight;
            window.updateTrainRotation(mouseXNorm, mouseYNorm);
        }
    });
}

function setupLanguageToggle() {
    document.getElementById('langToggle').addEventListener('click', () => {
        currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
        document.documentElement.setAttribute('dir', currentLanguage === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', currentLanguage);
        localStorage.setItem('language', currentLanguage);
        updateLanguageContent();
        populateStationSelects(); // Repopulate selects with new language
        populateDepartures(); // Update departures with new language
    });
}

function setupThemeToggle() {
    document.getElementById('themeToggle').addEventListener('click', () => {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
    });
}

function updateLanguageContent() {
    const elements = document.querySelectorAll('[data-ar][data-en]');
    elements.forEach(element => {
        const text = currentLanguage === 'ar' ? element.getAttribute('data-ar') : element.getAttribute('data-en');
        element.textContent = text;
    });
}

// AI Assistant Setup
function setupAIAssistant() {
    // Add AI Assistant button to payment form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        const aiButton = document.createElement('button');
        aiButton.type = 'button';
        aiButton.className = 'ai-assistant-btn';
        aiButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3 4-3 9-3 9 1.34 9 3z"/>
                <path d="M21 5c0 1.66-4 3-9 3S3 6.66 3 5s4-3 9-3 9 1.34 9 3z"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            <span data-ar="اسأل المساعد الذكي" data-en="Ask AI Assistant">اسأل المساعد الذكي</span>
        `;
        
        // Insert before the pay button
        const payBtn = document.querySelector('.pay-btn');
        payBtn.parentNode.insertBefore(aiButton, payBtn);
        
        aiButton.addEventListener('click', showAIAssistant);
    }
}

function showAIAssistant() {
    if (!currentTrainData) {
        alert(currentLanguage === 'ar' ? 'يرجى اختيار قطار أولاً' : 'Please select a train first');
        return;
    }
    
    // Create AI Assistant modal
    const modal = document.createElement('div');
    modal.className = 'ai-assistant-modal';
    modal.innerHTML = `
        <div class="ai-modal-content">
            <div class="ai-modal-header">
                <h3 data-ar="المساعد الذكي" data-en="AI Assistant">المساعد الذكي</h3>
                <button class="close-ai-modal" onclick="closeAIAssistant()">×</button>
            </div>
            
            <div class="ai-modal-body">
                <div class="transport-selection">
                    <h4 data-ar="اختر وسيلة النقل" data-en="Choose Transport Method">اختر وسيلة النقل</h4>
                    <div class="transport-buttons">
                        <button class="transport-btn" data-method="Walk">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            <span data-ar="مشي" data-en="Walk">مشي</span>
                        </button>
                        <button class="transport-btn" data-method="Bicycle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18.5" cy="17.5" r="3.5"/>
                                <circle cx="5.5" cy="17.5" r="3.5"/>
                                <circle cx="15" cy="5" r="1"/>
                                <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                            </svg>
                            <span data-ar="دراجة" data-en="Bicycle">دراجة</span>
                        </button>
                        <button class="transport-btn" data-method="Motorcycle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 18a2 2 0 1 0 4 0 2 2 0 1 0-4 0z"/>
                                <path d="M15 18a2 2 0 1 0 4 0 2 2 0 1 0-4 0z"/>
                                <path d="M5 18h5l3-5 2-1V9l-4 5-2 1"/>
                                <path d="M11.5 12.5L16 8"/>
                            </svg>
                            <span data-ar="دراجة نارية" data-en="Motorcycle">دراجة نارية</span>
                        </button>
                        <button class="transport-btn" data-method="Car">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.14a1 1 0 0 0-.76-.35H8.46a1 1 0 0 0-.76.35L5 11l-5.16 1.86a1 1 0 0 0-.84.99V16h3m0 0a2 2 0 1 0 4 0m10 0a2 2 0 1 0 4 0"/>
                            </svg>
                            <span data-ar="سيارة" data-en="Car">سيارة</span>
                        </button>
                        <button class="transport-btn" data-method="Taxi">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.14a1 1 0 0 0-.76-.35H8.46a1 1 0 0 0-.76.35L5 11l-5.16 1.86a1 1 0 0 0-.84.99V16h3m0 0a2 2 0 1 0 4 0m10 0a2 2 0 1 0 4 0"/>
                                <path d="M7 10h10"/>
                            </svg>
                            <span data-ar="تاكسي" data-en="Taxi">تاكسي</span>
                        </button>
                    </div>
                </div>
                
                <div class="time-selection" style="display: none;">
                    <h4 data-ar="وقت المغادرة" data-en="Departure Time">وقت المغادرة</h4>
                    <div class="time-options">
                        <label>
                            <input type="radio" name="timeOption" value="automatic" checked>
                            <span data-ar="تلقائي (الآن)" data-en="Automatic (Now)">تلقائي (الآن)</span>
                        </label>
                        <label>
                            <input type="radio" name="timeOption" value="manual">
                            <span data-ar="يدوي" data-en="Manual">يدوي</span>
                        </label>
                    </div>
                    <div class="manual-time" style="display: none;">
                        <input type="time" id="manualTime" class="time-input">
                    </div>
                    <button class="get-recommendation-btn" onclick="getAIRecommendation()">
                        <span data-ar="احصل على التوصية" data-en="Get Recommendation">احصل على التوصية</span>
                    </button>
                </div>
                
                <div class="ai-response" id="aiResponse" style="display: none;">
                    <h4 data-ar="توصية المساعد الذكي" data-en="AI Assistant Recommendation">توصية المساعد الذكي</h4>
                    <div class="response-content" id="responseContent"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    updateLanguageContent();
    
    // Setup transport method selection
    const transportBtns = modal.querySelectorAll('.transport-btn');
    transportBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            transportBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTransportMethod = btn.dataset.method;
            
            // Show time selection
            modal.querySelector('.time-selection').style.display = 'block';
        });
    });
    
    // Setup time option selection
    const timeOptions = modal.querySelectorAll('input[name="timeOption"]');
    timeOptions.forEach(option => {
        option.addEventListener('change', () => {
            const manualTimeDiv = modal.querySelector('.manual-time');
            if (option.value === 'manual') {
                manualTimeDiv.style.display = 'block';
            } else {
                manualTimeDiv.style.display = 'none';
            }
        });
    });
}

function closeAIAssistant() {
    const modal = document.querySelector('.ai-assistant-modal');
    if (modal) {
        modal.remove();
    }
    selectedTransportMethod = null;
    userLocation = null;
}

async function getAIRecommendation() {
    if (!selectedTransportMethod) {
        alert(currentLanguage === 'ar' ? 'يرجى اختيار وسيلة النقل' : 'Please select transport method');
        return;
    }
    
    const responseDiv = document.getElementById('responseContent');
    const aiResponseSection = document.getElementById('aiResponse');
    
    // Show loading
    responseDiv.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <span data-ar="جاري الحصول على التوصية..." data-en="Getting recommendation...">جاري الحصول على التوصية...</span>
        </div>
    `;
    aiResponseSection.style.display = 'block';
    updateLanguageContent();
    
    try {
        // Get user location
        await getUserLocation();
        
        // Get time
        const timeOption = document.querySelector('input[name="timeOption"]:checked').value;
        let currentTime;
        
        if (timeOption === 'automatic') {
            const now = new Date();
            currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        } else {
            const manualTime = document.getElementById('manualTime').value;
            if (!manualTime) {
                throw new Error(currentLanguage === 'ar' ? 'يرجى إدخال الوقت' : 'Please enter time');
            }
            currentTime = manualTime;
        }
        
        // Get train details
        const fromToStations = getFromToStations(currentTrainData);
        const fromStation = stations[fromToStations.from];
        const toStation = stations[fromToStations.to];
        
        // Prepare Gemini API request
        const geminiApiRequest = `
        give me an answer of one line only
        this is the time table of trains

GARES  1501  1505  1509  1513  1515  1519  1521  1525  1529  
[*]  [*]  [*]  [*]  [*]  [*]  [*]  [*]  [*]  
Agha  5:10  7:30  8:40  10:15  11:35  13:10  14:40  16:25  18:35  
Ateliers  5:12  7:32  8:42  10:17  11:37  13:12  14:42  16:27  18:37  
H.Dey  5:16  7:36  8:46  10:21  11:41  13:16  14:46  16:31  18:41  sla
Caroubier  5:19  7:39  8:49  10:24  11:44  13:19  14:49  16:34  18:44  
El Harrach  5:22  7:42  8:52  10:27  11:47  13:22  14:52  16:37  18:47  
Gué de Cne  5:26  7:46  8:56  10:31  11:51  13:26  14:56  16:41  18:51  
Ain Naadja  5:29  7:49  8:59  10:34  11:54  13:29  14:59  16:44  18:54  
Baba Ali  5:33  7:53  9:03  10:38  11:58  13:33  15:03  16:48  18:58  
Birtouta  5:38  7:58  9:08  10:43  12:03  13:38  15:08  16:53  19:03  
Tessala El Merdja  5:46  8:06  9:16  10:51  12:11  13:46  15:16  17:01  19:11  
Sidi Abde allah  5:51  8:11  9:21  10:56  12:16  13:51  15:21  17:06  19:16  
Sidi Abde allah-University  5:54  8:14  9:24  10:59  12:19  13:54  15:24  17:09  19:19  
Zéralda  5:58  8:18  9:28  11:03  12:23  13:58  15:28  17:13  19:23  

I am currently at ${userLocation.lat}, ${userLocation.lng}, and I want to go to ${currentLanguage === 'ar' ? fromStation.name : fromStation.nameEn} train station going to ${currentLanguage === 'ar' ? toStation.name : toStation.nameEn}.
I will go using a ${selectedTransportMethod}. Can you estimate how long it will take me to get there?
The train from ${currentLanguage === 'ar' ? fromStation.name : fromStation.nameEn} leaves at ${currentTrainData.departure}. Will I make it on time if I leave now at ${currentTime}?
If yes say "You can be on time , you could buy the ticket" not, what transport method should I take instead or what time is the next train?
Give a strict clear one line recommendation.`;

        // Call Gemini API (Note: You'll need to add your API key)
        const response = await callGeminiAPI(geminiApiRequest);
        
        // Display response with appropriate styling
        let responseClass = 'response-neutral';
        if (response.includes('You can be on time')) {
            responseClass = 'response-success';
        } else if (response.includes('transport method') || response.includes('next train')) {
            responseClass = 'response-warning';
        } else if (response.includes('not possible') || response.includes('too late')) {
            responseClass = 'response-error';
        }
        
        responseDiv.innerHTML = `
            <div class="ai-recommendation ${responseClass}">
                <div class="recommendation-icon">
                    ${responseClass === 'response-success' ? '✅' : responseClass === 'response-warning' ? '⚠️' : '❌'}
                </div>
                <div class="recommendation-text">${response}</div>
            </div>
        `;
        
    } catch (error) {
        console.error('AI Assistant Error:', error);
        responseDiv.innerHTML = `
            <div class="ai-recommendation response-error">
                <div class="recommendation-icon">❌</div>
                <div class="recommendation-text">
                    ${currentLanguage === 'ar' ? 'حدث خطأ في الحصول على التوصية. يرجى المحاولة مرة أخرى.' : 'Error getting recommendation. Please try again.'}
                </div>
            </div>
        `;
    }
}

async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error(currentLanguage === 'ar' ? 'الموقع الجغرافي غير مدعوم' : 'Geolocation not supported'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                resolve(userLocation);
            },
            (error) => {
                reject(new Error(currentLanguage === 'ar' ? 'فشل في الحصول على الموقع' : 'Failed to get location'));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
}

async function callGeminiAPI(prompt) {
    // Note: Replace 'YOUR_GEMINI_API_KEY' with your actual API key
    const API_KEY = 'AIzaSyBQ7S264hMw1ktwga4q78hMvWu2HjgPht8';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        // Fallback response for demo purposes
        return currentLanguage === 'ar' 
            ? 'عذراً، لا يمكن الوصول إلى خدمة المساعد الذكي حالياً. يرجى المحاولة لاحقاً.'
            : 'Sorry, AI assistant service is currently unavailable. Please try again later.';
    }
}

function initializeMap() {
    // Check if Leaflet is available and map container exists
    if (typeof L === 'undefined') {
        console.warn('Leaflet library not available');
        return;
    }
    
    const mapContainer = document.getElementById('leafletMap');
    if (!mapContainer) {
        console.warn('Map container not found');
        return;
    }
    
    try {
        map = L.map('leafletMap').setView([36.7538, 3.0588], 6);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);
        
        // Add all stations to map initially
        showAllStationsOnMap();
        
        // Add train routes
        addTrainRoutes();
        
        // Add moving trains
        addMovingTrains();
        
        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
    }
}

function showAllStationsOnMap() {
    // Clear existing station markers
    stationMarkers.forEach(marker => map.removeLayer(marker));
    stationMarkers = [];
    
    // Add all stations to map
    Object.keys(stations).forEach(stationId => {
        const station = stations[stationId];
        const marker = L.marker([station.lat, station.lng])
            .bindPopup(`
                <div class="station-popup">
                    <h4>${currentLanguage === 'ar' ? station.name : station.nameEn}</h4>
                    <p>Code: ${station.code}</p>
                    <p>Line: ${station.line}</p>
                </div>
            `)
            .addTo(map);
        stationMarkers.push(marker);
    });
}

function addTrainRoutes() {
    if (!map) return;
    
    // Clear existing routes
    routeLines.forEach(line => map.removeLayer(line));
    routeLines = [];
    
    // Agha-Zeralda Line
    const aghaZeraldaRoute = lineStations['agha-zeralda'].map(stationId => 
        [stations[stationId].lat, stations[stationId].lng]
    );
    
    // Oran-Agha Line
    const oranAghaRoute = lineStations['oran-agha'].map(stationId => 
        [stations[stationId].lat, stations[stationId].lng]
    );
    
    const routeStyles = {
        'agha-zeralda': { color: '#10b981', weight: 4, opacity: 0.8 },
        'oran-agha': { color: '#2563eb', weight: 4, opacity: 0.8 }
    };
    
    const aghaLine = L.polyline(aghaZeraldaRoute, routeStyles['agha-zeralda']).addTo(map);
    const oranLine = L.polyline(oranAghaRoute, routeStyles['oran-agha']).addTo(map);
    
    routeLines.push(aghaLine, oranLine);
}

function addMovingTrains() {
    if (!map) return;
    
    sampleTrains.forEach(train => {
        if (train.status === 'moving' || train.status === 'on-time') {
            updateTrainPosition(train);
        }
    });
}

function updateTrainPosition(train) {
    if (!map) return;
    
    const lineStationList = lineStations[train.line];
    const currentStationId = getCurrentStationId(train);
    const nextStationId = getNextStationId(train);
    
    const currentStation = stations[currentStationId];
    const nextStation = stations[nextStationId];
    
    if (!currentStation || !nextStation) return;
    
    // Remove existing marker for this train
    trainMarkers = trainMarkers.filter(marker => {
        if (marker.trainId === train.id) {
            map.removeLayer(marker);
            return false;
        }
        return true;
    });
    
    let lat, lng;
    
    if (train.isAtStation) {
        // Train is at station
        lat = currentStation.lat;
        lng = currentStation.lng;
    } else {
        // Train is moving between stations
        const progress = getTrainProgress(train);
        lat = currentStation.lat + (nextStation.lat - currentStation.lat) * progress;
        lng = currentStation.lng + (nextStation.lng - currentStation.lng) * progress;
    }
    
    const trainIcon = L.divIcon({
        className: 'train-marker',
        html: `<div class="train-icon ${train.status === 'delayed' ? 'delayed' : 'active'}" style="font-size: 24px;">🚂</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    const trainMarker = L.marker([lat, lng], { icon: trainIcon })
        .bindPopup(`
            <div class="train-popup">
                <h4>Train ${train.number}</h4>
                <p>${currentLanguage === 'ar' ? currentStation.name : currentStation.nameEn} → ${currentLanguage === 'ar' ? nextStation.name : nextStation.nameEn}</p>
                <p>Status: ${getStatusText(train.status)}</p>
                <p>Current: ${train.isAtStation ? 'At Station' : 'Moving'}</p>
                ${train.isAtStation ? `<p>Departure in: ${Math.max(0, 7 - Math.floor((Date.now() - train.lastStationTime) / 1000))}s</p>` : ''}
            </div>
        `)
        .addTo(map);
    
    trainMarker.trainId = train.id;
    trainMarkers.push(trainMarker);
}

function getCurrentStationId(train) {
    const lineStationList = lineStations[train.line];
    if (train.direction === 'forward') {
        return lineStationList[train.stationIndex];
    } else {
        return lineStationList[lineStationList.length - 1 - train.stationIndex];
    }
}

function getNextStationId(train) {
    const lineStationList = lineStations[train.line];
    if (train.direction === 'forward') {
        const nextIndex = train.stationIndex + 1;
        if (nextIndex >= lineStationList.length) {
            return lineStationList[lineStationList.length - 1]; // Last station
        }
        return lineStationList[nextIndex];
    } else {
        const nextIndex = train.stationIndex + 1;
        const reverseIndex = lineStationList.length - 1 - nextIndex;
        if (reverseIndex < 0) {
            return lineStationList[0]; // First station
        }
        return lineStationList[reverseIndex];
    }
}

function getFromToStations(train) {
    const lineStationList = lineStations[train.line];
    if (train.direction === 'forward') {
        return {
            from: lineStationList[0],
            to: lineStationList[lineStationList.length - 1]
        };
    } else {
        return {
            from: lineStationList[lineStationList.length - 1],
            to: lineStationList[0]
        };
    }
}

function getTrainProgress(train) {
    if (train.isAtStation) return 0;

    const timeSinceLastStation = Date.now() - train.lastStationTime;
    const travelTime = 20000; // Fixed 20 seconds to match the 3D simulation

    return Math.min(1, timeSinceLastStation / travelTime);
}

function startTrainSimulation() {
    setInterval(() => {
        sampleTrains.forEach(train => {
            updateTrainMovement(train);
            updateTrainPosition(train);
        });

        const newDeparturesContent = generateDeparturesContent();
        if (newDeparturesContent !== lastDeparturesUpdate) {
            lastDeparturesUpdate = newDeparturesContent;
            document.getElementById('departuresGrid').innerHTML = newDeparturesContent;
        }

        if (trackedTrainId) {
            updateTrackingDisplay();
        }
    }, 1000);
}

// --- MODIFICATION: Movement logic now makes a single, one-way trip ---
function updateTrainMovement(train) {
    // If train has finished its route, do nothing.
    if (train.finished) {
        train.status = 'arrived';
        return;
    }

    const currentTime = Date.now();
    const timeSinceLastStation = currentTime - train.lastStationTime;
    const lineStationList = lineStations[train.line];

    if (train.isAtStation) {
        // Train is at a station, wait for 5 seconds
        if (timeSinceLastStation >= 5000) {
            train.isAtStation = false;
            train.lastStationTime = currentTime;
            train.status = 'moving';
        }
    } else {
        // Train is moving between stations, travel for 20 seconds
        const travelTime = 20000;

        if (timeSinceLastStation >= travelTime) {
            // Arrived at the next station
            train.stationIndex++;
            train.isAtStation = true;
            train.lastStationTime = currentTime;

            if (trackedTrainId === train.id) {
                showTrainNotification(train);
            }

            // Check if it's the final station
            if (train.stationIndex >= lineStationList.length - 1) {
                train.finished = true; // End of the line
                train.status = 'arrived';
            }
        }
    }
}

function showTrainNotification(train) {
    const currentStationId = getCurrentStationId(train);
    const station = stations[currentStationId];
    const message = currentLanguage === 'ar' 
        ? `القطار ${train.number} وصل إلى محطة ${station.name}`
        : `Train ${train.number} has arrived at ${station.nameEn} station`;
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'train-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">🚂</div>
            <div class="notification-text">${message}</div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function generateDeparturesContent() {
    let content = '';
    
    sampleTrains.forEach(train => {
        const fromToStations = getFromToStations(train);
        const fromStation = stations[fromToStations.from];
        const toStation = stations[fromToStations.to];
        const currentStationId = getCurrentStationId(train);
        const currentStation = stations[currentStationId];
        
        if (!fromStation || !toStation) return;
        
        // Calculate price for full journey
        const price = calculatePrice(fromToStations.from, fromToStations.to, train.line);
        
        content += `
            <div class="departure-card fade-in">
                <div class="departure-header">
                    <div class="train-number">Train ${train.number}</div>
                    <div class="status ${train.status}">${getStatusText(train.status)}</div>
                </div>
                
                <div class="route">
                    <span class="route-station">${currentLanguage === 'ar' ? fromStation.name : fromStation.nameEn}</span>
                    <span class="route-arrow">→</span>
                    <span class="route-station">${currentLanguage === 'ar' ? toStation.name : toStation.nameEn}</span>
                </div>
                
                <div class="current-location">
                    <div class="location-label">${currentLanguage === 'ar' ? 'الموقع الحالي:' : 'Current Location:'}</div>
                    <div class="location-value">${currentLanguage === 'ar' ? currentStation.name : currentStation.nameEn}</div>
                    <div class="location-status">${train.isAtStation ? (currentLanguage === 'ar' ? 'في المحطة' : 'At Station') : (currentLanguage === 'ar' ? 'متحرك' : 'Moving')}</div>
                </div>
                
                <div class="departure-details">
                    <div class="departure-time">${train.departure}</div>
                    <div class="train-info">
                        <div class="info-item">
                            <span class="info-label">${currentLanguage === 'ar' ? 'المنصة:' : 'Platform:'}</span>
                            <span class="info-value">${train.platform}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${currentLanguage === 'ar' ? 'المدة:' : 'Duration:'}</span>
                            <span class="info-value">${train.duration}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${currentLanguage === 'ar' ? 'السعر:' : 'Price:'}</span>
                            <span class="info-value">${price} DA</span>
                        </div>
                        ${train.delay > 0 ? `
                        <div class="info-item delay">
                            <span class="info-label">${currentLanguage === 'ar' ? 'التأخير:' : 'Delay:'}</span>
                            <span class="info-value">${train.delay} min</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="train-actions">
                    <button class="track-btn" onclick="trackTrain('${train.id}')" ${trackedTrainId === train.id ? 'disabled' : ''}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>${trackedTrainId === train.id ? (currentLanguage === 'ar' ? 'يتم التتبع' : 'Tracking') : (currentLanguage === 'ar' ? 'تتبع' : 'Track')}</span>
                    </button>
                    
                    <button class="book-btn" onclick="bookTrain('${train.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                        </svg>
                        <span>${currentLanguage === 'ar' ? 'احجز الآن' : 'Book Now'}</span>
                    </button>
                </div>
            </div>
        `;
    });
    
    return content;
}

function populateDepartures() {
    const grid = document.getElementById('departuresGrid');
    const content = generateDeparturesContent();
    grid.innerHTML = content;
    lastDeparturesUpdate = content;
}

function trackTrain(trainId) {
    const train = sampleTrains.find(t => t.id === trainId);
    if (!train) return;
    
    // Stop tracking previous train
    if (trackedTrainId) {
        stopTracking();
    }
    
    trackedTrainId = trainId;
    
    // Show tracking panel
    showTrackingPanel(train);
    
    // Focus map on train route and show only relevant stations
    focusMapOnTrainRoute(train);
    
    // Update departures to show tracking status
    populateDepartures();
}

function stopTracking() {
    trackedTrainId = null;
    const trackingPanel = document.getElementById('trackingPanel');
    if (trackingPanel) {
        trackingPanel.remove();
    }
    
    // Show all stations again
    showAllStationsOnMap();
    addTrainRoutes();
    
    populateDepartures();
}

function showTrackingPanel(train) {
    // Remove existing tracking panel
    const existingPanel = document.getElementById('trackingPanel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const panel = document.createElement('div');
    panel.id = 'trackingPanel';
    panel.className = 'tracking-panel';
    panel.innerHTML = `
        <div class="tracking-header">
            <h3>${currentLanguage === 'ar' ? 'تتبع القطار' : 'Train Tracking'} ${train.number}</h3>
            <button class="close-tracking" onclick="stopTracking()">×</button>
        </div>
        <div class="tracking-content" id="trackingContent">
            </div>
    `;
    
    document.body.appendChild(panel);
    updateTrackingDisplay();
}

function updateTrackingDisplay() {
    const train = sampleTrains.find(t => t.id === trackedTrainId);
    if (!train) return;
    
    const trackingContent = document.getElementById('trackingContent');
    if (!trackingContent) return;
    
    const currentStationId = getCurrentStationId(train);
    const nextStationId = getNextStationId(train);
    const currentStation = stations[currentStationId];
    const nextStation = stations[nextStationId];
    const lineStationList = lineStations[train.line];
    
    // Create route progress based on direction
    let routeHTML = '<div class="route-progress">';
    
    if (train.direction === 'forward') {
        lineStationList.forEach((stationId, index) => {
            const station = stations[stationId];
            const isCurrent = index === train.stationIndex;
            const isPassed = index < train.stationIndex;
            const isNext = index === train.stationIndex + 1;
            
            routeHTML += `
                <div class="route-station ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''} ${isNext ? 'next' : ''}">
                    <div class="station-dot"></div>
                    <div class="station-name">${currentLanguage === 'ar' ? station.name : station.nameEn}</div>
                    ${isCurrent && train.isAtStation ? `<div class="station-status">${currentLanguage === 'ar' ? 'في المحطة' : 'At Station'}</div>` : ''}
                    ${isCurrent && !train.isAtStation ? `<div class="station-status">${currentLanguage === 'ar' ? 'مغادر' : 'Departed'}</div>` : ''}
                </div>
            `;
            
            if (index < lineStationList.length - 1) {
                routeHTML += '<div class="route-line"></div>';
            }
        });
    } else {
        // Reverse direction
        for (let i = lineStationList.length - 1; i >= 0; i--) {
            const stationId = lineStationList[i];
            const station = stations[stationId];
            const reverseIndex = lineStationList.length - 1 - i;
            const isCurrent = reverseIndex === train.stationIndex;
            const isPassed = reverseIndex < train.stationIndex;
            const isNext = reverseIndex === train.stationIndex + 1;
            
            routeHTML += `
                <div class="route-station ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''} ${isNext ? 'next' : ''}">
                    <div class="station-dot"></div>
                    <div class="station-name">${currentLanguage === 'ar' ? station.name : station.nameEn}</div>
                    ${isCurrent && train.isAtStation ? `<div class="station-status">${currentLanguage === 'ar' ? 'في المحطة' : 'At Station'}</div>` : ''}
                    ${isCurrent && !train.isAtStation ? `<div class="station-status">${currentLanguage === 'ar' ? 'مغادر' : 'Departed'}</div>` : ''}
                </div>
            `;
            
            if (i > 0) {
                routeHTML += '<div class="route-line"></div>';
            }
        }
    }
    routeHTML += '</div>';
    
    trackingContent.innerHTML = `
        <div class="tracking-info">
            <div class="info-row">
                <span class="info-label">${currentLanguage === 'ar' ? 'الحالة:' : 'Status:'}</span>
                <span class="info-value status ${train.status}">${getStatusText(train.status)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">${currentLanguage === 'ar' ? 'الموقع الحالي:' : 'Current Location:'}</span>
                <span class="info-value">${currentLanguage === 'ar' ? currentStation.name : currentStation.nameEn}</span>
            </div>
            <div class="info-row">
                <span class="info-label">${currentLanguage === 'ar' ? 'المحطة التالية:' : 'Next Station:'}</span>
                <span class="info-value">${currentLanguage === 'ar' ? nextStation.name : nextStation.nameEn}</span>
            </div>
            ${train.isAtStation ? `
            <div class="info-row">
                <span class="info-label">${currentLanguage === 'ar' ? 'المغادرة خلال:' : 'Departing in:'}</span>
                <span class="info-value countdown">${Math.max(0, 7 - Math.floor((Date.now() - train.lastStationTime) / 1000))}s</span>
            </div>
            ` : `
            <div class="info-row">
                <span class="info-label">${currentLanguage === 'ar' ? 'الوصول خلال:' : 'Arriving in:'}</span>
                <span class="info-value countdown">${Math.max(0, Math.ceil(((train.line === 'agha-zeralda' ? 20000 : 5000) - (Date.now() - train.lastStationTime)) / 1000))}s</span>
            </div>
            `}
        </div>
        ${routeHTML}
    `;
}

function focusMapOnTrainRoute(train) {
    if (!map) return;
    
    // Clear existing markers and routes
    stationMarkers.forEach(marker => map.removeLayer(marker));
    routeLines.forEach(line => map.removeLayer(line));
    stationMarkers = [];
    routeLines = [];
    
    // Show only stations for this train's line
    const lineStationList = lineStations[train.line];
    const bounds = L.latLngBounds();
    
    lineStationList.forEach(stationId => {
        const station = stations[stationId];
        bounds.extend([station.lat, station.lng]);
        
        const marker = L.marker([station.lat, station.lng])
            .bindPopup(`
                <div class="station-popup">
                    <h4>${currentLanguage === 'ar' ? station.name : station.nameEn}</h4>
                    <p>Code: ${station.code}</p>
                    <p>Line: ${station.line}</p>
                </div>
            `)
            .addTo(map);
        stationMarkers.push(marker);
    });
    
    // Add route line for this train's line
    const routeCoords = lineStationList.map(stationId => 
        [stations[stationId].lat, stations[stationId].lng]
    );
    
    const routeStyles = {
        'agha-zeralda': { color: '#10b981', weight: 6, opacity: 1 },
        'oran-agha': { color: '#2563eb', weight: 6, opacity: 1 }
    };
    
    const routeLine = L.polyline(routeCoords, routeStyles[train.line]).addTo(map);
    routeLines.push(routeLine);
    
    // Fit map to route bounds
    map.fitBounds(bounds, { padding: [20, 20] });
}

function getStatusText(status) {
    const statusTexts = {
        'on-time': currentLanguage === 'ar' ? 'في الوقت' : 'On Time',
        'delayed': currentLanguage === 'ar' ? 'متأخر' : 'Delayed',
        'boarding': currentLanguage === 'ar' ? 'صعود' : 'Boarding',
        'moving': currentLanguage === 'ar' ? 'متحرك' : 'Moving',
        'arrived': currentLanguage === 'ar' ? 'وصل' : 'Arrived',
        'cancelled': currentLanguage === 'ar' ? 'ملغي' : 'Cancelled'
    };
    return statusTexts[status] || status;
}

/**
 * CORRECTED bookTrain FUNCTION
 * Initiates the booking process for a train.
 * Can handle a full journey or a specific route from search results.
 * @param {string} trainId - The ID of the train to book.
 * @param {string|null} fromStationId - The departure station ID (from search).
 * @param {string|null} toStationId - The arrival station ID (from search).
 */
function bookTrain(trainId, fromStationId = null, toStationId = null) {
    const train = sampleTrains.find(t => t.id === trainId);
    if (!train) return;
    
    // Create a copy of the train data to avoid modifying the original object
    currentTrainData = { ...train };
    
    if (fromStationId && toStationId) {
        // Journey is from search results
        currentTrainData.fromStation = fromStationId;
        currentTrainData.toStation = toStationId;
    } else {
        // Full journey from the main departures board
        const fullJourney = getFromToStations(train);
        currentTrainData.fromStation = fullJourney.from;
        currentTrainData.toStation = fullJourney.to;
    }
    
    showPaymentPage(currentTrainData);
}


/**
 * CORRECTED showPaymentPage FUNCTION
 * Displays the payment page with details for the selected journey.
 * @param {object} trainData - The train data object, including from/to stations.
 */
function showPaymentPage(trainData) {
    const fromStation = stations[trainData.fromStation];
    const toStation = stations[trainData.toStation];
    
    // Get the specific timetable for the selected train
    const timetable = trainTimetable[trainData.line]?.[trainData.number];
    if (!timetable) {
        console.error(`Timetable not found for train ${trainData.number}`);
        return;
    }
    
    // Dynamically find departure and arrival times from the timetable
    const departureTime = timetable[trainData.fromStation];
    const arrivalTime = timetable[trainData.toStation];
    
    // Calculate duration and price dynamically
    const duration = calculateDuration(departureTime, arrivalTime);
    const price = calculatePrice(trainData.fromStation, trainData.toStation, trainData.line);
    
    // Update trip details on the payment page
    document.getElementById('tripDetails').innerHTML = `
        <div class="trip-route">
            <div class="trip-station">
                <div class="station-name">${currentLanguage === 'ar' ? fromStation.name : fromStation.nameEn}</div>
                <div class="station-time">${departureTime}</div>
            </div>
            <div class="trip-arrow">→</div>
            <div class="trip-station">
                <div class="station-name">${currentLanguage === 'ar' ? toStation.name : toStation.nameEn}</div>
                <div class="station-time">${arrivalTime}</div>
            </div>
        </div>
        <div class="trip-info">
            <div class="trip-info-item">
                <span>${currentLanguage === 'ar' ? 'رقم القطار:' : 'Train Number:'}</span>
                <span>${trainData.number}</span>
            </div>
            <div class="trip-info-item">
                <span>${currentLanguage === 'ar' ? 'المدة:' : 'Duration:'}</span>
                <span>${duration}</span>
            </div>
            <div class="trip-info-item">
                <span>${currentLanguage === 'ar' ? 'المنصة:' : 'Platform:'}</span>
                <span>${trainData.platform}</span>
            </div>
            <div class="trip-info-item">
                <span>${currentLanguage === 'ar' ? 'السعر:' : 'Price:'}</span>
                <span>${price} DA</span>
            </div>
        </div>
    `;
    
    // Update total amount
    document.getElementById('totalAmount').textContent = `${price} DA`;
    
    showPage('payment');
}


function setupPaymentHandlers() {
    document.getElementById('paymentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        processPayment();
    });
}

function processPayment() {
    // Simulate payment processing
    const payBtn = document.querySelector('.pay-btn');
    const originalText = payBtn.innerHTML;
    
    payBtn.disabled = true;
    payBtn.innerHTML = `
        <div class="animate-spin" style="width: 20px; height: 20px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%;"></div>
        <span>${currentLanguage === 'ar' ? 'جاري المعالجة...' : 'Processing...'}</span>
    `;
    
    setTimeout(() => {
        payBtn.disabled = false;
        payBtn.innerHTML = originalText;
        
        // Update ticket with form data
        updateTicketData();
        showPage('ticket');
    }, 2000);
}

/**
 * CORRECTED updateTicketData FUNCTION
 * Updates the final ticket with dynamic journey data.
 */
function updateTicketData() {
    if (!currentTrainData) return;
    
    const passengerName = document.getElementById('passengerName').value || 'BENJAMIN SHAH';
    const fromStation = stations[currentTrainData.fromStation];
    const toStation = stations[currentTrainData.toStation];
    
    // Get the specific timetable for the selected train
    const timetable = trainTimetable[currentTrainData.line]?.[currentTrainData.number];
    if (!timetable) {
        console.error(`Timetable not found for train ${currentTrainData.number}`);
        return;
    }

    // Dynamically find departure and arrival times
    const departureTime = timetable[currentTrainData.fromStation];
    const arrivalTime = timetable[currentTrainData.toStation];
    const duration = calculateDuration(departureTime, arrivalTime);
    const price = calculatePrice(currentTrainData.fromStation, currentTrainData.toStation, currentTrainData.line);
    
    // Update ticket information
    document.getElementById('ticketPassenger').textContent = passengerName.toUpperCase();
    document.getElementById('ticketTrain').textContent = currentTrainData.number;
    document.getElementById('fromCode').textContent = fromStation.code;
    document.getElementById('fromName').textContent = currentLanguage === 'ar' ? fromStation.name : fromStation.nameEn;
    document.getElementById('toCode').textContent = toStation.code;
    document.getElementById('toName').textContent = currentLanguage === 'ar' ? toStation.name : toStation.nameEn;
    document.getElementById('departureTime').textContent = departureTime;
    document.getElementById('arrivalTime').textContent = arrivalTime;
    document.getElementById('journeyDuration').textContent = duration;
    document.getElementById('ticketDate').textContent = new Date().toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: '2-digit' 
    }).toUpperCase();
    document.getElementById('ticketSeat').textContent = 'B5';
    document.getElementById('ticketPrice').textContent = `${price} DA`;
    document.getElementById('ticketClass').textContent = 'Economy';
    
    // Generate booking reference
    const bookingRef = 'ALG' + new Date().getFullYear() + 
                      String(new Date().getMonth() + 1).padStart(2, '0') + 
                      String(new Date().getDate()).padStart(2, '0') + 
                      String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    document.getElementById('bookingRef').textContent = bookingRef;
}


function showPage(page) {
    // Hide all pages
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('paymentPage').style.display = 'none';
    document.getElementById('ticketPage').style.display = 'none';
    
    // Show selected page
    switch(page) {
        case 'main':
            document.getElementById('mainContent').style.display = 'block';
            break;
        case 'payment':
            document.getElementById('paymentPage').style.display = 'block';
            break;
        case 'ticket':
            document.getElementById('ticketPage').style.display = 'block';
            break;
    }
}

function handleSearch() {
    const fromStation = document.getElementById('fromStation').value;
    const toStation = document.getElementById('toStation').value;
    const travelDate = document.getElementById('travelDate').value;
    
    if (!fromStation || !toStation) {
        alert(currentLanguage === 'ar' ? 'يرجى اختيار محطتي المغادرة والوصول' : 'Please select departure and arrival stations');
        return;
    }
    
    if (fromStation === toStation) {
        alert(currentLanguage === 'ar' ? 'محطة المغادرة والوصول لا يمكن أن تكون نفسها' : 'Departure and arrival stations cannot be the same');
        return;
    }
    
    // Filter trains based on search criteria
    const filteredTrains = sampleTrains.filter(train => {
        const lineStationList = lineStations[train.line];
        const fromIndex = lineStationList.indexOf(fromStation);
        const toIndex = lineStationList.indexOf(toStation);
        
        // Check if both stations are on the same line and in correct order
        return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
    });
    
    displaySearchResults(filteredTrains, fromStation, toStation);
}

/**
 * CORRECTED displaySearchResults FUNCTION
 * Displays filtered train results based on user search.
 * @param {Array} trains - The array of trains matching the criteria.
 * @param {string} fromStation - The selected departure station ID.
 * @param {string} toStation - The selected arrival station ID.
 */
function displaySearchResults(trains, fromStation, toStation) {
    const resultsSection = document.getElementById('searchResults');
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');
    
    // Find all available trains from the main timetable, not just sampleTrains
    const allAvailableTrains = [];
    if (trainTimetable['oran-agha']) {
        for (const trainNumber in trainTimetable['oran-agha']) {
            const timetable = trainTimetable['oran-agha'][trainNumber];
            if (timetable[fromStation] && timetable[toStation]) {
                 // Find a base train object from sampleTrains to clone, or create a default
                let baseTrain = sampleTrains.find(t => t.number === trainNumber);
                if (!baseTrain) {
                    baseTrain = {
                        id: `T-${trainNumber}`,
                        line: 'oran-agha',
                        direction: 'forward',
                        status: 'on-time',
                        delay: 0,
                        platform: 'C',
                        stationIndex: 0,
                        lastStationTime: Date.now(),
                        isAtStation: false,
                        finished: false
                    };
                }
                 allAvailableTrains.push({ ...baseTrain, number: trainNumber });
            }
        }
    }


    resultsCount.textContent = `${allAvailableTrains.length} ${currentLanguage === 'ar' ? 'نتيجة' : 'results'}`;
    resultsGrid.innerHTML = '';
    
    if (allAvailableTrains.length === 0) {
        resultsGrid.innerHTML = `
            <div class="no-results">
                <p>${currentLanguage === 'ar' ? 'لا توجد قطارات متاحة لهذا المسار' : 'No trains available for this route'}</p>
            </div>
        `;
    } else {
        allAvailableTrains.forEach(train => {
            const fromStationData = stations[fromStation];
            const toStationData = stations[toStation];
            
            const timetable = trainTimetable[train.line][train.number];
            
            const departureTime = timetable[fromStation];
            const arrivalTime = timetable[toStation];
            
            const duration = calculateDuration(departureTime, arrivalTime);
            const price = calculatePrice(fromStation, toStation, train.line);
            
            const card = document.createElement('div');
            card.className = 'result-card fade-in';
            card.innerHTML = `
                <div class="result-header">
                    <div class="result-route">
                        <span class="result-station">${currentLanguage === 'ar' ? fromStationData.name : fromStationData.nameEn}</span>
                        <span class="result-arrow">→</span>
                        <span class="result-station">${currentLanguage === 'ar' ? toStationData.name : toStationData.nameEn}</span>
                    </div>
                    <div class="status ${train.status}">${getStatusText(train.status)}</div>
                </div>
                
                <div class="result-details">
                    <div class="result-detail">
                        <div class="result-detail-label">${currentLanguage === 'ar' ? 'المغادرة' : 'Departure'}</div>
                        <div class="result-detail-value">${departureTime}</div>
                    </div>
                    <div class="result-detail">
                        <div class="result-detail-label">${currentLanguage === 'ar' ? 'الوصول' : 'Arrival'}</div>
                        <div class="result-detail-value">${arrivalTime}</div>
                    </div>
                    <div class="result-detail">
                        <div class="result-detail-label">${currentLanguage === 'ar' ? 'المدة' : 'Duration'}</div>
                        <div class="result-detail-value">${duration}</div>
                    </div>
                    <div class="result-detail">
                        <div class="result-detail-label">${currentLanguage === 'ar' ? 'السعر' : 'Price'}</div>
                        <div class="result-detail-value">${price} DA</div>
                    </div>
                </div>
                
                <button class="book-btn" onclick="bookTrain('${train.id}', '${fromStation}', '${toStation}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    </svg>
                    <span>${currentLanguage === 'ar' ? 'احجز الآن' : 'Book Now'}</span>
                </button>
            `;
            
            resultsGrid.appendChild(card);
        });
    }
    
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}


function swapStations() {
    const fromSelect = document.getElementById('fromStation');
    const toSelect = document.getElementById('toStation');
    
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
}

function centerMap() {
    if (!map) return;
    
    map.setView([36.7538, 3.0588], 6);
}

function downloadTicket() {
    // Simple download simulation
    const ticketData = {
        passenger: document.getElementById('ticketPassenger').textContent,
        train: document.getElementById('ticketTrain').textContent,
        from: document.getElementById('fromName').textContent,
        to: document.getElementById('toName').textContent,
        departure: document.getElementById('departureTime').textContent,
        arrival: document.getElementById('arrivalTime').textContent,
        date: document.getElementById('ticketDate').textContent,
        seat: document.getElementById('ticketSeat').textContent,
        price: document.getElementById('ticketPrice').textContent,
        bookingRef: document.getElementById('bookingRef').textContent
    };
    
    const dataStr = JSON.stringify(ticketData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${ticketData.bookingRef}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success message
    alert(currentLanguage === 'ar' ? 'تم تحميل التذكرة بنجاح' : 'Ticket downloaded successfully');
}

// Make functions globally available
window.bookTrain = bookTrain;
window.trackTrain = trackTrain;
window.stopTracking = stopTracking;
window.closeAIAssistant = closeAIAssistant;
window.getAIRecommendation = getAIRecommendation;