$(document).ready(function(){
    // Initiating our Auth0Lock
    let lock = new Auth0Lock(
        'Gqi3Wm43FPzMbOgg5ZdPE2k4BhOQo8AB',
        'pmbanugo.eu.auth0.com',
        {
            auth: {
                //redirectUrl: 'http://localhost:5000',
                params: {
                    scope: 'openid profile email'
                }   
            },
            autoclose: true,
            closable: false,
            rememberLastLogin: true
        }
    );

    // Listening for the authenticated event
    lock.on("authenticated", function(authResult) {
        // Use the token in authResult to getUserInfo() and save it to localStorage
        lock.getUserInfo(authResult.accessToken, function(error, profile) {
            if (error) {
                // Handle error
                console.log(error);
                return;
            }
            
            localStorage.setItem('accessToken', authResult.accessToken);
            localStorage.setItem('profile', JSON.stringify(profile));
            localStorage.setItem('isAuthenticated', true);
            updateValues(profile, true);
            $("#username").html(profile.name);
        });
    });

    let profile = JSON.parse(localStorage.getItem('profile'));
    let isAuthenticated = localStorage.getItem('isAuthenticated');

    let updateValues = (userProfile, authStatus) => {
        profile = userProfile;
        isAuthenticated = authStatus;
    }

    if(!isAuthenticated && !window.location.hash){
        lock.show();
    }
    else{
        if(profile){
            $("#username").html(profile.name);
        }
        
        // Enable pusher logging - don't include this in production
        Pusher.logToConsole = true;

        var pusher = new Pusher('da857397f8eec3092630', {
            cluster: 'eu',
            encrypted: false
        });

        // var pusher = new Pusher('APP_SECRET', {
        //     cluster: 'eu',
        //     encrypted: false
        // });

        var channel = pusher.subscribe('public-chat');
        channel.bind('message-added', onMessageAdded);

        $('#btn-chat').click(function(){
            const message = $("#message").val();
            $("#message").val("");

            console.log(profile);
            console.log(isAuthenticated)

            //send message
            $.post( "http://localhost:5000/message", { message, name: profile.name } );
        });

        function onMessageAdded(data) {
            let template = $("#new-message").html();
            template = template.replace("{{body}}", data.message);
            template = template.replace("{{name}}", data.name);

            $(".chat").append(template);
        }

        $("#logout").click((e) => {
            e.preventDefault();

            localStorage.clear();
            isAuthenticated = false;

            lock.logout({ 
                returnTo: "http://localhost:5000" 
            });
        });
    }    
});