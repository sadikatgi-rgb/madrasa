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

const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// 2. ലോഗിൻ & സെക്ഷൻ സ്വിച്ചർ
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
                <p style="font-size:12px; color:blue; margin-bottom:5px;">സഹോദരങ്ങൾ (പേരും ക്ലാസ്സും):</p>
                <div class="sibling-entry" style="display:flex; gap:5px; margin-bottom:5px;">
                    <input class="s-name" placeholder="പേര്" style="flex:2;">
                    <input class="s-class" placeholder="ക്ലാസ്സ്" style="flex:1;">
                </div>
            </div>
            <button onclick="addSiblingField()" style="background:#28a745; margin-bottom:15px; font-size:12px; padding:5px; color:white;">+ ഒരാളെ കൂടി ചേർക്കുക</button>
            <input id="n-phone" placeholder="വാട്ട്സാപ്പ് നമ്പർ (91xxxx)">
            <p style="font-size:12px;">പ്രതിമാസ ഫീസ് (ആദ്യത്തെ കുട്ടിക്ക് 250, അധികമുള്ളവർക്ക് 50 വീതം):</p>
            <input id="n-monthly-fee" type="number" placeholder="പ്രതിമാസ ഫീസ്" value="250" readonly style="background:#f9f9f9;">
            <input id="n-fees" type="number" placeholder="പഴയ ബാക്കി കുടിശ്ശിക">
            <button onclick="saveStudent()">സേവ് ചെയ്യുക</button>
        `;
    }
}

function addSiblingField() {
    const container = document.getElementById('sibling-container');
    const div = document.createElement('div');
    div.style.display = 'flex'; div.style.gap = '5px'; div.style.marginBottom = '5px';
    div.innerHTML = `<input class="s-name" placeholder="പേര്" style="flex:2;"><input class="s-class" placeholder="ക്ലാസ്സ്" style="flex:1;">`;
    container.appendChild(div);
    const count = document.getElementsByClassName('s-name').length;
    document.getElementById('n-monthly-fee').value = 250 + ((count - 1) * 50);
}

// 3. സേവ് ഫങ്ക്ഷൻ
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

    let monthStatus = {};
    allMonths.forEach(m => { monthStatus[m] = { paid: false, date: "-", amount: 0, rcpt: "-" }; });

    const sid = name.toLowerCase().substring(0,3) + phone.slice(-4);

    try {
        await db.collection("students").add({
            name, class: cls, fatherName: father, houseName: house,
            siblings: siblingsList, parentPhone: phone, studentID: sid,
            monthlyFee: mFee, balance: oldFees, monthStatus: monthStatus, 
            addedDate: new Date().toLocaleDateString('en-IN'),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`വിജയകരമായി ചേർത്തു! ID: ${sid}`);
        showSection('student-list');
    } catch(e) { alert("പിശക് സംഭവിച്ചു!"); }
}

// 4. സ്റ്റുഡന്റ് ലിസ്റ്റ്
async function loadStudents(filterClass = 'all') {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `<select onchange="loadStudents(this.value)" style="margin-bottom:15px; width:100%; padding:10px;">
        <option value="all">എല്ലാ ക്ലാസ്സും</option>
        ${[...Array(12).keys()].map(i => `<option value="${i+1}">ക്ലാസ്സ് ${i+1}</option>`).join('')}
    </select><div id="list-area">ലോഡിംഗ്...</div>`;

    let query = db.collection("students");
    if (filterClass !== 'all') query = query.where("class", "==", filterClass);
    const snap = await query.get();
    const listArea = document.getElementById('list-area');
    listArea.innerHTML = "";

    snap.forEach(doc => {
        const s = doc.data();
        let sibCount = s.siblings ? s.siblings.length : 0;
        let sibHTML = sibCount > 0 ? s.siblings.map(sib => `${sib.name} (${sib.class})`).join(', ') : "ഇല്ല";

        let monthTableHTML = `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin: 10px 0; font-size: 10px;">`;
        let unpaidCount = 0;
        allMonths.forEach(m => {
            const isPaid = s.monthStatus && s.monthStatus[m]?.paid;
            if(!isPaid) unpaidCount++;
            monthTableHTML += `
                <div style="border: 1px solid #ddd; padding: 4px; text-align: center; border-radius:3px; background: ${isPaid ? '#e8f5e9' : '#fff'}">
                    <b style="color: ${isPaid ? 'green' : '#777'}">${m}</b><br>
                    <span style="font-size:8px;">${isPaid ? s.monthStatus[m].date : '-'}</span><br>
                    <span style="font-size:7px; color:blue;">${isPaid ? 'No:' + (s.monthStatus[m].rcpt || '-') : ''}</span>
                </div>`;
        });
        monthTableHTML += `</div>`;

        const pending = (unpaidCount * s.monthlyFee) + (Number(s.balance) || 0);

        listArea.innerHTML += `
            <div class="student-item" style="position:relative; border:1px solid #ddd; padding:15px; border-radius:12px; margin-bottom:15px; background: #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                <div style="position:absolute; right:10px; top:10px;">
                    <i class="fas fa-edit" onclick="editStudent('${doc.id}')" style="color:blue; cursor:pointer; margin-right:15px;"></i>
                    <i class="fas fa-trash" onclick="deleteStudent('${doc.id}')" style="color:red; cursor:pointer;"></i>
                </div>
                <h4 style="margin:0 0 5px 0; color:#1a73e8;">${s.name} (ക്ലാസ്: ${s.class})</h4>
                <div style="font-size:12px; line-height:1.6;">
                    <b>പിതാവ്:</b> ${s.fatherName || '-'}<br>
                    <b>ID:</b> ${s.studentID} | <b>സഹോദരങ്ങൾ:</b> ${sibHTML}
                </div>
                ${monthTableHTML}
                <div style="background:#fff3f3; padding:8px; border-radius:5px; border:1px solid #ffebeb;">
                    <div style="display:flex; justify-content:space-between; font-size:12px;">
                        <span>മാസ ഫീസ്: <b>₹${s.monthlyFee}</b></span>
                        <span style="color:red; font-weight:bold;">ബാക്കി: ₹${pending}</span>
                    </div>
                </div>
                <div style="display:flex; gap:5px; margin-top:10px;">
                    <button onclick="updateFees('${doc.id}', '${s.parentPhone}', '${s.name}')" style="flex:1; background:#28a745; color:white; border:none; padding:8px; border-radius:5px;">Pay Fee</button>
                    <button onclick="viewHistory('${doc.id}', '${s.name}')" style="background:#6c757d; flex:1; color:white; border:none; padding:8px; border-radius:5px;">History</button>
                    <button onclick="sendCustomWA('${s.parentPhone}', '${s.name}')" style="background:#25d366; flex:1; color:white; border:none; padding:8px; border-radius:5px;">Chat</button>
                </div>
            </div>
        `;
    });
}

// 5. ഫീ അപ്‌ഡേറ്റ് & പ്രിന്റ്
async function updateFees(id, phone, name) {
    const monthsInput = prompt("അടയ്ക്കുന്ന മാസങ്ങൾ നൽകുക (eg: Jan, Feb):");
    if (!monthsInput) return;
    const rcptNo = prompt("റെസീപ്റ്റ് നമ്പർ (Receipt No) നൽകുക:");
    if (!rcptNo) { alert("റെസീപ്റ്റ് നമ്പർ നൽകണം!"); return; }

    const selected = monthsInput.split(',').map(m => m.trim().charAt(0).toUpperCase() + m.trim().slice(1).toLowerCase());
    
    try {
        const ref = db.collection("students").doc(id);
        const snap = await ref.get();
        const s = snap.data();
        let status = s.monthStatus || {};
        let total = 0; let paidNow = [];
        const date = new Date().toLocaleDateString('en-IN');

        selected.forEach(m => {
            if (status[m] && !status[m].paid) {
                status[m] = { paid: true, date: date, amount: s.monthlyFee, rcpt: rcptNo };
                total += s.monthlyFee;
                paidNow.push(m);
            }
        });

        if (total === 0) { alert("മാസങ്ങൾ തെറ്റാണ് അല്ലെങ്കിൽ നിലവിൽ അടച്ചവയാണ്!"); return; }

        await ref.update({ monthStatus: status });
        await db.collection("payments").add({
            studentId: id, studentName: name, amountPaid: total,
            date: date, time: new Date().toLocaleTimeString('en-IN'), 
            months: paidNow, receiptNo: rcptNo, studentID: s.studentID,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (confirm("ഫീസ് സ്വീകരിച്ചു! റെസീപ്റ്റ് പ്രിന്റ് ചെയ്യണോ?")) {
            printReceipt(name, total, paidNow, date, rcptNo, s.studentID);
        }

        const msg = `*ഇസ്‌ലാഹുൽ ഉലൂം മദ്റസ*\nഫീസ് രസീത് നം: ${rcptNo}\nവിദ്യാർത്ഥി: ${name}\nതുക: ₹${total}\nമാസങ്ങൾ: ${paidNow.join(', ')}\nതീയതി: ${date}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        loadStudents();
    } catch(e) { alert("Error!"); }
}

// 6. പ്രിന്റ് ഫങ്ക്ഷൻ (PDF)
function printReceipt(name, amount, months, date, rcptNo, sid) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head><title>Receipt - ${rcptNo}</title></head>
            <body style="font-family: 'Arial', sans-serif; padding: 20px; border: 1px dashed #000; width: 280px; margin: auto; text-align: center;">
                <h2 style="margin:0;">ഇസ്‌ലാഹുൽ ഉലൂം മദ്റസ</h2>
                <p style="font-size:12px; margin:5px 0;">ഫീസ് രസീത് (OFFICIAL)</p>
                <hr>
                <div style="text-align: left; font-size: 13px; line-height:1.6;">
                    <p style="margin:3px 0;"><b>നം:</b> ${rcptNo} | <b>തീയതി:</b> ${date}</p>
                    <p style="margin:3px 0;"><b>വിദ്യാർത്ഥി:</b> ${name}</p>
                    <p style="margin:3px 0;"><b>ID:</b> ${sid || '-'}</p>
                    <p style="margin:3px 0;"><b>മാസങ്ങൾ:</b> ${Array.isArray(months) ? months.join(', ') : months}</p>
                </div>
                <div style="border: 1px solid #000; padding: 10px; font-size: 18px; font-weight: bold; margin: 10px 0;">
                    ആകെ തുക: ₹${amount}
                </div>
                <p style="font-size: 10px;">ഫിസബീലില്ലാഹ് - നന്ദി!</p>
                <button onclick="window.print()" style="margin-top:10px; cursor:pointer;" class="no-print">Print / Download PDF</button>
                <style>@media print {.no-print {display:none;}}</style>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// 7. വിപുലമായ എഡിറ്റിംഗ് (Edit)
async function editStudent(id) {
    const doc = await db.collection("students").doc(id).get();
    const s = doc.data();
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <div style="background:#fff; padding:20px; border-radius:12px; border:1px solid #ddd;">
            <h3>വിവരങ്ങൾ തിരുത്തുക</h3>
            <label>പേര്:</label><input id="e-name" value="${s.name}">
            <label>ക്ലാസ്:</label><input id="e-class" value="${s.class}">
            <label>പിതാവ്:</label><input id="e-father" value="${s.fatherName || ''}">
            <label>വീട്:</label><input id="e-house" value="${s.houseName || ''}">
            <label>ഫോൺ:</label><input id="e-phone" value="${s.parentPhone || ''}">
            <label>പഴയ കുടിശ്ശിക:</label><input id="e-balance" type="number" value="${s.balance || 0}">
            <p style="font-size:11px; color:blue; margin-top:10px;">സഹോദരങ്ങൾ (പേര്:ക്ലാസ്സ് - കോമയിട്ട് നൽകുക):</p>
            <input id="e-siblings" oninput="recalcEditFee()" value="${s.siblings ? s.siblings.map(sib => sib.name + ":" + sib.class).join(', ') : ''}" placeholder="Sinan:4, Shibli:10">
            <label>പ്രതിമാസ ഫീസ് (ഓട്ടോ):</label>
            <input id="e-fee" type="number" value="${s.monthlyFee}" readonly style="background:#f0f0f0;">
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button onclick="saveEdit('${id}')" style="background:#28a745; flex:1; color:white; border:none; padding:10px; border-radius:5px;">സേവ് ചെയ്യുക</button>
                <button onclick="loadStudents()" style="background:#6c757d; flex:1; color:white; border:none; padding:10px; border-radius:5px;">ക്യാൻസൽ</button>
            </div>
        </div>
    `;
}

function recalcEditFee() {
    const sibs = document.getElementById('e-siblings').value.split(',').filter(x => x.trim() !== "");
    document.getElementById('e-fee').value = 250 + (sibs.length * 50);
}

async function saveEdit(id) {
    const sibInput = document.getElementById('e-siblings').value;
    const siblings = sibInput.split(',').filter(i => i.trim() !== "").map(i => {
        let p = i.split(':');
        return { name: p[0].trim(), class: p[1] ? p[1].trim() : '' };
    });
    try {
        await db.collection("students").doc(id).update({
            name: document.getElementById('e-name').value,
            class: document.getElementById('e-class').value,
            fatherName: document.getElementById('e-father').value,
            houseName: document.getElementById('e-house').value,
            parentPhone: document.getElementById('e-phone').value,
            balance: Number(document.getElementById('e-balance').value),
            monthlyFee: Number(document.getElementById('e-fee').value),
            siblings: siblings
        });
        alert("വിവരങ്ങൾ പുതുക്കി!");
        loadStudents();
    } catch(e) { alert("പിശക് സംഭവിച്ചു!"); }
}

// 8. ഹിസ്റ്ററി & റീ-പ്രിന്റ്
async function viewHistory(studentId, studentName) {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `<h4>History: ${studentName}</h4><button onclick="loadStudents()" style="margin-bottom:10px;">Back</button><div id="hist-list"></div>`;
    const snap = await db.collection("payments").where("studentId", "==", studentId).orderBy("timestamp", "desc").get();
    const area = document.getElementById('hist-list');
    if(snap.empty) { area.innerHTML = "വിവരങ്ങളില്ല"; return; }
    snap.forEach(doc => {
        const p = doc.data();
        const monthsStr = Array.isArray(p.months) ? p.months.join(', ') : p.months;
        area.innerHTML += `
            <div style="background:#f0f7ff; padding:10px; margin-bottom:8px; border-radius:8px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
                <div style="line-height:1.4;">
                    <b>No: ${p.receiptNo || '-'}</b> | ${p.date}<br>
                    ₹${p.amountPaid} (${monthsStr})
                </div>
                <button onclick="printReceipt('${p.studentName}', ${p.amountPaid}, '${monthsStr}', '${p.date}', '${p.receiptNo}', '${p.studentID || ''}')" 
                    style="padding:5px 8px; background:#1a73e8; color:white; font-size:10px; width:auto; border:none; border-radius:3px; cursor:pointer;">
                    Print
                </button>
            </div>`;
    });
}

function sendCustomWA(phone, name) {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent('അസ്സലാമു അലൈക്കും, ' + name + '-ന്റെ കാര്യവുമായി ബന്ധപ്പെട്ട്...')}`, '_blank');
}

async function deleteStudent(id) { if (confirm("ഒഴിവാക്കണോ?")) { await db.collection("students").doc(id).delete(); loadStudents(); } }
function logout() { auth.signOut().then(() => location.reload()); }
