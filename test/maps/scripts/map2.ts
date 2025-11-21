console.log("Map 2 script loaded!");

// @ts-ignore - WA is loaded by iframe_api.js
WA.onInit().then(() => {
    console.log("WorkAdventure API initialized for Map 2!");

    // @ts-ignore
    WA.chat.sendChatMessage("Hello from Map 2!", "Map 2 Bot");
});
