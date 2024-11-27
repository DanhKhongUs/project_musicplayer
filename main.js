/**
    1. Render songs
    2. Scroll top
    3. Play / pause / seek
    4. CD rotate
    5. Next / prev
    6. Random
    7. Next / Repeat when ended
    8. Active song
    9. Scroll active song into view
    10. Play song when click
 */

import data from './database/song.js'
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PLAYER_STORAGE_KEY = 'DANH_PLAYER';

const player = $('.player')
const playBtn = $('.btn-toggle-play');
const cd = $('.cd');
const heading = $('header h2');
const cdThumb = $('.cd-thumb');
const audio = $('#audio');
const progress = $('#progress');
const nextBtn = $('.btn-next');
const prevBtn = $('.btn-prev');
const randomBtn = $('.btn-random');
const repeatBtn = $('.btn-repeat');
const playlist = $('.playlist');

// Hiển thị thanh kéo volume
const volumeBtn = $('.btn-volume');
const volumeWrap = $('.volume-wrap');
const volumeRange = $('.volume-range');
const volumeOutput = $('.volume-output');

// Hiển thị option
const optionBtn = $('.option');
const optionList = $('.option-list');

// Bật sáng tối trình duyệt
const themeText = $('.theme-btn span');
const themeIcon = $('.theme-icon');

// favorite box
const favoriteModal = $('.favorite_songs-modal')
const favoriteList = $('.favorite_songs-list')
const emptyList = $('.empty-list')

// Search
const searchBox = $('.search-box')
const searchInput = $('.search-bar')
const searchSongs = $('.search-songs')

const app = {

    //Từ currentIndex này sẽ lấy đcc bài hát đầu tiên của mảng để xử lý
    currentIndex: 0,
    // Cái này dùng để kiểm tra có đang playing hay không
    isPlaying: false,
    // Cái này dùng để kiểm tra đang có random hay không
    isRandom: false,
    // Cái này dùng để kiểm tra xử lý lặp lại song
    isRepeat: false,

    playedSongs: [],

    songs: data.songs,

    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},


    setConfig: function(key, value) {
        this.config[key] = value;
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config))
    },


    // 1. Render song
    render: function() {
        const htmls = this.songs.map((song, index) => {
            return `
                <div class="song ${index === this.currentIndex ? 'active' : ''}" data-index='${index}'>
				<div class="thumb" style="background-image: url('${song.image}');"></div>
				<div class="body">
					<h3 class="title">${song.name}</h3>
					<p class="author">${song.singer}</p>
				</div>
				<div class="option">
					<i class="fas fa-ellipsis-h"></i>
				</div>
			</div>
            `
        })
        playlist.innerHTML = htmls.join('');
    },

    // Hàm này dùng để đỉnh nghĩa phương thức cho các thuộc tính
    defineProperties: function() {
        Object.defineProperty(this, 'currentSong', {
            get: function() {
                return this.songs[this.currentIndex];
            }
        })
    },

    // Hàm này dùng để xử lý
    handleEvents: function() {
        // This này nó là của app
        const _this = this;
        const cdWidth = cd.offsetWidth;

        // Xử lý CD quay / dừng

        const cdThumbAnimate = cdThumb.animate([
            {transform: 'rotate(360deg)'}
        ],{
            duration:10000,
            iterations: Infinity,
        })
        cdThumbAnimate.pause();
        
        // Xử lý phóng to thu nhỏ thẻ cd Scroll Top
        document.onscroll = function() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const newCdWidth = cdWidth - scrollTop;

            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0;
            cd.style.opacity = newCdWidth / cdWidth;
        };

        //#region Play & pause song
        // Xử lý khi click play
        playBtn.onclick = function() {
            if(_this.isPlaying){
                audio.pause();
            }
            else{
                audio.play();
            }
        };
        
        // Khi song được play 
        audio.onplay = function() {
            _this.isPlaying = true;
            player.classList.add('playing');
            cdThumbAnimate.play();
        };
        // Khi song bị pause
        audio.onpause = function() {
            _this.isPlaying = false;
            player.classList.remove('playing');
            cdThumbAnimate.pause();
        };

        //#region Tua song
        // Khi tiến độ bài hát thay đổi
        audio.ontimeupdate = function() {
            if(audio.duration){
                const progressPercent = Math.floor(audio.currentTime / audio.duration * 100)
                progress.value = progressPercent;
            }
        };

        // Xử lý khi tua song 
        progress.oninput = function(e) {
            const seekTime = audio.duration / 100 * e.target.value;
            audio.currentTime = seekTime;
        };


        //#region Next & prev song
        // Khi next song
        nextBtn.onclick = function() {
            if(_this.isRandom){
                _this.playRandomSong();
            }
            else{
                _this.nextSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong();
        };

        // Khi prev song
        prevBtn.onclick = function() {
            if(_this.isRandom){
                _this.playRandomSong();
            }
            else{
                _this.prevSong(); 
            }
            audio.play();
            _this.render();
        };

        //#region Random song
        // Xử lý random bật / tắt random song
        randomBtn.onclick = function() {
            _this.isRandom = !_this.isRandom;
            _this.setConfig('isRandom', _this.isRandom);
            randomBtn.classList.toggle('active', _this.isRandom);
        };


        //#region Repeat song
        // Xử lý lặp lại 1 song
        repeatBtn.onclick = function() {
            _this.isRepeat = !_this.isRepeat;
            _this.setConfig('isRepeat', _this.isRepeat);
            repeatBtn.classList.toggle('active', _this.isRepeat);
        };

        // Xử lý next song khi audio ended
        audio.onended = function() {
            if(_this.isRepeat){
                audio.play();
            }
            else{
                nextBtn.click();
            }
        };

        //#region Click vào playlist
        // Lắng nghe hành vi click vào playlist
        playlist.onclick = function(e) {
            const songNode = e.target.closest('.song:not(.active)') 

            if(songNode || e.target.closest('.option')) {    
                // Xử lý khi click vào song 
                if(songNode){
                    _this.currentIndex = Number(songNode.dataset.index);
                    _this.loadCurrentSong();
                    _this.render();
                    audio.play();
                }
                // Xử lý khi click vào song option
                if(e.target.closest('.option')){

                }

            }
        }

        //#region Bật tắt volume
        // Bật tắt volume
        volumeBtn.onclick = function () {
            volumeWrap.style.display = !Boolean(volumeWrap.style.display) ? 'block' : null
        }
        volumeWrap.onclick = function (e) {
            e.stopPropagation()
        }
        // Drag volume range
        volumeRange.oninput = function (e) {
            audio.volume = e.target.value / 100
            volumeOutput.textContent = e.target.value
            _this.setConfig('volume', e.target.value)
        }

        //Option list
        optionBtn.onclick = function (e) {
            optionList.style.display = !Boolean(optionList.style.display) ? 'block' : null
        }
        optionList.onclick = function (e) {
            // Chuyển mode sáng tối
            if (e.target.closest('.theme-btn')) {
                themeIcon.classList.toggle('fa-sun')
                $('body').classList.toggle('dark')
                themeText.textContent = themeIcon.matches('.fa-sun') ? 'Light mode' : 'Dark mode'
                _this.setConfig('classDark', $('body').className)
                e.stopPropagation()
            } else {
                // Mở box favorite song
                favoriteModal.style.display = 'flex'
                $('body').style.overflow = 'hidden'
                emptyList.style.display = favoriteList.childElementCount > 0 ? 'none' : null
            }
        }

        // #region Favorite songs
        // Xử lý bấm vào nút close và ra ngoài thì đóng favorite box
        favoriteModal.onclick = function (e) {
            if (e.target.matches('.favorite_songs-close') || e.target.matches('.favorite_songs-modal')) {
                favoriteModal.style.display = null
                $('body').style.overflow = null
            } else {
                playlist.onclick(e)
            }
            emptyList.style.display = favoriteList.childElementCount > 0 ? 'none' : null
        }

        // Click outside then close the opening box
        document.onclick = function (e) {

            if (!e.target.closest('.option')) {
                optionList.style.display = null
            }
            if (!e.target.closest('.btn-volume')) {
                volumeWrap.style.display = null
            }
            if (!e.target.closest('.search-box')) {
                searchSongs.style.display = null
                searchInput.setAttribute('style', 'border-bottom-right-radius: null; border-bottom-left-radius: null')
            }
        }
       
    },

    loadCurrentSong: function() {

        heading.textContent = this.currentSong.name;
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`
        audio.src = this.currentSong.path;

        console.log(heading, cdThumb, audio);
    },

    loadConfig: function(){
        this.isRandom = this.config.isRandom;
        this.isRepeat = this.config.isRepeat;
    },
    
    nextSong: function() {
        this.currentIndex++;
        if(this.currentIndex >= this.songs.length){
            this.currentIndex = 0;
        }
        this.loadCurrentSong();
    },

    prevSong: function() {
        this.currentIndex--;
        if(this.currentIndex < 0){
            this.currentIndex = this.songs.length - 1;
        }
        this.loadCurrentSong();
    },

    playRandomSong: function () {
        let newIndex;

        if (this.playedSongs.length === this.songs.length) {
            this.playedSongs = [];
        }

        do {
            newIndex = Math.floor(Math.random() * app.songs.length);
        } while (this.playedSongs.includes(newIndex));

        this.playedSongs.push(newIndex);
        this.currentIndex = newIndex;
        this.loadCurrentSong();
    },

    scrollToActiveSong: function(){
        setTimeout(() => {
            $('.song.active').scrollIntoView({
                behavior: 'smooth',
                block: 'center',  // start, center, nearest
            })
        },300)
    },

    // Khi chạy trình duyệt hàm này sẽ start đầu tiên
    start: function() {
        //Gán cấu hình từ config vào ứng dụng
        this.loadConfig()

        //Định nghĩa các thuộc tính cho object
        this.defineProperties();

        //Lắng nghe sử lý các sự kiện vào UI khi chạy ứng dụng
        this.handleEvents();

        //Tải thông tin bài hát đầu tiên
        this.loadCurrentSong();
        
        //Render lại playlist
        this.render();

        // Hiển thị trạng thái ban đầu của button repeat và random
        randomBtn.classList.toggle('active', this.isRandom);
        repeatBtn.classList.toggle('active', this.isRepeat);
    }
}
// này là gọi ra hàm start
app.start();