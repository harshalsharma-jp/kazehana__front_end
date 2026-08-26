const currentUser = JSON.parse(
    localStorage.getItem("kazehanaUser")
);

if (!currentUser || !currentUser.user_id) {

    console.log("Guest user detected. Clearing temporary chat history.");

    localStorage.removeItem("kazehanaChats");
    localStorage.removeItem("currentChatId");

}

let chats =
    JSON.parse(localStorage.getItem("kazehanaChats")) || [];

let currentChatId =
    localStorage.getItem("currentChatId");

function saveChats() {

    localStorage.setItem(
        "kazehanaChats",
        JSON.stringify(chats)
    );

    localStorage.setItem(
        "currentChatId",
        currentChatId
    );
}

if (!currentChatId) {

    currentChatId = Date.now().toString();

    chats.push({
        id: currentChatId,
        title: "New Chat",
        messages: []
    });

    saveChats();
}



const chatForm = document.getElementById("chat-form");
const historyList = document.getElementById("history-list");
const userInput = document.getElementById("user-input");
const chatMessages = document.getElementById("chat-messages");

function getCurrentTime() {

    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

function addUserMessage(text) {

    const messageHTML = `
        <div class="message-wrapper user-message">

            <div class="message-content">${text}</div>

            <div class="message-footer">
                <span class="timestamp">
                    ${getCurrentTime()}
                </span>
            </div>

        </div>
    `;

    chatMessages.insertAdjacentHTML(
        "beforeend",
        messageHTML
    );

    const currentChat =
        chats.find(
            chat => chat.id === currentChatId
        );

    if (currentChat) {

        currentChat.messages.push({
            sender: "user",
            text: text,
            time: getCurrentTime()
        });

        saveChats();
    }

    scrollToBottom();
}

chatForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const message = userInput.value.trim();

    const currentChat =
        chats.find(
            chat => chat.id === currentChatId
        );

    if (
        currentChat &&
        currentChat.messages.length === 0
    ) {
        currentChat.title =
            message.substring(0, 30);

        saveChats();
    }

    if (!message) {
        return;
    }

    welcomeScreen.style.display = "none";

    addUserMessage(message);

    showTypingIndicator();

    scrollToBottom();

    userInput.value = "";

    const currentUser = JSON.parse(
        localStorage.getItem("kazehanaUser")
    );

    const userId =
        currentUser && currentUser.user_id
            ? currentUser.user_id
            : "guest";

    try {

        await new Promise(resolve =>
            setTimeout(resolve, 3000)
        );

        const response = await fetch(
            "https://backend.souzou.in/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: message,
                    user_id: userId
                })
            }
        );

        const data = await response.json();

        hideTypingIndicator();

        addBotMessage(data.reply);

        scrollToBottom();

    } catch (error) {

        hideTypingIndicator();

        console.error(error);

        addBotMessage(
            "Please wait, you have reached your API token limit."
        );
    }
});



const welcomeScreen = document.getElementById("welcome-screen");

function scrollToBottom() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}

const typingIndicator =
    document.getElementById("typing-indicator");

typingIndicator.style.display = "none";

function showTypingIndicator() {

    typingIndicator.style.display = "flex";
}

function hideTypingIndicator() {

    typingIndicator.style.display = "none";
}

function addBotMessage(text) {

    const messageHTML = `
        <div class="message-wrapper bot-message">

            <div class="message-content">${text}</div>

            <div class="message-footer">
                <span class="timestamp">
                    ${getCurrentTime()}
                </span>
            </div>

        </div>
    `;

    chatMessages.insertAdjacentHTML(
        "beforeend",
        messageHTML
    );

    const currentChat =
        chats.find(
            chat => chat.id === currentChatId
        );

    if (currentChat) {

        currentChat.messages.push({
            sender: "bot",
            text: text,
            time: getCurrentTime()
        });

        saveChats();
    }

    scrollToBottom();
}

function loadChat(chatId) {

    const chat =
        chats.find(
            chat => chat.id === chatId
        );

    if (!chat) return;

    chatMessages.innerHTML = "";

    welcomeScreen.style.display = "none";

    chat.messages.forEach(message => {

        const messageHTML = `
            <div class="message-wrapper ${message.sender}-message">

                <div class="message-content">${message.text}</div>

                <div class="message-footer">
                    <span class="timestamp">
                    ${message.time}
                    </span>
                </div>

            </div>
        `;

        chatMessages.insertAdjacentHTML(
            "beforeend",
            messageHTML
        );

    });

    scrollToBottom();
}

function renderHistory() {

    if (!historyList) return;

    historyList.innerHTML = "";

    [...chats].reverse().forEach(chat => {

        const item =
            document.createElement("div");

        item.className = "history-item";

        item.innerHTML = `
            <button class="history-main">
                <span class="history-title">${chat.title}</span>
                <span class="history-arrow">></span>
            </button>

            <button
                class="delete-chat-btn"
                title="Delete chat"
                aria-label="Delete ${chat.title}"
            >
                🗑
            </button>
        `;


        // Open chat
        item.querySelector(".history-main")
            .addEventListener("click", () => {

                currentChatId = chat.id;

                saveChats();

                welcomeScreen.style.display = "none";

                loadChat(currentChatId);

            });


        // Delete chat
        item.querySelector(".delete-chat-btn")
            .addEventListener("click", (event) => {

                event.stopPropagation();

                deleteChat(chat.id);

            });


        historyList.appendChild(item);

    });

}


function deleteChat(chatId) {

    const chat =
        chats.find(chat => chat.id === chatId);

    if (!chat) return;


    const confirmed = confirm(
        `Delete "${chat.title}"?\n\nThis chat cannot be recovered.`
    );

    if (!confirmed) return;


    // Remove chat
    chats = chats.filter(
        chat => chat.id !== chatId
    );


    // If the deleted chat was currently open
    if (chatId === currentChatId) {

        // Create a new empty chat
        currentChatId = Date.now().toString();

        chats.push({
            id: currentChatId,
            title: "New Chat",
            messages: []
        });

        chatMessages.innerHTML = "";

        welcomeScreen.style.display = "flex";
    }


    saveChats();

    renderHistory();

}


renderHistory();

const currentChat =
    chats.find(
        chat => chat.id === currentChatId
    );

if (
    currentChat &&
    currentChat.messages.length > 0
) {
    loadChat(currentChatId);
} else {
    welcomeScreen.style.display = "flex";
}


const newChatBtn = document.getElementById("new-chat-btn");
console.log("New Chat Button:", newChatBtn);
console.log("History List:", historyList);
const settingsBtn = document.getElementById("settings-btn");
const aboutBtn = document.getElementById("about-btn");
const profileBtn = document.getElementById("profile-btn");
const chatHistoryBtn = document.getElementById("chat-history-btn");
const exploreBtn = document.getElementById("explore-btn");

exploreBtn.addEventListener("click", () => {
    window.location.href = "article.html";
});

const closeAboutBtn =
    document.getElementById("close-about-btn");

closeAboutBtn.addEventListener("click", () => {

    document.getElementById("about-panel")
        .classList.remove("active");

});


newChatBtn.addEventListener("click", () => {

    const currentChat =
        chats.find(
            chat => chat.id === currentChatId
        );

    if (
        currentChat &&
        currentChat.messages.length === 0
    ) {

        chats = chats.filter(
            chat => chat.id !== currentChatId
        );

    }

    currentChatId =
        Date.now().toString();

    chats.push({
        id: currentChatId,
        title: "New Chat",
        messages: []
    });

    saveChats();

    chatMessages.innerHTML = "";

    welcomeScreen.style.display = "flex";

    renderHistory();

});
chatHistoryBtn.addEventListener("click", () => {

    const historyContainer =
        document.getElementById("history-container");

    historyContainer.classList.toggle("active");

});



aboutBtn.addEventListener("click", () => {

    document.getElementById("about-panel")
        .classList.add("active");

});

profileBtn.addEventListener("click", () => {

    window.location.href = "profile.html";

});



const sakuraContainer = document.getElementById("sakura-container");

function createPetal() {

    const petal = document.createElement("div");

    petal.classList.add("sakura-petal");

    const size = 8 + Math.random() * 12;

    petal.style.width = size + "px";
    petal.style.height = size + "px";

    petal.style.left =
        Math.random() * window.innerWidth + "px";

    petal.style.animationDuration =
        (10 + Math.random() * 10) + "s";

    sakuraContainer.appendChild(petal);

    setTimeout(() => {

        petal.remove();

    }, 166000);
}

setInterval(() => {

    createPetal();

}, 1000);

for (let i = 0; i < 20; i++) {

    createPetal();
}

const colors = [
    "#ffb7d5",
    "#ffc9df",
    "#ffd6e7",
    "#f8a5c2",
    "#ffcad4"


];


/* ==========================================
   MOBILE SIDEBAR
========================================== */

const mobileMenuBtn =
    document.getElementById("mobile-menu-btn");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebar-overlay");


function openMobileSidebar() {

    sidebar.classList.add("active");

    sidebarOverlay.classList.add("active");

    document.body.classList.add("menu-open");

}


function closeMobileSidebar() {

    sidebar.classList.remove("active");

    sidebarOverlay.classList.remove("active");

    document.body.classList.remove("menu-open");

}


/* Open menu */

mobileMenuBtn.addEventListener("click", () => {

    if (sidebar.classList.contains("active")) {

        closeMobileSidebar();

    } else {

        openMobileSidebar();

    }

});


/* Close when clicking outside */

sidebarOverlay.addEventListener("click", () => {

    closeMobileSidebar();

});


/* Close menu after selecting a navigation button */

const sidebarButtons =
    document.querySelectorAll(
        "#sidebar-navigation button"
    );

sidebarButtons.forEach(button => {

    button.addEventListener("click", () => {

        if (window.innerWidth <= 991) {

            closeMobileSidebar();

        }

    });

});


/* Reset mobile menu when returning to desktop */

window.addEventListener("resize", () => {

    if (window.innerWidth > 991) {

        closeMobileSidebar();

    }

});


