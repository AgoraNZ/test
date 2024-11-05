<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dairy Shed Hygiene Checklist</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css">
    <style>
        body {
            background-color: #002B5C;
            color: #FFFFFF;
            font-family: Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            margin: 0;
        }

        .container {
            background-color: #002B5C;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            max-width: 800px;
            width: 100%;
        }

        h1,
        h2 {
            color: #a7ab01;
            text-align: center;
        }

        h1 {
            margin-bottom: 40px;
        }

        label {
            margin-top: 10px;
        }

        button {
            background-color: #FF851B;
            color: #FFFFFF;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            display: block;
            margin: 20px auto;
            border-radius: 5px;
        }

        button:hover {
            background-color: #FF4136;
        }

        .checklist-item {
            margin-bottom: 30px;
        }

        .form-control,
        .form-select {
            margin-top: 5px;
        }

        .version {
            text-align: center;
            margin-top: 20px;
            color: #FFFFFF;
            font-size: 12px;
        }

        .logo {
            display: block;
            margin: 0 auto 20px;
            width: 250px;
        }

        .record-container {
            background-color: #FFFFFF;
            color: #000000;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
            max-width: 1000px;
            width: 100%;
            margin: 20px auto;
        }

        .record-container h2 {
            color: #002B5C;
        }

        .record-list {
            max-height: 400px;
            overflow-y: auto;
        }

        .record-list a {
            text-decoration: none;
            color: #007bff;
            display: block;
            margin-bottom: 10px;
        }

        .back-button {
            margin-top: 20px;
            background-color: #002B5C;
            color: #FFFFFF;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
        }

        .search-container {
            margin-bottom: 20px;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js"></script>
</head>

<body>
    <div class="container" id="form-container">
        <img src="https://i.postimg.cc/htZPjx5g/logo-89.png" alt="Logo" class="logo">
        <h1>Dairy Shed Hygiene Checklist</h1>

        <form id="hygiene-checklist-form">
            <!-- Form Fields -->
            <div class="section mb-4">
                <h2>Farm Details</h2>
                <label for="dairy-number">Dairy Number:</label>
                <input type="text" class="form-control" id="dairy-number" name="dairy-number" onblur="fetchFarmDetails()">

                <!-- Additional fields -->
            </div>

            <!-- Checklist Items Section -->
            <div class="section mb-4">
                <h2>Checklist Items</h2>
                <div id="checklist-items"></div>
            </div>

            <!-- Temperature Measurements Section -->
            <div class="section mb-4">
                <h2>Temperature Measurements</h2>
                <div class="checklist-item">
                    <label for="hot-water-temp">Hot Water Temp (°C):</label>
                    <input type="number" class="form-control" id="hot-water-temp" name="hot-water-temp" step="0.1">
                    <label for="hot-water-time">Time Taken:</label>
                    <input type="time" class="form-control" id="hot-water-time" name="hot-water-time">
                </div>
                <div class="checklist-item">
                    <label for="milk-temp">Milk Temp (°C):</label>
                    <input type="number" class="form-control" id="milk-temp" name="milk-temp" step="0.1">
                    <label for="milk-time">Time Taken:</label>
                    <input type="time" class="form-control" id="milk-time" name="milk-time">
                </div>
            </div>

            <button type="button" onclick="generatePDF()">Generate PDF</button>
            <button type="button" onclick="viewRecords()">View All Records</button>
        </form>
        <div class="version">Version 5.3</div>
    </div>

    <!-- Records Viewing Page -->
    <div id="record-container" class="record-container" style="display: none;">
        <h2>All Dairy Shed Hygiene Records</h2>
        <div class="search-container">
            <input type="text" id="search-dairy-number" class="form-control" placeholder="Search by Dairy Number" oninput="filterRecords()">
        </div>
        <div id="record-list" class="record-list"></div>
        <button class="back-button" onclick="goBack()">Back to Checklist</button>
    </div>

    <script>
        // Firebase configuration and initialization
        const firebaseConfig = {
            apiKey: "API_KEY_HERE",
            authDomain: "PROJECT_ID.firebaseapp.com",
            projectId: "PROJECT_ID",
            storageBucket: "PROJECT_ID.appspot.com",
            messagingSenderId: "SENDER_ID",
            appId: "APP_ID"
        };
        firebase.initializeApp(firebaseConfig);
        const storage = firebase.storage();
        const firestore = firebase.firestore();

        // Fetch Farm Details Function
        async function fetchFarmDetails() {
            const dairyNumber = document.getElementById('dairy-number').value;
            if (dairyNumber) {
                try {
                    const storageRef = storage.ref(`farm_details/${dairyNumber}.json`);
                    const url = await storageRef.getDownloadURL();
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Failed to fetch farm details');
                    const data = await response.json();
                    if (data) {
                        document.getElementById('dairy-company').value = data.dairyCompany || '';
                        // Additional fields here
                    }
                } catch (error) {
                    console.error('Error fetching farm details:', error);
                }
            }
        }

        // Create Checklist Items
        function createChecklistItems() {
            const checklistItems = [
                // Add your checklist items here
            ];
            const checklistContainer = document.getElementById('checklist-items');
            checklistItems.forEach(item => {
                const itemContainer = document.createElement('div');
                itemContainer.classList.add('checklist-item');
                const label = document.createElement('label');
                label.textContent = item;
                itemContainer.appendChild(label);
                // Add inputs like select, comments, file inputs here
                checklistContainer.appendChild(itemContainer);
            });
        }

        // View Records Function
        function viewRecords() {
            // Your code here
        }

        // Generate PDF Function
        async function generatePDF() {
            // Your code for generating and saving PDF
        }

        document.addEventListener("DOMContentLoaded", () => {
            createChecklistItems();
        });
    </script>
</body>

</html>
