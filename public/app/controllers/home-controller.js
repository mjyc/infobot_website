'use strict';

var homeControllers = angular.module('askdubeApp');

homeControllers.controller('logout', ['$window', function ($window) {
  $window.location.href = '/logout';
}]);

homeControllers.controller('HomeController', ['$scope', '$http',
  function($scope, $http) {
    $http.get('users/current').success(function(data) {
      $scope.user = data;
    });

    $scope.userMenuItems = [
      {
        url: '/profile',
        icon: 'fa fa-user',
        name: 'Profile',
      },
      {
        url: '/signout',
        icon: 'fa fa-sign-out',
        name: 'Sign Out',
      },
    ];

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

    // $scope.setCSE = function() {
    //   $scope.audienceOpts.icon='fa fa-users';
    //   $scope.audienceOpts.name='CSE';
    //   $scope.questionForm.is_public=true;
    // };
    // $scope.setOnlyMe = function() {
    //   $scope.audienceOpts.icon='fa fa-lock';
    //   $scope.audienceOpts.name='Only Me';
    //   $scope.questionForm.is_public=false;
    // };
    // $scope.setCSE = function() {
    //   $scope.audienceOpts.icon='fa fa-users';
    //   $scope.audienceOpts.name='CSE';
    //   $scope.questionForm.is_public=true;
    // };
    // $scope.setCSE = function() {
    //   $scope.audienceOpts.icon='fa fa-users';
    //   $scope.audienceOpts.name='CSE';
    //   $scope.questionForm.is_public=true;
    // };

    $scope.submitQuestion = function() {
      // TODO: also check current "status" of the user's last queryjob
      // TODO: a user can send one queryjob at a time
      // TODO: maybe this can be done from the other side
      if ($scope.questionForm.typed_cmd === '') {
        return;
      }
      // $scope.questionForm.deadline.setFullYear(curDate.getFullYear());
      // $scope.questionForm.deadline.setMonth(curDate.getMonth());
      // $scope.questionForm.deadline.setDate(curDate.getDate());
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
