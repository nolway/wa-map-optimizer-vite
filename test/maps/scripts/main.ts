console.log("Test script loaded!");

// @ts-ignore - WA is loaded by iframe_api.js
WA.onInit().then(() => {
    console.log("WorkAdventure API initialized!");

    // @ts-ignore
    WA.chat.sendChatMessage("Hello from the test script!", "Test Bot");
});
