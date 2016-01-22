// By Froser (yuyisi)
;(function(global, $){
	"use strict";

	var create2048Game = function(options)
	{
		var dataPool = {}
		var blockKey = false;
		var isGameOver = false;
		var render = {};

		//return
		var init = function()
		{
			isGameOver = false;
			dataPool = {
				renderData: {
					items: [],
					placeholders: []
				},
				options: {},
				map: []
			}

			dataPool.options = $.extend(defaults, options);
			initMap();
		}

		// events
		var onGameOver = function(){}

		var returnObj = {
			start: function($element)
			{
				$element.empty();
				init();
				bindKeyboard(dataPool.options.bindTarget);
				render = createRender($element);
				render.draw();
			},
			gameover: function(callback){
				onGameOver = callback;
			},
			score: function()
			{
				var score = 0;
				for (var i = 0; i < dataPool.map.length; i++)
				{
					for (var j = 0; j < dataPool.map.length; j++)
					{
						score += dataPool.map[j][i];
					}
				}
				return score;
			},
			reset: function()
			{
				var placeholders = dataPool.renderData.placeholders;
				init();
				dataPool.renderData.placeholders = placeholders;
				render.draw();
			},

			options: function(opt)
			{
				init();
				if (opt === undefined)
					return dataPool.options;
				dataPool.options = $.extend(dataPool.options, opt);
			}
		};

		Array.prototype.clone = function()
		{
			return this.slice(0);
		}

		Array.prototype.reverseMap = function()
		{
			for (var i = 0; i < this.length; i++)
			{
				for (var j = 0; j < i; j++)
				{
					var t = this[i][j];
					this[i][j] = this[j][i];
					this[j][i] = t;
				}
			}
		}

		Array.prototype.cloneMap = function()
		{
			var arr = [];
			for (var i = 0; i < this.length; i++)
			{
				arr[i] = [];
				for (var j = 0; j < this[i].length; j++)
				{
					arr[i][j] = this[i][j];
				}
			}
			return arr;
		}

		var initMap = function()
		{
			dataPool.map = dataPool.options.matrix.cloneMap();
			if (dataPool.map.length === 0)
			{
				for (var i = 0; i < dataPool.options.dimensions; i++)
				{
					var r = [];
					for (var j = 0; j < dataPool.options.dimensions; j++)
					{
						r.push(0);
					}
					dataPool.map.push(r);
				}

				// create '2' twice
				createRandom();
				createRandom();
			}
		}

		var createRandom = function()
		{
			var suc = false;
			var x = 0, y = 0;
			while (!suc)
			{
				x = parseInt(Math.random() * dataPool.map.length);
				y = parseInt(Math.random() * dataPool.map.length);
				if (dataPool.map[y][x] === 0)
				{
					dataPool.map[y][x] = 2;
					suc = true;
				}
			}

			return {
				x: x,
				y: y,
				value: 2
			}
		}

		var getHandler = function(gameOverTest){
			var transform = function(direction)
			{
				var move = function(s1, s2, e, dy)
				{
					var changed = false;
					var changedBlocks = [];
					var da1 = s1 < e ? 1 : -1;
					var da2 = s2 < e ? 1 : -1;
					for (var x = s1; x !== e; x+=da1)
					{
						var hasBlockRow = false;
						var blockRow = 0;
						for (var y = s2; y !== e; y+=da2)	
						{
							var record = false;
							var from = {x: x, y: y, value: dataPool.map[y][x]};
							var _y = y, lookup = true;
							var brk = false;
							do
							{
								if (dataPool.map[_y+dy][x] === 0 || dataPool.map[_y+dy][x] === dataPool.map[_y][x])
								{
									if (dataPool.map[_y][x] !== 0)
									{
										changed = true;
										record = true;
										// while merging...
										if (dataPool.map[_y+dy][x] === dataPool.map[_y][x])
										{
											blockRow = _y;
											hasBlockRow = true;
											brk = true;
										}
										dataPool.map[_y+dy][x] += dataPool.map[_y][x];
										dataPool.map[_y][x] = 0;
									}
									else
									{
										break;
									}
								}

								var ylookup = _y+dy+dy, xlookup = x;
								var valid = dataPool.map[ylookup] !== undefined && dataPool.map[ylookup][xlookup] !== undefined;
								var empty = valid && dataPool.map[ylookup][xlookup] === 0;
								var canMerge = valid && dataPool.map[ylookup][xlookup] === dataPool.map[_y+dy][x];
								var blocked = brk || (hasBlockRow && (blockRow === _y+dy));
								lookup = (empty || canMerge) && !blocked ;	//Ensure that we only merge once
								if (lookup)
								{
									_y += dy;
								}
							} while (lookup)

							if (record)
							{
								var to = {x: x, y: _y+dy, value: dataPool.map[_y+dy][x]};
								changedBlocks.push({from: from, to: to})
							}
						}
					}
					return {
						changed: changed,
						details: changedBlocks,
						swapXY: function()
						{
							for (var i = 0; i < this.details.length; i++)
							{
								var t = this.details[i].from.x;
								this.details[i].from.x = this.details[i].from.y;
								this.details[i].from.y = t;

								var t = this.details[i].to.x;
								this.details[i].to.x = this.details[i].to.y;
								this.details[i].to.y = t;
							}
						}
					};
				}

				var moveUp = function()
				{
					return move(0, 1, dataPool.map.length, -1);
				}
				var moveDown = function()
				{
					return move(dataPool.map.length - 1, dataPool.map.length - 2, -1, 1)
				}
				var moveLeft = function()
				{
					dataPool.map.reverseMap();
					var state = moveUp()
					state.swapXY();
					dataPool.map.reverseMap();
					return state;
				}
				var moveRight = function()
				{
					dataPool.map.reverseMap();
					var state = moveDown()
					state.swapXY();
					dataPool.map.reverseMap();
					return state;
				}

				var state = {};
				switch(direction)
				{
					case 'up':
						state = moveUp();
						break;
					case 'down':
						state = moveDown();
						break;
					case 'right':
						state = moveRight();
						break;
					case 'left':
						state = moveLeft();
						break;
				}

				if (gameOverTest === true)
					return state;

				if (state.changed)
				{
					state.create = createRandom();
					render.transform(state, state.create)
				}


				var isGameOver = function()
				{
					var backup = dataPool.map.cloneMap();
					var restore = function(){
						dataPool.map = backup.cloneMap();
					}

					var up = moveUp();
					restore();
					var down = moveDown();
					restore();
					var left = moveLeft();
					restore();
					var right = moveRight();
					restore();
					if (up.changed || down.changed || left.changed || right.changed)
						return false;
					return true;
				}
				state.gameover = isGameOver();

				return state;
			}

			return {
				left: function()
				{
					return transform('left');
				},

				right: function()
				{
					return transform('right');
				},

				up: function()
				{
					return transform('up');
				},

				down: function()
				{
					return transform('down');
				}
			}
		}

		var bindKeyboard = function(target)
		{
			$(target || global).keydown(function(event)
			{
				if (blockKey)
					return;

				var h = getHandler();
				var g = false;
				switch(event.keyCode)
				{
					case 37: //left
						g = h.left().gameover;
						break;
					case 38: //up
						g = h.up().gameover;
						break;
					case 39: //right
						g = h.right().gameover;
						break;
					case 40: //down
						g = h.down().gameover;
						break;
				}

				if (g)
				{
					if (!isGameOver)
						onGameOver();
					isGameOver = true;
				}
			})
		}

		var createRender = function(element)
		{
			dataPool.renderData.placeholders = [];
			var background = $('<div/>')
				.css('background', dataPool.options.playgroundColor)
				.css('width', dataPool.options.width)
				.css('height', dataPool.options.height)
				.css('margin', '1px')
				.prependTo(element);

			for (var i = 0; i < dataPool.map.length; i++)
			{
				var row = $('<div/>')
					.css('width', '100%')
					.css('height', 100 / dataPool.map.length + '%')
					.appendTo(background);
				dataPool.renderData.placeholders[i] = [];
				for (var j = 0; j < dataPool.map.length; j++)
				{
					var d = $('<div/>')
						.css('width', 100 / dataPool.map.length + '%')
						.css('height', '100%')
						.css('display', 'inline-block')
						.css('padding', '2px')
						.appendTo(row)
					$('<div/>')
						.css('width', '100%')
						.css('height', '100%')
						.css('background', dataPool.options.placeholderColor)
						.appendTo(d);
					dataPool.renderData.placeholders[i][j] = d;
				};
			};

			var createItem = function(x, y, value)
			{
				var placeholder = dataPool.renderData.placeholders[y][x];
				var offset = placeholder.offset();
				var item = $('<span/>')
					.css('border-radius', '5px')
					.css('line-height', placeholder.height() + "px")
					.css('background', dataPool.options.itemBackgroundColors[value])
					.css('position', 'absolute')
					.css('margin', '2px')
					.css('width', placeholder.width())
					.css('height', placeholder.height())
					.css('left', offset.left)
					.css('top', offset.top)
					.css('text-align', 'center')
					.css('font-size', placeholder.height() / 3)
					.css('color', 'rgb(86,86,86)')
					.addClass('item')
					.html(dataPool.options.itemLabels[value] || value)

				item.valueOf2048 = value;

				item.appendTo(element);
				if (dataPool.renderData.items[y] === undefined)
					dataPool.renderData.items[y] = [];
				dataPool.renderData.items[y][x] = item;
				return item;
			}

			$('*').css('box-sizing', 'border-box');
			var render = {
				draw: function()
				{
					$('.item').remove();
					var map = dataPool.map;
					for (var y = 0; y < map.length; y++)
					{
						for (var x = 0; x < map.length; x++)
						{
							var value = map[y][x];
							if (value !== 0)
							{
								createItem(x, y, value)
							}
						}
					}
				},

				transform: function(state)
				{
					var t = state.type;
					var d = state.details;
					for (var i = 0; i < d.length; i++)
					{
						var from = d[i].from;
						var to = d[i].to;
						var item = dataPool.renderData.items[from.y][from.x];
						var placeholder = dataPool.renderData.placeholders[to.y][to.x];
						var offset = placeholder.offset();
						// Move item data
						if (dataPool.renderData.items[to.y] === undefined)
							dataPool.renderData.items[to.y] = [];
						var original = dataPool.renderData.items[to.y][to.x];
						if (original === undefined)
						{
							dataPool.renderData.items[to.y][to.x] = item;
						}
						else if (original.valueOf2048 < to.value)
						{
							item.valueOf2048 = to.value;
							dataPool.renderData.items[to.y][to.x] = item;
							item.removeItem = original;
						}
						delete dataPool.renderData.items[from.y][from.x];

						var counter = 0;
						blockKey = true;
						item.animate({
							left: offset.left,
							top: offset.top
						}, {
							duration: 300,
							queue: true,
							complete: function(i, t, max){
								return function(){
									i.html(dataPool.options.itemLabels[i.valueOf2048] || i.valueOf2048);
									if (i.removeItem !== undefined)
									{
										i.css('background', dataPool.options.itemBackgroundColors[t.value]);
										i.removeItem.remove();
										delete i.removeItem;
									}
									counter++;
									if (counter === d.length)
									{
										// When all animation finished
										if (state.create !== undefined)
											createItem(state.create.x, state.create.y, state.create.value)
										blockKey = false;
									}
								}
							}(item, to, d.length)
						});
					}
				}
			}
			return render;
		}

		$(global).resize(function(){
			for(var i = 0; i < dataPool.map.length; i++)
			{
				if (dataPool.renderData.items[i] === undefined)
					continue;
				for (var j = 0; j < dataPool.map.length; j++)
				{
					var item = dataPool.renderData.items[i][j];
					if (item === undefined)
						continue;
					var placeholder = dataPool.renderData.placeholders[i][j];
					var offset = placeholder.offset();
					item.css('left', offset.left);
					item.css('top', offset.top);
				}
			}
		})

		var defaults = {
			matrix: [],
			dimensions: 4,
			victory: 2048,
			playgroundColor: "rgb(187,173,160)",
			placeholderColor: "rgb(204,192,178)",
			width: 400,
			height: 400,
			itemBackgroundColors: {
				'2': "rgb(239,229,219)",
				'4': "rgb(237,225,201)",
				'8': "rgb(241,178,124)",
				'16': "rgb(236,141,83)",
				'32': "rgb(245,124,97)",
				'64': "rgb(245,95,62)",
				'128': "rgb(235,207,113)",
				'256': "rgb(235,202,95)",
				'512': "rgb(236,200,80)",
				'1024': "rgb(234,196,59)",
				'2048': "rgb(30,205,239)"
			},
			itemLabels: {},
			bindTarget: global
		}

		return returnObj;
	}

	global.create2048Game = create2048Game;
}(this, jQuery))

