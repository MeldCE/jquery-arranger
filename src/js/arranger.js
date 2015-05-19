if(jQuery) (function($){
	var dims = {width: 'clientWidth', height: 'clientHeight'};
	var sizers = ['tl', 'tr', 'br', 'bl'];
	var indicators = ['t', 'r', 'b', 'l'];
	var dataKey = 'arranger';
	var toLinkClass = 'toLink';
	var spacing = 10;

	/**
	 * Simple function to report error to user
	 */
	function error(message) {
		console.error('Arranger: ' + message);
	}

	/**
	 * Called to start the resize of an image
	 */
	function startAction(id, func, direction, ev) {
		var data = {};

		console.log('startAction called');
		console.log(ev);

		if (ev) {
			if (ev.isDefaultPrevented()) {
				return;
			}

			// Check we have a left mouse button click
			if (ev.button != 0) {
				return;
			}

			ev.preventDefault();
		}

		// Run (and possibly exit) event handlers
		if (direction === null) {
			if (this.events.preMove) {
				for (i in this.events.preMove) {
					if (this.events.preMove[i](this.images[id].image) === false) {
						return;
					}
				}
			}
		} else {
			if (this.events.preResize) {
				for (i in this.events.preResize) {
					if (this.events.preResize[i](this.images[id].image) === false) {
						return;
					}
				}
			}
		}

		var initial = {
			ev: ev,
			width: this.images[id].div.width(),
			height: this.images[id].div.height(),
			pos: this.images[id].div.position()
		};

		initial.actionFn = func.bind(this, id, direction, initial);
		initial.finishFn = finishAction.bind(this, id, direction, initial);

		//
		$('body').mouseup(initial.finishFn);
		this.divs.pad.mousemove(initial.actionFn);
	}

	function doResize(id, direction, initial, ev) {
		console.log('doResize called with direction ' + direction);
		// Calculate current delta
		var deltaX = Math.round(ev.clientX - initial.ev.clientX);
		var deltaY = Math.round(ev.clientY - initial.ev.clientY);
		var delta;

		console.log('Deltas are: ' + deltaX + ', ' + deltaY);

		// If fixed ratio, determine the maximum relative to the image ratio
		if (this.images[id].image.format === 'ratio') {
			var mul = 1, nul = 1;

			if (direction === 'bl' || direction === 'tr') {
				mul = -1;
			}

			// Average out the two deltas
			var delta = (deltaY + (deltaX * mul)) / 2;
			deltaY =  Math.round(delta / this.images[id].ratio);
			deltaX = delta * mul;

			console.log('Using fixed ratio delta ');
		}

		// Handle x dimension
		if (direction.search(/l/) !== -1) {
			console.log('have a left puller');
			// Move x and then resize x
			this.images[id].div.offset({left: (initial.pos.left + deltaX)});
			this.images[id].div.width(initial.width - deltaX);
			//this.images[id].div.x(
		} else if (direction.search(/r/) !== -1) {
			console.log('have a right puller');
			this.images[id].div.width(initial.width + deltaX);
		}

		// Handle y dimension
		if (direction.search(/t/) !== -1) {
			// Move x and then resize x
			this.images[id].div.offset({top: (initial.pos.top + deltaY)});
			this.images[id].div.height(initial.height - deltaY);
			//this.images[id].div.x(
		} else if (direction.search(/b/) !== -1) {
			this.images[id].div.height(initial.height + deltaY);
		}

		calculateNewLinks.call(this, id, direction);
		resizeArranger.call(this);
	}

	function doMove(id, direction, initial, ev) {
		console.log('doMove called');
		// Calculate current delta
		var deltaX = Math.round(ev.clientX - initial.ev.clientX);
		var deltaY = Math.round(ev.clientY - initial.ev.clientY);

		this.images[id].div.offset({
			left: (initial.pos.left + deltaX),
			top: (initial.pos.top + deltaY)
		});

		calculateNewLinks.call(this, id, direction);
		resizeArranger.call(this);
	}

	function finishAction(id, direction, initial, ev) {
		console.log('finishAction called');

		if (ev) {
			if (ev.isDefaultPrevented()) {
				return;
			}

			ev.preventDefault()
		}

		// Need to be able to remove the binds
		console.log(this.divs.pad.off);
		console.log(initial);
		//this.divs.pad.unbind(initial.actionFn);
		this.divs.pad.unbind('mousemove');
		//$('body').unbind(initial.finishFn);
		$('body').unbind('mouseup');
		
		calculateNewLinks.call(this, id, direction, true);
		resizeArranger.call(this, true);

		updateImageData.call(this, id);

		if (direction === null) {
			if (this.events.finishMove) {
				for (i in this.events.finishMove) {
					this.events.finishMove[i](this.images[id].image);
				}
			}
		} else {
			if (this.events.finishResize) {
				for (i in this.events.finishResize) {
					this.events.finishResize[i](this.images[id].image);
				}
			}
		}

		if (this.events.finishAction) {
			for (i in this.events.finishAction) {
				this.events.finishAction[i](this.images[id].image);
			}
		}
	}

	/**
	 * Go through the other images and highlight the borders of ones that
	 * will be linked to the current one if the image is placed where it is
	 * currently.
	 *
	 * @param id {integer} ID of the image being linked to.
	 * @param direction {'tr'|'br'|'bl'|'tl'|null} Direction of current resizing
	 *        or null for move.
	 * @param finalise {boolean} If, true, links will be set.
	 */
	function calculateNewLinks(id, direction, finalise) {
		console.log('calculateNewLinks called with ' + id + ', ' + direction
				+ ', ' + finalise);
		
		var i, j, k;

		var linkClass;

		var newLinks;

		if (finalise) {
			linkClass = 'linked';

			newLinks = {
				t: {},
				l: {},
				b: {},
				r: {}
			};
		} else {
			linkClass = 'toLink';
		}

		var link = {
			t: 0,
			b: 0,
			l: 0,
			r: 0
		};

		var pos = {
			t: -1,
			b: -1,
			l: -1,
			r: -1
		};

		var offset = this.images[id].div.offset();

		// Set up the positions
		if (direction === null || direction.search(/l/) !== -1) {
			pos.l = offset.left;
		}

		if (direction === null || direction.search(/r/) !== -1) {
			pos.r = offset.left + this.images[id].div.width();
		}

		if (direction === null || direction.search(/t/) !== -1) {
			pos.t = offset.top;
		}

		if (direction === null || direction.search(/b/) !== -1) {
			pos.b = offset.top + this.images[id].div.height();
		}

		var cpos, ipos;
		var lH, rH, tH, bH;
		for (i in this.images) {
			// Remove toLink class from all
			if (finalise) {
				for (k in pos) {
					this.images[i][k].removeClass('toLink');
				}
			}

			if (i == id) {
				continue;
			}
		
			// Set up temporary selected image positions
			ipos = {
				l: pos.l,
				r: pos.r,
				t: pos.t,
				b: pos.b
			};

			offset = this.images[i].div.offset();

			// Set up current image positions
			cpos = {
				l: offset.left,
				r: offset.left + this.images[i].div.width(),
				t: offset.top,
				b: offset.top + this.images[i].div.height()
			};

			// Horizontal sides
			if (ipos.t !== -1) {
				if (cpos.t >= ipos.t - spacing && cpos.t <= ipos.t + spacing) {
					cpos.t = -1;
					ipos.t = -1;
					link.t = 1;

					if (finalise) {
						newLinks['t'][i] = 't';

						this.images[i].links['t'][id] = 't';
					}
				} else if (cpos.b >= ipos.t - spacing && cpos.b <= ipos.t + spacing) {
					cpos.b = -1;
					ipos.t = -1;
					link.t = 1;

					if (finalise) {
						newLinks['t'][i] = 'b';

						this.images[i].links['b'][id] = 't';
					}
				}
			}

			if (ipos.b !== -1) {
				if (cpos.t !== -1 && cpos.t >= ipos.b - spacing
						&& cpos.t <= ipos.b + spacing) {
					cpos.t = -1;
					ipos.b = -1;
					link.b = 1;

					if (finalise) {
						newLinks['b'][i] = 't';

						this.images[i].links['t'][id] = 'b';
					}
				} else if (cpos.b !== -1 && cpos.b >= ipos.b - spacing
						&& cpos.b <= ipos.b + spacing) {
					cpos.b = -1;
					ipos.b = -1;
					link.b = 1;

					if (finalise) {
						newLinks['b'][i] = 'b';

						this.images[i].links['b'][id] = 'b';
					}
				}
			}

			// Vertical sides
			// Left
			if (ipos.l !== -1) {
				if (cpos.l >= ipos.l - spacing && cpos.l <= ipos.l + spacing) {
					cpos.l = -1;
					ipos.l = -1;
					link.l = 1;

					if (finalise) {
						newLinks['l'][i] = 'l';

						this.images[i].links['l'][id] = 'l';
					}
				} else if (cpos.r >= ipos.l - spacing && cpos.r <= ipos.l + spacing) {
					cpos.r = -1;
					ipos.l = -1;
					link.l = 1;

					if (finalise) {
						newLinks['l'][i] = 'r';

						this.images[i].links['r'][id] = 'l';
					}
				}
			}

			// Right
			if (ipos.r !== -1) {
				if (cpos.l !== -1 && cpos.l >= ipos.r - spacing
						&& cpos.l <= ipos.r + spacing) {
					cpos.l = -1;
					ipos.r = -1;
					link.r = 1;

					if (finalise) {
						newLinks['r'][i] = 'l';

						this.images[i].links['l'][id] = 'r';
					}
				} else if (cpos.r !== -1 && cpos.r >= ipos.r - spacing
						&& cpos.r <= ipos.r + spacing) {
					cpos.r = -1;
					ipos.r = -1;
					link.r = 1;

					if (finalise) {
						newLinks['r'][i] = 'r';

						this.images[i].links['r'][id] = 'r';
					}
				}
			}

			/// Check classes match links on current image
			for (j in cpos) {
				// Add/remove class and link
				if (cpos[j] === -1) {
					if (!this.images[i][j].hasClass(linkClass)) {
						this.images[i][j].addClass(linkClass);
					}
				} else {
					if (this.images[i][j].hasClass(linkClass)) {
						this.images[i][j].removeClass(linkClass);
					}

					if (finalise) {
						if (this.images[i].links[j][id]) {
							delete this.images[i].links[j][id];
						}
					}
				}
			}
		}

		/// Check classes match links on working image
		for (j in link) {
			// Add/remove class and link
			if (link[j] === 1) {
				if (!this.images[id][j].hasClass(linkClass)) {
					this.images[id][j].addClass(linkClass);
				}
			} else {
				if (this.images[id][j].hasClass(linkClass)) {
					this.images[id][j].removeClass(linkClass);
				}
			}
		}
		
		// Handle the new links
		if (finalise) {
			actionLinks.call(this, id, direction, newLinks);

			// Merge in the new Links
			for (i in pos) {
				if (pos[i] !== -1) {
					this.images[id].links[i] = newLinks[i];
				}
			}

			console.log(this.images[id].links);
		}
	}

	/**
	 * Go through the linked images and move resize linked images
	 *
	 * @param id {integer} ID of the image being linked to.
	 * @param direction {'tr'|'br'|'bl'|'tl'|null} Direction of current resizing
	 *        or null for move.
	 * @param links {|Object} Links to be actioned (will act upon the given
	 *        object, rather than the linked objects.
	 */
	function actionLinks(id, direction, links) {
		var i, j, s, pos;

		console.log('actionLinks called, direction is ' + direction);

		// Define set order for sides
		var fixed = {
			t: 0,
			l: 0,
			b: 0,
			r: 0
		};
		
		if (links) {
			console.log('have links');
			console.log(links);

			// Top
			if (links['t']) {
				for (i in links['t']) {
					// Move to align with other div
					if (links['t'][i] == 't') {
						this.images[id].div.offset({top: this.images[i].div.offset().top});
					} else {
						this.images[id].div.offset({
								top: this.images[i].div.offset().top
								+ this.images[i].div.height() + spacing});
					}

					fixed.t = 1;
					break;
				}
			}

			// Left
			if (links['l']) {
				for (i in links['l']) {
					// Move to align with other div
					if (links['l'][i] == 'l') {
						this.images[id].div.offset({left: this.images[i].div.offset().left});
					} else {
						this.images[id].div.offset({
								left: this.images[i].div.offset().left
								+ this.images[i].div.width() + spacing});
					}

					fixed.l = 1;
					break;
				}
			}

			// Right
			if (links['r'] && fixed.r === 0) {
				for (i in links['r']) {
					// Determine bottom position
					if (links['r'][i] == 'l') {
						pos = this.images[i].div.offset().left - spacing;
					} else {
						pos = this.images[i].div.offset().left + this.images[i].div.width();
					}

					// Resize if top fixed or resizing from bottom, else move
					if (fixed.l || (direction && direction.search(/r/) !== -1)) {
						var width = pos - this.images[id].div.offset().left;
						this.images[id].div.width(width);

						// Resize right if fixed ratio
						if (this.images[id].image.format === 'ratio') {
							this.images[id].div.height(width / this.images[id].ratio);
							fixed.r = 1;
						}
					} else {
						this.images[id].div.offset({left: pos - this.images[id].div.width()});
					}

					fixed.r = 1;
				}
			}

			// Bottom
			if (links['b'] && fixed.b === 0) {
				for (i in links['b']) {
					// Determine bottom position
					if (links['b'][i] == 't') {
						pos = this.images[i].div.offset().top - spacing;
					} else {
						pos = this.images[i].div.offset().top + this.images[i].div.height();
					}

					// Resize if top fixed or resizing from bottom, else move
					if (fixed.t || (direction && direction.search(/b/) !== -1)) {
						var height = pos - this.images[id].div.offset().top;
						this.images[id].div.height(height);

						// Resize right if fixed ratio
						if (this.images[id].image.format === 'ratio') {
							this.images[id].div.width(height * this.images[id].ratio);
							fixed.r = 1;
						}
					} else {
						this.images[id].div.offset({top: pos - this.images[id].div.height()});
					}

					fixed.b = 1;
				}
			}
		}
	}

	/**
	 * Adjusts the height of the Arranger to fit the contents.
	 *
	 * @param finalise {boolean} If true, will shrink or expand the height of the
	 *        arranger to fit the contents. Otherwise will just expand.
	 */
	function resizeArranger(finalise) {
		var i, height, maxHeight = 150;

		for (i in this.images) {
			var test = this.images[i].div.height() + this.images[i].div.offset().top;
			maxHeight = Math.max(this.images[i].div.height()
					+ this.images[i].div.offset().top, maxHeight);
		}

		if (finalise || maxHeight > this.divs.pad.height()) {
			this.divs.pad.height(maxHeight);
		}
	}

	/**
	 * Adjust the styling on the div, so that the background image matches the
	 * image format.
	 */
	function adjustStyling(image) {
		switch(image.image.format) {
			case 'crop':
				image.div
						.css('background-position', (image.image.position[0] === -1 
						? 'center' : image.image.position[0] + 'px') + ' '
						+ (image.image.position[1] === -1 ? 'center' 
						: image.image.position[1] + 'px'));
				if (image.image.scale !== -1) {
				image.div
						.css('background-size', (image.image.size[0] * image.image.scale)
						+ 'px ' + (image.image.size[1] * image.image.scale) + 'px');
					break;
				}
			case 'ratio':
				image.div.css('background-size', 'cover');
				break;
		}
	}

	/**
	 * Updates the stored image data
	 */
	function updateImageData(id) {
		var image = this.images[id].image;
		var div = this.images[id].div;

		// Update image details
		// Position
		offset = div.offset();

		image.position = [Math.round(offset.left), Math.round(offset.top)];

		// Box size
		image.box = [Math.round(div.width()), Math.round(div.height())];

		// Add position and scale if crop format
		if (image.format === 'crop') {
			// Don't need to do anything to scale or position as they will
			// have to be stored and used
		} else {
			if (image.scale) {
				delete image.scale;
			}

			if (image.position) {
				delete image.position;
			}
		}
	}

	function createSettingsHTML() {
		// Add 
		//this.settingsDiv.append(this
		var ref = this;

		// Add custom actions
		for (i in this.actions) {
			if (!(this.actions[i] instanceof Object) || !this.actions[i].label
					|| !this.actions[i].func || !this.actions[i].func.call) {
				continue;
			}

			this.divs.settings.append($('<button>' + this.actions[i].label
					+ '</button>').click(function () { this.actions[i].func(ref); }));
		}
	}
	
	/** Prototype for the arranger object
	 *
	 * @param div {JQueryDOMObject} Object to make into the arranger.
	 */
	function Arranger(div, options) {
		var i, j;

		this.images = [];
		this.divs = {};

		this.options = $.extend({
			actions: [],
		}, options);

		this.events = {
			preMove: [],
			preResize: [],
			finishMove: [],
			finishResize: [],
			finishAction: []
		};

		// Add events from options into events
		for (i in this.events) {
			if (this.options[i]) {
				if (this.options[i].call) {
					this.events[i].push(this.options[i]);
				} else if (this.options[i] instanceof Array) {
					for (j in this.options[i]) {
						if (!this.options[i][j].call) {
							this.options[i].splice(j, 1);
						}
					}
					
					this.events[i].concat(this.options[i]);
				}
			}
		}

		// Create settings and placer divs
		div.append(this.divs.settings = $('<div class="settings"></div>'));
		div.append(this.divs.pad = $('<div class="pad"></div>'));

		createSettingsHTML.call(this);

		//div.resizable();
	}

	Arranger.prototype = {
		/**
		 * Add an image to the arranger.
		 *
		 * @param images {Array|Object} Object or array of objects containing
		 *        the following information on the image to add:
		 *        @attr id {string} ID of the image (so it can be deleted by
		 *              calling deleteImage. If not given, image will be given a
		 *              numerical ID (which can later be retrieved from the id
		 *              parameter for a given image).
		 *        @attr href {string} URI to the image to add.
		 *        @attr box {[integer, integer]} The size of the initial box in
		 *              pixels in array format ([w, h]).
		 *        @attr format {'ratio'|'crop'} Whether the image will be fixed
		 *              ratio or will be cropped to fit.
		 *        @attr position {[integer, integer]} If 'crop' format, the offset
		 *              of the image in the box in pixels in array format ([w, h]).
		 *              (No position will mean the image is centered).
		 *        @attr scale {float} Scaling of image (a value of 1 is original
		 *              size.
		 */
		addImage: function(images) {
			console.log('addImage called');
			console.log(images);
			if (!(images instanceof Array)) {
				images = [images];
			}

			var i;
			for (i in images) {
				// Make sure we have an object and a href; if not, ignore
				if (images[i] instanceof Object && images[i].href) {
					console.log('have an image ' + images[i].href);
					// Add the image to the arranger
					var id = this.images.length;
					var image = {
						image: images[i],
						links: {
							l: {},
							r: {},
							t: {},
							b: {}
						}
					};

					this.divs.pad.append((image.div = $('<div '
							+ 'style="background: url(\'' + images[i].href + '\');' 
							+ 'background-repeat: no-repeat;"></div>')
							.mousedown(startAction.bind(this, id, doMove, null))));

					/// @todo Get image size?
					// this would not be related to the actual image size, but the size
					// of the div, so can't get the image ratio off of it.
					image.image.size = [image.image.box[0], image.image.box[1]];

					// Determine ratio
					image.ratio = image.image.size[0] / image.image.size[1];

					if (!image.image.box) {
						/// @todo ensure size is not larger than the current pad
						image.image.box = [image.image.size[0], image.image.size[1]];
					}
					
					// Best guess format
					if (!image.image.format) {
						if (!image.image.scale && !image.image.position) {
							image.image.format = 'ratio';
						} else {
							image.image.format = 'crop';
						}
					}

					// Fill in the blanks
					if (!image.image.scale) {
						image.image.scale = -1;
					}

					if (!image.image.position) {
						image.image.position = [-1, -1];
					}

					// Apply initial size
					image.div.width(images[i].box[0]);
					image.div.height(images[i].box[1]);

					// Add format styling
					adjustStyling.call(this, image);

					// Add indicators and sizers to image div
					var s;

					for (s in indicators) {
						image.div.append(image[indicators[s]] = $('<div class="' + indicators[s]
							+ '"></div>')
						);
					}

					for (s in sizers) {
						image.div.append(image[sizers[s]] = $('<div class="' + sizers[s]
							+ '"></div>')
							.mousedown(startAction.bind(this, id, doResize, sizers[s]))
							/* @todo Add touch events
							.bind('touchstart', )
							*/
						);
					}

					// Store information
					this.images[id] = image;
				}
			}
		},

		/**
		 * Delete image with the given id.
		 *
		 * @param id {string} ID of the image to delete.
		 *
		 * @retval true Image deleted
		 * @retval false Could not find image to delete
		 */
		deleteImage: function(id) {
			var i, l, j, links;

			// Go through images and find image to delete
			for (i in this.images) {
				if (this.images[i].image.id && this.images[i].image.id === id) {
					// Go through and delete references in links
					for (l in this.images[i].links) {
						links = this.images[i].links[l];
						for (j in links) {
							delete this.images[j].links[links[j]][id];
						}
					}

					// Delete image
					this.images[i].div.remove();

					delete this.images[i];

					return true;
				}
			}

			return false;
		},

		/**
		 * Returns an array of objects containing information on the images,
		 * including href, size, position in the pad, image position and scale.
		 * Positions in the pad will be cut so images start a [0, 0].
		 *
		 * @see images parameter for the addImage function for a description of
		 *      the objects.
		 *
		 * @todo See if there is a way to make it so we don't have to call
		 *       Math.round everywhere
		 */
		getData: function() {
			// Store the minimum x and y values so can start the values from 0,0
			var minX = -1, minY = -1;

			var images = [];

			var i, offset, div;

			for (i in this.images) {
				images[i] = this.images[i].image;

				updateImageData.call(this, i);

				// Check and set new minimum x and y values
				if (minX === -1 || images[i].position[0] < minX) {
					minX  = images[i].position[0];
				}

				if (minY === -1 || images[i].position[1] < minY) {
					minY  = images[i].position[1];
				}
			}
			
			// Zero positions if not 0 anyway
			if (minX > 0 || minY > 0) {
				for (i in images) {
					if (minX > 0) {
						images[i].position[0] -= minX;
					}

					if (minY > 0) {
						images[i].position[1] -= minY;
					}
				}
			}
			
			return images;
		},

		/**
		 * Bind to one of the events that this offers. Functions bound to 'pre...'
		 * events can stop the event from happening if they return false.
		 *
		 * @param ev {string} Event identifier. Events available are:
		 *        preMove Run before a move event
		 *        preResize Run before a resize event
		 *        finishMove Run after a move event
		 *        finishResize Run after a resize event
		 *        finishAction Run after any kind of change to an image
		 * @param func {function} Function to be called. Function will be passed
		 *        the image data as the only parameter. Note that the image
		 *        positions will not be relative from [0,0], but from [0,0] of the
		 *        pad, hence might be different from when @see getData() is called.
		 *
		 * @retval true Bind was successful
		 * @retval false Bind wasn't successfull (either event doesn't exist or
		 *        function wasn't a function.
		 */
		bind: function(ev, func) {
			if (this.events[ev] && func && func.call) {
				this.events[ev].push(func);

				return true;
			}

			return false;
		},

		/**
		 * Unbinds a function to an event (opposite to @see bind)
		 */
		unbind: function(ev, func) {
			if (this.events[ev] && func && func.call) {
				var i;
				
				if ((i = this.events[ev].indexOf(func)) !== -1) {
					this.events[ev].splice(i, 1);

					return true;
				}
			}

			return false;
		},
	};

	$.extend($.fn, {
		arranger: function(cmd) {
			console.log('arranger called');
			console.log(cmd);
			if (cmd instanceof Object) {
				$(this).each(function() {
					if (!$(this).data(dataKey)
							|| !($(this).data(dataKey) instanceof Arranger)) {
						$(this).data(dataKey, new Arranger($(this)));
					}
				});
			} else if (typeof cmd == "string") {
				if ($(this).data(dataKey) && $(this).data(dataKey) instanceof Arranger
						&& $(this).data(dataKey)[cmd]) {
					var args = Array.prototype.slice.call(arguments, 1);
					$(this).data(dataKey)[cmd].apply($(this).data(dataKey), args);
				}
			} else if (cmd === undefined) {
				return $(this).data(dataKey);
			}

			return $(this);
		}
	});
})(jQuery);
