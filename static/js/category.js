/* ========================================
   墨影闲谈 - 分类页面脚本
   动态筛选和展示文章
   ======================================== */

(function() {
    'use strict';

    var navData = null;
    var categoryMap = null;
    var postsData = [];

    // 从 data 文件嵌入的 JSON 中读取
    try {
        navData = JSON.parse(document.getElementById('nav-data').textContent);
        categoryMap = JSON.parse(document.getElementById('category-map-data').textContent);
        postsData = JSON.parse(document.getElementById('posts-data').textContent);
    } catch (e) {
        console.error('Failed to parse category data', e);
        return;
    }

    var headerContainer = document.getElementById('category-header');
    var postListContainer = document.getElementById('category-post-list');

    if (!postListContainer) return;

    var currentSection = null;
    var currentSubsection = null;

    // 解析 URL hash
    // hash 格式: "sectionSlug" 或 "sectionSlug-subSlug"
    // 由于 slug 可能包含 "-"（如 game-dev），需要先匹配一级 slug
    function parseHash() {
        var hash = window.location.hash.replace('#', '');
        if (!hash) return;

        currentSection = null;
        currentSubsection = null;

        // 遍历所有一级分类，看 hash 是否以 section.slug 开头
        for (var i = 0; i < navData.length; i++) {
            var section = navData[i];
            if (hash === section.slug) {
                // 精确匹配一级分类
                currentSection = section;
                return;
            }
            if (hash.indexOf(section.slug + '-') === 0) {
                // hash 以 "sectionSlug-" 开头，提取二级 slug
                var subSlug = hash.substring(section.slug.length + 1);
                currentSection = section;
                if (section.children) {
                    for (var j = 0; j < section.children.length; j++) {
                        if (section.children[j].slug === subSlug) {
                            currentSubsection = section.children[j];
                            return;
                        }
                    }
                }
                return; // 一级匹配，但二级没匹配到，也显示一级
            }
        }
    }

    // 渲染分类标题
    function renderHeader() {
        if (!headerContainer) return;

        if (currentSubsection) {
            headerContainer.innerHTML =
                '<h2 class="category-page-title">' + currentSection.name + ' / ' + currentSubsection.name + '</h2>';
        } else if (currentSection) {
            headerContainer.innerHTML =
                '<h2 class="category-page-title">' + currentSection.name + '</h2>';
        } else {
            headerContainer.innerHTML =
                '<h2 class="category-page-title">全部文章</h2>';
        }
    }

    // 匹配文章
    function matchesFilter(post) {
        if (!currentSection) return true; // 全部

        // 兼容 categories 是字符串或数组的情况
        var rawCats = post.categories;
        if (!rawCats) return false;
        var postCats = Array.isArray(rawCats) ? rawCats : [rawCats];

        // 检查是否匹配当前一级分类
        for (var i = 0; i < postCats.length; i++) {
            var cat = postCats[i];
            var map = categoryMap[cat];
            if (map && map[0] === currentSection.slug) {
                if (!currentSubsection) return true; // 匹配一级
                if (map[1] === currentSubsection.slug) return true; // 匹配二级
            }
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

            html += '<article class="post-card glass-card">';
            html += '<a href="' + post.url + '" class="post-card-link">';
            html += '<h3 class="post-card-title">' + post.title + '</h3>';
            if (excerpt) {
                html += '<p class="post-card-excerpt">' + excerpt + '</p>';
            }
            html += '<div class="post-card-meta">';
            html += '<span class="post-card-date">' + post.date + '</span>';
            if (post.categories && post.categories.length > 0) {
                html += '<span class="post-card-cats">';
                for (var j = 0; j < Math.min(post.categories.length, 3); j++) {
                    html += '<span class="cat-tag">' + post.categories[j] + '</span>';
                }
                html += '</span>';
            }
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
