// declare module
var dubeapp = angular.module('dubeApp', ['ngRoute']);

// ng-route setting
dubeapp.config(function($routeProvider) {
  $routeProvider
    .when('/home', {
      templateUrl: '/app/views/home.html',
      controller: 'HomeController',
    })
    .when('/landing', {
      templateUrl: '/app/views/landing.html',
    })
    .otherwise({
      templateUrl: '/app/views/wall.html',
      controller: 'WallController',
    })
});
