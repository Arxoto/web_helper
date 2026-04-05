(() => {
    if (!(chrome?.runtime)) {
        return;
    }

    /** @type {HTMLButtonElement} */
    const newReaderBtn = document.getElementById('newReader');
    newReaderBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            'msgType': 'doActionHandler',
            'actionName': 'newReader',
        });
    })

    /** @type {HTMLButtonElement} */
    const goGitHub1sBtn = document.getElementById('goGitHub1s');
    goGitHub1sBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({
            'msgType': 'doActionHandler',
            'actionName': 'goGithub1s',
        });
    })

    /** @type {HTMLButtonElement} */
    const openOptionsBtn = document.getElementById('openOptions');
    openOptionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    })


})();