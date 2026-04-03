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
// 1. പേജ് തുറക്കുമ്പോൾ തന്നെ ലോഗിൻ പരിശോധിക്കാൻ (One-Time Login)
window.onload = function() {
    const savedUser = localStorage.getItem("activeUser");
    if (savedUser) {
        applyPermissions(JSON.parse(savedUser));
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

    // സദർ അല്ലെങ്കിൽ ഉസ്താദ് ആണെങ്കിൽ
    if (user.role === 'Sadhar' || user.role === 'Usthad') {
        usthadView.style.display = 'block';
        studentView.style.display = 'none';

        // സദറിന് മാത്രം റിപ്പോർട്ട് ബട്ടൺ കാണിക്കുന്നു
        const reportBtn = document.getElementById('report-btn');
        if (reportBtn) {
            reportBtn.style.display = (user.role === 'Sadhar') ? 'block' : 'none';
        }

        // ഗുരുനിധി ബട്ടൺ
        const guruBtn = document.getElementById('gurunidhi-btn');
        if (guruBtn) guruBtn.style.display = 'block';

        // ലോഡ് ചെയ്യേണ്ട ഡാറ്റ തീരുമാനിക്കുന്നു
        if (user.role === 'Usthad') {
            loadStudents(user.assignedClass); // സ്വന്തം ക്ലാസ് മാത്രം
        } else {
            loadStudents(); // സദറിന് എല്ലാം
        }
    } else {
        // സ്റ്റുഡന്റ് വ്യൂ
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
            <p style="font-size:12px;">പ്രതിമാസ ഫീസ് (250 + ഓരോ സഹോദരങ്ങൾക്കും 50 വീതം):</p>
            <input id="n-monthly-fee" type="number" value="250" readonly style="background:#f9f9f9;">
            <input id="n-fees" type="number" placeholder="പഴയ ബാക്കി കുടിശ്ശിക">
            <button onclick="saveStudent()">സേവ് ചെയ്യുക</button>
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

// 7. ലോഗൗട്ട് ഫങ്ക്ഷൻ
function logout() {
    localStorage.removeItem("activeUser");
    location.reload();
}

// 3. സേവ് ഫങ്ക്ഷൻ
async function saveStudent() {
    const name = document.getElementById('n-name').value.trim();
    const cls = document.getElementById('n-class').value.trim();
    const father = document.getElementById('n-father').value.trim();
    const house = document.getElementById('n-house').value.trim();
    const phone = document.getElementById('n-phone').value.trim();
    const oldFees = Number(document.getElementById('n-fees').value) || 0;

    if (!name || !cls || !phone) { 
        alert("പേര്, ക്ലാസ്സ്, ഫോൺ നമ്പർ എന്നിവ നിർബന്ധമാണ്!"); 
        return; 
    }

    // സഹോദരങ്ങളെ ലിസ്റ്റ് ചെയ്യുന്നു
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

    // മാസ ഫീസ് കണക്കാക്കുന്നു (250 + ഓരോ സഹോദരങ്ങൾക്കും 50 വീതം)
    const mFee = 250 + (siblingsList.length * 50);

    // എല്ലാ മാസത്തെയും സ്റ്റാറ്റസ് തുടക്കത്തിൽ 'paid: false' ആക്കുന്നു
    let monthStatus = {};
    allMonths.forEach(m => { 
        monthStatus[m] = { paid: false, date: "-", amount: 0, rcpt: "-" }; 
    });

    // സ്റ്റുഡന്റ് ഐഡി നിർമ്മാണം
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
            monthlyFee: mFee, // കൃത്യമായി കണക്കാക്കിയ ഫീസ്
            balance: oldFees, 
            monthStatus: monthStatus, 
            addedDate: new Date().toLocaleDateString('en-IN'),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`വിജയകരമായി ചേർത്തു! ID: ${sid}`);
        
        // നിലവിൽ ലോഗിൻ ചെയ്ത ആളുടെ റോൾ അനുസരിച്ച് ലിസ്റ്റ് കാണിക്കുന്നു
        const user = JSON.parse(localStorage.getItem("activeUser"));
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

    // റോൾ അനുസരിച്ചുള്ള ഫിൽട്ടർ
    if (user.role === 'Usthad') {
        filterClass = user.assignedClass; 
        query = query.where("class", "==", filterClass);
    } else if (user.role === 'Sadhar') {
        showFilter = true; 
        if (filterClass !== 'all') {
            query = query.where("class", "==", filterClass);
        }
    }

    content.innerHTML = `
        ${showFilter ? `
            <select onchange="loadStudents(this.value)" style="margin-bottom:15px; width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;">
                <option value="all" ${filterClass === 'all' ? 'selected' : ''}>എല്ലാ ക്ലാസ്സും</option>
                ${[...Array(12).keys()].map(i => `<option value="${i+1}" ${filterClass == (i+1) ? 'selected' : ''}>ക്ലാസ്സ് ${i+1}</option>`).join('')}
            </select>` : `<h3 style="text-align:center; color:#1a73e8; margin-bottom:15px; background:#f8f9fa; padding:10px; border-radius:8px;">ക്ലാസ്സ് ${filterClass} - വിദ്യാർത്ഥികൾ</h3>`
        }
        <div id="list-area">ലോഡിംഗ്...</div>
    `;

    const snap = await query.get();
    const listArea = document.getElementById('list-area');
    listArea.innerHTML = "";

    snap.forEach(doc => {
        const s = doc.data();
        let sibCount = s.siblings ? s.siblings.length : 0;
        let sibHTML = sibCount > 0 ? s.siblings.map(sib => `${sib.name} (${sib.class})`).join(', ') : "ഇല്ല";

        // മന്ത് ടേബിൾ നിർമ്മാണം
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

        // കുടിശ്ശിക കണക്കുകൂട്ടൽ
        const mFee = s.monthlyFee || (250 + (sibCount * 50));
        const pendingMonthsFee = unpaidCount * mFee;
        const oldBal = Number(s.balance) || 0;
        const totalPending = pendingMonthsFee + oldBal;

        // ലിസ്റ്റ് ഐറ്റം ഡിസൈൻ
        listArea.innerHTML += `
            <div class="student-item" style="position:relative; background:white; padding:15px; margin-bottom:15px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border-left:5px solid #1a73e8;">
                <div style="position:absolute; right:10px; top:10px;">
                    ${(user.role === 'Sadhar' || (user.role === 'Usthad' && user.assignedClass == s.class)) ? `
                        <i class="fas fa-edit" onclick="editStudent('${doc.id}')" style="color:blue; cursor:pointer; margin-right:15px;"></i>
                        <i class="fas fa-trash" onclick="deleteStudent('${doc.id}')" style="color:red; cursor:pointer;"></i>
                    ` : ''}
                </div>
                <h4 style="margin:0 0 5px 0; color:#1a73e8;">${s.name} (ക്ലാസ്: ${s.class})</h4>
                <div style="font-size:12px; line-height:1.6;">
                    <b>പിതാവ്:</b> ${s.fatherName || '-'}<br>
                    <b>ID:</b> ${s.studentID} | <b>സഹോദരങ്ങൾ:</b> ${sibHTML}
                </div>
                
                ${monthTableHTML}
                
                <div style="background:#fff3f3; padding:10px; border-radius:8px; border:1px solid #ffebeb; margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                        <span>ഈ വർഷത്തെ ഫീസ് (₹${mFee} x ${unpaidCount}):</span>
                        <b style="color:#d32f2f;">₹${pendingMonthsFee}</b>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding-top:5px; border-top:1px dashed #ffdada;">
                        <div>
                            <span>പഴയ ബാക്കി: <b style="color:#d32f2f;">₹${oldBal}</b></span><br>
                            <small style="color:#888;">(${s.balanceNote || 'വിവരങ്ങളില്ല'})</small>
                        </div>
                        ${oldBal > 0 ? `<button onclick="payOldBalance('${doc.id}', '${s.parentPhone}', '${s.name}')" style="background:#d32f2f; color:white; border:none; padding:3px 8px; border-radius:4px; font-size:10px; cursor:pointer;">Pay Old</button>` : ''}
                    </div>
                    <div style="text-align:right; margin-top:8px; font-weight:bold; border-top:1px solid #ffdada; padding-top:5px; color:#000;">
                        ആകെ കുടിശ്ശിക: ₹${totalPending}
                    </div>
                </div>

                <div style="display:flex; gap:5px; margin-top:10px;">
                    <button onclick="updateFees('${doc.id}', '${s.parentPhone}', '${s.name}')" style="flex:1; background:#28a745; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Pay Month</button>
                    <button onclick="sendCustomWA('${s.parentPhone}', '${s.name}')" style="background:#25d366; flex:1; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Chat</button>
                </div>
            </div>`;
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

// **പഴയ കുടിശ്ശിക (Old Balance) അടയ്ക്കാൻ (പുതിയത്)**
async function payOldBalance(id, phone, name) {
    const ref = db.collection("students").doc(id);
    const snap = await ref.get();
    const s = snap.data();
    const currentBalance = Number(s.balance) || 0;

    if (currentBalance <= 0) { alert("പഴയ കുടിശ്ശിക നിലവിലില്ല."); return; }

    const payAmount = prompt(`പഴയ കുടിശ്ശിക: ₹${currentBalance}\n(${s.balanceNote || 'വിവരങ്ങളില്ല'})\nഎത്ര രൂപയാണ് അടയ്ക്കുന്നത്?`);
    if (!payAmount || isNaN(payAmount) || payAmount <= 0) return;
    
    if (Number(payAmount) > currentBalance) { alert("അടയ്ക്കുന്ന തുക കുടിശ്ശികയേക്കാൾ കൂടുതലാണ്!"); return; }

    const rcptNo = prompt("റെസീപ്റ്റ് നമ്പർ (Receipt No) നൽകുക:");
    if (!rcptNo) return;

    const date = new Date().toLocaleDateString('en-IN');
    const newBalance = currentBalance - Number(payAmount);

    try {
        await ref.update({ balance: newBalance });
        await db.collection("payments").add({
            studentId: id, studentName: name, amountPaid: Number(payAmount),
            date: date, time: new Date().toLocaleTimeString('en-IN'), 
            months: "Old Balance Payment", // മാസത്തിന് പകരം ഇത് കാണിക്കും
            receiptNo: rcptNo, studentID: s.studentID,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert(`വിജയകരമായി അടച്ചു! പുതിയ ബാക്കി: ₹${newBalance}`);
        if (confirm("റെസീപ്റ്റ് പ്രിന്റ് ചെയ്യണോ?")) { printReceipt(name, payAmount, "Old Balance", date, rcptNo, s.studentID); }
        loadStudents();
    } catch(e) { alert("Error updating balance!"); }
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
    } catch(e) { alert("পিശക്: " + e.message); }
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
function logout() { auth.signOut().then(() => location.reload()); }

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
    
    try {
        const snap = await db.collection("gurunidhi").orderBy("timestamp", "desc").get();
        listArea.innerHTML = "";
        
        snap.forEach(doc => {
            const g = doc.data();
            if(g.studentName.toLowerCase().includes(searchVal) || g.boxID.toLowerCase().includes(searchVal)) {
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
                                                        <button onclick="deleteGBox('${doc.id}')" style="background:#ff4d4d; color:white; border:none; padding:8px; border-radius:4px; font-size:11px;">ഡിലീറ്റ്</button>
                        </div>
                    </div>
                `;
            } // if ബ്ലോക്ക് ഇവിടെ അവസാനിക്കുന്നു
        }); // forEach ലൂപ്പ് ഇവിടെ അവസാനിക്കുന്നു
    } catch(e) { 
        listArea.innerHTML = "Error loading list."; 
    } // catch ബ്ലോക്ക് ഇവിടെ അവസാനിക്കുന്നു
} // loadGurunidhiList ഫങ്ക്ഷൻ ഇവിടെ അവസാനിക്കുന്നു

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
async function showCollectionReport() {
    // 1. ലോഗിൻ ചെയ്ത ആളുടെ വിവരങ്ങൾ പരിശോധിക്കുന്നു
    const user = JSON.parse(localStorage.getItem("activeUser"));
    
    // 2. സദർ (Sadhar) അല്ലെങ്കിൽ അഡ്മിൻ ആണോ എന്ന് നോക്കുന്നു. അല്ലെങ്കിൽ ബ്ലോക്ക് ചെയ്യുന്നു.
    if (!user || user.role !== 'Sadhar') {
        alert("ക്ഷമിക്കണം, ഈ റിപ്പോർട്ട് കാണാനുള്ള അധികാരം സദറിന് (Sadhar) മാത്രമാണ്.");
        return; 
    }

    const content = document.getElementById('dynamic-content');
    content.innerHTML = `<h3>📊 മാസം തിരിച്ചുള്ള റിപ്പോർട്ട്</h3><div id="report-area">വിവരങ്ങൾ ശേഖരിക്കുന്നു...</div>`;
    
    try {
        const snap = await db.collection("students").get();
        let monthData = {}; 
        let grandTotalPending = 0;

        snap.forEach(doc => {
            const s = doc.data();
            // സഹോദരങ്ങളെ കണക്കിലെടുത്തുള്ള കൃത്യമായ മാസ ഫീസ് (250 + 50 + 50...)
            const monthlyTotal = 250 + ((s.siblings ? s.siblings.length : 0) * 50);
            const mStatus = s.monthStatus || {};

            Object.keys(mStatus).forEach(month => {
                if (!monthData[month]) {
                    monthData[month] = { paid: 0, pending: 0, classes: {} };
                }

                const cls = s.class || "Unknown";
                if (!monthData[month].classes[cls]) {
                    monthData[month].classes[cls] = { total: 0, students: [] };
                }

                if (mStatus[month].paid) {
                    monthData[month].paid += monthlyTotal;
                } else {
                    monthData[month].pending += monthlyTotal;
                    monthData[month].classes[cls].total += monthlyTotal;
                    monthData[month].classes[cls].students.push({ name: s.name, amt: monthlyTotal });
                    grandTotalPending += monthlyTotal;
                }
            });
        });

        let html = `<div style="background:#d32f2f; color:white; padding:15px; border-radius:10px; margin-bottom:20px; text-align:center;">
                        <small>ആകെ ലഭിക്കാനുള്ള കുടിശ്ശിക</small>
                        <h2 style="margin:0;">₹${grandTotalPending}</h2>
                    </div>`;

        // മാസം തിരിച്ചുള്ള ലിസ്റ്റ് തയ്യാറാക്കുന്നു
        Object.keys(monthData).forEach(month => {
            const m = monthData[month];
            html += `
                <div style="background:#fff; border:1px solid #ddd; margin-bottom:10px; border-radius:8px; overflow:hidden;">
                    <div onclick="toggleMonth('${month}')" style="padding:15px; background:#f8f9fa; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <b>${month}</b><br>
                            <small style="color:green;">ലഭിച്ചത്: ₹${m.paid}</small> | <small style="color:red;">ബാക്കി: ₹${m.pending}</small>
                        </div>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div id="m-report-${month}" style="display:none; padding:10px; border-top:1px solid #eee;">
                        ${Object.keys(m.classes).sort((a,b)=>a-b).map(cls => `
                            <div style="margin-bottom:5px; border:1px solid #eee; border-radius:5px;">
                                <div onclick="toggleClass('${month}', '${cls}')" style="padding:8px; background:#fff8f8; cursor:pointer; display:flex; justify-content:space-between;">
                                    <span>ക്ലാസ്സ് ${cls}</span><span style="color:red;">₹${m.classes[cls].total}</span>
                                </div>
                                <div id="c-report-${month}-${cls}" style="display:none; padding:5px 10px; font-size:11px;">
                                    ${m.classes[cls].students.map(st => `
                                        <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #eee; padding:3px 0;">
                                            <span>${st.name}</span><span>₹${st.amt}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        });
        document.getElementById('report-area').innerHTML = html;
    } catch(e) { alert("Error: " + e.message); }
}

// ലിസ്റ്റുകൾ കാണിക്കാനും മറയ്ക്കാനും (ഇത് മാറ്റണ്ട)
function toggleMonth(month) {
    const div = document.getElementById(`m-report-${month}`);
    if(div) div.style.display = div.style.display === 'none' ? 'block' : 'none';
}

function toggleClass(month, cls) {
    const div = document.getElementById(`c-report-${month}-${cls}`);
    if(div) div.style.display = div.style.display === 'none' ? 'block' : 'none';
}

