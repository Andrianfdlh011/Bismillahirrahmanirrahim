// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA5A3lFBIE-H2YnOowzzYtY9uNx0QWLt2E",
    authDomain: "bismillahirrahmanirrahim-ea734.firebaseapp.com",
    databaseURL: "https://bismillahirrahmanirrahim-ea734-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bismillahirrahmanirrahim-ea734",
    storageBucket: "bismillahirrahmanirrahim-ea734.firebasestorage.app",
    messagingSenderId: "467748329213",
    appId: "1:467748329213:web:00ad9cac6e3f9e0753d094"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const dataRef = database.ref('Data');
const aggregatedDataNewRef = database.ref('AggregatedData_Permenit');
const aggregatedDataHourlyRef = database.ref('AggregatedData_Perjam');
const aggregatedDataDailyRef = database.ref('AggregatedData_Perhari');
const aggregatedDataWeeklyRef = database.ref('AggregatedData_Perminggu');  // Node untuk data per minggu
const aggregatedDataMonthlyRef = database.ref('AggregatedData_Perbulan');  // Node untuk data per bulan
const aggregatedDataYearlyRef = database.ref('AggregatedData_Pertahun');  // Node untuk data per tahun

// Helper functions
function padZero(num) {
    return num.toString().padStart(2, '0');
}

function getDayName(dateString) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date(dateString).getDay()];
}

function getMonthName(monthIndex) {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[monthIndex];
}

function formatTimestamp(timestamp) {
    const [datePart, timePart] = timestamp.split('_');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes, seconds] = timePart.split('-');
    
    const formattedDate = new Date(Date.parse(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`));
    const localDate = new Date(formattedDate.getTime() + formattedDate.getTimezoneOffset() * 60000);

    return {
        date: `${getDayName(localDate.toISOString())}, ${localDate.getDate()} ${getMonthName(localDate.getMonth())} ${localDate.getFullYear()}`,
        time: `${padZero(localDate.getHours())}:${padZero(localDate.getMinutes())}:${padZero(localDate.getSeconds())}`,
        formattedTimestamp: `${year}-${month}-${day}_${padZero(hours)}:${padZero(minutes)}`
    };
}

// Function to update load status based on current
function updateLoadStatus(totalCurrent) {
    const warningBox = document.getElementById('warningBox');

    if (totalCurrent <= 3.2) {
        warningBox.textContent = 'Beban Normal';
        warningBox.className = 'warning green-background';
        warningBox.style.backgroundColor = '#10b10a';
        warningBox.style.color = '#fff';
        document.body.style.background = 'linear-gradient(135deg,rgb(137, 248, 133),rgba(126, 238, 111, 0.93))';
    } else if (totalCurrent > 3.2 && totalCurrent <= 3.6) {
        warningBox.textContent = 'Beban Tinggi';
        warningBox.className = 'warning yellow-background';
        warningBox.style.backgroundColor = '#f4d03f';
        warningBox.style.color = '#333';
        document.body.style.background = 'linear-gradient(135deg,rgba(247, 250, 91, 0.97),rgb(226, 240, 34))';
    } else {
        warningBox.textContent = 'Peringatan Beban Tinggi! Jangan Tambahkan Beban Lagi';
        warningBox.className = 'warning orange-background';
        warningBox.style.backgroundColor = '#e67e22';
        warningBox.style.color = '#fff';
        document.body.style.background = 'linear-gradient(135deg,rgb(233, 137, 58),rgb(207, 162, 12))';
    }

    warningBox.style.display = 'block';
}

// Function to aggregate data per minute
function aggregateDataPerMinute(data) {
    const aggregatedData = {};

    for (let timestamp in data) {
        const { formattedTimestamp } = formatTimestamp(timestamp);
        const minuteKey = formattedTimestamp;

        if (!aggregatedData[minuteKey]) {
            aggregatedData[minuteKey] = {
                Average_Current_PZEM: 0,
                Average_Current_SCT1: 0,
                Average_Current_SCT2: 0,
                Average_Voltage: 0,
                Average_pf: 0,
                Average_power: 0,
                Total_Energy: 0,
                count: 0
            };
        }

        const currentData = data[timestamp];

        aggregatedData[minuteKey].Average_Current_PZEM += parseFloat(currentData.Current_PZEM || 0);
        aggregatedData[minuteKey].Average_Current_SCT1 += parseFloat(currentData.Current_SCT1 || 0);
        aggregatedData[minuteKey].Average_Current_SCT2 += parseFloat(currentData.Current_SCT2 || 0);
        aggregatedData[minuteKey].Average_Voltage += parseFloat(currentData.Voltage || 0);
        aggregatedData[minuteKey].Average_pf += parseFloat(currentData.pf || 0);
        aggregatedData[minuteKey].Average_power += parseFloat(currentData.power || 0);
        aggregatedData[minuteKey].Total_Energy = parseFloat(currentData.Energy || 0);
        aggregatedData[minuteKey].count += 1;
    }

    for (let minuteKey in aggregatedData) {
        const aggregated = aggregatedData[minuteKey];
        aggregated.Average_Current_PZEM /= aggregated.count;
        aggregated.Average_Current_SCT1 /= aggregated.count;
        aggregated.Average_Current_SCT2 /= aggregated.count;
        aggregated.Average_Voltage /= aggregated.count;
        aggregated.Average_pf /= aggregated.count;
        aggregated.Average_power /= aggregated.count;
        delete aggregated.count;
    }

    return aggregatedData;
}

// Function to aggregate data per hour
function aggregateDataPerHour(aggregatedDataPerMinute) {
    const aggregatedDataPerHour = {};

    for (let minuteKey in aggregatedDataPerMinute) {
        const [datePart, timePart] = minuteKey.split('_');
        const [hour] = timePart.split(':');
        const hourKey = `${datePart}_${hour}`;

        if (!aggregatedDataPerHour[hourKey]) {
            aggregatedDataPerHour[hourKey] = {
                Average_Current_PZEM: 0,
                Average_Current_SCT1: 0,
                Average_Current_SCT2: 0,
                Average_Voltage: 0,
                Average_pf: 0,
                Average_power: 0,
                Total_Energy: 0,
                lastEnergy: 0, // Track the last energy value
                count: 0
            };
        }

        const currentMinuteData = aggregatedDataPerMinute[minuteKey];
        aggregatedDataPerHour[hourKey].Average_Current_PZEM += currentMinuteData.Average_Current_PZEM;
        aggregatedDataPerHour[hourKey].Average_Current_SCT1 += currentMinuteData.Average_Current_SCT1;
        aggregatedDataPerHour[hourKey].Average_Current_SCT2 += currentMinuteData.Average_Current_SCT2;
        aggregatedDataPerHour[hourKey].Average_Voltage += currentMinuteData.Average_Voltage;
        aggregatedDataPerHour[hourKey].Average_pf += currentMinuteData.Average_pf;
        aggregatedDataPerHour[hourKey].Average_power += currentMinuteData.Average_power;
        
        // Update last energy for each hour
        aggregatedDataPerHour[hourKey].lastEnergy = currentMinuteData.Total_Energy;

        aggregatedDataPerHour[hourKey].count += 1;
    }

    for (let hourKey in aggregatedDataPerHour) {
        const aggregated = aggregatedDataPerHour[hourKey];
        aggregated.Average_Current_PZEM /= aggregated.count;
        aggregated.Average_Current_SCT1 /= aggregated.count;
        aggregated.Average_Current_SCT2 /= aggregated.count;
        aggregated.Average_Voltage /= aggregated.count;
        aggregated.Average_pf /= aggregated.count;
        aggregated.Average_power /= aggregated.count;
        
        // Set Total_Energy to the last energy value of the hour
        aggregated.Total_Energy = aggregated.lastEnergy;
        
        // Clean up the temporary lastEnergy and count properties
        delete aggregated.lastEnergy;
        delete aggregated.count;
    }

    return aggregatedDataPerHour;
}

// Function to aggregate data per day
function aggregateDataPerDay(aggregatedDataPerHour) {
    const aggregatedDataPerDay = {};

    for (let hourKey in aggregatedDataPerHour) {
        const [datePart] = hourKey.split('_');
        
        if (!aggregatedDataPerDay[datePart]) {
            aggregatedDataPerDay[datePart] = {
                Average_Current_PZEM: 0,
                Average_Current_SCT1: 0,
                Average_Current_SCT2: 0,
                Average_Voltage: 0,
                Average_pf: 0,
                Average_power: 0,
                Total_Energy: 0,
                lastEnergy: 0, // Track the last energy value
                count: 0
            };
        }

        const currentHourData = aggregatedDataPerHour[hourKey];
        aggregatedDataPerDay[datePart].Average_Current_PZEM += currentHourData.Average_Current_PZEM;
        aggregatedDataPerDay[datePart].Average_Current_SCT1 += currentHourData.Average_Current_SCT1;
        aggregatedDataPerDay[datePart].Average_Current_SCT2 += currentHourData.Average_Current_SCT2;
        aggregatedDataPerDay[datePart].Average_Voltage += currentHourData.Average_Voltage;
        aggregatedDataPerDay[datePart].Average_pf += currentHourData.Average_pf;
        aggregatedDataPerDay[datePart].Average_power += currentHourData.Average_power;

        // Update last energy for each day
        aggregatedDataPerDay[datePart].lastEnergy = currentHourData.Total_Energy;

        aggregatedDataPerDay[datePart].count += 1;
    }

    for (let dayKey in aggregatedDataPerDay) {
        const aggregated = aggregatedDataPerDay[dayKey];
        aggregated.Average_Current_PZEM /= aggregated.count;
        aggregated.Average_Current_SCT1 /= aggregated.count;
        aggregated.Average_Current_SCT2 /= aggregated.count;
        aggregated.Average_Voltage /= aggregated.count;
        aggregated.Average_pf /= aggregated.count;
        aggregated.Average_power /= aggregated.count;

        // Set Total_Energy to the last energy value of the day
        aggregated.Total_Energy = aggregated.lastEnergy;
        
        // Clean up the temporary lastEnergy and count properties
        delete aggregated.lastEnergy;
        delete aggregated.count;
    }

    return aggregatedDataPerDay;
}

// Function to aggregate data per week (from daily data)
function aggregateDataPerWeek(aggregatedDataPerDay) {
    const aggregatedDataPerWeek = {};

    for (let dayKey in aggregatedDataPerDay) {
        const date = new Date(dayKey);
        const weekNumber = getWeekNumber(date);  // Dapatkan nomor minggu
        const weekKey = `week ${padZero(weekNumber)}`;  // Format 'week XX'

        if (!aggregatedDataPerWeek[weekKey]) {
            aggregatedDataPerWeek[weekKey] = {
                Average_Current_PZEM: 0,
                Average_Current_SCT1: 0,
                Average_Current_SCT2: 0,
                Average_Voltage: 0,
                Average_pf: 0,
                Average_power: 0,
                Total_Energy: 0,
                lastEnergy: 0,  // Track the last energy value
                count: 0
            };
        }

        const currentDayData = aggregatedDataPerDay[dayKey];
        aggregatedDataPerWeek[weekKey].Average_Current_PZEM += currentDayData.Average_Current_PZEM;
        aggregatedDataPerWeek[weekKey].Average_Current_SCT1 += currentDayData.Average_Current_SCT1;
        aggregatedDataPerWeek[weekKey].Average_Current_SCT2 += currentDayData.Average_Current_SCT2;
        aggregatedDataPerWeek[weekKey].Average_Voltage += currentDayData.Average_Voltage;
        aggregatedDataPerWeek[weekKey].Average_pf += currentDayData.Average_pf;
        aggregatedDataPerWeek[weekKey].Average_power += currentDayData.Average_power;

        // Update last energy for each week
        aggregatedDataPerWeek[weekKey].lastEnergy = currentDayData.Total_Energy;

        aggregatedDataPerWeek[weekKey].count += 1;
    }

    for (let weekKey in aggregatedDataPerWeek) {
        const aggregated = aggregatedDataPerWeek[weekKey];
        aggregated.Average_Current_PZEM /= aggregated.count;
        aggregated.Average_Current_SCT1 /= aggregated.count;
        aggregated.Average_Current_SCT2 /= aggregated.count;
        aggregated.Average_Voltage /= aggregated.count;
        aggregated.Average_pf /= aggregated.count;
        aggregated.Average_power /= aggregated.count;

        // Set Total_Energy to the last energy value of the week
        aggregated.Total_Energy = aggregated.lastEnergy;
        
        // Clean up the temporary lastEnergy and count properties
        delete aggregated.lastEnergy;
        delete aggregated.count;
    }

    return aggregatedDataPerWeek;
}

// Function to aggregate data per month (from daily data)
function aggregateDataPerMonth(aggregatedDataPerDay) {
    const aggregatedDataPerMonth = {};

    for (let dayKey in aggregatedDataPerDay) {
        const [year, month, day] = dayKey.split('-');
        const monthKey = `${year}-${month}`;

        if (!aggregatedDataPerMonth[monthKey]) {
            aggregatedDataPerMonth[monthKey] = {
                Average_Current_PZEM: 0,
                Average_Current_SCT1: 0,
                Average_Current_SCT2: 0,
                Average_Voltage: 0,
                Average_pf: 0,
                Average_power: 0,
                Total_Energy: 0,
                lastEnergy: 0,  // Track the last energy value
                count: 0
            };
        }

        const currentDayData = aggregatedDataPerDay[dayKey];
        aggregatedDataPerMonth[monthKey].Average_Current_PZEM += currentDayData.Average_Current_PZEM;
        aggregatedDataPerMonth[monthKey].Average_Current_SCT1 += currentDayData.Average_Current_SCT1;
        aggregatedDataPerMonth[monthKey].Average_Current_SCT2 += currentDayData.Average_Current_SCT2;
        aggregatedDataPerMonth[monthKey].Average_Voltage += currentDayData.Average_Voltage;
        aggregatedDataPerMonth[monthKey].Average_pf += currentDayData.Average_pf;
        aggregatedDataPerMonth[monthKey].Average_power += currentDayData.Average_power;

        // Update last energy for each month
        aggregatedDataPerMonth[monthKey].lastEnergy = currentDayData.Total_Energy;

        aggregatedDataPerMonth[monthKey].count += 1;
    }

    for (let monthKey in aggregatedDataPerMonth) {
        const aggregated = aggregatedDataPerMonth[monthKey];
        aggregated.Average_Current_PZEM /= aggregated.count;
        aggregated.Average_Current_SCT1 /= aggregated.count;
        aggregated.Average_Current_SCT2 /= aggregated.count;
        aggregated.Average_Voltage /= aggregated.count;
        aggregated.Average_pf /= aggregated.count;
        aggregated.Average_power /= aggregated.count;

        // Set Total_Energy to the last energy value of the month
        aggregated.Total_Energy = aggregated.lastEnergy;
        
        // Clean up the temporary lastEnergy and count properties
        delete aggregated.lastEnergy;
        delete aggregated.count;
    }

    return aggregatedDataPerMonth;
}

// Function to aggregate data per year (from month data)
function aggregateDataPerYear(aggregatedDataPerMonth) {
    const aggregatedDataPerYear = {};

    for (let monthKey in aggregatedDataPerMonth) {
        const [year, month] = monthKey.split('-');
        const yearKey = year;  // Key for the year aggregation

        if (!aggregatedDataPerYear[yearKey]) {
            aggregatedDataPerYear[yearKey] = {
                Average_Current_PZEM: 0,
                Average_Current_SCT1: 0,
                Average_Current_SCT2: 0,
                Average_Voltage: 0,
                Average_pf: 0,
                Average_power: 0,
                Average_energy: 0, // Updated to reflect average energy instead of total
                count: 0
            };
        }

        const currentMonthData = aggregatedDataPerMonth[monthKey];
        aggregatedDataPerYear[yearKey].Average_Current_PZEM += currentMonthData.Average_Current_PZEM;
        aggregatedDataPerYear[yearKey].Average_Current_SCT1 += currentMonthData.Average_Current_SCT1;
        aggregatedDataPerYear[yearKey].Average_Current_SCT2 += currentMonthData.Average_Current_SCT2;
        aggregatedDataPerYear[yearKey].Average_Voltage += currentMonthData.Average_Voltage;
        aggregatedDataPerYear[yearKey].Average_pf += currentMonthData.Average_pf;
        aggregatedDataPerYear[yearKey].Average_power += currentMonthData.Average_power;
        aggregatedDataPerYear[yearKey].Average_energy += currentMonthData.Total_Energy; // Accumulate energy for averaging
        aggregatedDataPerYear[yearKey].count += 1;
    }

    for (let yearKey in aggregatedDataPerYear) {
        const aggregated = aggregatedDataPerYear[yearKey];
        aggregated.Average_Current_PZEM /= aggregated.count;
        aggregated.Average_Current_SCT1 /= aggregated.count;
        aggregated.Average_Current_SCT2 /= aggregated.count;
        aggregated.Average_Voltage /= aggregated.count;
        aggregated.Average_pf /= aggregated.count;
        aggregated.Average_power /= aggregated.count;
        aggregated.Average_energy /= aggregated.count; // Calculate the average energy
        delete aggregated.count;
    }

    return aggregatedDataPerYear;
}

// Helper function to get week number of the year
function getWeekNumber(date) {
    // Clone the date object to avoid modifying the original
    const currentDate = new Date(date.getTime());
    // Set the current date to the nearest Thursday (ISO week starts on Monday)
    currentDate.setDate(currentDate.getDate() + (4 - (currentDate.getDay() || 7)));
    // Calculate the start of the year
    const yearStart = new Date(currentDate.getFullYear(), 0, 1);
    // Calculate the difference in days
    const days = Math.floor((currentDate - yearStart) / (24 * 60 * 60 * 1000));
    // Return the ISO week number
    return Math.ceil((days + 1) / 7);
}

// Function to send aggregated data to Firebase
function sendAggregatedData(aggregatedData, ref) {
    for (let key in aggregatedData) {
        ref.child(key).set(aggregatedData[key]);
    }
}

// Listen for changes in data and process aggregation
dataRef.on('value', snapshot => {
    const data = snapshot.val();

    // Aggregate per minute
    const aggregatedDataPerMinute = aggregateDataPerMinute(data);
    sendAggregatedData(aggregatedDataPerMinute, aggregatedDataNewRef);

    // Aggregate per hour
    const aggregatedDataPerHour = aggregateDataPerHour(aggregatedDataPerMinute);
    sendAggregatedData(aggregatedDataPerHour, aggregatedDataHourlyRef);

    // Aggregate per day
    const aggregatedDataPerDay = aggregateDataPerDay(aggregatedDataPerHour);
    sendAggregatedData(aggregatedDataPerDay, aggregatedDataDailyRef);

    // Aggregate per week
    const aggregatedDataPerWeek = aggregateDataPerWeek(aggregatedDataPerDay);
    sendAggregatedData(aggregatedDataPerWeek, aggregatedDataWeeklyRef);

    // Aggregate per month
    const aggregatedDataPerMonth = aggregateDataPerMonth(aggregatedDataPerDay);
    sendAggregatedData(aggregatedDataPerMonth, aggregatedDataMonthlyRef);

    // Aggregate per year
    const aggregatedDataPerYear = aggregateDataPerYear(aggregatedDataPerMonth);
    sendAggregatedData(aggregatedDataPerYear, aggregatedDataYearlyRef);
});

// Optional: Display real-time data on the web
function updateData(latestData, timestamp) {
    const { date, time } = formatTimestamp(timestamp);

    document.getElementById('voltage').textContent = latestData.Voltage ?? 'N/A';
    document.getElementById('currentPZEM').textContent = latestData.Current_PZEM ?? 'N/A';
    document.getElementById('power').textContent = latestData.power ?? 'N/A';
    document.getElementById('pf').textContent = latestData.pf ?? 'N/A';
    document.getElementById('currentSCT1').textContent = latestData.Current_SCT1 ?? 'N/A';
    document.getElementById('currentSCT2').textContent = latestData.Current_SCT2 ?? 'N/A';
    document.getElementById('energy').textContent = latestData.Energy ?? 'N/A';
    document.getElementById('cost').textContent = ((latestData.Energy ?? 0) * 1352).toFixed(2);
    document.getElementById('timestamp').textContent = date;
    document.getElementById('time').textContent = time;

    updateLoadStatus(parseFloat(latestData.Current_PZEM));
}


// Real-time data display from Firebase
dataRef.on('value', snapshot => {
    const data = snapshot.val();
    const latestTimestamp = Object.keys(data).sort().pop();
    const latestData = data[latestTimestamp];
    updateData(latestData, latestTimestamp);

    // Tambahan: Bandingkan energi real-time dengan rata-rata 3 bulan terakhir
    const realTimeEnergy = parseFloat(latestData.Energy || 0);

    // Ambil data 3 bulan terakhir dari node bulanan
    aggregatedDataMonthlyRef.once('value', snapshot => {
        const monthlyData = snapshot.val();
        const currentDate = new Date();
        const pastThreeMonths = [];

        for (let i = 1; i <= 3; i++) {
            const pastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const pastKey = `${pastDate.getFullYear()}-${(pastDate.getMonth() + 1).toString().padStart(2, '0')}`;
            if (monthlyData[pastKey]) {
                pastThreeMonths.push(monthlyData[pastKey].Total_Energy);
            }
        }

        // Hitung rata-rata energi 3 bulan terakhir
        if (pastThreeMonths.length > 0) {
            const averageEnergy = pastThreeMonths.reduce((a, b) => a + b, 0) / pastThreeMonths.length;

            // Kirim perintah berdasarkan perbandingan energi real-time dengan rata-rata
            const commandRef = database.ref('Command');
            if (realTimeEnergy > averageEnergy) {
                commandRef.set({ action: 'TURN_ON_LED', timestamp: new Date().toISOString() });
                console.log('Peringatan! Energi melebihi rata-rata 3 bulan terakhir.');
                // Tampilkan kotak peringatan baru
                document.getElementById('energyWarningBox').style.display = 'block';
                document.getElementById('energyWarningBox').textContent = 'Penggunaan Energi Telah Melebihi Rata-rata 3 Bulan Terakhir!!!!';
            } else if (realTimeEnergy < averageEnergy) {
                commandRef.set({ action: 'TURN_OFF_LED', timestamp: new Date().toISOString() });
                console.log('Energi di bawah rata-rata 3 bulan terakhir. LED dimatikan.');
                // Sembunyikan kotak peringatan baru jika energi di bawah rata-rata
                document.getElementById('energyWarningBox').style.display = 'none';
            }
        }
    });
});


// (HAPUS DATA DETIK) Cleanup old data from 'Data' node
function cleanupData() {
    dataRef.once('value', snapshot => {
        const data = snapshot.val();
        const currentTime = new Date();
        const updatedData = {};

        for (let timestamp in data) {
            const dataTime = new Date(timestamp.replace('_', 'T') + 'Z');
            if ((currentTime - dataTime) <= 120000) {
                updatedData[timestamp] = data[timestamp];
            }
        }

        dataRef.set(updatedData);
    });
}

setInterval(cleanupData, 120000);

// (HAPUS DATA MENIT) Cleanup old data from 'Aggregate per minute' if data is older than 2 days
function isDataOlderThanTwoDays(timestamp) {
    const currentDate = new Date();
    const dataDate = new Date(timestamp.split('_')[0]);
    const diffTime = currentDate - dataDate; // Difference in milliseconds
    const diffDays = diffTime / (1000 * 3600 * 24); // Convert to days
    return diffDays > 1;
}

// Function to delete old aggregated data per minute
function deleteOldAggregatedData() {
    aggregatedDataNewRef.once('value', snapshot => {
        const data = snapshot.val();
        for (let timestamp in data) {
            if (isDataOlderThanTwoDays(timestamp)) {
                aggregatedDataNewRef.child(timestamp).remove();
            }
        }
    });
}

// Schedule the deletion to run every day at 00:00
function scheduleDataDeletion() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // Set time to 00:00 next day

    const timeUntilMidnight = nextMidnight - now;
    setTimeout(() => {
        deleteOldAggregatedData();
        scheduleDataDeletion(); // Re-run the deletion function the next day
    }, timeUntilMidnight);
}

// Call this function to start the scheduled deletion
scheduleDataDeletion();

// (HAPUS DATA JAM) Helper function to check if the data is older than 7 days
function isDataOlderThanSevenDays(timestamp) {
    const currentDate = new Date();
    const dataDate = new Date(timestamp.split('_')[0]);
    const diffTime = currentDate - dataDate; // Difference in milliseconds
    const diffDays = diffTime / (1000 * 3600 * 24); // Convert to days
    return diffDays > 7; // Check if the data is older than 7 days
}

// Function to delete old aggregated data per hour (more than 7 days)
function deleteOldAggregatedDataPerHour() {
    aggregatedDataHourlyRef.once('value', snapshot => {
        const data = snapshot.val();
        for (let timestamp in data) {
            if (isDataOlderThanSevenDays(timestamp)) {
                aggregatedDataHourlyRef.child(timestamp).remove();
            }
        }
    });
}

// Schedule the deletion to run every day at midnight (00:00)
function scheduleHourlyDataDeletion() {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0); // Next day at midnight
    const timeUntilMidnight = nextMidnight - now;

    setTimeout(() => {
        deleteOldAggregatedDataPerHour(); // Delete old data
        scheduleHourlyDataDeletion(); // Re-run the deletion function every day at midnight
    }, timeUntilMidnight);
}

// Call this function to start the scheduled hourly data deletion
scheduleHourlyDataDeletion();

// (HAPUS HARI) Helper function to check if data is older than 3 months
function isDataOlderThanSixMonths(timestamp) {
    const currentDate = new Date();
    const dataDate = new Date(timestamp.split('_')[0]);
    const diffTime = currentDate - dataDate; // Difference in milliseconds
    const diffMonths = diffTime / (1000 * 3600 * 24 * 30); // Convert to months
    return diffMonths > 3;
}

// Function to delete old aggregated data per day (older than 3 months)
function deleteOldAggregatedDataPerDay() {
    aggregatedDataDailyRef.once('value', snapshot => {
        const data = snapshot.val();
        for (let timestamp in data) {
            if (isDataOlderThanSixMonths(timestamp)) {
                aggregatedDataDailyRef.child(timestamp).remove();
            }
        }
    });
}

// Schedule the deletion to run at the start of every month
function scheduleDailyDataDeletion() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0); // Next month at midnight
    const timeUntilNextMonth = nextMonth - now;

    setTimeout(() => {
        deleteOldAggregatedDataPerDay();
        scheduleDailyDataDeletion(); // Re-run the deletion function at the start of the next month
    }, timeUntilNextMonth);
}

// Call this function to start the scheduled daily data deletion
scheduleDailyDataDeletion();

// (HAPUS MINGGU) Helper function to get week number of the year
function getWeekNumber(date) {
    const currentDate = new Date(date.getTime());
    currentDate.setDate(currentDate.getDate() + (4 - (currentDate.getDay() || 7)));
    const yearStart = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate - yearStart) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + 1) / 7);
}

// Helper function to check if data is older than 1 month
function isDataOlderThanOneMonth(weekKey) {
    const currentDate = new Date();
    const currentWeek = getWeekNumber(currentDate);
    const weekNumber = parseInt(weekKey.split(' ')[1], 10);
    const weekDifference = currentWeek - weekNumber;
    return weekDifference > 4;
}

// Function to delete old aggregated data per week (older than 1 month)
function deleteOldAggregatedDataPerWeek() {
    aggregatedDataWeeklyRef.once('value', snapshot => {
        const data = snapshot.val();
        for (let weekKey in data) {
            if (isDataOlderThanOneMonth(weekKey)) {
                aggregatedDataWeeklyRef.child(weekKey).remove();
            }
        }
    });
}

// Schedule the deletion to run at the start of every year
function scheduleWeeklyDataDeletion() {
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0); // Next year at midnight
    const timeUntilNextYear = nextYear - now;

    setTimeout(() => {
        deleteOldAggregatedDataPerWeek();
        scheduleWeeklyDataDeletion(); // Re-run the deletion function at the start of the next year
    }, timeUntilNextYear);
}

// Call this function to start the scheduled weekly data deletion
scheduleWeeklyDataDeletion();
