'use strict';

// declare module
var askdubeApp = angular.module('askdubeApp', ['ngRoute']);

// ng-route setting
askdubeApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
      .when('/home', {
        templateUrl: '/partials/home',
        controller: 'HomeController',
      })
      .when('/wall', {
        templateUrl: '/partials/wall',
        controller: 'WallController',
      })
      .otherwise({
        // templateUrl: '/partials/wall.jade',
        // controller: 'WallController',
        redirectTo: '/home'
      });
  }]);
