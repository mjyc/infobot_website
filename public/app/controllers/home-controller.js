'use strict';

var homeControllers = angular.module('askdubeApp');

homeControllers.controller('HomeController', ['$scope', '$http',
  function($scope, $http) {
    $http.get('users/current').success(function(data) {
      $scope.user = data;
    });

    $scope.userMenuItems = [
      {
        'name': 'Profile',
        'icon': 'fa fa-user',
        'link': '/profile'
      }
    ];
    $scope.link = 'http://angularjs.org/';

    Date.prototype.addHours= function(h){
      this.setHours(this.getHours()+h);
      return this;
    };

    $scope.questionForm = {
      question: '',
      audience: 'CSE',
      notification: 'Email',
      // deadline: new Date(1970, 0, 1, 14, 57, 0),
      deadline: new Date(Math.floor(new Date() / 10000) * 10000),
    };
    $scope.submitQuestion = function() {
      console.log('submit got called!');
      console.log($scope.questionForm);
      if (jQuery.isEmptyObject($scope.questionForm) || $scope.questionForm.question === '') {
        return;
      }
      // $http.post('/queryjobs', {}).success(function(data) {
      //   console.log('success!');
      // })
      // .success(function(data) {
      //   if (!data.sucess)
      // });
    };


    $http.get('queryjobs/list').success(function(data) {
      $scope.queryjobs = data;
    });
  }]);

// Replacing a(href="/signout", target="_self") in home.jade
homeControllers.controller('external', ['$window', function ($window) {
  $window.location.href = '/logout';
}]);
