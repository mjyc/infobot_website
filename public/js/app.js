'use strict';

// Declare module.
var askdubeApp = angular.module('askdubeApp', [
  'ngRoute',
  'ui.bootstrap',
  'infinite-scroll',
  'askdubeFilters',
]);

// logout controller.
askdubeApp.controller('logout', ['$window', function($window) {
  $window.location.href = '/logout';
}]);

// ng-route setting.
askdubeApp.config(['$routeProvider',
  function($routeProvider, $locationProvider) {

    $routeProvider
      .when('/home', {
        templateUrl: '/partials/home',
        controller: 'HomeController',
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
