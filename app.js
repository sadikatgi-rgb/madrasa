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

// 2. ലോഗിൻ ഫങ്ക്ഷനുകൾ
async function loginUser() {
    const userID = document.getElementById('login-id').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!userID || !pass) { alert("ഐഡിയും പാസ്‌വേഡും നൽകുക"); return; }
    if (!userID.toLowerCase().startsWith('usthad')) { checkStudentLogin(userID, pass); return; }
    let email = userID.toLowerCase() + "@islahululoom.com";
    try {
        const res = await auth.signInWithEmailAndPassword(email, pass);
        checkUser(res.user.uid);
    } catch (e) { alert("ലോഗിൻ പരാജയപ്പെട്ടു: " + e.message); }
}

async function checkStudentLogin(sid, pass) {
    const snap = await db.collection("students").where("studentID", "==", sid).get();
    if (!snap.empty) {
        const s = snap.docs[0].data();
        showStudentProfile(s, snap.docs[0].id);
    } else { alert("വിദ്യാർത്ഥി ഐഡി തെറ്റാണ്!"); }
}

async function checkUser(uid) {
    try {
        const doc = await db.collection("users").doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('login-page').style.display = 'none';
            document.getElementById('main-dashboard').style.display = 'block';
            document.getElementById('display-name').innerText = data.name;
            document.getElementById('display-role').innerText = "Administrator";
            document.getElementById('usthad-view').style.display = 'block';
            document.getElementById('student-view').style.display = 'none';
            showSection('student-list');
        }
    } catch (error) { alert("Error!"); }
}

// 3. സെക്ഷൻ സ്വിച്ചർ
function showSection(section) {
    const content = document.getElementById('dynamic-content');
    if (section === 'student-list') loadStudents();
    else if (section === 'add-student') {
        content.innerHTML = `
            <h3>പുതിയ കുട്ടി</h3>
            <input id="n-name" placeholder="കുട്ടിയുടെ പേര്">
            <input id="n-class" placeholder="ക്ലാസ്സ് (eg: 1, 2..)">
            <input id="n-father" placeholder="പിതാവിന്റെ പേര്">
            <input id="n-house" placeholder="വീട്ടുപേര്">
            <div id="sibling-container">
                <p style="font-size:12px; color:blue; margin-bottom:5px;">സহോദരങ്ങൾ (പേരും ക്ലാസ്സും):</p>
                <div class="sibling-entry" style="display:flex; gap:5px; margin-bottom:5px;">
                    <input class="s-name" placeholder="പേര്" style="flex:2;">
                    <input class="s-class" placeholder="ക്ലാസ്സ്" style="flex:1;">
                </div>
            </div>
            <button onclick="addSiblingField()" style="background:#28a745; margin-bottom:15px; font-size:12px; padding:5px;">+ ഒരാളെ കൂടി ചേർക്കുക</button>
            <input id="n-phone" placeholder="വാട്ട്സാപ്പ് നമ്പർ (91xxxx)">
            <input id="n-monthly-fee" type="number" placeholder="പ്രതിമാസ വരിസംഖ്യ (Monthly Fee)">
            <input id="n-fees" type="number" placeholder="ആകെ അടയ്ക്കാനുള്ള പഴയ ബാക്കി (ഉണ്ടെങ്കിൽ)">
            <button onclick="saveStudent()">സേവ് ചെയ്യുക</button>
        `;
    }
}

function addSiblingField() {
    const container = document.getElementById('sibling-container');
    const div = document.createElement('div');
    div.className = 'sibling-entry';
    div.style.display = 'flex'; div.style.gap = '5px'; div.style.marginBottom = '5px';
    div.innerHTML = `<input class="s-name" placeholder="പേര്" style="flex:2;"><input class="s-class" placeholder="ക്ലാസ്സ്" style="flex:1;">`;
    container.appendChild(div);
}

// 4. കുട്ടി വിവരങ്ങൾ സേവ് ചെയ്യുക
async function saveStudent() {
    const name = document.getElementById('n-name').value;
    const cls = document.getElementById('n-class').value;
    const father = document.getElementById('n-father').value;
    const house = document.getElementById('n-house').value;
    const phone = document.getElementById('n-phone').value;
    const mFee = Number(document.getElementById('n-monthly-fee').value);
    const oldFees = Number(document.getElementById('n-fees').value);

    let siblingsList = [];
    const sibNames = document.getElementsByClassName('s-name');
    const sibClasses = document.getElementsByClassName('s-class');
    for (let i = 0; i < sibNames.length; i++) {
        if (sibNames[i].value.trim() !== "") {
            siblingsList.push({ name: sibNames[i].value, class: sibClasses[i].value });
        }
    }

    // ഓരോ മാസത്തെയും സ്റ്റാറ്റസ് തയ്യാറാക്കുന്നു
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let monthStatus = {};
    months.forEach(m => { monthStatus[m] = { paid: false, date: "-", amount: 0 }; });

    const sid = name.toLowerCase().substring(0,3) + phone.slice(-4);
    const ഇപ്പോൾ = new Date();
    const തീയതി = ഇപ്പോൾ.toLocaleDateString('en-IN');
    const സമയം = ഇപ്പോൾ.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    try {
        await db.collection("students").add({
            name, class: cls, fatherName: father, houseName: house,
            siblings: siblingsList, parentPhone: phone, studentID: sid,
            monthlyFee: mFee, totalAmount: oldFees, paidAmount: 0, balance: oldFees,
            monthStatus: monthStatus, addedDate: തീയതി, addedTime: സമയം,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`വിജയകരമായി ചേർത്തു! ID: ${sid}`);
        showSection('student-list');
    } catch(e) { alert("പിശക് സംഭവിച്ചു!"); }
}

// 5. ലിസ്റ്റ് ലോഡ് ചെയ്യുക
async function loadStudents(filterClass = 'all') {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <select onchange="loadStudents(this.value)" style="margin-bottom:15px; width:100%; padding:10px;">
            <option value="all">എല്ലാ ക്ലാസ്സും</option>
            ${[...Array(12).keys()].map(i => `<option value="${i+1}">ക്ലാസ്സ് ${i+1}</option>`).join('')}
        </select>
        <div id="list-area">ലോഡിംഗ്...</div>
    `;
    let query = db.collection("students");
    if (filterClass !== 'all') query = query.where("class", "==", filterClass);
    const snap = await query.get();
    const listArea = document.getElementById('list-area');
    listArea.innerHTML = "";

    snap.forEach(doc => {
        const s = doc.data();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let paidMonths = []; let unpaidMonths = [];
        
        if (s.monthStatus) {
            months.forEach(m => {
                if (s.monthStatus[m].paid) paidMonths.push(`${m} (${s.monthStatus[m].date})`);
                else unpaidMonths.push(m);
            });
        }

        const pendingAmount = (unpaidMonths.length * (s.monthlyFee || 0)) + (Number(s.balance) || 0);

        listArea.innerHTML += `
            <div class="student-item" style="position:relative; border:1px solid #ddd; padding:15px; border-radius:10px; margin-bottom:10px; border-left:5px solid #1a73e8;">
                <div style="position:absolute; right:10px; top:10px;">
                    <i class="fas fa-edit" onclick="editStudent('${doc.id}')" style="color:blue; cursor:pointer; margin-right:15px;"></i>
                    <i class="fas fa-trash" onclick="deleteStudent('${doc.id}')" style="color:red; cursor:pointer;"></i>
                </div>
                <strong>${s.name} (ക്ലാസ്: ${s.class})</strong><br>
                <small>ID: ${s.studentID} | മാസ വരിസംഖ്യ: ₹${s.monthlyFee || 0}</small><br>
                
                <div style="background:#f1f8ff; padding:8px; border-radius:5px; margin:10px 0; font-size:11px;">
                    <p style="color:green; margin:0;"><strong>അടച്ച മാസങ്ങൾ:</strong> ${paidMonths.join(', ') || 'ഇല്ല'}</p>
                    <p style="color:red; margin:0;"><strong>അടയ്ക്കാനുള്ള മാസങ്ങൾ:</strong> ${unpaidMonths.join(', ') || 'എല്ലാം അടച്ചു'}</p>
                </div>

                <span style="color:red; font-weight:bold;">ആകെ കുടിശ്ശിക: ₹${pendingAmount}</span>
                
                <div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:10px;">
                    <button class="fee-btn" onclick="updateFees('${doc.id}', '${s.parentPhone}', '${s.name}')" style="flex:1;">Pay Fee</button>
                    <button onclick="viewHistory('${doc.id}', '${s.name}')" style="background:#6c757d; flex:1;">History</button>
                    <button class="wa-btn" onclick="sendCustomWA('${s.parentPhone}', '${s.name}')" style="flex:1;"><i class="fab fa-whatsapp"></i> Chat</button>
                </div>
            </div>
        `;
    });
}

// 6. ഫീ അപ്‌ഡേറ്റ് (മാസങ്ങൾ സഹിതം)
async function updateFees(id, phone, name) {
    const monthsInput = prompt("ഏതൊക്കെ മാസത്തെ ഫീസാണ് അടയ്ക്കുന്നത്? (ഉദാ: Jan, Feb അല്ലെങ്കിൽ Jan)");
    if (!monthsInput) return;

    const selectedMonths = monthsInput.split(',').map(m => m.trim());
    try {
        const ref = db.collection("students").doc(id);
        const doc = await ref.get();
        const s = doc.data();
        
        let currentStatus = s.monthStatus || {};
        let totalToPay = 0;
        let paidNowNames = [];
        const തീയതി = new Date().toLocaleDateString('en-IN');
        const സമയം = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

        selectedMonths.forEach(m => {
            if (currentStatus[m] && !currentStatus[m].paid) {
                currentStatus[m].paid = true;
                currentStatus[m].date = തീയതി;
                currentStatus[m].amount = s.monthlyFee;
                totalToPay += Number(s.monthlyFee);
                paidNowNames.push(m);
            }
        });

        if (totalToPay === 0) { alert("തിരഞ്ഞെടുത്ത മാസങ്ങൾ നിലവിൽ അടച്ചവയാണ്!"); return; }

        await ref.update({ monthStatus: currentStatus });

        await db.collection("payments").add({
            studentId: id, studentName: name, amountPaid: totalToPay,
            date: തീയതി, time: സമയം, months: paidNowNames,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        const msg = `അസ്സലാമു അലൈക്കും, \n${name}-ന്റെ ഫീസ് വിവരങ്ങൾ: \nമാസങ്ങൾ: ${paidNowNames.join(', ')} \nതീയതി: ${തീയതി} \nതുക: ₹${totalToPay} സ്വീകരിച്ചു.`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        loadStudents();
    } catch(e) { alert("Error!"); }
}

// 7. ഹിസ്റ്ററി & എഡിറ്റ് (പഴയത് പോലെ തന്നെ)
async function viewHistory(studentId, studentName) {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `<h4>History: ${studentName}</h4><button onclick="loadStudents()">Back</button><div id="hist-list"></div>`;
    const snap = await db.collection("payments").where("studentId", "==", studentId).orderBy("timestamp", "desc").get();
    const area = document.getElementById('hist-list');
    if(snap.empty) { area.innerHTML = "വിവരങ്ങളില്ല"; return; }
    snap.forEach(doc => {
        const p = doc.data();
        area.innerHTML += `<div style="background:#f0f7ff; padding:10px; margin-bottom:8px; border-radius:8px;">
            <small>${p.date} | ${p.time}</small><br>
            <strong>₹${p.amountPaid} (${p.months ? p.months.join(', ') : 'Old Payment'})</strong>
        </div>`;
    });
}

function sendCustomWA(phone, name) {
    const msg = `അസ്സലാമു അലൈക്കും, ഇസ്‌ലാഹുൽ ഉലൂം മദ്റസയിൽ നിന്ന് ${name}-ന്റെ കാര്യവുമായി ബന്ധപ്പെട്ട് ബന്ധപ്പെടുകയാണ്.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

async function deleteStudent(id) { if (confirm("ഒഴിവാക്കണോ?")) { await db.collection("students").doc(id).delete(); loadStudents(); } }
function logout() { auth.signOut().then(() => location.reload()); }
