/* ========================================
   墨影闲谈 - 主脚本
   ======================================== */

(function() {
    'use strict';

    // ===== 主题切换 =====
    var THEME_KEY = 'hummerstudio-theme';
    var htmlEl = document.documentElement;

    // 初始化主题：优先 localStorage，否则默认深色
    (function initTheme() {
        var saved = localStorage.getItem(THEME_KEY);
        if (saved === 'light') {
            htmlEl.setAttribute('data-theme', 'light');
        }
    })();

    function toggleTheme() {
        var current = htmlEl.getAttribute('data-theme');
        var next = current === 'light' ? 'dark' : 'light';
        if (next === 'light') {
            htmlEl.setAttribute('data-theme', 'light');
        } else {
            htmlEl.removeAttribute('data-theme');
        }
        localStorage.setItem(THEME_KEY, next);
    }

    var themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // 移动端导航切换
    var navToggle = document.querySelector('.nav-toggle');
    var siteNav = document.querySelector('.site-nav');
    var navItems = document.querySelectorAll('.nav-item.has-sub');

    if (navToggle && siteNav) {
        navToggle.addEventListener('click', function() {
            siteNav.classList.toggle('open');
            var isOpen = siteNav.classList.contains('open');
            var spans = navToggle.querySelectorAll('span');
            if (isOpen) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // 移动端子菜单展开
    navItems.forEach(function(item) {
        var link = item.querySelector(':scope > a');
        if (link && window.innerWidth <= 768) {
            link.addEventListener('click', function(e) {
                var subNav = item.querySelector('.sub-nav');
                if (subNav) {
                    e.preventDefault();
                    item.classList.toggle('open');
                }
            });
        }
    });

    // 回到顶部
    var scrollTopBtn = document.querySelector('.scroll-top');
    if (scrollTopBtn) {
        var scrollTimer;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function() {
                if (window.scrollY > 400) {
                    scrollTopBtn.classList.add('visible');
                } else {
                    scrollTopBtn.classList.remove('visible');
                }
            }, 50);
        });
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 窗口大小变化时重置子菜单
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navItems.forEach(function(item) {
                item.classList.remove('open');
            });
        }
    });
})();
