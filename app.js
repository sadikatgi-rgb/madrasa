// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDgWlTlsbkqIo2xQFf-UI6fE6X1KeyI9-U",
    authDomain: "madrasa-acf90.firebaseapp.com",
    projectId: "madrasa-acf90",
    storageBucket: "madrasa-acf90.firebasestorage.app",
    messagingSenderId: "128246256646",
    appId: "1:128246256646:web:49e41f5f8d16340550df87",
    measurementId: "G-3FHMCRGX0W"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
// 1. മാസങ്ങളുടെ ക്രമം (ഇത് മാറില്ല)
const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// 2. ഇന്നത്തെ തീയതിയും മാസവും കൃത്യമായി എടുക്കുന്നു
const now = new Date();
const currentMonthName = monthsOrder[now.getMonth()]; // ഉദാ: "Apr"
const currentMonthIdx = now.getMonth(); // ഉദാ: 3 (ഏപ്രിൽ ആണെങ്കിൽ)

// 1. പേജ് തുറക്കുമ്പോൾ തന്നെ ലോഗിൻ പരിശോധിക്കാൻ (One-Time Login)
window.onload = function() {
    const savedUser = localStorage.getItem("activeUser");
    
    const loginPage = document.getElementById('login-page');
    const dashboard = document.getElementById('main-dashboard');

    if (savedUser) {
        // ലോഗിൻ വിവരങ്ങൾ ഉണ്ടെങ്കിൽ ഉള്ളിലേക്ക്
        applyPermissions(JSON.parse(savedUser));
    } else {
        // ലോഗിൻ ഇല്ലെങ്കിൽ ലോഗിൻ പേജ് കാണിക്കുന്നു
        if (loginPage) loginPage.style.display = 'block';
        if (dashboard) dashboard.style.display = 'none';
    }
};

const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


// 2. ലോഗിൻ ഫങ്ക്ഷൻ
async function loginUser() {
    const userID = document.getElementById('login-id').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!userID || !pass) { alert("ഐഡിയും പാസ്‌വേഡും നൽകുക"); return; }
    
    let email = userID.toLowerCase() + "@islahululoom.com";
    try {
        const res = await auth.signInWithEmailAndPassword(email, pass);
        checkUser(res.user.uid);
    } catch (e) { alert("ലോഗിൻ പരാജയപ്പെട്ടു: " + e.message); }
}

// 3. യൂസർ വിവരങ്ങൾ ഡാറ്റാബേസിൽ നിന്ന് ശേഖരിക്കാൻ
async function checkUser(uid) {
    try {
        const doc = await db.collection("users").doc(uid).get();
        if (doc.exists) {
            const userData = doc.data();
            // വിവരങ്ങൾ ഫോണിൽ സേവ് ചെയ്യുന്നു
            localStorage.setItem("activeUser", JSON.stringify(userData)); 
            applyPermissions(userData);
        } else {
            alert("യൂസർ വിവരങ്ങൾ ലഭ്യമല്ല!");
        }
    } catch (error) { 
        alert("ലോഗിൻ പിശക്: " + error.message); 
    }
}

// 1. ലോഗിൻ ചെയ്ത ഉടനെ റോൾ അനുസരിച്ച് നിയന്ത്രണങ്ങൾ നൽകാൻ
function applyPermissions(user) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'block';
    document.getElementById('display-name').innerText = user.name;
    
    const roleLabel = document.getElementById('display-role');
    if(roleLabel) roleLabel.innerText = user.role || "User";

    const usthadView = document.getElementById('usthad-view');
    const studentView = document.getElementById('student-view');
    
    // HTML-ൽ നൽകിയ muallim-btn id ഇവിടെ എടുക്കുന്നു
    const muallimBtn = document.getElementById('muallim-btn');

    // റോൾ 'Sadhar' ആണോ എന്ന് നോക്കുന്നു
    const isSadhar = (user.role === 'Sadhar');

    if (isSadhar || user.role === 'Usthad') {
        usthadView.style.display = 'block';
        studentView.style.display = 'none';

        // സദറിന് മാത്രം മുഅല്ലിം വിഹിതം കാണിക്കുന്നു
        if (muallimBtn) {
            muallimBtn.style.display = isSadhar ? 'block' : 'none';
        }

        const reportBtn = document.getElementById('report-btn');
        if (reportBtn) reportBtn.style.display = 'block';

        const guruBtn = document.getElementById('gurunidhi-btn');
        if (guruBtn) guruBtn.style.display = 'block';

        // ലോഡിംഗ് ലോജിക്
        if (user.role === 'Usthad') {
            if (typeof loadStudents === "function") loadStudents(user.assignedClass);
        } else {
            if (typeof loadStudents === "function") loadStudents('all'); 
        }
    } else {
        usthadView.style.display = 'none';
        studentView.style.display = 'block';
    }
}

// 1. എല്ലാ സെക്ഷനുകളും മറയ്ക്കാനുള്ള ഫംഗ്ഷൻ (പേര് കൃത്യമായി ശ്രദ്ധിക്കുക)
function hideAllSections() {
    const sections = ['dynamic-content', 'usthad-dashboard', 'sadar-wrapper'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
        }
    });
}

// 2. മെയിൻ സെക്ഷൻ സ്വിച്ചർ
function showSection(section) {
    // ഇവിടെ ചെറിയ അക്ഷരത്തിൽ തന്നെ വിളിക്കുക
    hideAllSections(); 
    
    const content = document.getElementById('dynamic-content');
    const dashboard = document.getElementById('usthad-dashboard');
    
    // ലോഗിൻ ചെയ്ത യൂസറുടെ വിവരങ്ങൾ എടുക്കുന്നു
    const user = JSON.parse(localStorage.getItem("activeUser")) || { role: 'Guest' };

    if (dashboard) dashboard.style.display = 'none';
    
    if (content) {
        content.style.display = 'block';
        content.style.pointerEvents = 'auto'; // ടച്ച് ഉറപ്പാക്കാൻ
        content.innerHTML = ''; 
    }

    // എല്ലാ പേജിലും കാണേണ്ട പൊതുവായ "തിരികെ" ബട്ടൺ
    const backBtnHTML = `
        <div style="display:flex; justify-content:flex-end; padding: 10px 15px; position: relative; z-index: 1001;">
            <button onclick="closeSadharSection()" style="background:#6c757d; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:5px; pointer-events: auto;">
                <i class="fas fa-arrow-left"></i> തിരികെ
            </button>
        </div>`;

    if (section === 'sadhar') {
        if (user.role === 'Sadhar' || user.role === 'Admin') {
            if (typeof openSadharSection === "function") openSadharSection(); 
        } else {
            content.innerHTML = backBtnHTML + `<div style="padding:20px; text-align:center; color:red; font-weight:bold;">ഈ സെക്ഷൻ സദറിന് മാത്രമുള്ളതാണ്!</div>`;
        }
    }
    else if (section === 'student-list') {
        content.innerHTML = backBtnHTML + `<div id="list-area" style="padding:10px;">ലോഡിംഗ്...</div>`;
        if (typeof loadStudents === "function") loadStudents(user.role === 'Sadhar' ? 'all' : user.assignedClass);
    }
    else if (section === 'gurunidhi') {
        content.innerHTML = backBtnHTML + `<div id="gurunidhi-container" style="padding:10px;"></div>`;
        if (typeof showGurunidhiSection === "function") showGurunidhiSection(); 
    }
    else if (section === 'report') {
        content.innerHTML = backBtnHTML + `<div id="report-container" style="padding:10px;"></div>`;
        if (typeof showCollectionReport === "function") showCollectionReport(); 
    }
    else if (section === 'add-student') {
        // ഇവിടെ backBtnHTML മുകളിൽ നൽകി, അപ്പോൾ എളുപ്പത്തിൽ ടച്ച് ചെയ്യാം
        content.innerHTML = backBtnHTML + `
            <div style="padding:15px; background:white; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1); margin:10px; position: relative; z-index: 1000;">
                <h3 style="color:#1a73e8; text-align:center; border-bottom:2px solid #eef2f7; padding-bottom:10px;">🆕 പുതിയ വിദ്യാർത്ഥി</h3>
                
                <label style="font-size:12px; font-weight:bold; color:#555;">വിദ്യാർത്ഥിയുടെ വിവരം:</label>
                <input id="n-name" placeholder="കുട്ടിയുടെ പേര്" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px; box-sizing:border-box;">
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <input id="n-class" placeholder="ക്ലാസ്സ് (eg: 1, 2..)" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px; box-sizing:border-box;">
                    <input id="n-phone" placeholder="വാട്ട്സാപ്പ് നമ്പർ" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px; box-sizing:border-box;">
                </div>

                <input id="n-father" placeholder="പിതാവിന്റെ പേര്" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px; box-sizing:border-box;">
                <input id="n-house" placeholder="വീട്ടുപേര്" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px; box-sizing:border-box;">

                <div id="sibling-container" style="background:#f0f7ff; padding:10px; border-radius:10px; margin-bottom:12px; border:1px solid #cfe2ff;">
                    <p style="font-size:12px; color:#084298; margin-bottom:8px; font-weight:bold;">സഹോദരങ്ങൾ (മദ്രസയിൽ പഠിക്കുന്നവർ):</p>
                    <div id="sibling-list"></div>
                    <button onclick="addSiblingFieldWithFee()" style="background:#28a745; margin-top:5px; font-size:12px; padding:10px; color:white; border:none; border-radius:8px; width:100%; cursor:pointer;">+ ഒരാളെ കൂടി ചേർക്കുക</button>
                </div>

                <div style="background:#fff3cd; padding:10px; border-radius:8px; margin-bottom:15px; border:1px solid #ffeeba; text-align:center;">
                    <label style="font-size:11px; color:#856404; font-weight:bold;">പ്രതിമാസ വരിസംഖ്യ:</label>
                    <div style="font-size:20px; font-weight:bold; color:#856404;">₹ <span id="display-calculated-fee">250</span></div>
                    <input id="n-monthly-fee" type="hidden" value="250">
                </div>

                <div style="background:#f8f9fa; padding:15px; border-radius:10px; margin-bottom:15px; border:1px solid #e9ecef;">
                    <p style="font-size:13px; font-weight:bold; color:#495057; margin-bottom:8px;">📅 അധ്യയന വർഷം ക്രമീകരണം:</p>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <select id="n-fee-months" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ced4da;">
                            <option value="12" selected>12 മാസം</option>
                            <option value="11">11 മാസം</option>
                        </select>
                        <select id="n-start-month" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ced4da;">
                            <option value="" disabled selected>തുടങ്ങുന്ന മാസം</option>
                            <option value="Jan">January</option>
                            <option value="Feb">February</option>
                            <option value="Mar">March</option>
                            <option value="Apr">April</option>
                            <option value="May">May</option>
                            <option value="Jun">June</option>
                        </select>
                    </div>
                </div>

                <label style="font-size:11px; color:#6c757d;">പഴയ ബാക്കി (ഉണ്ടെങ്കിൽ):</label>
                <input id="n-fees" type="number" placeholder="0" style="width:100%; padding:12px; margin-bottom:20px; border:1px solid #dee2e6; border-radius:8px; box-sizing:border-box;">
                
                <button onclick="saveStudent()" style="width:100%; padding:15px; background:#1a73e8; color:white; border:none; border-radius:10px; font-weight:bold; font-size:16px; cursor:pointer;">സേവ് ചെയ്യുക</button>
            </div>`;
    }
}

// 3. തിരികെ പോകാനുള്ള ഫങ്ക്ഷൻ (ഉണ്ടെന്ന് ഉറപ്പാക്കുക)
function closeSadharSection() {
    hideAllSections();
    const dashboard = document.getElementById('usthad-dashboard');
    if (dashboard) dashboard.style.display = 'block';
}

// ഈ താഴെ പറയുന്ന ഫങ്ക്ഷനുകൾ showSection-ന് വെളിയിൽ ആയിരിക്കണം എഴുതേണ്ടത്.
function addSiblingFieldWithFee() {
    const container = document.getElementById('sibling-list');
    const siblingDiv = document.createElement('div');
    siblingDiv.style = "display: grid; grid-template-columns: 2fr 1fr auto; gap: 8px; margin-bottom: 10px; align-items: center;";
    
    siblingDiv.innerHTML = `
        <input class="sib-name-input" placeholder="പേര്" style="padding:10px; border:1px solid #dee2e6; border-radius:6px; font-size:13px;">
        <input type="number" class="sib-class-input" placeholder="ക്ലാസ്" style="padding:10px; border:1px solid #dee2e6; border-radius:6px; font-size:13px;">
        <button onclick="removeSibling(this)" style="background:#dc3545; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer;"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(siblingDiv);
    updateCalculatedFee();
}

function updateCalculatedFee() {
    const siblingCount = document.querySelectorAll('.sib-name-input').length;
    const baseFee = 250;
    const totalFee = baseFee + (siblingCount * 50);
    const displayElement = document.getElementById('display-calculated-fee');
    const feeInput = document.getElementById('n-monthly-fee');
    
    if (displayElement) displayElement.innerText = totalFee;
    if (feeInput) feeInput.value = totalFee;
}

function removeSibling(btn) {
    btn.parentElement.remove();
    updateCalculatedFee();
}

function openSadharSection() {
    const dashboard = document.getElementById('usthad-dashboard');
    const contentArea = document.getElementById('dynamic-content');
    
    // 1. ഡാഷ്‌ബോർഡ് മറയ്ക്കുകയും കണ്ടന്റ് ഏരിയ കാണിക്കുകയും ചെയ്യുന്നു
    if (dashboard) dashboard.style.display = 'none';
    if (contentArea) {
        contentArea.style.display = 'block'; // സെക്ഷൻ കാണിക്കുന്നുണ്ടെന്ന് ഉറപ്പുവരുത്തുന്നു
        contentArea.innerHTML = ''; 
    }

    const backBtnHTML = `
        <div style="display:flex; justify-content:center; padding: 25px 10px; margin-top: 20px;">
            <button onclick="closeSadharSection()" style="background:#6c757d; color:white; border:none; padding:15px; border-radius:12px; cursor:pointer; font-weight:bold; width:100%; max-width:400px; display:flex; align-items:center; justify-content:center; gap:10px; font-size:16px;">
                <i class="fas fa-arrow-left"></i> ഡാഷ്‌ബോർഡിലേക്ക് തിരികെ
            </button>
        </div>`;

    contentArea.innerHTML = `
        <div id="sadhar-wrapper" style="padding: 5px;">
            <div class="sadar-container" style="background:white; padding:20px; border-radius:15px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3 style="margin:0; color:#1a73e8;">ഉസ്താദുമാരുടെ വിഹിതം (Sadhar)</h3>
                </div>
                
                <div class="input-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="input-group">
                        <label style="display:block; font-weight:bold; margin-bottom:5px; font-size:13px;">വിഹിതം ഇനം:</label>
                        <select id="contribution-type" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                            <option value="District">ജില്ലാ വിഹിതം</option>
                            <option value="State">സ്റ്റേറ്റ് വിഹിതം</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label style="display:block; font-weight:bold; margin-bottom:5px; font-size:13px;">തീയതി:</label>
                        <input type="date" id="m-date" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                    </div>
                    <div class="input-group">
                        <label style="display:block; font-weight:bold; margin-bottom:5px; font-size:13px;">Reg. No:</label>
                        <input type="text" id="m-reg" placeholder="Reg. No" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                    </div>
                    <div class="input-group">
                        <label style="display:block; font-weight:bold; margin-bottom:5px; font-size:13px;">MSR No:</label>
                        <input type="text" id="m-msr" placeholder="MSR No" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                    </div>
                    <div class="input-group" style="grid-column: span 2;">
                        <label style="display:block; font-weight:bold; margin-bottom:5px; font-size:13px;">ഉസ്താദിന്റെ പേര്:</label>
                        <input type="text" id="m-name" placeholder="Name" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                    </div>
                    <div class="input-group">
                        <label style="display:block; font-weight:bold; margin-bottom:5px; font-size:13px;">ശമ്പളം (മാസം):</label>
                        <input type="number" id="m-salary" oninput="calculateContribution()" placeholder="Salary" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;">
                    </div>
                    <div class="input-group">
                        <label style="display:block; font-weight:bold; margin-bottom:5px; font-size:13px;">വിഹിതം (ദിവസം):</label>
                        <input type="number" id="m-contribution" readonly style="width:100%; padding:10px; border:1px solid #f44336; border-radius:8px; background:#fff5f5; color:#f44336; font-weight:bold;">
                    </div>
                </div>

                <div class="input-group" style="margin-top: 15px;">
                    <label style="display:block; font-weight:bold; margin-bottom:5px; font-size:13px;">Remarks:</label>
                    <textarea id="m-remarks" rows="2" placeholder="കുറിപ്പുകൾ ഉണ്ടെങ്കിൽ..." style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;"></textarea>
                </div>

                <button onclick="saveMuallimData()" id="save-btn" style="width:100%; margin-top:20px; background:#1a73e8; color:white; padding:15px; border:none; border-radius:10px; font-weight:bold; cursor:pointer; font-size:16px;">
                    വിവരങ്ങൾ സേവ് ചെയ്യുക
                </button>
            </div>

            <div class="history-container" style="margin-top: 25px; background:white; padding:15px; border-radius:15px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
                <div class="history-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                    <h3 style="margin:0; font-size:15px;">വിഹിതം ഹിസ്റ്ററി</h3>
                    <select id="history-year-filter" onchange="loadMuallimHistory()" style="padding:5px; border-radius:5px; border:1px solid #ddd;">
                       <option value="2026">2026</option>
                       <option value="2027">2027</option>
                    </select>
                </div>
                <div id="muallim-history-list"></div>
            </div>

            ${backBtnHTML}
        </div>`;
    
    if (typeof loadMuallimHistory === "function") loadMuallimHistory();
}

// ബാക്ക് ബട്ടൺ ഫംഗ്ഷൻ (Old Code-ന് അനുയോജ്യമായ രീതിയിൽ)
function closeSadharSection() {
    const dashboard = document.getElementById('usthad-dashboard');
    const content = document.getElementById('dynamic-content');
    
    if (dashboard) dashboard.style.display = 'block'; 
    if (content) {
        content.style.display = 'none'; 
        content.innerHTML = ''; 
    }
}
          
// 6. സഹോദരങ്ങളെ ചേർക്കാനുള്ള ഫീൽഡ്
function addSiblingField() {
    const container = document.getElementById('sibling-container');
    const div = document.createElement('div');
    div.style.display = 'flex'; div.style.gap = '5px'; div.style.marginBottom = '5px';
    div.innerHTML = `<input class="s-name" placeholder="പേര്" style="flex:2;"><input class="s-class" placeholder="ക്ലാസ്സ്" style="flex:1;">`;
    container.appendChild(div);
    
    // ഫീസ് അപ്‌ഡേറ്റ് ചെയ്യുന്നു
    const count = document.getElementsByClassName('s-name').length;
    document.getElementById('n-monthly-fee').value = 250 + ((count - 1) * 50);
}

// 3. സേവ് ഫങ്ക്ഷൻ
async function saveStudent() {
    const name = document.getElementById('n-name').value.trim();
    const cls = document.getElementById('n-class').value.trim();
    const father = document.getElementById('n-father').value.trim();
    const house = document.getElementById('n-house').value.trim();
    const phone = document.getElementById('n-phone').value.trim();
    const oldFees = Number(document.getElementById('n-fees').value) || 0;
    
    // --- മാറ്റം 1: അധ്യയന വർഷം തുടങ്ങുന്ന മാസം കൂടി ഇവിടെ എടുക്കുന്നു ---
    const startMonthInput = document.getElementById('n-start-month');
    const startMonth = startMonthInput ? startMonthInput.value : "May"; 

    const feeMonthsInput = document.getElementById('n-fee-months');
    const feeMonths = feeMonthsInput ? Number(feeMonthsInput.value) : 12; 

    if (!name || !cls || !phone) { 
        alert("പേര്, ക്ലാസ്സ്, ഫോൺ നമ്പർ എന്നിവ നിർബന്ധമാണ്!"); 
        return; 
    }

    let siblingsList = [];
    const sibNames = document.getElementsByClassName('s-name');
    const sibClasses = document.getElementsByClassName('s-class');
    for (let i = 0; i < sibNames.length; i++) {
        if (sibNames[i].value.trim() !== "") {
            siblingsList.push({ 
                name: sibNames[i].value.trim(), 
                class: sibClasses[i].value.trim() 
            });
        }
    }

    const mFee = 250 + (siblingsList.length * 50);

    let monthStatus = {};
    // ശ്രദ്ധിക്കുക: ഇവിടെ monthsOrder എന്ന് മാറ്റുന്നത് നന്നായിരിക്കും
    monthsOrder.forEach(m => { 
        monthStatus[m] = { paid: false, date: "-", amount: 0, rcpt: "-" }; 
    });

    const sid = name.toLowerCase().substring(0,3) + phone.slice(-4);

    try {
        await db.collection("students").add({
            name, 
            class: cls, 
            fatherName: father, 
            houseName: house,
            siblings: siblingsList, 
            parentPhone: phone, 
            studentID: sid,
            monthlyFee: mFee,
            
            // --- മാറ്റം 2: ഈ രണ്ട് വിവരങ്ങൾ ഫയർബേസിലേക്ക് അയക്കുന്നു ---
            startMonth: startMonth, // ക്ലാസ് തുടങ്ങുന്ന മാസം
            feeMonths: feeMonths,   // ആകെ ഫീസ് മാസങ്ങൾ
            
            balance: oldFees, 
            monthStatus: monthStatus, 
            addedDate: new Date().toLocaleDateString('en-IN'),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`വിജയകരമായി ചേർത്തു! ID: ${sid}`);
        showSection('student-list');
        
    } catch(e) { 
        console.error("Error adding student: ", e);
        alert("പിശക് സംഭവിച്ചു! ദയവായി വീണ്ടും ശ്രമിക്കുക."); 
    }
}

// 4. സ്റ്റുഡന്റ് ലിസ്റ്റ് (സഹോദരങ്ങളുടെ വിവരവും ഓൾഡ് ബാലൻസും ശരിയാക്കിയത്)
async function loadStudents(filterClass = 'all') {
    const savedUser = localStorage.getItem("activeUser");
    if (!savedUser) return;
    const user = JSON.parse(savedUser);

    const content = document.getElementById('dynamic-content');

    // എല്ലാ പേജിലും തിരികെ പോകാൻ Sticky ബാക്ക് ബട്ടൺ
    const backBtnHTML = `
        <div style="display:flex; justify-content:flex-end; padding: 10px 15px; position: sticky; top: 0; background: #fff; z-index: 1000; border-bottom: 1px solid #eee;">
            <button onclick="closeSadharSection()" style="background:#6c757d; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold; display:flex; align-items:center; gap:5px; pointer-events: auto;">
                <i class="fas fa-arrow-left"></i> തിരികെ
            </button>
        </div>`;

    let query = db.collection("students");
    let showFilter = false;

    if (user.role === 'Usthad') {
        filterClass = user.assignedClass; 
        query = query.where("class", "==", filterClass);
    } else if (user.role === 'Sadhar') {
        showFilter = true; 
        if (filterClass !== 'all') {
            query = query.where("class", "==", filterClass);
        }
    }

    let headerHTML = '';
    if (showFilter) {
        headerHTML = `
            <select onchange="loadStudents(this.value)" style="margin: 10px; width: calc(100% - 20px); padding:10px; border-radius:8px; border:1px solid #ddd; font-family:inherit;">
                <option value="all" ${filterClass === 'all' ? 'selected' : ''}>എല്ലാ ക്ലാസ്സും</option>
                ${[...Array(12).keys()].map(i => `<option value="${i+1}" ${filterClass == (i+1) ? 'selected' : ''}>ക്ലാസ്സ് ${i+1}</option>`).join('')}
            </select>`;
    } else {
        headerHTML = `<h3 style="text-align:center; color:#1a73e8; margin:15px 10px; background:#f8f9fa; padding:10px; border-radius:8px;">ക്ലാസ്സ് ${filterClass} - വിദ്യാർത്ഥികൾ</h3>`;
    }

    content.innerHTML = backBtnHTML + headerHTML + `<div id="list-area">ലോഡിംഗ്...</div>`;

    const snap = await query.get();
    const listArea = document.getElementById('list-area');
    listArea.innerHTML = "";

    let paidList = [];
    let unpaidList = [];

    snap.forEach(doc => {
        const s = doc.data();
        
        // --- 1. സഹോദരങ്ങളുടെ വിവരങ്ങൾ മനോഹരമായി കാണിക്കാൻ (ബോക്സ് ഡിസൈൻ) ---
        let siblingsArray = s.siblings || [];
        let sibCount = siblingsArray.length;
        let siblingDetailsHTML = '';
        if (sibCount > 0) {
            siblingDetailsHTML = `
                <div style="font-size:11px; color:#555; margin-top:5px; padding:8px; background:#f0f7ff; border-radius:8px; border: 1px dashed #abc; line-height:1.4;">
                    <i class="fas fa-users"></i> <b>സഹോദരങ്ങൾ:</b> ${siblingsArray.map(sib => `${sib.name} (${sib.class})`).join(', ')}
                </div>`;
        }

        // --- 2. ഫീസ് കണക്കുകൂട്ടൽ രീതി (Base 250 + 50 per sibling) ---
        const baseFee = 250;
        const additionalFee = sibCount * 50;
        const currentMonthlyFee = baseFee + additionalFee;

        const startMonthName = s.startMonth || "May"; 
        const startMonthIdx = monthsOrder.indexOf(startMonthName);

        let unpaidCount = 0;
        monthsOrder.forEach((m, idx) => {
            if (idx >= startMonthIdx && idx <= currentMonthIdx) {
                const isPaid = s.monthStatus && s.monthStatus[m]?.paid;
                if (!isPaid) unpaidCount++;
            }
        });

        if (unpaidCount === 0) paidList.push(s.name); else unpaidList.push(s.name);

        let monthTableHTML = `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin: 10px 0; font-size: 10px;">`;
        monthsOrder.forEach((m, index) => {
            const isPaid = s.monthStatus && s.monthStatus[m]?.paid;
            const isAcademicMonth = index >= startMonthIdx && index <= currentMonthIdx;
            monthTableHTML += `
                <div style="border: 1px solid #ddd; padding: 4px; text-align: center; border-radius:3px; background: ${isPaid ? '#e8f5e9' : (isAcademicMonth ? '#fff' : '#f5f5f5')}">
                    <b style="color: ${isPaid ? 'green' : (isAcademicMonth ? '#777' : '#bbb')}">${m}</b><br>
                    <span style="font-size:8px;">${isPaid ? s.monthStatus[m].date : (isAcademicMonth ? '-' : 'N/A')}</span>
                </div>`;
        });
        monthTableHTML += `</div>`;

        const pendingMonthsFee = unpaidCount * currentMonthlyFee;
        const oldBal = Number(s.balance) || 0;
        const totalPending = pendingMonthsFee + oldBal;

        // --- 3. സ്റ്റുഡന്റ് കാർഡ് ഡിസൈൻ ---
        listArea.innerHTML += `
            <div class="student-item" style="position:relative; background:white; padding:15px; margin:10px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border-left:5px solid #1a73e8;">
                <div style="position:absolute; right:10px; top:10px;">
                    ${(user.role === 'Sadhar' || (user.role === 'Usthad' && user.assignedClass == s.class)) ? `
                        <i class="fas fa-edit" onclick="editStudent('${doc.id}')" style="color:blue; cursor:pointer; margin-right:15px; font-size:18px;"></i>
                        <i class="fas fa-trash" onclick="deleteStudent('${doc.id}')" style="color:red; cursor:pointer; font-size:18px;"></i>
                    ` : ''}
                </div>
                <h4 style="margin:0 0 5px 0; color:#1a73e8; font-size:16px;">${s.name} (ക്ലാസ്: ${s.class})</h4>
                
                ${siblingDetailsHTML}
                <div style="font-size:11px; color:#666; margin:10px 0;">
                    <b>ID:</b> ${s.studentID} | <b>ഫീസ്:</b> ₹${currentMonthlyFee} 
                    <span style="font-size:9px; color:#999;">(${baseFee} + ${sibCount} \u00d7 50)</span>
                </div>

                ${monthTableHTML}
                
                <div style="background:#fff3f3; padding:12px; border-radius:10px; border:1px solid #ffebeb; margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px;">
                        <span>ബാക്കി മാസങ്ങൾ (${unpaidCount}):</span>
                        <b style="color:#d32f2f;">₹${pendingMonthsFee}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; padding-top:8px; border-top:1px dashed #ffdada;">
                        <span>പഴയ ബാക്കി: <b style="color:#d32f2f;">₹${oldBal}</b></span>
                        ${oldBal > 0 ? `<button onclick="payOldBalance('${doc.id}', '${s.parentPhone}', '${s.name}')" style="background:#d32f2f; color:white; border:none; padding:8px 15px; border-radius:6px; font-size:12px; cursor:pointer; font-weight:bold; pointer-events: auto;">Pay Old</button>` : ''}
                    </div>
                    <div style="text-align:right; margin-top:8px; font-weight:bold; border-top:1px solid #ffdada; padding-top:8px; color:#000; font-size:14px;">
                        ആകെ കുടിശ്ശിക: ₹${totalPending}
                    </div>
                </div>

                <div style="display:flex; gap:8px; margin-top:12px;">
                    <button onclick="payFee('${doc.id}')" style="flex:1; background:#28a745; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold;">Pay Month</button>
                    <button onclick="viewHistory('${doc.id}', '${s.name}')" style="flex:1; background:#1a73e8; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold;">History</button>
                    <button onclick="sendCustomWA('${s.parentPhone}', '${s.name}')" style="background:#25d366; width:50px; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;"><i class="fab fa-whatsapp" style="font-size:18px;"></i></button>
                </div>
            </div>`;
    });

    if (typeof updateExtendedReport === "function") updateExtendedReport(paidList, unpaidList);
}

// സഹായ ഫങ്ക്ഷനുകൾ (താഴെ ചേർക്കാം)

function updateExtendedReport(paidList, unpaidList) {
    const mainContainer = document.getElementById('masterReportContainer') || document.getElementById('dynamic-content');
    if(!mainContainer) return;

    const extendedHTML = `
        <div id="extended-stats" style="margin-top: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div onclick="showDetailedList('അടച്ചവർ', ${JSON.stringify(paidList)})" 
                     style="background: #f1f8e9; border: 1px solid #81c784; padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
                    <div style="font-size: 11px; color: #2e7d32; font-weight:bold;">പണമടച്ചവർ</div>
                    <div style="font-size: 20px; font-weight: bold; color: #1b5e20;">${paidList.length} പേർ</div>
                </div>

                <div onclick="showDetailedList('ബാക്കിയുള്ളവർ', ${JSON.stringify(unpaidList)})" 
                     style="background: #fff8e1; border: 1px solid #ffb74d; padding: 15px; border-radius: 12px; text-align: center; cursor: pointer;">
                    <div style="font-size: 11px; color: #e65100; font-weight:bold;">അടയ്ക്കാനുള്ളവർ</div>
                    <div style="font-size: 20px; font-weight: bold; color: #e65100;">${unpaidList.length} പേർ</div>
                </div>
            </div>

            <div id="names-list-container" style="display:none; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-top: 10px; border: 1px solid #eee;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h5 id="list-title" style="margin:0; color:#333;"></h5>
                    <span onclick="document.getElementById('names-list-container').style.display='none'" style="cursor:pointer; color:red; font-weight:bold; padding:5px;">X</span>
                </div>
                <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                <div id="names-list-content" style="max-height: 250px; overflow-y: auto; font-size: 13px;"></div>
            </div>
        </div>
    `;

    let existingExtended = document.getElementById('extended-stats');
    if (existingExtended) {
        existingExtended.outerHTML = extendedHTML;
    } else {
        mainContainer.insertAdjacentHTML('beforeend', extendedHTML);
    }
}

function showDetailedList(title, list) {
    const container = document.getElementById('names-list-container');
    const titleElem = document.getElementById('list-title');
    const contentElem = document.getElementById('names-list-content');

    titleElem.innerText = title;
    container.style.display = 'block';

    if (list.length === 0) {
        contentElem.innerHTML = "<p style='color:#999; text-align:center; padding:10px;'>ലിസ്റ്റ് ലഭ്യമല്ല.</p>";
    } else {
        let html = "<div style='display:flex; flex-direction:column; gap:8px;'>";
        list.forEach((name, idx) => {
            html += `<div style='padding:8px; border-bottom:1px solid #f0f0f0; color:#444; display:flex; justify-content:space-between;'>
                        <span>${idx+1}. ${name}</span>
                        <span style="color:#1a73e8; font-size:10px;">View</span>
                     </div>`;
        });
        html += "</div>";
        contentElem.innerHTML = html;
    }
}

// 6. പ്രിന്റ് ഫങ്ക്ഷൻ (Colorful & Large JPG/PDF)
function printReceipt(name, amount, months, date, rcptNo, sid, father, house, phone, type = "fees") {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt - ${rcptNo}</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Poppins', sans-serif; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; background-color: #f0f2f5; }
                    .receipt-card { width: 450px; background: white; padding: 35px; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.15); border-top: 12px solid #1a73e8; position: relative; }
                    .header { text-align: center; margin-bottom: 25px; }
                    .header h2 { color: #1a73e8; margin: 0; font-size: 26px; font-weight: 600; }
                    .header .sub-info { font-size: 13px; color: #666; margin: 5px 0 10px 0; }
                    .header .receipt-label { margin: 5px 0; font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 2px; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 5px 0; }
                    .info-section { margin-top: 20px; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #e0e0e0; padding-bottom: 8px; }
                    .label { color: #777; font-size: 14px; }
                    .value { color: #222; font-weight: 600; font-size: 15px; }
                    .amount-container { background: linear-gradient(135deg, #1a73e8, #1557b0); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; }
                    .amount-container span { font-size: 14px; opacity: 0.9; display: block; margin-bottom: 5px; }
                    .amount-container h1 { margin: 0; font-size: 36px; letter-spacing: 1px; }
                    .footer { text-align: center; margin-top: 25px; }
                    .footer p { font-size: 13px; color: #666; font-style: italic; }
                    .btn-group { margin-top: 30px; display: flex; gap: 15px; }
                    .btn { padding: 12px 25px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: 0.3s; }
                    .btn-download { background: #28a745; color: white; }
                    .btn-print { background: #6c757d; color: white; }
                    .btn:hover { opacity: 0.9; transform: translateY(-2px); }
                    @media print { .no-print { display: none; } body { background: white; padding: 0; } .receipt-card { box-shadow: none; border: 1px solid #ddd; width: 100%; } }
                </style>
            </head>
            <body>
<div id="receipt-area" class="receipt-card">
    <div class="header">
        <h2>ഇസ്‌ലാഹുൽ ഉലൂം മദ്റസ</h2>
        <div class="sub-info"><span>രജി. നം: <b>1205</b></span> | <span><b>AR NAGAR</b></span></div>
        
        <div class="receipt-label">${type === 'gurunidhi' ? 'ഗുരുനിധി രസീത്' : 'ഫീസ് രസീത്'} (OFFICIAL RECEIPT)</div>
    </div>
    
    <div class="info-section">
        <div class="info-row"><span class="label">രസീത് നം:</span><span class="value">#${rcptNo}</span></div>
        <div class="info-row"><span class="label">തീയതി:</span><span class="value">${date}</span></div>
        <div class="info-row"><span class="label">വിദ്യാർത്ഥി:</span><span class="value">${name}</span></div>
        <div class="info-row"><span class="label">പിതാവ്:</span><span class="value">${father || '-'}</span></div>
        <div class="info-row"><span class="label">വീട്ടുപേര്:</span><span class="value">${house || '-'}</span></div>
        <div class="info-row"><span class="label">ഫോൺ:</span><span class="value">${phone || '-'}</span></div>
        
        ${type !== 'gurunidhi' ? `
        <div class="info-row"><span class="label">മാസം:</span><span class="value">${months}</span></div>
        ` : ''}
    </div>
    
    <div class="amount-container"><span>ആകെ തുക (Total Amount)</span><h1>₹${amount}</h1></div>
    <div class="footer"><p>ഫിസബീലില്ലാഹ് - നന്ദി!</p></div>
</div>
                <div class="btn-group no-print">
                    <button class="btn btn-download" onclick="downloadImage()">Download Photo</button>
                    <button class="btn btn-print" onclick="window.print()">Print PDF</button>
                </div>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                <script>
                    function downloadImage() {
                        const element = document.getElementById('receipt-area');
                        html2canvas(element, { scale: 3, backgroundColor: "#ffffff" }).then(canvas => {
                            const link = document.createElement('a');
                            link.download = 'Receipt_${rcptNo}_${name}.jpg';
                            link.href = canvas.toDataURL('image/jpeg', 1.0);
                            link.click();
                        });
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// 7. വിപുലമായ എഡിറ്റിംഗ് (Edit Student with Balance Note)
async function editStudent(id) {
    const doc = await db.collection("students").doc(id).get();
    const s = doc.data();
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <div style="background:#fff; padding:20px; border-radius:12px; border:1px solid #ddd; max-height: 80vh; overflow-y: auto;">
            <h3 style="color:#1a73e8;">വിവരങ്ങൾ തിരുത്തുക</h3>
            
            <div style="margin-bottom:10px;"><label style="font-size:12px; font-weight:bold;">പേര്:</label><input id="e-name" value="${s.name}" style="width:100%; padding:8px;"></div>
            <div style="display:flex; gap:10px;">
                <div style="flex:1;"><label style="font-size:12px; font-weight:bold;">ക്ലാസ്:</label><input id="e-class" value="${s.class}" style="width:100%; padding:8px;"></div>
                <div style="flex:1;"><label style="font-size:12px; font-weight:bold;">ഫോൺ:</label><input id="e-phone" value="${s.parentPhone || ''}" style="width:100%; padding:8px;"></div>
            </div>

            <div style="margin-top:15px; padding:10px; background:#fff3f3; border-radius:8px;">
                <label style="font-size:12px; font-weight:bold; color:#d32f2f;">പഴയ കുടിശ്ശിക (Old Balance):</label>
                <input id="e-balance" type="number" value="${s.balance || 0}" style="width:100%; padding:8px;">
                <label style="font-size:11px; color:#666; margin-top:8px; display:block;">കുടിശ്ശിക വിവരങ്ങൾ (ഉദാ: 2024 Fees):</label>
                <input id="e-balance-note" value="${s.balanceNote || ''}" placeholder="ഏതൊക്കെ മാസത്തെ തുകയാണിത്?" style="width:100%; padding:8px; margin-top:4px;">
            </div>

            <div style="margin-top:15px;"><label style="font-size:12px; font-weight:bold;">സഹോദരങ്ങൾ (പേര്:ക്ലാസ്സ്):</label><input id="e-siblings" oninput="recalcEditFee()" value="${s.siblings ? s.siblings.map(sib => sib.name + ":" + sib.class).join(', ') : ''}" style="width:100%; padding:8px;"></div>
            <label style="font-size:12px; font-weight:bold; margin-top:10px; display:block;">പ്രതിമാസ ഫീസ്:</label><input id="e-fee" type="number" value="${s.monthlyFee}" readonly style="width:100%; padding:8px; background:#f0f0f0;">
            <div style="display:flex; gap:10px; margin-top:20px;"><button onclick="saveEdit('${id}')" style="background:#28a745; flex:1; color:white;">Save Changes</button><button onclick="loadStudents()" style="background:#6c757d; flex:1; color:white;">Cancel</button></div>
        </div>
    `;
}

async function saveEdit(id) {
    const siblings = document.getElementById('e-siblings').value.split(',').filter(i => i.trim() !== "").map(i => { let p = i.split(':'); return { name: p[0].trim(), class: p[1] ? p[1].trim() : '' }; });
    try {
        await db.collection("students").doc(id).update({
            name: document.getElementById('e-name').value, class: document.getElementById('e-class').value, parentPhone: document.getElementById('e-phone').value,
            balance: Number(document.getElementById('e-balance').value), balanceNote: document.getElementById('e-balance-note').value,
            monthlyFee: Number(document.getElementById('e-fee').value), siblings: siblings
        });
        alert("വിവരങ്ങൾ പുതുക്കി!"); loadStudents();
    } catch(e) { alert("പിശക്: " + e.message); }
}

function recalcEditFee() { const sibs = document.getElementById('e-siblings').value.split(',').filter(x => x.trim() !== ""); document.getElementById('e-fee').value = 250 + (sibs.length * 50); }

// 8. ഹിസ്റ്ററി & റീ-പ്രിന്റ് (Payments) - Updated
async function viewHistory(studentId, studentName) {
    const content = document.getElementById('dynamic-content');
    // ബാക്ക് ബട്ടണും ഹെഡിങ്ങും നൽകുന്നു
    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h4 style="margin:0;">History: ${studentName}</h4>
            <button onclick="loadStudents()" style="padding:5px 15px; background:#1a73e8; color:white; border:none; border-radius:5px; cursor:pointer;">Back</button>
        </div>
        <div id="hist-list">Loading...</div>
    `;

    try {
        const snap = await db.collection("payments")
            .where("studentId", "==", studentId)
            .orderBy("timestamp", "desc")
            .get();

        if(snap.empty) { 
            document.getElementById('hist-list').innerHTML = "<p style='text-align:center; color:#888;'>വിവരങ്ങളില്ല</p>"; 
            return; 
        }

        let html = "";
        snap.forEach(doc => {
            const p = doc.data(); 
            const monthsStr = Array.isArray(p.months) ? p.months.join(', ') : p.months;
            
            // ശ്രദ്ധിക്കുക: എല്ലാ വിവരങ്ങളും (fatherName, houseName, phone) printReceipt-ലേക്ക് അയക്കുന്നു
            html += `
                <div style="background:#f0f7ff; padding:12px; margin-bottom:10px; border-radius:12px; font-size:12px; display:flex; justify-content:space-between; align-items:center; border: 1px solid #e0eefb;">
                    <div>
                        <b style="color: #1a73e8; font-size:13px;">No: ${p.receiptNo || '-'}</b> | ${p.date}<br>
                        <span style="font-size: 15px; font-weight: bold; color: #222;">₹${p.amountPaid}</span> 
                        <span style="color: #666; margin-left:5px;">(${monthsStr})</span>
                    </div>
                    <button onclick="printReceipt('${p.studentName}', ${p.amountPaid}, '${monthsStr}', '${p.date}', '${p.receiptNo}', '${p.studentID || ''}', '${p.fatherName || ''}', '${p.houseName || ''}', '${p.parentPhone || ''}')" 
                            style="background:#6c757d; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600;">
                        Print
                    </button>
                </div>`;
        });
        document.getElementById('hist-list').innerHTML = html;
    } catch (e) {
        console.error("History Error:", e);
        document.getElementById('hist-list').innerHTML = "Error loading history: " + e.message;
    }
}


function sendCustomWA(phone, name) { window.open(`https://wa.me/${phone}?text=${encodeURIComponent('അസ്സലാമു അലൈക്കും, ' + name + '-ന്റെ കാര്യവുമായി ബന്ധപ്പെട്ട്...')}`, '_blank'); }
async function deleteStudent(id) { if (confirm("ഒഴിവാക്കണോ?")) { await db.collection("students").doc(id).delete(); loadStudents(); } }
async function logout() {
    try {
        await auth.signOut(); // ഫയർബേസ് ലോഗ് ഔട്ട്
        localStorage.removeItem("activeUser"); // ഫോണിലെ ലോഗിൻ ഡാറ്റ നീക്കം ചെയ്യുന്നു
        location.reload(); // പേജ് റിഫ്രഷ് ചെയ്യുമ്പോൾ ലോഗിൻ സ്ക്രീൻ വരും
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// 9. ഗുരുനിധി ബോക്സ് മാനേജ്‌മെന്റ് (📦 Gurunidhi Box - Updated)
function showGurunidhiSection() {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <div style="padding:15px; background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
            <h3 style="color:#d32f2f; border-bottom:2px solid #d32f2f; padding-bottom:10px;">
                📦 ഗുരുനിധി ബോക്സ് 
            </h3>
            
            <div id="admin-g-add" style="background:#fff8f8; padding:15px; border-radius:8px; margin-bottom:20px; border:1px dashed #d32f2f;">
                <p style="font-weight:bold; margin-top:0; color:#d32f2f;">പുതിയ ബോക്സ് രജിസ്റ്റർ ചെയ്യുക</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <input id="g-box-id" placeholder="സ്റ്റുഡന്റ് ID" style="padding:10px; border:1px solid #ddd;">
                    <input id="g-date-given" type="date" style="padding:10px; border:1px solid #ddd;">
                    <input id="g-name" placeholder="കുട്ടിയുടെ പേര്" style="padding:10px; border:1px solid #ddd;">
                    <input id="g-class" placeholder="ക്ലാസ്" style="padding:10px; border:1px solid #ddd;">
                    <input id="g-father" placeholder="പിതാവിന്റെ പേര്" style="padding:10px; border:1px solid #ddd;">
                    <input id="g-phone" placeholder="മൊബൈൽ നമ്പർ" style="padding:10px; border:1px solid #ddd;">
                    <input id="g-house" placeholder="വീട്ടുപേര്" style="padding:10px; border:1px solid #ddd; grid-column: span 2;">
                </div>
                <button onclick="saveGurunidhiBox()" style="width:100%; margin-top:10px; background:#d32f2f; color:white; border:none; padding:12px; border-radius:5px; cursor:pointer; font-weight:bold;">സേവ് ചെയ്യുക</button>
            </div>

            <div style="margin-top:15px;">
                <input type="text" id="g-search" onkeyup="loadGurunidhiList()" placeholder="പേര് അല്ലെങ്കിൽ ID വെച്ച് തിരയുക..." style="width:100%; padding:12px; margin-bottom:10px; border-radius:25px; border:1px solid #ddd;">
                <div id="gurunidhi-list-area">ലോഡിംഗ്...</div>
            </div>
        </div>
    `;
    loadGurunidhiList();
}

// 1. ബോക്സ് വിവരങ്ങൾ സേവ് ചെയ്യുമ്പോൾ
async function saveGurunidhiBox() {
    const boxID = document.getElementById('g-box-id').value.trim();
    const gName = document.getElementById('g-name').value.trim();
    if(!boxID || !gName) { alert("ഐഡിയും പേരും നൽകുക!"); return; }

    try {
        await db.collection("gurunidhi").add({
            boxID: boxID,
            studentName: gName,
            givenDate: document.getElementById('g-date-given').value,
            studentClass: document.getElementById('g-class').value,
            fatherName: document.getElementById('g-father').value,
            phone: document.getElementById('g-phone').value,
            houseName: document.getElementById('g-house').value,
            totalAmount: 0, // ആകെ തുക പൂജ്യത്തിൽ തുടങ്ങുന്നു
            status: "active",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("വിജയകരമായി ചേർത്തു!");
        showGurunidhiSection();
    } catch(e) { alert("Error: " + e.message); }
}
// 1. ലിസ്റ്റ് ലോഡ് ചെയ്യുന്ന പ്രധാന ഫങ്ക്ഷൻ (Search ഒഴിവാക്കി)
async function loadGurunidhiList() {
    const listArea = document.getElementById('gurunidhi-list-area');
    const user = JSON.parse(localStorage.getItem("activeUser"));

    if (!listArea) return;
    listArea.innerHTML = "<p style='text-align:center;'>ലോഡിംഗ്...</p>";

    try {
        let query = db.collection("gurunidhi");

        // ഉസ്താദ് ആണെങ്കിൽ സ്വന്തം ക്ലാസ്സ് മാത്രം കാണിക്കുന്നു
        if (user && user.role === 'Usthad' && user.assignedClass) {
            query = query.where("studentClass", "==", user.assignedClass);
        }

        // ഇൻഡക്സ് റെഡി ആയതുകൊണ്ട് സമയം അനുസരിച്ച് ക്രമീകരിക്കുന്നു
        const snap = await query.orderBy("timestamp", "desc").get();
        
        listArea.innerHTML = "";
        
        if (snap.empty) {
            listArea.innerHTML = "<p style='text-align:center; padding:20px; color:#888;'>നിലവിൽ വിവരങ്ങൾ ഒന്നുമില്ല.</p>";
            return;
        }

        snap.forEach(doc => {
    const g = doc.data();
    
    // ഡാറ്റാബേസിൽ നിന്ന് എല്ലാ വിവരങ്ങളും കൃത്യമായി എടുക്കുന്നു
    const name = g.studentName || "പേരില്ലാത്ത കുട്ടി";
    const id = g.boxID || "ID ഇല്ല";
    const father = g.fatherName || "-"; // പിതാവിന്റെ പേര്
    const phone = g.phone || "-";      // ഫോൺ നമ്പർ (സേവ് ചെയ്യുമ്പോൾ കൊടുത്ത അതേ കീ - phone)
    const house = g.houseName || "-";   // വീട്ടുപേര്
    const docId = doc.id;

    // സദർ ആണെങ്കിൽ മാത്രം ഡിലീറ്റ് ബട്ടൺ
    const deleteBtn = (user && user.role === 'Sadhar') ? 
        `<button onclick="deleteGBox('${docId}')" style="background:#ff4d4d; color:white; border:none; padding:8px; border-radius:4px; font-size:11px; cursor:pointer;">ഡിലീറ്റ്</button>` : '';

    listArea.innerHTML += `
        <div style="border:1px solid #eee; padding:12px; margin-bottom:10px; border-radius:10px; background:#fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <b style="color:#d32f2f; font-size:15px;">${name} (${g.studentClass || '-'})</b>
                <span style="font-size:10px; background:#f0f0f0; padding:2px 6px; border-radius:5px; border:1px solid #ddd;">ID: ${id}</span>
            </div>
            <div style="font-size:12px; color:#555; margin:8px 0; line-height:1.5;">
                👤 <b>പിതാവ്:</b> ${father}<br>
                🏠 <b>വീട്:</b> ${house}<br>
                📞 <b>ഫോൺ:</b> ${phone}<br>
                📅 നൽകിയത്: ${g.givenDate || '-'}<br>
                💰 ആകെ തുക: <b style="color:#28a745; font-size:14px;">₹${g.totalAmount || 0}</b>
            </div>
            <div style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:6px;">
                <button onclick="addGPayment('${docId}', '${name}', '${id}', '${father}', '${house}', '${phone}')" style="background:#28a745; color:white; border:none; padding:9px; border-radius:5px; font-size:11px; cursor:pointer;">തുക ചേർക്കുക</button>
                <button onclick="viewGHistory('${docId}', '${name}')" style="background:#1a73e8; color:white; border:none; padding:9px; border-radius:5px; font-size:11px; cursor:pointer;">History</button>
                <button onclick="reissueGBox('${docId}')" style="background:#ff9800; color:white; border:none; padding:9px; border-radius:5px; font-size:11px; cursor:pointer;">Re-Issue</button>
                ${deleteBtn}
            </div>
        </div>`;
});
        
    } catch(e) { 
        console.error("Gurunidhi Load Error: ", e);
        listArea.innerHTML = `<div style="color:red; text-align:center; padding:10px; font-size:12px;">വിവരങ്ങൾ ലഭിക്കുന്നതിൽ തടസ്സം നേരിട്ടു.</div>`; 
    }
}

// 2. തുക ചേർക്കാനും റെസീപ്റ്റ് ജനറേറ്റ് ചെയ്യാനും
// കൂടുതൽ വിവരങ്ങൾ (father, house, phone) സ്വീകരിക്കാനായി പാരാമീറ്ററുകൾ ചേർത്തു
async function addGPayment(docId, name, boxID, father, house, phone) {
    const amt = prompt(`${name} - ലഭിച്ച തുക നൽകുക:`);
    if(!amt || isNaN(amt)) return;
    
    const rcpt = prompt("റെസീപ്റ്റ് നമ്പർ (Receipt No):");
    if(!rcpt) { alert("റെസീപ്റ്റ് നമ്പർ നിർബന്ധമാണ്!"); return; }
    
    const date = new Date().toLocaleDateString('en-IN');

    try {
        const ref = db.collection("gurunidhi").doc(docId);

        // 1. ഹിസ്റ്ററിയിലേക്ക് (Sub-collection) പേയ്‌മെന്റ് വിവരങ്ങൾ ചേർക്കുന്നു
        await ref.collection("payments").add({
            amount: Number(amt),
            receiptNo: rcpt,
            date: date,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // 2. മെയിൻ ഡോക്യുമെന്റിലെ ആകെ തുക (Total Amount) അപ്‌ഡേറ്റ് ചെയ്യുന്നു
        const gDoc = await ref.get();
        const currentTotal = Number(gDoc.data().totalAmount || 0);
        
        await ref.update({
            totalAmount: currentTotal + Number(amt),
            lastPaymentDate: date
        });

        alert("തുക വിജയകരമായി രേഖപ്പെടുത്തി!");
        loadGurunidhiList(); // ലിസ്റ്റ് പുതുക്കുന്നു
        
        if(confirm("രസീപ്റ്റ് പ്രിന്റ് ചെയ്യണോ?")) {
            // പ്രിന്റ് ഫങ്ക്ഷൻ ഉണ്ടെന്ന് ഉറപ്പുവരുത്തുക
            if(typeof printReceipt === 'function') {
                // പ്രിന്റ് ചെയ്യുമ്പോൾ പിതാവ്, വീട്, ഫോൺ എന്നീ വിവരങ്ങൾ കൂടി അയക്കുന്നു
                printReceipt(name, amt, "Gurunidhi Box Contribution", date, "GN-"+rcpt, boxID, father, house, phone);
            }
        }
    } catch(e) { 
        console.error("Payment Error:", e);
        alert("പിശക് സംഭവിച്ചു: " + e.message); 
    }
}

// 3. ഹിസ്റ്ററി കാണാൻ
async function viewGHistory(docId, name) {
    const listArea = document.getElementById('gurunidhi-list-area');
    
    try {
        // 1. പ്രിന്റിംഗിന് ആവശ്യമായ കുട്ടിയുടെ വിവരങ്ങൾ എടുക്കുന്നു
        const mainDoc = await db.collection("gurunidhi").doc(docId).get();
        const g = mainDoc.data();
        const boxID = g.boxID || "";
        const father = g.fatherName || "-";
        const house = g.houseName || "-";
        const phone = g.phone || "-";

        listArea.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; background:#f8f9fa; padding:10px; border-radius:8px;">
                <h4 style="margin:0; color:#d32f2f;">History: ${name}</h4>
                <button onclick="loadGurunidhiList()" style="padding:6px 15px; background:#6c757d; color:white; border:none; border-radius:6px; cursor:pointer;">തിരികെ</button>
            </div>
            <div id="gh-list">ലോഡിംഗ്...</div>`;
        
        const snap = await db.collection("gurunidhi").doc(docId).collection("payments").orderBy("timestamp", "desc").get();
        const ghList = document.getElementById('gh-list');
        
        if(snap.empty) { 
            ghList.innerHTML = "<p style='text-align:center; color:#888;'>ഹിസ്റ്ററി ലഭ്യമല്ല.</p>"; 
            return; 
        }

        ghList.innerHTML = ""; // പഴയ ലിസ്റ്റ് കളയുന്നു

        // ഇവിടെയാണ് പിശക് വന്നിരുന്നത് - snap.forEach ചേർത്തു
        snap.forEach(doc => {
            const p = doc.data();
            ghList.innerHTML += `
                <div style="background:#ffffff; padding:15px; border:1px solid #d32f2f; display:flex; justify-content:space-between; align-items:center; border-radius:12px; margin-bottom:10px; box-shadow: 0 4px 8px rgba(211, 47, 47, 0.1);">
                    <div style="flex-grow: 1;">
                        <div style="display:flex; align-items:center; margin-bottom:5px;">
                            <span style="background:#e8f5e9; color:#2e7d32; padding:4px 10px; border-radius:20px; font-weight:bold; font-size:16px;">₹${p.amount}</span>
                            <span style="margin-left:10px; color:#666; font-size:12px;">📅 ${p.date}</span>
                        </div>
                        <div style="font-size:13px; color:#333;">
                            രസീത് നമ്പർ: <b style="color:#d32f2f;">${p.receiptNo}</b>
                        </div>
                    </div>
                    <div style="margin-left:10px;">
                        <button onclick="printReceipt('${name}', '${p.amount}', '', '${p.date}', 'GN-${p.receiptNo}', '${boxID}', '${father}', '${house}', '${phone}', 'gurunidhi')" 
        style="background:#d32f2f; color:white !important; border:none; padding:10px 15px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
    Print 🖨️
</button>
                    </div>
                </div>`;
        });
    } catch(e) { 
        console.error("Error:", e);
        alert("Error: " + e.message); 
    }
}

// 4. ബോക്സ് റീ-ഇഷ്യൂ ചെയ്യാൻ
async function reissueGBox(id) {
    const newDate = prompt("പുതിയ തീയതി (DD/MM/YYYY):", new Date().toLocaleDateString('en-IN'));
    if(!newDate) return;

    try {
        await db.collection("gurunidhi").doc(id).update({
            givenDate: newDate
        });
        alert("വിവരങ്ങൾ പുതുക്കി!");
        loadGurunidhiList();
    } catch(e) { alert("Error!"); }
}

// 5. ഡിലീറ്റ് ചെയ്യാൻ
async function deleteGBox(id) {
    if(confirm("ഈ കുട്ടിയുടെ എല്ലാ ഗുരുനിധി വിവരങ്ങളും സ്ഥിരമായി ഒഴിവാക്കണോ?")) {
        try {
            await db.collection("gurunidhi").doc(id).delete();
            alert("ഒഴിവാക്കി!");
            loadGurunidhiList();
        } catch(e) { alert("ഡിലീറ്റ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു."); }
    }
}

// 10. കളക്ഷൻ റിപ്പോർട്ട് (Collection Summary)

  // --- റിപ്പോർട്ട് സെക്ഷൻ ആരംഭം ---

// 1. മാസങ്ങളും ക്ലാസ്സുകളും തുറക്കാനും അടയ്ക്കാനും (Toggle Functions)
window.toggleMonth = function(month) {
    const el = document.getElementById(`m-report-${month}`);
    if(el) el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
};

window.toggleClass = function(month, cls) {
    const el = document.getElementById(`c-report-${month}-${cls}`);
    if(el) el.style.display = (el.style.display === 'none' || el.style.display === '') ? 'block' : 'none';
};

// 2. മെയിൻ കളക്ഷൻ റിപ്പോർട്ട് ഫങ്ക്ഷൻ
async function showCollectionReport() {
    const user = JSON.parse(localStorage.getItem("activeUser"));
    const content = document.getElementById('dynamic-content');
    
    if (!user || (user.role !== 'Sadhar' && user.role !== 'Usthad')) {
        alert("അനുമതിയില്ല!");
        return; 
    }
   
        content.innerHTML = `
        <div style="padding:15px; background:#f8f9fa; min-height:100vh; border-radius:12px;">
            <h3 style="color:#1a73e8; text-align:center; margin-bottom:20px;">📊 മാസവരി സംഖ്യ - മാസ്റ്റർ റിപ്പോർട്ട്</h3>
            
            <div id="grand-summary" style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;"></div>
            
            <div id="remittance-section" style="margin-bottom:20px;"></div>

            <div id="report-area">വിവരങ്ങൾ ശേഖരിക്കുന്നു...</div>
            
            <div id="payment-entry-section" style="display: ${user.role === 'Sadhar' ? 'block' : 'none'}; margin-top:30px; padding:15px; background:white; border-radius:12px; border:2px solid #e2e8f0; box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                <h3 style="color:#2d3748; margin-top:0; font-size:16px;">💸 ഉസ്താദുമാർക്ക് തുക കൈമാറാൻ</h3>
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button onclick="showPaymentEntry()" style="flex:1; padding:12px; background:#28a745; color:white; border:none; border-radius:8px; font-weight:bold;">➕ പുതിയ എൻട്രി</button>
                    <button onclick="showSalaryManagement()" style="flex:1; padding:12px; background:#1a73e8; color:white; border:none; border-radius:8px; font-weight:bold;">💰 ശമ്പളം & ലീവ്</button>
                </div>
            </div>
        </div>`;

        try {
        const studentsSnap = await db.collection("students").get();
        
        // remittances കളക്ഷൻ ഇല്ലെങ്കിൽ എറർ ഒഴിവാക്കാൻ ഇങ്ങനെ ചെയ്യുക
        let remittanceSnap = { forEach: () => {} }; 
        try {
            remittanceSnap = await db.collection("remittances").get();
        } catch (remErr) {
            console.log("Remittances collection not found yet, skipping...");
        }

        let monthData = {}; let totalReceived = 0; let totalPending = 0;

                studentsSnap.forEach(doc => {
            const s = doc.data();
            const cls = s.class || "Unassigned";

            // --- സദർ അല്ലെങ്കിൽ, ലോഗിൻ ചെയ്ത ഉസ്താദിന്റെ ക്ലാസ്സ് മാത്രം ഫിൽട്ടർ ചെയ്യുന്നു ---
            if (user.role !== 'Sadhar' && String(cls) !== String(user.assignedClass)) {
                return; 
            }

            const monthlyFee = 250 + ((s.siblings ? s.siblings.length : 0) * 50);
            const mStatus = s.monthStatus || {};

                        // ഓരോ കുട്ടിയും ഏത് മാസം മുതൽ മദ്രസയിൽ വരുന്നു എന്ന് നോക്കുന്നു (ഷവ്വാൽ ലോജിക്)
            const startMonthName = s.startMonth || "May";
            const startMonthIdx = monthsOrder.indexOf(startMonthName);

            monthsOrder.forEach((month, idx) => {
                // 1. ഭാവിയിലെ മാസങ്ങൾ ഒഴിവാക്കുന്നു
                if (idx > currentMonthIdx) return;
                
                // 2. കുട്ടി ചേരുന്നതിന് മുൻപുള്ള മാസങ്ങൾ കണക്കിലെടുക്കുന്നില്ല
                if (idx < startMonthIdx) return;

                if (!monthData[month]) monthData[month] = { paid: 0, pending: 0, classes: {} };
                if (!monthData[month].classes[cls]) {
                    monthData[month].classes[cls] = { paidAmt: 0, pendingAmt: 0, pendingStudents: [] };
                }

                const targetClass = monthData[month].classes[cls];
                
                // ഫീസ് അടച്ചിട്ടുണ്ടോ എന്ന് പരിശോധിക്കുന്നു
                if (mStatus[month] && mStatus[month].paid) {
                    monthData[month].paid += monthlyFee;
                    targetClass.paidAmt += monthlyFee;
                    totalReceived += monthlyFee;
                } else {
                    // ഫീസ് അടച്ചിട്ടില്ലെങ്കിൽ മാത്രം കുടിശ്ശികയായി (Pending) കൂട്ടുന്നു
                    monthData[month].pending += monthlyFee;
                    targetClass.pendingAmt += monthlyFee;
                    
                    targetClass.pendingStudents.push({ 
                        id: doc.id, 
                        name: s.name, 
                        amt: monthlyFee,
                        month: month 
                    });
                    
                    totalPending += monthlyFee;
                }
            }); // monthsOrder ലൂപ്പ് അവസാനിക്കുന്നു
        }); // studentsSnap ലൂപ്പ് അവസാനിക്കുന്നു

        // 1. മുകളിലെ സമ്മറി കാർഡുകൾ (ഈ മാസത്തെ പ്രാധാന്യം നൽകുന്നു)
        const currentMonthName = monthsOrder[currentMonthIdx];
        const currentMonthStats = monthData[currentMonthName] || { paid: 0, pending: 0 };
        
        document.getElementById('grand-summary').innerHTML = `
            <div style="background:#fff; padding:15px; border-radius:12px; border-bottom:4px solid #28a745; text-align:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                <small style="color:#666;">ഈ മാസം (${currentMonthName}) ലഭിച്ചത്</small><br>
                <b style="font-size:20px; color:#28a745;">₹${currentMonthStats.paid}</b>
            </div>
            <div style="background:#fff; padding:15px; border-radius:12px; border-bottom:4px solid #dc3545; text-align:center; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                <small style="color:#666;">ആകെ ലഭിക്കാനുള്ള കുടിശ്ശിക</small><br>
                <b style="font-size:20px; color:#dc3545;">₹${totalPending}</b>
            </div>`;

        // 2. മാസവരി റിപ്പോർട്ട് ലിസ്റ്റ് (പുതിയ ഡിസൈനിൽ)
        let html = "";
        monthsOrder.slice(0, currentMonthIdx + 1).forEach(month => {
            if (!monthData[month]) return;
            const m = monthData[month];
            if (m.paid === 0) return;
            
            const totalExpected = m.paid + m.pending; // ആ മാസം ആകെ ലഭിക്കേണ്ടത്
            const isCompleted = m.pending === 0; // കുടിശ്ശിക തീർന്നോ എന്ന് നോക്കുന്നു

            html += `
                <div style="background:#fff; border:1px solid #eee; margin-bottom:12px; border-radius:10px; overflow:hidden; border-left: 5px solid ${isCompleted ? '#28a745' : '#1a73e8'}; box-shadow:0 2px 8px rgba(0,0,0,0.03);">
                    <div onclick="window.toggleMonth('${month}')" style="padding:15px; cursor:pointer;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <b style="color:#2d3748;">📅 ${month} - മാസത്തെ കണക്ക്</b>
                            <span style="background:${isCompleted ? '#e9f7ef' : '#fef9e7'}; color:${isCompleted ? '#28a745' : '#f39c12'}; padding:4px 10px; border-radius:20px; font-size:10px; font-weight:bold;">
                                ${isCompleted ? '✅ പൂർത്തിയായി' : '⏳ കുടിശ്ശികയുണ്ട്'}
                            </span>
                        </div>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px; margin-top:12px; font-size:11px; text-align:center;">
                            <div style="background:#f8f9fa; padding:8px 5px; border-radius:8px;">
                                <span style="color:#718096;">ലഭിക്കേണ്ടത്</span><br>
                                <b style="color:#2d3748; font-size:13px;">₹${totalExpected}</b>
                            </div>
                            <div style="background:#e9f7ef; padding:8px 5px; border-radius:8px; border:1px solid #b7e4c7;">
                                <span style="color:#2d6a4f;">ലഭിച്ചത്</span><br>
                                <b style="color:#28a745; font-size:13px;">₹${m.paid}</b>
                            </div>
                            <div style="background:#fff5f5; padding:8px 5px; border-radius:8px; border:1px solid #feb2b2;">
                                <span style="color:#c53030;">ബാക്കി</span><br>
                                <b style="color:#dc3545; font-size:13px;">₹${m.pending}</b>
                            </div>
                        </div>
                    </div>

                    <div id="m-report-${month}" style="display:none; padding:10px; background:#fcfcfc; border-top:1px solid #f0f0f0;">
                        ${Object.keys(m.classes).sort().map(cls => {
                            const c = m.classes[cls];
                            return `
                                <div style="margin-bottom:8px; border:1px solid #f0f0f0; border-radius:8px; background:white;">
                                    <div onclick="window.toggleClass('${month}', '${cls}')" style="padding:10px; cursor:pointer; display:flex; justify-content:space-between; font-size:14px;">
                                        <span><b>ക്ലാസ്സ്: ${cls}</b></span>
                                        <b style="color:#dc3545;">₹${c.pendingAmt}</b>
                                    </div>
                                    <div id="c-report-${month}-${cls}" style="display:none; padding:8px 12px; font-size:12px; border-top:1px dashed #eee;">
                                        ${c.pendingStudents.map(st => `
                                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                                                <span>${st.name}</span>
                                                <button onclick="paySpecificMonth('${st.id}', '${month}', ${st.amt})" style="background:#28a745; color:white; border:none; padding:4px 10px; border-radius:6px; font-weight:bold; cursor:pointer;">Pay ₹${st.amt}</button>
                                            </div>`).join('')}
                                    </div>
                                </div>`;
                        }).join('')}
                    </div>
                </div>`;
        });

        document.getElementById('report-area').innerHTML = html || "<p style='text-align:center; color:#999;'>വിവരങ്ങൾ ലഭ്യമല്ല.</p>";
        
        if (user.role === 'Sadhar') {
            loadRemittanceTable(monthData, remittanceSnap);
        }
    } catch(e) { console.error(e); }
}
// സദർ സെക്ഷൻ തുറക്കാൻ (നിങ്ങളുടെ ബട്ടണിൽ ഇത് നൽകുക)
function openSadarSection() {
    // നിലവിലുള്ള ലിസ്റ്റ് ഏരിയ ഹൈഡ് ചെയ്യുക (ഉദാഹരണത്തിന് വരിസംഖ്യ ലിസ്റ്റ്)
    if(document.getElementById('list-area')) document.getElementById('list-area').style.display = 'none';
    
    // സദർ സെക്ഷൻ കാണിക്കുക
    document.getElementById('sadar-wrapper').style.display = 'block';
    loadMuallimHistory();
}

// തിരികെ പോകാൻ
function closeSadarSection() {
    document.getElementById('sadar-wrapper').style.display = 'none';
    if(document.getElementById('list-area')) document.getElementById('list-area').style.display = 'block';
}

function calculateContribution() {
    const salary = document.getElementById('m-salary').value;
    const contributionField = document.getElementById('m-contribution');
    if (salary > 0) {
        contributionField.value = Math.round(salary / 30);
    } else {
        contributionField.value = '';
    }
}

let editingDocId = null;

async function saveMuallimData() {
    const data = {
        type: document.getElementById('contribution-type').value,
        date: document.getElementById('m-date').value,
        regNo: document.getElementById('m-reg').value,
        msrNo: document.getElementById('m-msr').value,
        name: document.getElementById('m-name').value,
        salary: Number(document.getElementById('m-salary').value),
        contribution: Number(document.getElementById('m-contribution').value),
        remarks: document.getElementById('m-remarks').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    if(!data.name || !data.salary) return alert("പേരും ശമ്പളവും നൽകുക!");

    try {
        if (editingDocId) {
            await db.collection("muallim_contributions").doc(editingDocId).update(data);
            editingDocId = null;
            document.getElementById('save-btn').innerText = "വിവരങ്ങൾ സേവ് ചെയ്യുക";
        } else {
            await db.collection("muallim_contributions").add(data);
        }
        resetSadarForm();
        loadMuallimHistory();
        alert("വിജയകരമായി പൂർത്തിയാക്കി!");
    } catch (e) { alert("Error: " + e.message); }
}

async function loadMuallimHistory() {
    const year = document.getElementById('history-year-filter').value;
    const list = document.getElementById('muallim-history-list');
    list.innerHTML = "ലോഡിംഗ്...";
    
    try {
        const snap = await db.collection("muallim_contributions").orderBy("timestamp", "desc").get();
        list.innerHTML = "";
        snap.forEach(doc => {
            const d = doc.data();
            if (d.date && d.date.startsWith(year)) {
                list.innerHTML += `
                <div class="history-item">
                    <div>
                        <strong style="color:#1a73e8;">${d.name}</strong><br>
                        <small>${d.date} | Contrib: ₹${d.contribution}</small>
                    </div>
                    <div>
                        <button onclick="editEntry('${doc.id}', ${JSON.stringify(d).replace(/"/g, '&quot;')})" style="background:#ffc107; border:none; border-radius:4px; padding:4px 8px;">Edit</button>
                    </div>
                </div>`;
            }
        });
    } catch (e) { list.innerHTML = "ഹിസ്റ്ററി ലോഡ് ചെയ്യുന്നതിൽ പിശക്."; }
}

function editEntry(id, data) {
    editingDocId = id;
    document.getElementById('m-date').value = data.date;
    document.getElementById('m-name').value = data.name;
    document.getElementById('m-salary').value = data.salary;
    document.getElementById('m-contribution').value = data.contribution;
    document.getElementById('m-reg').value = data.regNo;
    document.getElementById('m-msr').value = data.msrNo;
    document.getElementById('save-btn').innerText = "Update";
    window.scrollTo(0,0);
}

function resetSadarForm() {
    ['m-reg', 'm-msr', 'm-name', 'm-salary', 'm-contribution', 'm-remarks'].forEach(id => document.getElementById(id).value = '');
}

// 3. സദർ - ഉസ്താദ് പണമിടപാട് ടേബിൾ (പുതിയത്)
// 1. ലോഡ് ചെയ്യുന്ന ടേബിൾ (മാറ്റമില്ലാതെ - ഇതിൽ ID ഉം സമയവും ഡിസ്‌പ്ലേ ചെയ്യാനുണ്ട്)
async function loadRemittanceTable(monthData, remittanceSnap) {
    const remArea = document.getElementById('remittance-section');
    const uSnap = await db.collection("users").where("role", "==", "Usthad").get();
    
    let html = `
        <div style="background:white; padding:15px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1); border-top:4px solid #1a73e8; margin-bottom:20px;">
            <h4 style="margin:0 0 10px 0; font-size:14px; color:#1a73e8;">🤝 ഉസ്താദുമാരുടെ കളക്ഷൻ സ്റ്റാറ്റസ്</h4>
            <table style="width:100%; border-collapse:collapse; font-size:11px;">
                <tr style="background:#f8f9fa;">
                    <th style="padding:8px; border-bottom:1px solid #ddd; text-align:left;">ഉസ്താദ്/ക്ലാസ്സ്</th>
                    <th style="padding:8px; border-bottom:1px solid #ddd;">പിരിച്ചത്</th>
                    <th style="padding:8px; border-bottom:1px solid #ddd;">ഏൽപ്പിച്ചത്</th>
                    <th style="padding:8px; border-bottom:1px solid #ddd;">ബാക്കി</th>
                    <th style="padding:8px; border-bottom:1px solid #ddd;">Add</th>
                </tr>`;

    let remittancesByClass = {};
    remittanceSnap.forEach(doc => {
        const d = doc.data();
        if (!remittancesByClass[d.class]) remittancesByClass[d.class] = [];
        remittancesByClass[d.class].push({ ...d, id: doc.id }); 
    });

    uSnap.forEach(doc => {
        const u = doc.data();
        const cls = u.assignedClass;
        let collected = 0;
        Object.values(monthData).forEach(m => { if (m.classes[cls]) collected += m.classes[cls].paidAmt; });

        let paid = 0;
        let historyHtml = "";
        if (remittancesByClass[cls]) {
            remittancesByClass[cls].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
            
            remittancesByClass[cls].forEach(r => {
                paid += r.amount;
                historyHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; color:#444; background:#f9f9f9; padding:6px 10px; border-radius:6px; margin-bottom:4px; border:1px solid #eee;">
                        <span style="flex:1;">
                            <span>📅 ${r.date}</span> 
                            <span style="color:#e67e22; margin-left:5px; font-weight:500;">🕒 ${r.time || 'Time N/A'}</span>
                        </span>
                        <span style="font-weight:bold; color:#1a73e8; margin-right:12px;">₹${r.amount}</span>
                        
                        <div style="display:flex; gap:10px;">
                            <span onclick="editRemittance('${r.id}', ${r.amount})" style="cursor:pointer; font-size:12px;" title="തിരുത്തുക">✏️</span>
                            <span onclick="deleteRemittance('${r.id}')" style="cursor:pointer; font-size:12px; color:#e74c3c;" title="ഒഴിവാക്കുക">🗑️</span>
                        </div>
                    </div>`;
            });
        }

        const balance = collected - paid;

        html += `
            <tr style="background:#fdfdfd;">
                <td style="padding:10px 8px; border-bottom:1px solid #eee;">
                    <b>${u.name}</b><br><span style="color:#718096; font-size:10px;">Class ${cls}</span>
                </td>
                <td style="padding:8px; border-bottom:1px solid #eee; color:#28a745;">₹${collected}</td>
                <td style="padding:8px; border-bottom:1px solid #eee; color:#1a73e8;">₹${paid}</td>
                <td style="padding:8px; border-bottom:1px solid #eee; color:${balance > 0 ? '#dc3545' : '#28a745'}; font-weight:bold;">₹${balance}</td>
                <td style="padding:8px; border-bottom:1px solid #eee;">
                    <button onclick="addRemittance('${cls}', '${u.name}')" style="background:#1a73e8; color:white; border:none; border-radius:6px; width:28px; height:28px; cursor:pointer;">+</button>
                </td>
            </tr>
            <tr>
                <td colspan="5" style="padding:0 8px 10px 20px; border-bottom:1px solid #eee; background:#fcfcfc;">
                    <div style="max-height:100px; overflow-y:auto; padding-top:5px;">
                        ${historyHtml || '<small style="color:#999; font-style:italic;">ഇടപാടുകൾ ലഭ്യമല്ല</small>'}
                    </div>
                </td>
            </tr>`;
    });

    html += `</table></div>`;
    remArea.innerHTML = html;
}

// 2. പുതിയ എൻട്രി ചേർക്കാൻ (ഈ ഒരൊറ്റ ഫങ്ക്ഷൻ മാത്രം മതി)
async function addRemittance(cls, name) {
    const amt = prompt(`${name} (Class ${cls}) ഏൽപ്പിച്ച തുക നൽകുക:`);
    if (!amt || isNaN(amt)) return;

    // തീയതി ചോദിക്കുന്നു (default ആയി ഇന്നത്തെ തീയതി)
    const dateInput = prompt("തീയതി നൽകുക:", new Date().toLocaleDateString('en-IN'));
    if (!dateInput) return;

    // സമയം സിസ്റ്റത്തിൽ നിന്ന് ഓട്ടോമാറ്റിക് ആയി എടുക്കുന്നു
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    try {
        await db.collection("remittances").add({
            class: cls,
            usthadName: name,
            amount: Number(amt),
            date: dateInput,
            time: timeStr,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`വിജയകരമായി രേഖപ്പെടുത്തി!\nസമയം: ${timeStr}`);
        showCollectionReport();
    } catch (e) { alert("Error: " + e.message); }
}

// 3. ഉള്ള എൻട്രി തിരുത്താൻ (മാറ്റമില്ലാതെ)
async function editRemittance(id, oldAmount) {
    const newAmt = prompt("തിരുത്തിയ തുക നൽകുക:", oldAmount);
    if (!newAmt || isNaN(newAmt) || Number(newAmt) === oldAmount) return;
    
    try {
        await db.collection("remittances").doc(id).update({
            amount: Number(newAmt),
            lastEdited: new Date().toLocaleString('en-IN')
        });
        alert("തുക വിജയകരമായി തിരുത്തി!");
        showCollectionReport();
    } catch (e) { alert("Error: " + e.message); }
}

// 4. എൻട്രി ഡിലീറ്റ് ചെയ്യാൻ (മാറ്റമില്ലാതെ)
async function deleteRemittance(id) {
    if (!confirm("ഈ എൻട്രി ഹിസ്റ്ററിയിൽ നിന്ന് ഒഴിവാക്കണമെന്നുറപ്പാണോ?")) return;
    try {
        await db.collection("remittances").doc(id).delete();
        alert("എൻട്രി ഒഴിവാക്കിയിരിക്കുന്നു!");
        showCollectionReport();
    } catch (e) { alert("Error: " + e.message); }
}

// ---  ശമ്പള മാനേജ്‌മെന്റ് ഫങ്ക്ഷനുകൾ ഇവിടെ തുടങ്ങുന്നു (മാറ്റമില്ലാതെ) ---
// --- പരിഷ്കരിച്ച ശമ്പള മാനേജ്‌മെന്റ് ഫങ്ക്ഷനുകൾ ---

async function showSalaryManagement() {
    const user = JSON.parse(localStorage.getItem("activeUser"));
    const content = document.getElementById('dynamic-content');

    // 1. സദർ അല്ലാത്തവർക്ക് (ഉസ്താദുമാർക്ക്) ശമ്പള വിവരം മാത്രം കാണിക്കുന്നു
    if (user.role !== 'Sadhar') {
        content.innerHTML = `
            <div style="padding:20px; text-align:center;">
                <h3>💰 എന്റെ ശമ്പള വിവരം</h3>
                <div style="background:white; padding:30px; border-radius:15px; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
                    <p style="color:#666;">അടിസ്ഥാന ശമ്പളം: ₹${user.baseSalary || 0}</p>
                    <p style="font-size:12px; color:#999;">സദർ ശമ്പളം ഫൈനൽ ചെയ്ത ശേഷം ഇവിടെ തുക കാണാൻ സാധിക്കും.</p>
                    <button onclick="showCollectionReport()" style="padding:10px 20px; background:#6c757d; color:white; border:none; border-radius:8px; margin-top:15px;">തിരികെ</button>
                </div>
            </div>`;
        return;
    }

    // 2. സദറിനുള്ള മാനേജ്‌മെന്റ് ഭാഗം
    const usersSnap = await db.collection("users").where("role", "==", "Usthad").get();
    let usthadOptions = `<option value="">ഉസ്താദിനെ തിരഞ്ഞെടുക്കുക</option>`;
    
    usersSnap.forEach(doc => {
        const u = doc.data();
        usthadOptions += `<option value="${doc.id}" data-base="${u.baseSalary || 15000}" data-allowance="${u.allowance || 1000}">${u.name}</option>`;
    });

    content.innerHTML = `
        <div style="padding:20px; background:white; border-radius:15px; box-shadow:0 5px 20px rgba(0,0,0,0.1); max-width:500px; margin:auto; font-family:inherit;">
            <h3 style="text-align:center; color:#1a73e8; margin-bottom:20px;">💰 സാലറി മാനേജർ (Sadr)</h3>
            
            <div style="background:#f8f9fa; padding:15px; border-radius:10px;">
                <div style="margin-bottom:15px;">
                    <label style="font-size:12px; font-weight:bold;">ഉസ്താദിനെ തിരഞ്ഞെടുക്കുക:</label>
                    <select id="sal-usthad-select" onchange="updateUsthadFields()" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd;">
                        ${usthadOptions}
                    </select>
                </div>

                <div style="display:flex; gap:10px; margin-bottom:15px;">
                    <div style="flex:1;">
                        <label style="font-size:11px;">അടിസ്ഥാന ശമ്പളം:</label>
                        <input id="sal-base" type="number" oninput="calculateNetSalary()" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd;">
                    </div>
                    <div style="flex:1;">
                        <label style="font-size:11px;">അലവൻസുകൾ:</label>
                        <input id="sal-allowance" type="number" oninput="calculateNetSalary()" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd;">
                    </div>
                </div>

                <h5 style="margin:10px 0 5px 0; font-size:13px; color:#555; border-bottom:1px solid #eee; padding-bottom:5px;">ലീവ് വിവരങ്ങൾ</h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom:15px;">
                    <div>
                        <label style="font-size:10px; font-weight:bold; color:red;">CL (എടുത്തത്)</label>
                        <input id="sal-cl" type="number" value="0" step="0.5" oninput="calculateNetSalary()" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:5px;">
                    </div>
                    <div>
                        <label style="font-size:10px; font-weight:bold;">HPL</label>
                        <input id="sal-hpl" type="number" value="0" oninput="calculateNetSalary()" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:5px;">
                    </div>
                    <div>
                        <label style="font-size:10px; font-weight:bold;">LSW</label>
                        <input id="sal-lsw" type="number" value="0" oninput="calculateNetSalary()" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:5px;">
                    </div>
                </div>

                <div style="background:white; padding:15px; border-radius:10px; border:1px solid #eee;">
                    <p style="margin:0; font-size:12px; color:#666;">അനുവദനീയമായ CL: <b>1.5</b> (രണ്ട് മാസത്തിൽ 3)</p>
                    <p id="cl-bonus-text" style="margin:5px 0; font-size:12px; color:#28a745; display:none;">CL ബോണസ് (ബാക്കി): <b id="cl-bonus-amt">₹0</b></p>
                    <p style="margin:5px 0; font-size:12px; color:red;">ലീവ് കുറവ്: <b id="deduction-amt">₹0</b></p>
                    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                    <h3 style="margin:0; color:#1a73e8; text-align:center;">നൽകാനുള്ള തുക: <span id="net-salary">₹0</span></h3>
                </div>
            </div>

            <div style="display:flex; gap:10px; margin-top:20px;">
                <button onclick="showCollectionReport()" style="flex:1; padding:12px; background:#6c757d; color:white; border:none; border-radius:8px;">തിരികെ</button>
                <button onclick="saveSalaryToDB()" style="flex:2; padding:12px; background:#1a73e8; color:white; border:none; border-radius:8px; font-weight:bold;">സേവ് ചെയ്യുക</button>
            </div>
        </div>`;
}

function updateUsthadFields() {
    const select = document.getElementById('sal-usthad-select');
    const selectedOption = select.options[select.selectedIndex];
    if(!selectedOption.value) return;
    
    document.getElementById('sal-base').value = selectedOption.getAttribute('data-base') || 0;
    document.getElementById('sal-allowance').value = selectedOption.getAttribute('data-allowance') || 0;
    calculateNetSalary();
}

function calculateNetSalary() {
    const base = Number(document.getElementById('sal-base').value) || 0;
    const allowance = Number(document.getElementById('sal-allowance').value) || 0;
    const clTaken = parseFloat(document.getElementById('sal-cl').value) || 0;
    const hplTaken = Number(document.getElementById('sal-hpl').value) || 0;
    const lswTaken = Number(document.getElementById('sal-lsw').value) || 0;

    const dailyWage = base / 30;
    let netAddition = base + allowance;
    let totalDeduction = (hplTaken * dailyWage) + (lswTaken * dailyWage);
    
    let clBonus = 0;
    let clDeduction = 0;

    // 1.5 CL Logic: എടുത്തത് 1.5-ൽ കുറവാണെങ്കിൽ പണം കൂട്ടുന്നു, കൂടുതലാണെങ്കിൽ കുറയ്ക്കുന്നു
    if (clTaken < 1.5) {
        clBonus = (1.5 - clTaken) * dailyWage;
        document.getElementById('cl-bonus-text').style.display = 'block';
    } else {
        clDeduction = (clTaken - 1.5) * dailyWage;
        document.getElementById('cl-bonus-text').style.display = 'none';
    }

    totalDeduction += clDeduction;
    const finalNet = Math.round((netAddition + clBonus) - totalDeduction);

    document.getElementById('cl-bonus-amt').innerText = "₹" + Math.round(clBonus);
    document.getElementById('deduction-amt').innerText = "₹" + Math.round(totalDeduction);
    document.getElementById('net-salary').innerText = "₹" + finalNet;
}

async function saveSalaryToDB() {
    const usthadID = document.getElementById('sal-usthad-select').value;
    const finalAmt = document.getElementById('net-salary').innerText;
    if (!usthadID) { alert("ഉസ്താദിനെ തിരഞ്ഞെടുക്കുക!"); return; }

    try {
        await db.collection("salaries").doc(usthadID).set({
            totalAmount: finalAmt,
            date: new Date().toLocaleDateString(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: "Finalized"
        }, { merge: true });
        alert("ശമ്പള വിവരം വിജയകരമായി സേവ് ചെയ്തു.");
    } catch (e) { alert("Error: " + e.message); }
}

// --- ശമ്പള മാനേജ്‌മെന്റ് ഫങ്ക്ഷനുകൾ ഇവിടെ അവസാനിക്കുന്നു ---


async function loadSadharSalaryTracker(totalCollection) {
    const tracker = document.getElementById('usthad-salary-summary');
    let totalSalaryNeed = 0;
    let html = `<table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:15px;">
                <tr style="background:#f7fafc; text-align:left;">
                    <th style="padding:10px; border-bottom:2px solid #edf2f7;">ഉസ്താദ്</th>
                    <th style="padding:10px; border-bottom:2px solid #edf2f7;">ശമ്പളം</th>
                </tr>`;
    try {
        const uSnap = await db.collection("users").where("role", "==", "Usthad").get();
        uSnap.forEach(doc => {
            const u = doc.data();
            const salary = u.baseSalary || 6000;
            totalSalaryNeed += salary;
            html += `<tr><td style="padding:10px; border-bottom:1px solid #eee;">${u.name}</td><td style="padding:10px; border-bottom:1px solid #eee;">₹${salary}</td></tr>`;
        });
        html += `</table>`;
        const gap = totalSalaryNeed - totalCollection;
        tracker.innerHTML = html + `
            <div style="background:#fff5f5; padding:12px; border-radius:8px; border:1px solid #feb2b2;">
                <p style="margin:0; font-size:13px; color:#c53030;">
                    ആകെ സാലറി: <b>₹${totalSalaryNeed}</b><br>
                    ലഭിച്ച വരിസംഖ്യ: <b>₹${totalCollection}</b><br>
                    <b>ബാക്കി കണ്ടെത്തേണ്ടത്: ₹${gap > 0 ? gap : 0}</b>
                </p>
            </div>`;
    } catch(e) { tracker.innerHTML = "വിവരങ്ങൾ ലഭ്യമല്ല."; }
}

// ഉസ്താദുമാർക്ക് പണം നൽകുന്നത് രേഖപ്പെടുത്താനുള്ള ഫങ്ക്ഷൻ (പോപ്പ്-അപ്പ്)
async function showPaymentEntry() {
    try {
        const uSnap = await db.collection("users").where("role", "==", "Usthad").get();
        let options = `<option value="">ഉസ്താദിനെ തിരഞ്ഞെടുക്കുക</option>`;
        uSnap.forEach(doc => options += `<option value="${doc.data().name}">${doc.data().name}</option>`);

        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const dayNames = ["ഞായർ", "തിങ്കൾ", "ചൊവ്വ", "ബുധൻ", "വ്യാഴം", "വെള്ളി", "ശനി"];
        const currentDay = dayNames[now.getDay()];

        const modalHtml = `
            <div id="payment-modal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;">
                <div style="background:white; padding:20px; border-radius:15px; width:100%; max-width:400px; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                    <h3 style="text-align:center; color:#1a73e8; margin-bottom:15px;">💸 തുക കൈമാറ്റം</h3>
                    <div style="margin-bottom:12px;"><label style="font-size:12px;">ഉസ്താദിന്റെ പേര്:</label><select id="pop-name" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">${options}</select></div>
                    <div style="margin-bottom:12px;"><label style="font-size:12px;">തുക (₹):</label><input id="pop-amt" type="number" placeholder="₹0.00" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;"></div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:12px;">
                        <div><label style="font-size:11px;">തീയതി:</label><input id="pop-date" type="date" value="${currentDate}" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:12px;"></div>
                        <div><label style="font-size:11px;">ദിവസം:</label><input value="${currentDay}" readonly style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; background:#f0f0f0; font-size:12px;"></div>
                    </div>
                    <div style="margin-bottom:15px;"><label style="font-size:11px;">സമയം:</label><input id="pop-time" type="text" value="${currentTime}" readonly style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; background:#f0f0f0; font-size:12px;"></div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="document.getElementById('payment-modal').remove()" style="flex:1; padding:10px; background:#eee; border:none; border-radius:6px;">Cancel</button>
                        <button onclick="confirmPaymentSave()" style="flex:2; padding:10px; background:#28a745; color:white; border:none; border-radius:6px; font-weight:bold;">സേവ് ചെയ്യുക</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (e) { alert("Error loading users"); }
}

async function confirmPaymentSave() {
    const name = document.getElementById('pop-name').value;
    const amt = document.getElementById('pop-amt').value;
    const date = document.getElementById('pop-date').value;
    const time = document.getElementById('pop-time').value;
    if (!name || !amt) { alert("പേരും തുകയും നൽകുക!"); return; }
    try {
        await db.collection("salary_payments").add({
            usthadName: name, amount: Number(amt), date: date, time: time, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        document.getElementById('payment-modal').remove();
        alert("വിജയകരമായി രേഖപ്പെടുത്തി!");
    } catch (e) { alert("Error saving data!"); }
}



// --- ഫീസ് പേയ്‌മെന്റ് നടത്താനുള്ള ഫങ്ക്ഷൻ ---
async function payFee(id) {
    try {
        const studentRef = db.collection("students").doc(id);
        const doc = await studentRef.get();
        if (!doc.exists) { alert("കുട്ടിയെ കണ്ടെത്താനായില്ല!"); return; }
        
        const s = doc.data();
        const startMonthName = s.startMonth || "May";
        const startMonthIdx = monthsOrder.indexOf(startMonthName);

        let targetMonth = null;
        for (let i = startMonthIdx; i <= currentMonthIdx; i++) {
            const m = monthsOrder[i];
            if (!s.monthStatus[m] || !s.monthStatus[m].paid) {
                targetMonth = m;
                break;
            }
        }

        if (!targetMonth) { alert("എല്ലാ മാസത്തെയും ഫീസ് അടച്ചു കഴിഞ്ഞു!"); return; }

        const amt = s.monthlyFee || 250;
        
        // മാറ്റം: മാനുവലായി റെസീപ്റ്റ് നമ്പർ ചോദിക്കുന്നു
        const receiptNo = prompt(`${targetMonth} മാസത്തെ ഫീസ് (₹${amt}) - റെസീപ്റ്റ് നമ്പർ നൽകുക:`);
        
        if (receiptNo) {
            const today = new Date().toLocaleDateString('en-GB');

            await studentRef.update({
                [`monthStatus.${targetMonth}`]: {
                    paid: true,
                    date: today,
                    amount: amt,
                    rcpt: receiptNo
                }
            });

            // പെയ്‌മെന്റ് ഹിസ്റ്ററി സേവ് ചെയ്യുന്നു (പ്രിന്റിംഗിന് ആവശ്യമായ എല്ലാ വിവരങ്ങളും ഉൾപ്പെടുത്തി)
            await db.collection("payments").add({
                studentId: id,
                studentName: s.name,
                fatherName: s.fatherName || "-", // പിതാവിൻ്റെ പേര്
                houseName: s.houseName || "-",     // വീട്ടുപേര്
                parentPhone: s.parentPhone || "-", // ഫോൺ നമ്പർ
                studentID: s.studentID,
                amountPaid: amt,
                months: [targetMonth],
                date: today,
                receiptNo: receiptNo,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`വിജയകരമായി അടച്ചു!`);
            loadStudents(); 
            
            if (confirm("രസീത് പ്രിന്റ് ചെയ്യണോ?")) {
                // പ്രിന്റ് ചെയ്യുമ്പോൾ എല്ലാ വിവരങ്ങളും അയക്കുന്നു
                printReceipt(s.name, amt, targetMonth, today, receiptNo, s.studentID, s.fatherName, s.houseName, s.parentPhone);
            }
        }
    } catch (e) {
        alert("പിശക് സംഭവിച്ചു: " + e.message);
    }
}
                    
