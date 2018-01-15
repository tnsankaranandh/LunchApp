(function () {
    'use strict';

    var modalApp = angular.module('modalApp', []);

    function Directive(CustomModalService) {
        return {
            link: function (scope, element, attrs) {
                // ensure id attribute exists
                if (!attrs.id) {
                    console.error('modal must have an id');
                    return;
                }

                // move element to bottom of page (just before </body>) so it can be displayed above everything else
                element.appendTo('body');

                // add self (this modal instance) to the modal service so it's accessible from controllers
                var modal = {
                    id: attrs.id,
                    open: Open,
                    close: Close
                };
                CustomModalService.Add(modal);

                // remove self from modal service when directive is destroyed
                scope.$on('$destroy', function () {
                    CustomModalService.Remove(attrs.id);
                    element.remove();
                });

                // open modal
                function Open() {
                    element.show();
                    element.find('.modal').show();
                    $('body').addClass('modal-open');
                }

                // close modal
                function Close() {
                    element.hide();
                    element.find('.modal').hide();
                    $('body').removeClass('modal-open');
                }
            }
        };
    }

    function Service() {
        var modals = []; // array of modals on the page
        var service = {};

        service.Add = Add;
        service.Remove = Remove;
        service.Open = Open;
        service.Close = Close;

        return service;

        function Add(modal) {
            // add modal to array of active modals
            modals.push(modal);
        }

        function Remove(id) {
            // remove modal from array of active modals
            var modalToRemove = _.findWhere(modals, { id: id });
            modals = _.without(modals, modalToRemove);
        }

        function Open(id) {
            // open modal specified by id
            var modal = _.findWhere(modals, { id: id });
            modal.open();
        }

        function Close(id) {
            // close modal specified by id
            var modal = _.findWhere(modals, { id: id });
            modal.close();
        }
    }

    modalApp.factory('CustomModalService', Service);
    modalApp.directive('modal', Directive);
})();