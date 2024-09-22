(function() {
  /* Хранит состояние игры  */
  const TETRIS = {
    delay: 600, // задержка перед каждым смещением вниз
    state: 'start', // состояние игры (start, play, pause)
    score: 0, // количество очков
    speed: 1, // показатель скорости
    rcells: [], // массив ячеек DOM (реальные ячейки)
    vcells: [], // массив ячеек состояния игры (виртуальные ячейки)
    shape: [], // двумерный массив текущей фигуры
    nextShape: [], // двумерный массив следующей фигуры
    currentShape: [] // координаты текущей фигуры в поле [строка, столбец]
  }

  /* Массив возможных фигур. */
  const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]], // L
    [[0, 1, 1], [1, 1, 0]], // S
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 0], [0, 1, 1]]  // Z
  ];

  /* Создание игрового поля. */
  for (let i = -4; i < 20; i++) {
    let viewbox = document.getElementById('viewbox');
    let row = document.createElement('div');
    row.classList.add('row');
    let rline = [];
    let vline = [];
    for (let j = 0; j < 10; j++) {
      let cell = document.createElement('div');
      cell.classList.add('cell');
      if (i < 0) {
        cell.classList.add('invisible');
      }
      cell.dataset.r = 0;
      rline.push(cell);
      vline.push(0);
      row.append(cell);
    }
    TETRIS.rcells.push(rline);
    TETRIS.vcells.push(vline);
    viewbox.append(row);
  }

  document.addEventListener('click', btnPress);
  document.addEventListener('keydown', keyPress);

  defineNextShape();

  /* Запуск игры. */
  function start() {
    TETRIS.timerID = setTimeout(function go() {
      if (!drop()) {
        clean();
        if (!append()) {
          gameover();
          return;
        }
      }
      TETRIS.timerID = setTimeout(go, TETRIS.delay);
    }, TETRIS.delay);
  }

  /* Игра закончена. */
  function gameover() {
      document.removeEventListener('click', btnPress);
      document.removeEventListener('keydown', keyPress);
      let shadow = document.createElement('div');
      let popap = document.createElement('div');
      popap.innerText = 'GAME OVER';
      shadow.classList.add('shadow');
      shadow.append(popap);
      document.getElementById('tetris').append(shadow);
  }

  /* Наблюдатель за количеством очков. Каждые 5k очков увеличивается скорость. */
  new MutationObserver(x => {
    let score = Number (x[0].target.innerText);
    if (!(score % 5000) && TETRIS.speed < 9) {
      if (TETRIS.delay > 400) {
        TETRIS.delay -= 50;
      }
      TETRIS.delay -= 50;
      TETRIS.speed++;
      document.getElementById('speed').innerText = TETRIS.speed;
    }
  }).observe(document.getElementById('score'), { childList: true });

  /* Определяет и запускает событие при клике на кнопку. */
  function btnPress(event) {
    let btn = document.getElementById('btn');
    let target = event ? event.target : btn;
    if (target.id === 'btn') {
      switch (TETRIS.state) {
        case 'start':
          TETRIS.state = 'play';
          append();
          start();
          break;
        case 'play':
          TETRIS.state = 'pause';
          clearTimeout(TETRIS.timerID);
          break;
        case 'pause':
          TETRIS.state = 'play';
          start();
          break;
      }
      btn.innerText = TETRIS.state === 'play' ? 'Pause' : 'Play';
      btn.style.backgroundColor = TETRIS.state === 'play' ? '#C2AF84' : '';
    }
  }

  /* Определяет и запускает событие при нажатии клавиш. */
  function keyPress(event) {
    if (event.code === 'Space') {
      btnPress();
      return;
    }
    if (TETRIS.state === 'play') {
      switch (event.code) {
        case 'ArrowUp':
          rotate();
          break;
        case 'ArrowLeft':
          shift('left');
          break;
        case 'ArrowRight':
          shift('right');
          break;
        case 'ArrowDown':
          drop();
      } 
    }
  }

  /* Изображает на поле 'TETRIS.rcells' ячейки 'TETRIS.vcells'. */
  function render() {
    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 10; j++) {
        let vcell = TETRIS.vcells[i][j];
        let rcell = TETRIS.rcells[i][j];
        if (vcell != rcell.dataset.r) {
          rcell.dataset.r = vcell;
        }
      }
    }
  }

  /* Определяет и показывает следующую фигуру. */
  function defineNextShape() {
    let nextShapeBox = document.getElementById('nextShape')
    let wrapper = nextShapeBox.getElementsByTagName('div')[0];
    wrapper.innerHTML = '';
    updateShape(TETRIS.nextShape, getShape(getRandomInt(0, 3)));
    for (let i = 0; i < TETRIS.nextShape.length; i++) {
      let row = document.createElement('div');
      row.classList.add('row');
      for (let j = 0; j < TETRIS.nextShape[i].length; j++) {
        let cell = document.createElement('div');
        cell.classList.add('cell');
        if (TETRIS.nextShape[i][j]) {
          cell.classList.add('next');       
        }
        row.append(cell);
      }
      wrapper.append(row);
    }
  }

  /* Добавляет новую фигуру в игровое поле. */
  function append() {
    if (TETRIS.vcells[4].includes(1)) {
      return false;
    }
    updateShape(TETRIS.shape, TETRIS.nextShape);
    defineNextShape();
    let top = 5 - TETRIS.shape.length;
    let left = 4;
    for (let i = 0, n = 0; i < TETRIS.shape.length; i++, top++) {
      for (let j = 0; j < TETRIS.shape[i].length; j++) {
        if (TETRIS.shape[i][j]) {
          TETRIS.vcells[top][left + j] = 2;
          TETRIS.currentShape[n] = [top, left + j];
          TETRIS.rcells[top][left + j].dataset.r = 2;
          n++;
        }
      }
    }
    return true;
  }

  /* Удаляет заполниевшиеся горизонтальные ряды. */
  function clean() {
    let qty = 0;
    for (let i = 0; i < TETRIS.vcells.length; i++) {
      if (!TETRIS.vcells[i].includes(0)) {
        TETRIS.vcells.splice(i, 1);
        TETRIS.vcells.splice(4, 0, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        render();
        qty++;
      }
    }
    if (qty && TETRIS.score <= 1000000000) {
      document.getElementById('score').innerText
        = TETRIS.score += [,100, 300, 700, 1500][qty];
    }
  }

  /* Сдвигает 'TETRIS.currentShape' в сторону `aside` на одну клетку. */
  function shift(aside) {
    let num = (aside == 'right') ? 1 : -1;
    for (let cell of TETRIS.currentShape) {
      if ((aside == 'right') && (cell[1]) == 9 ||
          (aside == 'left') && (cell[1]) == 0 ||
          (TETRIS.vcells[cell[0]][cell[1] + num]) == 1) {
            return;
          }
    }
    let points = getExtremePointsShape();
    moveShape(points.top, points.left + num); 
  }

  /* Опускает 'TETRIS.currentShape' вниз на одну строку. */
  function drop() {
    let point = getExtremePointsShape()
    for (let cell of TETRIS.currentShape) {   
      let nextRow = TETRIS.vcells[cell[0] + 1];
      if (!nextRow || nextRow[cell[1]] == 1) {
        for (let cell of TETRIS.currentShape) {
          TETRIS.rcells[cell[0]][cell[1]].dataset.r = 1;
          TETRIS.vcells[cell[0]][cell[1]] = 1;
        }
        return false;
      }
    }
    moveShape(point.top + 1, point.left);
    return true;
  }

  /* Вращает 'TETRIS.currentShape' вправо. */
  function rotate() {
    let rotated = rotateArr(TETRIS.shape);
    let points = getExtremePointsShape(); 
    let row = points.bottom - rotated.length + 1;
    let column = ((points.right + (TETRIS.shape.length - rotated.length)) > 9)
      ? 10 - TETRIS.shape.length
      : points.left;
    for (let i = 0, r = row; i < rotated.length; i++, r++) {
      for (let j = 0, c = column; j < rotated[i].length; j++, c++) {
        if (rotated[i][j]) {
          if (TETRIS.vcells[r][c] == 1) {
            return false;
          }
        }
      }
    }
    updateShape(TETRIS.shape, rotated);
    moveShape(row, column);
  }

  /* 
   * Перемещает фигуру по игровому полю (`top`, `left` - координаты вставки). 
   * Вносит в массив 'TETRIS.currentShape' координаты места вставки.
   * Отрисовывает 'TETRIS.currentShape' на поле 'TETRIS.rcells'.
   */
  function moveShape(top, left) {
    // стираем текущую фигуру
    for (let cell of TETRIS.currentShape) {
      TETRIS.rcells[cell[0]][cell[1]].dataset.r = 0;
      TETRIS.vcells[cell[0]][cell[1]] = 0;
    }
    // ставим фигуру 'TETRIS.shape' на новое место
    for (let i = 0, n = 0; i < TETRIS.shape.length; i++, top++) {
      for (let j = 0; j < TETRIS.shape[i].length; j++) {
        if (TETRIS.shape[i][j]) {
          TETRIS.vcells[top][left + j] = 2;
          TETRIS.currentShape[n] = [top, left + j];
          TETRIS.rcells[top][left + j].dataset.r = 2;
          n++;
        }
      }
    }
  }

  /* Возвращает координаты крайних точек фигуры 'TETRIS.currentShape'. */
  function getExtremePointsShape() {
    let points = { top: 23, right: 0, bottom: 0, left: 9 }
    for (let cell of TETRIS.currentShape) {
      if (cell[0] < points.top)    points.top    = cell[0];
      if (cell[0] > points.bottom) points.bottom = cell[0];
      if (cell[1] > points.right)  points.right  = cell[1];
      if (cell[1] < points.left)   points.left   = cell[1];
    }
    return points;
  }

  /* Перезаписывает массив `shape` из массива `arr`. */
  function updateShape(shape, arr) {
    shape.splice(0, shape.length);
    for (let i = 0; i < arr.length; i++) {
      shape[i] = [];
      for (let j = 0; j < arr[i].length; j++) {
        shape[i][j] = arr[i][j];
      }
    }
  }

  /* Возвращает двумерный массив (фигуру) повернутую `rotate` раз. */
  function getShape(rotate=0) {
    let shape = SHAPES[getRandomInt(0, SHAPES.length - 1)]
    if (rotate) {
      for (let i = 0; i < rotate; i++) {
        shape = rotateArr(shape);
      }
    }
    return shape;
  }

  /* Вращает массив `arr`. */
  function rotateArr(arr) {
    let len = arr.reduce((max, elem) => elem.length > max ? elem.length : max, 0);
    let rotated = [];
    for (let i = 0; i < len; i++) {
      rotated[i] = [];
      for (let j = 0; j < arr.length; j++) {
        rotated[i].push(arr[j][i]);
      }
      rotated[i].reverse();
    }
    return rotated;
  }

  /* Возвращает случайное число от `min` до `max` включительно. */
  function getRandomInt(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
  }
})();