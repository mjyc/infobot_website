'use strict';

// Declare module.
var askdubeApp = angular.module('askdubeApp', ['ngRoute', 'ui.bootstrap', 'infinite-scroll']);

// Simple controller.
askdubeApp.controller('logout', ['$window', function($window) {
  $window.location.href = '/logout';
}]);

// ng-route setting.
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
        controller: 'ProfileController',
      })
      .when('/liveparser', {
        templateUrl: '/partials/liveparser',
        controller: 'LiveParserController',
      })
      .when('/signout', {
        templateUrl: '/logout',
        controller: 'logout',
      })
      .otherwise({
        redirectTo: '/home'
      });
  }]);
