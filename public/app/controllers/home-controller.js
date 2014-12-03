'use strict';

angular.module('askdubeApp').controller('HomeController', ['$scope', '$http',
  function($scope, $http) {
    $http.get('queryjobs/list').success(function(data) {
      $scope.queryjobs = data;
      // console.log(data);
    });
  }]);


// phonecatControllers.controller('PhoneListCtrl', ['$scope', '$http',
//   function($scope, $http) {
//     $http.get('phones/phones.json').success(function(data) {
//       $scope.phones = data;
//     });

// phonecatControllers.controller('PhoneListCtrl', ['$scope', 'Phone',
//   function($scope, Phone) {
//     $scope.phones = Phone.query();
//      $scope.orderProp = 'age';
//    }]);
