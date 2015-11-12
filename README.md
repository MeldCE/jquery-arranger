Image Arranger
=============================
A small package to help arrange images into a nice layout.

```
jQuery(function($) {
	$('#arranger').arranger({})
			.arranger('addImage', {
				href: 'imgs/sunset.jpg',
				box: [200, 150],
			})
			.arranger('addImage', {
				href: 'imgs/stairs.jpg',
				box: [200, 150],
			})
			.arranger('addImage', {
				href: 'imgs/fountain.jpg',
				box: [150, 200],
				format: 'crop'
			});
});
```

## Example
http://meldce.github.io/jquery-arranger/dist/example.html

## Arranger Options Object
```
{
	actions: [
		{
			label: '',
			func: function(Arranger) {}
		},
		...
	],
```
TODO More to come

## Arranger Image Object
TODO
