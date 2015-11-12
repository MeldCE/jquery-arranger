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
	
	function resize() {
		var i, j;
		var width = this.div.width();
		var offset = this.div.offset();

		// Add margin and padding to offset

		//		+ this.div.css('padding-top'));

		offset.left += parseInt(this.div.css('padding-left'));
		offset.top += parseInt(this.div.css('padding-top'));


		var images = this.options.images;

		var imageMaxY, maxY = 0;

		for (i in images) {


			/// @todo check for best function
			if (div = this.div.find('[data-id=' + i + ']')) {
				imageMaxY = 0;

				div.css('display', 'block');
				div.css('position', 'absolute');

				if(!(images[i].scale && images[i].offset)) {
					div.css('background-size', 'cover');
				}

				// Set box and position
				if (images[i].box) {


					div.width(images[i].box[0] / 100 * width);
					div.height(images[i].box[1] / 100 * width);
					imageMaxY += div.height();
				}

				if (images[i].position) {
					div.offset({
						left: offset.left + (images[i].position[0] / 100 * width),
						top: offset.top + (images[i].position[1] / 100 * width)
					});
					imageMaxY += (images[i].position[1] / 100 * width);
				}
			}

			maxY = Math.max(maxY, imageMaxY);
		}

		this.div.height(maxY);
	}

	/** Prototype for the arranger object
	 *
	 * @param div {JQueryDOMObject} Object to make into the arranger.
	 */
	function Arrangement(div, options) {

		this.div = div;
		/**
		 * @prop actions {Array} 
		 */
		this.options = $.extend({
			actions: [],
		}, options);

		if (!this.options.images) {
			return;
		}
		
		this.div.css('position', 'relative');

		resize.call(this);

		$(window).resize(resize.bind(this));
	}

	$.extend($.fn, {
		/**
		 * JQuery Image arrangement. Used to arrange images into a nice layout.
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
		arrangement: function(cmd) {
			var arrangement;


			if (cmd instanceof Object) {

				$(this).each(function() {

					if (!$(this).data(dataKey)
							|| !($(this).data(dataKey) instanceof Arrangement)) {

						$(this).data(dataKey, new Arrangement($(this), cmd));
					}
				});
			} else if (typeof cmd == "string") {
				if ((arrangement = $(this).data(dataKey))
						&& arrangement instanceof Arrangement && arranger[cmd]) {
					var args = Array.prototype.slice.call(arguments, 1);
					arrangement[cmd].apply(arrangement, args);
				}
			} else if (cmd === undefined) {
				return $(this).data(dataKey);
			}

			return $(this);
		}
	});
})(jQuery);
