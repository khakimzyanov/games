'use strict';

customElements.define("single-tile", class extends HTMLElement {  
  connectedCallback() {
    this.size = Number (this.parentElement.dataset.size) || 70;
    this.fontSize = Math.round(this.size * 0.4);
    this.render();
  }
  
  static get observedAttributes() {
    return ['data-n', 'data-x', 'data-y'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'data-n':
        this.num = newValue;
        this.setInner();
        break;
      case 'data-x':
        this.x = newValue;
      case 'data-y':
        this.y = newValue;
        this.setCoords();
        break;
    }
  }
  
  render() {
    this.style.width = this.size + 'px';
    this.style.height = this.size + 'px';
    this.style.fontSize = this.fontSize + 'px';
  }
  
  setCoords() {
    this.style.left = this.x + 'px';
    this.style.top = this.y + 'px';
  }
    
  setInner() {
    this.innerHTML = `<div class="tile-inner"
        style="font-size:${this.fontSize}px">${this.num}
      </div>
    `;
  }
});

customElements.define("game-timer", class extends HTMLElement {
  constructor() {
    super();
    this.hour = 0;
    this.min = 0;
    this.sec = 0;
  }

  connectedCallback() {
    this.render();
    this.setAttribute('data-counter', 0);
    this.setAttribute('data-increase', 0);
  }

  render() {
    if (this.sec > 59) {
      this.min++;
      this.sec = 0;
    }
    if (this.min > 59) {
      this.hour++;
      this.min = 0;
    }
    if (this.hour > 23) {
      clearInterval(this.timerID);
      console.log('Timer stopped');
    }
    let h = this.hour < 10 ? '0' + this.hour : this.hour;
    let m = this.min < 10 ? '0' + this.min : this.min;
    let s = this.sec < 10 ? '0' + this.sec : this.sec;
    this.innerHTML = `<span>${h}</span>:<span>${m}</span>:<span>${s}</span>`;
  }

  increase() {
    this.sec++;
    this.render();
  }

  static get observedAttributes() {
    return ['data-timer'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    switch (newValue) {
      case 'start':
        this.timerID = setInterval(() => this.increase(), 1000);
        break;
      case 'stop':
        clearInterval(this.timerID);
        break;
    }
  }
});

function start() {
  const root = document.querySelector(':root');
  const wrapper = document.getElementById('wrapper');
  const box = document.getElementById('box');
  const rotateBtns = Array.from(document.querySelectorAll('.rotate_btn'));
  const timer = document.getElementById('timer');

  let steps = document.getElementById('steps');
  let rotations = document.getElementById('rotations');

  let isComplete = false; // завершена ли игра
  let rotateVal = 0;      // хранит значение поворота поля игры
  let stepCount = 0;      // количество ходов
  let rotateCount = 0;    // количество вращений

  let sz = Number (box.dataset.size)  || 70; // размер одной плитки
  let sp = Number (box.dataset.space) || 4;  // расстояние между плитками
  let qt = Number (box.dataset.qty)   || 4;  // количество плиток

  let boxSize = (sz * qt) + (sp * (qt + 1));
  box.style.width = boxSize + 'px';
  box.style.height = boxSize + 'px';
  
  let coords  = getCoordsTiles();         // массив с координатами
  let map     = placement(coords.flat()); // массив с номерами плиток
  
  const tiles = document.querySelectorAll('.tile');
  
  definePossible();

  /* Возвращает многомерный массив с координатами плиток на поле. */
  function getCoordsTiles() {
    const coords = [];
    for (let i = 0, spY = 1, qtY = 0; i < qt; i++) {
      coords[i] = [];
      let spX = 1; // начальное количество разделителей по оси Х
      let qtX = 0; // начальное количество плиток по оси Х
      for (let j = 0; j < qt; j++) {
        coords[i][j] = [ sp * spX + sz * qtX, sp * spY + sz * qtY ];
        spX++;
        qtX++;  
      }
      spY++;
      qtY++;
    }
    return coords;
  }

  /* Размещает плитки. Возвращает многомерный массив с номерами плиток. */
  function placement(coords) {
    let rand = Array.from(Array(qt**2).keys()).sort(() => Math.random() - 0.5);
    let map = [];
    for (let m = 0, i = 0; m < qt; m++) {
      map[m] = [];
      for (let n = 0; n < qt; n++, i++) {
        let num = rand[i];
        map[m][n] = num;
        if (num == 0) { continue }
        let tile = document.createElement('single-tile');
        tile.classList.add('tile');
        tile.setAttribute('data-x', coords[i][0]);
        tile.setAttribute('data-y', coords[i][1]);
        tile.setAttribute('data-n', num);
        tile.addEventListener('click', moveOnClick);
        box.append(tile);
      }
    }
    return map;
  }

  /* Определяет плитки, которые могут переместиться */
  function definePossible() {
    let numTiles = Object.values(getAround(0)).filter(x => x);
    for (let tile of tiles) {
      if (tile.classList.contains('psb')) {
        tile.classList.remove('psb');
      }
      if (numTiles.includes(Number (tile.dataset.n))) {
        tile.classList.add('psb');
      }
    }
  }

  /* Возвращает плитку с номером `num` */
  function getTile(num) {
    return Array.from(tiles).find(x => x.dataset.n == num);
  }

  /* Возвращает [строка, столбец] плитки с номером `num` */
  function getPosition(num) {
    let row = Math.floor((map.flat().indexOf(num)) / qt);
    let column = map[row].indexOf(num);
    return [row, column];   
  }

  /* Возвращает координаты плитки с номером `num` */
  function getCoords(num) {
    if (num < qt**2) {
      let [row, column] = getPosition(num);
      return coords[row][column];
    }
  }

  /* Возвращает номера плиток вокруг плитки с номером `num` */
  function getAround(num) {
    if (num < qt**2) {
      let [row, column] = getPosition(num);
      return {
        top: (row > 0) ? map[row - 1][column] : undefined,
        bottom: (row < qt - 1) ? map[row + 1][column] : undefined,
        left: (column > 0) ? map[row][column - 1] : undefined,
        right: (column < qt - 1) ? map[row][column + 1] : undefined
      }
    }
  }

  /* Меняет местами плитки с номерами `a` и `b` в карте (массиве) плиток */
  function changeInMap(a, b) {
    for (let i = 0; i < qt; i++) {
      for (let j = 0; j < qt; j++) {
        if (map[i][j] == a) {
          map[i][j] = b;
          continue;
        }
        if (map[i][j] == b) {
          map[i][j] = a
        }
      }
    }
  }

  /* Двигает плитку с номером `num` на пустую ячейку */
  function moveTile(num) {
    timer.setAttribute('data-timer', 'start');
    let [x, y] = getCoords(0);
    let tile = getTile(num);
    tile.dataset.x = x;
    tile.dataset.y = y;
    changeInMap(0, num);
    steps.innerHTML = ++stepCount;
    if (checkComplete()) {
      complete();
      return;
    }
    definePossible();
  }

  /* Событие нажатия клавиш */
  document.addEventListener('keydown', keypress);

  /* Событие при клике на кнопки вращения. */
  rotateBtns.forEach(arrow => {
      arrow.addEventListener('click', function() { rotateBox(this.id) });
    });
    
  /* Смещение плиток при клике */
  function moveOnClick(e) {
    if (isComplete) return;
    let num = Number (this.dataset.n);
    if (Object.values(getAround(num)).includes(0)) {
      moveTile(num);
    }
  }
      
  /* Вращение поля или движение при нажатии клавиш (ctrl+arrow или arrow) */
  function keypress() {
    if (isComplete) return;
    if ((event.ctrlKey || event.metaKey) && event.code == 'ArrowRight') {
      rotateBox('toRight');
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.code == 'ArrowLeft') {
      rotateBox('toLeft');
      return;
    }
    let tiles = getAround(0);
    let num;
    switch (event.code) {
      case 'ArrowUp':
        num = tiles.bottom;
        break;
      case 'ArrowRight':
        num = tiles.left;
        break;
      case 'ArrowDown':
        num = tiles.top;
        break;
      case 'ArrowLeft':
        num = tiles.right;
        break;
    }
    if (num) { moveTile(num) }  
  }

  /* Вращает игровое поле в сторону `to`. */
  function rotateBox(to) {
    if (isComplete) return;
    timer.setAttribute('data-timer', 'start');
    rotateVal = to == 'toRight' ? rotateVal += 90 : rotateVal -= 90;
    box.style.transform = `rotate(${rotateVal}deg)`;
    Array.from(tiles).forEach(tile => {
      tile.style.transform = `rotate(${-rotateVal}deg)`;
    });
    map = rotateArr(map, to);
    coords = rotateArr(coords, to);
    rotations.innerHTML = ++rotateCount;
  }

  /* Вращает массив `arr` в сторону `to`. Возвращает новый массив. */
  function rotateArr(arr, to) {
    if (to === 'toLeft') {
      arr.forEach(x => x.reverse());
    }
    let res = [];
    for (let i = 0, n = 0; i < arr.length; i++) {
      res[i] = [];
      for (let row of arr) {
        res[i].push(row[n])
      }    
      if (to !== 'toLeft') {
        res[i].reverse();
      }
      n++;
    }
    return res;
  }

  /* Проверка на завершение игры */
  function checkComplete() {
    let arr = map.flat().slice(0, -1);
    for (let i = 0, n = 1; i < arr.length; i++, n++)
      if (n != arr[i])
        return false
    return true;
  }

  /* Когда плитки собраны */
  function complete() {
    let title = document.createElement('div');
    title.setAttribute('id', 'complete');
    timer.setAttribute('data-timer', 'stop');
    title.innerText = 'COMPLETE';
    wrapper.append(title);
    rotateBtns.forEach(elem => elem.style.visibility = 'hidden');
    root.style.setProperty('--counter-color', getComputedStyle(root)
      .getPropertyValue('--tile-bg-color'));
    isComplete = true;
  }
}
