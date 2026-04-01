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

// 2. ലോഗിൻ & സെക്ഷൻ സ്വിച്ചർ (മാറ്റമില്ലാതെ തുടരുന്നു)
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
            <button onclick="addSiblingField()" style="background:#28a745; margin-bottom:15px; font-size:12px; padding:5px;">+ ഒരാളെ കൂടി ചേർക്കുക</button>
            <input id="n-phone" placeholder="വാട്ട്സാപ്പ് നമ്പർ (91xxxx)">
            <input id="n-monthly-fee" type="number" placeholder="പ്രതിമാസ വരിസംഖ്യ">
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
}

// 3. സേവ് ഫങ്ക്ഷൻ (പുതിയ വിവരങ്ങൾ കൂടി ഉൾപ്പെടുത്തി)
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
    allMonths.forEach(m => { monthStatus[m] = { paid: false, date: "-", amount: 0 }; });

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

// 4. സ്റ്റുഡന്റ് ലിസ്റ്റ് (നിങ്ങൾ ആവശ്യപ്പെട്ട എല്ലാ വിവരങ്ങളും കാർഡ് രൂപത്തിൽ)
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
        
        // സഹോദരങ്ങളുടെ ലിസ്റ്റ്
        let sibHTML = s.siblings && s.siblings.length > 0 ? 
            s.siblings.map(sib => `${sib.name} (${sib.class})`).join(', ') : "ഇല്ല";

        // മാസങ്ങളുടെ ടേബിൾ (മഞ്ഞ കാർഡ് മാതൃകയിൽ)
        let monthTableHTML = `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin: 10px 0; font-size: 10px;">`;
        let unpaidCount = 0;
        allMonths.forEach(m => {
            const isPaid = s.monthStatus && s.monthStatus[m]?.paid;
            if(!isPaid) unpaidCount++;
            monthTableHTML += `
                <div style="border: 1px solid #ddd; padding: 4px; text-align: center; border-radius:3px; background: ${isPaid ? '#e8f5e9' : '#fff'}">
                    <b style="color: ${isPaid ? 'green' : '#777'}">${m}</b><br>
                    <span style="font-size:8px;">${isPaid ? s.monthStatus[m].date : '-'}</span>
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
                    <b>വീട്:</b> ${s.houseName || '-'}<br>
                    <b>ID:</b> ${s.studentID}<br>
                    <b>സഹോദരങ്ങൾ:</b> ${sibHTML}
                </div>

                ${monthTableHTML}

                <div style="background:#fff3f3; padding:8px; border-radius:5px; border:1px solid #ffebeb;">
                    <div style="display:flex; justify-content:space-between; font-size:12px;">
                        <span>മാസ ഫീസ്: <b>₹${s.monthlyFee}</b></span>
                        <span style="color:red; font-weight:bold;">ബാക്കി: ₹${pending}</span>
                    </div>
                </div>
                
                <div style="display:flex; gap:5px; margin-top:10px;">
                    <button onclick="updateFees('${doc.id}', '${s.parentPhone}', '${s.name}')" style="flex:1; background:#28a745;">Pay Fee</button>
                    <button onclick="viewHistory('${doc.id}', '${s.name}')" style="background:#6c757d; flex:1;">History</button>
                    <button onclick="sendCustomWA('${s.parentPhone}', '${s.name}')" style="background:#25d366; flex:1;">Chat</button>
                </div>
            </div>
        `;
    });
}

// 5. ഫീ അപ്‌ഡേറ്റ് (മാസങ്ങൾ തിരഞ്ഞെടുക്കാൻ)
async function updateFees(id, phone, name) {
    const monthsInput = prompt("അടയ്ക്കുന്ന മാസങ്ങൾ നൽകുക (eg: Jan, Feb):");
    if (!monthsInput) return;
    const selected = monthsInput.split(',').map(m => m.trim().charAt(0).toUpperCase() + m.trim().slice(1).toLowerCase());
    
    try {
        const ref = db.collection("students").doc(id);
        const s = (await ref.get()).data();
        let status = s.monthStatus || {};
        let total = 0; let paidNow = [];
        const date = new Date().toLocaleDateString('en-IN');

        selected.forEach(m => {
            if (status[m] && !status[m].paid) {
                status[m] = { paid: true, date: date, amount: s.monthlyFee };
                total += s.monthlyFee;
                paidNow.push(m);
            }
        });

        if (total === 0) { alert("മാസങ്ങൾ തെറ്റാണ് അല്ലെങ്കിൽ നിലവിൽ അടച്ചവയാണ്!"); return; }

        await ref.update({ monthStatus: status });
        await db.collection("payments").add({
            studentId: id, studentName: name, amountPaid: total,
            date: date, time: new Date().toLocaleTimeString('en-IN'), months: paidNow,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("ഫീസ് സ്വീകരിച്ചു!");
        const msg = `അസ്സലാമു അലൈക്കും, \n${name}-ന്റെ ഫീസ് ₹${total} (${paidNow.join(', ')}) സ്വീകരിച്ചു. \nതീയതി: ${date}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        loadStudents();
    } catch(e) { alert("Error!"); }
}

// 6. ഹിസ്റ്ററി & ഡിലീറ്റ് (മാറ്റമില്ലാതെ തുടരുന്നു)
async function viewHistory(studentId, studentName) {
    const content = document.getElementById('dynamic-content');
    content.innerHTML = `<h4>History: ${studentName}</h4><button onclick="loadStudents()">Back</button><div id="hist-list" style="margin-top:10px;"></div>`;
    const snap = await db.collection("payments").where("studentId", "==", studentId).orderBy("timestamp", "desc").get();
    const area = document.getElementById('hist-list');
    if(snap.empty) { area.innerHTML = "വിവരങ്ങളില്ല"; return; }
    snap.forEach(doc => {
        const p = doc.data();
        area.innerHTML += `<div style="background:#f0f7ff; padding:10px; margin-bottom:8px; border-radius:8px;">
            ${p.date} | ₹${p.amountPaid} (${p.months ? p.months.join(', ') : 'Old Payment'})
        </div>`;
    });
}

function sendCustomWA(phone, name) {
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent('അസ്സലാമു അലൈക്കും, ' + name + '-ന്റെ കാര്യവുമായി ബന്ധപ്പെട്ട്...')}`, '_blank');
}

async function deleteStudent(id) { if (confirm("ഒഴിവാക്കണോ?")) { await db.collection("students").doc(id).delete(); loadStudents(); } }
function logout() { auth.signOut().then(() => location.reload()); }
