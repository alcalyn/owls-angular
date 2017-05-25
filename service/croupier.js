/* global angular */

(function (angular) {
    'use strict';

    angular.module('eole.games.owls').factory('croupier', function () {
        var Croupier = function () {
            var that = this;

            /**
             * @param {Object} player
             * @param {Object} owl
             *
             * @returns {Object} Created bet with "player" and "order" keys.
             */
            that.placeBet = function (player, owl) {
                var bet = {
                    player: player,
                    order: owl.bets.length
                };

                owl.bets.push(bet);

                return bet;
            };

            /**
             * @param {Object} player
             * @param {Object} owl
             * @param {Object} bet
             *
             * @returns {Object} Removed bet.
             */
            that.removeBet = function (player, owl, bet) {
                var lastPlacedBet = owl.bets[owl.bets.length - 1];

                if (bet.player.eole_player.id === lastPlacedBet.player.eole_player.id) {
                    return owl.bets.pop();
                }
            };

            /**
             * Place a card on a owl.
             *
             * @param {Object} card
             * @param {Object} owl
             */
            that.placeCard = function (card, owl) {
                owl.deck_card = {
                    card: card
                };
            };

            /**
             * Remove a card from an array of cards from a cardId.
             * Returns an object with:
             *  "filteredCards", new array of cards without cardId,
             *  "removedCard", the full remove card object.
             *
             * @param {Object} deck
             * @param {Object} cardId
             *
             * @returns {Object}
             */
            that.removeCardDeck = function (deck, cardId) {
                var removedCard = deck.filter(that.takeCardFilter(cardId)).pop();
                var filteredCards = deck.filter(that.removeCardFilter(cardId));

                return {
                    filteredCards: filteredCards,
                    removedCard: removedCard
                };
            };

            /**
             * @param {int} id
             *
             * @returns {Function}
             */
            that.takeCardFilter = function (id) {
                return function (card) {
                    return card.id === id;
                };
            };

            /**
             * @param {int} id
             *
             * @returns {Function}
             */
            that.removeCardFilter = function (id) {
                return function (card) {
                    return card.id !== id;
                };
            };
        };

        return new Croupier();
    });
})(angular);
