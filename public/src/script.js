function init_oauthio() {
	// Add the code to initialize OAuth.io here
}

function retrieve_token(callback) {
	// Add the code to retrieve the state token here
}

function authenticate(token, callback) {
	// Add the code to authenticate the user here
}

function retrieve_user_info(callback) {
	// Add the code to perform a user request here
}

$('#login_button').click(function() {
	init_oauthio();
	retrieve_token(function(err, token) {
		authenticate(token, function(err) {
			if (!err) {
				retrieve_user_info(function(user_data) {
					$('#name_box').html(user_data.name);
					$('#name_box').addClass('highlight');
					$('#email_box').html(user_data.email);
					$('#email_box').addClass('highlight');
					$('#img_box').attr('src', user_data.avatar);
				});
			}
		});
	});
});
