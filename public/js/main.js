

// DOM Ready ===========================================================
$(document).ready(function() {

    $('#submitQuestion #inputDeadline').timepicker();

    // // Populate the user table on initial page load
    // populateTable();

    // // Add User button click
    // $('#btnGetQuery').on('click', getQuery);

    // // Add User button click
    // $('#btnPatrol').on('click', sendPatrol);

    // // Add User button click
    // $('#btnCSEXXX').on('click', sendCSE4XX);

    // // Add User button click
    // $('#btnSTART').on('click', sendSTART);

    // // Username link click
    // $('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);

    // Add User button click
    $('#btnSubmitQuestion').on('click', submitQuestion);

    // // Delete User link click
    // $('#userList table tbody').on('click', 'td a.linkdeleteuser', deleteUser);

});

// Functions ===========================================================

// Add User
function submitQuestion(event) {
    event.preventDefault();

    console.log("Hello");
    console.log($('#submitQuestion input#inputTypedCmd').val());
    console.log($('#submitQuestion button#btnToggleSMS').hasClass('active'));
    console.log($('#submitQuestion button#btnToggleEmail').hasClass('active'));

    // get toggle state and other state
    // then send to the server

    // // TODO(mjyc): do better validation
    // var errorCount = 0;
    // $('#addUser input').each(function(index, val) {
    //     if($(this).val() === '') { errorCount++; }
    // });

    // Check and make sure errorCount's still at zero
    // if(errorCount === 0) {

        // If it is, compile all user info into one object
        var newQueryJob = {
            // 'user_id': $('#submitQuestion input#inputUserName').val(),
            // 'notification_type': $('#submitQuestion input#inputUserEmail').val(),
            'timeissued': new Date(),
            'typed_cmd': $('#submitQuestion input#inputTypedCmd').val(),
            // 'ros_cmd': $('#submitQuestion input#inputUserGender').val()
        }

        // Use AJAX to post the object to our adduser service
        $.ajax({
            type: 'POST',
            data: newQueryJob,
            url: '/queryjobs/addqueryjob',
            dataType: 'JSON'
        }).done(function( response ) {

            // Check for successful (blank) response
            if (response.msg === '') {

                console.log('successful!! Yay!!');

                // // Clear the form inputs
                // $('#addUser fieldset input').val('');

                // // Update the table
                // populateTable();

            }
            else {

                // If something goes wrong, alert the error message that our service returned
                alert('Error: ' + response.msg);

            }
        });
    // }
    // else {
    //     // If errorCount is more than 0, error out
    //     alert('Please fill in all fields');
    //     return false;
    // }
};
