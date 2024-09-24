(function() {

  const touchScreen = isTouchScreen();

  const shapes = [
    'circle',   'triangle',      'pentagon',      'hexagon',
    'octagon',  'star',          'infinity',      'heart',
    'fish',     'whale',         'drop',          'bean',
    'bicorn',   'hypocycloid:3', 'hypocycloid:4', 'hypocycloid:5',
    'clover:3', 'clover:4',      'clover:5',      'bud:3',
    'bud:5',    'bud:10',        'windmill',      'vase'
  ];

  const allShapes = get('.basic-shapes .shapes');
  if (allShapes) {
    allShapes.innerHTML = shapes.map(shape => {
      let [name, param] = shape.split(':').map(n => n.trim());
      return `
        <div class="shape">
          <css-doodle>
            :doodle {
              @shape: ${ name } ${ param || 1};
              background: #60569e;
            }
          </css-doodle>
          <p class="title">
            ${ param ? `(${ name }, ${ param })` : name }
          </p>
        </div>
      `
    }).join('');
  }

  each('a[name]', link => {
    let a = document.createElement('a');
    a.innerHTML = '#';
    a.href = '#' + link.name;
    link.parentNode.insertBefore(a, link);
  });

  each('.example', example => {
    let textarea = get(example, 'textarea');
    let doodle = get(example, '.container css-doodle');
    if (textarea && doodle) {
      textarea.value = indent(doodle._code || doodle.parentNode.innerHTML || '');
    }
  });

  each('textarea[code]', block => {
    let content = block.value = indent(block.value);
    let sample = document.createElement('div');
    sample.className = 'code-sample';
    block.parentNode.replaceChild(sample, block);

    if (block.dataset.link) {
      let link = document.createElement('a');
      link.className = 'example__link';
      link.text = 'CodePen';
      link.href = block.dataset.link;
      link.target = '_blank';
      link.rel = 'noreferrer';
      sample.appendChild(link);
    }

    if (typeof CodeMirror !== "undefined") {
      CodeMirror(sample, {
        mode: block.getAttribute('code') || 'css',
        value: content,
        readOnly: touchScreen ? 'nocursor' : true,
        cursorBlinkRate: -1,
        theme: '3024-day',
        tabSize: 2
      });
    }
  });

  document.addEventListener('click', e => {
    if (e.target.closest('.example')) {
      e.target.update && e.target.update();
    }
  });


  /* live editor */

  let editor = (() => {
    let doodle = document.createElement('css-doodle');
    doodle.addEventListener('click', e => doodle.update());

    let playground = get('.playground');
    let source = get('.playground .source');
    let container = get('.playground .doodle')
    container.appendChild(doodle);

    if (typeof CodeMirror === 'undefined') {
      return false;
    }

    CodeMirror.keyMap.default['Shift-Tab'] = 'indentLess';
    CodeMirror.keyMap.default['Tab"'] = 'indentMore';

    let editor = CodeMirror(source, {
      value: '',
      mode: 'css',
      insertSoftTab: true,
      theme: '3024-day',
      matchBrackets: true,
      smartIndent: true,
      tabSize: 2
    });

    let lastEditorValue = removeSpaces(editor.getValue());
    let timer = null;
    let delay = 500;

    editor.on('change', function(_, obj) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        let value = removeSpaces(editor.getValue());
        if (lastEditorValue !== value) {
          let current = editor.getValue();
          if (doodle.update) {
            doodle.update(current);
          } else {
            doodle.innerHTML = current;
          }
          lastEditorValue = removeSpaces(current);
        }
      }, delay);
    });

    return {
      setValue(value) {
        delay = 0;
        editor.setValue(value);
        editor.clearHistory();
        delay = 500;
      }
    }
  })();


  /* build switcher */

  const doodles = {
    leaves: indent(`
      :doodle {
        @grid: 8 / 90%;
        @shape: circle;
      }

      transition: .2s @r(.6s);
      border-radius: @pick(100% 0, 0 100%);
      transform: scale(@r(.25, 1.25));

      background: hsla(
        calc(240 - 6 * @x * @y),
        70%, 68%, @r.8
      );
    `),
    lines: indent(`
      @grid: 50x1 / 100%;

      @place: center;
      @size: @iI(*75%);;

      transform: rotate(@i(*5deg));

      border-radius: 30%;
      border: 1px solid hsla(
        @i(*4, 10), 70%, 68%, @r.8
      );
    `),
    dashed: indent(`
      @grid: 15 / 90%;
      border-radius: 50%;
      background: hsl(@t(/20), 70%, 60%);
      scale: sin(@atan2(@dx, @dy) + @ts);
    `),
    tiled: indent(`
      @grid: 1 / 90%;

      @content: @svg(
        viewBox: 0 0 16 16 p 1;
        stroke: #aeacfb;
        stroke-width: .1;
        stroke-linecap: round;
        line*16x16 {
          draw: @r(2s);
          x1, y1, x2, y2: @p(
            @nx(-1) @ny(-1) @nx @ny,
            @nx @ny(-1) @nx(-1) @ny,
            @nx @ny(-1) @nx @ny
          );
        }
      );
    `),
    border: indent(`
      @grid: 14 / 80%;

      @random {
        border-left: 1px solid #5d81bc;
      }
      @random {
        border-top: 1px solid #5d81bc;
      }
      @random(.25) {
        background: linear-gradient(
          @p(#fff, tan, #5d81bc), @lp
        )
        50% / @r(60%) @lr
        no-repeat;
      }
      @random {
        filter: drop-shadow(0 0 10px #fff);
      }
    `),

    bud: indent(`
      @grid: 1 / 70% auto;

      background: radial-gradient(
        pink, yellow, red, red
      );

      mask: @svg-polygon(
        split: 400;
        scale: .7;
        r: cos(7t)^4 + sin(7t) +.3;
      );
    `),

    logo: indent(`
      @grid: 6x1 / 320px auto 1;

      @place: @plot(r: .3; dir: auto -120);
      @size: 50%;

      border-radius: 50%;
      box-shadow: 50px 0 0 -10px
        hsl(calc(360/@I*@i) 90% 60%);
    `),

    pattern: indent(`
      @grid: 1 / 90% / #101935;

      background-image: @pattern(
        grid: 71;
        match(((int(x*y*x*y*7.)>>4)&2) == 2) {
          fill: #F2FDFF;
        }
      );
    `)
  };

  let switcher = get('.switcher');
  if (switcher) {
    let list = Object.keys(doodles).map(n => `<button type="button" aria-label="switch example ${n}" data-name="${n}"></button>`).join('');
    switcher.innerHTML = list;
    switcher.addEventListener('click', e => {
      if (e.target.tagName.toLowerCase() == 'button') {
        let last = get(switcher, '.active');
        if (last == e.target) return false;
        if (last) last.classList.remove('active');
        e.target.classList.add('active');
        let name = e.target.getAttribute('data-name');
        if (name) {
          let selected = doodles[name];
          if (editor) {
            editor.setValue(selected);
          }
        }
      }
    });
  }

  let initial = getDoodleFromUrl();
  if (initial) {
    editor.setValue(initial);
  } else {
    let candidates = Object.keys(doodles);
    let name = candidates[~~(Math.random() * candidates.length)];
    let selected = get(switcher, `button[data-name="${ name }"]`);
    if (selected && editor) {
      selected.classList.add('active');
      /* bug */
      if (name == 'bud') {
        editor.setValue('@grid: 2 / 100%');
        setTimeout(() => {
          editor.setValue(doodles[name]);
        });
      } else {
        editor.setValue(doodles[name]);
      }
    }
  }

  /* Do not focus on textareas with Tab key */
  each('textarea', el => {
    el.setAttribute('tabindex', -1);
  });

  each('.usage .nav > li', el => {
    let a = get(el, 'a');
    let nav = get(el, 'ul').cloneNode(true);
    let name = a.hash.substr(1);
    let container = get('.usage .wrap.' + name);

    let sticky = document.createElement('div');
    sticky.className = 'sticky';
    sticky.appendChild(nav);
    container.appendChild(sticky);
  });

  function resize() {
    let w = window.innerWidth;
    let h = window.innerHeight;
    let size = Math.max(w, h);
    each('.example css-doodle', doodle => {
      doodle.parentNode.parentNode.style.height = h + 'px';
      if ((doodle._code || doodle.innerHTML || '').includes('vmax')) {
        doodle.style.width = doodle.style.height = size + 'px';
      } else {
        doodle.style.width = w + 'px';
        doodle.style.height = h + 'px';
      }
    });
  }

  if (touchScreen) {
    resize();
    window.addEventListener('orientationchange', e => {
      setTimeout(resize, 200);
    });
  }

  function get(root, selector) {
    if (arguments.length == 1) {
      return document.querySelector(root);
    }
    if (arguments.length == 2) {
      return root.querySelector(selector);
    }
  }

  function each(selector, fn) {
    let elements = document.querySelectorAll(selector);
    [].forEach.call(elements, fn);
  }

  function removeSpaces(input) {
    return input.trim().replace(/[\n\t]/g, '');
  }

  function indent(input) {
    let temp = input.replace(/^\n+/g, '');
    let len = temp.length - temp.replace(/^\s+/g, '').length;
    let result = input.split('\n').map(n => (
      n.replace(new RegExp(`^\\s{${len}}`, 'g'), '')
    ));
    return result.join('\n').trim();
  }

  function getDoodleFromUrl() {
    try {
      return decodeURIComponent(
        (window.location.search.substr(1)
          .split('&')
          .filter(n => n.startsWith('d='))[0] || ''
        ).split('=')[1] || ''
      );
    } catch (e) {
      return '';
    }
  }

  function isTouchScreen() {
    if (window.matchMedia) {
      return window.matchMedia("(pointer: coarse)").matches;
    }
    return ('ontouchstart' in window);
  }
}());
