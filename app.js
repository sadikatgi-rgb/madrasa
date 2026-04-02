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

                // കുടിശ്ശികകൾ കണക്കാക്കുന്നു
        const pendingMonthsFee = unpaidCount * s.monthlyFee;
        const oldBalance = Number(s.balance) || 0;
        const totalPending = pendingMonthsFee + oldBalance;

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
                
                <div style="background:#fff3f3; padding:10px; border-radius:8px; border:1px solid #ffebeb; margin-top:10px;">
                    <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
                        <span>ഈ വർഷത്തെ മാസ ഫീസ് (₹${s.monthlyFee} x ${unpaidCount}):</span>
                        <b style="color:#d32f2f;">₹${pendingMonthsFee}</b>
                    </div>
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; padding-top:5px; border-top:1px dashed #ffdada;">
                        <span>പഴയ കുടിശ്ശിക (Old Balance): <b style="color:#d32f2f;">₹${oldBalance}</b></span>
                        ${oldBalance > 0 ? `<button onclick="payOldBalance('${doc.id}', '${s.parentPhone}', '${s.name}')" style="background:#d32f2f; color:white; border:none; padding:3px 8px; border-radius:4px; font-size:10px; cursor:pointer;">Pay Old</button>` : ''}
                    </div>
                    
                    <div style="text-align:right; margin-top:8px; font-weight:bold; border-top:1px solid #ffdada; padding-top:5px; color:#000;">
                        ആകെ കുടിശ്ശിക: ₹${totalPending}
                    </div>
                </div>

                <div style="display:flex; gap:5px; margin-top:10px;">
                    <button onclick="updateFees('${doc.id}', '${s.parentPhone}', '${s.name}')" style="flex:1; background:#28a745; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Pay Month Fee</button>
                    <button onclick="viewHistory('${doc.id}', '${s.name}')" style="background:#6c757d; flex:1; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">History</button>
                    <button onclick="sendCustomWA('${s.parentPhone}', '${s.name}')" style="background:#25d366; flex:1; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Chat</button>
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
// പഴയ കുടിശ്ശിക (Old Balance) അടയ്ക്കാൻ
async function payOldBalance(id, phone, name) {
    const ref = db.collection("students").doc(id);
    const snap = await ref.get();
    const s = snap.data();
    const currentBalance = Number(s.balance) || 0;

    if (currentBalance <= 0) {
        alert("പഴയ കുടിശ്ശിക നിലവിലില്ല.");
        return;
    }

    const payAmount = prompt(`പഴയ കുടിശ്ശിക: ₹${currentBalance}\nഎത്ര രൂപയാണ് അടയ്ക്കുന്നത്?`);
    if (!payAmount || isNaN(payAmount) || payAmount <= 0) return;
    
    if (Number(payAmount) > currentBalance) {
        alert("അടയ്ക്കുന്ന തുക കുടിശ്ശികയേക്കാൾ കൂടുതലാണ്!");
        return;
    }

    const rcptNo = prompt("റെസീപ്റ്റ് നമ്പർ (Receipt No) നൽകുക:");
    if (!rcptNo) return;

    const date = new Date().toLocaleDateString('en-IN');
    const newBalance = currentBalance - Number(payAmount);

    try {
        // ബാലൻസ് അപ്‌ഡേറ്റ് ചെയ്യുന്നു
        await ref.update({ balance: newBalance });

        // പേയ്‌മെന്റ് ഹിസ്റ്ററിയിലേക്ക് ചേർക്കുന്നു
        await db.collection("payments").add({
            studentId: id, studentName: name, amountPaid: Number(payAmount),
            date: date, time: new Date().toLocaleTimeString('en-IN'), 
            months: "Old Balance Payment", // മാസത്തിന് പകരം ഇത് കാണിക്കും
            receiptNo: rcptNo, studentID: s.studentID,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`വിജയകരമായി അടച്ചു! പുതിയ ബാക്കി: ₹${newBalance}`);
        
        if (confirm("റെസീപ്റ്റ് പ്രിന്റ് ചെയ്യണോ?")) {
            printReceipt(name, payAmount, "Old Balance", date, rcptNo, s.studentID);
        }
        loadStudents();
    } catch(e) { alert("Error updating balance!"); }
}

// 6. പ്രിന്റ് ഫങ്ക്ഷൻ (PDF)
function printReceipt(name, amount, months, date, rcptNo, sid) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt - ${rcptNo}</title>
                <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
                <style>
                    body { 
                        font-family: 'Poppins', sans-serif; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        padding: 40px 20px; 
                        background-color: #f0f2f5; 
                    }
                    .receipt-card { 
                        width: 450px; 
                        background: white; 
                        padding: 35px; 
                        border-radius: 20px; 
                        box-shadow: 0 15px 35px rgba(0,0,0,0.15); 
                        border-top: 12px solid #1a73e8; 
                        position: relative;
                    }
                    .header { text-align: center; margin-bottom: 25px; }
                    .header h2 { color: #1a73e8; margin: 0; font-size: 26px; font-weight: 600; }
                    .header .sub-info { font-size: 13px; color: #666; margin: 5px 0 10px 0; font-weight: 400; }
                    .header .receipt-label { 
                        margin: 5px 0; 
                        font-size: 11px; 
                        color: #888; 
                        text-transform: uppercase; 
                        letter-spacing: 2px; 
                        border-top: 1px solid #eee;
                        border-bottom: 1px solid #eee;
                        padding: 5px 0;
                    }
                    
                    .info-section { margin-top: 20px; }
                    .info-row { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 15px; 
                        border-bottom: 1px dashed #e0e0e0; 
                        padding-bottom: 8px; 
                    }
                    .label { color: #777; font-size: 14px; }
                    .value { color: #222; font-weight: 600; font-size: 15px; }
                    
                    .amount-container { 
                        background: linear-gradient(135deg, #1a73e8, #1557b0); 
                        color: white; 
                        padding: 25px; 
                        border-radius: 12px; 
                        text-align: center; 
                        margin: 30px 0; 
                    }
                    .amount-container span { font-size: 14px; opacity: 0.9; display: block; margin-bottom: 5px; }
                    .amount-container h1 { margin: 0; font-size: 36px; letter-spacing: 1px; }
                    
                    .footer { text-align: center; margin-top: 25px; }
                    .footer p { font-size: 13px; color: #666; font-style: italic; }
                    
                    .btn-group { margin-top: 30px; display: flex; gap: 15px; }
                    .btn { 
                        padding: 12px 25px; 
                        border: none; 
                        border-radius: 8px; 
                        cursor: pointer; 
                        font-weight: 600; 
                        font-size: 14px; 
                        transition: 0.3s;
                    }
                    .btn-download { background: #28a745; color: white; }
                    .btn-print { background: #6c757d; color: white; }
                    .btn:hover { opacity: 0.9; transform: translateY(-2px); }

                    @media print { 
                        .no-print { display: none; } 
                        body { background: white; padding: 0; } 
                        .receipt-card { box-shadow: none; border: 1px solid #ddd; width: 100%; } 
                    }
                </style>
            </head>
            <body>
                <div id="receipt-area" class="receipt-card">
                    <div class="header">
                        <h2>ഇസ്‌ലാഹുൽ ഉലൂം മദ്റസ</h2>
                        <div class="sub-info">
                            <span>രജി. നം: <b>1205</b></span> | <span><b>AR NAGAR</b></span>
                        </div>
                        <div class="receipt-label">ഫീസ് രസീത് (OFFICIAL RECEIPT)</div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-row">
                            <span class="label">രസീത് നം:</span>
                            <span class="value">#${rcptNo}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">തീയതി:</span>
                            <span class="value">${date}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">വിദ്യാർത്ഥി:</span>
                            <span class="value">${name}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">സ്റ്റുഡന്റ് ID:</span>
                            <span class="value">${sid || '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">മാസങ്ങൾ:</span>
                            <span class="value">${Array.isArray(months) ? months.join(', ') : months}</span>
                        </div>
                    </div>
                    
                    <div class="amount-container">
                        <span>ആകെ തുക (Total Amount)</span>
                        <h1>₹${amount}</h1>
                    </div>
                    
                    <div class="footer">
                        <p>ഫിസബീലില്ലാഹ് - നന്ദി!</p>
                        <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px; font-size: 10px; color: #bbb;">
                            Computer Generated Digital Receipt
                        </div>
                    </div>
                </div>

                <div class="btn-group no-print">
                    <button class="btn btn-download" onclick="downloadImage()">Download JPG (Photo)</button>
                    <button class="btn btn-print" onclick="window.print()">Print PDF</button>
                </div>

                <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
                <script>
                    function downloadImage() {
                        const element = document.getElementById('receipt-area');
                        html2canvas(element, { 
                            scale: 3, 
                            backgroundColor: "#ffffff"
                        }).then(canvas => {
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
// ഹാജർ മെയിൻ പേജ് കാണിക്കാൻ
function showAttendanceSection() {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `
        <div style="padding:15px; background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
            <h3 style="color:#1a73e8;"><i class="fas fa-calendar-check"></i> ഹാജർ മാനേജ്‌മെന്റ്</h3>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <select id="att-class" onchange="loadAttendanceList(this.value)" style="flex:2; padding:10px; border-radius:8px; border:1px solid #ddd;">
                    <option value="">ക്ലാസ്സ് തിരഞ്ഞെടുക്കുക</option>
                    ${[...Array(12).keys()].map(i => `<option value="${i+1}">ക്ലാസ്സ് ${i+1}</option>`).join('')}
                </select>
                <input type="date" id="att-date" value="${new Date().toISOString().split('T')[0]}" onchange="loadAttendanceList(document.getElementById('att-class').value)" style="flex:1; padding:10px; border-radius:8px; border:1px solid #ddd;">
            </div>
            
            <div id="attendance-list-area" style="margin-top:20px;">
                <p style="text-align:center; color:#999;">ക്ലാസ്സ് തിരഞ്ഞെടുത്താൽ കുട്ടികളുടെ ലിസ്റ്റ് ഇവിടെ കാണാം.</p>
            </div>
            
            <div id="att-action-btns" style="display:none; margin-top:20px; gap:10px;">
                <button onclick="saveAttendance()" style="flex:2; background:#28a745; color:white; padding:12px; border-radius:8px; border:none; font-weight:600;">സേവ് ചെയ്യുക (Save)</button>
                <button onclick="viewAttendanceHistory()" style="flex:1; background:#1a73e8; color:white; padding:12px; border-radius:8px; border:none;">History നോക്കുക</button>
            </div>
        </div>
    `;
}
let currentAttendanceData = {}; // ഇത് ഗ്ലോബൽ ആയി ഡിക്ലയർ ചെയ്യണം

// കുട്ടികളുടെ ലിസ്റ്റ് ലോഡ് ചെയ്യാൻ (എഡിറ്റ് ഓപ്ഷൻ ഉൾപ്പെടെ)
async function loadAttendanceList(cls) {
    if (!cls) return;
    const date = document.getElementById('att-date').value;
    const listArea = document.getElementById('attendance-list-area');
    listArea.innerHTML = "<p style='text-align:center;'>തിരയുന്നു...</p>";
    
    // ആദ്യം ഈ ദിവസത്തെ ഹാജർ നില നേരത്തെ സേവ് ചെയ്തിട്ടുണ്ടോ എന്ന് നോക്കുന്നു (Edit Option)
    const formattedDate = date.split('-').reverse().join('-'); // DD-MM-YYYY
    const docRef = db.collection("attendance").doc(`${cls}-${formattedDate}`);
    const existingDoc = await docRef.get();
    
    const studentSnap = await db.collection("students").where("class", "==", cls).get();
    listArea.innerHTML = "";
    currentAttendanceData = {};

    if (studentSnap.empty) {
        listArea.innerHTML = "<p style='color:red;'>ഈ ക്ലാസ്സിൽ കുട്ടികളില്ല.</p>";
        document.getElementById('att-action-btns').style.display = 'none';
        return;
    }

    let savedRecords = existingDoc.exists ? existingDoc.data().records : null;

    studentSnap.forEach(doc => {
        const s = doc.data();
        const studentId = doc.id;
        // നേരത്തെ സേവ് ചെയ്ത ഹാജർ ഉണ്ടെങ്കിൽ അത് എടുക്കും, ഇല്ലെങ്കിൽ Default ആയി Present (true) നൽകും
        const isPresent = savedRecords && savedRecords[studentId] ? savedRecords[studentId].present : true;
        
        currentAttendanceData[studentId] = { name: s.name, present: isPresent };

        listArea.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid #f0f0f0; background:${isPresent ? '#fff' : '#fff0f0'};">
                <span style="font-weight:500;">${s.name}</span>
                <div style="display:flex; gap:15px; background:#f8f9fa; padding:5px 15px; border-radius:20px;">
                    <label style="color:green; cursor:pointer; font-weight:bold;">
                        <input type="radio" name="att-${studentId}" ${isPresent ? 'checked' : ''} onclick="updateAttStatus('${studentId}', true)"> P
                    </label>
                    <label style="color:red; cursor:pointer; font-weight:bold;">
                        <input type="radio" name="att-${studentId}" ${!isPresent ? 'checked' : ''} onclick="updateAttStatus('${studentId}', false)"> A
                    </label>
                </div>
            </div>
        `;
    });
    document.getElementById('att-action-btns').style.display = 'flex';
}

function updateAttStatus(id, status) {
    currentAttendanceData[id].present = status;
}

// ഹാജർ സേവ് ചെയ്യാൻ
async function saveAttendance() {
    const cls = document.getElementById('att-class').value;
    const dateInput = document.getElementById('att-date').value;
    const formattedDate = dateInput.split('-').reverse().join('-'); 
    
    try {
        await db.collection("attendance").doc(`${cls}-${formattedDate}`).set({
            class: cls,
            date: formattedDate,
            records: currentAttendanceData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("ഹാജർ വിവരങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു!");
    } catch(e) {
        alert("പിശക്: " + e.message);
    }
}

// ഹാജർ ഹിസ്റ്ററി പരിശോധിക്കാൻ
async function viewAttendanceHistory() {
    const cls = document.getElementById('att-class').value;
    const listArea = document.getElementById('attendance-list-area');
    listArea.innerHTML = "ഹിസ്റ്ററി ലോഡ് ചെയ്യുന്നു...";

    try {
        const snap = await db.collection("attendance")
            .where("class", "==", cls)
            .orderBy("timestamp", "desc")
            .limit(10) // അവസാനത്തെ 10 ദിവസത്തെ ഹാജർ
            .get();

        if (snap.empty) {
            listArea.innerHTML = "<p>ഹിസ്റ്ററി ലഭ്യമല്ല.</p>";
            return;
        }

        let html = `<h4>അവസാനത്തെ ഹാജർ നില (ക്ലാസ് ${cls})</h4>`;
        snap.forEach(doc => {
            const data = doc.data();
            let presentCount = 0;
            let total = 0;
            for (let id in data.records) {
                if (data.records[id].present) presentCount++;
                total++;
            }
            html += `
                <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span><b>${data.date}</b></span>
                    <span style="font-size:12px;">ഹാജർ: <b style="color:green;">${presentCount}/${total}</b></span>
                    <button onclick="editSpecificDate('${cls}', '${data.date}')" style="background:none; border:1px solid #1a73e8; color:#1a73e8; padding:3px 8px; border-radius:4px; font-size:11px;">View/Edit</button>
                </div>
            `;
        });
        listArea.innerHTML = html;
    } catch (e) {
        alert("എറർ: " + e.message);
    }
}

// ഹിസ്റ്ററിയിൽ നിന്ന് ഒരു പ്രത്യേക ദിവസം എഡിറ്റ് ചെയ്യാൻ
function editSpecificDate(cls, date) {
    // ഡേറ്റ് ഫോർമാറ്റ് മാറ്റുന്നു (DD-MM-YYYY to YYYY-MM-DD)
    const parts = date.split('-');
    const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
    document.getElementById('att-date').value = formatted;
    document.getElementById('att-class').value = cls;
    loadAttendanceList(cls);
}
