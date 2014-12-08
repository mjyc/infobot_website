'use strict';

var homeControllers = angular.module('askdubeApp');

homeControllers.controller('HomeController', ['$scope', '$http',
  function($scope, $http) {
    $http.get('users/current').success(function(data) {
      $scope.user = data;
    });

    var curDate = new Date();
    var deadlineDate = new Date(curDate.getFullYear(), curDate.getMonth(),
        curDate.getDate(), curDate.getHours() + 1, curDate.getMinutes(), 0);
    $scope.audienceOpts = {
      icon: 'fa fa-users',
      name: 'CSE',
    };
    $scope.notificationOpts = {
      icon: 'fa fa-envelope',
      name: 'Email',
    };
    $scope.questionForm = {
      timeissued: curDate,
      typed_cmd: '',
      notification_sms: false,
      notification_email: false,
      is_public: true,
      deadline: deadlineDate,
    };

    $scope.submitQuestion = function() {
      if ($scope.questionForm.question === '') {
        return;
      }
      $http.post('/queryjobs', $scope.questionForm)
        .success(function(data) {
          // TODO: update the feed
          console.log('success!');
        })
        .error(function(data) {
          alert('Oops, something went wrong. Please try refreshing the page.');
        });
    };

    $http.get('queryjobs/list').success(function(data) {
      $scope.queryjobs = data;
    });
  }]);
