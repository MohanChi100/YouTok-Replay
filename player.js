var youtubePlayers = [];
var videoIDs = [];
var gesture = 'swipe'

function getQueryParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Get the username from the URL parameter
var username = getQueryParam('username');

var test_uid = username || 'participant_test';

// var videoIDs = [
//     'bg4I_NtOshE', 'Ksg6khWeCL8', 'WMv-yaE4YVg', 'cJVHSBr88o4', '_bFK2d5UDoc',
//     'Pb5UdTEh0l0', 'cugxnHLKo_Y', 'yhZTgFp4uDs', 'tex8V4he3AI', 'l3Y1sWE_Yr8',
// ];
// var youtube_api_key = 'AIzaSyAjSa4cR1Li5cWtE3jChY8piErqi0USjqM'

function currentDate() {
    var d = new Date;
    var dformat = [
            d.getFullYear(),
            d.getMonth()+1,
            d.getDate(),
        ].join('-') + ' ' +
        [
            d.getHours(),
            d.getMinutes(),
            d.getSeconds()
        ].join(':');
    return dformat;
}

function postWatchTime(vid, time, isStart) {
    var fd = new FormData();
    fd.append( 'uid', test_uid );
    fd.append( 'vid', vid);
    if (isStart) {
        fd.append( 'start_time', currentDate());
    }
    else {
        fd.append( 'end_time', currentDate());
    }
    fd.append( 'start_how', gesture);
    fd.append( 'end_how', gesture);

    $.ajax({
        url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
        data: fd,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function(data){
            console.log('Store time in the database: ' + vid + ' ---- ' + currentDate())
        }
    });
}

function postPauseTime(uid, vid, is_pause, time) {
    var fd = new FormData();
    fd.append( 'uid', uid );
    fd.append( 'vid', vid);
    fd.append( 'is_pause', is_pause);
    fd.append( 'time', time);

    $.ajax({
        url: 'https://youtok-api.momochi.me/SavePauseData',
        data: fd,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function(data){
            console.log('Store pause time in the database!')
        }
    });
}

function onYouTubeIframeAPIReady() {
    let w = '100%';
    let h = '100%';

    console.log('iframe ready');

    youtubePlayers = videoIDs.map((id, i) => {
        console.log('video ID : ' + videoIDs[i]);
        var events = {
            onStateChange: onPlayerStateChange,
        };
        if (i === 0) {
            events = {
                ...events,
                onReady: onPlayerReady,
            };
        }

        //store video information - test mode - close
        // var fd = new FormData();
        // fd.append( 'vid', videoIDs[i]);
        // $.ajax({
        //     url: 'https://youtok-api.momochi.me/SaveVideoData',
        //     data: fd,
        //     processData: false,
        //     contentType: false,
        //     type: 'POST',
        //     success: function(data){
        //         console.log('video ID : ' + videoIDs[i] + ' information has been stored');
        //     }
        // });

        return new YT.Player(`player-${i}`, {
            width: w,
            height: h,
            videoId: id,
            playerVars: {
                rel: 0, // Set rel=0 to disable related videos when the player starts.
                showinfo: 0,
                controls: 0,
                playsinline: 1,
                modestbranding: 1,
            },
            events: events,
        });
    });
}

function onPlayerStateChange(e) {
    if (e.data === YT.PlayerState.ENDED) {
        e.target.playVideo();
    }
    // else if (e.data === YT.PlayerState.PAUSED) {
    //     e.target.setOption('rel', 0);
    //     if (e.target.getIframe().nextElementSibling) {
    //         e.target.getIframe().nextElementSibling.style.display = 'none';
    //     }
    // }
}

function onPlayerReady(event) {
    // event.target.mute();
    event.target.playVideo();
    setTimeout(function () {
        event.target.playVideo();
    }, 3000);
}

function showCommentList(vid) {
    $.ajax({
        url: 'https://youtok-api.momochi.me/GetVideoComment',
        data: { 'vid': vid },
        type: 'GET',
        success: function(data) {
            // Assuming data is an array of comments
            var commentList = data;

            var commentHTML = '';
            commentList.forEach(function(comment, index) {
                // commentHTML += '<li class="comment-item">' + comment + '</li>';
                commentHTML += '<li class="comment-item">' +
                    '<div class="comment-header">' +
                    '<img src="' + comment.profile_image_url + '" alt="Profile Photo" class="profile-photo">' +
                    '<span class="author-name">' + comment.author_name + '  '+ comment.publish_date +  '</span>' +
                    '</div>' +
                    '<div class="comment-text">' + comment.comment + '</div>' +
                    '<div class="like-section">' +
                    '<img src="img/like.svg" alt="Like" class="like-icon">' +
                    '<span class="like-count">' + comment.like_count + '      </span>' +
                    '<img src="img/dislike.svg" alt="Dislike" class="other-icon">' +
                    '<img src="img/comment.svg" alt="Comment" class="other-icon">' +
                    '</div>' +
                    '</li>';
            });

            // Add a text input section for comments
            commentHTML += '<div class="comment-input-section">' +
                '<input type="text" id="comment-input" placeholder="Type your comment">' +
                '<button id="comment-submit">' +
                '<img src="img/send.svg" alt="Submit">' +
                '</button>' +
                '</div>';

            $('#comment-list').html(commentHTML);

            $('#commentModal').modal('show');

            $('#comment-submit').click(function () {
                var commentText = $('#comment-input').val();
                if (commentText) {
                    var fd = new FormData();
                    fd.append( 'uid', test_uid );
                    fd.append( 'vid', vid);
                    fd.append( 'new_comment', commentText);
                    $.ajax({
                        url: 'https://youtok-api.momochi.me/SaveUserNewComment',
                        data: fd,
                        processData: false,
                        contentType: false,
                        type: 'POST',
                        success: function(data){
                            console.log('Store a new comment in the database!!!!!')
                        }
                    });
                }
                $('#comment-input').val('');
            });
        },
        error: function(xhr, status, error) {
            console.log('Error:', error);
        }
    });
}

$.ajax({
    // url: 'https://youtok-api.momochi.me/GetLikeVideoList',
    // url: 'https://youtok-api.momochi.me/GetAllVideo',
    // url: 'https://youtok-api.momochi.me/GetVideoIDByCategory', //test_mode
    // url: 'https://youtok-api.momochi.me/GetLikeVideoListByCategory', //test_mode
    url: 'https://youtok-api.momochi.me/GetLikeVideoListInLikeVideoTable',
    data: {'uid': test_uid},
    // data: {'category': 10},
    type: 'GET',
    success: function(data){
        console.log(data);
        videoIDs = data;
        // console.log('video id list: ' + videoIDs);

        // onYouTubeIframeAPIReady();
        videoIDs.forEach((id, i) => {
            $('.swiper-wrapper').append(`
                <div class="swiper-slide">
                    <div class="actions">
                        <img id="like-${i}" src="img/like.svg" />
                        <img id="dislike-${i}" src="img/dislike.svg" />
                        <img id="comment-${i}" src="img/comment.svg" />
                        <img id="share-${i}" src="img/share.svg" />
                    </div>
                    <div id="overlay-${i}" class="overlay"></div>
                    <div id="player-${i}"></div>
                </div>
            `);
            $(`#like-${i}`).click(function () {
                var self = this;
                var fd = new FormData();
                fd.append( 'uid', test_uid );
                fd.append( 'vid', videoIDs[i]);
                // fd.append( 'start_time', video_start_time);
                // fd.append( 'end_time', currentDate());
                fd.append( 'start_how', gesture);
                fd.append( 'end_how', gesture);
                fd.append( 'liked', $(this).attr('class') === 'active' ? 'false' : 'true');
                fd.append( 'liked_datetime', currentDate());
                //when clicking "like", unchecking "dislike"
                $(this).attr('class') === 'active' ? 'false' : $(`#dislike-${i}`).removeClass('active');
                $.ajax({
                    url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
                    data: fd,
                    processData: false,
                    contentType: false,
                    type: 'POST',
                    success: function(data){
                        $(self).toggleClass('active');
                    }
                });
            });
            $(`#dislike-${i}`).click(function () {
                var self = this;
                var fd = new FormData();
                fd.append( 'uid', test_uid );
                fd.append( 'vid', videoIDs[i]);
                // fd.append( 'start_time', video_start_time);
                // fd.append( 'end_time', currentDate());
                fd.append( 'start_how', gesture);
                fd.append( 'end_how', gesture);
                fd.append( 'disliked', $(this).attr('class') === 'active' ? 'false' : 'true');
                fd.append( 'disliked_datetime', currentDate());
                //when clicking "dislike", unchecking "like"
                $(this).attr('class') === 'active' ? 'false' : $(`#like-${i}`).removeClass('active');

                $.ajax({
                    url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
                    data: fd,
                    processData: false,
                    contentType: false,
                    type: 'POST',
                    success: function(data){
                        $(self).toggleClass('active');
                    }
                });
            });
            $(`#comment-${i}`).click(function () {
                // $(this).toggleClass('active');
                showCommentList(videoIDs[i]);
            });
            $(`#share-${i}`).click(function () {
                var self = this;
                var fd = new FormData();
                fd.append( 'uid', test_uid );
                fd.append( 'vid', videoIDs[i]);
                // fd.append( 'start_time', video_start_time);
                // fd.append( 'end_time', currentDate());
                fd.append( 'start_how', gesture);
                fd.append( 'end_how', gesture);
                fd.append( 'shared', $(this).attr('class') === 'active' ? 'false' : 'true');

                $.ajax({
                    url: 'https://youtok-api.momochi.me/SaveVideoInteraction',
                    data: fd,
                    processData: false,
                    contentType: false,
                    type: 'POST',
                    success: function(data){
                        $(self).toggleClass('active');
                    }
                });
            });
            $(`#overlay-${i}`).click(function () {
                if (youtubePlayers[i].getPlayerState() == YT.PlayerState.PAUSED){
                    youtubePlayers[i].playVideo();
                    postPauseTime(test_uid, videoIDs[i], 'false', currentDate())
                }
                else {
                    youtubePlayers[i].pauseVideo();
                    postPauseTime(test_uid, videoIDs[i], 'true', currentDate())
                }
            });
        })

        const swiper = new Swiper('.swiper-container', {
            direction: "vertical",
            // pagination: {
            //     el: '.swiper-pagination',
            // },
            navigation: {
                // nextEl: '.swiper-button-next',
                // prevEl: '.swiper-button-prev',
            },
        });

        swiper.on('transitionStart', function(){
            for (const yt of youtubePlayers) {
                yt.pauseVideo();
            }
            // yt['player1'].pauseVideo();
            // yt['player2'].pauseVideo();
            // yt['player3'].pauseVideo();
        });

        swiper.on('transitionEnd', function(){

            var index = this.realIndex;
            var slide = document.getElementsByClassName('swiper-slide')[index];
            var slideVideo = slide.getElementsByTagName('iframe')[0];
            var slideVideoId = slideVideo.getAttribute('id');

            console.log(index, slide, slideVideo, slideVideoId);

            if(slideVideo != null || slideVideo != undefined){
                // youtubePlayers[index].mute();
                youtubePlayers[index].playVideo();
                // store start_time and end_time
                postWatchTime(videoIDs[index], currentDate(), true);
                if (index != 0)
                    postWatchTime(videoIDs[index - 1], currentDate(), false);
            }
        });

        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";

        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    },
    error: function(xhr, status, error){
        console.log('Error:', error);
    }
});
