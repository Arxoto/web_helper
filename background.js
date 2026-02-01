/** 以阅读模式打开一个新的页签 */
const ACTION_MODE_NEW_READER = 0;
/** 若当前网站为 GitHub 页面，则将当前页签跳转到 github1s.com */
const ACTION_MODE_TO_GITHUB1S = 1;
/**
 * @typedef { ACTION_MODE_NEW_READER | ACTION_MODE_TO_GITHUB1S } ActionMode
 */

/**
 * @type { ActionMode }
 */
let actionMode = ACTION_MODE_NEW_READER;

function jumpUrl(url) {
    switch (actionMode) {
        case ACTION_MODE_NEW_READER:
            // Open a new reader mode tab
            chrome.tabs.create({ active: true, url: "read://" + url });
            break;
        case ACTION_MODE_TO_GITHUB1S:
            // Redirect to github1s.com if the current tab is a GitHub page
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes("github.com")) {
                    const githubUrl = tabs[0].url;
                    const github1sUrl = githubUrl.replace("github.com", "github1s.com");
                    chrome.tabs.update(tabs[0].id, { url: github1sUrl });
                }
            });
            break;

        default:
            break;
    }
}

// This event will not fire if the action has a popup.
chrome.action.onClicked.addListener((tab) => {
    if (tab.url) {
        jumpUrl(tab.url);
    }
    // chrome.scripting.executeScript({
    //     target: { tabId: tab.id },
    //     files: ['content.js']
    // });
});
