var app = angular.module('lunchApp');

app.controller('EatHistoryController', function ($http, $q, $timeout, CustomModalService) {
    var vm = this;
    var page = 1;
    var limit = 50;
    var defaultEditingEHTItem = {
        itemUid: { _id: '', name: '' },
        quantity: null
    };
    vm.isQuerying = false;
    vm.hasMoreData = true;

    function updateList() {
        if (page === 1) {
            vm.eatHistories = [];
        }
        vm.isQuerying = true;
        $http
            .post('/eatHistory/getList', {
                limit: limit,
                page: page
            })
            .then(function (successResponse) {
                vm.isQuerying = false;
                var currentData = !!successResponse && !!successResponse.data && !!successResponse.data.eatHistories && successResponse.data.eatHistories || []
                vm.eatHistories = vm.eatHistories.concat(currentData);
                vm.hasMoreData = currentData.length === limit;
            }, function (errorResponse) {
                vm.isQuerying = false;
                console.log(errorResponse);
                alert('Error while getting Eat Histories.');
            });
    };
    updateList();

    vm.loadNextPage = function () {
        page++;
        updateList();
    };

    vm.addEatHistory = function () {
        vm.openEHDetail();
    };

    vm.editEatHistory = function (ehId) {
        vm.openEHDetail(ehId);
    };

    vm.openEHDetail = function (ehId) {
        function modalOpener(eht) {
            vm.editingEHT = eht || {};
            vm.editingEHT.eatDate = vm.editingEHT.eatDate && new Date(vm.editingEHT.eatDate) || new Date();
            CustomModalService.Open('ehDetailModal');
        };
        if (!!ehId) {
            $http
                .post('/eatHistory/getList', { _id: ehId })
                .then(function (successResponse) {
                    modalOpener(!!successResponse && !!successResponse.data && !!successResponse.data.eatHistories && successResponse.data.eatHistories[0] || {});
                }, function (errorResponse) {
                    console.log(errorResponse);
                    alert('Error while getting Eat History detail.');
                });
        } else {
            modalOpener({
                items: [angular.copy(defaultEditingEHTItem)]
            });
        }
    };

    vm.getTotalAmount = function (items) {
        var totalAmount = 0;
        (items || []).forEach(function (i) {
            totalAmount = totalAmount + ((i.itemUid && i.itemUid.rate || 0) * (i.quantity || 0));
        });
        return totalAmount;
    };

    vm.addEditingEHTItem = function () {
        vm.editingEHT = vm.editingEHT || {};
        vm.editingEHT.items = vm.editingEHT.items || [];
        vm.editingEHT.items.push(angular.copy(defaultEditingEHTItem));
        reRenderEditingEHTItems();
    };

    vm.removeEditingEHTItem = function (index) {
        vm.editingEHT.items.splice(index, 1);
        reRenderEditingEHTItems();
    };

    function reRenderEditingEHTItems() {
        var temp = angular.copy(vm.editingEHT.items);
        vm.editingEHT.items = [];
        $timeout(function () {
            vm.editingEHT.items = angular.copy(temp);
        });
    };

    vm.closeDetailModal = function () {
        CustomModalService.Close('ehDetailModal');
    };

    vm.enableTypeAhead = function (elementId, url, responseModel, modelToBindOnSelect, isItemTypeAhead, itemTypeAheadIndex) {
        $timeout(function () {
            $('#' + elementId).typeahead({
                source: function (query, process) {
                    var queryObj = {
                        name: query
                    };
                    if (!!isItemTypeAhead) {
                        queryObj.hotelUid = vm.editingEHT.hotelUid._id;
                    }
                    $http
                        .post(url, queryObj)
                        .then(function (successResponse) {
                            process(!!successResponse && !!successResponse.data && successResponse.data[responseModel] || []);
                        }, function (errorResponse) {
                            console.log(errorResponse);
                            alert('Error while searching');
                        });
                },
                afterSelect: function (selectedModel) {
                    $timeout(function () {
                        if (!isItemTypeAhead) {
                            vm.editingEHT[modelToBindOnSelect] = selectedModel;
                            vm.editingEHT.items = [angular.copy(defaultEditingEHTItem)];
                        } else {
                            vm.editingEHT.items[itemTypeAheadIndex].itemUid = selectedModel;
                        }
                    });
                }
            });
        });
    };

    vm.saveEditingEHT = function () {
        var itemsLength = vm.editingEHT.items.length;
        for (var i = 0; i < itemsLength;) {
            var thisItem = vm.editingEHT.items[i];
            if (!thisItem.itemUid || (!!thisItem.itemUid && !thisItem.itemUid._id) || !thisItem.quantity) {
                vm.editingEHT.items.splice(i, 1);
                itemsLength = vm.editingEHT.items.length;
            } else {
                i++;
            }
        }
        if (!vm.editingEHT.items.length) {
            return;
        }
        var url = '/eatHistory/create';
        if (!!vm.editingEHT._id) { url = '/eatHistory/update'; }
        var savingEHT = angular.copy(vm.editingEHT);
        savingEHT.eatUserUid = savingEHT.eatUserUid._id;
        savingEHT.hotelUid = savingEHT.hotelUid._id;
        savingEHT.paidByUserUid = savingEHT.paidByUserUid._id;
        savingEHT.totalAmount = vm.getTotalAmount(savingEHT.items);
        (savingEHT.items || []).forEach(function (sEHTItem) {
            sEHTItem.amount = (sEHTItem.itemUid.rate || 0) * (sEHTItem.quantity || 0);
            sEHTItem.itemUid = sEHTItem.itemUid._id;
        });
        $http
            .post(url, savingEHT)
            .then(function (successResponse) {
                savingEHT._id = successResponse.data.uid;
                vm.closeDetailModal();
                page = 1;
                updateList();
            }, function (errorResponse) {
                console.log(errorResponse);
                alert('Error while saving Item.');
            });
    };
});