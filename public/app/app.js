'use strict';

// declare module
var askdubeApp = angular.module('askdubeApp', ['ngRoute', 'ui.bootstrap']);

// ng-route setting
askdubeApp.config(['$routeProvider', '$locationProvider',
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
      .when('/home', {
        templateUrl: '/partials/home',
        controller: 'HomeController',
      })
      .when('/profile', {
        templateUrl: '/partials/profile',
        controller: 'WallController',
      })
      .when('/logout', {
        templateUrl: '/logout',
      })
      .otherwise({
        redirectTo: '/home'
      });
  }]);
