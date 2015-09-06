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

	function doResize(id, direction, initial, ev, touch) {
		//console.log('doResize called with direction ' + direction);

		if (ev) {
			if (ev.isDefaultPrevented()) {
				return;
			}

			// Check we have a left mouse button click
			if (!(ev.button === undefined || ev.button === 0)) {
				return;
			}

			ev.preventDefault();
		}

		// Calculate current delta
		//var deltaX = Math.round(ev.clientX - initial.ev.clientX);
		//var deltaY = Math.round(ev.clientY - initial.ev.clientY);
		var deltaX = Math.round(touch.position.x - initial.touch.x);
		var deltaY = Math.round(touch.position.y - initial.touch.y);
		var delta;
		var offX = 0, offY = 0;


		console.log('Deltas are: ' + deltaX + ', ' + deltaY);

		// If fixed ratio, determine the maximum relative to the image ratio
		if (this.images[id].format === 'ratio') {
			var mul = 1, nul = 1;

			if (direction === 'bl' || direction === 'tr') {
				mul = -1;
			}

			// Average out the two deltas
			var delta = (deltaY + (deltaX * mul)) / 2;
			deltaY =  Math.round(delta / this.data[id].ratio);
			deltaX = Math.round(delta * mul);

			//console.log('Using fixed ratio delta ');

			// Check these deltas don't take the image off the screen
			if (direction.search(/l/) !== -1) {
				// Calcuate if offset is less than zero
				offX = initial.pos.left + deltaX;
			} else if (direction.search(/r/) !== -1) {
				// Calculate if, relative to the end of the pad, we are off the pad
				// (on a reversed x-axis)
				console.log('calculating off the right side of the padness '
						+ this.divs.pad.width() + ' - (' + initial.pos.left + ' + '
						+ initial.width + ' + ' + deltaX + ')');
				offX = this.divs.pad.width()
						- (initial.pos.left + initial.width + deltaX);
				console.log('calculating off the right side of the padness '
						+ this.divs.pad.width() + ' - (' + initial.pos.left + ' + '
						+ initial.width + ' + ' + deltaX + ') = ' + offX);
			}

			// Handle y dimension
			if (direction.search(/t/) !== -1) {
				offY = initial.pos.top + deltaY;
				//this.data[id].div.x(
			} // Ignore the bottom as that will expand

			if (offX < 0 && offY < 0) {
				// Calculate which side needs to least and go with that
				if (direction.search(/l/) !== -1) {
					// Calcuate if offset is less than zero
					offX = - initial.pos.left;
				} else if (direction.search(/r/) !== -1) {
					// Calculate if, relative to the end of the pad, if we are off the pad
					// (on a reversed x-axis)
					offX = initial.pos.left + initial.width - this.divs.pad.width();
				}

				// Handle y dimension
				if (direction.search(/t/) !== -1) {
					offY = - initial.pos.top;
					//this.data[id].div.x(
				} // Ignore the bottom as that will expand

				if (Math.abs(offX) > Math.abs(offY)) {
					offY = 0;
				} else {
					offX = 0;
				}
			}
			
			if (offX < 0) {
				console.log('x off pad with ' + deltaX + ' and (' + deltaY + ')');
				// subtract off deltaX and match deltaY
				if (direction.search(/l/) !== -1) {
					deltaX -= offX;
				} else {
					deltaX += offX;
				}
				deltaY =  mul * Math.round(deltaX / this.data[id].ratio);
				console.log('new deltaX ' + deltaX + ' and (' + deltaY + ')');
			} else if (offY < 0) {
				console.log('x off pad with ' + deltaX + ' and (' + deltaY + ')');
				// subtract off deltaY and match deltaX
				deltaY -= offY;
				deltaX =  mul * Math.round(deltaY * this.data[id].ratio);
				console.log('new deltaX ' + deltaX + ' and (' + deltaY + ')');
			}
		}

		console.log('offX: ' + offX + ', offY: ' + offY);

		// Handle x dimension
		if (direction.search(/l/) !== -1) {
			//console.log('have a left puller');
			// Move x and then resize x
			this.data[id].div.offset({left: (initial.offset.left + deltaX)});
			// Calculate the new width based on the new offset (limited to 0)
			this.data[id].div.width(initial.width - deltaX);
		} else if (direction.search(/r/) !== -1) {
			//console.log('have a right puller');
			this.data[id].div.width(initial.width + deltaX);
		}

		// Handle y dimension
		if (direction.search(/t/) !== -1) {
			// Move x and then resize x
			this.data[id].div.offset({top: (initial.offset.top + deltaY)});
			this.data[id].div.height(initial.height - deltaY);
			//this.data[id].div.x(
		} else if (direction.search(/b/) !== -1) {
			this.data[id].div.height(initial.height + deltaY);
		}

		calculateNewLinks.call(this, id, direction);
		resizeArranger.call(this);
	}

	function doMove(id, direction, initial, ev, touch) {
		//console.log('doMove called');

		if (ev) {
			//console.log('doMove called with event');
			if (ev.isDefaultPrevented()) {
				return;
			}

			// Check we have a left mouse button click
			if (!(ev.button === undefined || ev.button === 0)) {
				return;
			}

			ev.preventDefault();
		}

		//console.log(initial);
		//console.log(ev);
		//console.log(touch);

		// Calculate current delta
		/* touch.offset is the position relative to the
		 */
		//var deltaX = Math.round(ev.clientX - initial.ev.clientX);
		//var deltaY = Math.round(ev.clientY - initial.ev.clientY);
		//var deltaX = Math.round(touch.offset.x - initial.touch.x);
		//var deltaY = Math.round(touch.offset.y - initial.touch.y);
		var deltaX = Math.round(touch.position.x - initial.touch.x);
		var deltaY = Math.round(touch.position.y - initial.touch.y);

		console.log('deltaX: ' + touch.position.x + ' - ' + initial.touch.x + ' = ' + deltaX);

		//console.log('delta: ' + deltaX + ' : ' + deltaY);
		//console.log(initial);
		//console.log(initial.offset.left);

		// Limit by 0,0 and 100% width bound
		//console.log(this.divs.pad);
		//console.log(this.divs.pad.offset());
		var offset = this.divs.pad.offset();
		//console.log('max: ' + offset.left + ' vs ' + (initial.offset.left + deltaX));
		var left = Math.min(offset.left + this.divs.pad.width()
				- this.data[id].div.width(), Math.max(offset.left,
				(initial.offset.left + deltaX)));
		var top = Math.max(offset.top, (initial.offset.top + deltaY));

		this.data[id].div.offset({
			left: left,
			top: top
		});

		console.log(initial.offset.left + ' + ' + deltaX + ' = ' + left);

		calculateNewLinks.call(this, id, direction);
		resizeArranger.call(this);
	}

	function relativisePositions() {
		// Store the minimum x and y values so can start the values from 0,0
		var minX = -1, minY = -1;
		var maxX = 0, maxY = 0;

		var images = [];

		var i, offset, div;

		for (i in this.images) {
			// Update image data
			updateImageData.call(this, i);

			images[i] = this.images[i];

			//updateImageData.call(this, i);

			// Check and set new minimum x and y values
			if (minX === -1 || images[i].position[0] < minX) {
				minX  = images[i].position[0];
			}

			if (minY === -1 || images[i].position[1] < minY) {
				minY  = images[i].position[1];
			}

			// Check maximums
			maxX = Math.max(maxX, images[i].position[0] + images[i].box[0]);
			maxY = Math.max(maxY, images[i].position[1] + images[i].box[1]);
		}

		maxX = (maxX - minX) / 100;
		maxY = (maxY - minY) / 100;
		
		for (i in images) {
			// Zero positions if not 0 anyway
			if (minX > 0 || minY > 0) {
				if (minX > 0) {
					images[i].position[0] -= minX;
				}

				if (minY > 0) {
					images[i].position[1] -= minY;
				}
			}

			// Make relative to maximum
			images[i].position[0] = images[i].position[0] / maxX;
			images[i].position[1] = images[i].position[1] / maxX;
			images[i].box[0] = images[i].box[0] / maxX;
			images[i].box[1] = images[i].box[1] / maxX;
		}
	}

	function unrelativisePositions(images) {
		// Store the minimum x and y values so can start the values from 0,0
		var width = this.divs.pad.width() - 2;
		var i;

		//console.log('unrelativise with width' + width);

		for (i in images) {
			if (images[i].box) {
				images[i].box[0] = images[i].box[0] / 100 * width;
				images[i].box[1] = images[i].box[1] / 100 * width;
			}

			if (images[i].position) {
				images[i].position[0] = images[i].position[0] / 100 * width;
				images[i].position[1] = images[i].position[1] / 100 * width;
			}

			/* @todo the others
			if (images[i].) {
				images[i].[0] = images[i].[0] / 100 * width;
				images[i].[0] = images[i].[0] / 100 * width;
			}
			*/
		}
	}

	function finishAction(id, direction, initial, ev) {
		//console.log('finishAction called');

		if (ev) {
			if (ev.isDefaultPrevented()) {
				return;
			}

			ev.preventDefault()
		}
	
		//console.log(this.data[id].div.offset());

		calculateNewLinks.call(this, id, direction, true);
		//console.log(this.data[id].div.offset());
		resizeArranger.call(this, true);

		//console.log(this.data[id].div.offset());
		updateImageData.call(this, id);

		relativisePositions.call(this);

		//console.log(this.data[id].div.offset());
		if (direction === null) {
			if (this.events.finishMove) {
				for (i in this.events.finishMove) {
					this.events.finishMove[i](this.images);
				}
			}
		} else {
			if (this.events.finishResize) {
				for (i in this.events.finishResize) {
					this.events.finishResize[i](this.images);
				}
			}
		}

		if (this.events.finishAction) {
			for (i in this.events.finishAction) {
				this.events.finishAction[i](this.images);
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
		//console.log('calculateNewLinks called with ' + id + ', ' + direction
		//		+ ', ' + finalise);
		
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

		var offset = this.data[id].div.offset();

		// Set up the positions
		if (direction === null || direction.search(/l/) !== -1) {
			pos.l = offset.left;
		}

		if (direction === null || direction.search(/r/) !== -1) {
			pos.r = offset.left + this.data[id].div.width();
		}

		if (direction === null || direction.search(/t/) !== -1) {
			pos.t = offset.top;
		}

		if (direction === null || direction.search(/b/) !== -1) {
			pos.b = offset.top + this.data[id].div.height();
		}

		var cpos, ipos;
		var lH, rH, tH, bH;
		for (i in this.images) {
			// Remove toLink class from all
			if (finalise) {
				for (k in pos) {
					this.data[i][k].removeClass('toLink');
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

			offset = this.data[i].div.offset();

			// Set up current image positions
			cpos = {
				l: offset.left,
				r: offset.left + this.data[i].div.width(),
				t: offset.top,
				b: offset.top + this.data[i].div.height()
			};

			//console.log(i);
			//console.log(cpos);

			// Horizontal sides
			if (ipos.t !== -1) {
				if (cpos.t >= ipos.t - spacing && cpos.t <= ipos.t + spacing) {
					cpos.t = -1;
					ipos.t = -1;
					link.t = 1;

					if (finalise) {
						newLinks['t'][i] = 't';

						this.data[i].links['t'][id] = 't';
					}
				} else if (cpos.b >= ipos.t - spacing && cpos.b <= ipos.t + spacing) {
					cpos.b = -1;
					ipos.t = -1;
					link.t = 1;

					if (finalise) {
						newLinks['t'][i] = 'b';

						this.data[i].links['b'][id] = 't';
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

						this.data[i].links['t'][id] = 'b';
					}
				} else if (cpos.b !== -1 && cpos.b >= ipos.b - spacing
						&& cpos.b <= ipos.b + spacing) {
					cpos.b = -1;
					ipos.b = -1;
					link.b = 1;

					if (finalise) {
						newLinks['b'][i] = 'b';

						this.data[i].links['b'][id] = 'b';
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

						this.data[i].links['l'][id] = 'l';
					}
				} else if (cpos.r >= ipos.l - spacing && cpos.r <= ipos.l + spacing) {
					cpos.r = -1;
					ipos.l = -1;
					link.l = 1;

					if (finalise) {
						newLinks['l'][i] = 'r';

						this.data[i].links['r'][id] = 'l';
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

						this.data[i].links['l'][id] = 'r';
					}
				} else if (cpos.r !== -1 && cpos.r >= ipos.r - spacing
						&& cpos.r <= ipos.r + spacing) {
					cpos.r = -1;
					ipos.r = -1;
					link.r = 1;

					if (finalise) {
						newLinks['r'][i] = 'r';

						this.data[i].links['r'][id] = 'r';
					}
				}
			}

			/// Check classes match links on current image
			for (j in cpos) {
				// Add/remove class and link
				if (cpos[j] === -1) {
					if (!this.data[i][j].hasClass(linkClass)) {
						this.data[i][j].addClass(linkClass);
					}
				} else {
					if (this.data[i][j].hasClass(linkClass)) {
						this.data[i][j].removeClass(linkClass);
					}

					if (finalise) {
						if (this.data[i].links[j][id]) {
							delete this.data[i].links[j][id];
						}
					}
				}
			}
		}

		/// Check classes match links on working image
		for (j in link) {
			// Add/remove class and link
			if (link[j] === 1) {
				if (!this.data[id][j].hasClass(linkClass)) {
					this.data[id][j].addClass(linkClass);
				}
			} else {
				if (this.data[id][j].hasClass(linkClass)) {
					this.data[id][j].removeClass(linkClass);
				}
			}
		}
		
		// Handle the new links
		if (finalise) {
			actionLinks.call(this, id, direction, newLinks);

			// Merge in the new Links
			for (i in pos) {
				if (pos[i] !== -1) {
					this.data[id].links[i] = newLinks[i];
				}
			}

			//console.log(this.data[id].links);
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

		//console.log('actionLinks called, direction is ' + direction);

		var newDimensions = {
			dimension: [-1, -1],
			offset: {left: -1, top: -1}
		};
		var currentDimensions = {
			dimension: [this.data[id].div.width(), this.data[id].div.height()],
			offset: this.data[id].div.offset()
		};
	
		//console.log(links);
		//console.log(currentDimensions);

		//console.log('prelink');
		//console.log('dimension (x x y) ' + newDimensions.dimension[0] + ' x '
		//		+ newDimensions.dimension[1]);
		//console.log('offset (l x t) ' + newDimensions.offset.left + ' x '
		//		+ newDimensions.offset.top);

		if (links) {
			//console.log('have links');
			//console.log(links);

			// Top
			if (links['t']) {
				for (i in links['t']) {
					//console.log('got top link for ' + i + ': ' + links['t'][i]);
					//console.log(this.data[i].div.offset());
					//console.log('w ' + this.data[i].div.width()
					//		+ ' h ' + this.data[i].div.height());
					// Move to align with other div
					if (links['t'][i] == 't') { // Move top to top of linked
						//console.log('Move top to top side of linked');
						newDimensions.offset.top = this.data[i].div.offset().top;
					} else { // Move top to bottom of linked
						//console.log('Move top to bottom side of linked');
						newDimensions.offset.top = this.data[i].div.offset().top
								+ this.data[i].div.height() + spacing
					}

					// Resize if we are resizing from the top side
					if (direction && direction.search(/t/) !== -1) {
						newDimensions.dimension[1] = currentDimensions.dimension[1]
								+ (currentDimensions.offset.top - newDimensions.offset.top);
					}

					// Don't bother with the other links (hopefully they are the same)
					break;
				}
			}

			// Left
			if (links['l']) {
				for (i in links['l']) {
					// Move to align with other div
					if (links['l'][i] == 'l') { // Move left to left side of linked
						//console.log('Move left to left side of linked');
						newDimensions.offset.left = this.data[i].div.offset().left;
					} else { // Move left to right side of linked
						//console.log('Move left to right side of linked');
						newDimensions.offset.left = this.data[i].div.offset().left
								+ this.data[i].div.width() + spacing
					}

					// Resize if we are resizing from the top side
					if (direction && direction.search(/l/) !== -1) {
						newDimensions.dimension[0] = currentDimensions.dimension[0]
								+ (currentDimensions.offset.left - newDimensions.offset.left);
					}

					// Don't bother with the other links (hopefully they are the same)
					break;
				}
			}

			// Right
			if (links['r']) {
				for (i in links['r']) {
					// Resize the image if the resizing or the offset has been updated
					if (newDimensions.offset.left !== -1 
							|| (direction && direction.search(/r/) !== -1)) {
						var offset = (newDimensions.offset.left !== -1 ?
								newDimensions.offset.left : currentDimensions.offset.left);

						//console.log('in right link');
						//console.log(offset);

						if (links['r'][i] == 'l') { // Resize width to line up with left side of linked
							//console.log('Resize width to line up with left side of linked');
							newDimensions.dimension[0] = this.data[i].div.offset().left
									- spacing - offset;
						} else { // Resize width to line up with right side of linked
							//console.log('Resize width to line up with right side of linked');
							newDimensions.dimension[0] = this.data[i].div.offset().left
									+ this.data[i].div.width() - offset; 
						}
					} else { // Move the image to match up
						var dimension = (newDimensions.dimension[0] !== -1 ?
								newDimensions.dimension[0] : currentDimensions.dimension[0]);

						if (links['r'][i] == 'l') { // Move right to left side of linked
							//console.log('Move right to left side of linked');
							newDimensions.offset.left = this.data[i].div.offset().left
									- spacing - dimension;
						} else { // Move right to right side of linked
							//console.log('Move right to right side of linked');
							newDimensions.offset.left = this.data[i].div.offset().left
									+ this.data[i].div.width() - dimension;
						}
					}

					// Don't bother with the other links (hopefully they are the same)
					break;
				}
			}

			// Bottom
			if (links['b']) {
				for (i in links['b']) {
					//console.log('got bottom link for ' + i + ': ' + links['b'][i]);
					//console.log(this.data[i].div.offset());
					//console.log('w ' + this.data[i].div.width()
					//		+ ' h ' + this.data[i].div.height());
					// Resize the image if the resizing or the offset has been updated
					if (newDimensions.offset.top !== -1 
							|| (direction && direction.search(/b/) !== -1)) {
						var offset = (newDimensions.offset.top !== -1 ?
								newDimensions.offset.top : currentDimensions.offset.top);

						//console.log('in bottom link');
						//console.log(offset);

						if (links['b'][i] == 't') { // Resize height to line up with top side of linked
							//console.log('Resize height to line up with top side of linked');
							newDimensions.dimension[1] = this.data[i].div.offset().top
									- spacing - offset;
						} else { // Resize height to line up with bottom side of linked
							//console.log('Resize height to line up with bottom side of linked');
							newDimensions.dimension[1] = this.data[i].div.offset().top
									+ this.data[i].div.height() - offset; 
						}
					} else { // Move the image to match up
						var dimension = (newDimensions.dimension[1] !== -1 ?
								newDimensions.dimension[1] : currentDimensions.dimension[1]);

						//console.log('in bottom link');
						//console.log(dimension);

						if (links['b'][i] == 't') { // Move so bottom is aligned with top side of linked
							//console.log('Move so bottom is aligned with top side of linked');
							newDimensions.offset.top = this.data[i].div.offset().top
									- spacing - dimension;
						} else { // Move so bottom is aligned with bottom side of linked
							//console.log('Move so bottom is aligned with bottom side of linked');
							newDimensions.offset.top = this.data[i].div.offset().top
									+ this.data[i].div.height() - dimension;
						}
					}

					// Don't bother with the other links (hopefully they are the same)
					break;
				}
			}

			//console.log('unfixed');
			//console.log('dimension (x x y) ' + newDimensions.dimension[0] + ' x '
			//		+ newDimensions.dimension[1]);
			//console.log('offset (l x t) ' + newDimensions.offset.left + ' x '
			//		+ newDimensions.offset.top);

			// Force correct ratio if we changed a dimension (height priority)
			if (this.images[id].format === 'ratio') {
				var dimension;
				if (newDimensions.dimension[1] !== -1) {
					ratioDim = newDimensions.dimension[1] * this.data[id].ratio;
					var dimension = (newDimensions.dimension[0] !== -1 ?
							newDimensions.dimension[0] : currentDimensions.dimension[0]);
					if (ratioDim !== dimension) {
						newDimensions.dimension[0] = ratioDim;
						// Resize to the left if resizing left or right is linked
						if ((!links['l'] && links['r']) || (direction && direction.search(/l/) !== -1)) {
							var offset = (newDimensions.offset.left !== -1 ?
									newDimensions.offset.left : currentDimensions.offset.left);

							newDimensions.offset.left = offset + (dimension - ratioDim);
						}
					}
				} else if (newDimensions.dimension[0] !== -1) {
					ratioDim = newDimensions.dimension[0] / this.data[id].ratio;
					var dimension = (newDimensions.dimension[1] !== -1 ?
							newDimensions.dimension[1] : currentDimensions.dimension[1]);
					if (ratioDim !== dimension) {
						newDimensions.dimension[1] = ratioDim;
						// Resize up if resizing up or bottom is linked
						if ((!links['t'] && links['b']) || (direction && direction.search(/i/) !== -1)) {
							var offset = (newDimensions.offset.top !== -1 ?
									newDimensions.offset.top : currentDimensions.offset.top);

							newDimensions.offset.top = offset + (dimension - ratioDim);
						}
					}
				}
			}

			//console.log(newDimensions);

			// Set new values
			if (newDimensions.dimension[0] !== -1) {
				this.data[id].div.width(newDimensions.dimension[0]);
			}
			
			if (newDimensions.dimension[1] !== -1) {
				this.data[id].div.height(newDimensions.dimension[1]);
			}
			
			var offset = {}, set = false;
			if (newDimensions.offset.top !== -1) {
				offset.top = newDimensions.offset.top;
				set = true;
			}
			if (newDimensions.offset.left !== -1) {
				offset.left = newDimensions.offset.left;
				set = true;
			}
			
			if (set) {
				this.data[id].div.offset(offset);
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
			var test = this.data[i].div.height() + this.data[i].div.offset().top;
			maxHeight = Math.max(this.data[i].div.height()
					+ this.data[i].div.position().top, maxHeight);
		}

		if (finalise || maxHeight > this.divs.pad.height()) {
			this.divs.pad.height(maxHeight);
		}
	}

	/**
	 * Adjust the styling on the div, so that the background image matches the
	 * image format.
	 */
	function adjustStyling(id) {
		switch(this.images[id].format) {
			case 'crop':
				console.log('got crop image');
				console.log(this.images[id]);
				this.data[id].div
						.css('background-position', ((!this.images[id].offset
						|| this.images[id].offset[0] === -1)
						? 'center' : this.images[id].offset[0] + 'px') + ' '
						+ ((!this.images[id].offset || this.images[id].offset[1] === -1)
						? 'center' : this.images[id].offset[1] + 'px'));
				if (this.images[id].scale !== -1) {
				this.data[id].div
						.css('background-size', (this.images[id].size[0] * this.images[id].scale)
						+ 'px ' + (this.images[id].size[1] * this.images[id].scale) + 'px');
					break;
				}
			case 'ratio':
				this.data[id].div.css('background-size', 'cover');
				break;
		}
	}

	/**
	 * Updates the stored image data
	 */
	function updateImageData(id) {
		var image = this.images[id];
		var div = this.data[id].div;

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

			if (image.offset) {
				delete image.offset;
			}
		}
	}

	function createSettingsHTML() {
		// Add 
		//this.settingsDiv.append(this
		var ref = this;

		// Add custom actions
		if (this.options.actions) {
			for (i in this.options.actions) {
				if (!(this.options.actions[i] instanceof Object) || !this.options.actions[i].label
						|| !this.options.actions[i].func || !this.options.actions[i].func.call) {
					continue;
				}

				this.divs.settings.append($('<button>' + this.options.actions[i].label
						+ '</button>').bind('singletap', this.options.actions[i].func.bind(null, ref)));
			}
		}
	}

	function toggleFormat(id, ev) {
		console.log('toggleFormat called');
		if (this.images[id]) {
			if (ev && ev.preventDefault) {
				if (ev.isDefaultPrevented()) {
					return;
				}

				ev.preventDefault();
			}

			if (this.images[id].format == 'crop') {
				this.images[id].format = 'ratio';
				this.data[id].div.removeClass('crop');

				console.log(this.images[id]);
				console.log(this.data[id]);

				// Adjust box to correct ratio
				var diffY = Math.round(this.data[id].div.width() / this.data[id].ratio) - this.data[id].div.height(),
						diffX = Math.round(this.data[id].div.height() * this.data[id].ratio) - this.data[id].div.width();

				// Don't adjust if we don't need to
				if (diffX) {
					if (Math.abs(diffX) > Math.abs(diffY)) {
						this.data[id].div.height(this.data[id].div.height() + diffY);
					} else {
						this.data[id].div.width(this.data[id].div.width() + diffX);
					}
				}

				// Update data
				updateImageData.call(this, id);
			} else {
				this.images[id].format = 'crop';
				this.data[id].div.addClass('crop');
			}

			adjustStyling.call(this, id);
		}
	}

	function padMove(ev, touch) {
		//console.log('padMove. Current image is: ' + this.currentImageId);
		//this.divs.settings.append('padMove');
		if (this.currentImageId !== null) {
			if (this.currentHandle) {
				//console.log('running doResize');
				doResize.call(this, this.currentImageId, this.currentHandle,
						this.initialEvent, ev, touch);
			} else {
				//console.log('running doMove');
				doMove.call(this, this.currentImageId, this.currentHandle,
						this.initialEvent, ev, touch);
			}
		}
	}

	function padEnd(ev, touch) {
		if (this.currentImageId !== null) {
			finishAction.call(this, this.currentImageId, this.currentHandle,
					this.initialEvent, ev);

			this.currentImageId = null;
			this.currentHandle = null;
			this.initialEvent = null;

			//console.log(this.images)
			//console.log(this.getData());
		}
	}

	function padStart(ev, touch) {
		//console.log('padStart');
		//console.log(ev);
		var target = $(ev.target);
		var id, handle;

		//console.log('test');
		if (ev && ev.preventDefault) {
			if (ev.isDefaultPrevented()) {
				return;
			}

			ev.preventDefault();
		}

		// Find
		do {
			//console.log(target);
			// Reached an image or pointer
			if ((id = target.data('arrangerImageId')) !== undefined) {
				//console.log('id for start is ' + id);
				break;
			}

			// Reached pad
			if (target.is(this.divs.pad)) {
				return;
			}
		} while (target = target.parent());

		//console.log('fin');

		this.currentImageId = id;

		//this.initialEvent = ev;
		this.initialEvent = {
			ev: ev,
			/** @todo File bug report
			 * touch.offset currently seems to be the offset relative to the original
			 * target rather than the bound target as is the target
			 * offset: touch.offset,
			 */
			touch: touch.position,
			width: this.data[id].div.width(),
			height: this.data[id].div.height(),
			offset: this.data[id].div.offset(),
			pos: this.data[id].div.position()
			//pos: this.data[id].div.position()
			//pos: {
			//	left: this.data[id].div.offsetLeft,
			//	top: this.data[id].div.offsetTop
			//}
		};


		// See if we have a handle (are resizing)
		if (handle = target.data('arrangerHandle')) {
			this.currentHandle = handle;

			// Calculate the minimum and maximum deltas for the handle
			this.initialEvent.minDelta = {};
			this.initialEvent.maxDelta = {};

			if (handle.search(/l/) !== -1) {
				this.initialEvent.minDelta.x = -this.initialEvent.pos.x;
				this.initialEvent.maxDelta.x = this.initialEvent.width; // Add min size
			} else { // right handle
				this.initialEvent.minDelta.x = -this.initialEvent.width; // Add min size
				this.initialEvent.maxDelta.x = this.divs.pad.width() 
					- this.initialEvent.pos.x - this.initialEvent.width;
			}

			if (handle.search(/t/) !== -1) {
				this.initialEvent.minDelta.y = -this.initialEvent.pos.y;
				this.initialEvent.maxDelta.y = this.initialEvent.height; // Add min size
			} else { // right handle
				this.initialEvent.minDelta.y = -this.initialEvent.height; // Add min size
			}
		}

		//console.log('id ' + id + ', handle ' + handle);
	}

	/** Prototype for the arranger object
	 *
	 * @param div {JQueryDOMObject} Object to make into the arranger.
	 */
	function Arranger(div, options) {
		var i, j;

		this.images = [];
		this.data = [];
		this.divs = {};

		// Next added image positions
		this.nextX = 0;
		this.nextY = 0;

		/**
		 * @prop actions {Array} 
		 */
		this.options = $.extend({
			actions: [],
			nextStep: 30,
			addedImagePercentage: 25
		}, options);

		//console.log('making arranger');
		//console.log(div);
		//console.log(this.options);

		this.events = {
			preMove: [],
			preResize: [],
			finishMove: [],
			finishResize: [],
			finishAction: []
		};

		this.currentImageId = null;
		this.currentHandle = null;

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
		this.divs.div = div;

		createSettingsHTML.call(this);

		var doc;
		console.log(this.divs.pad.closest('body'));
		if (!((doc = this.divs.pad.closest('body')).length)) {
			console.log('Couldn\'t find parent body...?');
			doc = this.divs.pad;
		}
		this.divs.pad.bind('tapstart', padStart.bind(this));
		doc.bind('tapmove', padMove.bind(this));
		doc.bind('tapend', padEnd.bind(this));

		if (this.options.images) {
			if (this.options.percent) {
				// Scale images
				unrelativisePositions.call(this, this.options.images)
			}

			this.addImage(this.options.images);
		}
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
			//console.log('addImage called');
			//console.log(images);
			if (!(images instanceof Array)) {
				images = [images];
			}

			var i;
			for (i in images) {
				console.log('image ' + i + ' box is ' + images[i].box);
				// Make sure we have an object and a href; if not, ignore
				if (images[i] instanceof Object && images[i].href) {
					//console.log('have an image ' + images[i].href);
					// Add the image to the arranger
					var id = this.images.length;
					this.images[id] = images[i];
					this.data[id] = {
						links: {
							l: {},
							r: {},
							t: {},
							b: {}
						}
					};

					//console.log('Added image ' + id);

					this.divs.pad.append((this.data[id].div = $('<div '
							+ 'style="background: url(\'' + images[i].href + '\');' 
							+ 'position: absolute; background-repeat: no-repeat;"></div>')
							.attr('data-arranger-image-id', id)
							.data('arrangerImageId', id)
							));

					/// @todo Get image size?
					// this would not be related to the actual image size, but the size
					// of the div, so can't get the image ratio off of it.
					//console.log(image);
					if (this.images[id].width && this.images[id].height) {
						this.images[id].size = [this.images[id].width, this.images[id].height];
					} else if (this.images[id].box) {
						this.images[id].size = this.images[id].box;
					}

					// Determine ratio
					this.data[id].ratio = this.images[id].size[0] / this.images[id].size[1];

					if (!this.images[id].box) {
						var width = Math.min(this.divs.pad.width(), this.divs.pad.width()
								* this.options.addedImagePercentage / 100);
						// Set size based on a certain percentage of the window
						this.images[id].box = [width, width / this.data[id].ratio];
						/// @todo ensure size is not larger than the current pad
						//this.images[id].box = [this.images[id].size[0], this.images[id].size[1]];
					}
					
					// Best guess format
					if (!this.images[id].format) {
						if (!this.images[id].scale && !this.images[id].offset) {
							this.images[id].format = 'ratio';
						} else {
							this.images[id].format = 'crop';
						}
					}

					if (!this.images[id].position) {
						// If the image will be off the end of the pad, restart the X
						if (this.nextX + this.images[id].box[0] > this.divs.pad.width()) {
							this.nextX = 0;
						}
						this.images[id].position = [this.nextX, this.nextY];
						this.nextX += this.options.nextStep;
						this.nextY += this.options.nextStep;
					}

					// Fill in the blanks
					//console.log(id + ' image format is ' + this.images[id].format);
					if (this.images[id].format == 'crop') {
						if (!this.images[id].scale) {
							this.images[id].scale = -1;
						}

						if (!this.images[id].offset) {
							this.images[id].offset = [-1, -1];
						}
					}

					// Apply initial size
					//console.log('setting dimensions for ' + id + ' to '
					//		+ images[i].box[0] + ' x ' + images[i].box[1]);
					this.data[id].div.width(images[i].box[0]);
					this.data[id].div.height(images[i].box[1]);

					//console.log('setting position for ' + id + ' to '
					//		+ images[i].position[0] + ' x ' + images[i].position[1]);
					var offset = this.divs.pad.offset();
					this.data[id].div.offset({
						left: offset.left + images[i].position[0],
						top: offset.top + images[i].position[1]
					});

					// Add format styling
					adjustStyling.call(this, id);

					// Add indicators and sizers to image div
					var s;

					for (s in indicators) {
						this.data[id].div.append(this.data[id][indicators[s]] = $('<div class="' + indicators[s]
							+ '"></div>')
						);
					}

					for (s in sizers) {
						this.data[id].div.append(this.data[id][sizers[s]] = $('<div class="' + sizers[s]
							+ '"></div>')
							.data('arrangerImageId', id)
							.data('arrangerHandle', sizers[s])
						);
					}

					// Add settings buttons
					this.data[id].div.append(this.data[id].settings = $('<div class="'
							+ 'settings"></div>')
							.append(this.data[id].crop = $('<div class="crop"></div>')
							.bind('singletap', toggleFormat.bind(this, id))
							.bind('tapstart', function(ev) {
								ev.preventDefault();
							}))
							//.append(this.data[id].crop = $('<div class="crop"></div>'))
							);
				}
			}

			resizeArranger.call(this, true);
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
				if (this.data[i].id && this.data[i].id === id) {
					// Go through and delete references in links
					for (l in this.data[i].links) {
						links = this.data[i].links[l];
						for (j in links) {
							delete this.data[j].links[links[j]][id];
						}
					}

					// Delete image
					this.data[i].div.remove();

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
		 *        the images data as the only parameter.
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
		/**
		 * JQuery Image arranger. Used to arrange images into a nice layout.
		 * Can be called in one of three ways. To initialise an arranger on a
		 * JQueryDOMObject, call it passing an Object containing the options as the
		 * cmd parameter. To retrieve a reference to the Arranger object on a
		 * JQueryDOMObject, call it with no parameters. To call a function of the
		 * associated Arranger, call it passing the string name of the function to
		 * call. Any additional parameters will be passed to the called function.
		 *
		 * @param cmd {Object|String|Undefined} An object of options @see Arranger,
		 *        a string indentifier of a function to run @see
		 *        Arranger.prototype, or nothing (undefined) to retrieve the
		 *        Arranger associated with a JQueryDOMObject.
		 */
		arranger: function(cmd) {
			var arranger;
			//console.log('arranger.js called');
			//console.log(cmd);
			if (cmd instanceof Object) {
				//console.log('have an object');
				$(this).each(function() {
					//console.log('in each');
					if (!$(this).data(dataKey)
							|| !($(this).data(dataKey) instanceof Arranger)) {
						//console.log('making arranger');
						$(this).data(dataKey, new Arranger($(this), cmd));
					}
				});
			} else if (typeof cmd == "string") {
				if ((arranger = $(this).data(dataKey)) && arranger instanceof Arranger
						&& arranger[cmd]) {
					var args = Array.prototype.slice.call(arguments, 1);
					arranger[cmd].apply(arranger, args);
				}
			} else if (cmd === undefined) {
				return $(this).data(dataKey);
			}

			return $(this);
		}
	});
})(jQuery);
