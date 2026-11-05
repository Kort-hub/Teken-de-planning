// ==========================================
// 🛠️ HET CONFIGURATIE BLOK 🛠️
// Pas de regels hier aan zonder in de complexe code te hoeven zoeken!
// ==========================================
const PLANNER_CONFIG = {
    tijden: {
        eersteElftallen: "15:00",
        seniorenMiddag: ["13:00", "15:00"],
        jeugdJongFallback: ["08:30", "09:45", "11:15"],          
        jeugdOudFallback: ["09:45", "11:15", "13:00"],           
        veteranen: "19:30",
        totaalSchema: ["08:30", "09:45", "11:15", "13:00", "15:00"]
    },
    velden: {
        jvozToegestaan: ["kgv1", "kgv5", "kgv6", "veld2"],        
        groteGoalsToegestaan: ["kgv1", "kgv5", "kgv6"]      // MO15/MO17 (9-tal) KAN ALLEEN HIER WEGENS GOALS LOGISTIEK
    },
    kleedkamers: {
        gpc: { thuis: [14, 15, 16], uit: [11, 12, 13] },
        vcvJvoz: { thuis: [1, 2, 3, 7, 8], uit: [4, 5, 6, 9, 10] },
        gpc1: { thuis: [15, 16], uit: [11, 12] },                
        vcv1: { thuis: [1], uit: [4] },                          
        maxTeamsPerKamer: 2,                                     
        maxTeamsPerKamerO7: 4,                                   
        voorafMinutenEersteElftal: 45,                           
        voorafMinutenStandaard: 30,                              
        achterafMinuten: 30                                      
    },
    uitzonderingen: {
        "jvoz o14-1": { tijd: "10:30", veldId: "kgv1_A1", klThuis: 1, klUit: 4, negeerDoordeweeks: true, toonWaarschuwingTijd: true },
        "jvoz o11-1": { tijd: "08:30" } 
    },
    speelduur: {
        standaard: 60,                
        O11_tot_O14: 75,
        O15_MO15: 85,
        O16_tot_O17: 95,
        O18_O19_Senioren: 105
    }
};

let currentTimeslot = '08:30';
let activeDate = '31-okt'; 
let matches = []; 

const monthNamesLong = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const monthNamesShort = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
let currentCalDate = new Date();

function initCalendarState() {
    let parts = activeDate.split('-');
    if(parts.length === 2) {
        let d = parseInt(parts[0]);
        let m = monthNamesShort.indexOf(parts[1].toLowerCase());
        if (m !== -1) { currentCalDate = new Date(new Date().getFullYear(), m, d); }
    }
}
initCalendarState();

function toggleCalendar() {
    const popup = document.getElementById('calendar-popup');
    popup.classList.toggle('hidden');
    if (!popup.classList.contains('hidden')) renderCalendar();
}

document.addEventListener('click', function(event) {
    const popup = document.getElementById('calendar-popup');
    const btn = document.getElementById('date-picker-btn');
    if (popup && btn && !popup.contains(event.target) && !btn.contains(event.target) && !popup.classList.contains('hidden')) {
        popup.classList.add('hidden');
    }
});

function changeMonth(offset) {
    currentCalDate.setDate(1); 
    currentCalDate.setMonth(currentCalDate.getMonth() + offset);
    renderCalendar();
}

function selectDate(day, month) {
    activeDate = `${day}-${monthNamesShort[month]}`;
    updateCalendarData(); syncCheckboxes(); refreshUI();
    document.getElementById('calendar-popup').classList.add('hidden');
}

function renderCalendar() {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    document.getElementById('calendar-month-year').innerText = `${monthNamesLong[month]}`;
    
    const daysContainer = document.getElementById('calendar-days');
    daysContainer.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let emptyDays = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < emptyDays; i++) { daysContainer.innerHTML += `<div></div>`; }
    
    let plannedDates = [...new Set(matches.map(m => m.date))];
    
    for (let d = 1; d <= daysInMonth; d++) {
        let dateStr = `${d}-${monthNamesShort[month]}`;
        let hasMatch = plannedDates.includes(dateStr);
        let isActive = activeDate === dateStr;
        
        let bgClass = isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-800';
        let dotHtml = hasMatch ? `<div class="w-1.5 h-1.5 bg-green-500 rounded-full mx-auto mt-0.5 shadow-sm"></div>` : `<div class="w-1.5 h-1.5 mt-0.5"></div>`;
        
        daysContainer.innerHTML += `
            <div onclick="selectDate(${d}, ${month})" class="cursor-pointer py-1.5 rounded-md ${bgClass} transition flex flex-col items-center justify-center border border-transparent ${isActive ? 'border-blue-700' : ''}">
                <span class="${isActive ? 'font-bold' : ''}">${d}</span>
                ${dotHtml}
            </div>
        `;
    }
}

function updateCalendarData() {
    document.getElementById('date-btn-text').innerText = activeDate;
    const popup = document.getElementById('calendar-popup');
    if (!popup.classList.contains('hidden')) renderCalendar();
}

function isWeekday(dateStr) {
    let parts = dateStr.toLowerCase().split('-');
    if (parts.length < 2) return false;
    let d = parseInt(parts[0]);
    let m = monthNamesShort.indexOf(parts[1]);
    if (m === -1) return false;
    
    let now = new Date();
    let year = now.getFullYear();
    if (now.getMonth() >= 6 && m <= 4) year++;
    
    let dateObj = new Date(year, m, d);
    let day = dateObj.getDay();
    return (day !== 0 && day !== 6); 
}

function getMatchDuration(cat, thuis, size) {
    let t = (thuis || '').toUpperCase();
    if(t.includes('O11') || t.includes('O12') || t.includes('O13') || t.includes('O14') || t.includes('MO11') || t.includes('MO12')) return PLANNER_CONFIG.speelduur.O11_tot_O14;
    if(t.includes('O15') || t.includes('MO15')) return PLANNER_CONFIG.speelduur.O15_MO15;
    if(t.includes('O16') || t.includes('O17') || t.includes('MO17')) return PLANNER_CONFIG.speelduur.O16_tot_O17;
    if(t.includes('O18') || t.includes('O19') || (size === 'heel' && !t.includes('O'))) {
        if(t.includes('35+')) return PLANNER_CONFIG.speelduur.standaard;
        return PLANNER_CONFIG.speelduur.O18_O19_Senioren;
    }
    return PLANNER_CONFIG.speelduur.standaard;
}

function checkFieldConflict(matchDate, proposedCellId, proposedSize, proposedTime, proposedDuration, excludeMatchId = null) {
    let proposedStart = timeToMins(proposedTime);
    let proposedEnd = proposedStart + proposedDuration;
    let proposedTargets = getTargetCells(proposedSize, proposedCellId);
    if(!proposedTargets) return true;

    for (let m of matches) {
        if (m.isPlaced && m.date === matchDate && m.id !== excludeMatchId) {
            let mStart = timeToMins(m.time);
            let mDur = getMatchDuration(m.cat, m.thuis, m.size);
            let mEnd = mStart + mDur;
            
            if (proposedStart < mEnd && mStart < proposedEnd) {
                let placedTargets = getTargetCells(m.size, m.cellId);
                if (placedTargets && proposedTargets.some(t => placedTargets.includes(t))) {
                    return true; 
                }
            }
        }
    }
    return false; 
}

function getGoalsForMatch(m) {
    let mini = 0; let klein = 0; let groot = 0;
    const cellId = m.cellId || '';
    let c = (m.cat || '').toUpperCase(); let t = (m.thuis || '').toUpperCase(); let u = (m.uit || '').toUpperCase();
    
    let isMO15_17 = t.includes('MO15') || u.includes('MO15') || c.includes('MO15') || t.includes('MO17') || u.includes('MO17') || c.includes('MO17');
    let is9tal = t.includes('(9-TAL)') || u.includes('(9-TAL)');
    
    if (c.includes('O7') || t.includes('O7') || u.includes('O7')) mini = 4;
    else if (c.includes('O8') || c.includes('O9') || c.includes('O10') || t.includes('O8') || t.includes('O9') || t.includes('O10') || u.includes('O8') || u.includes('O9') || u.includes('O10')) klein = 2;
    else if (m.size === 'half') {
        if (cellId.startsWith('kgv1_') || cellId.startsWith('veld2_') || cellId.startsWith('veld4_')) klein = 2;
    }
    
    if (isMO15_17 && is9tal) {
        groot = 2;
    }
    return { mini, klein, groot };
}

function updateDashboard() {
    let countMini = 0; let countKlein = 0; let countGroot = 0;
    const currentMatches = matches.filter(m => m.isPlaced && m.date === activeDate && m.time === currentTimeslot);
    currentMatches.forEach(m => { 
        let g = getGoalsForMatch(m); 
        countMini += g.mini; countKlein += g.klein; countGroot += g.groot; 
    });
    document.getElementById('count-mini').innerText = countMini; 
    document.getElementById('count-klein').innerText = countKlein;
    document.getElementById('count-groot').innerText = countGroot;
}

let defaultTeamsDB = [
    { name: "GPC 1", prefTime: "15:00", size: "auto" }, { name: "GPC 2", prefTime: "13:00", size: "auto" }, { name: "GPC 3", prefTime: "13:00", size: "auto" }, { name: "GPC 4", prefTime: "13:00", size: "auto" }, { name: "GPC 5", prefTime: "13:00", size: "auto" },
    { name: "GPC 35+ 1", prefTime: "19:30", size: "auto" }, { name: "GPC 35+ 2", prefTime: "19:30", size: "auto" },
    { name: "GPC O19", prefTime: "13:00", size: "auto" }, { name: "GPC MO17-1", prefTime: "13:00", size: "auto" }, { name: "GPC O16-1", prefTime: "13:00", size: "auto" },
    { name: "GPC O15-1", prefTime: "11:15", size: "auto" }, { name: "GPC MO15-1", prefTime: "11:15", size: "auto" }, { name: "GPC O14-1", prefTime: "11:15", size: "auto" }, { name: "GPC O14-2", prefTime: "09:45", size: "auto" },
    { name: "GPC O13-1", prefTime: "09:45", size: "auto" }, { name: "GPC O13-2", prefTime: "09:45", size: "auto" }, { name: "GPC O12-1", prefTime: "09:45", size: "auto" }, { name: "GPC O12-2", prefTime: "09:45", size: "auto" }, { name: "GPC O12-3", prefTime: "09:45", size: "auto" }, { name: "GPC MO12-1", prefTime: "09:45", size: "auto" },
    { name: "GPC O11-1", prefTime: "09:45", size: "auto" }, { name: "GPC O11-2", prefTime: "09:45", size: "auto" }, { name: "GPC O11-4", prefTime: "09:45", size: "auto" }, { name: "GPC MO11-1", prefTime: "08:30", size: "auto" },
    { name: "GPC O10-1", prefTime: "09:45", size: "auto" }, { name: "GPC O10-2", prefTime: "09:45", size: "auto" }, { name: "GPC O9-1", prefTime: "08:30", size: "auto" }, { name: "GPC O9-2", prefTime: "08:30", size: "auto" }, { name: "GPC O9-3", prefTime: "08:30", size: "auto" }, { name: "GPC O8-2", prefTime: "08:30", size: "auto" }, { name: "GPC O8-3JM", prefTime: "08:30", size: "auto" },
    { name: "GPC O7-1", prefTime: "08:30", size: "auto" }, { name: "GPC O7-2", prefTime: "08:30", size: "auto" }, { name: "GPC O7-3", prefTime: "08:30", size: "auto" }, { name: "GPC O7-4", prefTime: "08:30", size: "auto" }, { name: "GPC O7-5", prefTime: "08:30", size: "auto" }, { name: "GPC O7-6", prefTime: "08:30", size: "auto" },
    { name: "VC Vlissingen 1", prefTime: "15:00", size: "auto" }, { name: "VC Vlissingen 2", prefTime: "13:00", size: "auto" }, { name: "VC Vlissingen 3", prefTime: "13:00", size: "auto" }, { name: "VC Vlissingen 35+ 1", prefTime: "19:30", size: "auto" },
    { name: "VC Vlissingen O16-1", prefTime: "13:00", size: "auto" }, { name: "VC Vlissingen O14-1", prefTime: "11:15", size: "auto" }, { name: "VC Vlissingen O12-1", prefTime: "09:45", size: "auto" }, { name: "VC Vlissingen O11-1", prefTime: "09:45", size: "auto" }, { name: "VC Vlissingen O10-1", prefTime: "09:45", size: "auto" }, { name: "VC Vlissingen O9-1", prefTime: "08:30", size: "auto" }, { name: "VC Vlissingen O8-1", prefTime: "08:30", size: "auto" }, { name: "VC Vlissingen O7-1", prefTime: "08:30", size: "auto" },
    { name: "JVOZ O19-1", prefTime: "13:00", size: "auto" }, { name: "JVOZ O17-1", prefTime: "13:00", size: "auto" }, { name: "JVOZ MO17-1", prefTime: "13:00", size: "auto" }, { name: "JVOZ O16-1", prefTime: "13:00", size: "auto" }, { name: "JVOZ O15-1", prefTime: "11:15", size: "auto" }, { name: "JVOZ O14-1", prefTime: "10:30", size: "heel" }, { name: "JVOZ O13-1", prefTime: "09:45", size: "auto" }, { name: "JVOZ O13-2", prefTime: "09:45", size: "auto" }, 
    { name: "JVOZ O12-1", prefTime: "09:45", size: "heel" }, { name: "JVOZ O12-2", prefTime: "09:45", size: "heel" }, 
    { name: "JVOZ O11-1", prefTime: "08:30", size: "heel" }
];

let teamsDB = JSON.parse(localStorage.getItem('teamsDB')) || defaultTeamsDB;

function saveTeamsDB() { localStorage.setItem('teamsDB', JSON.stringify(teamsDB)); updateTeamsDatalist(); }

function findTeamInDB(teamName) {
    let normalized = (teamName || '').replace(/GPC Vlissingen/i, 'GPC').trim().toLowerCase();
    return teamsDB.find(t => (t.name || '').replace(/GPC Vlissingen/i, 'GPC').trim().toLowerCase() === normalized);
}

function renderTeamsTable() {
    const tbody = document.getElementById('teams-tbody'); tbody.innerHTML = '';
    let sortedTeams = [...teamsDB].sort((a,b) => (a.name||'').localeCompare(b.name||''));
    sortedTeams.forEach((team, index) => {
        let sizeBadge = team.size === 'auto' ? `<span class="text-gray-400 italic">Auto</span>` : `<span class="font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">${(team.size||'').toUpperCase()}</span>`;
        tbody.innerHTML += `<tr class="border-b hover:bg-gray-50"><td class="p-2 font-bold">${team.name}</td><td class="p-2 text-gray-700">${team.prefTime || '-'}</td><td class="p-2">${sizeBadge}</td><td class="p-2"><button onclick="removeTeamRule('${team.name}')" class="text-red-500 hover:text-red-700 font-bold">Wis</button></td></tr>`;
    });
}

function addTeamRule() {
    const name = document.getElementById('team-name').value.trim();
    const time = document.getElementById('team-pref-time').value.trim();
    const size = document.getElementById('team-size').value;
    if(name) {
        let existing = teamsDB.find(t => (t.name||'').toLowerCase() === name.toLowerCase());
        if (existing) { existing.prefTime = time; existing.size = size; } else { teamsDB.push({name, prefTime: time, size}); }
        saveTeamsDB();
        document.getElementById('team-name').value = ''; document.getElementById('team-pref-time').value = ''; document.getElementById('team-size').value = 'auto';
        renderTeamsTable();
    }
}

function removeTeamRule(teamName) {
    if(confirm(`Weet je zeker dat je ${teamName} wilt verwijderen?`)) {
        teamsDB = teamsDB.filter(t => t.name !== teamName); saveTeamsDB(); renderTeamsTable();
    }
}

function updateTeamsDatalist() {
    const datalist = document.getElementById('team-datalist'); datalist.innerHTML = '';
    teamsDB.forEach(t => { const opt = document.createElement('option'); opt.value = t.name; datalist.appendChild(opt); });
}

function determineSize(cat, teamThuis, teamUit) {
    let thuisDB = findTeamInDB(teamThuis); if (thuisDB && thuisDB.size !== 'auto') return thuisDB.size;
    let uitDB = findTeamInDB(teamUit); if (uitDB && uitDB.size !== 'auto') return uitDB.size;

    let combined = ((cat||'') + " " + (teamThuis||'') + " " + (teamUit||'')).toUpperCase();
    if (combined.includes('JVOZ') && (combined.includes('O11') || combined.includes('O12'))) return 'heel';

    if (combined.includes('35+')) return 'half';
    if (combined.includes('O7') || combined.includes('O8') || combined.includes('O9') || combined.includes('O10')) return 'kwart';
    if (combined.includes('O11') || combined.includes('O12') || combined.includes('MO11') || combined.includes('MO12')) return 'half';
    return 'heel';
}

function determinePrefTime(teamThuis, teamUit) {
    let thuisDB = findTeamInDB(teamThuis); if (thuisDB && thuisDB.prefTime) return thuisDB.prefTime;
    
    let searchTarget = ((teamThuis||'') + " " + (teamUit||'')).toLowerCase();
    for(let uTeam in PLANNER_CONFIG.uitzonderingen) {
        if(searchTarget.includes(uTeam) && PLANNER_CONFIG.uitzonderingen[uTeam].tijd) {
            return PLANNER_CONFIG.uitzonderingen[uTeam].tijd;
        }
    }

    if (searchTarget.includes('35+')) return PLANNER_CONFIG.tijden.veteranen;
    if (searchTarget.includes('gpc vlissingen 1') || searchTarget.includes('vc vlissingen 1') || searchTarget.includes('gpc 1') || searchTarget.includes('vcv 1')) return PLANNER_CONFIG.tijden.eersteElftallen;
    return '';
}

let defaultFields = { 'kgv6': true, 'kgv5': true, 'veld2': false, 'veld4': false, 'veld3': false, 'kgv1': true };
let activeFieldsByDate = {};

function getActiveFields(date) {
    if (!activeFieldsByDate[date]) { activeFieldsByDate[date] = { ...defaultFields }; }
    return activeFieldsByDate[date];
}

function updateFieldVisuals(fieldId, isActive) {
    const container = document.getElementById('container-' + fieldId);
    if(container) {
        if(!isActive) container.classList.add('field-disabled'); else container.classList.remove('field-disabled');
    }
}

function syncCheckboxes() {
    let currentFields = getActiveFields(activeDate);
    Object.keys(currentFields).forEach(f => {
        const cb = document.getElementById('toggle-' + f);
        if(cb) {
            cb.checked = currentFields[f]; updateFieldVisuals(f, currentFields[f]);
            cb.onchange = (e) => {
                getActiveFields(activeDate)[f] = e.target.checked;
                updateFieldVisuals(f, e.target.checked); unplaceMatchesFromField(f, activeDate); 
            };
        }
    });
}

function toggleAllFields() {
    let currentFields = getActiveFields(activeDate);
    let allOpen = Object.values(currentFields).every(v => v === true);
    let newState = !allOpen; 
    
    Object.keys(defaultFields).forEach(f => defaultFields[f] = newState);
    
    let allDates = [...new Set(matches.map(m => m.date))];
    if(!allDates.includes(activeDate)) allDates.push(activeDate);
    
    allDates.forEach(dateStr => {
        let fields = getActiveFields(dateStr);
        Object.keys(fields).forEach(f => {
            fields[f] = newState;
            
            if(!newState) {
                matches.forEach(m => {
                    if(m.isPlaced && m.date === dateStr && m.cellId && m.cellId.startsWith(f)) {
                        m.isPlaced = false; m.cellId = null; m.time = null;
                    }
                });
            }
        });
    });
    
    Object.keys(currentFields).forEach(f => {
        let cb = document.getElementById('toggle-' + f);
        if(cb) cb.checked = newState;
        updateFieldVisuals(f, newState); 
    });
    
    refreshUI();
    alert(`Succes! Alle velden op álle ${allDates.length} dagen staan nu ${newState ? 'OPEN' : 'DICHT'}.`);
}

function unplaceMatchesFromField(fieldId, targetDate) {
    let changed = false;
    matches.forEach(m => {
        if(m.isPlaced && m.date === targetDate && m.cellId && m.cellId.startsWith(fieldId)) {
            m.isPlaced = false; m.cellId = null; m.time = null; changed = true;
        }
    });
    if(changed) refreshUI();
}

window.editLocker = function(e, id) {
    e.stopPropagation(); 
    let m = matches.find(x => x.id === id);
    if (!m) return;
    
    let currentT = m.kleedkamerThuis || '';
    let currentU = m.kleedkamerUit || '';
    let res = prompt(`Pas kleedkamers aan voor: \n${m.thuis} - ${m.uit}\n\nTyp als: Thuis,Uit (bijv: 12,4 of 15,15)\n\n(Laat leeg en klik OK om weer automatisch te maken)`, `${currentT},${currentU}`);
    
    if (res === null) return; 
    
    if (res.trim() === '') {
        m.klLocked = false; 
        refreshUI();
        return;
    }
    
    let parts = res.split(',');
    m.kleedkamerThuis = parts[0] ? parts[0].trim() : currentT;
    m.kleedkamerUit = parts.length > 1 && parts[1] ? parts[1].trim() : m.kleedkamerThuis;
    m.klLocked = true; 
    
    refreshUI();
};

function getGender(teamName) {
    let name = (teamName || '').toUpperCase();
    if (name.match(/\bMO\d+/) || name.match(/\bVR\d+/) || name.includes('VROUWEN') || name.includes('MEIDEN')) return 'F';
    return 'M';
}

function getClub(teamName) {
    let n = (teamName || '').toLowerCase();
    if (n.includes('gpc')) return 'gpc';
    if (n.includes('vc vlissingen') || n.includes('vcv')) return 'vcv';
    if (n.includes('jvoz')) return 'jvoz';
    return 'other'; 
}

function timeToMins(t) {
    if (!t) return 0;
    let p = t.split(':');
    return parseInt(p[0])*60 + parseInt(p[1]);
}

function assignLockerRooms() {
    matches.forEach(m => { 
        if(!m.klLocked) { m.kleedkamerThuis = null; m.kleedkamerUit = null; }
    });
    
    let dates = [...new Set(matches.filter(m => m.isPlaced).map(m => m.date))];

    dates.forEach(date => {
        let dayMatches = matches.filter(m => m.isPlaced && m.date === date);
        dayMatches.sort((a, b) => timeToMins(a.time) - timeToMins(b.time));

        let roomSchedules = {}; 
        for(let i=1; i<=16; i++) roomSchedules[i] = [];

        function isOverlapping(s1, e1, s2, e2) { return Math.max(s1, s2) < Math.min(e1, e2); }

        dayMatches.forEach(m => {
            if (m.klLocked) {
                let t1Str = (m.thuis||'').toLowerCase();
                let is1st = (t1Str === 'gpc 1' || t1Str.includes('gpc vlissingen 1') || t1Str === 'vcv 1' || t1Str.includes('vc vlissingen 1'));
                let extraTimeBefore = is1st ? PLANNER_CONFIG.kleedkamers.voorafMinutenEersteElftal : PLANNER_CONFIG.kleedkamers.voorafMinutenStandaard;
                
                let startM = timeToMins(m.time) - extraTimeBefore;
                let duration = getMatchDuration(m.cat, m.thuis, m.size);
                let endM = timeToMins(m.time) + duration + PLANNER_CONFIG.kleedkamers.achterafMinuten;

                if (m.kleedkamerThuis && roomSchedules[m.kleedkamerThuis]) roomSchedules[m.kleedkamerThuis].push({start: startM, end: endM, club: getClub(m.thuis), gender: getGender(m.thuis)});
                if (m.kleedkamerUit && m.kleedkamerUit !== m.kleedkamerThuis && roomSchedules[m.kleedkamerUit]) roomSchedules[m.kleedkamerUit].push({start: startM, end: endM, club: getClub(m.uit), gender: getGender(m.uit)});
            }
        });

        function findRoom(prefs, startM, endM, club, gender, excludeRoom = null, allowOverlap = false, isO7 = false) {
            let overlapsPerRoom = {};
            prefs.forEach(r => {
                if(r == excludeRoom) { overlapsPerRoom[r] = [{},{},{},{},{},{},{},{},{},{}]; return; }
                overlapsPerRoom[r] = roomSchedules[r].filter(s => isOverlapping(startM, endM, s.start, s.end));
            });

            for(let r of prefs) {
                if (r == excludeRoom) continue;
                if(overlapsPerRoom[r].length === 0) return r;
            }

            let maxTeams = isO7 ? PLANNER_CONFIG.kleedkamers.maxTeamsPerKamerO7 : PLANNER_CONFIG.kleedkamers.maxTeamsPerKamer;

            if (allowOverlap) {
                for(let r of prefs) {
                    if (r == excludeRoom) continue;
                    let overlaps = overlapsPerRoom[r];
                    if (overlaps.length > 0 && overlaps.length < maxTeams) {
                        if (overlaps.every(s => s.club === club && s.gender === gender)) return r;
                    }
                }
            }

            for(let r of prefs) {
                if (r == excludeRoom) continue;
                let overlaps = overlapsPerRoom[r];
                if (overlaps.length > 0 && overlaps.length < maxTeams) {
                    if (overlaps.every(s => s.gender === gender)) return r;
                }
            }

            let bestRoom = null;
            let minCount = 999;
            for(let r of prefs) {
                if (r == excludeRoom) continue;
                let overlaps = overlapsPerRoom[r];
                if (overlaps.some(s => s.gender !== gender)) continue; 
                if (overlaps.length < minCount) {
                    minCount = overlaps.length;
                    bestRoom = r;
                }
            }
            if (bestRoom) return bestRoom;

            minCount = 999;
            for(let r of prefs) {
                if (r == excludeRoom) continue;
                let overlaps = overlapsPerRoom[r];
                if (overlaps.length < minCount) {
                    minCount = overlaps.length;
                    bestRoom = r;
                }
            }
            return bestRoom || prefs[0];
        }

        dayMatches.forEach(m => {
            if (m.klLocked) return;

            let t1Str = (m.thuis||'').toLowerCase();
            let isGPC1 = t1Str === 'gpc 1' || t1Str === 'gpc vlissingen 1';
            let isVCV1 = t1Str === 'vcv 1' || t1Str === 'vc vlissingen 1';
            
            let extraTimeBefore = (isGPC1 || isVCV1) ? PLANNER_CONFIG.kleedkamers.voorafMinutenEersteElftal : PLANNER_CONFIG.kleedkamers.voorafMinutenStandaard; 
            
            let startM = timeToMins(m.time) - extraTimeBefore;
            let duration = getMatchDuration(m.cat, m.thuis, m.size);
            let endM = timeToMins(m.time) + duration + PLANNER_CONFIG.kleedkamers.achterafMinuten;

            let thuisClub = getClub(m.thuis);
            let uitClub = getClub(m.uit);
            let thuisGender = getGender(m.thuis);
            let uitGender = getGender(m.uit);
            let isO7 = (m.cat||'').toUpperCase().includes('O7') || (m.thuis||'').toUpperCase().includes('O7') || (m.uit||'').toUpperCase().includes('O7');

            let thuisPrefs = [];
            let uitPrefs = [];
            
            if (thuisClub === 'gpc') {
                thuisPrefs = PLANNER_CONFIG.kleedkamers.gpc.thuis;
                uitPrefs = PLANNER_CONFIG.kleedkamers.gpc.uit;
            } else {
                thuisPrefs = PLANNER_CONFIG.kleedkamers.vcvJvoz.thuis;
                uitPrefs = PLANNER_CONFIG.kleedkamers.vcvJvoz.uit;
            }

            if (isO7) {
                let prefs = [...thuisPrefs, ...uitPrefs];
                let r = findRoom(prefs, startM, endM, 'O7', thuisGender, null, true, true); 
                m.kleedkamerThuis = r; m.kleedkamerUit = r;
                roomSchedules[r].push({start: startM, end: endM, club: 'O7', gender: thuisGender});
            } else if (isGPC1) {
                m.kleedkamerThuis = findRoom(PLANNER_CONFIG.kleedkamers.gpc1.thuis, startM, endM, thuisClub, thuisGender, null, false, false);
                roomSchedules[m.kleedkamerThuis].push({start: startM, end: endM, club: thuisClub, gender: thuisGender});
                m.kleedkamerUit = findRoom(PLANNER_CONFIG.kleedkamers.gpc1.uit, startM, endM, uitClub, uitGender, m.kleedkamerThuis, false, false);
                roomSchedules[m.kleedkamerUit].push({start: startM, end: endM, club: uitClub, gender: uitGender});
            } else if (isVCV1) {
                m.kleedkamerThuis = findRoom(PLANNER_CONFIG.kleedkamers.vcv1.thuis, startM, endM, thuisClub, thuisGender, null, false, false);
                roomSchedules[m.kleedkamerThuis].push({start: startM, end: endM, club: thuisClub, gender: thuisGender});
                m.kleedkamerUit = findRoom(PLANNER_CONFIG.kleedkamers.vcv1.uit, startM, endM, uitClub, uitGender, m.kleedkamerThuis, false, false);
                roomSchedules[m.kleedkamerUit].push({start: startM, end: endM, club: uitClub, gender: uitGender});
            } else {
                let allowOverlapThuis = (thuisClub === 'gpc'); 
                let allowOverlapUit = false; 

                m.kleedkamerThuis = findRoom(thuisPrefs, startM, endM, thuisClub, thuisGender, null, allowOverlapThuis, false);
                roomSchedules[m.kleedkamerThuis].push({start: startM, end: endM, club: thuisClub, gender: thuisGender});

                m.kleedkamerUit = findRoom(uitPrefs, startM, endM, uitClub, uitGender, m.kleedkamerThuis, allowOverlapUit, false);
                roomSchedules[m.kleedkamerUit].push({start: startM, end: endM, club: uitClub, gender: uitGender});
            }
        });
    });
}
function refreshUI() {
        assignLockerRooms();
        renderSidebar();
        renderBoard();
        updateDashboard();
    }

    let teamBalance = JSON.parse(localStorage.getItem('veldBalance')) || {};
    let savedMatchIds = JSON.parse(localStorage.getItem('savedMatchIds')) || [];

    function saveToBalans() {
        let placed = matches.filter(m => m.isPlaced); let added = 0;
        placed.forEach(m => {
            if(!savedMatchIds.includes(m.id)) {
                savedMatchIds.push(m.id);
                let isKunstgras = m.cellId.startsWith('kgv');
                let type = isKunstgras ? 'kunstgras' : 'gras';
                if(!teamBalance[m.thuis]) teamBalance[m.thuis] = { gras: 0, kunstgras: 0 };
                teamBalance[m.thuis][type]++; added++;
            }
        });
        localStorage.setItem('veldBalance', JSON.stringify(teamBalance)); localStorage.setItem('savedMatchIds', JSON.stringify(savedMatchIds));
        alert(`${added} nieuwe wedstrijden opgeslagen in de Historie!`); renderBalansTable();
    }

    function renderBalansTable() {
        const tbody = document.getElementById('balans-tbody'); tbody.innerHTML = '';
        let teams = Object.keys(teamBalance).map(name => {
            let d = teamBalance[name]; let total = d.gras + d.kunstgras;
            let perc = total > 0 ? Math.round((d.kunstgras / total) * 100) : 0;
            return { name, gras: d.gras, kunstgras: d.kunstgras, total, perc };
        });
        teams.sort((a,b) => a.name.localeCompare(b.name)); 
        teams.forEach(t => {
            tbody.innerHTML += `<tr class="border-b"><td class="p-2 font-bold text-gray-700">${t.name}</td><td class="p-2 text-green-600 font-bold text-center">${t.kunstgras}</td><td class="p-2 text-yellow-600 font-bold text-center">${t.gras}</td><td class="p-2 text-center text-xs text-gray-500">${t.perc}%</td></tr>`;
        });
    }

    function clearBalans() {
        if(confirm("Weet je zeker dat je het archief wilt wissen?")) {
            teamBalance = {}; savedMatchIds = [];
            localStorage.removeItem('veldBalance'); localStorage.removeItem('savedMatchIds'); renderBalansTable();
        }
    }

    function exportBalans() {
        const exportData = { balance: teamBalance, matchIds: savedMatchIds };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
        const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr);
        const today = new Date().toISOString().split('T')[0]; downloadAnchorNode.setAttribute("download", `balans_historie_${today}.json`);
        document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove();
    }

    function importBalans(event) {
        const file = event.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.balance && Array.isArray(importedData.matchIds)) {
                    teamBalance = importedData.balance; savedMatchIds = importedData.matchIds;
                    localStorage.setItem('veldBalance', JSON.stringify(teamBalance)); localStorage.setItem('savedMatchIds', JSON.stringify(savedMatchIds));
                    renderBalansTable(); alert("Archief succesvol geïmporteerd!");
                } else { alert("Geen geldig archief-bestand."); }
            } catch (error) { alert("Fout bij inlezen."); }
            document.getElementById('import-file').value = "";
        };
        reader.readAsText(file);
    }

    function setTimeslot(time) {
        if (time === '10:30' && PLANNER_CONFIG.uitzonderingen["jvoz o14-1"]?.toonWaarschuwingTijd) {
            alert("⚠️ Let op: 10:30 is gereserveerd voor zondagteams (zoals JVOZ O14-1). Weet je zeker dat je dit blok wilt gebruiken?");
        }
        
        currentTimeslot = time; const container = document.getElementById('time-buttons');
        let btn = document.getElementById('btn-' + time);
        if (!btn) {
            btn = document.createElement('button'); btn.id = 'btn-' + time; btn.innerText = time; btn.onclick = () => setTimeslot(time);
            btn.className = "px-3 py-1 rounded font-bold hover:bg-gray-700 text-white"; container.appendChild(btn);
        }
        document.querySelectorAll('#time-buttons button').forEach(b => {
            b.classList.remove('bg-green-500'); if(!b.classList.contains('text-yellow-300')) b.classList.add('hover:bg-gray-700'); 
        });
        btn.classList.add('bg-green-500'); btn.classList.remove('hover:bg-gray-700'); refreshUI();
    }

    function getTeamStyle(thuis) {
        thuis = (thuis||'').toLowerCase();
        if(thuis.includes('gpc')) return 'bg-orange-500 text-white border-orange-700'; 
        if(thuis.includes('vc vlissingen') || thuis.includes('vcv')) return 'bg-pink-400 text-white border-pink-600';
        if(thuis.includes('jvoz')) return 'bg-blue-400 text-white border-blue-600'; 
        return 'bg-gray-400 text-white border-gray-600';
    }

    function deleteMatch(id) {
        if(confirm("Weet je zeker dat je deze wedstrijd definitief uit het systeem wilt verwijderen?")) {
            matches = matches.filter(m => m.id !== id); updateCalendarData(); refreshUI();
        }
    }

    window.unplaceMatch = function(e, id) {
        e.stopPropagation(); 
        let m = matches.find(x => x.id === id);
        if(m) {
            m.isPlaced = false; 
            m.cellId = null; 
            m.time = null;
            refreshUI();
        }
    };

    function deleteAllMatches() {
        if(confirm("Weet je zeker dat je ALLE wedstrijden wilt verwijderen?")) {
            matches = []; updateCalendarData(); refreshUI();
        }
    }

    function getSortableDate(dateStr) {
        if(!dateStr) return 0;
        const months = { 'jan':1, 'feb':2, 'mrt':3, 'apr':4, 'mei':5, 'jun':6, 'jul':7, 'aug':8, 'sep':9, 'okt':10, 'nov':11, 'dec':12 };
        let parts = dateStr.toLowerCase().split('-'); let m = months[parts[1]] || 0; let d = parseInt(parts[0]) || 0;
        return (m * 100) + d; 
    }

    function formatFieldName(cellId, size) {
        if(!cellId) return '';
        let fieldBase = cellId.split('_')[0].toUpperCase();
        fieldBase = fieldBase.replace(/([A-Z]+)(\d+)/, '$1 $2'); 
        if (cellId.includes('_Heel') || size === 'heel') return fieldBase;
        
        let pos = cellId.split('_')[1]; 
        if (!pos) return fieldBase; 
        if (size === 'half') {
            if (pos.includes('A')) return fieldBase + 'A'; 
            if (pos.includes('B')) return fieldBase + 'B'; 
        } else if (size === 'kwart') { return fieldBase + pos; }
        return fieldBase;
    }

    function renderSidebar() {
        const container = document.getElementById('sidebar-matches'); 
        if(!container) return;
        container.innerHTML = '';
        const unplaced = matches.filter(m => !m.isPlaced);
        unplaced.sort((a,b) => getSortableDate(a.date) - getSortableDate(b.date));
        document.getElementById('unplaced-count').innerText = unplaced.length;

        let currentHeaderDate = null;
        unplaced.forEach(m => {
            if (m.date !== currentHeaderDate) {
                const header = document.createElement('div');
                header.className = 'text-xs font-bold text-gray-500 mt-3 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1';
                header.innerText = m.date; container.appendChild(header); currentHeaderDate = m.date;
            }
            const el = document.createElement('div');
            el.className = `match-card p-2 rounded shadow-sm border-l-4 text-sm relative ${getTeamStyle(m.thuis)}`;
            el.draggable = true; el.dataset.id = m.id;
            let sizeLabel = m.size === 'kwart' ? '¼ Veld' : (m.size === 'half' ? '½ Veld' : 'Heel Veld');
            el.innerHTML = `<div class="font-bold pr-4">${m.thuis}</div><div class="text-xs opacity-90 pr-4">${m.uit}</div><div class="flex justify-between mt-1 text-[10px] opacity-75"><span>${sizeLabel}</span><span>${m.prefTime ? 'Tijd: ' + m.prefTime : ''}</span></div><button onclick="deleteMatch('${m.id}')" title="Verwijder definitief uit systeem" class="absolute top-1 right-1 text-white hover:text-red-300 font-bold bg-black/20 rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>`;
            el.addEventListener('dragstart', handleDragStart); container.appendChild(el);
        });
    }

    function renderBoard() {
        document.querySelectorAll('.drop-zone').forEach(z => {
            Array.from(z.children).forEach(child => { if(child.classList.contains('match-card')) child.remove(); });
            z.classList.remove('bg-white');
        });

        const placed = matches.filter(m => m.isPlaced && m.date === activeDate && m.time === currentTimeslot);
        
        placed.forEach(m => {
            const cell = document.getElementById(m.cellId); if(!cell) return;
            const el = document.createElement('div');
            el.className = `match-card absolute inset-0 m-0.5 rounded shadow p-1 text-xs overflow-hidden flex flex-col justify-center border-l-4 ${getTeamStyle(m.thuis)}`;
            el.draggable = true; el.dataset.id = m.id;
            
            let klThuis = m.kleedkamerThuis || '?';
            let klUit = m.kleedkamerUit || '?';
            let klTekst = (klThuis === klUit) ? `Kl: ${klThuis}` : `Kl: ${klThuis} & ${klUit}`;
            if(m.klLocked) klTekst = "🔒 " + klTekst;
            
            el.innerHTML = `<div class="font-bold leading-tight pr-4 truncate">${m.thuis}</div><div class="opacity-90 leading-tight pr-4 truncate">${m.uit}</div><div onclick="editLocker(event, '${m.id}')" class="text-[9px] font-bold mt-auto bg-black/10 rounded px-1 inline-block w-max cursor-pointer hover:bg-black/20" title="Klik om de kleedkamer vast te zetten">${klTekst}</div><button onclick="unplaceMatch(event, '${m.id}')" title="Terug naar de zijbalk (Nog in te plannen)" class="absolute top-1 right-1 text-white hover:text-yellow-300 font-bold bg-black/20 rounded-full w-4 h-4 flex items-center justify-center text-[12px]">↩</button>`;
            el.addEventListener('dragstart', handleDragStart);
            
            if (m.size === 'kwart') { cell.appendChild(el); cell.classList.add('bg-white'); } 
            else if (m.size === 'half') {
                if (m.cellId.startsWith('kgv1_') || m.cellId.startsWith('veld2_')) {
                    el.style.height = 'calc(200% + 4px)'; el.style.width = '100%'; cell.appendChild(el); cell.classList.add('bg-white');
                    const parts = m.cellId.split('_');
                    if(parts.length > 1) { const sibling = document.getElementById(parts[0] + '_B' + parts[1][1]); if(sibling) sibling.classList.add('bg-white'); }
                } else {
                    el.style.width = 'calc(200% + 4px)'; el.style.height = '100%'; cell.appendChild(el); cell.classList.add('bg-white');
                    const parts = m.cellId.split('_');
                    if(parts.length > 1) { const sibling = document.getElementById(parts[0] + '_' + parts[1][0] + '2'); if(sibling) sibling.classList.add('bg-white'); }
                }
            } else if (m.size === 'heel') {
                if (m.cellId.includes('_Heel')) { cell.appendChild(el); cell.classList.add('bg-white'); } 
                else {
                    el.style.width = 'calc(200% + 4px)'; el.style.height = 'calc(200% + 4px)'; cell.appendChild(el);
                    const base = m.cellId.split('_')[0];
                    ['A1','A2','B1','B2'].forEach(ext => { const p = document.getElementById(base + '_' + ext); if(p) p.classList.add('bg-white'); });
                }
            }
        });
    }

    let draggedMatchId = null;
    function handleDragStart(e) { draggedMatchId = e.target.dataset.id; e.dataTransfer.setData('text/plain', draggedMatchId); }
    
    // Zorgt ervoor dat de robot pas start als de hele HTML pagina (knoppen etc) is geladen.
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.addEventListener('dragover', handleDragOverZone);
            zone.addEventListener('dragleave', (e) => e.target.classList.remove('drag-over', 'drag-error'));
            zone.addEventListener('drop', handleDropZone);
        });

        const sidebar = document.querySelector('aside');
        if(sidebar) {
            sidebar.addEventListener('dragover', e => e.preventDefault());
            sidebar.addEventListener('drop', e => {
                if(!draggedMatchId) return;
                const match = matches.find(m => m.id === draggedMatchId);
                if(match) {
                    match.isPlaced = false; match.cellId = null; match.time = null;
                    refreshUI();
                }
            });
        }
        
        syncCheckboxes(); updateCalendarData(); updateTeamsDatalist();
    });

    function getTargetCells(matchSize, dropCellId) {
        if (!dropCellId) return null;
        const fieldId = dropCellId.split('_')[0].toLowerCase(); const pos = dropCellId.split('_')[1]; 
        if (pos === 'Heel') { if (matchSize !== 'heel') return null; return [dropCellId]; }
        if(matchSize === 'kwart') return [dropCellId];
        if(matchSize === 'half') {
            if(pos === 'A1' || pos === 'A2') return [`${fieldId}_A1`, `${fieldId}_A2`];
            if(pos === 'B1' || pos === 'B2') return [`${fieldId}_B1`, `${fieldId}_B2`];
        }
        if(matchSize === 'heel') return [`${fieldId}_A1`, `${fieldId}_A2`, `${fieldId}_B1`, `${fieldId}_B2`];
        return [];
    }

    function handleDragOverZone(e) {
        e.preventDefault();
        const cell = e.target.closest('.drop-zone'); if(!cell || !draggedMatchId) return;
        const match = matches.find(m => m.id === draggedMatchId);
        
        let duration = getMatchDuration(match.cat, match.thuis, match.size);
        let conflict = checkFieldConflict(activeDate, cell.id, match.size, currentTimeslot, duration, match.id);
        
        if(!conflict) cell.classList.add('drag-over'); else cell.classList.add('drag-error');
    }

    function handleDropZone(e) {
        e.preventDefault();
        const cell = e.target.closest('.drop-zone'); cell.classList.remove('drag-over', 'drag-error');
        if(!cell || !draggedMatchId) return;
        const match = matches.find(m => m.id === draggedMatchId);
        const targets = getTargetCells(match.size, cell.id);
        if(!targets) { alert("Dit veld laat dit formaat niet toe."); return; }
        
        let duration = getMatchDuration(match.cat, match.thuis, match.size);
        let conflict = checkFieldConflict(activeDate, cell.id, match.size, currentTimeslot, duration, match.id);
        
        if(!conflict) {
            if(match.size === 'half') { match.cellId = cell.id.replace('A2', 'A1').replace('B2', 'B1'); } 
            else if(match.size === 'heel' && !cell.id.includes('_Heel')) { match.cellId = cell.id.split('_')[0] + '_A1'; } 
            else { match.cellId = cell.id; }
            
            match.isPlaced = true; match.time = currentTimeslot; match.date = activeDate;
            refreshUI();
        } else {
            alert("⚠️ Let op: Je kunt deze wedstrijd hier niet plaatsen! De eindtijd botst met een eerdere of latere wedstrijd op ditzelfde veld.");
        }
    }

    function resetCurrentTimeslot() {
        matches.forEach(m => { if (m.isPlaced && m.date === activeDate && m.time === currentTimeslot) { m.isPlaced = false; m.cellId = null; m.time = null; } });
        refreshUI();
    }

    function submitNewMatch() {
        const datum = document.getElementById('m-datum').value.trim();
        const thuis = document.getElementById('m-thuis').value.trim();
        const uit = document.getElementById('m-uit').value.trim();
        const type = document.getElementById('m-type').value;
        const cat = document.getElementById('m-cat').value;
        let pref = document.getElementById('m-pref').value.trim();

        if (!datum || !thuis || !uit) {
            alert("Vul minimaal de datum, thuisploeg en uitploeg in.");
            return;
        }

        if (!pref) {
            pref = determinePrefTime(thuis, uit);
        }
        
        let klThuis = null, klUit = null, klLocked = false;
        let datumIsWeekend = !isWeekday(datum); 
        let thuisL = thuis.toLowerCase();
        
        for(let uTeam in PLANNER_CONFIG.uitzonderingen) {
            if(thuisL.includes(uTeam) && datumIsWeekend && PLANNER_CONFIG.uitzonderingen[uTeam].klThuis) {
                klThuis = PLANNER_CONFIG.uitzonderingen[uTeam].klThuis; 
                klUit = PLANNER_CONFIG.uitzonderingen[uTeam].klUit; 
                klLocked = true; 
                if(!pref && PLANNER_CONFIG.uitzonderingen[uTeam].tijd) pref = PLANNER_CONFIG.uitzonderingen[uTeam].tijd;
            }
        }
        
        matches.push({
            id: 'm_' + Math.random().toString(36).substr(2, 9),
            date: datum, thuis: thuis, uit: uit, type: type, cat: cat,
            size: determineSize(cat, thuis, uit), prefTime: pref, isPlaced: false, cellId: null, time: null, kleedkamerThuis: klThuis, kleedkamerUit: klUit, klLocked: klLocked
        });

        document.getElementById('m-datum').value = '';
        document.getElementById('m-thuis').value = '';
        document.getElementById('m-uit').value = '';
        document.getElementById('m-pref').value = '';
        
        document.getElementById('modal-add').classList.add('hidden');
        
        activeDate = datum;
        updateCalendarData();
        syncCheckboxes();
        refreshUI();
        
        alert("Wedstrijd succesvol toegevoegd!");
    }

    function processBulkUpload() {
        const text = document.getElementById('bulk-data').value; 
        const rows = text.split('\n');
        let added = 0; let lastAddedDate = null;
        
        rows.forEach(row => {
            let cols = row.split('\t');
            if (cols.length < 3) cols = row.split(/ {2,}/);
            cols = cols.map(c => c.trim()).filter(c => c !== "");
            if(cols.length >= 3) {
                let datum = cols[0]; let thuis = cols[1]; let uit = cols[2];
                let type = cols.length > 3 ? cols[3] : 'Regulier';
                let cat = cols.length > 4 ? cols[4] : 'B-categorie';
                let pref = determinePrefTime(thuis, uit);
                
                let klThuis = null, klUit = null, klLocked = false;
                
                let datumIsWeekend = !isWeekday(datum); 
                let thuisL = thuis.toLowerCase();
                
                for(let uTeam in PLANNER_CONFIG.uitzonderingen) {
                    if(thuisL.includes(uTeam) && datumIsWeekend && PLANNER_CONFIG.uitzonderingen[uTeam].klThuis) {
                        klThuis = PLANNER_CONFIG.uitzonderingen[uTeam].klThuis; 
                        klUit = PLANNER_CONFIG.uitzonderingen[uTeam].klUit; 
                        klLocked = true; 
                    }
                }
                
                matches.push({
                    id: 'm_' + Math.random().toString(36).substr(2, 9),
                    date: datum, thuis: thuis, uit: uit, type: type, cat: cat,
                    size: determineSize(cat, thuis, uit), prefTime: pref, isPlaced: false, cellId: null, time: null, kleedkamerThuis: klThuis, kleedkamerUit: klUit, klLocked: klLocked
                });
                added++; lastAddedDate = datum;
            }
        });
        
        alert(`${added} wedstrijden succesvol ingelezen!`);
        document.getElementById('bulk-data').value = ''; document.getElementById('modal-bulk').classList.add('hidden');
        if (lastAddedDate) { activeDate = lastAddedDate; updateCalendarData(); syncCheckboxes(); }
        updateCalendarData(); refreshUI();
    }

    async function autoSchedule() {
        const btn = document.getElementById('btn-auto');
        btn.innerHTML = `Aan het inplannen...`;
        
        let maxGrasMatches = parseInt(document.getElementById('max-gras').value) || 99;
        
        function getTeamPriority(teamName) {
            let name = (teamName || '').toUpperCase();
            if (name === 'GPC 1' || name.includes('GPC VLISSINGEN 1') || name === 'VCV 1' || name === 'VC VLISSINGEN 1') return 1;
            
            for(let uTeam in PLANNER_CONFIG.uitzonderingen) {
                if(name.toLowerCase().includes(uTeam) && PLANNER_CONFIG.uitzonderingen[uTeam].tijd) return 2;
            }
            
            let m = name.match(/(?:O|MO)(\d+)/);
            if (m) return parseInt(m[1]) + 10; 
            
            if (name.includes('35+')) return 100;
            return 50; 
        }
        
        try {
            let toPlace = matches.filter(m => !m.isPlaced);
            
            toPlace.sort((a, b) => {
                let pA = getTeamPriority(a.thuis);
                let pB = getTeamPriority(b.thuis);
                if (pA !== pB) return pA - pB;
                
                const sizeVal = { 'heel': 3, 'half': 2, 'kwart': 1 }; 
                return (sizeVal[b.size] || 0) - (sizeVal[a.size] || 0);
            });

            for (let m of toPlace) {
                let thuisStr = (m.thuis || '').toLowerCase();
                let uitStr = (m.uit || '').toLowerCase();
                let typeStr = (m.type || '').toLowerCase();
                let catStr = (m.cat || '').toLowerCase();
                let is35 = thuisStr.includes('35+') || uitStr.includes('35+');
                
                if (typeStr.includes('oefen')) continue;
                
                let magDoordeweeks = is35;
                for(let uTeam in PLANNER_CONFIG.uitzonderingen) {
                    if(thuisStr.includes(uTeam) && PLANNER_CONFIG.uitzonderingen[uTeam].negeerDoordeweeks) {
                        magDoordeweeks = true;
                    }
                }
                
                if (isWeekday(m.date) && !magDoordeweeks && !m.prefTime) continue; 
                
                let targetTime = m.prefTime || null;
                let placed = false;
                
                let isJongeJeugd = thuisStr.match(/(o|mo)(7|8|9|10|11|12)\b/i) || uitStr.match(/(o|mo)(7|8|9|10|11|12)\b/i);
                let isOudereJeugd = thuisStr.match(/(o|mo)(13|14|15|16|17|18|19)\b/i) || uitStr.match(/(o|mo)(13|14|15|16|17|18|19)\b/i);
                let isSenior = !isJongeJeugd && !isOudereJeugd && !is35; 
                
                let isGPCThuis = thuisStr.includes('gpc');
                let isJVOZThuis = thuisStr.includes('jvoz');
                let isVCVThuis = thuisStr.includes('vc vlissingen') || thuisStr.includes('vcv');
                let isJVOZ = thuisStr.includes('jvoz') || uitStr.includes('jvoz');
                let isO7 = catStr.includes('o7') || thuisStr.includes('o7') || uitStr.includes('o7');
                
                let isMO15_17 = catStr.includes('mo15') || thuisStr.includes('mo15') || uitStr.includes('mo15') || catStr.includes('mo17') || thuisStr.includes('mo17') || uitStr.includes('mo17');
                let is9tal = thuisStr.includes('(9-tal)') || uitStr.includes('(9-tal)');

                let configUitzonderingTijd = null;
                let configUitzonderingVeld = null;
                for(let uTeam in PLANNER_CONFIG.uitzonderingen) {
                    if(thuisStr.includes(uTeam)) {
                        configUitzonderingTijd = PLANNER_CONFIG.uitzonderingen[uTeam].tijd || null;
                        configUitzonderingVeld = PLANNER_CONFIG.uitzonderingen[uTeam].veldId || null;
                    }
                }

                let timesToTry = [];
                if (configUitzonderingTijd) timesToTry = [configUitzonderingTijd];
                else if (thuisStr === 'vc vlissingen 1' || thuisStr.includes('gpc vlissingen 1') || thuisStr === 'gpc 1') timesToTry = [PLANNER_CONFIG.tijden.eersteElftallen];
                else if (is35) timesToTry = [targetTime || PLANNER_CONFIG.tijden.veteranen];
                else if (isSenior) {
                    if (targetTime === PLANNER_CONFIG.tijden.seniorenMiddag[1]) timesToTry = [PLANNER_CONFIG.tijden.seniorenMiddag[1], PLANNER_CONFIG.tijden.seniorenMiddag[0]];
                    else timesToTry = PLANNER_CONFIG.tijden.seniorenMiddag;
                }
                else if (isJongeJeugd) {
                    if (isO7) timesToTry = [PLANNER_CONFIG.tijden.jeugdJongFallback[0]]; 
                    else if (targetTime === PLANNER_CONFIG.tijden.jeugdJongFallback[1]) timesToTry = [PLANNER_CONFIG.tijden.jeugdJongFallback[1], PLANNER_CONFIG.tijden.jeugdJongFallback[0], PLANNER_CONFIG.tijden.jeugdJongFallback[2]];
                    else if (targetTime === PLANNER_CONFIG.tijden.jeugdJongFallback[2]) timesToTry = [PLANNER_CONFIG.tijden.jeugdJongFallback[2], PLANNER_CONFIG.tijden.jeugdJongFallback[1], PLANNER_CONFIG.tijden.jeugdJongFallback[0]];
                    else timesToTry = PLANNER_CONFIG.tijden.jeugdJongFallback;
                }
                else if (isOudereJeugd) {
                    if (targetTime === PLANNER_CONFIG.tijden.jeugdOudFallback[2]) timesToTry = [PLANNER_CONFIG.tijden.jeugdOudFallback[2], PLANNER_CONFIG.tijden.jeugdOudFallback[1], PLANNER_CONFIG.tijden.jeugdOudFallback[0], PLANNER_CONFIG.tijden.jeugdJongFallback[0]];
                    else if (targetTime === PLANNER_CONFIG.tijden.jeugdOudFallback[1]) timesToTry = [PLANNER_CONFIG.tijden.jeugdOudFallback[1], PLANNER_CONFIG.tijden.jeugdOudFallback[2], PLANNER_CONFIG.tijden.jeugdOudFallback[0], PLANNER_CONFIG.tijden.jeugdJongFallback[0]];
                    else if (targetTime === PLANNER_CONFIG.tijden.jeugdOudFallback[0]) timesToTry = [PLANNER_CONFIG.tijden.jeugdOudFallback[0], PLANNER_CONFIG.tijden.jeugdOudFallback[1], PLANNER_CONFIG.tijden.jeugdOudFallback[2], PLANNER_CONFIG.tijden.jeugdJongFallback[0]];
                    else timesToTry = [PLANNER_CONFIG.tijden.jeugdOudFallback[0], PLANNER_CONFIG.tijden.jeugdOudFallback[1], PLANNER_CONFIG.tijden.jeugdOudFallback[2], PLANNER_CONFIG.tijden.jeugdJongFallback[0]];
                }
                else {
                    timesToTry = PLANNER_CONFIG.tijden.totaalSchema;
                }

                if (isJVOZ && !configUitzonderingTijd) {
                    timesToTry = timesToTry.filter(t => t !== PLANNER_CONFIG.tijden.jeugdJongFallback[0]);
                    if (timesToTry.length === 0) timesToTry = PLANNER_CONFIG.tijden.jeugdOudFallback;
                }

                let fieldPref = [];
                if (configUitzonderingVeld) {
                    fieldPref = [configUitzonderingVeld];
                } else if (thuisStr === 'vc vlissingen 1') {
                    fieldPref = ['kgv1_A1', 'kgv5_A1', 'kgv6_A1'];
                } else if (thuisStr.includes('gpc vlissingen 1') || thuisStr === 'gpc 1') {
                    fieldPref = ['kgv6_A1', 'kgv5_A1', 'kgv1_A1'];
                } else if (is35 && isVCVThuis) {
                    fieldPref = ['kgv1_A1', 'kgv1_B1', 'kgv5_A1', 'kgv5_B1'];
                } else if (is35 && isGPCThuis) {
                    fieldPref = ['kgv6_B1', 'kgv6_A1', 'kgv5_B1', 'kgv5_A1'];
                } else if (isJVOZThuis) {
                    if (m.size === 'heel') fieldPref = ['kgv1_A1', 'kgv5_A1', 'kgv6_A1', 'veld2_Heel'];
                    else if (m.size === 'half') fieldPref = ['kgv1_A1', 'kgv1_B1', 'kgv5_A1', 'kgv5_B1', 'kgv6_A1', 'kgv6_B1'];
                    else fieldPref = ['kgv1_A1', 'kgv1_B1', 'kgv1_A2', 'kgv1_B2', 'kgv5_A1', 'kgv5_A2', 'kgv5_B1', 'kgv5_B2', 'kgv6_A1', 'kgv6_A2', 'kgv6_B1', 'kgv6_B2'];
                } else if (isVCVThuis) {
                    if (m.size === 'heel') fieldPref = ['kgv1_A1', 'kgv5_A1', 'kgv6_A1', 'veld4_Heel', 'veld2_Heel', 'veld3_A1'];
                    else if (m.size === 'half') fieldPref = ['kgv1_A1', 'kgv1_B1', 'kgv5_A1', 'kgv5_B1', 'kgv6_A1', 'kgv6_B1', 'veld3_A1', 'veld3_B1'];
                    else fieldPref = ['kgv1_A1', 'kgv1_B1', 'kgv1_A2', 'kgv1_B2', 'kgv5_A1', 'kgv5_A2', 'kgv5_B1', 'kgv5_B2', 'kgv6_A1', 'kgv6_A2', 'kgv6_B1', 'kgv6_B2', 'veld3_A1', 'veld3_A2'];
                } else {
                    if (m.size === 'heel') fieldPref = ['kgv6_A1', 'kgv5_A1', 'kgv1_A1', 'veld4_Heel', 'veld2_Heel', 'veld3_A1'];
                    else if (m.size === 'half') fieldPref = ['kgv6_A1', 'kgv6_B1', 'kgv5_A1', 'kgv5_B1', 'kgv1_A1', 'kgv1_B1', 'veld3_A1', 'veld3_B1'];
                    else fieldPref = ['kgv6_A1', 'kgv6_A2', 'kgv6_B1', 'kgv6_B2', 'kgv5_A1', 'kgv5_A2', 'kgv5_B1', 'kgv5_B2', 'kgv1_A1', 'kgv1_B1', 'kgv1_A2', 'kgv1_B2'];
                }

                if (isJVOZThuis && !configUitzonderingVeld) {
                    fieldPref = fieldPref.filter(f => PLANNER_CONFIG.velden.jvozToegestaan.some(allowed => f.startsWith(allowed)));
                }
                
                if (isMO15_17 && is9tal) {
                    fieldPref = fieldPref.filter(f => PLANNER_CONFIG.velden.groteGoalsToegestaan.some(allowed => f.startsWith(allowed)));
                }

                if (fieldPref.length === 0) fieldPref = ['kgv6_A1', 'kgv5_A1', 'kgv1_A1'];
                
                let fieldsForThisMatch = getActiveFields(m.date);
                fieldPref = fieldPref.filter(fp => fieldsForThisMatch[fp.split('_')[0].toLowerCase()]);

                for (let t of timesToTry) {
                    if (placed) break;
                    for (let cellId of fieldPref) {
                        if (cellId.startsWith('veld')) {
                            let baseField = cellId.split('_')[0];
                            let matchesOnThisGrasField = matches.filter(placedM => placedM.isPlaced && placedM.date === m.date && placedM.cellId && placedM.cellId.startsWith(baseField)).length;
                            if (matchesOnThisGrasField >= maxGrasMatches) {
                                continue;
                            }
                        }

                        let duration = getMatchDuration(m.cat, m.thuis, m.size);
                        let conflict = checkFieldConflict(m.date, cellId, m.size, t, duration, m.id);
                        
                        if (!conflict) {
                            m.isPlaced = true; m.time = t; m.cellId = cellId; placed = true;
                            if (activeDate !== m.date) { 
                                activeDate = m.date; updateCalendarData(); syncCheckboxes();
                            }
                            
                            if(currentTimeslot !== t) {
                                currentTimeslot = t;
                                document.querySelectorAll('#time-buttons button').forEach(b => {
                                    b.classList.remove('bg-green-500'); if(!b.classList.contains('text-yellow-300')) b.classList.add('hover:bg-gray-700'); 
                                });
                                let btnT = document.getElementById('btn-' + t);
                                if(btnT) { btnT.classList.add('bg-green-500'); btnT.classList.remove('hover:bg-gray-700'); }
                            }
                            renderBoard();
                            document.getElementById('unplaced-count').innerText = matches.filter(x => !x.isPlaced).length;
                            
                            await new Promise(r => setTimeout(r, 5)); 
                            break;
                        }
                    }
                }
            }
            refreshUI(); 
            
        } catch (error) { 
            console.error(error); 
            alert("Fout tijdens inplannen: " + error.message + "\n(Controleer je Excel kopie op vreemde tekens of lege regels)"); 
        } finally { 
            btn.innerHTML = `Automatisch indelen`; 
        }
    }

    function renderOverviewTable() {
        const tbody = document.getElementById('overview-tbody'); tbody.innerHTML = '';
        let sorted = [...matches.filter(m => m.isPlaced)].sort((a,b) => {
            let dateDiff = getSortableDate(a.date) - getSortableDate(b.date);
            if (dateDiff !== 0) return dateDiff; return a.time.localeCompare(b.time);
        });

        let currentGroup = null;
        sorted.forEach(m => {
            let groupKey = m.date + '_' + m.time;
            if (groupKey !== currentGroup) {
                let blockMatches = sorted.filter(sm => sm.date === m.date && sm.time === m.time);
                let totMini = 0; let totKlein = 0; let totGroot = 0;
                blockMatches.forEach(bm => { let g = getGoalsForMatch(bm); totMini += g.mini; totKlein += g.klein; totGroot += g.groot; });
                let goalText = "";
                if (totMini > 0 || totKlein > 0 || totGroot > 0) goalText = `<span class="float-right bg-white px-2 py-0.5 rounded text-xs border shadow-sm">Klaarzetten: <b class="text-yellow-600">${totMini}x Mini</b> | <b class="text-orange-600">${totKlein}x Klein</b> | <b class="text-blue-600">${totGroot}x Groot</b></span>`;
                tbody.innerHTML += `<tr class="bg-gray-200 border-y-2 border-gray-300"><td colspan="8" class="p-2 font-bold text-gray-800">Tijdsblok: ${m.date} - ${m.time} <span class="print-hide">${goalText}</span></td></tr>`;
                currentGroup = groupKey;
            }
            
            try {
                let duration = getMatchDuration(m.cat, m.thuis, m.size);
                let endD = new Date(`2000-01-01T${m.time}:00`); endD.setMinutes(endD.getMinutes() + duration);
                let endStr = endD.toTimeString().substring(0,5);
                let fieldName = formatFieldName(m.cellId, m.size);
                
                let klThuis = m.kleedkamerThuis || '?';
                let klUit = m.kleedkamerUit || '?';
                let klTekst = (klThuis === klUit) ? `${klThuis} (Gedeeld)` : `${klThuis} & ${klUit}`;
                if(m.klLocked) klTekst = "🔒 " + klTekst;
                
                tbody.innerHTML += `<tr class="border-b hover:bg-gray-50"><td class="p-2 pl-4 text-gray-500">${m.date}</td><td class="p-2 font-bold">${m.time}</td><td class="p-2 text-red-600 font-bold">${endStr}</td><td class="p-2 text-green-700 font-bold">${fieldName}</td><td class="p-2 font-bold text-blue-700">${klTekst}</td><td class="p-2">${m.thuis} - ${m.uit}</td><td class="p-2">${m.type}</td><td class="p-2">${m.cat}</td></tr>`;
            } catch(e) { console.error("Fout bij renderen:", m, e); }
        });
    }

    function getISOWeekNumber(dateStr) {
        const months = { 'jan':0, 'feb':1, 'mrt':2, 'apr':3, 'mei':4, 'jun':5, 'jul':6, 'aug':7, 'sep':8, 'okt':9, 'nov':10, 'dec':11 };
        let parts = dateStr.toLowerCase().split('-'); let d = parseInt(parts[0]); let m = months[parts[1]];
        if(isNaN(d) || isNaN(m)) return 0;
        let target = new Date(new Date().getFullYear(), m, d);
        let dayNr = (target.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        let firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) { target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7); }
        return 1 + Math.ceil((firstThursday - target) / 604800000);
    }

    function exportToExcel() {
        let sorted = [...matches.filter(m => m.isPlaced)].sort((a,b) => {
            let dateDiff = getSortableDate(a.date) - getSortableDate(b.date);
            if (dateDiff !== 0) return dateDiff; return a.time.localeCompare(b.time);
        });
        
        if(sorted.length === 0) { alert("Er zijn geen ingeplande wedstrijden om te exporteren."); return; }

        let firstDateStr = sorted[0].date;
        let lastDateStr = sorted[sorted.length - 1].date;
        let weekNum = getISOWeekNumber(firstDateStr);
        let fileName = `Planning_Week_${weekNum}_van_${firstDateStr}_tot_${lastDateStr}.xls`;

        let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        html += '<head><meta charset="utf-8"></head><body>';
        html += '<table border="1"><thead><tr>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Datum</th>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Starttijd</th>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Eindtijd</th>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Veld</th>';
        html += '<th style="background-color:#1f2937;color:#fde047;font-weight:bold;">Kleedkamers</th>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Wedstrijd</th>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Type</th>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Cat</th>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Mini Doeltjes</th>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Kleine Doeltjes</th>';
        html += '<th style="background-color:#1f2937;color:#ffffff;font-weight:bold;">Grote Doeltjes</th>';
        html += '</tr></thead><tbody>';

        sorted.forEach(m => {
            let duration = getMatchDuration(m.cat, m.thuis, m.size);
            let endD = new Date(`2000-01-01T${m.time}:00`); endD.setMinutes(endD.getMinutes() + duration);
            let endStr = endD.toTimeString().substring(0,5);
            let fieldName = formatFieldName(m.cellId, m.size); 
            let g = getGoalsForMatch(m);
            
            let klThuis = m.kleedkamerThuis || '?';
            let klUit = m.kleedkamerUit || '?';
            let klTekst = (klThuis === klUit) ? `${klThuis}` : `${klThuis} & ${klUit}`;
            if(m.klLocked) klTekst = "Locked " + klTekst;

            let bg = "#ffffff"; let fg = "#000000";
            let thuisStr = m.thuis.toLowerCase();
            if (thuisStr.includes('gpc')) { bg = "#fed7aa"; fg = "#9a3412"; } 
            else if (thuisStr.includes('jvoz')) { bg = "#bfdbfe"; fg = "#1e3a8a"; } 
            else if (thuisStr.includes('vc vlissingen') || thuisStr.includes('vcv')) { bg = "#fbcfe8"; fg = "#b91c1c"; } 

            html += `<tr style="background-color:${bg};color:${fg};">
                <td>${m.date}</td><td>${m.time}</td><td>${endStr}</td><td>${fieldName}</td>
                <td>${klTekst}</td>
                <td>${m.thuis} - ${m.uit}</td><td>${m.type}</td><td>${m.cat}</td>
                <td>${g.mini}</td><td>${g.klein}</td><td>${g.groot}</td>
            </tr>`;
        });

        html += '</tbody></table></body></html>';

        let blob = new Blob([html], {type: 'application/vnd.ms-excel'});
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }