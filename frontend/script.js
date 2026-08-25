/* =====================================================
   FOODIEBOT AI
   FRONTEND CONTROLLER
   Firebase Firestore + Flask + Gemini Backend
===================================================== */

import {
    db
} from "./firebase/firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// CONFIGURATION
// =====================================================

// IMPORTANT:
// Using relative URL makes the chatbot work both:
// Localhost and Render.
//
// Local:
// http://127.0.0.1:5000/chat
//
// Render:
// https://foodie-chatbot1.onrender.com/chat

const API_URL = "/chat";


// =====================================================
// DOM ELEMENTS
// =====================================================

const userInput =
    document.getElementById("userInput");

const sendBtn =
    document.getElementById("sendBtn");

const messages =
    document.getElementById("messages");

const welcomeSection =
    document.getElementById("welcomeSection");

const typingIndicator =
    document.getElementById("typingIndicator");

const newChatBtn =
    document.getElementById("newChatBtn");

const themeBtn =
    document.getElementById("themeBtn");

const favoriteBtn =
    document.getElementById("favoriteBtn");

const favoritePanel =
    document.getElementById("favoritePanel");

const closeFavorite =
    document.getElementById("closeFavorite");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const voiceBtn =
    document.getElementById("voiceBtn");

const addButton =
    document.getElementById("addButton");

const favoriteContent =
    document.getElementById("favoriteContent");


// =====================================================
// APPLICATION STATE
// =====================================================

let favorites = [];

let darkMode =
    localStorage.getItem(
        "foodieDarkMode"
    ) === "true";

let isSending = false;


// =====================================================
// INITIALIZE APPLICATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        updateTheme();

        await loadFavorites();

        setupEventListeners();

        console.log(
            "FoodieBot AI initialized 🚀"
        );

        console.log(
            "API URL:",
            API_URL
        );

    }
);


// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {

    sendBtn?.addEventListener(
        "click",
        sendMessage
    );


    userInput?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );


    userInput?.addEventListener(
        "input",
        autoResize
    );


    newChatBtn?.addEventListener(
        "click",
        startNewChat
    );


    themeBtn?.addEventListener(
        "click",
        toggleTheme
    );


    favoriteBtn?.addEventListener(
        "click",
        openFavorites
    );


    closeFavorite?.addEventListener(
        "click",
        closeFavoritesPanel
    );


    favoritePanel?.addEventListener(
        "click",
        event => {

            if (
                event.target === favoritePanel
            ) {

                closeFavoritesPanel();

            }

        }
    );


    voiceBtn?.addEventListener(
        "click",
        startVoiceInput
    );


    addButton?.addEventListener(
        "click",
        () => {

            userInput?.focus();

            showToast(
                "Type your ingredients 🥕"
            );

        }
    );


    document
        .querySelectorAll(".quick-action")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const prompt =
                        button.dataset.prompt;

                    if (!prompt) {
                        return;
                    }

                    if (userInput) {

                        userInput.value =
                            prompt;

                        autoResize();

                        userInput.focus();

                    }

                }
            );

        });

}


// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {

    if (isSending) {
        return;
    }


    const message =
        userInput?.value.trim();


    if (!message) {

        showToast(
            "Please enter a message"
        );

        return;

    }


    isSending = true;


    if (welcomeSection) {

        welcomeSection.style.display =
            "none";

    }


    addMessage(
        message,
        "user"
    );


    if (userInput) {

        userInput.value = "";

    }


    resetTextarea();


    if (sendBtn) {

        sendBtn.disabled = true;

    }


    showTyping();


    try {

        console.log(
            "📤 Sending message:"
        );

        console.log(
            message
        );

        console.log(
            "🌐 API:",
            API_URL
        );


        // =================================================
        // SEND REQUEST TO FLASK BACKEND
        // =================================================

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: message
                    })
                }
            );


        console.log(
            "📡 Backend status:",
            response.status
        );


        // =================================================
        // HANDLE HTTP ERROR
        // =================================================

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "❌ Backend response:",
                errorText
            );

            throw new Error(
                `Backend error: ${response.status}`
            );

        }


        // =================================================
        // READ JSON RESPONSE
        // =================================================

        const data =
            await response.json();


        console.log(
            "📦 Backend data:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.error ||
                "AI response failed"
            );

        }


        const reply =
            data.reply ||
            "Sorry, I couldn't generate a response.";


        hideTyping();


        // =================================================
        // DISPLAY BOT MESSAGE
        // =================================================

        addMessage(
            reply,
            "bot"
        );


        // =================================================
        // SAVE CHAT TO FIREBASE
        // =================================================

        await saveChatToFirestore(
            message,
            reply
        );


    } catch (error) {

        console.error(
            "❌ FoodieBot error:",
            error
        );


        hideTyping();


        addMessage(

            "⚠️ Sorry, I couldn't connect to FoodieBot. " +
            "Please try again.",

            "bot"

        );


    } finally {

        isSending = false;


        if (sendBtn) {

            sendBtn.disabled = false;

        }


        userInput?.focus();

    }

}


// =====================================================
// ADD MESSAGE TO UI
// =====================================================

function addMessage(
    text,
    sender
) {

    if (!messages) {
        return;
    }


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.classList.add(
        "message"
    );


    if (sender === "user") {

        messageElement.classList.add(
            "user"
        );


        messageElement.innerHTML = `

            <div class="message-body">

                <div class="message-text"></div>

            </div>

        `;

    } else {

        messageElement.innerHTML = `

            <div class="bot-avatar">
                🍴
            </div>

            <div class="message-body">

                <div class="message-label">
                    FOODIEBOT AI
                </div>

                <div class="message-text"></div>

            </div>

        `;

    }


    const textElement =
        messageElement.querySelector(
            ".message-text"
        );


    if (textElement) {

        textElement.textContent =
            text;

    }


    messages.appendChild(
        messageElement
    );


    scrollToBottom();

}


// =====================================================
// TYPING INDICATOR
// =====================================================

function showTyping() {

    typingIndicator?.classList.remove(
        "hidden"
    );

    scrollToBottom();

}


function hideTyping() {

    typingIndicator?.classList.add(
        "hidden"
    );

}


// =====================================================
// FIREBASE — SAVE CHAT
// =====================================================

async function saveChatToFirestore(
    message,
    reply
) {

    try {

        await addDoc(

            collection(
                db,
                "chats"
            ),

            {
                message: message,

                reply: reply,

                createdAt:
                    serverTimestamp()
            }

        );


        console.log(
            "Chat saved to Firebase ✅"
        );


    } catch (error) {

        console.error(
            "Firebase chat error:",
            error
        );

    }

}


// =====================================================
// FIREBASE — LOAD FAVORITES
// =====================================================

async function loadFavorites() {

    try {

        const favoritesRef =
            collection(
                db,
                "favorites"
            );


        const snapshot =
            await getDocs(
                favoritesRef
            );


        favorites =
            snapshot.docs.map(
                item => ({

                    id:
                        item.id,

                    recipe:
                        item.data().recipe

                })
            );


        console.log(
            "Favorites loaded:",
            favorites
        );


    } catch (error) {

        console.error(
            "Failed to load favorites:",
            error
        );


        favorites = [];

    }

}


// =====================================================
// FIREBASE — SAVE FAVORITE
// =====================================================

async function saveFavorite(
    recipe
) {

    if (!recipe) {

        showToast(
            "Nothing to save"
        );

        return;

    }


    const alreadySaved =
        favorites.some(
            item =>
                item.recipe === recipe
        );


    if (alreadySaved) {

        showToast(
            "Already in favorites ❤️"
        );

        return;

    }


    try {

        const docRef =
            await addDoc(

                collection(
                    db,
                    "favorites"
                ),

                {
                    recipe: recipe,

                    createdAt:
                        serverTimestamp()
                }

            );


        favorites.push({

            id:
                docRef.id,

            recipe:
                recipe

        });


        renderFavorites();


        showToast(
            "Recipe saved ❤️"
        );


    } catch (error) {

        console.error(
            "Save favorite error:",
            error
        );


        showToast(
            "Could not save favorite"
        );

    }

}


// =====================================================
// FIREBASE — DELETE FAVORITE
// =====================================================

async function removeFavorite(
    favoriteId
) {

    try {

        await deleteDoc(

            doc(
                db,
                "favorites",
                favoriteId
            )

        );


        favorites =
            favorites.filter(
                item =>
                    item.id !== favoriteId
            );


        renderFavorites();


        showToast(
            "Removed from favorites"
        );


    } catch (error) {

        console.error(
            "Delete favorite error:",
            error
        );


        showToast(
            "Could not remove favorite"
        );

    }

}


// =====================================================
// FAVORITES PANEL
// =====================================================

function openFavorites() {

    favoritePanel?.classList.remove(
        "hidden"
    );

    renderFavorites();

}


function closeFavoritesPanel() {

    favoritePanel?.classList.add(
        "hidden"
    );

}


// =====================================================
// RENDER FAVORITES
// =====================================================

function renderFavorites() {

    if (!favoriteContent) {
        return;
    }


    if (favorites.length === 0) {

        favoriteContent.innerHTML = `

            <div class="empty-favorites">

                <div>
                    ❤️
                </div>

                <h4>
                    No favorites yet
                </h4>

                <p>
                    Your saved recipes will
                    appear here.
                </p>

            </div>

        `;

        return;

    }


    favoriteContent.innerHTML =
        favorites
            .map(
                item => `

                    <div
                        class="favorite-item"
                    >

                        <div>
                            🍽️
                        </div>

                        <span>
                            ${escapeHTML(
                                item.recipe
                            )}
                        </span>

                        <button
                            class="remove-favorite"
                            data-id="${item.id}"
                            title="Remove favorite"
                        >

                            <i
                                class="fa-solid fa-trash"
                            ></i>

                        </button>

                    </div>

                `
            )
            .join("");


    document
        .querySelectorAll(
            ".remove-favorite"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        removeFavorite(
                            id
                        );

                    }
                );

            }
        );

}


// =====================================================
// THEME
// =====================================================

function updateTheme() {

    if (darkMode) {

        document.body.classList.add(
            "dark"
        );


        if (themeBtn) {

            themeBtn.innerHTML =
                `<i class="fa-solid fa-sun"></i>`;

        }

    } else {

        document.body.classList.remove(
            "dark"
        );


        if (themeBtn) {

            themeBtn.innerHTML =
                `<i class="fa-solid fa-moon"></i>`;

        }

    }

}


function toggleTheme() {

    darkMode =
        !darkMode;


    localStorage.setItem(
        "foodieDarkMode",
        darkMode
    );


    updateTheme();


    showToast(

        darkMode
            ? "Dark mode enabled 🌙"
            : "Light mode enabled ☀️"

    );

}


// =====================================================
// NEW CHAT
// =====================================================

function startNewChat() {

    if (messages) {

        messages.innerHTML = "";

    }


    if (welcomeSection) {

        welcomeSection.style.display =
            "block";

    }


    if (userInput) {

        userInput.value = "";

    }


    resetTextarea();

    hideTyping();


    showToast(
        "New chat started ✨"
    );

}


// =====================================================
// VOICE INPUT
// =====================================================

function startVoiceInput() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        showToast(
            "Voice input is not supported in this browser"
        );

        return;

    }


    const recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";


    recognition.interimResults =
        false;


    recognition.continuous =
        false;


    recognition.start();


    showToast(
        "Listening... 🎙️"
    );


    recognition.onresult =
        event => {

            const transcript =
                event.results[0][0]
                    .transcript;


            if (userInput) {

                userInput.value =
                    transcript;

                autoResize();

                userInput.focus();

            }

        };


    recognition.onerror =
        error => {

            console.error(
                "Voice error:",
                error
            );


            showToast(
                "Voice input failed"
            );

        };

}


// =====================================================
// TEXTAREA AUTO RESIZE
// =====================================================

function autoResize() {

    if (!userInput) {
        return;
    }


    userInput.style.height =
        "auto";


    userInput.style.height =
        Math.min(
            userInput.scrollHeight,
            120
        ) + "px";

}


function resetTextarea() {

    if (!userInput) {
        return;
    }


    userInput.style.height =
        "auto";

}


// =====================================================
// TOAST
// =====================================================

function showToast(
    message
) {

    if (
        !toast ||
        !toastMessage
    ) {

        return;

    }


    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}


// =====================================================
// SCROLL TO BOTTOM
// =====================================================

function scrollToBottom() {

    const main =
        document.querySelector(
            ".main-content"
        );


    if (!main) {
        return;
    }


    setTimeout(
        () => {

            main.scrollTo({

                top:
                    main.scrollHeight,

                behavior:
                    "smooth"

            });

        },
        50
    );

}


// =====================================================
// SECURITY HELPER
// =====================================================

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}
