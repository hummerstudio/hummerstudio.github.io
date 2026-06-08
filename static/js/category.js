/* ========================================
   墨影闲谈 - 分类页面脚本
   按 category slug 直接筛选文章
   ======================================== */

(function() {
    'use strict';

    var navData = null;
    var postsData = [];

    try {
        navData = JSON.parse(document.getElementById('nav-data').textContent);
        postsData = JSON.parse(document.getElementById('posts-data').textContent);
    } catch (e) {
        console.error('Failed to parse data', e);
        return;
    }

    var headerContainer = document.getElementById('category-header');
    var postListContainer = document.getElementById('category-post-list');

    if (!postListContainer) return;

    var currentSlug = null;

    // 解析 URL hash: hash 就是分类 slug
    function parseHash() {
        var hash = window.location.hash.replace('#', '');
        currentSlug = hash || null;
    }

    // 根据 slug 获取分类名称
    function getCategoryName(slug) {
        for (var i = 0; i < navData.length; i++) {
            if (navData[i].slug === slug) return navData[i].name;
        }
        return slug;
    }

    // 渲染分类标题
    function renderHeader() {
        if (!headerContainer) return;
        if (currentSlug) {
            headerContainer.innerHTML =
                '<h2 class="category-page-title">' + getCategoryName(currentSlug) + '</h2>';
        } else {
            headerContainer.innerHTML =
                '<h2 class="category-page-title">全部文章</h2>';
        }
    }

    // 匹配文章：post.categories 中包含当前 slug
    function matchesFilter(post) {
        if (!currentSlug) return true;

        var rawCats = post.categories;
        if (!rawCats) return false;
        var postCats = Array.isArray(rawCats) ? rawCats : [rawCats];

        for (var i = 0; i < postCats.length; i++) {
            if (postCats[i] === currentSlug) return true;
        }
        return false;
    }

    // 渲染文章列表
    function renderPosts() {
        var filtered = postsData.filter(matchesFilter);

        if (filtered.length === 0) {
            postListContainer.innerHTML = '<div class="empty-state"><p>该分类下暂无文章。</p></div>';
            return;
        }

        var html = '';
        for (var i = 0; i < filtered.length; i++) {
            var post = filtered[i];
            var excerpt = post.excerpt || post.content || '';
            excerpt = excerpt.replace(/<[^>]*>/g, '').substring(0, 180);

            // 生成分类标签
            var catTags = '';
            var rawCats = post.categories;
            if (rawCats) {
                var postCats = Array.isArray(rawCats) ? rawCats : [rawCats];
                catTags += '<span class="post-card-cats">';
                for (var j = 0; j < postCats.length && j < 2; j++) {
                    catTags += '<span class="cat-tag">' + getCategoryName(postCats[j]) + '</span>';
                }
                catTags += '</span>';
            }

            html += '<article class="post-card glass-card">';
            html += '<a href="' + post.url + '" class="post-card-link">';
            html += '<h3 class="post-card-title">' + post.title + '</h3>';
            if (excerpt) {
                html += '<p class="post-card-excerpt">' + excerpt + '</p>';
            }
            html += '<div class="post-card-meta">';
            html += '<span class="post-card-date">' + post.date + '</span>';
            html += catTags;
            html += '</div>';
            html += '</a>';
            html += '</article>';
        }
        postListContainer.innerHTML = html;
    }

    // 更新所有
    function updateAll() {
        renderHeader();
        renderPosts();
    }

    // 初始化
    parseHash();
    updateAll();

    // 监听 hash 变化
    window.addEventListener('hashchange', function() {
        parseHash();
        updateAll();
    });
})();
