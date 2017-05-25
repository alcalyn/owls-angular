/* global angular */

(function (angular) {
    'use strict';

    angular.module('eole.games.owls').factory('owlsApi', function (eoleApi, eoleSession, $q) {
        var OwlsApi = function (eoleApi, eoleSession, $q) {
            var that = this;

            /**
             * @param {Integer} eolePartyId
             *
             * @returns {Promise}
             */
            this.getEoleParty = function (eolePartyId) {
                return eoleApi.getParty('owls', eolePartyId);
            };

            /**
             * @param {Integer} eolePartyId
             *
             * @returns {Promise}
             */
            this.getTable = function (eolePartyId) {
                return eoleApi.callGame('owls', 'get', 'parties/' + eolePartyId + '/table');
            };

            /**
             * Get promise of cards of currently logged in player on this party.
             *
             * @param {Integer} eolePartyId
             *
             * @returns {Promise}
             */
            this.getHand = function (eolePartyId) {
                var deferred = $q.defer();

                eoleSession.oauthTokenPromise.then(function (token) {
                    eoleApi.callGame('owls', 'get', 'parties/' + eolePartyId + '/hand', token).then(function (hand) {
                        deferred.resolve(hand);
                    });
                });

                return deferred.promise;
            };

            /**
             * Get promise of bet on owl with the provided color.
             *
             * @param {Integer} eolePartyId
             * @param {Integer} owlColor
             *
             * @returns {Promise}
             */
            this.playBet = function (eolePartyId, owlColor) {
                var deferred = $q.defer();

                eoleSession.oauthTokenPromise.then(function (token) {
                    eoleApi.callGame('owls', 'post', 'parties/' + eolePartyId + '/bet/' + owlColor, token).then(function (bet) {
                        deferred.resolve(bet);
                    }, that.createRejectCallback(deferred));
                });

                return deferred.promise;
            };

            /**
             * Play a card owned by player on a owl.
             *
             * @param {Integer} eolePartyId
             * @param {Integer} cardId
             *
             * @returns {Promise}
             */
            this.playCard = function (eolePartyId, cardId) {
                var deferred = $q.defer();

                eoleSession.oauthTokenPromise.then(function (token) {
                    eoleApi.callGame('owls', 'post', 'parties/' + eolePartyId + '/play/' + cardId, token).then(function (r) {
                        deferred.resolve(r);
                    }, that.createRejectCallback(deferred));
                });

                return deferred.promise;
            };

            /**
             * @param {Object} deferred
             *
             * @returns {Function} Standard promise reject callback.
             */
            this.createRejectCallback = function (deferred) {
                return function (reason) {
                    deferred.reject(reason);
                };
            };
        };

        return new OwlsApi(eoleApi, eoleSession, $q);
    });
})(angular);
