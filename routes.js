/* global angular */
/* global window */

(function (angular, relativePath) {
    'use strict';

    var viewsPath = relativePath('/views');

    angular.module('eole.games.owls').config(function ($routeProvider) {
        $routeProvider.when('/games/owls/parties/:partyId', {
            controller: 'owls.PartyController',
            templateUrl: viewsPath + '/party.html'
        });
    });
})(angular, window.relativePath);
