var app = angular.module('lunchApp', ['ui.router', 'modalApp']);

app.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider
        .state('userMaster', {
            url: '/userMaster',
            params: {},
            templateUrl: 'userMaster/userMaster.html',
            controller: 'UserMasterController',
            controllerAs: 'vm'
        }).state('hotelMaster', {
            url: '/hotelMaster',
            params: {},
            templateUrl: 'hotelMaster/hotelMaster.html',
            controller: 'HotelMasterController',
            controllerAs: 'vm'
        }).state('itemMaster', {
            url: '/itemMaster',
            params: {},
            templateUrl: 'itemMaster/itemMaster.html',
            controller: 'ItemMasterController',
            controllerAs: 'vm'
        }).state('eatHistory', {
            url: '/eatHistory',
            params: {},
            templateUrl: 'eatHistory/eatHistory.html',
            controller: 'EatHistoryController',
            controllerAs: 'vm'
        }).state('payment', {
            url: '/payment',
            params: {},
            templateUrl: 'payment/payment.html',
            controller: 'PaymentController',
            controllerAs: 'vm'
        });

    $urlRouterProvider.otherwise('/userMaster');
});

app.controller('InitController', function ($scope, $state) {
    $scope.goToState = function (state) { $state.go(state); };
});