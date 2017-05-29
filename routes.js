/* global angular */
/* global window */

(function (angular) {
    'use strict';

    angular.module('eole.games.owls').config(function ($routeProvider, gamePath) {
        $routeProvider.when('/games/owls/parties/:partyId', {
            controller: 'owls.PartyController',
            templateUrl: gamePath+'/views/party.html'
        });
    });
})(angular);
