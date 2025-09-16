// Search Component for Boltin App
function Search() {
    return `
        <div class="search-container">
            <div class="container">
                <div class="search-section">
                    <h2 class="section-title">Check if a Gadget is Stolen</h2>
                    <p class="section-description">Enter a serial or IMEI number below to check if a gadget has been reported as stolen or lost.</p>
                    
                    <div class="card">
                        <div class="form-group">
                            <label for="search-serial">Enter Serial/IMEI Number:</label>
                            <input type="text" id="search-serial" name="searchSerial" placeholder="e.g., 123456789012345">
                            <button class="button secondary" onclick="searchGadget()">Check Status</button>
                        </div>
                        <div id="search-result" class="search-result"></div>
                    </div>
                    
                    <div class="search-info">
                        <h3>Status Guide</h3>
                        <div class="status-cards">
                            <div class="status-card registered">
                                <h4>Registered</h4>
                                <p>This gadget is registered in our system but has not been reported as lost or stolen.</p>
                            </div>
                            <div class="status-card flagged">
                                <h4>Lost/Flagged</h4>
                                <p>This gadget has been reported as lost or potentially stolen. Exercise caution.</p>
                            </div>
                            <div class="status-card not-found">
                                <h4>Not Found</h4>
                                <p>No record found for this serial/IMEI number. The gadget may not be registered.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function to search gadget by serial number
function searchGadget() {
    const serial = document.getElementById('search-serial').value;
    const resultDiv = document.getElementById('search-result');
    
    if (!serial) {
        alert('Please enter a serial/IMEI number');
        return;
    }
    
    // In a real app, this would call the backend API
    console.log(`Searching gadget with serial ${serial}`);
    
    // Mock response - in a real app, this would come from the API
    // For demonstration, we'll randomly return one of the three statuses
    const statuses = ['registered', 'flagged', 'not-found'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    resultDiv.innerHTML = '';
    
    let resultHTML = '<div class="search-result-card">
<h3>Search Result</h3>';
    
    if (randomStatus === 'registered') {
        resultHTML += `
            <p>Status: <strong>Registered</strong></p>
            <p>This gadget is registered in our system and has not been reported as lost or stolen.</p>
            <p><strong>Owner:</strong> John Doe</p>
            <p><strong>Device:</strong> iPhone 13</p>
        `;
    } else if (randomStatus === 'flagged') {
        resultHTML += `
            <p>Status: <strong>Lost/Flagged</strong></p>
            <p>This gadget has been reported as lost. Please contact the owner or authorities.</p>
            <p><strong>Reported Lost:</strong> November 15, 2024</p>
            <p><strong>Last Known Location:</strong> Lagos, Nigeria</p>
            <button class="button secondary" onclick="reportFoundGadget()">Report Found</button>
        `;
    } else {
        resultHTML += `
            <p>Status: <strong>Not Found</strong></p>
            <p>No record found for this serial/IMEI number. The gadget may not be registered in our system.</p>
            <p>We recommend checking with the seller for more information and verifying the device's history.</p>
        `;
    }
    
    resultHTML += '</div>';
    resultDiv.innerHTML = resultHTML;
}

// Function to report a found gadget
function reportFoundGadget() {
    const serial = document.getElementById('search-serial').value;
    
    if (!serial) {
        alert('Please search for a gadget first');
        return;
    }
    
    // In a real app, this would call the backend API to report the found gadget
    console.log(`Reporting found gadget with serial ${serial}`);
    
    alert('Thank you for reporting this gadget as found. Our team will contact the owner.');
}

// Load the search component
function loadSearch() {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = Search();
        
        // Add event listener to the search form
        const searchForm = document.getElementById('search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', searchGadget);
        }
    }
}

// Attach functions to window object so they can be accessed from HTML
window.Search = Search;
window.loadSearch = loadSearch;
window.searchGadget = searchGadget;
window.reportFoundGadget = reportFoundGadget;

// Initialize the search component when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadSearch();
});