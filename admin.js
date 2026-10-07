const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
        });

        const result = await response.json();

        if (result.success) {
            document.querySelector(".login-container").innerHTML = `
                <h1>Welcome, Aboubakre!</h1>
                <p>You are now in your admin dashboard.</p>
                <button onclick="showEditor()">Edit Portfolio</button>
            `;
        } else {
            message.textContent = result.message;
        }
    } catch (error) {
        message.textContent = "Cannot connect to the server.";
    }
});

function showEditor() {
    document.querySelector(".login-container").innerHTML = `
        <h1>Portfolio Dashboard</h1>
        <p>Welcome, Aboubakre!</p>
        <p>Next, we'll add your portfolio editing tools here.</p>
    `;
}