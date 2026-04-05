// common utils

/**
 * 在某节点加入一个元素
 * @param {HTMLElement} parent
 * @param {...HTMLElement} children
 */
const elementAppend = (parent, ...children) => {
    for (const child of children) {
        parent.appendChild(child);
    }
}

/**
 * 创建带属性的 DOM 元素（无子节点）
 * @template {keyof HTMLElementTagNameMap} T
 * @param {T} tagName
 * @param {Partial<HTMLElementTagNameMap[T]>} attrs
 * @param {string | undefined} textContent
 * @returns {HTMLElementTagNameMap[T]}
 */
const elementCreate = (tagName, attrs, textContent) => {
    const ele = Object.assign(document.createElement(tagName), attrs);
    if (textContent) {
        ele.textContent = textContent;
    }
    return ele;
}

/**
 * 创建带属性的 DOM 元素（带子节点）
 * @template {keyof HTMLElementTagNameMap} T
 * @param {T} tagName
 * @param {Partial<HTMLElementTagNameMap[T]>} attrs
 * @param {...HTMLElement} children
 * @returns {HTMLElementTagNameMap[T]}
 */
const elementTrees = (tagName, attrs, ...children) => {
    const element = elementCreate(tagName, attrs);
    elementAppend(element, ...children);
    return element;
}

// 引入类型

/**
 * @typedef {import('./background').Config} Config
 */

// 业务逻辑

/** @type {HTMLDivElement} */
const root = document.getElementById('root');

/**
 * 显示通知
 * @param {*} message 通知消息
 * @param {'success' | undefined} type 样式类型
 */
const showNotification = (message, type) => {
    const container = document.getElementById('notification');
    const notice = document.createElement('div');

    notice.className = `notification ${type}`;
    notice.textContent = message;
    container.appendChild(notice);

    // 触发动画
    setTimeout(() => notice.classList.add('show'), 10);

    // 3 秒后自动关闭
    setTimeout(() => {
        notice.classList.remove('show');
        setTimeout(() => notice.remove(), 300);
    }, 3000);
}

// create config box
const createConfBox = async () => {
    /** @type {Config} */
    let currentConf;
    /** @type {Config} */
    let defaultConf;
    /** @type {string[]} */
    let actionNames;
    /** @type {async () => {}} */
    let updateConfig;

    if (chrome?.runtime) {
        currentConf = await chrome.runtime.sendMessage({
            msgType: 'getCurrentConfig',
        });
        defaultConf = await chrome.runtime.sendMessage({
            msgType: 'getDefaultConfig',
        });
        actionNames = await chrome.runtime.sendMessage({
            msgType: 'getActionNames',
        });
        updateConfig = async () => {
            await chrome.runtime.sendMessage({
                msgType: 'syncConfig',
                configSettings: currentConf,
            })
            showNotification('✅ 配置已保存', 'success');
        }
    } else {
        currentConf = {
            directAction: 'goGithub1s',
            // directAction: null,
        }
        defaultConf = {
            directAction: null,
        }
        actionNames = ['newReader', 'goGithub1s']
        updateConfig = async () => {
            console.log('updated config', currentConf);
            showNotification(`updated config ${JSON.stringify(currentConf)}`);
            showNotification('✅ 配置已保存', 'success');
        }
    }

    /** 重置按钮构造器 */
    const createResetBtn = () => elementCreate('div', { className: 'confReset' }, '⟲');

    const directActionReseter = createResetBtn();
    const directActionModeEle = elementCreate('input', { type: 'checkbox' });
    const directActionNameEle = elementTrees('select', {}, ...actionNames.map(actName => {
        return elementCreate('option', { value: actName }, actName);
    }));

    const saveBtn = elementCreate('button', { className: 'saveBtn' }, 'save');

    // 数据与渲染绑定
    /** @type {Config} */
    const confState = {
        get directAction() {
            return currentConf.directAction;
        },
        set directAction(v) {
            currentConf.directAction = v;
            if (v) {
                directActionModeEle.checked = true;
                directActionNameEle.disabled = false;
                directActionNameEle.value = v;
            } else {
                directActionModeEle.checked = false;
                directActionNameEle.disabled = true;
            }
            if (currentConf.directAction === defaultConf.directAction) {
                directActionReseter.classList.add('disabled')
                directActionReseter.title = '当前配置与默认配置一致'
            } else {
                directActionReseter.classList.remove('disabled')
                directActionReseter.title = '点击重置为默认配置'
            }
        },
    }

    // 渲染与数据绑定
    directActionModeEle.addEventListener('change', e => {
        if (e.target.checked) {
            confState.directAction = directActionNameEle.value || actionNames[0] || '';
        } else {
            confState.directAction = null;
        }
    })
    directActionNameEle.addEventListener('change', e => {
        confState.directAction = e.target.value;
    })
    directActionReseter.addEventListener('click', _e => {
        confState.directAction = defaultConf.directAction;
    })

    saveBtn.addEventListener('click', _e => {
        updateConfig()
    })

    // 初始化状态
    confState.directAction = currentConf.directAction;

    /**
     * @param {string} itemTitle
     * @param {HTMLElement} resetBtn
     * @param {...HTMLElement} children
     * @returns {HTMLDivElement}
     */
    const createConfigItem = (itemTitle, resetBtn, ...children) => {
        return elementTrees('div', { className: 'confItem' },
            elementCreate('div', { className: 'confTitle' }, itemTitle),
            resetBtn,
            elementTrees('div', { className: 'confValues' }, ...children),
        );
    }

    /**
     * @param {string} itemSubTitle
     * @param {HTMLElement} child
     * @param {string} itemSubDesc
     * @returns {HTMLDivElement}
     */
    const createConfSubItem = (itemSubTitle, child, itemSubDesc) => {
        return elementTrees('div', { className: 'confSubItem' },
            elementCreate('div', { className: 'confSubTitle' }, itemSubTitle),
            child,
            elementCreate('div', { className: 'confSubDesc' }, itemSubDesc),
        )
    }

    return elementTrees('div', { className: 'confBox' },
        createConfigItem('触发方式', directActionReseter,
            createConfSubItem('直接触发', directActionModeEle, '点击插件图标是否直接触发，否则打开弹出面板进行选择'),
            createConfSubItem('触发行为', directActionNameEle, '若直接触发，则触发什么行为'),
        ),
        saveBtn,
    );
}

(async () => {
    const confBoxEle = await createConfBox();
    elementAppend(root, confBoxEle);
})();
