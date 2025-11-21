console.log("Map 3 script loaded!");

// @ts-ignore - WA is loaded by iframe_api.js
WA.onInit().then(() => {
    console.log("WorkAdventure API initialized for Map 3!");

    // @ts-ignore
    WA.chat.sendChatMessage("Hello from Map 3!", "Map 3 Bot");
});
