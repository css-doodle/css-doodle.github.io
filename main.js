(function() {

  const shapes = [
    'circle',        'triangle',      'rhombus',       'pentagon',
    'hexagon',       'heptagon',      'octagon',       'cross',
    'star',          'diamond',       'infinity',      'heart',
    'fish',          'whale',         'drop',          'bean',
    'hypocycloid:3', 'hypocycloid:4', 'hypocycloid:5', 'hypocycloid:6',
    'bicorn',        'clover:3',      'clover:4',      'clover:5',
    'bud:3',         'bud:4',         'bud:5',         'bud:10'
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
    let container = get(example, '.container');
    if (textarea && container) {
      textarea.value = indent(container.innerHTML);
    }
  });

  each('textarea[code]', block => {
    let content = block.value = indent(block.value);
    let sample = document.createElement('div');
    sample.className = 'code-sample';
    block.parentNode.replaceChild(sample, block);
    if (typeof CodeMirror !== "undefined") {
      CodeMirror(sample, {
        mode: block.getAttribute('code') || 'css',
        value: content,
        readOnly: ('ontouchstart' in window) ? 'nocursor' : true,
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
            doodle.innerHTML = current;
            doodle.update(current);
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

      will-change: transform;
      transform: scale(@r(.25, 1.25));

      background: hsla(
        calc(240 - 6 * @row * @col),
        70%, 68%, @r.8
      );
    `),
    lines: indent(`
      @grid: 50x1 / 80%;

      @place-cell: center;
      @size: calc(100% / @size * @i);

      transform: rotate(calc(@i * 5deg));

      border-radius: 30%;
      border: 1px solid hsla(
        calc(10 + 4 * @i), 70%, 68%, @r.8
      );
    `),
    triangles: indent(`
      :doodle {
        @grid: 9 / 85%;
        @shape: circle;
      }

      transition: .4s @r(.6s);
      transform: rotate(@r(360deg));
      @shape: triangle;

      --n: calc(
          @abs(@abs(@row - 5)
        + @abs(@col - 5) - 9) / 9
      );

      background: hsla(
        calc(var(--n) * 360 + 120),
        60%, 68%, var(--n)
      );
    `),
    dashed: indent(`
      @grid: 1x10 / 85%;

      @place-cell: center;
      @size: calc(@i * 10%);

      border-radius: 50%;
      border-style: dashed;
      border-width: calc(@i * 4px);
      border-color: hsla(
        calc(20 * @i), 70%, 68%,
        calc(3 / @i * .8)
      );

      transform: rotate(@r(360deg));
    `),
    tiled: indent(`
      /* PRINT 10 */

      @grid: 16 / 320px;

      @size: 1px calc(141.4% + 1px);
      transform: rotate(@p(±45deg));
      background: #AEACFB;
      margin: auto;
    `),
    border: indent(`
      @grid: 20 / 80%;

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
        50% 50% / @r(60%) @lr
        no-repeat;
      }
      @random {
        filter: drop-shadow(0 0 10px #fff);
      }
    `)
  };

  let switcher = get('.switcher');
  if (switcher) {
    let list = Object.keys(doodles).map(n => `<li data-name="${n}">`).join('');
    switcher.innerHTML = list;
    switcher.addEventListener('click', e => {
      if (e.target.tagName.toLowerCase() == 'li') {
        let last = get(switcher, '.active');
        if (last == e.target) return false;
        if (last) last.classList.remove('active');
        e.target.classList.add('active');
        let name = e.target.getAttribute('data-name');
        if (name) {
          let selected = doodles[name];
          editor.setValue(selected);
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
    let selected = get(switcher, `li[data-name="${ name }"]`);
    if (selected) {
      selected.classList.add('active');
      editor.setValue(doodles[name]);
    }
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

}());
