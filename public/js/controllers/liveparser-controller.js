'use strict';

var liveparserController = angular.module('askdubeApp');

liveparserController.controller('LiveParserController', ['$scope', function($scope) {

  // Initialize ROSLIBJS.

  var ros = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
  });

  ros.on('connection', function() {
    console.log('Connected to websocket server.');
  });

  ros.on('error', function(error) {
    console.log('Error connecting to websocket server: ', error);
  });

  ros.on('close', function() {
    console.log('Connection to websocket server closed.');
  });

  // Calling a service.

  var ParseQuestionClient = new ROSLIB.Service({
    ros : ros,
    name : '/parse_question',
    serviceType : 'sara_uw_website/ParseQuestion'
  });

  $scope.submitQuestion = function() {

    if ($scope.typed_cmd === '') {
      return;
    }

    var request = new ROSLIB.ServiceRequest({
      typed_cmd : $scope.typed_cmd
    });

    ParseQuestionClient.callService(request, function(result) {
      $scope.parsed_cmd = result.parsed_cmd;
      $scope.typed_cmd = '';
    });
  };
}]);
