/* global angular */

(function (angular) {
    'use strict';

    angular.module('eole.games.owls').controller('owls.PartyController', function ($scope, $q, $routeParams, $timeout, eoleSession, partyManager, owlsApi, croupier, eoleWs) {
        var partyId = parseInt($routeParams.partyId, 10);

        var eolePartyPromise = null;
        var tablePromise = null;
        var handPromise = null;
        var betPromise = null;

        $scope.eolePlayer = eoleSession.player;
        $scope.eoleParty = null;
        $scope.currentPlayer = null;
        $scope.table = {
            owls: [
                {alive: true},
                {alive: true},
                {alive: true},
                {alive: true},
                {alive: true},
                {alive: true}
            ]
        };
        $scope.hand = [];
        $scope.winners = [];

        $scope.playerPosition = partyManager.getPlayerPosition;

        refreshEoleParty();
        refreshTable();
        listenWebSocket();

        function isPartyActive() {
            if (!$scope.eoleParty) {
                return false;
            }

            return 1 === $scope.eoleParty.state;
        }

        function refreshEoleParty() {
            eolePartyPromise = owlsApi.getEoleParty(partyId);

            eolePartyPromise.then(function (eoleParty) {
                $scope.eoleParty = eoleParty;

                if (isPartyActive()) {
                    refreshHand();
                }

                if (2 === eoleParty.state) {
                    displayWinner();
                }
            });
        }

        $scope.isMyTurn = function (playerTurn) {
            if (null === $scope.eoleParty) {
                return false;
            }

            if ('undefined' === typeof playerTurn) {
                playerTurn = $scope.table.player_turn;
            }

            return playerTurn === partyManager.getPlayerPosition($scope.eoleParty);
        };

        $scope.timeToBet = function () {
            return false === $scope.table.turn_phase;
        };

        $scope.timeToPlayCard = function () {
            return true === $scope.table.turn_phase;
        };

        $scope.canIBet = function (owl) {
            return isPartyActive() && $scope.isMyTurn() && $scope.timeToBet() && (!owl || owl.alive);
        };

        $scope.playBet = function (owl) {
            if ($scope.canIBet(owl)) {
                doPlayBet(owl.color);
            }
        };

        $scope.canIPlayCard = function () {
            return isPartyActive() && $scope.isMyTurn() && $scope.timeToPlayCard();
        };

        $scope.playCard = function (card) {
            if ($scope.canIPlayCard()) {
                doPlayCard(card.id);
            }
        };

        function refreshTable() {
            tablePromise = owlsApi.getTable(partyId);

            $q.all([tablePromise, eolePartyPromise]).then(function (results) {
                var table = results[0];
                console.log('table', table);
                $scope.table = table;
                angular.forEach(table.players, function (player) {
                    if (player.eole_player.id === $scope.eolePlayer.id) {
                        $scope.currentPlayer = player;
                    }
                });
            });
        }

        function refreshHand() {
            handPromise = owlsApi.getHand(partyId);

            handPromise.then(function (hand) {
                console.log('hand', hand);
                $scope.hand = hand.cards;
            });
        }

        function doPlayBet(owlColor) {
            var player = $scope.currentPlayer;
            var owl = $scope.table.owls[owlColor];
            var bet = croupier.placeBet(player, owl);
            $scope.table.turn_phase = true;

            betPromise = owlsApi.playBet(partyId, owlColor).catch(function () {
                croupier.removeBet(player, owl, bet);
                $scope.table.turn_phase = false;
            });
        }

        function doPlayCard(cardId) {
            var result = croupier.removeCardDeck($scope.hand, cardId);
            var card = result.removedCard;
            var owl = $scope.table.owls[card.color];
            $scope.hand = result.filteredCards;
            croupier.placeCard(card, owl);
            $scope.table.turn_phase = false;
            changePlayer(+1);

            function revert() {
                $scope.hand.push(card);
                $scope.table.turn_phase = true;
                changePlayer(-1);
            }

            betPromise.then(function () {
                owlsApi.playCard(partyId, cardId)
                    .then(function (r) {
                        if (r.new_card) {
                            $scope.hand.push(r.new_card);
                        }
                    })
                    .catch(revert)
                ;
            }).catch(revert);
        }

        function changePlayer(n) {
            $scope.table.player_turn += n;
            $scope.table.player_turn %= 3;

            if ($scope.table.player_turn < 0) {
                $scope.table.player_turn += 3;
            }
        }

        $scope.$on('slot_join', updateEolePartyFromEvent);
        $scope.$on('party_started', refreshHand);
        $scope.$on('party_started', refreshEoleParty);
        $scope.$on('play_bet', updateFromPlayBetEvent);
        $scope.$on('play_card', updateFromPlayCardEvent);
        $scope.$on('play_bet', incrementScoreFromBetEvent);
        $scope.$on('owl_eliminated', delayedCallback(refreshHand, 3000));
        $scope.$on('owl_eliminated', delayedCallback(refreshEoleParty, 3000));
        $scope.$on('party_ended', refreshEoleParty);
        $scope.$on('party_ended', displayWinner);

        function updateEolePartyFromEvent(event, args) {
            $scope.eoleParty = args.event.party;
        }

        function updateFromEvent(event, args) {
            $scope.table = args.party;
        }

        function updateFromPlayBetEvent(event, args) {
            if ($scope.isMyTurn(args.party.player_turn)) {
                return;
            }

            $scope.table = args.party;
        }

        function updateFromPlayCardEvent(event, args) {
            console.log(args.has_elimination, args.deck_card.card.color, $scope.table.owls[args.deck_card.card.color].deck_card, args.deck_card);

            if (args.has_elimination) {
                $scope.table.owls[args.deck_card.card.color].deck_card = args.deck_card;
                delayedCallback(updateFromEvent, 3000)(event, args);
            } else {
                updateFromEvent(event, args);
            }
        }

        function incrementScoreFromBetEvent(event, args) {
            angular.forEach($scope.eoleParty.slots, function (slot) {
                if (slot.player.id === args.bet.player.eole_player.id) {
                    slot.score++;
                }
            });
        }

        function displayWinner() {
            var winnersSlots = [];
            $scope.winners = [];

            angular.forEach($scope.eoleParty.slots, function (slot) {
                if (0 === winnersSlots.length) {
                    winnersSlots.push(slot);
                    return;
                }

                if (slot.score > winnersSlots[0].score) {
                    winnersSlots = [slot];
                } else if (slot.score === winnersSlots[0].score) {
                    winnersSlots.push(slot);
                }
            });

            angular.forEach(winnersSlots, function (slot) {
                $scope.winners.push(slot.id);
            });
        }

        function delayedCallback(callback, milliseconds) {
            return function (event, args) {
                $timeout(function () {
                    callback(event, args);
                }, milliseconds);
            };
        }

        function listenWebSocket() {
            eoleWs.socketPromise.then(function (socket) {
                socket.subscribe('eole/games/owls/parties/' + partyId, function (topic, event) {
                    console.log('owls event dispatch', event.type, event);

                    $scope.$emit(event.type, event);
                    $scope.$apply();
                });

                socket.subscribe('eole/core/game/owls/parties', function (topic, event) {
                    console.log('eole party event dispatch', event.type, event);

                    if (event.event && (event.event.party.id === partyId)) {
                        $scope.$emit(event.type, event);
                        $scope.$apply();
                    }
                });
            });
        }
    });
})(angular);
