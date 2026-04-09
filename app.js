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

// 4. ഓരോരുത്തർക്കും വേണ്ട അധികാരങ്ങൾ നൽകാൻ
function applyPermissions(user) {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'block';
    document.getElementById('display-name').innerText = user.name;
    
    const roleLabel = document.getElementById('display-role');
    if(roleLabel) roleLabel.innerText = user.role || "User";

    const usthadView = document.getElementById('usthad-view');
    const studentView = document.getElementById('student-view');

    if (user.role === 'Sadhar' || user.role === 'Usthad') {
        usthadView.style.display = 'block';
        studentView.style.display = 'none';

        // മാറ്റം വരുത്തിയ ഭാഗം: സദറിനും ഉസ്താദിനും റിപ്പോർട്ട് ബട്ടൺ കാണിക്കുന്നു
        const reportBtn = document.getElementById('report-btn');
        if (reportBtn) {
            reportBtn.style.display = 'block'; // എല്ലാവർക്കും കാണാം
        }

        const guruBtn = document.getElementById('gurunidhi-btn');
        if (guruBtn) guruBtn.style.display = 'block';

        if (user.role === 'Usthad') {
            loadStudents(user.assignedClass);
        } else {
            loadStudents();
        }
    } else {
        usthadView.style.display = 'none';
        studentView.style.display = 'block';
    }
}

// 5. സെക്ഷൻ സ്വിച്ചർ
function showSection(section) {
    const user = JSON.parse(localStorage.getItem("activeUser"));
    const content = document.getElementById('dynamic-content');
    
    if (section === 'student-list') {
        // ഉസ്താദ് ആണെങ്കിൽ സ്വന്തം ക്ലാസ് മാത്രം ലോഡ് ചെയ്യാൻ പാരാമീറ്റർ നൽകുന്നു
        loadStudents(user.role === 'Usthad' ? user.assignedClass : null);
    }
    else if (section === 'add-student') {
    content.innerHTML = `
        <div style="padding:15px; background:white; border-radius:12px; box-shadow:0 4px 15px rgba(0,0,0,0.1);">
            <h3 style="color:#1a73e8; text-align:center; border-bottom:2px solid #eef2f7; padding-bottom:10px;">🆕 പുതിയ വിദ്യാർത്ഥി</h3>
            
            <label style="font-size:12px; font-weight:bold; color:#555;">വിദ്യാർത്ഥിയുടെ വിവരം:</label>
            <input id="n-name" placeholder="കുട്ടിയുടെ പേര്" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px;">
            <input id="n-class" placeholder="ക്ലാസ്സ് (eg: 1, 2..)" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px;">
            <input id="n-father" placeholder="പിതാവിന്റെ പേര്" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px;">
            <input id="n-house" placeholder="വീട്ടുപേര്" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px;">
            <input id="n-phone" placeholder="വാട്ട്സാപ്പ് നമ്പർ (91xxxx)" style="width:100%; padding:12px; margin-bottom:12px; border:1px solid #dee2e6; border-radius:8px;">

            <div id="sibling-container" style="background:#f0f7ff; padding:10px; border-radius:10px; margin-bottom:10px; border:1px solid #cfe2ff;">
                <p style="font-size:12px; color:#084298; margin-bottom:8px; font-weight:bold;">സഹോദരങ്ങൾ (മദ്രസയിൽ പഠിക്കുന്നവർ):</p>
                <div class="sibling-entry" style="display:flex; gap:5px; margin-bottom:8px;">
                    <input class="s-name" placeholder="പേര്" style="flex:2; padding:10px; border:1px solid #dee2e6; border-radius:6px;">
                    <input class="s-class" placeholder="ക്ലാസ്സ്" style="flex:1; padding:10px; border:1px solid #dee2e6; border-radius:6px;">
                </div>
            </div>
            <button onclick="addSiblingField()" style="background:#28a745; margin-bottom:15px; font-size:12px; padding:10px; color:white; border:none; border-radius:8px; width:100%; cursor:pointer;">+ ഒരാളെ കൂടി ചേർക്കുക</button>

            <div style="background:#f8f9fa; padding:15px; border-radius:10px; margin-bottom:15px; border:1px solid #e9ecef;">
                <p style="font-size:13px; font-weight:bold; color:#495057; margin-bottom:8px;">📅 അധ്യയന വർഷം ക്രമീകരണം:</p>
                
                <label style="font-size:11px; color:#6c757d;">ആകെ മാസങ്ങൾ:</label>
                <select id="n-fee-months" style="width:100%; padding:10px; margin-bottom:12px; border-radius:6px; border:1px solid #ced4da; background:white;">
                    <option value="9">9 മാസം</option>
                    <option value="10">10 മാസം</option>
                    <option value="11">11 മാസം</option>
                    <option value="12" selected>12 മാസം</option>
                </select>

                <label style="font-size:11px; color:#6c757d;">ക്ലാസ് ആരംഭിക്കുന്ന മാസം:</label>
                <select id="n-start-month" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ced4da; background:white;">
                    <option value="Jan">January</option>
                    <option value="Feb">February</option>
                    <option value="Mar">March</option>
                    <option value="Apr">April</option>
                    <option value="May" selected>May (അധ്യയന വർഷം ആരംഭം)</option>
                    <option value="Jun">June</option>
                    <option value="Jul">July</option>
                </select>
            </div>

            <label style="font-size:11px; color:#6c757d;">പ്രതിമാസ വരിസംഖ്യ:</label>
            <input id="n-monthly-fee" type="number" value="250" readonly style="width:100%; padding:12px; margin-bottom:12px; background:#e9ecef; border:1px solid #dee2e6; border-radius:8px; font-weight:bold;">
            
            <label style="font-size:11px; color:#6c757d;">പഴയ ബാക്കി (ഉണ്ടെങ്കിൽ):</label>
            <input id="n-fees" type="number" placeholder="0" style="width:100%; padding:12px; margin-bottom:20px; border:1px solid #dee2e6; border-radius:8px;">
            
            <button onclick="saveStudent()" style="width:100%; padding:15px; background:#1a73e8; color:white; border:none; border-radius:10px; font-weight:bold; font-size:16px; cursor:pointer;">സേവ് ചെയ്യുക</button>
        </div>
    `;
}

    else if (section === 'gurunidhi') {
        showGurunidhiSection(); 
    }
    else if (section === 'report') {
        showCollectionReport(); 
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

// 4. സ്റ്റുഡന്റ് ലിസ്റ്റ് (Old Balance ഫീച്ചർ ഉൾപ്പെടെ)
async function loadStudents(filterClass = 'all') {
    const savedUser = localStorage.getItem("activeUser");
    if (!savedUser) return;
    const user = JSON.parse(savedUser);

    const content = document.getElementById('dynamic-content');
    let query = db.collection("students");
    let showFilter = false;

    // 1. റോൾ അനുസരിച്ചുള്ള ഫിൽട്ടർ (സദർ vs ഉസ്താദ്)
    if (user.role === 'Usthad') {
        filterClass = user.assignedClass; 
        query = query.where("class", "==", filterClass);
    } else if (user.role === 'Sadhar') {
        showFilter = true; 
        if (filterClass !== 'all') {
            query = query.where("class", "==", filterClass);
        }
    }

    // 2. ഹെഡർ ഭാഗം (ക്ലാസ് സെലക്ഷൻ മെനു)
    let headerHTML = '';
    if (showFilter) {
        headerHTML = `
            <select onchange="loadStudents(this.value)" style="margin-bottom:15px; width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; font-family:inherit;">
                <option value="all" ${filterClass === 'all' ? 'selected' : ''}>എല്ലാ ക്ലാസ്സും</option>
                ${[...Array(12).keys()].map(i => `<option value="${i+1}" ${filterClass == (i+1) ? 'selected' : ''}>ക്ലാസ്സ് ${i+1}</option>`).join('')}
            </select>`;
    } else {
        headerHTML = `<h3 style="text-align:center; color:#1a73e8; margin-bottom:15px; background:#f8f9fa; padding:10px; border-radius:8px;">ക്ലാസ്സ് ${filterClass} - വിദ്യാർത്ഥികൾ</h3>`;
    }

    content.innerHTML = headerHTML + `<div id="list-area">ലോഡിംഗ്...</div>`;

    const snap = await query.get();
    const listArea = document.getElementById('list-area');
    listArea.innerHTML = "";

        snap.forEach(doc => {
        const s = doc.data();
        let sibCount = s.siblings ? s.siblings.length : 0;

        // --- മാസങ്ങൾ കണക്കാക്കുന്ന പുതിയ ലോജിക് (അറബി മാസം അടിസ്ഥാനപ്പെടുത്തിയത്) ---
        
        // കുട്ടിയുടെ ഡാറ്റയിൽ നിന്ന് ക്ലാസ് തുടങ്ങിയ മാസം എടുക്കുന്നു (ഇല്ലെങ്കിൽ 'May' എന്ന് കരുതുന്നു)
        const startMonthName = s.startMonth || "May"; 
        const startMonthIdx = monthsOrder.indexOf(startMonthName);

        let unpaidCount = 0;
        let pendingMonthsNames = [];

        // അധ്യയന വർഷം തുടങ്ങിയ മാസം മുതൽ ഈ മാസം വരെയുള്ള കുടിശ്ശിക മാത്രം നോക്കുന്നു
        monthsOrder.forEach((m, idx) => {
            // 1. ക്ലാസ് തുടങ്ങിയ മാസത്തിന് മുമ്പുള്ളവ ഒഴിവാക്കുന്നു
            // 2. നിലവിലെ മാസത്തിന് ശേഷമുള്ളവ (Future Months) ഒഴിവാക്കുന്നു
            if (idx >= startMonthIdx && idx <= currentMonthIdx) {
                const isPaid = s.monthStatus && s.monthStatus[m]?.paid;
                if (!isPaid) {
                    unpaidCount++;
                    pendingMonthsNames.push(m);
                }
            }
        });

        // മന്ത് ടേബിൾ നിർമ്മാണം (കാഴ്ചയിൽ മാറ്റം വരുത്താൻ താഴെയുള്ളത് ഉപയോഗിക്കാം)
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

        // കുടിശ്ശിക കണക്കുകൂട്ടൽ
        const mFee = s.monthlyFee || (250 + (sibCount * 50));
        const pendingMonthsFee = unpaidCount * mFee;
        const oldBal = Number(s.balance) || 0;
        const totalPending = pendingMonthsFee + oldBal;

        // 3. ഓരോ കുട്ടിയുടെയും കാർഡ് ഡിസൈൻ
        listArea.innerHTML += `
            <div class="student-item" style="position:relative; background:white; padding:15px; margin-bottom:15px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border-left:5px solid #1a73e8;">
                <div style="position:absolute; right:10px; top:10px;">
                    ${(user.role === 'Sadhar' || (user.role === 'Usthad' && user.assignedClass == s.class)) ? `
                        <i class="fas fa-edit" onclick="editStudent('${doc.id}')" style="color:blue; cursor:pointer; margin-right:15px;"></i>
                        <i class="fas fa-trash" onclick="deleteStudent('${doc.id}')" style="color:red; cursor:pointer;"></i>
                    ` : ''}
                </div>
                <h4 style="margin:0 0 5px 0; color:#1a73e8;">${s.name} (ക്ലാസ്: ${s.class})</h4>
                <div style="font-size:11px; color:#666; margin-bottom:5px;">
                    <b>ID:</b> ${s.studentID} | <b>ഫീസ് മാസം:</b> ${s.feeMonths || 12} മാസം
                </div>
                ${monthTableHTML}
                
                <div style="background:#fff3f3; padding:10px; border-radius:8px; border:1px solid #ffebeb; margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                        <span>ബാക്കി മാസങ്ങൾ (${unpaidCount}):</span>
                        <b style="color:#d32f2f;">₹${pendingMonthsFee}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding-top:5px; border-top:1px dashed #ffdada;">
                        <div>
                            <span>പഴയ ബാക്കി: <b style="color:#d32f2f;">₹${oldBal}</b></span>
                        </div>
                        ${oldBal > 0 ? `<button onclick="payOldBalance('${doc.id}', '${s.parentPhone}', '${s.name}')" style="background:#d32f2f; color:white; border:none; padding:3px 8px; border-radius:4px; font-size:10px; cursor:pointer;">Pay Old</button>` : ''}
                    </div>
                    <div style="text-align:right; margin-top:8px; font-weight:bold; border-top:1px solid #ffdada; padding-top:5px; color:#000;">
                        ആകെ കുടിശ്ശിക: ₹${totalPending}
                    </div>
                </div>

                <div style="display:flex; gap:5px; margin-top:10px;">
                    <button onclick="payFee('${doc.id}')" style="flex:1; background:#28a745; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer; font-size:12px;">Pay Month</button>
                    <button onclick="sendCustomWA('${s.parentPhone}', '${s.name}')" style="background:#25d366; flex:1; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer; font-size:12px;">Chat</button>
                </div>
            </div>`;
    });
}

// 6. പ്രിന്റ് ഫങ്ക്ഷൻ (Colorful & Large JPG/PDF)
function printReceipt(name, amount, months, date, rcptNo, sid) {
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
                    .header .sub-info { font-size: 13px; color: #666; margin: 5px 0 10px 0; font-weight: 400; }
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
                        <div class="receipt-label">ഫീസ് രസീത് (OFFICIAL RECEIPT)</div>
                    </div>
                    <div class="info-section">
                        <div class="info-row"><span class="label">രസീത് നം:</span><span class="value">#${rcptNo}</span></div>
                        <div class="info-row"><span class="label">തീയതി:</span><span class="value">${date}</span></div>
                        <div class="info-row"><span class="label">വിദ്യാർത്ഥി:</span><span class="value">${name}</span></div>
                        <div class="info-row"><span class="label">സ്റ്റുഡന്റ് ID:</span><span class="value">${sid || '-'}</span></div>
                        <div class="info-row"><span class="label">മാസങ്ങൾ:</span><span class="value">${Array.isArray(months) ? months.join(', ') : months}</span></div>
                    </div>
                    <div class="amount-container"><span>ആകെ തുക (Total Amount)</span><h1>₹${amount}</h1></div>
                    <div class="footer"><p>ഫിസബീലില്ലാഹ് - നന്ദി!</p><div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; font-size: 10px; color: #bbb;">Computer Generated Digital Receipt</div></div>
                </div>
                <div class="btn-group no-print">
                    <button class="btn btn-download" onclick="downloadImage()">Download JPG (Photo)</button>
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

// 8. ഹിസ്റ്ററി & റീ-പ്രിന്റ് (Payments)
async function viewHistory(studentId, studentName) {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `<h4>History: ${studentName}</h4><button onclick="loadStudents()" style="margin-bottom:10px;">Back</button><div id="hist-list"></div>`;
    const snap = await db.collection("payments").where("studentId", "==", studentId).orderBy("timestamp", "desc").get();
    if(snap.empty) { document.getElementById('hist-list').innerHTML = "വിവരങ്ങളില്ല"; return; }
    snap.forEach(doc => {
        const p = doc.data(); const monthsStr = Array.isArray(p.months) ? p.months.join(', ') : p.months;
        document.getElementById('hist-list').innerHTML += `
            <div style="background:#f0f7ff; padding:10px; margin-bottom:8px; border-radius:8px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
                <div><b>No: ${p.receiptNo || '-'}</b> | ${p.date}<br>₹${p.amountPaid} (${monthsStr})</div>
                <button onclick="printReceipt('${p.studentName}', ${p.amountPaid}, '${monthsStr}', '${p.date}', '${p.receiptNo}', '${p.studentID || ''}')" style="...">Print</button>
            </div>`;
    });
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

// 2. ലിസ്റ്റ് ലോഡ് ചെയ്യുമ്പോൾ (പുതിയ ബട്ടണുകൾ സഹിതം)
async function loadGurunidhiList() {
    const listArea = document.getElementById('gurunidhi-list-area');
    const searchVal = document.getElementById('g-search').value.toLowerCase();
    
    // ലോഗിൻ ചെയ്ത യൂസറുടെ വിവരങ്ങൾ എടുക്കുന്നു
    const user = JSON.parse(localStorage.getItem("activeUser"));

    try {
        let query = db.collection("gurunidhi");

        // പുതിയ മാറ്റം: ഉസ്താദ് ആണെങ്കിൽ സ്വന്തം ക്ലാസ്സ് മാത്രം കാണിക്കുന്നു
        if (user && user.role === 'Usthad') {
            query = query.where("studentClass", "==", user.assignedClass);
        }

        // സമയം അനുസരിച്ച് ക്രമീകരിക്കുന്നു
        const snap = await query.orderBy("timestamp", "desc").get();
        listArea.innerHTML = "";
        
        snap.forEach(doc => {
            const g = doc.data();
            
            // സെർച്ച് ഫിൽട്ടർ
            if(g.studentName.toLowerCase().includes(searchVal) || g.boxID.toLowerCase().includes(searchVal)) {
                
                // സദർ ആണെങ്കിൽ മാത്രം ഡിലീറ്റ് ബട്ടൺ കാണിക്കാൻ
                const deleteBtn = (user && user.role === 'Sadhar') ? 
                    `<button onclick="deleteGBox('${doc.id}')" style="background:#ff4d4d; color:white; border:none; padding:8px; border-radius:4px; font-size:11px;">ഡിലീറ്റ്</button>` : '';

                listArea.innerHTML += `
                    <div style="border:1px solid #eee; padding:12px; margin-bottom:10px; border-radius:10px; background:#fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                        <div style="display:flex; justify-content:space-between;">
                            <b style="color:#d32f2f;">${g.studentName} (${g.studentClass})</b>
                            <span style="font-size:10px; background:#f0f0f0; padding:2px 5px; border-radius:5px;">ID: ${g.boxID}</span>
                        </div>
                        <div style="font-size:12px; color:#555; margin:5px 0;">
                            വീട്: ${g.houseName || '-'} | നൽകിയത്: ${g.givenDate || '-'}<br>
                            ആകെ ലഭിച്ച തുക: <b style="color:green; font-size:14px;">₹${g.totalAmount || 0}</b>
                        </div>
                        <div style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                            <button onclick="addGPayment('${doc.id}', '${g.studentName}', '${g.boxID}')" style="background:#28a745; color:white; border:none; padding:8px; border-radius:4px; font-size:11px;">തുക ചേർക്കുക</button>
                            <button onclick="viewGHistory('${doc.id}', '${g.studentName}')" style="background:#1a73e8; color:white; border:none; padding:8px; border-radius:4px; font-size:11px;">History</button>
                            <button onclick="reissueGBox('${doc.id}')" style="background:#ff9800; color:white; border:none; padding:8px; border-radius:4px; font-size:11px;">Re-Issue (തീയതി മാറ്റുക)</button>
                            ${deleteBtn}
                        </div>
                    </div>
                `;
            }
        });

        if (listArea.innerHTML === "") {
            listArea.innerHTML = "<p style='text-align:center; font-size:12px; color:#888;'>വിവരങ്ങൾ ലഭ്യമല്ല.</p>";
        }

    } catch(e) { 
        console.error("Error loading list: ", e);
        listArea.innerHTML = "വിവരങ്ങൾ ലഭിക്കുന്നതിൽ തടസ്സം നേരിട്ടു."; 
    }
}

// 3. തുക ചേർക്കാനും റെസീപ്റ്റ് നമ്പർ നൽകാനും
async function addGPayment(docId, name, boxID) {
    const amt = prompt("ലഭിച്ച തുക:");
    if(!amt) return;
    const rcpt = prompt("റെസീപ്റ്റ് നമ്പർ (Receipt No):");
    if(!rcpt) { alert("റെസീപ്റ്റ് നമ്പർ നൽകണം!"); return; }
    const date = new Date().toLocaleDateString('en-IN');

    try {
        // ഹിസ്റ്ററിയിലേക്ക് സേവ് ചെയ്യുന്നു
        await db.collection("gurunidhi").doc(docId).collection("payments").add({
            amount: Number(amt),
            receiptNo: rcpt,
            date: date,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // ആകെ തുക അപ്‌ഡേറ്റ് ചെയ്യുന്നു
        const ref = db.collection("gurunidhi").doc(docId);
        const gDoc = await ref.get();
        const currentTotal = gDoc.data().totalAmount || 0;
        
        await ref.update({
            totalAmount: currentTotal + Number(amt),
            lastPaymentDate: date
        });

        alert("സേവ് ചെയ്തു!");
        loadGurunidhiList();
        
        if(confirm("രസീപ്റ്റ് പ്രിന്റ് ചെയ്യണോ?")) {
            printReceipt(name, amt, "Gurunidhi Box Contribution", date, "GN-"+rcpt, boxID);
        }
    } catch(e) { alert("Error updating payment!"); }
}

// 4. ഓരോ കുട്ടിയുടെയും ഹിസ്റ്ററി കാണാൻ
async function viewGHistory(docId, name) {
    const listArea = document.getElementById('gurunidhi-list-area');
    listArea.innerHTML = `<h4>History: ${name}</h4><button onclick="loadGurunidhiList()" style="margin-bottom:10px;">Back</button><div id="gh-list"></div>`;
    
    const snap = await db.collection("gurunidhi").doc(docId).collection("payments").orderBy("timestamp", "desc").get();
    const ghList = document.getElementById('gh-list');
    
    if(snap.empty) { ghList.innerHTML = "ഹിസ്റ്ററി ലഭ്യമല്ല."; return; }

    snap.forEach(doc => {
        const p = doc.data();
        ghList.innerHTML += `
            <div style="background:#f9f9f9; padding:10px; border-bottom:1px solid #ddd; display:flex; justify-content:space-between; font-size:12px;">
                <div><b>₹${p.amount}</b><br><small>${p.date}</small></div>
                <div>Rcpt No: ${p.receiptNo}</div>
            </div>`;
    });
}

// 5. ബോക്സ് തിരിച്ചെടുക്കാനും പുതിയ തീയതിയിൽ നൽകാനും
async function reissueGBox(id) {
    const newDate = prompt("പുതിയ തീയതി (DD/MM/YYYY):", new Date().toLocaleDateString('en-IN'));
    if(!newDate) return;

    try {
        await db.collection("gurunidhi").doc(id).update({
            givenDate: newDate,
            // ആവശ്യമുണ്ടെങ്കിൽ ഇവിടെ ആകെ തുക റീസെറ്റ് ചെയ്യാം (totalAmount: 0)
        });
        alert("പുതുക്കി!");
        loadGurunidhiList();
    } catch(e) { alert("Error!"); }
}

// 6. ഡിലീറ്റ് ചെയ്യാൻ
async function deleteGBox(id) {
    if(confirm("ഈ കുട്ടിയുടെ എല്ലാ ഗുരുനിധി വിവരങ്ങളും ഒഴിവാക്കണോ?")) {
        await db.collection("gurunidhi").doc(id).delete();
        loadGurunidhiList();
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

async function showSalaryManagement() {
    const content = document.getElementById('dynamic-content');
    try {
        const uSnap = await db.collection("users").where("role", "==", "Usthad").get();
        let usthadOptions = `<option value="">തിരഞ്ഞെടുക്കുക</option>`;
        uSnap.forEach(doc => {
            const data = doc.data();
            usthadOptions += `<option value="${doc.id}" data-base="${data.baseSalary || 0}">${data.name}</option>`;
        });

        content.innerHTML = `
            <div style="padding:20px; background:white; border-radius:15px; box-shadow:0 5px 20px rgba(0,0,0,0.1); max-width:500px; margin:auto;">
                <h3 style="text-align:center; color:#1a73e8; margin-bottom:20px;">💰 ശമ്പളവും ലീവ് കണക്കും</h3>
                <div style="margin-bottom:15px;">
                    <label style="font-size:12px;">ഉസ്താദിനെ തിരഞ്ഞെടുക്കുക:</label>
                    <select id="sal-usthad-select" onchange="updateBaseSalaryFromSelect()" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd;">
                        ${usthadOptions}
                    </select>
                </div>
                <div style="background:#f8f9fa; padding:15px; border-radius:10px;">
                    <div style="margin-bottom:15px;"><label style="font-size:12px;">അടിസ്ഥാന ശമ്പളം:</label><input id="sal-base" type="number" readonly style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd; background:#eee;"></div>
                    <div style="margin-bottom:15px;"><label style="font-size:12px;">ഈ മാസത്തെ അലവൻസ്:</label><input id="sal-allowance" type="number" value="0" oninput="calculateNetSalary()" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd; border-left:4px solid #1a73e8;"></div>
                    <div style="margin-bottom:15px;"><label style="font-size:12px;">എടുത്ത ലീവ്:</label><input id="sal-leaves" type="number" value="0" step="0.5" oninput="calculateNetSalary()" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd;"></div>
                    <div style="background:white; padding:15px; border-radius:10px; border:1px solid #eee; margin-top:10px;">
                        <p style="margin:5px 0; font-size:13px; color:red;">ലീവ് കുറവ്: <b id="deduction-amt">₹0</b></p>
                        <h3 style="margin:10px 0 0 0; color:#28a745; text-align:center;">നെറ്റ് ശമ്പളം: <span id="net-salary">₹0</span></h3>
                    </div>
                </div>
                <div style="display:flex; gap:10px; margin-top:20px;">
                    <button onclick="showCollectionReport()" style="flex:1; padding:12px; background:#6c757d; color:white; border:none; border-radius:8px;">തിരികെ</button>
                    <button onclick="saveSalaryRecord()" style="flex:2; padding:12px; background:#1a73e8; color:white; border:none; border-radius:8px; font-weight:bold;">സേവ് ചെയ്യുക</button>
                </div>
            </div>`;
    } catch (e) { alert("Error!"); }
}

function updateBaseSalaryFromSelect() {
    const select = document.getElementById('sal-usthad-select');
    const baseInput = document.getElementById('sal-base');
    const selectedOption = select.options[select.selectedIndex];
    baseInput.value = selectedOption.getAttribute('data-base') || 0;
    calculateNetSalary();
}

function calculateNetSalary() {
    const base = Number(document.getElementById('sal-base').value) || 0;
    const allowance = Number(document.getElementById('sal-allowance').value) || 0;
    const leaves = Number(document.getElementById('sal-leaves').value) || 0;
    let deduction = 0;
    if (leaves > 1.5) deduction = Math.round((leaves - 1.5) * (base / 30));
    const net = (base + allowance) - deduction;
    document.getElementById('deduction-amt').innerText = `₹${deduction}`;
    document.getElementById('net-salary').innerText = `₹${net}`;
}

async function saveSalaryRecord() {
    const select = document.getElementById('sal-usthad-select');
    const usthadName = select.options[select.selectedIndex].text;
    const net = document.getElementById('net-salary').innerText.replace('₹', '');
    if (!select.value) { alert("ഉസ്താദിനെ തിരഞ്ഞെടുക്കുക!"); return; }
    try {
        await db.collection("salary_payments").add({
            usthadName: usthadName, amount: Number(net), date: new Date().toISOString().split('T')[0], timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("വിജയകരമായി സേവ് ചെയ്തു!");
        showCollectionReport();
    } catch (e) { alert("Error!"); }
}

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

async function showSalaryManagement() {
    const user = JSON.parse(localStorage.getItem("activeUser"));
    const content = document.getElementById('dynamic-content');
    const baseVal = user.baseSalary || 15000;
    const allowVal = user.allowance || 1000;
    content.innerHTML = `
        <div style="padding:20px; background:white; border-radius:15px; box-shadow:0 5px 20px rgba(0,0,0,0.1); max-width:500px; margin:auto;">
            <h3 style="text-align:center; color:#1a73e8; margin-bottom:20px;">💰 ശമ്പളവും ലീവ് കണക്കും</h3>
            <div style="background:#f8f9fa; padding:15px; border-radius:10px;">
                <div style="margin-bottom:15px;"><label style="font-size:12px;">അടിസ്ഥാന ശമ്പളം:</label><input id="sal-base" type="number" value="${baseVal}" oninput="calculateNetSalary()" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd;"></div>
                <div style="margin-bottom:15px;"><label style="font-size:12px;">അലവൻസുകൾ:</label><input id="sal-allowance" type="number" value="${allowVal}" oninput="calculateNetSalary()" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd;"></div>
                <div style="margin-bottom:15px;"><label style="font-size:12px;">എടുത്ത ലീവ്:</label><input id="sal-leaves" type="number" value="0" step="0.5" oninput="calculateNetSalary()" style="width:100%; padding:10px; border-radius:6px; border:1px solid #ddd;"></div>
                <div style="background:white; padding:15px; border-radius:10px; border:1px solid #eee; margin-top:10px;">
                    <p style="margin:0; font-size:13px;">അനുവദനീയമായ ലീവ്: 1.5</p>
                    <p style="margin:5px 0; font-size:13px; color:red;">ലീവ് കാരണം കുറയുന്നത്: <b id="deduction-amt">₹0</b></p>
                    <h3 style="margin:10px 0 0 0; color:#28a745; text-align:center;">നൽകാനുള്ള തുക: <span id="net-salary">₹0</span></h3>
                </div>
            </div>
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button onclick="showCollectionReport()" style="flex:1; padding:12px; background:#6c757d; color:white; border:none; border-radius:8px;">തിриകെ</button>
                ${user.role === 'Sadhar' ? `<button onclick="saveSalaryRecord()" style="flex:2; padding:12px; background:#1a73e8; color:white; border:none; border-radius:8px;">സേവ് ചെയ്യുക</button>` : ''}
            </div>
        </div>`;
    calculateNetSalary();
}

function calculateNetSalary() {
    const base = Number(document.getElementById('sal-base').value) || 0;
    const allowance = Number(document.getElementById('sal-allowance').value) || 0;
    const leaves = Number(document.getElementById('sal-leaves').value) || 0;
    let deduction = 0;
    if (leaves > 1.5) deduction = (leaves - 1.5) * (base / 30);
    const net = (base + allowance) - deduction;
    document.getElementById('deduction-amt').innerText = "₹" + Math.round(deduction);
    document.getElementById('net-salary').innerText = "₹" + Math.round(net);
}

async function saveSalaryRecord() {
    alert("ശമ്പള വിവരം താൽക്കാലികമായി കണക്കാക്കി. ഡാറ്റാബേസിലേക്ക് സേവ് ചെയ്യാനുള്ള സൗകര്യം ഉടൻ ലഭ്യമാകും.");
}
function updateBaseSalary() {
    const select = document.getElementById('sal-usthad-select');
    const baseInput = document.getElementById('sal-base');
    const selectedOption = select.options[select.selectedIndex];
    
    // users കളക്ഷനിൽ നിന്ന് ലഭിക്കുന്ന baseSalary ഇവിടെ നൽകുന്നു
    baseInput.value = selectedOption.getAttribute('data-base') || 0;
    
    // തുക മാറുമ്പോൾ നെറ്റ് സാലറിയും റീ-കാൽക്കുലേറ്റ് ചെയ്യണം
    calculateNetSalary(); 
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

        // കുടിശ്ശികയുള്ള ആദ്യത്തെ മാസം കണ്ടെത്തുന്നു
        let targetMonth = null;
        for (let i = startMonthIdx; i <= currentMonthIdx; i++) {
            const m = monthsOrder[i];
            if (!s.monthStatus[m] || !s.monthStatus[m].paid) {
                targetMonth = m;
                break;
            }
        }

        if (!targetMonth) {
            alert("എല്ലാ മാസത്തെയും ഫീസ് അടച്ചു കഴിഞ്ഞു!");
            return;
        }

        const amt = s.monthlyFee || 250;
        const confirmPay = confirm(`${targetMonth} മാസത്തെ ഫീസ് (₹${amt}) സ്വീകരിച്ചോ?`);
        
        if (confirmPay) {
            const today = new Date().toLocaleDateString('en-GB');
            const receiptNo = "R" + Math.floor(1000 + Math.random() * 9000);

            await studentRef.update({
                [`monthStatus.${targetMonth}`]: {
                    paid: true,
                    date: today,
                    amount: amt,
                    rcpt: receiptNo
                }
            });

            // പേയ്‌മെന്റ് ഹിസ്റ്ററിയിലേക്കും മാറ്റുന്നു
            await db.collection("payments").add({
                studentId: id,
                studentName: s.name,
                studentID: s.studentID,
                amountPaid: amt,
                months: [targetMonth],
                date: today,
                receiptNo: receiptNo,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`${targetMonth} മാസത്തെ ഫീസ് വിജയകരമായി അടച്ചു.`);
            loadStudents(); // ലിസ്റ്റ് പുതുക്കുന്നു
            
            if (confirm("രസീത് പ്രിന്റ് ചെയ്യണോ?")) {
                printReceipt(s.name, amt, targetMonth, today, receiptNo, s.studentID);
            }
        }
    } catch (e) {
        console.error("Payment Error: ", e);
        alert("പിശക് സംഭവിച്ചു: " + e.message);
    }
}
