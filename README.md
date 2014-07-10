OAuth.io tutorial for server-side flow (PHP)
================================================

This tutorial will show you how to integrate OAuth.io in your PHP backend with a web front-end, using the server-side flow.

This tutorial uses both the OAuth.io front-end JavaScript SDK and the OAuth.io PHP SDK.

This tutorial is based on a git repository that you can clone. You can follow the instructions by yourself or checkout each step of the tutorial, which are marked by tags in the git repository.

In this tutorial, we'll have to implement the server-side flow. This flow includes the following steps :

- The client asks the backend for a state token through GET
- The backend gives a state token
- The client runs the OAuth flow (popup or redirect) with that token
- OAuth.io responds with a code
- The client gives that code to the backend through POST
- The backend sends that code to OAuth.io and is given an access_token in return
- The backend saves the access_token in the session for future use from other endpoints

**Running the project**

You need to have a server engine like Apache2 or Nginx with PHP 5.4 or greater to run the project. Set the folder of the project as your DocumentRoot or equivalent.

If you are on Apache, you need to have the mod_rewrite module active.

You'll be able to see on the right which endpoint has already been coded or not.

The tutorial thus contains the following steps :

**Part 1 : server-side code**

- **step-0** Getting the code (tagged *step-0*)
- **step-1** Initializing OAuth.io server-side (tagged *step-1*)
- **step-2** Adding a state token retrieval endpoint server-side (tagged *step-2*)
- **step-3** Adding an authentication endpoint server-side (tagged *step-3*)
- **step-4** Adding a request endpoint server-side (tagged *step-4*)

**Part 2 : client-side code**

- **step-5** Initializing OAuth.io client-side (tagged *step-5*)
- **step-6** Adding a call to retrieve the state token (tagged *step-6*)
- **step-7** Adding a call to authenticate the user (tagged *step-7*)
- **step-8** Adding a call to the request endpoint to get user info (tagged *step-8*)

Before you start
----------------

To be able to follow the tutorial, you need to be registered on [oauth.io](https://oauth.io), and to have an application containing the provider **Facebook**, which must be set on **server-side** flow.

Part 1 : server-side code
-------------------------

In this part you'll have to get the code from our Github repository, and fill up gaps in it to complete the tutorial.

The project in the repository is a really simple webserver written in PHP with expressjs, that serves a single static page. That page must allow a user to login through Facebook, retrieve his basic information (name, email, avatar), and finally display them on the page.

Everything that doesn't concern OAuth.io's integration has already been written to gain time.

**Step 0 :  Getting the code**

To checkout tutorial Github repository, just run the following commands :

```sh
$ git clone https://github.com/oauthio/sdk-php-tutorial
```

To get the beginning point and start coding, checkout the `step-0` tag :

```sh
$ git checkout step-0
```

Then you need to run `composer update` to install all the dependencies of the project.

```sh
$ composer update
```

You are now all set to follow the tutorial !

**Step 1 : Initializing OAuth.io server-side**

The first thing you need to do is to install the OAuth.io PHP SDK and save it to the project's dependencies in the composer.json :

```json
"require": {
    ...,
    "oauth-io/oauth": "0.1.1"
}
```

Note that the `minimum-stability` field must be set to `dev`. If other dependencies are messed with when you do that, just add `@stable` at the end of the asked version. For example :
```json
"require": {
    ...
    "zendframework/zendframework": "2.3.*@stable",
    ...
}

```

For simplicity matters, the whole backend is contained in a single controller file, in `module/Application/src/Application/Controller/IndexController.php`.

In that file, you'll find comments defining placeholders for the different steps of the tutorial.

Here we need to initialize the SDK. To do that, you need to note the key and secret of the app you want to use on OAuth.io (in that case an app with the provider `Google`).

Once you have them, take a look at the `module/Application/config/config.example.php`. This file holds a configuration that we will use in the controller file, and will enable us to store the key and secret efficiently.

You'll have to fill the gaps, and rename the file as `config.php`.

```php
<?php
return array(
    // These are the key and secret of your app
    // on oauth.io
    'app_key' => 'your_app_key',
    'app_secret' => 'your_app_secret',

    // Set to false if you are running your own oauthd
    // with an unverified certificate.
    'ssl_verification' => true,
    
    // Change this to the URL of your oauthd instance
    // if you have one. Otherwise leave it like this.
    'oauthd_url' => 'https://oauth.io'
);
//?>
```

Then, we will use this file to initialize the backend in `IndexController.php`. You will find in that file a comment placeholder for the initialization part :

```php
<?php
    public function __construct() {
        session_start();
        if (file_exists(__DIR__ . '/../../../config/config.php')) {
            
            // Requires a config array containing your
            // app key and app secret from oauth.io
            $config = require (__DIR__ . '/../../../config/config.php');
            
            // Initialize the SDK here (done in step 1)
        } else {
            $this->error = true;
        }
    }
//?>
```


Replace the `// Initialize the SDK here (done in step 1)` comment with :

```php
<?php
    // Initializes the SDK
    $this->oauth->initialize($config['app_key'], $config['app_secret']);
?>
```

You can add add more options just before the `initialize` method to set a different oauthd URL (if you have your own oauthd server), or to disable ssl certificate verification (again if you have your own oauthd server, and that this server's certificate is not verified by a third party) :

```php
<?php
    [...]
    // Disables the SSL certificate verification if you're
    // running a private oauthd instance, with no verified
    // certificate.
    // SSL verification is active by default.
    $this->oauth->setSslVerification($config['ssl_verification']);
    
    // Sets the oauthd URL. This step is not compulsory if
    // the URL is https://oauth.io.
    $this->oauth->setOAuthdUrl($config['oauthd_url']);

    [...]
?>
```

That's it for step 1.

If you want to get the code from step 1, just run the following command (note that the configuration step is compulsory for things to work):

```sh
$ git checkout step-1 --force
```

Note that any change you made will be discarded and replaced by the code shown in this tutorial (except for your config.php file, that is ignored by Git and will remain there).

**step-2 Adding a state token retrieval endpoint server-side**

Now that the SDK is initialized, we need to generate a state token that we will use to get a code (on the client-side) from OAuth.io that will be used to get an access token server-side.

Find the following comment and error code in the `IndexController.php` file (look for the `tokenAction` method) :

```php
<?php
///[...]
public function tokenAction() {
    // Replace this code to send a generated token to the front-end
    $this->getResponse()->setStatusCode(404);
}
//[...]
//?>
```

Replace it with the following code :

```php
<?php
///[...]
public function tokenAction() {
    // This generates a token and stores it in the session
    $token = $this->oauth->generateStateToken();

    $array = array(
        'token' => $token
    );
    $json = new JsonModel($array);
    return $json;
}
//[...]
//?>
```

That's it for step 2. If you want to get the code right away, just run the following command :

```sh
$ git checkout step-2 --force
```

**step-3 Adding an authentication endpoint server-side**

In this step we'll add an authentication endpoint in the backend so that the front-end can give it the code retrieved from OAuth.io.

Find the following comment and error code in the `IndexController.php` file (look for the `authAction` method) :

```php
<?php
//[...]
 public function authAction() {
    // Replace this code to retrieve the access token from OAuth.io
    $this->getResponse()->setStatusCode(404);
}
//[...]
//?>
```

Just replace this with the following code :

```php
<?php
//[...]
 public function authAction() {
    $code = $this->getRequest()->getPost('code');

    // This sends the code to OAuth.io, retrieves the access token
    // and stores it in the session for use in other endpoints
    $array = $this->oauth->auth('google', array(
        'code': $code
    ));

    $json = new JsonModel($array);

    // Checks if the response gave an access token (for OAuth2 in that case)
    // which works as we're using Facebook.
    if (!isset($array['access_token'])) {
        $this->getResponse()->setStatusCode(400);
    }
    return $json;
}
//[...]
//?>
```

That's it for step 3. If you want to get the code right away, just run the following commands :

```sh
$ git checkout step-3 --force
```

**step-4 Adding a request endpoint server-side**

In this step we'll add a final endpoint to our server which will allow the front-end to get information about the user.

Find the following comment and error code in the `IndexController.php` file (look for the `requestAction` method) :

```php
<?php
//[...]
public function requestAction() {
    // Replace this code to retrieve user info from Facebook
    $this->getResponse()->setStatusCode(404);
}
//[...]
//?>
```

Just replace it with the following code :

```php
<?php
//[...]
public function requestAction() {
        // This creates a request object that contains the methods
        // get|post|put|patch|del|me to perform API requests
        // thanks to the credentials stored in the session
        $request_object = $this->oauth->auth('google');

        // This performs a request on the unified user info endpoint
        // to get his name, email and avatar, regardless of the provider's
        // implementation
        $me = $request_object->me(array(
            'name',
            'email',
            'avatar'
        ));

        $json = new JsonModel($me);
        return $json;
    }
//[...]
//?>
```

That's it for step 4. If you want to get the code right away, just run the following command :

```sh
$ git checkout step-4 --force
```


Part 2 : client-side code
-------------------------

**step-5 Initializing OAuth.io client-side**

In this step we'll initialize the OAuth.io client-side JavaScript SDK. The SDK is already pointed by the `public/index.html` file. That file also points to `public/src/script.js` where we'll put our code.

Open the `public/src/script.js` file. You'll find placeholders for each remaining step. You just have to fill functions that are called in the right order at the end of the file like this :

```javascript
$('#login_button').click(function() {
    // called when the user clicks on the login button

    // calls your function to init the SDK
    init_oauthio();
    // calls your function to retrieve a token from your endpoint
    retrieve_token(function(err, token) {
            // calls your function to launch a popup with the state token
            // and call the authentication endpoint with the resulting code
            authenticate(token, function(err) {
                if (!err) {
                    // calls your function to call your request endpoint
                    retrieve_user_info(function(user_data) {
                        // fills elements in the page with the user info
                        $('#name_box').html(user_data.name)
                        $('#email_box').html(user_data.email);
                        $('#img_box').attr('src', user_data.avatar);
                    });
                }
            });
        })
    });
});
```

In this step, you just have to fill the initialization function :

```javascript
function init_oauthio() {
    // Add the code to initialize OAuth.io here
}
```

Fill that function like this :

```javascript
function init_oauthio() {
    OAuth.initialize(credentials.key);
}
```

The `credentials` object has to be created first. The `index.html` page also points to a `src/credentials.js` file in which we can setup that object. You need to rename the `src/credentials.example.js` to `src/credentials.js` and fill the key with your OAuth.io app key.

That's it for step 5. To get the code right away, just run the following command :

```sh
$ git clone step-5 --force
```

**step-6 Adding a call to retrieve the state token**

In this step you'll have to fill the `retrieve_token` function to get a token from the backend. This is a simple GET request, that we'll perform thanks to jQuery's `ajax` method.

Just replace the placeholder :

```javascript
function retrieve_token(callback) {
    // Add the code to retrieve the state token here
}
```

with this code :

```javascript
function retrieve_token(callback) {
    $.ajax({
        url: '/oauth/token',
        success: function (data, status) {
            callback(null, data.token);
        },
        error: function (data) {
            callback(data);
        }
    });
}
```

This allows us to handle the token from elsewhere in a callback. If an error occurs, we give it as a first argument to `callback`.

That's it for step 6. If you want to get the code right away, just run the following command :

```sh
$ git checkout step-6 --force
```

**step-7 Adding a call to authenticate the user**

In this step, you need to add code to launch a popup from the OAuth.io client-side SDK, giving it the state token you got from the previous step.

Once the user will have logged in the provider's website and accepted the asked permissions, you'll be given a code from OAuth.io that will allow your backend to retrieve the provider access token.

You then need to send the code to the authentication endpoint you created in your backend previously.

To do all that, just replace the placeholder :

```javascript
function authenticate(code, callback) {
    // Add the code to authenticate the user here
}
```

with :

```javascript
function authenticate(token, callback) {
    // Launches a popup showing the provider's website
    // for the user to login and to accept permissions
    OAuth.popup('facebook', {
        state: token
    })
        .done(function(r) {
            // Sends the code to the authentication endpoint
            // we created earlier
            $.ajax({
                url: '/oauth/signin',
                method: 'POST',
                data: {
                    code: r.code
                },
                success: function(data, status) {
                    // Here the user is authenticated.
                    // We can call a request endpoint to retrieve information
                    // in the callback.
                    callback(null, data);
                },
                error: function(data) {
                    callback(data);
                }
            });
        })
        .fail(function(e) {
            console.log(e);
        });
}
```


That's it for step 7. If you want to get the code right away, just run the following command :

```sh
$ git checkout step-7 --force
```

**step-8 Adding a call to the request endpoint to get user info**

Now we can finally retrieve the user's information through our `/me` endpoint.

To do that, we need to make a GET request to that endpoint. Just replace the following placeholder :

```javascript
function retrieve_user_info(callback) {
    // Add the code to perform a user request here
}
```

with the following code :

```javascript
function retrieve_user_info(callback) {
    $.ajax({
        url: '/me',
        success: function (data, status) {
            // Here the callbaxk just gets the name, email and avatar field and
            // fills the elements of the page.
            callback(data);
        },
        error: function (data) {
            console.log(data);
        }
    });
}
```

That's it for step 8. If you want to get the code right away, just run the following command :

```sh
$ git checkout step-8 --force
```

**Testing**

You can now launch the server and access the page on `localhost` or the url set by your webserver if different. You can click on the login button, which will show the popup, retrieve your info and display it on the page.
