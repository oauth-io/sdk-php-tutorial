//check if the endpoints are available

function available(elt) {
	$('.' + elt + '_endpoint_missing').hide();
	$('.' + elt + '_endpoint_available').show();
}

$.ajax({
	url: '/oauth/token',
	success: function () {
		available('token');
	},	
	error: function (r) {
		if (r.status !== 404) {
			available('token');
		}
	}
});

$.ajax({
	url: '/oauth/signin',
	method: 'POST',
	success: function () {
		available('auth');
	},	
	error: function (r) {
		if (r.status !== 404) {
			available('auth');
		}
	}
});

$.ajax({
	url: '/me',
	success: function () {
		available('request');
	},	
	error: function (r) {
		if (r.status !== 404) {
			available('request');
		}
	}
});