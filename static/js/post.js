/* ========================================
   墨影闲谈 - 文章页脚本
   TOC 自动生成 + 滚动高亮
   ======================================== */

(function() {
    'use strict';

    var tocContainer = document.getElementById('toc');
    var postContent = document.querySelector('.post-content');

    if (!tocContainer || !postContent) return;

    // 收集文章中的标题
    var headings = postContent.querySelectorAll('h2, h3');
    if (headings.length === 0) {
        tocContainer.style.display = 'none';
        return;
    }

    var tocItems = [];

    headings.forEach(function(heading) {
        // 确保每个标题有 id
        if (!heading.id) {
            heading.id = heading.textContent.trim()
                .toLowerCase()
                .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        tocItems.push({
            id: heading.id,
            text: heading.textContent.trim(),
            level: heading.tagName.toLowerCase()
        });
    });

    // 生成 TOC HTML
    var tocHTML = '';
    tocItems.forEach(function(item) {
        var cls = item.level === 'h3' ? 'toc-h3' : '';
        tocHTML += '<a href="#' + item.id + '" class="' + cls + '">' + item.text + '</a>';
    });
    tocContainer.innerHTML = tocHTML;

    // 滚动高亮
    var tocLinks = tocContainer.querySelectorAll('a');
    if (tocLinks.length === 0) return;

    var headingElements = [];
    tocItems.forEach(function(item) {
        var el = document.getElementById(item.id);
        if (el) headingElements.push(el);
    });

    var scrollTimer;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() {
            var scrollPos = window.scrollY + 120;

            var currentIndex = -1;
            for (var i = headingElements.length - 1; i >= 0; i--) {
                if (headingElements[i].offsetTop <= scrollPos) {
                    currentIndex = i;
                    break;
                }
            }

            tocLinks.forEach(function(link) {
                link.classList.remove('active');
            });

            if (currentIndex >= 0 && currentIndex < tocLinks.length) {
                tocLinks[currentIndex].classList.add('active');
            }
        }, 50);
    });
})();
