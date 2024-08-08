'use strict'

class Gamer {

	p1 = [];        // кол-во однопалубных
	p2 = [];        // кол-во двупалубных
	p3 = [];        // кол-во трехпалубных
	p4 = [];        // кол-во четырехпалубных
	shipList = [];  // массив всех занятых ячеек
	restShip = [];  // массив оставшихся ячеек (с кораблями)
	damage = {};    // поврежденные	
	possible = [];  // возможные ячейки (при повреждении)

	constructor(id) {
		this.name = id;
		this.root = document.getElementById(id);
		this.map = this.root.querySelector('.map');
		this.ncells = this.createField();
		this.panel = this.createStatusbar();
	}

	/**
	 * Формирует поле с ячейками и возвращает массив ячеек со значениями от 1 до 100.
	 */
	createField() {
		let number = 0;
		let cells = [];
		for (let i = 0; i < 10; i++) {
			let column = document.createElement('div');
			this.map.querySelector('.field').append(column);
			column.classList.add('field-column');
			for (let j = 1; j <= 10; j++) {
				number++;
				let cell = document.createElement('div');
				cell.classList.add('field-cell');
				column.append(cell);
				cell.setAttribute('data-number', number);
				cell.setAttribute('data-status', '');
				cells.push(number);
			}
		}
		return cells;
	}

	/**
	 * Формирует и возвращает статусбар.
	 */
	createStatusbar() {
		let statusbar = this.root.querySelector('.statusbar');
		this.root.prepend(statusbar);
		for (let i = 1, deckCount = 4; i <= 4; i++, deckCount--) {
			let menu = document.createElement('div');
			let pic = document.createElement('div');
			let info = document.createElement('div');
			let counter = document.createElement('span');
			menu.classList.add('menu');
			menu.setAttribute('data-status', 'disabled');
			menu.setAttribute('data-count-ship', i);
			menu.setAttribute('data-count-deck', deckCount);
			pic.classList.add('menu-pic');
			info.classList.add('info');
			counter.classList.add('counter');
			statusbar.append(menu);
			menu.append(pic);
			menu.append(info);
			info.append(counter);
			counter.innerText = 0;
			for (let j = 1; j <= deckCount; j++) {
				let div = document.createElement('div');
				pic.append(div);
			}
		}
		return statusbar;
	}

	/**
	 * Очищает данные игрока.
	 */
	reset() {
		let keys = ['p1', 'p2', 'p3', 'p4', 'shipList', 'restShip', 'possible'];
		for (let key of keys)
			this[key].length = 0;
		for (let key in this.damage)
			delete this.damage[key];
	}
};

/**
 * Запуск игры. Если указан `gamer` - очистить (его) пользовательские данные.
 */
function start(gamer) {
	let dialogParam = {
		msg: 'Как расставить корабли?',
		btn1: ['Вручную', 'manualPlacementShips'],
		btn2: ['Автоматически', 'splashing', USER]
	}
	if (gamer) {
		clear(gamer);
		dialog(dialogParam);
		return;
	}
	dialog({ btn1: ['Начать', 'dialog', dialogParam] });
}

/**
 * Взаимодействие с пользователем.
 * 
 * 		c.msg сообщение, которое появится в диалоговом окне.
 * 		c.btn1 - кнопка слева ['value', 'function', 'par1', 'par2'...]
 * 		c.btn2 - кнопка справа ['value', 'function', 'par1', 'par2'...]
 */
function dialog(c) {
	let display = document.querySelector('.display');
	let btns = display.querySelector('.display-btns');
	let btn1 = display.querySelector('.display-btn1');
	let btn2 = display.querySelector('.display-btn2');
	let msg = display.querySelector('.display-msg');
	btns.style.display = 'none';
	msg.style.display = 'none';
	msg.innerHTML = '';
	btns.querySelectorAll('.display-btn').forEach(x => {
		x.onclick = null;
		x.innerText = ''
		x.style.display = 'none';
	});
	if (c.msg) {
		msg.style.display = 'block';
		msg.innerHTML = c.msg;
	}
	if (c.btn1) {
		btns.style.display = 'flex';
		btn1.style.display = 'block';
		btn1.innerText = c.btn1[0];
		let fun = c.btn1[1];
		if (fun) {
			let pars = c.btn1.splice(2);
			btn1.onclick = () => new Function('', 'return ' + fun)()
				.call(this, ...pars ?? '');
		}
		if (c.btn2) {
			btn2.style.display = 'block';
			btn2.innerText = c.btn2[0];
			let fun2 = c.btn2[1];
			if (fun) {
				let pars = c.btn2.splice(2);
				btn2.onclick = () => new Function('', 'return ' + fun2)()
					.call(this, ...pars ?? '');
			}
		}
	}
}

/**
 * Прогресс бар.
 * 
 * 		func - функция после прогресса.
 * 		args - аргументы функции.
 */
function progress(func, ...args) {
	let prsbar = document.querySelector('.prsbar');
	let cnt = 0;
	let id = setInterval(function() {
		let step = document.createElement('div');
		prsbar.append(step);
		if (cnt == 22) {
			clearInterval(id);
			prsbar.innerHTML = '';
			setTimeout(func, 0, ...args);
		}
		cnt++;
	}, 50);
}

/**
 * Начало игрового процесса, вызывается после расстановки кораблей РС (function replacementFinished)
 */
function gameStart() {
	dialog({ msg: 'Ваш ход' });
	document.querySelector('.display-arrow.pc').style.visibility = 'visible';
	PC.map.classList.toggle('lock', false);
	PC.map.addEventListener('click', (e) => {
		let ncell = +e.target.dataset.number;
		if (PC.map.classList.contains('lock') || !PC.ncells.includes(ncell))
			return false;
		shot(PC, ncell);
	});
}

/**
 * Вызывается после победы/проигрыша игрока.
 */
function gameOver(gamer, report = false) {
	let msg = (gamer.name == 'user') ? '<b>Вы проиграли</b>' : '<b>Вы выиграли</b>';
	PC.map.classList.toggle('lock', true);
	if (report) msg = report + msg;
	dialog({ msg: msg });
}

/**
 * Управляет очередностью выстрелов, вызывается после обработки данных выстрела (function reshape).
 * 
 * 		gamer - игрок, от которого приходит выстрел.
 * 		data  - данные выстрела.
 */
function battle(gamer, data) {
	let target = (data.hit) ? gamer : (gamer.name == 'pc') ? USER : PC;
	document.querySelectorAll('.display-arrow').forEach(x => x.style.visibility = 'hidden');
	document.querySelector(`.display-arrow.${target.name}`).style.visibility = 'visible';
	if (target.name == 'pc') {
		PC.map.classList.toggle('lock', false);
	}
	if (target.name == 'user') {
		PC.map.classList.toggle('lock', true);
		if (data.hit === 'destroy') {
			let aroundDestroy = getCellsAroundArr(data.destroy);
			aroundDestroy.forEach(x => removeFrom(target.ncells, x));
			target.possible.length = 0;
		}
		if (data.hit === 'damage') {
			let exist = getCellsAround(data.ncell).along.filter(x => target.ncells.includes(x));
			USER.possible.push(...exist);
		}
		setTimeout(progress, 500, shot, USER);
	}
}

/**
 * Обновление данных после выстрела (function shot).
 * 
 * 		gamer - игрок, в которого стреляли.
 * 		data  - данные выстрела.
 */
function update(gamer, data) {
	let output = {}; // данные на выход
	let msg = getCoords(data.ncell) + ':&nbsp';
	removeFrom(gamer.ncells, data.ncell);
	let last = gamer.map.querySelector('.last');
	if (last) last.classList.remove('last');
	let cell = gamer.map.querySelector(`[data-number="${data.ncell}"]`);
	if (data.group) {
		let group = gamer[data.group];
		let ship = group[data.index];
		let groupName = `${data.group + data.index}`;
		gamer.damage[groupName] = (gamer.damage[groupName] === undefined)
			? gamer.damage[groupName] = `${data.ncell} `
			: gamer.damage[groupName] += `${data.ncell} `;
		removeFrom(gamer.restShip, data.ncell);
		removeFrom(ship, data.ncell);
		if (ship.length) { // если поврежден корабль
			cell.dataset.status = 'damage';
			output.hit = 'damage';
			output.ncell = data.ncell;
			msg += 'Повреждение'
		} else { // если уничтожен корабль
			msg += 'Уничтожен'
			output.destroy = gamer.damage[groupName].trim().split(' ').map(x => +x);
			delete gamer.damage[groupName];
			let menu = gamer.panel.querySelector(`[data-count-deck="${data.group.at(1)}"]`);
			let menuCounter = menu.querySelector('.counter');
			setStatusCells(gamer.map, output.destroy, 'destroy');
			let cnt = --menuCounter.innerHTML
			if (!cnt) { // если уничтожена вся группа кораблей
				menu.dataset.status = 'destroy';
				if (!gamer.restShip.length) { // если уничтожены все корабли игрока
					gameOver(gamer);
					return;
				}
			} else {
				menu.dataset.status = 'damage';
			}
			output.hit = 'destroy';
		}
	} else {
		cell.classList.add('last');
		cell.dataset.status = 'miss';
		cell.innerHTML = '<div></div>';
		msg += 'Промах';
	}
	dialog({ msg: msg });
	battle(gamer, output);
}

/**
 * Выстрел. Обновляет: номер ячейки, по которой был выстрел; если было попадание - название группы
 * кораблей и индекс массива этого корабля в массиве группы.
 * 
 * 		gamer - игрок, в которго стреляют.
 * 		ncell - номер ячейки, по которой будет выстрел.
 */
function shot(gamer, ncell = false) {
	if (gamer.name == 'user' && gamer.possible.length) {
		ncell = randomFrom(gamer.possible);
		removeFrom(gamer.possible, ncell);
	}
	let n = ncell || randomFrom(gamer.ncells);
	let output = { ncell: n };
	if (gamer.restShip.includes(n)) {
		for (let i = 1; i <= 4; i++) {
			let group = `p${i}`;
			gamer[group].forEach((x, i) => {
				if (x.includes(n)) {
					output.group = group;
					output.index = i;
				}
			});
		}
	}
	update(gamer, output);
}

/**
 * Вызывется, когда у игрока `gamer` будут расставлены объекты.
 */
function placementFinished(gamer) {
	gamer.panel.querySelectorAll('.menu').forEach(x => { // перерисовка инфопанели
		x.dataset.status = 'ready';
		x.querySelector('.counter').innerHTML = x.dataset.countShip;
	});
	if (gamer.name == 'user') {
		dialog({
			msg: 'Готово',
			btn1: ['Повторить', 'start', USER],
			btn2: ['Продолжить', 'splashing', PC, false]
		});
	}
	if (gamer.name == 'pc') {
		document.querySelector('.showpc').style.visibility = 'visible';
		document.getElementById('s').onclick = () => { // для возможности отображения объектов компьютера
			gamer.shipList.forEach(
				x => gamer.map.querySelector(`[data-number="${x}"]`).classList.toggle('showcell')
			)
		}
		dialog({
			msg: 'Все готово',
			btn1: ['В бой', 'gameStart']
		});
	}
}

/**
 * Кратковременное мерцание клеток, с последующей автоматической расстановкой кораблей.
 * 
 * 		gamer           - игрок, на поле которого расстявляются корабли.
 * 		render=true     - нужно ли сразу отобразить корабли.
 * 		color='#369e66' - цвет кораблей.
 */
function splashing(gamer, render = true, color = '#369e66') {
	dialog({ msg: 'Подождите...' });
	let map = gamer.map;
	let rand = Array(60).fill().map(() => Math.ceil(Math.random() * 99));
	let randList = [];
	while (rand.length) randList.push(rand.splice(0, 3));
	let a = randList.splice(0, 1).flat();
	a.forEach(x => gamer.map.querySelector(`[data-number='${x}']`).style.backgroundColor = color);
	setTimeout(() => {
		let id = setInterval(() => {
			a.forEach(x => gamer.map.querySelector(`[data-number='${x}']`).style.backgroundColor = '');
			let b = randList.splice(0, 1).flat();
			b.forEach(x => gamer.map.querySelector(`[data-number='${x}']`).style.backgroundColor = color);
			a = b;
			if (!randList.length) {
				clearInterval(id);
				b.forEach(x => gamer.map.querySelector(`[data-number='${x}']`).style.backgroundColor = '');
				autoPlacementShips(gamer, render);
			}
		}, 100)
	}, 100);
}

/**
 * Автоматическая расстановка кораблей, отрисовка меню, сохранение данных.
 * 
 * 		gamer       - игрок, у которого расставляются корабли.
 * 		render=true - нужна ли отрисовка кораблей.
 */
function autoPlacementShips(gamer, render = true) {
	let shipsObj, shipList;
	try {
		shipsObj = createAllShip();
		shipList = Object.values(shipsObj).flat(2);
	} catch (e) {
		if (!alert(`Что-то пошло не так...\n\n${e.message}\n\nНажмите OK чтобы перезапустить игру!`))
			location.reload();
	}
	// запись данных о кораблях в объект игрока
	for (let key in shipsObj) gamer[key] = shipsObj[key];
	gamer.shipList.push(...shipList);
	gamer.restShip.push(...shipList);
	if (render) { // отрисовка краблей
		shipList.forEach(x => gamer.map.querySelector(`[data-number='${x}']`).dataset.status = 'ship');
	}
	placementFinished(gamer);
}

/**
 * Создает сразу все корабли.
 * 
 * Возвращает объект масивов ячеек.
 */
function createAllShip() {
	let ships = { p1: [], p2: [], p3: [], p4: [] };
	let arr = Array.from(Array(100).keys()).map(x => ++x);
	for (let i = 1, deck = 4; i <= 4; i++) {
		for (let j = 1; j <= i; j++) {
			let p = ships[`p${deck}`];
			let ship = createSingleShip(arr, deck);
			if (!ship) {
				throw new Error('Failed to create objects.');
			}
			let around = getCellsAroundArr(ship);
			ship.forEach(x => removeFrom(arr, x));
			around.forEach(x => removeFrom(arr, x));
			p.push(ship);
		}
		deck--;
	}
	return ships;
}

/**
 * Создание одиночного корябля.
 * 
 * Возвращает массив с ячейками длиной `deck`, созданных в свободных ячейках `cells`,
 * или `false`, если не удалось создать создать массив.
 */
function createSingleShip(cells, deck) {
	let ships = [randomFrom(cells)];
	if (deck === 1) return ships;
	for (let i = 2; i <= deck; i++) {
		let possible = ships.map(x => getCellsAround(x).along)
			.flat()
			.filter(x => cells.includes(x))
			.filter(x => !ships.includes(x));
		if (!possible.length) return false;
		ships.push(randomFrom(possible));
	}
	return ships;
}

/**
 *  Инициализация ручной расстановки пользовательских объектов.
 */
function manualPlacementShips() {
	dialog({
		msg: 'В левой части выберите объект<br>и обозначте его на поле',
		btn1: ['Отменить', 'start', USER]
	});
	document.querySelector('.display-btn1').disabled = true;
	menu.group = 0;
	USER.map.addEventListener('click', markUserCells);
	markUserMenu();
}

/**
 * Выбор объекта в меню для обозначения на карте (при ручной расстановке).
 */
const menu = {};
function markUserMenu() {
	for (let elem of USER.panel.querySelectorAll('.menu')) {
		if (elem.dataset.status == 'ready') continue;
		elem.dataset.status = 'prepare';
		elem.onclick = function () {
			if (this.dataset.status != 'prepare' || menu.countShip) return;
			menu.countDeck = this.dataset.countDeck;
			menu.countShip = this.dataset.countShip;
			menu.current = USER.panel.querySelector(`[data-count-ship='${menu.countShip}']`);
			menu.info = menu.current.querySelector('.info');
			menu.counter = menu.current.querySelector('.counter');
			menu.info.append(`/${menu.countShip}`);
			setStatusCells(USER.map, USER.ncells, 'waiting', ['ship', 'around']);
			let current = this;
			for (let elem of USER.panel.querySelectorAll('.menu')) {
				if (elem == current || elem.dataset.status == 'ready') continue;
				elem.dataset.status = 'disabled';
			}
		}
	}
}

/** 
 * Очистка данных пользователя `gamer`, очистка карты и меню.
 */
function clear(gamer) {
	gamer.map.querySelectorAll('.field-cell').forEach(x => x.dataset.status = '');
	gamer.panel.querySelectorAll('.menu').forEach(x => {
		x.dataset.status = 'disabled';
		x.querySelector('.info').innerHTML = `<span class="counter">0</span>`;
	});
	for (let key in menu) delete menu[key];
	gamer.reset();
}

/**
 * Ручная расстановка пользовательских объектов, сохранение данных и отрисовка меню.
 * 
 * 		e - выбранная кликом ячейка.
 */
function markUserCells(e) {
	let status = e.target.dataset.status;
	if (!e.target.hasAttribute('data-number') ||
		!(status == 'waiting' || status == 'possible')) return;
	let cell = e.target;
	cell.dataset.status = 'selected';
	let possible = getCellsAround(+cell.dataset.number).along;
	setStatusCells(USER.map, possible, 'possible', ['selected', 'possible', 'around']);
	if (!menu.mark) {
		setStatusCells(USER.map, USER.ncells, '', ['ship', 'selected', 'possible', 'around']);
		menu.mark = true;
		menu.group++;
	}
	let selected = Array.from( // получить номера ячеек со статусом 'selected'
		document.querySelectorAll('[data-status="selected"]')
	).map(x => +x.dataset.number);
	if (menu.countDeck == selected.length) {
		document.querySelector('.display-btn1').disabled = false;
		menu.mark = false;
		menu.counter.innerHTML++;
		// добавить номера ячеек в массив группы кораблей
		let groupShip = USER['p' + menu.countDeck];
		groupShip.push(selected);
		setStatusCells(USER.map, getCellsAroundArr(selected), 'around');
		setStatusCells(USER.map, selected, 'ship');
		if (groupShip.length == menu.countShip) { // расставлена группа кораблей		
			menu.current.dataset.status = 'ready';
			menu.info.innerHTML = `<span class="counter">${menu.countShip}</span>`;
			menu.countShip = null;
			if (menu.group == 10) { // расставлены все корабли
				dialog({
					msg: 'Готово',
					btn1: ['Заново', 'start', USER],
					btn2: ['Продолжить', 'splashing', PC, false]
				});
				// добавить в массив списка кораблей номера ячеек
				USER.map.querySelectorAll('[data-status="ship"]').forEach(x => {
					USER.shipList.push(+x.dataset.number);
				});
				setStatusCells(USER.map, USER.ncells, '', ['ship']);
				USER.map.removeEventListener('click', markUserCells);
				for (let prop in menu) delete menu[prop];
				USER.panel.querySelectorAll('.menu').forEach(x => x.onclick = null);
				USER.restShip.push(...USER.shipList);
			} else
				markUserMenu();
		} else
			setStatusCells(USER.map, USER.ncells, 'waiting', ['ship', 'around']);
	}
}

/**
 * Установить на карте `map` номерам ячеек `cells` статус `status`,
 * кроме ячеек со статусом из массива `except`.
 */
function setStatusCells(map, cells, status, except = false) {
	for (let cell of cells) {
		let c = map.querySelector('[data-number="' + cell + '"]');
		if (c) {
			if (except && except.includes(c.dataset.status))
				continue;
			c.dataset.status = status;
		}
	}
}

/**
 * Возвращает координаты номера ячейки `ncell`.
 */
function getCoords(ncell) {
	let n = String(ncell);
	let w = n <= 10 ? 'А' :
		n > 10 && n <= 20 ? 'Б' :
			n > 20 && n <= 30 ? 'В' :
				n > 30 && n <= 40 ? 'Г' :
					n > 40 && n <= 50 ? 'Д' :
						n > 50 && n <= 60 ? 'Е' :
							n > 60 && n <= 70 ? 'Ж' :
								n > 70 && n <= 80 ? 'З' :
									n > 80 && n <= 90 ? 'И' :
										'К';
	let d = (n.length == 1) ? n : (n[1] == 0) ? 10 : n[1];
	return w + d;
}

/**
 * Возвращает массив с номерами ячеек вокруг массива `arr`.
 */
function getCellsAroundArr(arr) {
	let result = [];
	for (let cell of arr) {
		let cells = getCellsAround(+cell);
		result.push(...cells.along, ...cells.cross);
	}
	result = Array.from(new Set(result));
	result = result.filter(x => !arr.includes(String(x)));
	return result;
}

/**
 * Возвращает объект с номерми ячеек вокруг ячейки `cell`.
 */
function getCellsAround(cell) {
	let t, r, b, l, rt, rb, lb, lt;
	let result = {};
	t = ((cell - 1) % 10 != 0) ? cell - 1 : null;
	l = (cell - 10 > 0) ? cell - 10 : null;
	b = (cell % 10 != 0) ? cell + 1 : null;
	r = (cell + 10 <= 100) ? cell + 10 : null;
	rt = (r && t) ? r - 1 : null;
	rb = (r && b) ? r + 1 : null;
	lb = (l && b) ? l + 1 : null;
	lt = (l && t) ? l - 1 : null;
	result.along = [t, l, b, r].filter(x => x);
	result.cross = [rt, rb, lb, lt].filter(x => x);
	return result;
}

/**
 * Возвращает (изменяет) массив `arr`, из которого удалено значение `item`.
 */
function removeFrom(arr, item) {
	for (let i = 0; i < arr.length; i++)
		if (arr[i] === item)
			arr.splice(i--, 1);
	return arr;
}

/**
 * Возвращает случайное значение из массива `arr`.
 */
function randomFrom(arr) {
	return arr[random(0, arr.length - 1)];
}

/**
 * Возвращает число от `min` до `max`.
 */
function random(min, max) {
	return Math.floor(
		min + Math.random() * (max + 1 - min)
	)
}
