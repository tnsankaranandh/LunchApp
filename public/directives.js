var lunchApp = angular.module('lunchApp');

lunchApp.directive('scrolly', function ($timeout, $parse) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {

            function applyScroll() {
                $timeout(function () {
                    if ($parse(attrs.scrollDisabled)(scope)) {
                        return;
                    }

                    if (raw.scrollTop + raw.offsetHeight + ($parse(attrs.scrollDistance)(scope) || 0) >= raw.scrollHeight) {
                        scope.$apply($parse(attrs.scrolly)(scope));
                    }
                }, 100);
            };

            scope.$watch(function () {
                return element.parent().prop('clientHeight');
            }, function () {
                if (element.parent().prop('scrollHeight') <= element.parent().prop('clientHeight')) {
                    applyScroll();
                }
            });

            var raw = element.parent()[0];
            element.parent().bind('scroll', function () {
                applyScroll();
            });
        }
    };
});

lunchApp.directive('fullHeight', function ($window, $timeout, $document) {
    return {
        restrict: 'A',
        replace: true,
        scope: {
            fullHeight: '=',
            bottomAdjust: '=?',
            bottomContainerId: '=?',
            isdeactive: '=?',
            thresHoldHeight: '=',
            isDialog: '=?'
        },
        link: function (scope, element, attrs) {

            var fullHeightTimer = null;
            var resizeTimer = null;
            var preventSetHeight = false;

            scope.$on('trickerExpanddirective', function (event, args) {
                checkAndCallSetHeight();
            });

            scope.$watch('fullHeight', function () {
                checkAndCallSetHeight();
            });

            $(window).resize(function () {
                checkAndCallSetHeight();
            });

            function checkAndCallSetHeight() {
                if (fullHeightTimer !== null) {
                    $timeout.cancel(fullHeightTimer);
                }
                fullHeightTimer = $timeout(function () {
                    setHeight(scope.fullHeight);
                }, 1000);
            }

            function setHeight(isCollapse) {
                if (preventSetHeight) {
                    return;
                }
                if (scope.isdeactive) {
                    element.height('')
                    return;
                }
                if (scope.isDialog && !angular.element('md-dialog-content').offset()) {
                    $timeout(function () {
                        setHeight(isCollapse);
                    }, 1000);
                    return;
                }
                var heightToSet = 0;
                var thresholdheight = scope.thresHoldHeight || 150;
                var defaultHeight = 450;
                var dialogDefaultHeight = 200;
                preventSetHeight = true;
                element[0].style.overflow = 'auto';

                var p = element.parent();
                var allParentsPaddingTopAndBottom = 0;
                while (p.length > 0) {
                    var pEle = angular.element(p);
                    if (!pEle) {
                        break;
                    }
                    allParentsPaddingTopAndBottom = allParentsPaddingTopAndBottom + (pEle.innerHeight() - pEle.height());
                    pEle.scrollTop(0);
                    p = p.parent();
                    if (!p) {
                        break;
                    }
                    if (!!scope.isDialog && !!p[0] && !!p[0].tagName && p[0].tagName.toUpperCase() === 'MD-DIALOG-CONTENT') {
                        break;
                    }
                }

                var windowheight = angular.element($window).height();
                var elementTopPos = element.offset().top;
                if (!!scope.isDialog) {
                    windowheight = angular.element('md-dialog-content').height();
                    elementTopPos = elementTopPos - (angular.element('md-dialog-content').offset() || {}).top;
                }

                heightToSet = windowheight - elementTopPos;
                heightToSet = heightToSet - allParentsPaddingTopAndBottom - 5;

                var bottomContainerId = scope.bottomContainerId || attrs.bottomContainerId || null;
                if (!!bottomContainerId) {
                    heightToSet = heightToSet - (angular.element('#' + bottomContainerId).outerHeight() || 0);
                }
                if (!isNaN(scope.bottomAdjust)) {
                    heightToSet = heightToSet - (scope.bottomAdjust || 0);
                }

                heightToSet = heightToSet > thresholdheight && heightToSet || (scope.isDialog && dialogDefaultHeight || defaultHeight);
                element.height(heightToSet);

                $timeout(function () {
                    preventSetHeight = false;
                });
            }
        }
    }
});

lunchApp.factory('fixedTableHeaderUtil', function () {
    var isStyleSheetAdded = false;
    var count = -1;

    var defaultTextColor = 'rgba(0,0,0,0.54)';
    var defaultBGColor = 'white';
    var fixedTableHeaderUtil = {
        getUniqueId: function () {
            count++;
            return 'fth' + count;
        },
        addStyleSheet: function (uId, textColor, bgColor) {
            angular.element('#' + uId + 'StyleSheet').remove();
            angular.element('head').append('' +
                '<style id="' + uId + 'StyleSheet">' +
                '   #' + uId + ' {' +
                '       color: ' + (textColor || defaultTextColor) + ' !important;' +
                '       background: ' + (bgColor || defaultBGColor) + ' !important;' +
                '   }' +
                '   #' + uId + ' * {' +
                '       color: ' + (textColor || defaultTextColor) + ' !important;' +
                '   }' +
                '   #' + uId + ' input {' +
                '       border-color: ' + (textColor || defaultTextColor) + ' !important;' +
                '   }' +
                '</style>');
            if (isStyleSheetAdded) { return; }
            angular.element('head').append('' +
                '<style>' +
                '   .fth-fixed-table {' +
                '       position: fixed;' +
                '       top: 0;' +
                '       left: 0;' +
                '       z-index: 29;' +
                '       overflow: hidden;' +
                '   }' +
                '   .fth-fixed-table table{' +
                '       margin: 0 !important;' +
                '   }' +
                '   .fth-fixed-table thead tr th md-checkbox div[ng-transclude] .md-ink-ripple {' +
                '       display: none;' +
                '   }' +
                '   .fth-fixed-table thead tr th md-checkbox div[ng-transclude] .md-label {' +
                '       margin-left: 0px !important;' +
                '   }' +
                '</style>');
            isStyleSheetAdded = true;
        }
    };
    return fixedTableHeaderUtil;
});
lunchApp.directive('fixedTableHeader', function (fixedTableHeaderUtil, $parse, $timeout, $interval, $window, $rootScope, $compile) {

    function link(scope, element, attributes, controller) {
        var isInTabs = $parse(attributes.isInTabs)(scope);
        var uId = fixedTableHeaderUtil.getUniqueId();
        var alignDebounce = parseInt(attributes.alignDebounce || 200, 10); //Timeout in milliseconds after which the fixed header will be aligned.
        var scrollParentLevel = parseInt(attributes.scrollParentLevel || 2, 10);
        var scrollContainer = element;
        for (var s = 0; s < scrollParentLevel; s++) {
            scrollContainer = scrollContainer.parent();
        }
        scrollContainer.on('scroll', function () {
            angular.element('#' + uId).prop('scrollLeft', scrollContainer.prop('scrollLeft'));
        });
        fixedTableHeaderUtil.addStyleSheet(uId, attributes.textColor, attributes.bgColor);
        var clone = element.clone();
        clone.find('tbody').empty();
        clone.find('tfoot') && clone.find('tfoot').empty();

        var cloneHTML = '<div id="' + uId + '" class="fth-fixed-table"><table ';
        for (var a in attributes.$attr) {
            if (a === 'fixedTableHeader' || a === 'fixedTableFooter' || a === 'id' || a === 'ngTransclude') {
                continue;
            }
            var name = attributes.$attr[a];
            var value = attributes[a];
            cloneHTML = cloneHTML + ' ' + name + '="' + value + '" ';
        }
        cloneHTML = cloneHTML + ' >';
        cloneHTML = cloneHTML + clone.html();
        cloneHTML = cloneHTML + '</table><div>';

        while (cloneHTML.indexOf('ng-transclude') > -1) {
            cloneHTML = cloneHTML.replace('ng-transclude', '');
        }
        clone = $compile(cloneHTML)(scope);
        scrollContainer.append(clone);
        scrollContainer.css('position', 'relative');
        element.find('thead').find('*').off();
        element.find('thead').css('visibility', 'hidden');

        element.on('$destroy', elementRemover);
        scope.$on('$destroy', elementRemover);
        $rootScope.$on('$stateChangeStart', elementRemover);

        function elementRemover() { angular.element('#' + uId).remove(); };

        function isTHAlignmentChanged() {
            var thLeft = 0;
            var THs = angular.element(element.find('thead').find('tr')[0]).find('th');
            for (var th = 0; th < THs.length; th++) {
                var thisTH = angular.element(THs[th]);
                thLeft = thLeft + thisTH.offset().left + thisTH.width();
            };
            return thLeft;
        };
        scope.$watch(function () {
            return element.width() +
                element.height() +
                scrollContainer.prop('scrollLeft') +
                scrollContainer.prop('scrollTop') +
                isTHAlignmentChanged();
        }, alignAfterADebounce, true);

        var previousScrollContainerOffset = scrollContainer.offset();
        $interval(function () {
            var currentScrollContainerOffset = scrollContainer.offset();
            if (currentScrollContainerOffset.top !== previousScrollContainerOffset.top || currentScrollContainerOffset.left !== previousScrollContainerOffset.left) {
                alignAfterADebounce();
            }
            previousScrollContainerOffset = currentScrollContainerOffset;
        });

        var alignTimer = null;

        function alignAfterADebounce() {
            if (!!alignTimer) {
                $timeout.cancel(alignTimer);
                alignTimer = null;
            }
            alignTimer = $timeout(alignCloneEle, alignDebounce);
        };

        alignCloneEle();

        function alignCloneEle() {
            var scrollContainerOffset = scrollContainer.offset();
            if (isInTabs) { scrollContainerOffset = scrollContainer.position(); }
            var originalElePosition = element.position();
            if (originalElePosition.top < 0) { originalElePosition.top = 0; }
            if (originalElePosition.left < 0) { originalElePosition.left = 0; }
            var scrollContainerComputedStyle = $window.getComputedStyle(scrollContainer[0]);
            var scrollContainerMarginTop = parseInt(scrollContainerComputedStyle.getPropertyValue('margin-top').replace('px', ''), 10);
            var scrollContainerMarginLeft = parseInt(scrollContainerComputedStyle.getPropertyValue('margin-left').replace('px', ''), 10);
            var top = scrollContainerOffset.top + originalElePosition.top + scrollContainerMarginTop;
            var left = scrollContainerOffset.left + originalElePosition.left + scrollContainerMarginLeft;
            if (top < 0) { top = 0; }
            if (left < 0) { left = 0; }
            var cloneEle = angular.element('#' + uId);
            cloneEle.css('top', top + 'px');
            cloneEle.css('left', left + 'px');

            var scrollBarWidth = 0;
            if (scrollContainer.prop('scrollHeight') > scrollContainer.prop('clientHeight')) {
                scrollBarWidth = 16; //TODO: remove the hardcoded scroll bar width and set the correct value
            }
            console.log(scrollContainer.outerWidth());
            console.log(scrollBarWidth);
            cloneEle.outerWidth(scrollContainer.outerWidth() - scrollBarWidth);
            /*cloneEle.outerWidth(element.outerWidth());*/

            if (element.find('tbody').find('tr').length === 0) {
                return;
            }

            var cloneTable = cloneEle.find('table');
            var cloneTHead = cloneTable.find('thead');
            var cloneTRs = cloneTHead.find('tr');
            var originalTHead = element.find('thead');
            var originalTRs = originalTHead.find('tr');

            var totalWidth = 0;
            var cloneTRsLength = cloneTRs.length;
            for (var ctr = 0; ctr < cloneTRsLength; ctr++) {
                var cloneTHs = angular.element(cloneTRs[ctr]).find('th');
                var originalTHs = angular.element(originalTRs[ctr]).find('th');
                var originalTHsLength = originalTHs.length;
                totalWidth = 0;
                for (var ot = 0; ot < originalTHsLength; ot++) {
                    var thisColWidth = angular.element(originalTHs[ot]).outerWidth();
                    angular.element(cloneTHs[ot]).outerWidth(thisColWidth);
                    totalWidth = totalWidth + thisColWidth;
                }
                angular.element(cloneTRs[ctr]).outerWidth(totalWidth);
            }
            angular.element(cloneTable).outerWidth(totalWidth);
            angular.element(cloneTable).css('display', 'block');
            angular.element(cloneTHead).outerWidth(totalWidth);
            $timeout(function () { scope.$apply(); });
        };
    };

    return {
        restrict: 'A',
        link: link
        // List of Attributes used.
        // alignDebounce
        // scrollParentLevel
        // textColor
        // bgColor     
    };
});

lunchApp.factory('fixedTableFooterUtil', function () {
    var isStyleSheetAdded = false;
    var count = -1;

    var defaultTextColor = 'rgba(0,0,0,0.54)';
    var defaultBGColor = 'white';
    var fixedTableFooterUtil = {
        getUniqueId: function () {
            count++;
            return 'ftf' + count;
        },
        addStyleSheet: function (uId, textColor, bgColor) {
            angular.element('#' + uId + 'StyleSheet').remove();
            angular.element('head').append('' +
                '<style id="' + uId + 'StyleSheet">' +
                '   #' + uId + ' {' +
                '       color: ' + (textColor || defaultTextColor) + ' !important;' +
                '       background: ' + (bgColor || defaultBGColor) + ' !important;' +
                '   }' +
                '   #' + uId + ' * {' +
                '       color: ' + (textColor || defaultTextColor) + ' !important;' +
                '   }' +
                '   #' + uId + ' input {' +
                '       border-color: ' + (textColor || defaultTextColor) + ' !important;' +
                '   }' +
                '</style>');
            if (isStyleSheetAdded) { return; }
            angular.element('head').append('' +
                '<style>' +
                '   .ftf-fixed-table {' +
                '       position: fixed;' +
                '       left: 0;' +
                '       z-index: 29;' +
                '       overflow: hidden;' +
                '   }' +
                '   .ftf-fixed-table thead tr th md-checkbox div[ng-transclude] .md-ink-ripple {' +
                '       display: none;' +
                '   }' +
                '   .ftf-fixed-table thead tr th md-checkbox div[ng-transclude] .md-label {' +
                '       margin-left: 0px !important;' +
                '   }' +
                '</style>');
            isStyleSheetAdded = true;
        }
    };
    return fixedTableFooterUtil;
});
lunchApp.directive('fixedTableFooter', function (fixedTableFooterUtil, $parse, $timeout, $interval, $window, $rootScope, $compile) {
    var tfCellTag = 'th';

    function link(scope, element, attributes, controller) {
        var isInTabs = $parse(attributes.isInTabs)(scope);
        var uId = fixedTableFooterUtil.getUniqueId();
        var alignDebounce = parseInt(attributes.alignDebounce || 200, 10); //Timeout in milliseconds after which the fixed header will be aligned.
        var scrollParentLevel = parseInt(attributes.scrollParentLevel || 2, 10);
        var scrollContainer = element;
        for (var s = 0; s < scrollParentLevel; s++) {
            scrollContainer = scrollContainer.parent();
        }
        scrollContainer.on('scroll', function () {
            angular.element('#' + uId).prop('scrollLeft', scrollContainer.prop('scrollLeft'));
        });
        fixedTableFooterUtil.addStyleSheet(uId, attributes.ftfTextColor, attributes.ftfBgColor);
        var clone = element.clone();
        clone.find('tbody').empty();
        clone.find('thead') && clone.find('thead').empty();

        var cloneHTML = '<div id="' + uId + '" class="ftf-fixed-table"><table ';
        for (var a in attributes.$attr) {
            if (a === 'fixedTableFooter' || a === 'fixedTableHeader' || a === 'id' || a === 'ngTransclude') {
                continue;
            }
            var name = attributes.$attr[a];
            var value = attributes[a];
            cloneHTML = cloneHTML + ' ' + name + '="' + value + '" ';
        }
        cloneHTML = cloneHTML + ' >';
        cloneHTML = cloneHTML + clone.html();
        cloneHTML = cloneHTML + '</table><div>';

        while (cloneHTML.indexOf('ng-transclude') > -1) {
            cloneHTML = cloneHTML.replace('ng-transclude', '');
        }
        clone = $compile(cloneHTML)(scope);
        scrollContainer.append(clone);
        scrollContainer.css('position', 'relative');
        element.find('tfoot').find('*').off();
        element.find('tfoot').css('visibility', 'hidden');

        element.on('$destroy', elementRemover);
        scope.$on('$destroy', elementRemover);
        $rootScope.$on('$stateChangeStart', elementRemover);

        function elementRemover() { angular.element('#' + uId).remove(); };

        function isTFAlignmentChanged() {
            var tfLeft = 0;
            var TFs = angular.element(element.find('tfoot').find('tr')[0]).find(tfCellTag);
            for (var tf = 0; tf < TFs.length; tf++) {
                var thisTF = angular.element(TFs[tf]);
                tfLeft = tfLeft + thisTF.offset().left + thisTF.width();
            };
            return tfLeft;
        };
        scope.$watch(function () {
            return element.width() +
                element.height() +
                scrollContainer.height() +
                scrollContainer.prop('scrollLeft') +
                scrollContainer.prop('scrollTop') +
                isTFAlignmentChanged();
        }, alignAfterADebounce, true);

        var previousScrollContainerOffset = scrollContainer.offset();
        $interval(function () {
            var currentScrollContainerOffset = scrollContainer.offset();
            if (currentScrollContainerOffset.top !== previousScrollContainerOffset.top || currentScrollContainerOffset.left !== previousScrollContainerOffset.left) {
                alignAfterADebounce();
            }
            previousScrollContainerOffset = currentScrollContainerOffset;
        });

        var alignTimer = null;

        function alignAfterADebounce() {
            if (!!alignTimer) {
                $timeout.cancel(alignTimer);
                alignTimer = null;
            }
            alignTimer = $timeout(alignCloneEle, alignDebounce);
        };

        alignCloneEle();

        function alignCloneEle() {
            var cloneEle = angular.element('#' + uId);
            var cloneTable = cloneEle.find('table');
            var cloneTFoot = cloneTable.find('tfoot');
            var cloneTRs = cloneTFoot.find('tr');
            var originalTFoot = element.find('tfoot');
            var originalTRs = originalTFoot.find('tr');

            var scrollBarHeight = 0;
            if (scrollContainer.prop('scrollWidth') > scrollContainer.prop('clientWidth')) {
                scrollBarHeight = 17; //TODO: remove the hardcoded scroll bar width and set the correct value
            }
            var scrollBarWidth = 0;
            if (scrollContainer.prop('scrollHeight') > scrollContainer.prop('clientHeight')) {
                scrollBarWidth = 16; //TODO: remove the hardcoded scroll bar width and set the correct value
            }

            var scrollContainerOffset = scrollContainer.offset();
            if (isInTabs) { scrollContainerOffset = scrollContainer.position(); }
            var originalElePosition = element.position();
            if (originalElePosition.top < 0) { originalElePosition.top = 0; }
            if (originalElePosition.left < 0) { originalElePosition.left = 0; }
            var scrollContainerComputedStyle = $window.getComputedStyle(scrollContainer[0]);
            var scrollContainerMarginTop = parseInt(scrollContainerComputedStyle.getPropertyValue('margin-top').replace('px', ''), 10);
            var scrollContainerMarginLeft = parseInt(scrollContainerComputedStyle.getPropertyValue('margin-left').replace('px', ''), 10);
            var top = scrollContainerOffset.top + originalElePosition.top + scrollContainerMarginTop;
            var left = scrollContainerOffset.left + originalElePosition.left + scrollContainerMarginLeft;
            if (top < 0) { top = 0; }
            if (left < 0) { left = 0; }
            cloneEle.css('top', (top + scrollContainer.outerHeight() - originalTFoot.outerHeight() + 1 - scrollBarHeight) + 'px');
            cloneEle.css('left', left + 'px');

            cloneEle.outerWidth(scrollContainer.outerWidth() - scrollBarWidth);
            /*cloneEle.outerWidth(element.outerWidth());*/

            if (element.find('tbody').find('tr').length === 0) {
                return;
            }

            var totalWidth = 0;
            var cloneTRsLength = cloneTRs.length;
            for (var ctr = 0; ctr < cloneTRsLength; ctr++) {
                var cloneTFs = angular.element(cloneTRs[ctr]).find(tfCellTag);
                var originalTFs = angular.element(originalTRs[ctr]).find(tfCellTag);
                var originalTFsLength = originalTFs.length;
                totalWidth = 0;
                for (var ot = 0; ot < originalTFsLength; ot++) {
                    var thisColWidth = angular.element(originalTFs[ot]).outerWidth();
                    angular.element(cloneTFs[ot]).outerWidth(thisColWidth);
                    totalWidth = totalWidth + thisColWidth;
                }
                angular.element(cloneTRs[ctr]).outerWidth(totalWidth);
            }
            angular.element(cloneTable).outerWidth(totalWidth);
            angular.element(cloneTable).css('display', 'block');
            angular.element(cloneTFoot).outerWidth(totalWidth);
            $timeout(function () { scope.$apply(); });
        };
    };

    return {
        restrict: 'A',
        link: link
        // List of Attributes used.
        // alignDebounce
        // scrollParentLevel
        // ftfTextColor
        // ftfBgColor            
    };
});