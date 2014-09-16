// =====================================================================
// ROS
// =====================================================================

// ROS setups.
var ros = new ROSLIB.Ros({
  url: urlROS
});

ros.on('connection', function() {
  console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
  console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
  console.log('Connection to websocket server closed.');
  location.reload(true);
});

var listener = new ROSLIB.Topic({
  ros: ros,
  name: '/queryjob_update',
  messageType: 'sara_queryjob_manager/QueryJobUpdate'
});

listener.subscribe(function(message) {
  console.log(message);
  queryjobCards.refreshCard(message.queryjob_id);
});

// =====================================================================
// DOM Ready
// =====================================================================

$(document).ready(function() {

  // Make switches pretty.
  $('.js-switch').each(function(index) {
    new Switchery(this);
  });

  // Initialize contents.
  queryjobCards.init({
    publicMode: true
  });
});
