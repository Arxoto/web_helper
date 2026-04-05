/**
 * 动作处理函数上下文
 * @typedef {Object} ActionHandlerContext
 * @property {string | undefined} url - 当前页面的 url
 */

/**
 * 动作处理器类型定义
 * @typedef {Object} ActionHandler
 * @property {(context: ActionHandlerContext) => Promise<void>} handler - 动作处理
 */

/**
 * @type {Record<string, ActionHandler>}
 */
const actionHandlers = {
    "newReader": {
        "handler": async (context) => {
            // open a new tab for reader
            if (context.url) {
                chrome.tabs.create({ active: true, url: "read://" + context.url });
                return;
            }
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.url) {
                chrome.tabs.create({ active: true, url: "read://" + tab.url });
            }

        }
    },
    "goGithub1s": {
        "handler": async (_context) => {
            // Redirect to github1s.com if the current tab is a GitHub page
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.url?.includes("github.com")) {
                const newUrl = tab.url.replace("github.com", "github1s.com");
                chrome.tabs.update(tab.id, { url: newUrl });
            }
        }
    }
};

/**
 * 触发一个特定的动作
 * @param {string} name - Action 名称
 * @param {ActionHandlerContext} context - 动作函数入参
 */
const doActionHandler = async (name, context) => {
    let handle = actionHandlers[name];
    handle?.handler(context);
}

/**
 * 配置类型
 * @typedef {Object} Config
 * @property {string | null} directAction - 是否直接触发，以及直接触发的动作类型，若否则显示 popup 页面
 */

/**
 * @type {Config}
 */
const DEFAULT_CONFIG = {
    "directAction": null,
}

/**
 * 获取配置
 * @returns {Promise<Config>}
 */
const fetchConfig = async () => {
    const { conf = {} } = await chrome.storage.local.get(["conf"]);
    return {
        ...DEFAULT_CONFIG,
        ...conf,
    }
}

/**
 * 更新配置
 * @param {Config} conf
 */
const syncConfig = async (conf) => {
    if (conf.directAction) {
        await chrome.action.setPopup({ popup: '' });
        await chrome.action.setTitle({ title: 'directMode' });
    } else {
        await chrome.action.setPopup({ popup: 'popup.html' });
        await chrome.action.setTitle({ title: 'open popup' });
    }
    await chrome.storage.local.set({ "conf": conf });
}

/**
 * 消息类型
 * @typedef {Object} Message
 * @property {'doActionHandler' | 'getActionNames' | 'getCurrentConfig' | 'getDefaultConfig' | 'syncConfig'} msgType
 * @property {string | undefined} actionName
 * @property {Config | undefined} configSettings
 */

/**
 * @param {Message} message
 */
const messageListener = (message, sender, sendResponse) => {
    if (message.msgType === 'doActionHandler') {
        if (message.actionName) {
            /** @type {ActionHandlerContext} */
            const context = {};
            doActionHandler(message.actionName, context);
        }
        return false;
    }
    if (message.msgType === 'getActionNames') {
        sendResponse(Object.keys(actionHandlers));
        return false;
    }
    if (message.msgType === 'getCurrentConfig') {
        (async () => {
            let result = await fetchConfig();
            sendResponse(result);
        })();
        return true;
    }
    if (message.msgType === 'getDefaultConfig') {
        sendResponse(DEFAULT_CONFIG);
        return false;
    }
    if (message.msgType === 'syncConfig') {
        if (message.configSettings) {
            syncConfig(message.configSettings);
        }
        return false;
    }
    return false;
}
chrome.runtime.onMessage.addListener(messageListener);

// This event will not fire if the action has a popup.
chrome.action.onClicked.addListener(async (tab) => {
    const conf = await fetchConfig();
    if (conf.directAction) {
        /** @type {ActionHandlerContext} */
        const context = { url: tab.url };
        await doActionHandler(conf.directAction, context)
    }

    // chrome.scripting.executeScript({
    //     target: { tabId: tab.id },
    //     files: ['content.js']
    // });
});

// 启动时更新一次行为（确保service worker重启后行为正确）
(async () => {
    const conf = await fetchConfig();
    await syncConfig(conf);
})();
