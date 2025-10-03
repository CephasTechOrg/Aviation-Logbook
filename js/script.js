 // Flight entries array and current edit index
        let flights = [];
        let currentEditIndex = -1;
        let deleteIndex = -1;

        // DOM elements
        const flightForm = document.getElementById('flightForm');
        const submitBtn = document.getElementById('submitBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const newFlightBtn = document.getElementById('newFlightBtn');
        const flightsTableBody = document.getElementById('flightsTableBody');
        const flightsCardsContainer = document.getElementById('flightsCardsContainer');
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        const totalFlightsEl = document.getElementById('totalFlights');
        const totalHoursEl = document.getElementById('totalHours');
        const dayFlightsEl = document.getElementById('dayFlights');
        const nightFlightsEl = document.getElementById('nightFlights');
        const flightsChangeEl = document.getElementById('flightsChange');
        const hoursChangeEl = document.getElementById('hoursChange');
        const deleteModal = document.getElementById('deleteModal');
        const exportModal = document.getElementById('exportModal');
        const closeModalButtons = document.querySelectorAll('.close-modal');
        const cancelDeleteBtn = document.getElementById('cancelDelete');
        const confirmDeleteBtn = document.getElementById('confirmDelete');
        const cancelExportBtn = document.getElementById('cancelExport');
        const confirmExportBtn = document.getElementById('confirmExport');
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        const body = document.body;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            loadFlights();
            renderFlights();
            updateStatistics();
            initTheme();

            // Form submission
            flightForm.addEventListener('submit', handleFormSubmit);
            
            // Cancel edit
            cancelBtn.addEventListener('click', cancelEdit);
            
            // New flight button
            newFlightBtn.addEventListener('click', function() {
                cancelEdit();
                document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
            });
            
            // Search functionality
            searchInput.addEventListener('input', renderFlights);
            
            // Sort functionality
            sortSelect.addEventListener('change', renderFlights);
            
            // Theme toggle
            themeToggle.addEventListener('click', toggleTheme);
            
            // Modal events
            closeModalButtons.forEach(button => {
                button.addEventListener('click', function() {
                    deleteModal.style.display = 'none';
                    exportModal.style.display = 'none';
                });
            });
            
            cancelDeleteBtn.addEventListener('click', function() {
                deleteModal.style.display = 'none';
            });
            
            confirmDeleteBtn.addEventListener('click', function() {
                if (deleteIndex !== -1) {
                    flights.splice(deleteIndex, 1);
                    saveFlights();
                    renderFlights();
                    updateStatistics();
                    deleteModal.style.display = 'none';
                    
                    // If we're in edit mode and deleted the flight being edited, cancel edit
                    if (currentEditIndex === deleteIndex) {
                        cancelEdit();
                    } else if (currentEditIndex > deleteIndex) {
                        currentEditIndex--;
                    }
                }
            });
            
            // Export/Import events
            exportBtn.addEventListener('click', function() {
                exportModal.style.display = 'flex';
            });
            
            cancelExportBtn.addEventListener('click', function() {
                exportModal.style.display = 'none';
            });
            
            confirmExportBtn.addEventListener('click', function() {
                const format = document.getElementById('exportFormat').value;
                exportData(format);
                exportModal.style.display = 'none';
            });
            
            importBtn.addEventListener('click', function() {
                document.getElementById('importFile').click();
            });
            
            // Handle file import
            const importFileInput = document.createElement('input');
            importFileInput.type = 'file';
            importFileInput.id = 'importFile';
            importFileInput.accept = '.csv,.json';
            importFileInput.style.display = 'none';
            document.body.appendChild(importFileInput);
            
            importFileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        try {
                            const content = event.target.result;
                            let importedFlights = [];
                            
                            if (file.name.endsWith('.csv')) {
                                importedFlights = parseCSV(content);
                            } else if (file.name.endsWith('.json')) {
                                importedFlights = JSON.parse(content);
                            }
                            
                            if (Array.isArray(importedFlights) && importedFlights.length > 0) {
                                // Validate imported flights
                                const validFlights = importedFlights.filter(flight => 
                                    flight.date && flight.aircraftType && flight.departure && 
                                    flight.destination && flight.flightTime
                                );
                                
                                if (validFlights.length > 0) {
                                    flights = [...flights, ...validFlights];
                                    saveFlights();
                                    renderFlights();
                                    updateStatistics();
                                    alert(`Successfully imported ${validFlights.length} flight records.`);
                                } else {
                                    alert('No valid flight records found in the imported file.');
                                }
                            } else {
                                alert('Invalid file format. Please check the file and try again.');
                            }
                        } catch (error) {
                            alert('Error importing file: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
            });

            // Close modal when clicking outside
            window.addEventListener('click', function(event) {
                if (event.target === deleteModal) {
                    deleteModal.style.display = 'none';
                }
                if (event.target === exportModal) {
                    exportModal.style.display = 'none';
                }
            });
        });

        // Theme functions
        function initTheme() {
            const savedTheme = localStorage.getItem('skyLogProTheme') || 'light';
            setTheme(savedTheme);
        }

        function setTheme(theme) {
            body.setAttribute('data-theme', theme);
            localStorage.setItem('skyLogProTheme', theme);
            
            if (theme === 'dark') {
                themeIcon.className = 'fas fa-sun';
                themeToggle.setAttribute('title', 'Switch to light mode');
            } else {
                themeIcon.className = 'fas fa-moon';
                themeToggle.setAttribute('title', 'Switch to dark mode');
            }
        }

        function toggleTheme() {
            const currentTheme = body.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        }

        // Load flights from localStorage
        function loadFlights() {
            const storedFlights = localStorage.getItem('skyLogProFlights');
            if (storedFlights) {
                flights = JSON.parse(storedFlights);
            }
        }

        // Save flights to localStorage
        function saveFlights() {
            localStorage.setItem('skyLogProFlights', JSON.stringify(flights));
        }

        // Handle form submission
        function handleFormSubmit(e) {
            e.preventDefault();
            
            // Get form values
            const flight = {
                date: document.getElementById('date').value,
                aircraftType: document.getElementById('aircraftType').value,
                departure: document.getElementById('departure').value,
                destination: document.getElementById('destination').value,
                flightTime: parseFloat(document.getElementById('flightTime').value),
                dayNight: document.getElementById('dayNight').value,
                pilotRole: document.getElementById('pilotRole').value,
                remarks: document.getElementById('remarks').value,
                id: Date.now() // Unique identifier for each flight
            };
            
            // Validate flight time
            if (flight.flightTime <= 0) {
                alert('Flight time must be greater than 0');
                return;
            }
            
            if (currentEditIndex === -1) {
                // Add new flight
                flights.push(flight);
            } else {
                // Update existing flight
                flights[currentEditIndex] = flight;
                currentEditIndex = -1;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Flight';
                cancelBtn.classList.add('hidden');
            }
            
            // Save, render and update statistics
            saveFlights();
            renderFlights();
            updateStatistics();
            
            // Reset form
            flightForm.reset();
            
            // Show success message
            showNotification('Flight saved successfully!', 'success');
        }

        // Edit flight entry
        function editFlight(index) {
            const flight = flights[index];
            
            // Populate form with flight data
            document.getElementById('date').value = flight.date;
            document.getElementById('aircraftType').value = flight.aircraftType;
            document.getElementById('departure').value = flight.departure;
            document.getElementById('destination').value = flight.destination;
            document.getElementById('flightTime').value = flight.flightTime;
            document.getElementById('dayNight').value = flight.dayNight;
            document.getElementById('pilotRole').value = flight.pilotRole;
            document.getElementById('remarks').value = flight.remarks;
            
            // Set edit mode
            currentEditIndex = index;
            submitBtn.innerHTML = '<i class="fas fa-edit"></i> Update Flight';
            cancelBtn.classList.remove('hidden');
            
            // Scroll to form
            document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
        }

        // Cancel edit mode
        function cancelEdit() {
            currentEditIndex = -1;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Flight';
            cancelBtn.classList.add('hidden');
            flightForm.reset();
        }

        // Delete flight entry
        function deleteFlight(index) {
            deleteIndex = index;
            deleteModal.style.display = 'flex';
        }

        // Render flights in table and cards
        function renderFlights() {
            // Get search term and sort option
            const searchTerm = searchInput.value.toLowerCase();
            const sortOption = sortSelect.value;
            
            // Filter flights based on search term
            let filteredFlights = flights.filter(flight => 
                flight.aircraftType.toLowerCase().includes(searchTerm) ||
                flight.departure.toLowerCase().includes(searchTerm) ||
                flight.destination.toLowerCase().includes(searchTerm) ||
                flight.remarks.toLowerCase().includes(searchTerm)
            );
            
            // Sort flights based on sort option
            filteredFlights.sort((a, b) => {
                switch(sortOption) {
                    case 'date-desc':
                        return new Date(b.date) - new Date(a.date);
                    case 'date-asc':
                        return new Date(a.date) - new Date(b.date);
                    case 'time-desc':
                        return b.flightTime - a.flightTime;
                    case 'time-asc':
                        return a.flightTime - b.flightTime;
                    default:
                        return 0;
                }
            });
            
            // Clear table and cards
            flightsTableBody.innerHTML = '';
            flightsCardsContainer.innerHTML = '';
            
            if (filteredFlights.length === 0) {
                const noResults = document.createElement('tr');
                noResults.innerHTML = `
                    <td colspan="8" class="text-center" style="padding: 2rem;">
                        <i class="fas fa-inbox" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                        <p>No flight records found. Add your first flight to get started!</p>
                    </td>
                `;
                flightsTableBody.appendChild(noResults);
                
                const noResultsCard = document.createElement('div');
                noResultsCard.className = 'text-center';
                noResultsCard.style.gridColumn = '1 / -1';
                noResultsCard.style.padding = '3rem 1rem';
                noResultsCard.innerHTML = `
                    <i class="fas fa-inbox" style="font-size: 3rem; color: var(--gray-400); margin-bottom: 1rem;"></i>
                    <p>No flight records found. Add your first flight to get started!</p>
                `;
                flightsCardsContainer.appendChild(noResultsCard);
                return;
            }
            
            // Render table rows
            filteredFlights.forEach((flight, index) => {
                const originalIndex = flights.findIndex(f => f.id === flight.id);
                const row = document.createElement('tr');
                row.className = 'fade-in';
                
                row.innerHTML = `
                    <td>${formatDate(flight.date)}</td>
                    <td>${flight.aircraftType}</td>
                    <td>${flight.departure} → ${flight.destination}</td>
                    <td>${flight.flightTime.toFixed(1)}</td>
                    <td>${flight.dayNight}</td>
                    <td>${flight.pilotRole}</td>
                    <td>${flight.remarks || '-'}</td>
                    <td class="actions">
                        <button class="btn btn-edit btn-sm" onclick="editFlight(${originalIndex})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-delete btn-sm" onclick="deleteFlight(${originalIndex})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                flightsTableBody.appendChild(row);
            });
            
            // Render cards for mobile view
            filteredFlights.forEach((flight, index) => {
                const originalIndex = flights.findIndex(f => f.id === flight.id);
                const card = document.createElement('div');
                card.className = 'flight-card fade-in';
                
                card.innerHTML = `
                    <div class="card-header">
                        <div class="card-date">${formatDate(flight.date)}</div>
                        <div class="card-role">${flight.pilotRole}</div>
                    </div>
                    <div class="card-route">
                        <i class="fas fa-route"></i> ${flight.departure} → ${flight.destination}
                    </div>
                    <div class="card-details">
                        <div class="card-detail">
                            <span class="card-detail-label">Aircraft:</span> ${flight.aircraftType}
                        </div>
                        <div class="card-detail">
                            <span class="card-detail-label">Time:</span> ${flight.flightTime.toFixed(1)}h
                        </div>
                        <div class="card-detail">
                            <span class="card-detail-label">Day/Night:</span> ${flight.dayNight}
                        </div>
                        <div class="card-detail">
                            <span class="card-detail-label">Role:</span> ${flight.pilotRole}
                        </div>
                    </div>
                    ${flight.remarks ? `<div class="card-remarks">${flight.remarks}</div>` : ''}
                    <div class="card-actions">
                        <button class="btn btn-edit btn-sm" onclick="editFlight(${originalIndex})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-delete btn-sm" onclick="deleteFlight(${originalIndex})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                
                flightsCardsContainer.appendChild(card);
            });
        }

        // Update statistics
        function updateStatistics() {
            const totalFlights = flights.length;
            const totalHours = flights.reduce((sum, flight) => sum + flight.flightTime, 0);
            const dayFlights = flights.filter(flight => flight.dayNight === 'Day').length;
            const nightFlights = flights.filter(flight => flight.dayNight === 'Night').length;
            
            // Calculate changes (simulated for demo)
            const flightsChange = totalFlights > 0 ? Math.min(25, Math.floor(Math.random() * 30)) : 0;
            const hoursChange = totalHours > 0 ? Math.min(20, Math.floor(Math.random() * 25)) : 0;
            
            totalFlightsEl.textContent = totalFlights;
            totalHoursEl.textContent = totalHours.toFixed(1);
            dayFlightsEl.textContent = dayFlights;
            nightFlightsEl.textContent = nightFlights;
            flightsChangeEl.textContent = `${flightsChange}%`;
            hoursChangeEl.textContent = `${hoursChange}%`;
        }

        // Format date for display
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }

        // Show notification
        function showNotification(message, type = 'info') {
            // Remove existing notification
            const existingNotification = document.querySelector('.notification');
            if (existingNotification) {
                existingNotification.remove();
            }
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius);
                color: white;
                font-weight: 600;
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            
            if (type === 'success') {
                notification.style.background = 'var(--success)';
            } else if (type === 'error') {
                notification.style.background = 'var(--danger)';
            } else {
                notification.style.background = 'var(--accent)';
            }
            
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                ${message}
            `;
            
            document.body.appendChild(notification);
            
            // Auto remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.remove();
                        }
                    }, 300);
                }
            }, 3000);
        }

        // Export data
        function exportData(format) {
            let data, mimeType, filename;
            
            if (format === 'csv') {
                data = convertToCSV(flights);
                mimeType = 'text/csv';
                filename = 'flight-log.csv';
            } else {
                data = JSON.stringify(flights, null, 2);
                mimeType = 'application/json';
                filename = 'flight-log.json';
            }
            
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('Data exported successfully!', 'success');
        }

        // Convert flights to CSV
        function convertToCSV(flights) {
            if (flights.length === 0) return '';
            
            const headers = ['Date', 'Aircraft Type', 'Departure', 'Destination', 'Flight Time', 'Day/Night', 'Pilot Role', 'Remarks'];
            const rows = flights.map(flight => [
                flight.date,
                `"${flight.aircraftType}"`,
                flight.departure,
                flight.destination,
                flight.flightTime,
                flight.dayNight,
                flight.pilotRole,
                `"${flight.remarks || ''}"`
            ]);
            
            return [headers, ...rows].map(row => row.join(',')).join('\n');
        }

        // Parse CSV to flights
        function parseCSV(csv) {
            const lines = csv.split('\n');
            const result = [];
            
            // Skip header row
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Simple CSV parsing (doesn't handle commas in quotes perfectly)
                const values = line.split(',');
                if (values.length >= 7) {
                    result.push({
                        date: values[0],
                        aircraftType: values[1].replace(/"/g, ''),
                        departure: values[2],
                        destination: values[3],
                        flightTime: parseFloat(values[4]),
                        dayNight: values[5],
                        pilotRole: values[6],
                        remarks: values[7] ? values[7].replace(/"/g, '') : ''
                    });
                }
            }
            
            return result;
        }

        // Add CSS for notifications
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);