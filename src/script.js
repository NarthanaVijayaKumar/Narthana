// ---------- REGISTER VISITOR ----------

document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const gatePassBtn = document.getElementById("generateGatePassBtn");
    const profileIcon = document.getElementById("profileIcon");
    const profileDropdown = document.getElementById("profileDropdown");
    const profileUsername = document.getElementById("profileUsername");
    const logoutBtn = document.getElementById("logoutBtn");
    const visitorNameInput = document.getElementById("visitorNameInput");
    const checkVisitorNameInput = document.getElementById("checkVisitorName");
    const checkStatusDateInput = document.getElementById("checkStatusDate");
    const checkStatusTimeInput = document.getElementById("checkStatusTime");
    const checkInBtn = document.getElementById("checkInBtn");
    const checkOutBtn = document.getElementById("checkOutBtn");
    const gatePassOutput = document.getElementById("gatePassOutput");
    const visitDateInput = document.getElementById("date");
    const loginRoleInput = document.getElementById("loginRole");
    const roleButtons = document.querySelectorAll(".role-btn");
    const visitTimeInput = document.getElementById("time");
    const gatePassActions = document.getElementById("gatePassActions");
    const printGatePassBtn = document.getElementById("printGatePassBtn");
    const downloadGatePassBtn = document.getElementById("downloadGatePassBtn");

    function updateVisitTimeConstraint() {
        if (!visitDateInput || !visitTimeInput) {
            return;
        }

        let today = new Date();
        let todayString = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");

        if (visitDateInput.value === todayString) {
            let currentHours = String(today.getHours()).padStart(2, "0");
            let currentMinutes = String(today.getMinutes()).padStart(2, "0");
            visitTimeInput.min = currentHours + ":" + currentMinutes;

            if (visitTimeInput.value && visitTimeInput.value < visitTimeInput.min) {
                visitTimeInput.value = visitTimeInput.min;
            }
        } else {
            visitTimeInput.removeAttribute("min");
        }
    }

    function setDefaultVisitDateTime() {
        let today = new Date();
        let yyyy = today.getFullYear();
        let mm = String(today.getMonth() + 1).padStart(2, "0");
        let dd = String(today.getDate()).padStart(2, "0");
        let hours = String(today.getHours()).padStart(2, "0");
        let minutes = String(today.getMinutes()).padStart(2, "0");

        if (visitDateInput) {
            visitDateInput.value = yyyy + "-" + mm + "-" + dd;
            visitDateInput.min = yyyy + "-" + mm + "-" + dd;
            visitDateInput.addEventListener("change", updateVisitTimeConstraint);
        }

        if (visitTimeInput) {
            visitTimeInput.value = hours + ":" + minutes;
            visitTimeInput.addEventListener("change", updateVisitTimeConstraint);
        }
    }

    const API_BASE = "/api";

    async function apiRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                "Content-Type": "application/json"
            }
        };

        const response = await fetch(API_BASE + endpoint, { ...defaultOptions, ...options });
        const data = await response.json().catch(function () {
            return {};
        });

        if (!response.ok) {
            throw new Error(data.message || "Request failed");
        }

        return data;
    }

    function getStoredUsers() {
        return JSON.parse(localStorage.getItem("users")) || [];
    }

    async function loadVisitorsFromServer() {
        try {
            const data = await apiRequest("/visitors");
            const visitors = Array.isArray(data) ? data : [];
            localStorage.setItem("visitors", JSON.stringify(visitors));
            localStorage.setItem("visitorUpdateStamp", Date.now().toString());
            return visitors;
        } catch (error) {
            console.warn("Falling back to local storage", error);
            return JSON.parse(localStorage.getItem("visitors")) || [];
        }
    }

    async function saveVisitorsToStorage(visitors) {
        localStorage.setItem("visitors", JSON.stringify(visitors));
        localStorage.setItem("visitorUpdateStamp", Date.now().toString());
        window.dispatchEvent(new CustomEvent("visitorsUpdated"));
        window.dispatchEvent(new Event("storage"));

        if (typeof renderVisitorTable === "function") {
            renderVisitorTable();
        }

        if (typeof renderReports === "function") {
            renderReports();
        }
    }

    async function syncVisitorToServer(visitor, method) {
        const endpoint = method === "PUT" ? "/visitors/" + visitor.id : "/visitors";
        return apiRequest(endpoint, {
            method: method,
            body: JSON.stringify(visitor)
        });
    }

    function bindRoleButtons() {
        const allRoleButtons = document.querySelectorAll(".role-btn");
        allRoleButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                allRoleButtons.forEach(function (item) {
                    item.classList.remove("active");
                    item.setAttribute("aria-pressed", "false");
                });
                button.classList.add("active");
                button.setAttribute("aria-pressed", "true");

                const selectedRole = button.getAttribute("data-role");
                if (loginRoleInput) {
                    loginRoleInput.value = selectedRole;
                }
            });
        });
    }

    function printGeneratedGatePass() {
        if (!gatePassOutput) {
            return;
        }

        const printWindow = window.open("", "_blank", "width=800,height=900");
        if (!printWindow) {
            window.print();
            return;
        }

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Visitor Gate Pass</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 24px;
                        background: #fff;
                        color: #0d47a1;
                    }
                    .gate-pass-card {
                        border: 2px solid #1565c0;
                        border-radius: 12px;
                        padding: 24px;
                        background: #f5f9ff;
                    }
                    .gate-pass-header {
                        font-size: 22px;
                        font-weight: bold;
                        margin-bottom: 12px;
                    }
                    .gate-pass-body p {
                        margin: 8px 0;
                    }
                    .gate-pass-footer {
                        margin-top: 14px;
                        font-size: 13px;
                        color: #555;
                    }
                </style>
            </head>
            <body>
                <div class="gate-pass-card">${gatePassOutput.innerHTML}</div>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(function () {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    bindRoleButtons();

    function getVisitorsFromStorage() {
        return JSON.parse(localStorage.getItem("visitors")) || [];
    }

    function formatVisitorDateTime(value, fallback) {
        if (!value) {
            return fallback || "-";
        }

        const parsedDate = new Date(value);
        if (Number.isNaN(parsedDate.getTime())) {
            return value;
        }

        return parsedDate.toLocaleString();
    }

    function getCheckInDisplayValue(visitor) {
        if (visitor.checkInDisplay) {
            return visitor.checkInDisplay;
        }

        const fallbackValue = [visitor.checkInDate, visitor.checkInTime].filter(Boolean).join(" ");
        return formatVisitorDateTime(visitor.checkInDateTime, fallbackValue || "-");
    }

    function getCheckOutDisplayValue(visitor) {
        if (visitor.checkOutDisplay) {
            return visitor.checkOutDisplay;
        }

        const fallbackValue = [visitor.checkOutDate, visitor.checkOutTime].filter(Boolean).join(" ");
        return formatVisitorDateTime(visitor.checkOutDateTime, fallbackValue || "-");
    }

    function renderVisitorTable() {
        const table = document.getElementById("visitorData");
        if (!table) {
            return;
        }

        const visitors = getVisitorsFromStorage();
        table.innerHTML = "";

        visitors.forEach(function (visitor) {
            let row = table.insertRow();
            row.insertCell(0).textContent = visitor.name || "-";
            row.insertCell(1).textContent = visitor.mobile || "-";
            row.insertCell(2).textContent = visitor.purpose || "-";
            row.insertCell(3).textContent = visitor.person || "-";
            row.insertCell(4).textContent = visitor.date || "-";
            row.insertCell(5).textContent = visitor.time || "-";
            row.insertCell(6).textContent = visitor.status ? visitor.status.replace("-", " ") : "Pending";
            row.insertCell(7).textContent = getCheckInDisplayValue(visitor);
            row.insertCell(8).textContent = getCheckOutDisplayValue(visitor);
        });
    }

    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener("click", function () {
            if (profileDropdown.style.display === "block") {
                profileDropdown.style.display = "none";
            } else {
                profileDropdown.style.display = "block";
            }
        });
    }

    if (profileUsername) {
        let loggedInUser = localStorage.getItem("loggedInUser") || "Guest";
        profileUsername.textContent = loggedInUser;
    }

    function applyRoleBasedAccess() {
        const role = localStorage.getItem("loggedInRole") || "staff";
        const menu = document.getElementById("dashboardMenu");
        if (!menu) {
            return;
        }

        const staffOnlyItems = ["recordsMenuItem", "gatePassMenuItem", "checkStatusMenuItem", "reportsMenuItem"];
        staffOnlyItems.forEach(function (itemId) {
            const item = document.getElementById(itemId);
            if (item) {
                item.style.display = role === "staff" ? "block" : "none";
            }
        });

        const headerText = document.querySelector(".header p");
        if (headerText) {
            headerText.textContent = role === "student" ? "Welcome, Student 👋" : "Welcome, Security Staff 👋";
        }
    }

    applyRoleBasedAccess();

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
        });
    }

    function saveUsers(users) {
        localStorage.setItem("users", JSON.stringify(users));
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            let username = document.getElementById("loginUsername").value.trim();
            let password = document.getElementById("loginPassword").value;
            let role = document.getElementById("loginRole") ? document.getElementById("loginRole").value : "staff";
            if (!role || (role !== "student" && role !== "staff")) {
                alert("Please select Student or Staff before logging in.");
                return;
            }

            try {
                await apiRequest("/users/login", {
                    method: "POST",
                    body: JSON.stringify({ username: username, password: password, role: role })
                });

                localStorage.setItem("loggedInUser", username);
                localStorage.setItem("loggedInRole", role);
                window.location.href = "dashboard.html";
            } catch (error) {
                alert(error.message || "Invalid username, password, or selected role.");
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            let username = document.getElementById("registerUsername").value.trim();
            let password = document.getElementById("registerPassword").value;
            let institutionId = document.getElementById("institutionId") ? document.getElementById("institutionId").value.trim() : "";
            let accountRole = document.getElementById("accountRole") ? document.getElementById("accountRole").value : "staff";

            if (!username || !password) {
                alert("Please enter both username and password.");
                return;
            }

            if (!institutionId) {
                alert("Institution ID is required to create an account.");
                return;
            }

            if (institutionId.toUpperCase() !== "JJCET") {
                alert("Access denied. The provided access code is invalid.");
                return;
            }

            try {
                await apiRequest("/users/register", {
                    method: "POST",
                    body: JSON.stringify({ username: username, password: password, institutionId: institutionId, role: accountRole })
                });

                alert("Registration successful. You can now log in.");
                registerForm.reset();
                window.location.href = "login.html";
            } catch (error) {
                alert(error.message || "Registration failed.");
            }
        });
    }

    setDefaultVisitDateTime();
    updateVisitTimeConstraint();

    function getVisitorByName(name) {
        let visitors = JSON.parse(localStorage.getItem("visitors")) || [];
        return visitors.find(function (visitor) {
            return visitor.name && visitor.name.toLowerCase().includes(name.toLowerCase());
        });
    }

    function setDefaultCheckStatusDateTime() {
        if (!checkStatusDateInput || !checkStatusTimeInput) {
            return;
        }

        let now = new Date();
        let yyyy = now.getFullYear();
        let mm = String(now.getMonth() + 1).padStart(2, "0");
        let dd = String(now.getDate()).padStart(2, "0");
        let hours = String(now.getHours()).padStart(2, "0");
        let minutes = String(now.getMinutes()).padStart(2, "0");

        checkStatusDateInput.value = yyyy + "-" + mm + "-" + dd;
        checkStatusTimeInput.value = hours + ":" + minutes;
    }

    function updateStatusSummary() {
        let visitors = JSON.parse(localStorage.getItem("visitors")) || [];
        let today = new Date();
        let todayString = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");

        let todaysVisitorsCount = visitors.filter(function (visitor) {
            return visitor.date === todayString;
        }).length;

        let insideCount = visitors.filter(function (visitor) {
            return visitor.status === "checked-in";
        }).length;

        let checkedOutCount = visitors.filter(function (visitor) {
            return visitor.status === "checked-out";
        }).length;

        let todayVisitorsCard = document.querySelector(".summary .card:nth-child(1) h2");
        let insideCampusCard = document.querySelector(".summary .card:nth-child(2) h2");
        let checkedOutCard = document.querySelector(".summary .card:nth-child(3) h2");
        let pendingCard = document.querySelector(".summary .card:nth-child(4) h2");

        if (todayVisitorsCard) {
            todayVisitorsCard.textContent = String(todaysVisitorsCount).padStart(2, "0");
        }

        if (insideCampusCard) {
            insideCampusCard.textContent = String(insideCount).padStart(2, "0");
        }

        if (checkedOutCard) {
            checkedOutCard.textContent = String(checkedOutCount).padStart(2, "0");
        }

        if (pendingCard) {
            let pendingCount = visitors.filter(function (visitor) {
                return visitor.status === "pending";
            }).length;
            pendingCard.textContent = String(pendingCount).padStart(2, "0");
        }
    }

    if (gatePassBtn && gatePassOutput) {

        gatePassBtn.addEventListener("click", function () {

            let visitors = JSON.parse(localStorage.getItem("visitors")) || [];
            let searchName = visitorNameInput ? visitorNameInput.value.trim().toLowerCase() : "";

            if (!searchName) {
                gatePassOutput.innerHTML = "<p>Please enter a visitor name first.</p>";
                gatePassOutput.style.display = "block";
                gatePassActions.style.display = "none";
                return;
            }

            let visitor = visitors.find(function (existingVisitor) {
                return existingVisitor.name && existingVisitor.name.toLowerCase().includes(searchName);
            });

            if (!visitor) {
                gatePassOutput.innerHTML = "<p>No matching visitor found. Please check the name and try again.</p>";
                gatePassOutput.style.display = "block";
                gatePassActions.style.display = "none";
                return;
            }

            let gatePass = {
                id: "GP-" + Date.now().toString().slice(-6),
                issuedAt: new Date().toLocaleString(),
                name: visitor.name,
                mobile: visitor.mobile,
                purpose: visitor.purpose,
                person: visitor.person,
                date: visitor.date,
                time: visitor.time
            };

            localStorage.setItem("generatedGatePass", JSON.stringify(gatePass));

            gatePassOutput.innerHTML = `
                <div class="gate-pass-header">Visitor Gate Pass</div>
                <div class="gate-pass-body">
                    <p><strong>Pass ID:</strong> ${gatePass.id}</p>
                    <p><strong>Visitor Name:</strong> ${gatePass.name}</p>
                    <p><strong>Mobile:</strong> ${gatePass.mobile}</p>
                    <p><strong>Purpose:</strong> ${gatePass.purpose}</p>
                    <p><strong>Person to Meet:</strong> ${gatePass.person}</p>
                    <p><strong>Date:</strong> ${gatePass.date}</p>
                    <p><strong>Time In:</strong> ${gatePass.time}</p>
                </div>
                <div class="gate-pass-footer">Generated on ${gatePass.issuedAt}</div>
            `;
            gatePassOutput.style.display = "block";
            gatePassActions.style.display = "flex";

            if (printGatePassBtn) {
                printGatePassBtn.onclick = function () {
                    printGeneratedGatePass();
                };
            }

            if (downloadGatePassBtn) {
                downloadGatePassBtn.onclick = function () {
                    let content = gatePassOutput.innerHTML;
                    let blob = new Blob([`<html><body style="font-family:Arial;padding:20px;">${content}</body></html>`], { type: "text/html" });
                    let url = URL.createObjectURL(blob);
                    let link = document.createElement("a");
                    link.href = url;
                    link.download = "gate-pass.html";
                    link.click();
                    URL.revokeObjectURL(url);
                };
            }
        });
    }

    setDefaultCheckStatusDateTime();

    window.addEventListener("visitorsUpdated", function () {
        updateStatusSummary();
        renderReports();
        renderVisitorTable();
    });

    window.addEventListener("storage", function (event) {
        if (event.key === "visitors") {
            updateStatusSummary();
            renderReports();
            renderVisitorTable();
        }
    });

    if (checkInBtn && checkVisitorNameInput) {
        checkInBtn.addEventListener("click", async function () {
            let name = checkVisitorNameInput.value.trim();
            if (!name) {
                alert("Please enter a visitor name.");
                return;
            }

            let visitors = JSON.parse(localStorage.getItem("visitors")) || [];
            let visitor = visitors.find(function (item) {
                return item.name && item.name.toLowerCase().includes(name.toLowerCase());
            });

            if (!visitor) {
                alert("Visitor not found.");
                return;
            }

            if (visitor.status === "checked-in") {
                alert("This visitor is already checked in.");
                return;
            }

            if (visitor.status === "checked-out") {
                alert("This visitor has already checked out. Please register a new visit if needed.");
                return;
            }

            let selectedDate = checkStatusDateInput ? checkStatusDateInput.value : "";
            let selectedTime = checkStatusTimeInput ? checkStatusTimeInput.value : "";

            visitor.status = "checked-in";
            visitor.checkInDateTime = selectedDate && selectedTime ? new Date(selectedDate + "T" + selectedTime).toISOString() : new Date().toISOString();
            visitor.checkInTime = selectedTime || new Date().toLocaleTimeString();
            visitor.checkInDate = selectedDate || new Date().toLocaleDateString();
            visitor.checkInDisplay = `${visitor.checkInDate} ${visitor.checkInTime}`;

            try {
                await syncVisitorToServer(visitor, "PUT");
                await saveVisitorsToStorage(visitors);
                alert("Visitor checked in successfully.");
                checkVisitorNameInput.value = "";
            } catch (error) {
                alert(error.message || "Unable to update visitor status.");
            }
        });
    }

    if (checkOutBtn && checkVisitorNameInput) {
        checkOutBtn.addEventListener("click", async function () {
            let name = checkVisitorNameInput.value.trim();
            if (!name) {
                alert("Please enter a visitor name.");
                return;
            }

            let visitors = JSON.parse(localStorage.getItem("visitors")) || [];
            let visitor = visitors.find(function (item) {
                return item.name && item.name.toLowerCase().includes(name.toLowerCase());
            });

            if (!visitor) {
                alert("Visitor not found.");
                return;
            }

            if (visitor.status !== "checked-in") {
                alert("This visitor must be checked in before they can be checked out.");
                return;
            }

            let selectedDate = checkStatusDateInput ? checkStatusDateInput.value : "";
            let selectedTime = checkStatusTimeInput ? checkStatusTimeInput.value : "";

            visitor.status = "checked-out";
            visitor.checkOutDateTime = selectedDate && selectedTime ? new Date(selectedDate + "T" + selectedTime).toISOString() : new Date().toISOString();
            visitor.checkOutTime = selectedTime || new Date().toLocaleTimeString();
            visitor.checkOutDate = selectedDate || new Date().toLocaleDateString();
            visitor.checkOutDisplay = `${visitor.checkOutDate} ${visitor.checkOutTime}`;

            try {
                await syncVisitorToServer(visitor, "PUT");
                await saveVisitorsToStorage(visitors);
                alert("Visitor checked out successfully.");
                checkVisitorNameInput.value = "";
            } catch (error) {
                alert(error.message || "Unable to update visitor status.");
            }
        });
    }

    function renderReports() {
        let visitors = JSON.parse(localStorage.getItem("visitors")) || [];
        let tableBody = document.getElementById("reportsTableBody");
        let statusFilter = document.getElementById("statusReportFilter");
        let dateFilter = document.getElementById("dateReportFilter");
        let clearFiltersBtn = document.getElementById("clearReportFiltersBtn");

        if (!tableBody) {
            return;
        }

        let filteredVisitors = visitors.filter(function (visitor) {
            let matchesStatus = true;
            let matchesDate = true;

            if (statusFilter && statusFilter.value !== "all") {
                matchesStatus = visitor.status === statusFilter.value;
            }

            if (dateFilter && dateFilter.value) {
                matchesDate = visitor.date === dateFilter.value;
            }

            return matchesStatus && matchesDate;
        });

        tableBody.innerHTML = "";

        filteredVisitors.forEach(function (visitor) {
            let row = tableBody.insertRow();
            row.insertCell(0).textContent = visitor.name || "-";
            row.insertCell(1).textContent = visitor.mobile || "-";
            row.insertCell(2).textContent = visitor.email || "-";
            row.insertCell(3).textContent = visitor.purpose || "-";
            row.insertCell(4).textContent = visitor.person || "-";
            row.insertCell(5).textContent = visitor.date || "-";
            row.insertCell(6).textContent = visitor.time || "-";
            row.insertCell(7).textContent = visitor.status ? visitor.status.replace("-", " ") : "Pending";
            row.insertCell(8).textContent = getCheckInDisplayValue(visitor);
            row.insertCell(9).textContent = getCheckOutDisplayValue(visitor);
        });

        let totalVisitorsCount = document.getElementById("totalVisitorsCount");
        let todayVisitorsCount = document.getElementById("todayVisitorsCount");
        let checkedInCount = document.getElementById("checkedInCount");
        let checkedOutCount = document.getElementById("checkedOutCount");
        let pendingBar = document.getElementById("pendingBar");
        let checkedInBar = document.getElementById("checkedInBar");
        let checkedOutBar = document.getElementById("checkedOutBar");
        let pendingBarValue = document.getElementById("pendingBarValue");
        let checkedInBarValue = document.getElementById("checkedInBarValue");
        let checkedOutBarValue = document.getElementById("checkedOutBarValue");
        let recentActivityList = document.getElementById("recentActivityList");
        let today = new Date();
        let todayString = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
        let totalCount = visitors.length;
        let pendingCount = visitors.filter(function (visitor) {
            return visitor.status === "pending";
        }).length;
        let checkedIn = visitors.filter(function (visitor) {
            return visitor.status === "checked-in";
        }).length;
        let checkedOut = visitors.filter(function (visitor) {
            return visitor.status === "checked-out";
        }).length;
        let todaysVisitors = visitors.filter(function (visitor) {
            return visitor.date === todayString;
        }).length;

        if (totalVisitorsCount) {
            totalVisitorsCount.textContent = String(totalCount).padStart(2, "0");
        }

        if (todayVisitorsCount) {
            todayVisitorsCount.textContent = String(todaysVisitors).padStart(2, "0");
        }

        if (checkedInCount) {
            checkedInCount.textContent = String(checkedIn).padStart(2, "0");
        }

        if (checkedOutCount) {
            checkedOutCount.textContent = String(checkedOut).padStart(2, "0");
        }

        function updateBar(barElement, barValueElement, count) {
            if (!barElement || !barValueElement) {
                return;
            }
            let percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            barElement.style.width = percent + "%";
            barValueElement.textContent = percent + "%";
        }

        updateBar(pendingBar, pendingBarValue, pendingCount);
        updateBar(checkedInBar, checkedInBarValue, checkedIn);
        updateBar(checkedOutBar, checkedOutBarValue, checkedOut);

        if (recentActivityList) {
            recentActivityList.innerHTML = "";
            let recentVisitors = visitors.slice().sort(function (a, b) {
                let aValue = a.checkInDateTime || a.checkOutDateTime || a.date || "";
                let bValue = b.checkInDateTime || b.checkOutDateTime || b.date || "";
                return bValue.localeCompare(aValue);
            }).slice(0, 5);

            recentVisitors.forEach(function (visitor) {
                let statusText = visitor.status ? visitor.status.replace("-", " ") : "Pending";
                let statusClass = visitor.status || "pending";
                let item = document.createElement("li");
                item.innerHTML = `<strong>${visitor.name || "Unnamed Visitor"}</strong>${visitor.purpose || "Visit"} • ${visitor.date || "-"}<br><span class="activity-chip ${statusClass}">${statusText}</span>`;
                recentActivityList.appendChild(item);
            });

            if (!recentVisitors.length) {
                recentActivityList.innerHTML = "<li>No activity yet.</li>";
            }
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.onclick = function () {
                if (statusFilter) {
                    statusFilter.value = "all";
                }
                if (dateFilter) {
                    dateFilter.value = "";
                }
                renderReports();
            };
        }

        if (statusFilter) {
            statusFilter.onchange = renderReports;
        }

        if (dateFilter) {
            dateFilter.onchange = renderReports;
        }
    }

    if (document.getElementById("reportsTableBody")) {
        renderReports();
    }

    let form = document.getElementById("visitorForm");

    if (form) {

        if (form.dataset.bound === "true") {
            return;
        }

        form.addEventListener("submit", async function (event) {

            event.preventDefault();

            let emailValue = document.getElementById("email").value.trim();
            let emailPattern = /^[^\s@]+@[^\s@]+\.com$/i;

            if (!emailValue) {
                alert("Please enter an email address.");
                return;
            }

            if (!emailPattern.test(emailValue)) {
                alert("Please enter a valid email address.");
                return;
            }

            let dateValue = document.getElementById("date").value;
            let timeValue = document.getElementById("time").value;
            let now = new Date();
            let selectedDateTime = new Date(dateValue + "T" + (timeValue || "00:00") + ":00");
            let currentDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());

            if (!dateValue) {
                alert("Please select a visit date.");
                return;
            }

            if (!timeValue) {
                alert("Please select a visit time.");
                return;
            }

            if (selectedDateTime < currentDateTime) {
                alert("Date and Time must be greater than or equal to the current system date and time.");
                return;
            }

            let visitor = {
                name: document.getElementById("visitorName").value.trim(),
                mobile: document.getElementById("mobile").value.trim(),
                email: emailValue,
                purpose: document.getElementById("purpose").value.trim(),
                person: document.getElementById("person").value.trim(),
                date: dateValue,
                time: timeValue,
                status: "pending"
            };

            let visitors = JSON.parse(localStorage.getItem("visitors")) || [];

            let duplicate = visitors.some(function (existingVisitor) {
                return (
                    existingVisitor.email &&
                    visitor.email &&
                    existingVisitor.email.toLowerCase() === visitor.email.toLowerCase()
                );
            });

            if (duplicate) {
                alert("This visitor record already exists.");
                return;
            }

            try {
                const result = await apiRequest("/visitors", {
                    method: "POST",
                    body: JSON.stringify(visitor)
                });

                const savedVisitor = (result && result.visitor) ? result.visitor : { id: Date.now().toString(), ...visitor };
                visitors.push(savedVisitor);
                await saveVisitorsToStorage(visitors);

                alert("Visitor Registered Successfully!");
                form.reset();
                window.location.href = "dashboard.html";
            } catch (err) {
                // Fallback to local storage if server call fails
                visitors.push(visitor);
                saveVisitorsToStorage(visitors);
                alert("Visitor Registered locally (offline). Will sync when possible.");
                form.reset();
                window.location.href = "dashboard.html";
            }

        });

        form.dataset.bound = "true";
    }


    // ---------- DISPLAY VISITORS ----------

    loadVisitorsFromServer().then(function () {
        renderVisitorTable();
        updateStatusSummary();
    });

});


// ---------- SEARCH VISITOR ----------

function searchVisitor() {

    let input =
        document.getElementById("searchBox").value.toLowerCase();

    let rows =
        document.getElementById("visitorData")
        .getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {

        let text = rows[i].innerText.toLowerCase();

        rows[i].style.display =
            text.includes(input) ? "" : "none";
    }
}