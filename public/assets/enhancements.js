(function() {

  // Space optimisations
  var doc = document;
  var elem = doc.querySelector.bind(doc);
  var create = doc.createElement.bind(doc);

  // Run callback when DOM is ready
  function DOMReady(fn) {

    // Run now if DOM has already loaded as we're loading async
    if(['interactive', 'complete'].indexOf(doc.readyState) >= 0) {
      fn();

    // Otherwise wait for DOM
    } else {
      doc.addEventListener('DOMContentLoaded', fn);
    }
  }

  // Feature tester
  function FeatureTester(tests) {
    var self = this;

    self.tests = tests;

    self.test = function(features) {
      if(!features || !features.length) {
        return false;
      }
      return features.every(function(feature) {
        return self.tests[feature];
      });
    }
  }

  // Init once, don't re-detect features each time
  var supports = new FeatureTester({
    localStorage: (function() {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    inlineSVG: (function() {
      var div = create('div');
      div.innerHTML = '<svg/>';
      return (
        typeof SVGRect != 'undefined'
        && div.firstChild
        && div.firstChild.namespaceURI
      ) == 'http://www.w3.org/2000/svg';
    })(),
    querySelector: typeof doc.querySelector === 'function',
    classList: (function() {
      var div = create('div');
      div.innerHTML = '<svg/>';
      return 'classList' in div.firstChild;
    })(),
  });

  // Favourite nodes
  var favouriteNodes = {

    // Key used in localStorage
    storageKey: 'heartedNodes',

    // Url to heart SVG
    heartPath: '/assets/heart.svg',

    // Class added to heart SVG element when active
    activeClass: 'hearted',

    // Gets current node hash
    getCurrentNode: function() {
      var node = /^\/node\/([a-zA-Z0-9]+)/.exec(window.location.pathname);
      return node ? node[1] : node;
    },

    // Gets current node title
    getCurrentNodeTitle: function() {
      return elem('h2.node-title .name').innerText;
    },

    // Gets hearted nodes
    getHeartedNodes: function() {
      return JSON.parse(localStorage.getItem(favouriteNodes.storageKey)) || {};
    },

    // Saves hearted nodes
    saveHeartedNodes: function(heartedNodes) {
      return localStorage.setItem(favouriteNodes.storageKey, JSON.stringify(heartedNodes));
    },

    // Checks if node is hearted
    isHearted: function(node) {
      return typeof favouriteNodes.getHeartedNodes()[node] !== 'undefined';
    },

    // Heart node
    heart: function(node) {
      var heartedNodes = favouriteNodes.getHeartedNodes();
      heartedNodes[node] = favouriteNodes.getCurrentNodeTitle();
      favouriteNodes.saveHeartedNodes(heartedNodes);
      favouriteNodes.updateHeartedNodesList();
      return heartedNodes;
    },

    // Unheart node
    unHeart: function(node) {
      var heartedNodes = favouriteNodes.getHeartedNodes();
      delete heartedNodes[node];
      favouriteNodes.saveHeartedNodes(heartedNodes);
      favouriteNodes.updateHeartedNodesList();
      return heartedNodes;
    },

    // Get list of hearted nodes
    updateHeartedNodesList: function() {
      var menu = elem('.menu');
      if(!menu) {
        return false;
      }
      var list = '<ul>';
      var heartedNodes = favouriteNodes.getHeartedNodes();
      Object.keys(heartedNodes).forEach(function(node) {
        list += '<li><a href="/node/' + node + '">' + heartedNodes[node] + '</a></li>';
      });
      list += '</ul>';
      return menu.innerHTML = list;
    },

    // Load SVG, run callback when loaded
    loadSVG: function(cb) {

      // Get heart SVG
      var xhr = new XMLHttpRequest();
      xhr.open('GET', favouriteNodes.heartPath);
      xhr.addEventListener('load', function() {

        // Create heart SVG elem
        var div = create('div');
        div.innerHTML = xhr.responseText;
        var heartEl = div.firstChild;

        // Show heart as active if we've already hearted this node
        var node = favouriteNodes.getCurrentNode();
        if(favouriteNodes.isHearted(node)) {
          heartEl.classList.add(favouriteNodes.activeClass);
        }

        // Add click handler
        heartEl.addEventListener('click', function() {

          // Heart/unheart node
          var node = favouriteNodes.getCurrentNode();
          if(favouriteNodes.isHearted(node)) {
            heartEl.classList.remove(favouriteNodes.activeClass);
            favouriteNodes.unHeart(node);
          } else {
            heartEl.classList.add(favouriteNodes.activeClass);
            favouriteNodes.heart(node);
          }
        });

        // Run callback
        cb(heartEl);
      });
      xhr.send();
    },

    // Initiate node favouriting
    init: function() {

      // Start loading heart SVG before DOM
      favouriteNodes.loadSVG(function(heartEl) {

        // Then inject into DOM when it's ready
        DOMReady(function() {
          var titleEl = elem('h2.node-title');
          if(titleEl) {
            titleEl.insertBefore(heartEl, titleEl.firstChild);
          }
        });
      });

      // Inject elems into DOM
      DOMReady(function() {
        var headerHeight = elem('.title').offsetHeight;
        var headerBoxShadow = 3;

        // Menu button
        var menuButton = create('div');
        menuButton.classList.add('menu-button');
        menuButton.style.height = headerHeight + 'px';
        elem('header .wrapper').appendChild(menuButton);

        // Menu
        var menu = create('div');
        menu.classList.add('menu');
        menu.style.top = (headerHeight + headerBoxShadow) + 'px';
        menu.style.height = 'calc(100% - ' + (headerHeight + headerBoxShadow) + 'px)';
        document.body.appendChild(menu);
        favouriteNodes.updateHeartedNodesList();
      });

      // If current node is hearted
      var node = favouriteNodes.getCurrentNode();
      if(favouriteNodes.isHearted(node)) {

        // Heart it again so we get the new name if it's updated
        favouriteNodes.heart(node);
      }
    }
  };

  // Init favourite nodes
  if(supports.test(['localStorage', 'inlineSVG', 'querySelector', 'classList'])) {
    favouriteNodes.init();
  }

  // Add ios class to body on iOS devices
  if(supports.test(['classList'])) {
    DOMReady(function() {
      if(
        /iPad|iPhone|iPod/.test(navigator.userAgent)
        && !window.MSStream
        && doc.body.classList
      ) {
        doc.body.classList.add('ios');
      }
    });
  }

})();
