'use strict'

customElements.define("single-tile", class extends HTMLElement {
    constructor() {
        super();
        this.size = 70;
    }

    connectedCallback() {
        this.size = Number(this.parentElement.dataset.size) || this.size;
        this.style.fontSize = Math.round(this.size * 0.4) + 'px';
        this.render();
    }

    static get observedAttributes() {
        return ['data-n', 'data-x', 'data-y'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'data-n':
                this.innerHTML = newValue;
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
});

customElements.define("game-timer", class extends HTMLElement {
    constructor() {
        super();
        this.min = 0;
        this.sec = 0;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (this.sec > 59) {
            this.min++;
            this.sec = 0;
        }
        if (this.min > 59) {
            this.dataset.timer = 'timeIsUp';
        }
        let m = this.min < 10 ? '0' + this.min : this.min;
        let s = this.sec < 10 ? '0' + this.sec : this.sec;
        this.innerHTML = `<span>${m}</span>:<span>${s}</span>`;
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
            case 'timeIsUp':
                clearInterval(this.timerID);
                break;
        }
    }
});

function start() {
    const _root = document.querySelector(':root');
    const _wrapper = document.querySelector('.wrapper');
    const _box = document.querySelector('.box');
    const _timer = document.getElementById('timer');
    const _steps = document.querySelector('.steps');

    const _sz = Number(_box.dataset.size) || 70; // размер одной плитки
    const _sp = Number(_box.dataset.space) || 4;  // расстояние между плитками
    const _qt = Number(_box.dataset.qty) || 4;  // количество плиток

    /* Определяем размеры поля */
    let boxSize = (_sz * _qt) + (_sp * (_qt + 1));
    _box.style.width = boxSize + 'px';
    _box.style.height = boxSize + 'px';

    const _coords = getCoordsTiles(); // массив с координатами
    const _map = shuffleTiles();      // массив с номерами плиток
    const _tiles = placement();       // коллекция плиток (DOM)	

    definePossible();
    _wrapper.style.visibility = 'visible';

    /* Событие нажатия клавиш */
    document.addEventListener('keydown', keypress);
    document.addEventListener('keydown', startTimer);
    document.addEventListener('click', startTimer);

    /* Наблюдатель за таймером. */
    new MutationObserver(x => {
        let tValue = x[0].target.dataset.timer;
        if (tValue == 'stop') {
            gameover('<span style="color:green">COMPLETE</span>');
        }
        if (tValue == 'timeIsUp') {
            gameover('<span style="color:red">TIME IS UP</span>');
        }
    }).observe(document.getElementById('timer'), { attributes: true });

    /* Запускает таймер при первом смещении плитки */
    function startTimer(e) {
        if (e.type == 'click' && e.target.tagName == 'SINGLE-TILE' ||
            e.type == 'keydown' &&
            ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(e.code)) {
            timer.setAttribute('data-timer', 'start');
            document.removeEventListener('keydown', startTimer);
            document.removeEventListener('click', startTimer);
        }
    }

    /* Размещает плитки на поле. Возвращает коллекцию плиток (DOM). */
    function placement() {
        let tiles = [];
        for (let i = 0, n = 0; i < _qt; i++) {
            for (let j = 0; j < _qt; j++) {
                if (_map[i][j]) {
                    let tile = document.createElement('single-tile');
                    tile.classList.add('tile');
                    tile.setAttribute('data-x', _coords[i][j][0]);
                    tile.setAttribute('data-y', _coords[i][j][1]);
                    tile.setAttribute('data-n', _map[i][j]);
                    tile.addEventListener('click', moveOnClick);
                    tiles[n] = tile;
                    _box.append(tile);
                    n++;
                }
            }
        }
        return tiles;
    };

    /* Возвращает многомерный массив с координатами плиток на поле. */
    function getCoordsTiles() {
        let coords = [];
        for (let i = 0, spY = 1, qtY = 0; i < _qt; i++) {
            coords[i] = [];
            let spX = 1; // начальное количество разделителей по оси Х
            let qtX = 0; // начальное количество плиток по оси Х
            for (let j = 0; j < _qt; j++) {
                coords[i][j] = [_sp * spX + _sz * qtX, _sp * spY + _sz * qtY];
                spX++;
                qtX++;
            }
            spY++;
            qtY++;
        }
        return coords;
    }

    /* Возвращает многомерный массив плиток. */
    function shuffleTiles() {
        let set = Array.from(Array(_qt ** 2).keys()).sort(() => Math.random() - 0.5);
        let map = [];
        for (let i = 0, k = 0; i < _qt; i++) {
            map[i] = [];
            for (let j = 0; j < _qt; j++, k++) {
                map[i][j] = set[k];
            }
        }
        return isSolvable(getInvCount(set), getZeroRow(map)) ? map : shuffleTiles();
    }

    /* Возвращает булев тип решаемости раскладки. */
    function isSolvable(invCount, zeroRow) {
        if (_qt % 2) {
            return invCount % 2 ? false : true;
        } else {
            if (invCount % 2) {
                return zeroRow % 2 ? false : true;
            } else {
                return zeroRow % 2 ? true : false;
            }
        }
    }

    /* Возвращает количество инверсий в плоском массиве `arr` (без учета нулей) */
    function getInvCount(arr) {
        let invCount = 0;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == 0) continue;
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[j] == 0) continue;
                if (arr[i] > arr[j]) invCount++;
            }
        }
        return invCount;
    }

    /* Возвращает номер строки с пустой ячейкой в массиве `arr`, считая снизу. */
    function getZeroRow(arr) {
        for (let i = 0, j = arr.length; i < arr.length; i++, j--) {
            if (arr[i].includes(0)) return j;
        }
    }

    /* Определяет плитки, которые могут переместиться */
    function definePossible() {
        let numTiles = Object.values(getAround(0)).filter(x => x);
        for (let tile of _tiles) {
            if (tile.classList.contains('psb')) {
                tile.classList.remove('psb');
            }
            if (numTiles.includes(Number(tile.dataset.n))) {
                tile.classList.add('psb');
            }
        }
    }

    /* Возвращает плитку с номером `num` */
    function getTile(num) {
        return Array.from(_tiles).find(x => x.dataset.n == num);
    }

    /* Возвращает [строка, столбец] плитки с номером `num` */
    function getPosition(num) {
        let row = Math.floor((_map.flat().indexOf(num)) / _qt);
        let column = _map[row].indexOf(num);
        return [row, column];
    }

    /* Возвращает координаты плитки с номером `num` */
    function getCoords(num) {
        if (num < _qt ** 2) {
            let [row, column] = getPosition(num);
            return _coords[row][column];
        }
    }

    /* Возвращает номера плиток вокруг плитки с номером `num` */
    function getAround(num) {
        if (num < _qt ** 2) {
            let [row, column] = getPosition(num);
            return {
                top: (row > 0) ? _map[row - 1][column] : undefined,
                bottom: (row < _qt - 1) ? _map[row + 1][column] : undefined,
                left: (column > 0) ? _map[row][column - 1] : undefined,
                right: (column < _qt - 1) ? _map[row][column + 1] : undefined
            }
        }
    }

    /* Меняет местами плитки с номерами `a` и `b` в карте (массиве) плиток */
    function changeInMap(a, b) {
        for (let i = 0; i < _qt; i++) {
            for (let j = 0; j < _qt; j++) {
                if (_map[i][j] == a) {
                    _map[i][j] = b;
                    continue;
                }
                if (_map[i][j] == b) {
                    _map[i][j] = a
                }
            }
        }
    }

    /* Двигает плитку с номером `num` на пустую ячейку */
    function moveTile(num) {
        let [x, y] = getCoords(0);
        let tile = getTile(num);
        tile.dataset.x = x;
        tile.dataset.y = y;
        changeInMap(0, num);
        _steps.innerText = Number(_steps.innerText) + 1;
        if (checkComplete()) {
            timer.setAttribute('data-timer', 'stop');
            return;
        }
        definePossible();
    }

    /* Смещение плиток при клике */
    function moveOnClick(e) {
        let num = Number(this.dataset.n);
        if (Object.values(getAround(num)).includes(0)) {
            moveTile(num);
        }
    }

    /* Движение плитки при нажатии клавиш стрелок */
    function keypress() {
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

    /* Проверка на завершение игры */
    function checkComplete() {
        let arr = _map.flat().slice(0, -1);
        for (let i = 0, n = 1; i < arr.length; i++, n++)
            if (n != arr[i])
                return false
        return true;
    }

    /* Игра закончена */
    function gameover(inner) {
        document.removeEventListener('keydown', keypress);
        _tiles.forEach(x => x.removeEventListener('click', moveOnClick));
        let title = document.createElement('div');
        title.classList.add('gameover');
        title.innerHTML = inner;
        _wrapper.append(title);
        _root.style.setProperty('--counter-color', getComputedStyle(_root)
            .getPropertyValue('--tile-bg-color'));
        document.querySelectorAll('.psb').forEach(x => x.classList.remove('psb'));
    }
}
