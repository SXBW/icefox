let globalData = {
    webSiteHomeUrl: '',
    loadMorePage: 1,
    totalPage: 0,
    playMusicId: 0,
    audio: new Audio(),
    topMusicList: [],
    playIndex: 0,
    isTopMusic: false
};

let lazyLoadInstance = new LazyLoad({
    elements_selector: '[data-src]',
    threshold: 0,
    data_src: 'src'
});

function printCopyright() {
    console.log('%cIcefox主题 By xiaopanglian v2.2.0 %chttps://0ru.cn', 'color: white;  background-color: #99cc99; padding: 10px;', 'color: white; background-color: #ff6666; padding: 10px;');
}

setInterval(() => {
    loadTopMusicList();
}, 30000);

window.onload = async () => {
    // 网站接口请求地址前缀
    globalData.webSiteHomeUrl = document.querySelector('.webSiteHomeUrl')?.value;
    if (document.querySelector('._currentPage')) {
        globalData.loadMorePage = parseInt(document.querySelector('._currentPage').value);
    }
    if (document.querySelector('._totalPage')) {
        globalData.totalPage = parseInt(document.querySelector('._totalPage').value);
    }

    // 歌曲播放完毕
    globalData.audio.addEventListener('ended', function () {
        refreshAudioUI();

        // 如果是列表播放，则自动加载下一首歌
        if (globalData.isTopMusic === true) {
            // if (globalData.playIndex + 1 < globalData.topMusicList.length) {
            //     globalData.playIndex = globalData.playIndex + 1;
            // } else {
            //     globalData.playIndex = 0;
            // }

            let src = globalData.topMusicList.shift();
            loadAudio(src.url);
            globalData.audio.play();
            showFixedMusicPlayer(src.cover);
        }
    });

    // 歌曲播放进度
    globalData.audio.addEventListener('timeupdate', function () {
        if (globalData.isTopMusic === true) {
            // 进度
            let currentTime = globalData.audio.currentTime;
            let duration = globalData.audio.duration;
            let jdtWidth = currentTime / duration * 5;//这里的5是w-20的宽度，单位是rem
            $("#top-music-jdt").css('width', jdtWidth + "rem");
        }
    });

    printCopyright();
    loadQW();
    clickQW();
    clickSS();

    // 点击打开互动悬浮框
    clickHudong();

    // 点击评论
    clickComment();

    // 点击点赞
    clickLike();

    // 点击emoji
    clickEmoji();

    // 加载顶部音乐
    loadTopMusicList();

    // 大图预览
    let previewImages = document.querySelectorAll('.preview-image');
    previewImages.forEach((element) => {
        imagePreviewAddEventListener(element);
    });

    // 下拉加载更多
    // https://github.com/fa-ge/Scrollload/blob/master/README.md
    new Scrollload({
        container: document.querySelector('.main-container'),
        content: document.querySelector('.article-container'),
        // 底部加载中的html
        loadingHtml: generateHtml('-- 加载中 --'),
        // 底部没有更多数据的html
        noMoreDataHtml: generateHtml('-- 已经到底了 --'),
        // 底部出现异常的html
        exceptionHtml: generateHtml('-- 出现异常 --'),
        loadMore: async function (sl) {

            if (globalData.loadMorePage < globalData.totalPage) {
                globalData.loadMorePage += 1;

                await pjax(globalData.loadMorePage, '.article-container');

                resetPlayerStyle();

                intersectionObserver();
            }

            if (globalData.loadMorePage >= globalData.totalPage) {
                // 没有数据的时候需要调用noMoreData
                sl.noMoreData();
                return;
            }

            sl.unLock();
        },
        pullRefresh: function (sl) {
            sl.refreshComplete();
        }
    });

    $(".go-back").on('click', function () {
        window.location.href = "/";
    });

    $(window).scroll(function () {
        let headerHeight = $("header").height();
        let topFixedHeight = $("#top-fixed").height();
        if ($(this).scrollTop() + topFixedHeight > headerHeight) {
            // 顶部滑动下来
            $("#sx-light").addClass('hidden');
            $("#sx-dark").removeClass('hidden');
            
            $('#top-fixed').addClass('bg-[#f0f0f0]');
            $('#top-fixed').addClass('dark:bg-black/30');
            $('#top-fixed').addClass('backdrop-blur-md');
            $("#friend-light").addClass('hidden');
            $("#friend-dark").removeClass('hidden');
            $("#edit-light").addClass('hidden');
            $("#edit-dark").removeClass('hidden');
            $("#back-light").addClass('hidden');
            $("#back-dark").removeClass('hidden');
            $("#top-play-light").addClass('hidden');
            $("#top-play-dark").removeClass('hidden');
            $("#top-pause-light").addClass('hidden');
            $("#top-pause-dark").removeClass('hidden');
            // 右侧悬浮工具
            $("#go-top").show();
        } else {
            // 顶部未滑动下来
            $("#sx-light").removeClass('hidden');
            $("#sx-dark").addClass('hidden');

            
            $('#top-fixed').removeClass('bg-[#f0f0f0]');
            $('#top-fixed').removeClass('dark:bg-black/30');
            $('#top-fixed').removeClass('backdrop-blur-md');
            $("#friend-light").removeClass('hidden');
            $("#friend-dark").addClass('hidden');
            $("#edit-light").removeClass('hidden');
            $("#edit-dark").addClass('hidden');
            $("#back-light").removeClass('hidden');
            $("#back-dark").addClass('hidden');
            $("#top-play-light").removeClass('hidden');
            $("#top-play-dark").addClass('hidden');
            $("#top-pause-light").removeClass('hidden');
            $("#top-pause-dark").addClass('hidden');
            // 右侧悬浮工具
            $("#go-top").hide();
        }
    });

    $("#music-modal").draggable({
        containment: "body",
        scroll: false
    });

    $("#fixed-music-close").click(function () {
        $("#music-modal").hide();

        globalData.playIndex = 0;
        globalData.isTopMusic = false;

        // 顶部音乐进度归0
        $("#top-music-jdt").css('width', "0rem");

        showTopMusicPlayUI();

        closeAudio();
    });

    /**
     * 暂停播放音乐
     */
    $("#fixed-music-pause").click(function () {
        pauseAudioOne();


        // 文章列表播放器按钮暂停
        $("#music-play-" + globalData.playMusicId).removeClass("hidden");
        $("#music-pause-" + globalData.playMusicId).addClass("hidden");

        fixedMusicPlayerPauseUI();

        // 顶部播放器按钮暂停
        showTopMusicPlayUI();
    });

    $("#fixed-music-play").click(function () {
        playAudioOne();

        // 文章列表播放器按钮继续播放
        $("#music-play-" + globalData.playMusicId).addClass("hidden");
        $("#music-pause-" + globalData.playMusicId).removeClass("hidden");
        fixedMusicPlayerPlayUI();
        showTopMusicPauseUI();
    });

    /**
     * 顶部音乐播放
     */
    $(".top-play").click(function () {
        // 唤起悬浮音乐播放器，设置当前播放索引，开始播放

        if (globalData.isTopMusic) { // 如果本来就是顶部音乐播放
            globalData.audio.play();
        } else {
            // 原本不是顶部音乐播放，现在是顶部音乐播放

            // 文章列表播放器按钮暂停
            $("#music-play-" + globalData.playMusicId).removeClass("hidden");
            $("#music-pause-" + globalData.playMusicId).addClass("hidden");

            // 顶部音乐开始播放
            globalData.playMusicId = 0;
            globalData.playIndex = 0;
            let src = globalData.topMusicList[globalData.playIndex];
            loadAudio(src.url);
            globalData.audio.play();
            showFixedMusicPlayer(src.cover);

            globalData.isTopMusic = true;
        }

        showTopMusicPauseUI();
    });

    /**
     * 顶部音乐暂停
     */
    $(".top-pause").click(function () {
        globalData.audio.pause();

        showTopMusicPlayUI();
    });

    lazyLoadInstance.update();

    resetPlayerStyle();

    intersectionObserver();
};

var videoTimeOut;
function intersectionObserver() {
    let observAutoPlayVideo = $("#observAutoPlayVideo").val();
    if (observAutoPlayVideo === 'yes') {
        videoTimeOut = null;
        videoTimeOut = setTimeout(() => {
            $("video").each((index, video) => {
                // 创建 Intersection Observer 实例
                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                video.play();
                            } else {
                                video.pause();
                            }
                        });
                    },
                    {
                        root: null,
                        rootMargin: '0px',
                        threshold: 0.5, // 当视频元素至少有 50% 进入视窗时触发
                    }
                );

                // 开始观察视频元素
                observer.observe(video);
            });
        }, 1000);
    }
}

// 暂停所有页面上的 video 播放
function pauseAllVideos() {
    $('video').each(function () {
        this.pause();
    });
}

function resetPlayerStyle() {
    const players = Array.from(document.querySelectorAll('.js-player')).map((p) =>
        new Plyr(p, {
            controls: ['play-large', 'play', 'mute', 'captions', 'fullscreen'],
            muted: true
        })
    );
    setTimeout(() => {
        $(".js-player").each((index, item) => {
            var src = $(item).data('src');
            if (isM3U8Url(src)) {
                if (Hls.isSupported()) {
                    var hls = new Hls();
                    hls.loadSource(src);
                    hls.attachMedia(item);
                }
            }
        });
    }, 1000);

}
function isM3U8Url(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.pathname.endsWith('.m3u8');
    } catch (error) {
        return false;
    }
}
/**
 * 顶部音乐显示播放按钮
 */
function showTopMusicPlayUI() {
    $("#top-play").show();
    $("#top-pause").hide();
}

/**
 * 顶部音乐显示暂停按钮
 */
function showTopMusicPauseUI() {
    $("#top-play").hide();
    $("#top-pause").show();
}

/**
 * 加载顶部音乐
 */
function loadTopMusicList() {
    // 默认使用https://api.vvhan.com/api/wyMusic/%E7%83%AD%E6%AD%8C%E6%A6%9C?type=json源
    // 获取音乐链接
    globalData.topMusicList = []
    $.get('/api/music', function (res) {
        let mp3Url = `https://api.injahow.cn/meting/?type=url&id=${res.data.info.id}`;
        globalData.topMusicList.push({ url: mp3Url, cover: res.data.info.pic_url })
        //loadAudio(mp3Url)
    })
}

/**
 * 加载文章是否需要全文按钮
 */
function loadQW() {
    $.each($(".article-content"), function (index, element) {
        if (element.scrollHeight > element.offsetHeight) {
            let cid = $(element).data('cid');

            //添加全文按钮
            $(".qw-" + cid).removeClass('hidden');
        }
    })
}

// 点击全文按钮
function clickQW() {
    $(".qw").off('click');
    $(".qw").on('click', function (e) {
        $(e.target).addClass('hidden');

        let cid = $(e.target).data('cid');

        $(".content-" + cid).removeClass("line-clamp-4");
        $(".ss-" + cid).removeClass('hidden');
    });
}

// 点击收起按钮
function clickSS() {
    $(".ss").off('click');
    $(".ss").on('click', function (e) {
        $(e.target).addClass('hidden');

        let cid = $(e.target).data('cid');

        $(".content-" + cid).addClass("line-clamp-4");
        $(".qw-" + cid).removeClass('hidden');
    });
}

// 全局窗口点击事件
let hudongBox = document.querySelector('.hudong');
window.addEventListener('click', (event) => {
    // 判断点击的是否是悬浮框，不是就隐藏
    if (event.target.classList.contains('hudong')) {
        return;
    }
    if (event.target.classList.contains('comment-to')) {
        return;
    }
    if (event.target.classList.contains('face')) {
        return;
    }
    if (event.target.classList.contains('face-item')) {
        return;
    }
    if (event.target.classList.contains('face-container')) {
        return;
    }
    if ($(event.target).prop('tagName') === 'INPUT') {
        return;
    }
    if ($(event.target).prop('tagName') === 'BUTTON') {
        return;
    }
    // 隐藏所有互动悬浮框
    hiddenHudongModal();
    // removeAllCommentForm();
});

/**
 * 点击emoji
 */
function clickEmoji() {
    $(".face-item").off('click');
    $(".face-item").on('click', function (e) {
        let cid = $(e.target).data('cid');
        var input = $('input[data-cid=' + cid + '].input-text');

        var textToAppend = $(e.target).text(); // 要追加的文本  
        var currentVal = input.val();
        input.val(currentVal + textToAppend);
    });
}

/**
 * 点击emoji表情显示/隐藏emoji
 */
function clickEmojiFace() {
    $(".face").off('click');
    $(".face").on('click', function (e) {
        let cid = $(e.target).data('cid');
        var faceContainer = $('.face-container[data-cid=' + cid + ']');

        if ($(faceContainer).hasClass('hidden')) {
            $(faceContainer).removeClass('hidden');
        } else {
            $(faceContainer).addClass('hidden');
        }
    });
}

/**
 * 点击互动
 */
function clickHudong() {
    $(".hudong").off('click');
    $(".hudong").on('click', function (e) {
        let hudongElement = e.target;

        hiddenHudongModal();

        let modal = $(hudongElement).next();
        modal.removeClass('hidden');
    });
}

/**
 * 点击评论
 */
function clickComment() {
    $(".comment-to").off('click');
    $(".comment-to").on('click', function (e) {

        let cid = $(e.target).data('cid');
        let coid = $(e.target).data('coid');

        // 找到已有的评论框
        var existsCommentFormCoid = $(".comment-form").data("coid");
        var existsCommentFormCid = $(".comment-form").data("cid");
        if (existsCommentFormCoid === 'undefined') existsCommentFormCoid = undefined;
        if (existsCommentFormCid === 'undefined') existsCommentFormCid = undefined;

        var hasCommentForm = $(".comment-form").length > 0;

        removeAllCommentForm();

        if (hasCommentForm && existsCommentFormCoid === coid && existsCommentFormCid === cid) {
            return;
        }

        let name = $(e.target).data('name');

        if (coid == undefined) {
            // 如果没有coid，那么就在最下方显示评论框
            // document.querySelector('.comment-ul-cid-' + cid).insertAdjacentHTML('beforeend', getCommentFormHtml(cid));
            $('.comment-ul-cid-' + cid).prepend(getCommentFormHtml(cid));
        } else {
            //有coid，在对应评论处显示评论框
            document.querySelector('.comment-li-coid-' + coid).insertAdjacentHTML('afterend', getCommentFormHtml(cid, coid, name));
        }

        clickEmoji();
        clickEmojiFace();

        // 点击评论回复按钮
        $(".btn-comment").off('click');
        $(".btn-comment").on('click', function (e) {
            let cid = $(e.target).data('cid');
            let coid = $(e.target).data('coid');

            let requiredMail = $("#commentsRequireMail").val();
            let requiredURL = $("#commentsRequireURL").val();

            let author = document.querySelector('.input-author').value;
            let url = document.querySelector('.input-url').value;
            let mail = document.querySelector('.input-mail').value;
            let text = document.querySelector('.input-text').value;
            let param = {
                cid: cid,
                parent: coid,
                author: author,
                mail: mail,
                url: url,
                text: text,
            };
            if (param.author === '') {
                alert('昵称不能为空');
                return;
            }
            if (requiredMail == 1 && param.mail === '') {
                alert('邮件不能为空');
                return;
            }
            if (requiredURL == 1 && param.url === '') {
                alert('网址不能为空');
                return;
            }
            if (param.text === '') {
                alert('评论内容不能为空');
                return;
            }

            // 记录信息到localStorage
            window.localStorage.setItem('author', author);
            window.localStorage.setItem('mail', mail);
            window.localStorage.setItem('url', url);

            axios.post(globalData.webSiteHomeUrl + '/api/comment', param,
                { headers: { 'content-type': 'application/x-www-form-urlencoded' } })
                .then(function (response) {
                    if (response.data.status == 1) {
                        removeAllCommentForm();

                        let waiting = '';
                        // 把评论显示在对应位置
                        if (response.data.comment.status == 'waiting') {
                            // 显示待审核
                            waiting = '<span class="comment-waiting">待审核</span>';
                        }

                        if (param.parent > 0) {
                            //有coid，在对应评论处显示评论框
                            document.querySelector('.comment-li-coid-' + param.parent).insertAdjacentHTML('afterend', `
                                <li class="pos-rlt comment-li-coid-${response.data.comment.coid} pb-1 px-2 first-of-type:pt-2">
                                    <div class="comment-body">
                                        <span class="text-[14px] text-color-link">
                                            <a href="${response.data.comment.url}" target="_blank" class="cursor-pointer text-color-link no-underline">${response.data.comment.author}</a>
                                        </span>
                                        <span class="text-[14px]">回复</span>
                                        <span class="text-[14px] text-color-link">${name}</span>
                                        <span data-separator=":" class="before:content-[attr(data-separator)] text-[14px] cursor-help comment-to" data-coid="${response.data.comment.coid}" data-cid="${response.data.comment.cid}" data-name="${response.data.comment.author}">${param.text}</span>
                                        ${waiting}
                                    </div>
                                </li>`);

                        } else {
                            // 如果没有coid，那么就在最下方显示评论框
                            document.querySelector('.comment-ul-cid-' + param.cid).insertAdjacentHTML('beforeend', `
                                <li class="pos-rlt comment-li-coid-${response.data.comment.coid}">
                    <div class="comment-body">
                        <span class="text-[14px] text-color-link">
                            <a href="${response.data.comment.url}" target="_blank" class="cursor-pointer text-color-link no-underline">${response.data.comment.author}</a>
                        </span>
                        <span data-separator=":" class="before:content-[attr(data-separator)] text-[14px] cursor-help comment-to" data-coid="${response.data.comment.coid}" data-cid="${response.data.comment.cid}" data-name="${response.data.comment.author}">${param.text}</span>
                        ${waiting}
                    </div>
                </li>
                                `);
                        }
                    } else {
                        // 评论异常，弹出进行提醒
                        alert(response.data.msg);
                    }

                })
                .catch(function (error) {
                    alert('系统异常，请稍候重试')
                });
        });

    });
}

/**
 * 点击点赞
 */
function clickLike() {
    $(".like-to").off('click');
    $(".like-to").on('click', function (e) {
        let cid = $(e.target).data('cid');
        let agree = $(e.target).data('agree');

        if (cid == 0) {
            return alert('点赞失败');
        }

        let param = { cid: cid, agree: agree };
        axios.post(globalData.webSiteHomeUrl + '/api/like', param, { headers: { 'content-type': 'application/x-www-form-urlencoded' } })
            .then(function (response) {
                console.log(response);
                if (response.data.status == 1) {
                    // 点赞成功
                    if ($(".like-agree-" + cid).hasClass('hidden')) {
                        $(".like-agree-" + cid).removeClass('hidden');
                        $(".like-agree-" + cid).addClass('flex');
                    }

                    // agree=1是点赞，0是取消点赞
                    if (agree === 1) {
                        // 显示取消
                        $(".like-to-cancel-" + cid).removeClass('hidden');
                        $(".like-to-cancel-" + cid).addClass('flex');

                        $(".like-to-show-" + cid).addClass('hidden');
                        $(".like-to-show-" + cid).removeClass('flex');
                    } else {
                        $(".like-to-cancel-" + cid).addClass('hidden');
                        $(".like-to-cancel-" + cid).removeClass('flex');

                        $(".like-to-show-" + cid).removeClass('hidden');
                        $(".like-to-show-" + cid).addClass('flex');

                        if (response.data.agree == 0) {
                            if (!$(".like-agree-" + cid).hasClass('hidden')) {
                                $(".like-agree-" + cid).addClass('hidden');
                                $(".like-agree-" + cid).removeClass('flex');
                            }
                        }
                    }

                    $(".fk-cid-" + cid).text(response.data.agree);
                }
            })
            .catch(function (error) {

            });
    });

}

/**
 * 隐藏所有互动悬浮框
 */
function hiddenHudongModal() {
    let hudongModalList = document.querySelectorAll('.hudong-modal');

    hudongModalList.forEach(item => {
        if (!item.classList.contains('hidden')) {
            item.classList.add('hidden');
        }
    });
}

/**
 * 获取评论框Html
 */
function getCommentFormHtml(cid, coid, name) {

    let author = window.localStorage.getItem('author');
    let mail = window.localStorage.getItem('mail');
    let url = window.localStorage.getItem('url');
    if (author == null) {
        author = '';
    }
    if (mail == null) {
        mail = '';
    }
    if (url == null) {
        url = '';
    }

    // 判断是否登录
    let loginClass = "";
    let loginIs = $("#login-is").text();
    if (loginIs === '1') {
        // 已登录
        author = $.trim($("#login-screenName").text());
        mail = $.trim($("#login-mail").text());
        url = $.trim($("#login-url").text());
        loginClass = "hidden";
    }

    let placeholder = '回复内容';
    if (coid) {
        placeholder = '回复@' + name;
    }
    return `
    <li class="comment-form px-2 py-2" data-cid="${cid}" data-coid="${coid}">
    <div class="bg-white dark:bg-[#262626] p-2 rounded-sm border-1 border-solid border-[#07c160]">
        <div class="grid grid-cols-3 gap-2 ${loginClass}">
            <input placeholder="昵称" class="border-0 outline-none bg-color-primary dark:bg-[#262626] p-1 rounded-sm input-author dark:text-[#cccccc]" data-cid="${cid}" data-coid="${coid}" value="${author}" />
            <input placeholder="网址" class="border-0 outline-none bg-color-primary dark:bg-[#262626] p-1 rounded-sm input-url dark:text-[#cccccc]" data-cid="${cid}" data-coid="${coid}" value="${url}" />
            <input placeholder="邮箱" class="border-0 outline-none bg-color-primary dark:bg-[#262626] p-1 rounded-sm input-mail dark:text-[#cccccc]" data-cid="${cid}" data-coid="${coid}" value="${mail}" />
        </div>
        <div class="mt-2">
            <input placeholder="${placeholder}" class="border-0 outline-none w-full rounded-sm p-1 input-text dark:bg-[#262626] dark:text-[#cccccc]" data-cid="${cid}" data-coid="${coid}" />
        </div>
        <div class="face-container hidden" data-cid="${cid}" data-coid="${coid}">
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😀</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😄</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😁</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😆</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😅</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😂</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤣</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😊</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😇</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🙂</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🙃</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😉</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😌</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😍</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🥰</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😘</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😗</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😙</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😚</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😋</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😛</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😝</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😜</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤪</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤨</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🧐</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤓</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😎</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤩</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🥳</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😏</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😒</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😞</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😔</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😟</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😕</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🙁</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">☹️</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😣</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😖</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😫</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😩</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🥺</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😢</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😭</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😤</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😠</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😡</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤬</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤯</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😳</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🥵</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🥶</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😱</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😨</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😰</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😥</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😓</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤗</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤔</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤭</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤫</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤥</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😶</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😐</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😑</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😬</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🙄</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😯</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😦</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😧</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😮</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😲</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🥱</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😴</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤤</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😪</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😵</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤐</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🥴</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤢</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤮</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤧</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">😷</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤒</span>
<span class="cursor-pointer face-item" data-cid="${cid}" data-coid="${coid}">🤕</span>
        </div>
        <div class="flex justify-end mt-2">
            <div class="face dark:face-dark mr-2 cursor-pointer" data-cid="${cid}" data-coid="${coid}"></div>
            <button class="btn-comment bg-[#07c160] border-0 outline-none text-white cursor-pointer rounded-sm" data-cid="${cid}" data-coid="${coid}">回复</button>
        </div>
    </div>
</li>
    `;
}

/**
 * 移除其他评论框
 */
function removeAllCommentForm() {
    $(".comment-form").remove();
}

/**
 * 下拉加载底部显示文字生成html
 */
function generateHtml(html) {
    return html;
}

let imgElementArray = [];
let gallery;

/**
 * 大图预览。给大图元素绑定点击事件
 */
function imagePreviewAddEventListener(element) {
    imgElementArray.push(element);
    element.addEventListener('click', event => preview(event));
}

function preview(event) {
    Fancybox.bind("[data-fancybox]", {
        Thumbs: false // 不显示底部图片组
    });
}

/**
 * 移除所有图片大图预览绑定事件
 */
function imagePreviewRemoveAllEventListener() {
    imgElementArray.forEach(e => {
        e.removeEventListener('click', event => preview(event));
    })

    imgElementArray = [];
}

/**
 * pjax请求，追加列表分页
 */
async function pjax(pageIndex, container) {
    let url = globalData.webSiteHomeUrl + '/page/' + pageIndex;
    await axios.get(url).then(async (e) => {
        // 获取新内容
        var domParser = new DOMParser();
        var newContent = domParser.parseFromString(e.data, 'text/html').querySelector(container);

        // 追加到当前列表的最下方
        imagePreviewRemoveAllEventListener();

        var articleContainer = document.querySelector(container);
        articleContainer.appendChild(newContent);

        // 重新绑定图片预览
        let previewImages = document.querySelectorAll('.preview-image');
        previewImages.forEach((element) => {
            imagePreviewAddEventListener(element);
        });
        // 重新绑定互动
        clickHudong();
        // 重新绑定评论
        clickComment();
        // 重新绑定点赞
        clickLike();

        loadQW();
        clickQW();
        clickSS();

        // 异步加载
        lazyLoadInstance.update();
    }).catch(e => {

    });
}

/**
 * 回到顶部
 */
var timeOut;

function scrollToTop() {
    // if (document.body.scrollTop != 0 || document.documentElement.scrollTop != 0) {
    //     window.scrollBy(0, -50);
    //     timeOut = setTimeout('scrollToTop()', 10);
    // } else clearTimeout(timeOut);
    // 使用Anime.js进行平滑滚动
    anime({
        targets: 'html, body',
        scrollTop: 0,
        duration: 300,
        easing: 'linear'
    });
}

/**
 * 加载音乐
 */
function loadAudio(src) {
    globalData.audio.src = src;
    globalData.audio.load();
}

function closeAudio() {
    globalData.audio.pause();
    globalData.audio.src = '';
    globalData.playMusicId = 0;

    refreshAudioUI();
}

/**
 * 播放音乐
 */
function playAudio(cid, src, cover) {
    if (globalData.playMusicId != cid) {
        loadAudio(src);
        globalData.playMusicId = cid;
    }
    globalData.audio.play();

    refreshAudioUI();

    // 隐藏播放按钮，显示暂停按钮
    $("#music-play-" + cid).addClass("hidden");
    $("#music-pause-" + cid).removeClass("hidden");

    // 显示悬浮播放器
    showFixedMusicPlayer(cover);

    showTopMusicPlayUI();

    globalData.isTopMusic = false;

    // 顶部音乐进度归0
    $("#top-music-jdt").css('width', "0rem");
}

/**
 * 显示悬浮播放器
 */
function showFixedMusicPlayer(cover) {
    if ($("#music-modal").is(":hidden")) {
        $("#music-modal").show();
    }

    $("#fixed-music-cover").attr("src", cover);

    fixedMusicPlayerPlayUI();
}

function playAudioOne() {
    globalData.audio.play();
}

/**
 * 暂停音乐
 */
function pauseAudio(cid) {
    globalData.audio.pause();
    // 隐藏暂停按钮，显示播放按钮
    $("#music-play-" + cid).removeClass("hidden");
    $("#music-pause-" + cid).addClass("hidden");

    $("#music-img-" + cid).removeClass("rotate-animation");

    fixedMusicPlayerPauseUI();
}

/**
 * 仅播放音乐。
 */
function pauseAudioOne() {
    globalData.audio.pause();
}

/**
 * 悬浮播放器暂停UI
 */
function fixedMusicPlayerPauseUI() {
    $("#fixed-music-play").show();
    $("#fixed-music-pause").hide();
}
/**
 * 悬浮播放器播放UI
 */
function fixedMusicPlayerPlayUI() {
    $("#fixed-music-play").hide();
    $("#fixed-music-pause").show();
}
/**
 * 刷新播放器UI
 */
function refreshAudioUI() {

    // 隐藏其他文章的播放器播放按钮
    $.each($(".music-play"), function (index, item) {
        $(item).removeClass("hidden");
    });
    $.each($(".music-pause"), function (index, item) {
        $(item).addClass("hidden");
    });

    fixedMusicPlayerPauseUI();
}

/**
 * 打开朋友圈弹框
 */
function showFriendModal() {
    $("#friend-modal").show();
    $("body").addClass("overflow-hidden");
}

/**
 * 关闭朋友圈弹框
 */
function closeFriendModal() {
    $("#friend-modal").hide();
    $("body").removeClass("overflow-hidden");
}
